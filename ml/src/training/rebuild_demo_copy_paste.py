"""
Rebuild the copy-move samples in the committed demo dataset.

The demo dataset was rendered at 1000x640 by a generator that is not in this
repository, and its fields sit in a single left-hand column rather than the
two-column layout create_document() draws. create_copy_paste() carried a pixel
box for that other layout, which on this page falls in the blank gutter between
the field column and the portrait - so every copy_paste sample was saved
identical to the genuine document it came from, under the opposite label.

The operation now takes its boxes from the caller. The demo layout is measured
below, and the genuine sources are re-tampered through the same code path the
generator uses.
"""

from pathlib import Path

from PIL import Image

from ml.src.training.generate_dataset import create_copy_paste


PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATASET_DIR = PROJECT_ROOT / "data" / "demo_dataset"

SUFFIX = "_copy_paste"

# The demo page's left-hand field column, measured from the rendered images.
# The birth date is duplicated over the passport number: the passport number
# carries an MRZ check digit, so the forged page contradicts a value the MRZ
# can be trusted on.
DEMO_SOURCE_BOX = (36, 400, 320, 436)
DEMO_TARGET_BOX = (36, 180, 320, 216)


def source_document_id(folder_name: str) -> str:
    """DOC001_copy_paste -> DOC001"""
    return folder_name[: -len(SUFFIX)]


def rebuild() -> None:
    tampered_dir = DATASET_DIR / "tampered"
    genuine_dir = DATASET_DIR / "genuine"

    if not tampered_dir.exists():
        raise FileNotFoundError(
            f"Tampered dataset directory not found: {tampered_dir}"
        )

    rebuilt = 0
    unchanged = []

    for document_dir in sorted(tampered_dir.iterdir()):

        if not document_dir.is_dir():
            continue

        if not document_dir.name.endswith(SUFFIX):
            continue

        document_id = source_document_id(document_dir.name)

        genuine_path = (
            genuine_dir
            / document_id
            / "passport.png"
        )

        if not genuine_path.exists():
            raise FileNotFoundError(
                f"No genuine source for {document_dir.name}: "
                f"{genuine_path}"
            )

        output_path = document_dir / "passport.png"

        with Image.open(genuine_path) as genuine:
            genuine = genuine.convert("RGB")

            tampered = create_copy_paste(
                genuine,
                source_box=DEMO_SOURCE_BOX,
                target_box=DEMO_TARGET_BOX,
            )

            # A manipulation that changes nothing is a labelling error.
            if tampered.tobytes() == genuine.tobytes():
                unchanged.append(document_dir.name)
                continue

            tampered.save(output_path)

        rebuilt += 1

    print()
    print("=== DEMO COPY-MOVE REBUILD ===")
    print()
    print(f"Dataset directory : {DATASET_DIR}")
    print(f"Samples rebuilt   : {rebuilt}")

    if unchanged:
        raise ValueError(
            f"Operation left {len(unchanged)} samples unchanged: "
            f"{unchanged}"
        )

    print()
    print("Every rebuilt sample differs from its genuine source.")


if __name__ == "__main__":
    rebuild()
