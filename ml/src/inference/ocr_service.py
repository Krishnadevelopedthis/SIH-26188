from functools import lru_cache
from pathlib import Path
import os
import resource

from paddleocr import PaddleOCR



def log_ocr_memory(stage: str):
    usage = resource.getrusage(resource.RUSAGE_SELF)

    print(
        f"[OCR MEMORY] {stage} | "
        f"RSS={usage.ru_maxrss / 1024:.2f} MB | "
        f"PID={os.getpid()}"
    )


@lru_cache(maxsize=1)
def get_ocr() -> PaddleOCR:
    log_ocr_memory("before-model-init")

    print("[OCR] Initializing PaddleOCR...")

    ocr = PaddleOCR(
        lang="en",
        ocr_version="PP-OCRv5",
        text_detection_model_name="PP-OCRv5_mobile_det",
        text_recognition_model_name="PP-OCRv5_mobile_rec",
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )

    log_ocr_memory("after-model-init")

    print("[OCR] PaddleOCR initialized")

    return ocr


class PassportOCR:
    def __init__(self):
        self.ocr = get_ocr()

   def extract_text(
    self,
    image_path: str,
 ) -> tuple[list[str], list[float]]:

    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Document image not found: {image_path}"
        )

    print(f"[OCR] Processing image: {image_path}")

    log_ocr_memory("before-predict")

    result = self.ocr.predict(str(path))

    log_ocr_memory("after-predict")

    texts = []
    scores = []

    for page in result:
        rec_texts = page.get("rec_texts", [])
        rec_scores = page.get("rec_scores", [])

        for index, text in enumerate(rec_texts):
            cleaned = str(text).strip()

            if not cleaned:
                continue

            texts.append(cleaned)

            scores.append(
                float(rec_scores[index])
                if index < len(rec_scores)
                else 0.0
            )

    print(f"[OCR] Extracted {len(texts)} text lines")

    return texts, scores

    def extract_mrz(self, texts: list[str]) -> list[str]:
        mrz_lines = []

        for text in texts:
            cleaned = text.replace(" ", "").upper()

            if len(cleaned) >= 30 and "<" in cleaned:
                mrz_lines.append(cleaned)

        print(f"[OCR] MRZ candidate lines: {len(mrz_lines)}")

        return mrz_lines


def extract_passport_ocr(image_path: str) -> dict:
    print("[OCR] Starting passport OCR...")

    ocr = PassportOCR()

    texts, scores = ocr.extract_text(image_path)
    mrz_lines = ocr.extract_mrz(texts)

    print("[OCR] Passport OCR completed")

    return {
        "texts": texts,
        "scores": scores,
        "mrz_lines": mrz_lines,
    }
