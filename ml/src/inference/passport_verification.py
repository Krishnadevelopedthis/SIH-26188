from time import perf_counter
import re

from ml.src.inference.ocr_service import extract_passport_ocr
from ml.src.inference.mrz_validator import validate_passport_mrz


# Common passport/document number pattern.
PASSPORT_NUMBER_PATTERN = re.compile(
    r"\b[A-Z][A-Z0-9]{6,9}\b"
)

# Date formats commonly returned by OCR.
DATE_PATTERN = re.compile(
    r"\b(?:"
    r"\d{2}[/-]\d{2}[/-]\d{4}"
    r"|"
    r"\d{4}[/-]\d{2}[/-]\d{2}"
    r")\b"
)

def _extract_mrz_name(line1: str | None) -> str | None:
    if not line1 or len(line1) < 6:
        return None

    # TD3 passport MRZ:
    # P<ISSUER<SURNAME<<GIVEN<NAMES<<<<<<<<
    name_part = line1[5:]

    if "<<" not in name_part:
        return None

    surname, given_names = name_part.split("<<", 1)

    surname = surname.replace("<", " ").strip()
    given_names = given_names.replace("<", " ").strip()

    if not surname and not given_names:
        return None

    if surname and given_names:
        return f"{given_names} {surname}"

    return given_names or surname


def _extract_mrz_issuer(line1: str | None) -> str | None:
    if not line1 or len(line1) < 5:
        return None

    # TD3: P< + 3-character issuing state
    issuer = line1[2:5].replace("<", "").strip()

    return issuer if issuer else None


def _clean_text(text: str) -> str:
    """Normalize OCR text for simple field extraction."""
    return " ".join(str(text).strip().split())


def _extract_ocr_field(texts: list[str], labels: list[str]) -> str | None:
    """
    Find a value appearing after a known OCR label.

    Example:
        'Passport No. D4227133'
        -> 'D4227133'
    """
    for text in texts:
        cleaned = _clean_text(text)

        for label in labels:
            pattern = rf"{re.escape(label)}\s*[:\-]?\s*(.+)$"
            match = re.search(pattern, cleaned, re.IGNORECASE)

            if match:
                value = match.group(1).strip()

                if value:
                    return value

    return None


def _extract_ocr_passport_number(texts: list[str]) -> str | None:
    """Try to recover a passport number from visible OCR text."""

    # First prefer explicitly labelled fields.
    labelled = _extract_ocr_field(
        texts,
        [
            "Passport No",
            "Passport No.",
            "Passport Number",
            "Document No",
            "Document Number",
            "No.",
        ],
    )

    if labelled:
        match = PASSPORT_NUMBER_PATTERN.search(
            labelled.upper().replace(" ", "")
        )

        if match:
            return match.group(0)

    # Otherwise search OCR lines for a plausible passport number.
    for text in texts:
        cleaned = _clean_text(text).upper()

        for candidate in re.findall(
            r"\b[A-Z0-9]{7,9}\b",
            cleaned,
        ):
            candidate = candidate.replace(" ", "")

            # Avoid treating long all-numeric strings as passport numbers.
            if candidate.isdigit():
                continue

            if PASSPORT_NUMBER_PATTERN.fullmatch(candidate):
                return candidate

    return None


def _extract_ocr_date(
    texts: list[str],
    labels: list[str],
) -> str | None:
    """Extract a date following a visible OCR label."""

    value = _extract_ocr_field(texts, labels)

    if not value:
        return None

    match = DATE_PATTERN.search(value)

    if not match:
        return None

    return match.group(0)


def _extract_ocr_nationality(texts: list[str]) -> str | None:
    """Extract nationality from visible OCR text."""

    value = _extract_ocr_field(
        texts,
        [
            "Nationality",
            "Nationality Code",
        ],
    )

    if value:
        match = re.search(r"\b[A-Z]{3}\b", value.upper())

        if match:
            return match.group(0)

    return None


def _extract_ocr_name(texts: list[str]) -> str | None:
    """
    Try to recover the holder name from common passport labels.

    We only return a value when OCR provides a clear label.
    """

    value = _extract_ocr_field(
        texts,
        [
            "Name",
            "Full Name",
            "Surname",
            "Given Names",
        ],
    )

    if not value:
        return None

    # Remove common OCR punctuation.
    value = re.sub(r"[^A-Za-zÀ-ÿ' -]", "", value).strip()

    if len(value) < 2:
        return None

    return value


# Labels printed in the visual inspection zone, and the field each one
# introduces. These pages set the label above its value, so OCR returns them as
# consecutive lines rather than one "LABEL: VALUE" string.
VIZ_LABELS = {
    "PASSPORTNO": "passport_number",
    "PASSPORTNUMBER": "passport_number",
    "DOCUMENTNO": "passport_number",
    "DOCUMENTNUMBER": "passport_number",
    "SURNAME": "surname",
    "GIVENNAMES": "given_names",
    "GIVENNAME": "given_names",
    "NATIONALITY": "nationality",
    "DATEOFBIRTH": "date_of_birth",
    "DATEOFEXPIRY": "date_of_expiry",
    "DATEOFEXPIRATION": "date_of_expiry",
    "SEX": "sex",
}


def _label_key(text: str) -> str:
    """Reduce an OCR line to letters only, so 'PASSPORT NO.' -> 'PASSPORTNO'."""
    return "".join(
        character
        for character in text.upper()
        if character.isalpha()
    )


# A value has to look like the field it was found under.
#
# OCR returns a page as lines in print order. The demo passport sets each label
# directly above its value, but a real one sets them side by side in two
# columns, and the line following a label is then just as likely to be a
# heading. On an Australian passport the word PASSPORT sits between "Passport
# No." and the number; recorded as the number, it makes an untouched page
# appear to contradict its own MRZ.
#
# So a candidate is checked against the shape its field must have, and the
# search looks a few lines ahead rather than at exactly one.
#
# What is left over then matters. A field printing something that fits no
# passport field at all is noise, and noise is missing evidence rather than a
# contradiction. But a field printing a value shaped like a *different* field -
# a date where the document number belongs - is the signature of content moved
# across the page, which is exactly what a copy-move forgery does. That is
# reported rather than discarded.
VALUE_LOOKAHEAD = 3

# Words printed on travel documents that are never a field's value. Kept to
# document furniture: real surnames must never appear here.
DOCUMENT_VOCABULARY = {
    "PASSPORT",
    "PASSEPORT",
    "PASAPORTE",
    "REISEPASS",
    "SPECIMEN",
    "TYPE",
    "CODE",
    "AUTHORITY",
    "OBSERVATIONS",
}

DOCUMENT_NUMBER_PATTERN = re.compile(r"(?=.*\d)[A-Z0-9]{5,12}")

NATIONALITY_PATTERN = re.compile(r"[A-Z]{3}")

# One to three words. An unbounded run of capitals matches whole lines of
# document furniture, which would then be reported as a moved value.
NAME_PATTERN = re.compile(
    r"[A-Z][A-Z'\-]{1,29}(?:\s[A-Z][A-Z'\-]{1,29}){0,2}"
)

SEX_PATTERN = re.compile(r"[MFX]")

# Numeric dates, and the "04 MAY 1991" form real passports print.
VALUE_DATE_PATTERN = re.compile(
    r"\d{2}[/-]\d{2}[/-]\d{4}"
    r"|\d{4}[/-]\d{2}[/-]\d{2}"
    r"|\d{1,2}\s+[A-Z]{3,9}\s+\d{2,4}"
)

FIELD_PATTERNS = {
    "passport_number": DOCUMENT_NUMBER_PATTERN,
    "nationality": NATIONALITY_PATTERN,
    "surname": NAME_PATTERN,
    "given_names": NAME_PATTERN,
    "sex": SEX_PATTERN,
}


def _fits_field(field: str, value: str) -> bool:
    """Whether a candidate line has the shape this field's value must have."""
    candidate = value.upper().strip()

    if not candidate:
        return False

    if _label_key(candidate) in VIZ_LABELS:
        return False

    if candidate in DOCUMENT_VOCABULARY:
        return False

    if field in ("date_of_birth", "date_of_expiry"):
        return bool(VALUE_DATE_PATTERN.search(candidate))

    pattern = FIELD_PATTERNS.get(field)

    if pattern is None:
        return True

    return bool(
        pattern.fullmatch(
            candidate.replace(" ", "")
            if field != "surname" and field != "given_names"
            else candidate
        )
    )


def _fits_another_field(field: str, value: str) -> bool:
    """Whether a rejected value carries some other field's shape."""
    return any(
        other != field and _fits_field(other, value)
        for other in (*FIELD_PATTERNS, "date_of_birth")
    )


def _extract_viz_fields(
    texts: list[str],
    mrz_lines: list[str],
) -> tuple[dict, dict]:
    """
    Read the values printed in the visual inspection zone.

    Returns the well-formed values, and separately any field printing a value
    that belongs to a different field.

    Only values introduced by a recognised label are returned. Nothing falls
    back to scanning the page, because the fallback in _extract_ocr_fields
    happily recovers a document number from the MRZ itself - which would make
    the printed field agree with the MRZ by construction and defeat the whole
    point of comparing them.
    """
    mrz_set = set(mrz_lines)

    fields: dict[str, str] = {}
    malformed: dict[str, str] = {}

    for index, text in enumerate(texts):

        field = VIZ_LABELS.get(_label_key(text))

        if field is None or field in fields:
            continue

        rejected = None

        # Look ahead past headings, stopping at the next label so a value is
        # never borrowed from the field below.
        for offset in range(1, VALUE_LOOKAHEAD + 1):

            if index + offset >= len(texts):
                break

            candidate = _clean_text(texts[index + offset])

            if not candidate:
                continue

            if candidate.replace(" ", "") in mrz_set:
                continue

            if _label_key(candidate) in VIZ_LABELS:
                break

            if _fits_field(field, candidate):
                fields[field] = candidate
                break

            if rejected is None:
                rejected = candidate

        if (
            field not in fields
            and rejected is not None
            and _fits_another_field(field, rejected)
        ):
            malformed[field] = rejected

    return fields, malformed


def _extract_ocr_fields(texts: list[str]) -> dict:
    """
    Extract visible identity fields from OCR.

    These are fallback values only. They must not override
    validated MRZ values.
    """

    return {
        "passport_number": _extract_ocr_passport_number(texts),
        "name": _extract_ocr_name(texts),
        "nationality": _extract_ocr_nationality(texts),
        "date_of_birth": _extract_ocr_date(
            texts,
            [
                "Date of Birth",
                "Date of birth",
                "DOB",
                "Birth Date",
            ],
        ),
        "date_of_expiry": _extract_ocr_date(
            texts,
            [
                "Date of Expiry",
                "Date of expiry",
                "Expiry Date",
                "Expiration Date",
            ],
        ),
    }


def verify_passport_identity(image_path: str) -> dict:
    """
    Run OCR, extract the passport MRZ, and validate
    the TD3 MRZ check digits.

    If MRZ validation fails, safely use clearly labelled
    OCR fields as a fallback for officer visibility.
    """

    total_start = perf_counter()

    # ---------------------------------------------------------
    # OCR
    # ---------------------------------------------------------
    ocr_start = perf_counter()

    ocr_result = extract_passport_ocr(image_path)

    ocr_time = perf_counter() - ocr_start

    print(
        f"[OCR TIMING] "
        f"extract_passport_ocr={ocr_time:.2f}s"
    )

    texts = ocr_result["texts"]
    mrz_lines = ocr_result["mrz_lines"]

    # ---------------------------------------------------------
    # OCR fallback fields
    # ---------------------------------------------------------
    ocr_fields = _extract_ocr_fields(texts)

    viz_fields, viz_malformed = _extract_viz_fields(texts, mrz_lines)

    # ---------------------------------------------------------
    # MRZ unavailable
    # ---------------------------------------------------------
    if len(mrz_lines) < 2:
        total_time = perf_counter() - total_start

        print(
            "[MRZ TIMING] "
            "validation=SKIPPED | "
            f"TOTAL={total_time:.2f}s"
        )

        return {
            "ocr": {
                "status": "PASS" if texts else "FAIL",
                "texts": texts,
            },

            "mrz_lines": mrz_lines,

            "mrz": {
                "status": "FAIL",
                "valid": False,

                # OCR fallback fields.
                "document_number": ocr_fields["passport_number"],
                "date_of_birth": ocr_fields["date_of_birth"],
                "date_of_expiry": ocr_fields["date_of_expiry"],
                "nationality": ocr_fields["nationality"],
                "sex": None,

                "checks": {
                    "document_number": False,
                    "date_of_birth": False,
                    "date_of_expiry": False,
                    "composite": False,
                },

                "errors": [
                    "Could not extract two MRZ lines."
                ],
            },

            "viz_fields": viz_fields,
            "viz_malformed": viz_malformed,
        }

    # ---------------------------------------------------------
    # MRZ validation
    # ---------------------------------------------------------
    line1 = mrz_lines[0]
    line2 = mrz_lines[1]

    mrz_name = _extract_mrz_name(line1)
    mrz_issuer = _extract_mrz_issuer(line1)

    mrz_start = perf_counter()

    mrz_result = validate_passport_mrz(
        line1,
        line2,
    )

    mrz_time = perf_counter() - mrz_start
    total_time = perf_counter() - total_start

    print(
        f"[MRZ TIMING] "
        f"validation={mrz_time:.4f}s | "
        f"TOTAL={total_time:.2f}s"
    )

    # ---------------------------------------------------------
    # Prefer MRZ values when available.
    # Fall back to OCR when MRZ cannot provide them.
    # ---------------------------------------------------------
    passport_number = (
        mrz_result.document_number
        or ocr_fields["passport_number"]
    )

    date_of_birth = (
        mrz_result.date_of_birth
        or ocr_fields["date_of_birth"]
    )

    date_of_expiry = (
        mrz_result.date_of_expiry
        or ocr_fields["date_of_expiry"]
    )

    nationality = (
        mrz_result.nationality
        or ocr_fields["nationality"]
    )

    return {
        "ocr": {
            "status": "PASS" if texts else "FAIL",
            "texts": texts,
        },

        "mrz_lines": mrz_lines,

        "mrz": {
            "status": "PASS" if mrz_result.valid else "FAIL",
            "valid": mrz_result.valid,

            "document_number": passport_number,
            "date_of_birth": date_of_birth,
            "date_of_expiry": date_of_expiry,
            "nationality": nationality,
            "sex": mrz_result.sex,
            "name": mrz_name,
            "issuing_country": mrz_issuer,

            "checks": {
                "document_number": mrz_result.document_number_valid,
                "date_of_birth": mrz_result.date_of_birth_valid,
                "date_of_expiry": mrz_result.date_of_expiry_valid,
                "composite": mrz_result.composite_valid,
            },

            "errors": mrz_result.errors,
        },

        # Keep OCR fallback information available for debugging
        # and future frontend use.
        "ocr_fields": ocr_fields,

        # Values as printed on the page, for cross-checking against the MRZ.
        "viz_fields": viz_fields,

        # Fields printing a value that belongs to a different field.
        "viz_malformed": viz_malformed,
    }