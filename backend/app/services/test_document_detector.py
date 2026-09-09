from backend.app.services.document_detector import detect_document


MRZ_LINES = [
    "P<SYNMOCKLEY<<ALEX<<<<<<<<<<<<<<<<<<<<<<<<<<",
    "S8040250<5SYN8004059F2711243<<<<<<<<<<<<<<02",
]


def test_passport_with_an_mrz_is_screened():
    result = detect_document(
        texts=["SYN PASSPORT", *MRZ_LINES],
        mrz_lines=MRZ_LINES,
        viz_fields={},
    )

    assert result.is_document


def test_passport_with_labelled_fields_but_no_readable_mrz_is_screened():
    """A worn or cropped MRZ still leaves a document worth screening."""
    result = detect_document(
        texts=["PASSPORT NO.", "S8040250"],
        mrz_lines=[],
        viz_fields={"passport_number": "S8040250"},
    )

    assert result.is_document


def test_photograph_is_not_screened():
    """
    Text with no passport structure is the wrong file. Screening it would
    score it as a passport with failed check digits and an unreadable expiry.
    """
    result = detect_document(
        texts=["HINATA", "SUMMER 2019"],
        mrz_lines=[],
        viz_fields={},
    )

    assert not result.is_document
    assert result.status == "NOT_A_DOCUMENT"
    assert "travel document" in result.reason


def test_image_with_no_legible_text_asks_for_a_rescan():
    result = detect_document(
        texts=[],
        mrz_lines=[],
        viz_fields={},
    )

    assert result.status == "UNREADABLE"
    assert "Rescan" in result.reason


def test_a_single_mrz_line_alone_is_not_enough():
    """One line cannot be validated, and nothing else identifies the page."""
    result = detect_document(
        texts=[MRZ_LINES[0]],
        mrz_lines=[MRZ_LINES[0]],
        viz_fields={},
    )

    assert result.status == "NOT_A_DOCUMENT"
