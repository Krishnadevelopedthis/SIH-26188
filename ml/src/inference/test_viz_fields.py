from ml.src.inference.passport_verification import _extract_viz_fields


MRZ_LINES = [
    "P<AUSCITIZEN<<JANE<<<<<<<<<<<<<<<<<<<<<<<<<<",
    "RB0992016<3AUS9105043F3206094<<<<<<<<<<<<<<06",
]


def test_label_above_value_layout():
    """How the synthetic demo passport prints: value on the next line."""
    fields, _ = _extract_viz_fields(
        ["PASSPORT NO.", "S8040250", "DATE OF BIRTH", "1980-04-05"],
        [],
    )

    assert fields["passport_number"] == "S8040250"
    assert fields["date_of_birth"] == "1980-04-05"


def test_heading_between_label_and_value_is_stepped_over():
    """
    A real two-column passport puts a heading where the demo puts the value.
    Recording 'PASSPORT' as the number made an untouched page contradict its
    own MRZ and scored it 60/100.
    """
    fields, _ = _extract_viz_fields(
        ["AUSTRALIA", "Passport No.", "PASSPORT", "RB0992016"],
        [],
    )

    assert fields["passport_number"] == "RB0992016"


def test_month_name_dates_are_read():
    fields, _ = _extract_viz_fields(
        ["Date of birth", "04 MAY 1991", "Date of expiry", "09 JUN 2032"],
        [],
    )

    assert fields["date_of_birth"] == "04 MAY 1991"
    assert fields["date_of_expiry"] == "09 JUN 2032"


def test_value_of_the_wrong_shape_is_left_unrecorded():
    """Missing evidence, not a contradiction - so nothing is compared."""
    fields, _ = _extract_viz_fields(
        ["PASSPORT NO.", "ISSUING AUTHORITY OF SOMEWHERE"],
        [],
    )

    assert "passport_number" not in fields


def test_the_search_stops_at_the_next_label():
    """A field never borrows the value belonging to the field below it."""
    fields, _ = _extract_viz_fields(
        ["DATE OF EXPIRY", "SEX", "F"],
        [],
    )

    assert "date_of_expiry" not in fields
    assert fields["sex"] == "F"


def test_mrz_lines_are_never_taken_as_printed_values():
    """
    The printed side must stay independent of the MRZ, or the two agree by
    construction and comparing them proves nothing.
    """
    fields, _ = _extract_viz_fields(
        ["PASSPORT NO.", MRZ_LINES[1], "RB0992016"],
        MRZ_LINES,
    )

    assert fields["passport_number"] == "RB0992016"


def test_a_date_printed_where_the_number_belongs_is_reported():
    """
    The copy-move signature: content moved from another field. There is
    nothing well-formed to compare, so it is returned separately rather than
    dropped as noise.
    """
    fields, malformed = _extract_viz_fields(
        ["PASSPORT NO.", "1980-04-05", "SURNAME", "MOCKLEY"],
        [],
    )

    assert "passport_number" not in fields
    assert malformed["passport_number"] == "1980-04-05"


def test_noise_is_dropped_rather_than_reported():
    """Text fitting no passport field at all is a bad read, not a forgery."""
    fields, malformed = _extract_viz_fields(
        ["PASSPORT NO.", "ISSUING AUTHORITY OF SOMEWHERE"],
        [],
    )

    assert "passport_number" not in fields
    assert malformed == {}
