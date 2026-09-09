from __future__ import annotations

import csv
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter


PROJECT_ROOT = Path(__file__).resolve().parents[3]

OUTPUT_DIR = PROJECT_ROOT / "data" / "samples"
MANIFEST_PATH = PROJECT_ROOT / "data" / "processed" / "dataset_manifest.csv"

SEED = 42

IMAGE_WIDTH = 1200
IMAGE_HEIGHT = 760


# Layout of the page create_document() draws.
#
# The tampering operations read these rather than carrying pixel boxes of their
# own. A hard-coded box is silently wrong the moment the page is drawn at
# another size or the rows move, and a manipulation that lands on margin
# produces a sample labelled "tampered" that is identical to a genuine one.
PORTRAIT_X = 60
PORTRAIT_Y = 155

INFO_X = 370
INFO_Y = 165
LINE_GAP = 62
VALUE_OFFSET = 230
VALUE_WIDTH = 280
VALUE_HEIGHT = 34

FIELD_ROWS = {
    "name": 0,
    "date_of_birth": 1,
    "nationality": 2,
    "document_number": 3,
    "date_of_expiry": 4,
}


def field_value_box(field: str) -> tuple[int, int, int, int]:
    """Pixel box of one field's printed value on a create_document() page."""
    left = INFO_X + VALUE_OFFSET
    top = INFO_Y + FIELD_ROWS[field] * LINE_GAP

    return (
        left,
        top,
        left + VALUE_WIDTH,
        top + VALUE_HEIGHT,
    )


FIRST_NAMES = [
    "JOHN",
    "ALEX",
    "SAM",
    "DAVID",
    "MICHAEL",
    "ROBERT",
    "DANIEL",
    "JAMES",
]

LAST_NAMES = [
    "SAMPLE",
    "MORGAN",
    "TAYLOR",
    "WILSON",
    "MILLER",
    "BROWN",
    "DAVIS",
    "ANDERSON",
]


def get_font(size: int, bold: bool = False):
    candidates = []

    if bold:
        candidates.extend(
            [
                "C:/Windows/Fonts/arialbd.ttf",
                "C:/Windows/Fonts/calibrib.ttf",
                "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            ]
        )
    else:
        candidates.extend(
            [
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/calibri.ttf",
                "/System/Library/Fonts/Supplemental/Arial.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            ]
        )

    for path in candidates:
        font_path = Path(path)

        if font_path.exists():
            return ImageFont.truetype(str(font_path), size)

    return ImageFont.load_default()


def create_portrait(
    rng: random.Random,
    width: int = 260,
    height: int = 320,
) -> Image.Image:
    image = Image.new("RGB", (width, height), (220, 220, 220))
    draw = ImageDraw.Draw(image)

    center_x = width // 2

    # Head
    skin = (
        rng.randint(150, 220),
        rng.randint(100, 180),
        rng.randint(70, 150),
    )

    draw.ellipse(
        (
            center_x - 70,
            55,
            center_x + 70,
            195,
        ),
        fill=skin,
    )

    # Hair
    draw.arc(
        (
            center_x - 75,
            35,
            center_x + 75,
            125,
        ),
        start=180,
        end=360,
        fill=(45, 35, 30),
        width=20,
    )

    # Eyes
    draw.ellipse(
        (
            center_x - 40,
            110,
            center_x - 25,
            125,
        ),
        fill=(20, 20, 20),
    )

    draw.ellipse(
        (
            center_x + 25,
            110,
            center_x + 40,
            125,
        ),
        fill=(20, 20, 20),
    )

    # Nose
    draw.line(
        (
            center_x,
            125,
            center_x - 8,
            155,
            center_x + 5,
            155,
        ),
        fill=(100, 70, 55),
        width=4,
    )

    # Mouth
    draw.arc(
        (
            center_x - 35,
            145,
            center_x + 35,
            180,
        ),
        start=10,
        end=170,
        fill=(100, 40, 40),
        width=4,
    )

    # Body / shirt
    draw.rectangle(
        (
            center_x - 110,
            195,
            center_x + 110,
            height,
        ),
        fill=(80, 100, 130),
    )

    return image


def create_document(
    rng: random.Random,
    document_id: str,
) -> tuple[Image.Image, dict]:
    image = Image.new(
        "RGB",
        (IMAGE_WIDTH, IMAGE_HEIGHT),
        (235, 235, 230),
    )

    draw = ImageDraw.Draw(image)

    title_font = get_font(34, bold=True)
    heading_font = get_font(24, bold=True)
    body_font = get_font(24)
    small_font = get_font(20)

    first_name = rng.choice(FIRST_NAMES)
    last_name = rng.choice(LAST_NAMES)

    name = f"{first_name} {last_name}"

    passport_number = f"DEM{rng.randint(100000, 999999)}"

    dob_year = rng.randint(1980, 2005)
    dob_month = rng.randint(1, 12)
    dob_day = rng.randint(1, 28)

    expiry_year = rng.randint(2028, 2035)
    expiry_month = rng.randint(1, 12)
    expiry_day = rng.randint(1, 28)

    dob = f"{dob_year:04d}-{dob_month:02d}-{dob_day:02d}"
    expiry = (
        f"{expiry_year:04d}-"
        f"{expiry_month:02d}-"
        f"{expiry_day:02d}"
    )

    draw.rectangle(
        (20, 20, IMAGE_WIDTH - 20, IMAGE_HEIGHT - 20),
        outline=(50, 50, 50),
        width=4,
    )

    draw.text(
        (55, 45),
        "SAMPLE TRAVEL DOCUMENT",
        font=title_font,
        fill=(20, 20, 20),
    )

    draw.text(
        (55, 92),
        "TRAINING / DEMO ONLY — NOT A GOVERNMENT DOCUMENT",
        font=small_font,
        fill=(150, 30, 30),
    )

    portrait = create_portrait(rng)

    portrait_x = PORTRAIT_X
    portrait_y = PORTRAIT_Y

    image.paste(portrait, (portrait_x, portrait_y))

    draw.rectangle(
        (
            portrait_x,
            portrait_y,
            portrait_x + portrait.width,
            portrait_y + portrait.height,
        ),
        outline=(40, 40, 40),
        width=3,
    )

    info_x = INFO_X
    info_y = INFO_Y
    line_gap = LINE_GAP

    fields = [
        ("NAME", name),
        ("DATE OF BIRTH", dob),
        ("NATIONALITY", "DEM"),
        ("DOCUMENT NO.", passport_number),
        ("DATE OF EXPIRY", expiry),
    ]

    for index, (label, value) in enumerate(fields):
        y = info_y + index * line_gap

        draw.text(
            (info_x, y),
            f"{label}:",
            font=heading_font,
            fill=(40, 40, 40),
        )

        draw.text(
            (info_x + VALUE_OFFSET, y),
            value,
            font=body_font,
            fill=(20, 20, 20),
        )

    # Clearly fictional MRZ-like training text.
    mrz_y = 515

    mrz_line_1 = (
        f"P<DEM{last_name}<<{first_name}"
        f"<<<<<<<<<<<<<<<<<<<<<<<<<<"
    )

    mrz_line_2 = (
        f"{passport_number}DEM{str(dob_year)[2:]}"
        f"{dob_month:02d}{dob_day:02d}"
        f"0M{str(expiry_year)[2:]}"
        f"{expiry_month:02d}{expiry_day:02d}"
        f"<<<<<<<<<<<<<<"
    )

    draw.rectangle(
        (50, mrz_y - 15, IMAGE_WIDTH - 50, 675),
        outline=(120, 120, 120),
        width=2,
    )

    draw.text(
        (70, mrz_y),
        mrz_line_1,
        font=small_font,
        fill=(15, 15, 15),
    )

    draw.text(
        (70, mrz_y + 50),
        mrz_line_2,
        font=small_font,
        fill=(15, 15, 15),
    )

    metadata = {
        "document_id": document_id,
        "name": name,
        "date_of_birth": dob,
        "passport_number": passport_number,
        "date_of_expiry": expiry,
    }

    return image, metadata


def save_genuine(
    image: Image.Image,
    document_id: str,
) -> Path:
    output_dir = OUTPUT_DIR / "genuine"
    output_dir.mkdir(parents=True, exist_ok=True)

    path = output_dir / f"{document_id}_genuine.png"
    image.save(path)

    return path


def create_text_modification(
    image: Image.Image,
    rng: random.Random,
    box: tuple[int, int, int, int] | None = None,
) -> Image.Image:
    """
    Rewrite a printed field value, leaving its label and the MRZ untouched.

    The date of birth is the target because it carries its own MRZ check
    digit, so the altered page contradicts a part of the MRZ that can be
    trusted. ICAO protects no part of the printed name, so a forged surname
    is not a sample any MRZ cross-check could act on.
    """
    modified = image.copy()

    if box is None:
        box = field_value_box("date_of_birth")

    # Cover the old value in the page's own background colour. A hard-coded
    # grey leaves a patch on a tinted page, which would let a classifier find
    # the manipulation by its patch rather than by its content.
    region = modified.crop(box)

    background = max(
        region.getcolors(region.width * region.height),
        key=lambda entry: entry[0],
    )[1]

    draw = ImageDraw.Draw(modified)

    draw.rectangle(box, fill=background)

    draw.text(
        (box[0], box[1]),
        f"1990-{rng.randint(1, 12):02d}-15",
        font=get_font(
            round((box[3] - box[1]) * 0.72)
        ),
        fill=(20, 20, 20),
    )

    return modified


def create_portrait_substitution(
    image: Image.Image,
    rng: random.Random,
) -> Image.Image:
    modified = image.copy()

    replacement = create_portrait(rng)

    modified.paste(
        replacement,
        (60, 155),
    )

    return modified


def create_copy_paste(
    image: Image.Image,
    source_box: tuple[int, int, int, int] | None = None,
    target_box: tuple[int, int, int, int] | None = None,
) -> Image.Image:
    """
    Copy-move forgery: duplicate one field's value over another field.

    Boxes are passed in by callers working on a differently drawn page; the
    defaults describe the page create_document() produces.
    """
    modified = image.copy()

    if source_box is None:
        source_box = field_value_box("date_of_birth")

    if target_box is None:
        target_box = field_value_box("document_number")

    region = image.crop(source_box)

    modified.paste(
        region,
        (target_box[0], target_box[1]),
    )

    return modified


def create_region_manipulation(
    image: Image.Image,
    box: tuple[int, int, int, int] | None = None,
) -> Image.Image:
    """
    Smudge one printed field, as if it had been chemically lifted.

    The previous box sat at x=820..1080, past the right edge of every value on
    the page, so this blurred blank paper and saved a document identical to the
    genuine one under a "tampered" label.
    """
    modified = image.copy()

    if box is None:
        box = field_value_box("name")

    region = modified.crop(box).filter(
        ImageFilter.GaussianBlur(radius=4)
    )

    modified.paste(region, (box[0], box[1]))

    return modified


def generate_dataset(
    num_documents: int = 10,
) -> None:
    rng = random.Random(SEED)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)

    rows = []

    for index in range(1, num_documents + 1):
        document_id = f"doc_{index:04d}"

        image, _ = create_document(
            rng,
            document_id,
        )

        genuine_path = save_genuine(
            image,
            document_id,
        )

        rows.append(
            {
                "image_path": str(
                    genuine_path.relative_to(PROJECT_ROOT)
                ),
                "label": 0,
                "tampering_type": "none",
                "document_id": document_id,
                "split": "train",
            }
        )

        tampering_operations = {
            "text_modification": create_text_modification,
            "portrait_substitution": create_portrait_substitution,
            "copy_paste": create_copy_paste,
            "region_manipulation": create_region_manipulation,
        }

        for tampering_type, operation in tampering_operations.items():
            if tampering_type == "copy_paste":
                tampered = operation(image)
            elif tampering_type == "region_manipulation":
                tampered = operation(image)
            else:
                tampered = operation(image, rng)

            output_dir = (
                OUTPUT_DIR
                / "tampered"
                / tampering_type
            )

            output_dir.mkdir(
                parents=True,
                exist_ok=True,
            )

            output_path = (
                output_dir
                / f"{document_id}_{tampering_type}.png"
            )

            if tampered.tobytes() == image.tobytes():
                raise ValueError(
                    f"Tampering operation '{tampering_type}' left "
                    f"{document_id} unchanged. The manipulation region "
                    f"does not overlap any page content."
                )

            tampered.save(output_path)

            rows.append(
                {
                    "image_path": str(
                        output_path.relative_to(PROJECT_ROOT)
                    ),
                    "label": 1,
                    "tampering_type": tampering_type,
                    "document_id": document_id,
                    "split": "train",
                }
            )

    with MANIFEST_PATH.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as file:
        writer = csv.DictWriter(
            file,
            fieldnames=[
                "image_path",
                "label",
                "tampering_type",
                "document_id",
                "split",
            ],
        )

        writer.writeheader()
        writer.writerows(rows)

    print(
        f"Generated {len(rows)} samples."
    )
    print(
        f"Manifest: {MANIFEST_PATH}"
    )


if __name__ == "__main__":
    generate_dataset(num_documents=10)