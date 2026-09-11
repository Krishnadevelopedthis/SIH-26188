from io import BytesIO

import pytest
from PIL import Image

from backend.app.services.image_normalizer import (
    MAX_IMAGE_SIDE,
    UnreadableImageError,
    normalize_upload,
)


def _encode(image: Image.Image, fmt: str, **params) -> bytes:
    buffer = BytesIO()
    image.save(buffer, format=fmt, **params)
    return buffer.getvalue()


def test_small_upright_scan_is_passed_through_untouched():
    """Scans the pipeline already handles must be scored on identical bytes."""
    data = _encode(Image.new("RGB", (1000, 640), "white"), "PNG")

    result, suffix = normalize_upload(data, ".png")

    assert result is data
    assert suffix == ".png"


def test_phone_sized_photo_is_shrunk_with_its_aspect_ratio():
    data = _encode(Image.new("RGB", (4032, 2580), "white"), "JPEG")

    result, suffix = normalize_upload(data, ".jpg")
    image = Image.open(BytesIO(result))

    assert suffix == ".png"
    assert max(image.size) == MAX_IMAGE_SIDE
    assert image.size[0] / image.size[1] == pytest.approx(4032 / 2580, rel=0.01)


def test_sideways_photo_is_turned_upright_before_the_tag_is_lost():
    """Pixels stored rotated, EXIF 6 says rotate 90 clockwise to view."""
    stored = Image.new("RGB", (640, 1000), "white")
    stored.paste((0, 0, 0), (0, 0, 640, 100))  # marks what becomes the right edge
    exif = Image.Exif()
    exif[0x0112] = 6

    result, _ = normalize_upload(_encode(stored, "JPEG", exif=exif), ".jpg")
    image = Image.open(BytesIO(result)).convert("L")

    assert image.size == (1000, 640)
    assert image.getpixel((image.width - 20, image.height // 2)) < 60
    assert image.getpixel((20, image.height // 2)) > 200


def test_bytes_that_are_not_an_image_are_refused():
    with pytest.raises(UnreadableImageError):
        normalize_upload(b"definitely not a jpeg", ".jpg")
