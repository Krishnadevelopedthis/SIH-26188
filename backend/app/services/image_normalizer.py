from io import BytesIO

from PIL import Image, ImageOps


# PaddleOCR's detector does not shrink large inputs, so a phone photo of a
# passport (~4000px) needs about three times the memory of a 1000px scan and
# the container is killed mid-request. 2000px still leaves a full-width MRZ
# line at roughly 40px per character, well above what OCR needs.
MAX_IMAGE_SIDE = 2000

EXIF_ORIENTATION = 0x0112


class UnreadableImageError(ValueError):
    pass


def normalize_upload(data: bytes, suffix: str) -> tuple[bytes, str]:
    """
    Bound an uploaded image's size and turn it upright.

    Images already small and upright are returned untouched, so scans the
    pipeline handles today are scored on exactly the same pixels.
    """
    try:
        image = Image.open(BytesIO(data))
        orientation = image.getexif().get(EXIF_ORIENTATION, 1)

        if max(image.size) <= MAX_IMAGE_SIDE and orientation == 1:
            return data, suffix

        # Let the JPEG decoder skip detail we are about to throw away, so the
        # full-resolution bitmap never has to exist in memory.
        scale = MAX_IMAGE_SIDE / max(image.size)
        image.draft(
            "RGB",
            (int(image.width * scale), int(image.height * scale)),
        )

        # Phones store the sensor's pixels and record the rotation in EXIF.
        # Re-encoding drops that tag, so apply it now or the page goes sideways.
        image = ImageOps.exif_transpose(image).convert("RGB")
        image.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE), Image.LANCZOS)

    except (OSError, Image.DecompressionBombError) as exc:
        raise UnreadableImageError(
            "The uploaded file could not be read as an image."
        ) from exc

    # PNG so the downscaled pixels are not recompressed a second time.
    output = BytesIO()
    image.save(output, format="PNG")

    return output.getvalue(), ".png"
