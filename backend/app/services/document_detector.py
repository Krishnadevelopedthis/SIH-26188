"""
Decide whether an upload is a travel document before screening it.

Everything downstream assumes it is looking at a passport. Without that
assumption tested, a holiday photo is not judged to be "not a passport" - it is
judged to be a passport whose MRZ check digits failed and whose expiry date
could not be read, which scores 92 of 100 and tells an officer a document has
been tampered with when no document was submitted at all.

The evidence is already in hand by the time this runs. A travel document shows
an MRZ, or labelled data fields, or both; an image with neither is not one, and
an image with no legible text at all cannot be judged either way.
"""

from dataclasses import dataclass


@dataclass
class DetectionResult:
    status: str
    reason: str | None

    @property
    def is_document(self) -> bool:
        return self.status == "DOCUMENT"


# Statuses this returns, and what each one asks the officer to do.
DOCUMENT = "DOCUMENT"
UNREADABLE = "UNREADABLE"
NOT_A_DOCUMENT = "NOT_A_DOCUMENT"


def detect_document(
    *,
    texts: list[str],
    mrz_lines: list[str],
    viz_fields: dict,
) -> DetectionResult:
    """
    Report whether the image can be screened as a travel document.

    Two failures are separated because they call for different actions. An
    image with no legible text needs rescanning; an image full of text that
    holds no passport data is the wrong file, and rescanning it will not help.
    """

    if not texts:
        return DetectionResult(
            status=UNREADABLE,
            reason=(
                "No text could be read from this image. Rescan the document "
                "with better focus and lighting."
            ),
        )

    if len(mrz_lines) < 2 and not viz_fields:
        return DetectionResult(
            status=NOT_A_DOCUMENT,
            reason=(
                "This image carries no machine-readable zone and no labelled "
                "passport fields, so it does not appear to be a travel "
                "document. Check that the correct file was submitted."
            ),
        )

    return DetectionResult(
        status=DOCUMENT,
        reason=None,
    )
