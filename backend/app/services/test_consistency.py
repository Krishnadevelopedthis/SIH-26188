from backend.app.services.consistency import check_consistency


# A document whose four MRZ check digits all validated.
VERIFIED_MRZ = {
    "document_number": "S8040250",
    "date_of_birth": "1980-04-05",
    "date_of_expiry": "2027-11-24",
    "nationality": "SYN",
    "name": "ALEX MOCKLEY",
    "checks": {
        "document_number": True,
        "date_of_birth": True,
        "date_of_expiry": True,
        "composite": True,
    },
}

PRINTED = {
    "passport_number": "S8040250",
    "date_of_birth": "1980-04-05",
    "date_of_expiry": "2027-11-24",
    "nationality": "SYN",
    "surname": "MOCKLEY",
    "given_names": "ALEX",
}


def test_matching_document_passes():
    result = check_consistency(
        mrz=VERIFIED_MRZ,
        viz_fields=PRINTED,
    )

    assert result.status == "PASS"
    assert result.mismatches == []
    assert result.compared == 3


def test_copy_move_forgery_is_caught():
    """The passport number is overwritten with a copy of the birth date."""
    forged = PRINTED | {"passport_number": "1980-04-05"}

    result = check_consistency(
        mrz=VERIFIED_MRZ,
        viz_fields=forged,
    )

    assert result.status == "FAIL"
    assert "Passport number" in result.mismatches[0]


def test_date_formats_are_normalized_before_comparing():
    """A page printing 05/04/1980 does not contradict an MRZ of 1980-04-05."""
    result = check_consistency(
        mrz=VERIFIED_MRZ,
        viz_fields=PRINTED | {"date_of_birth": "05/04/1980"},
    )

    assert result.status == "PASS"


def test_field_without_a_passing_check_digit_is_not_compared():
    """
    An MRZ value the check digits do not vouch for may itself be a misread,
    so it must not be used to accuse the document.
    """
    unverified = VERIFIED_MRZ | {
        "checks": VERIFIED_MRZ["checks"] | {"document_number": False},
    }

    result = check_consistency(
        mrz=unverified,
        viz_fields=PRINTED | {"passport_number": "SOMETHINGELSE"},
    )

    assert result.status == "PASS"
    assert result.compared == 2


def test_nationality_is_never_compared():
    """
    Nationality sits outside every ICAO check digit, so OCR reading UTO as
    UT0 in the MRZ must not fail an untouched document.
    """
    result = check_consistency(
        mrz=VERIFIED_MRZ | {"nationality": "SY1"},
        viz_fields=PRINTED,
    )

    assert result.status == "PASS"


def test_unreadable_page_reports_not_run_rather_than_pass():
    result = check_consistency(
        mrz=VERIFIED_MRZ,
        viz_fields={},
    )

    assert result.status == "NOT_RUN"
    assert result.compared == 0
