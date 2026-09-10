"""
Cross-check the printed fields against the machine-readable zone.

A passport states each fact twice: once in print for a human, once encoded in
the MRZ for a machine. Altering the printed side is easy; altering the MRZ so
its four check digits still validate is not. So when the two disagree, the
document has been changed after issue - a conclusion reached deterministically,
with no model and no training data, and one an officer can be shown directly.

This is what catches a copy-move forgery that the forensic classifier misses:
pasting a date over the passport number leaves the MRZ untouched, so the page
now contradicts itself.

One rule makes the check trustworthy: compare a field only where an ICAO check
digit vouches for the MRZ side of it. The MRZ is itself read by OCR, and OCR
confuses O with 0 in exactly the font the MRZ uses. Nationality sits at
positions 11-13 of line 2 and the name sits in line 1, and neither is covered
by any check digit - so a disagreement there is as likely to be a misread MRZ
as an altered page, and blaming the document would be wrong. The document
number, date of birth and date of expiry each carry their own check digit; when
it validates, the MRZ value is sound, and a printed field that disagrees with
it has been altered.
"""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class ConsistencyResult:
    status: str
    mismatches: list[str]
    compared: int


# Date formats OCR produces for these documents, in the order they are tried.
DATE_FORMATS = (
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%Y/%m/%d",
    # Real passports print the month as a word.
    "%d %b %Y",
    "%d %B %Y",
)


def _normalize_date(value: str | None) -> str | None:
    if not value:
        return None

    value = value.strip()

    for date_format in DATE_FORMATS:
        try:
            return datetime.strptime(
                value,
                date_format,
            ).strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None


def _normalize_code(value: str | None) -> str | None:
    """Reduce a document number or country code to comparable characters."""
    if not value:
        return None

    normalized = "".join(
        character
        for character in value.upper()
        if character.isalnum()
    )

    return normalized or None


# What each field's printed value should look like, for the message shown when
# it holds something else.
FIELD_LABELS = {
    "passport_number": ("Passport number", "document_number"),
    "date_of_birth": ("Date of birth", "date_of_birth"),
    "date_of_expiry": ("Date of expiry", "date_of_expiry"),
}


def check_consistency(
    *,
    mrz: dict,
    viz_fields: dict,
    viz_malformed: dict | None = None,
) -> ConsistencyResult:
    """
    Compare the printed values against the MRZ.

    A field is only compared when both sides supplied it; an unreadable print
    field is missing evidence, not a contradiction, so it never fails the
    document. If nothing could be compared the check reports NOT_RUN rather
    than passing, so an officer is never shown a clearance that rests on no
    comparison at all.
    """

    mismatches: list[str] = []
    compared = 0

    checks = mrz.get("checks", {})
    viz_malformed = viz_malformed or {}

    def compare(label: str, field: str, printed, encoded) -> None:
        nonlocal compared

        # Only trust the MRZ value where its own check digit passed.
        if not checks.get(field):
            return

        if printed is None or encoded is None:
            return

        compared += 1

        if printed != encoded:
            mismatches.append(
                f"{label} printed on the page ({printed}) does not match "
                f"the MRZ ({encoded})."
            )

    compare(
        "Passport number",
        "document_number",
        _normalize_code(viz_fields.get("passport_number")),
        _normalize_code(mrz.get("document_number")),
    )

    compare(
        "Date of birth",
        "date_of_birth",
        _normalize_date(viz_fields.get("date_of_birth")),
        _normalize_date(mrz.get("date_of_birth")),
    )

    compare(
        "Date of expiry",
        "date_of_expiry",
        _normalize_date(viz_fields.get("date_of_expiry")),
        _normalize_date(mrz.get("date_of_expiry")),
    )

    # A field holding a value shaped like a different field is content moved
    # across the page. There is nothing to compare it against, but the MRZ
    # still says what the field should have read.
    for field, (label, check) in FIELD_LABELS.items():

        printed = viz_malformed.get(field)

        if printed is None or not checks.get(check):
            continue

        compared += 1

        mismatches.append(
            f"{label} printed on the page ({printed}) is not a valid "
            f"{label.lower()}; the MRZ reads {mrz.get(check)}."
        )

    if not compared:
        status = "NOT_RUN"
    elif mismatches:
        status = "FAIL"
    else:
        status = "PASS"

    return ConsistencyResult(
        status=status,
        mismatches=mismatches,
        compared=compared,
    )
