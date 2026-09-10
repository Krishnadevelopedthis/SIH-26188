from pathlib import Path
from time import perf_counter
import os
import resource

from backend.app.schemas.verification import (
    DocumentInfo,
    MRZChecks,
    MRZInfo,
    VerificationChecks,
    VerificationResponse,
)
from backend.app.services.consistency import check_consistency
from backend.app.services.document_detector import detect_document
from backend.app.services.expiry_validator import validate_expiry
from backend.app.services.risk_engine import calculate_risk
from ml.src.inference.pipeline import analyze_passport
from ml.src.inference.passport_verification import verify_passport_identity



def log_memory(stage: str):
    usage = resource.getrusage(resource.RUSAGE_SELF)

    print(
        f"[MEMORY] {stage} | "
        f"RSS={usage.ru_maxrss / 1024:.2f} MB | "
        f"PID={os.getpid()}"
    )


def verify_document(image_path: str) -> VerificationResponse:
    total_start = perf_counter()

    print("[VERIFY] Starting document verification")
    print(f"[VERIFY] File: {image_path}")
    log_memory("verification-start")

    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Document not found: {image_path}"
        )

    # ---------------------------------------------------------
    # OCR + MRZ
    # ---------------------------------------------------------
    start = perf_counter()
    print("[VERIFY] Starting OCR + MRZ...")


    passport_result = verify_passport_identity(
        str(path)
    )

    ocr_mrz_time = perf_counter() - start
    log_memory("after-ocr-mrz")

    ocr_result = passport_result["ocr"]
    mrz_result = passport_result["mrz"]

    # OCR fallback fields
    ocr_fields = passport_result.get(
        "ocr_fields",
        {},
    )

    viz_fields = passport_result.get(
        "viz_fields",
        {},
    )

    # ---------------------------------------------------------
    # Is this a travel document at all?
    #
    # Everything below assumes it is. Scoring a holiday photo against those
    # assumptions produces a confident accusation about a document nobody
    # submitted, so stop here instead.
    # ---------------------------------------------------------
    print("[VERIFY] Starting document detection...")
    detection = detect_document(
        texts=ocr_result["texts"],
        mrz_lines=passport_result.get("mrz_lines", []),
        viz_fields=viz_fields,
    )
    print(
    f"[VERIFY] Document detection: "
    f"is_document={detection.is_document}, "
    f"status={detection.status}"
    )

    if not detection.is_document:
        print(
            f"[TIMING] "
            f"OCR+MRZ={ocr_mrz_time:.2f}s | "
            f"screening skipped ({detection.status})"
        )

        return VerificationResponse(
            status=detection.status,
            risk_score=0,
            document=DocumentInfo(),
            checks=VerificationChecks(
                ocr=ocr_result["status"],
            ),
            mrz=MRZInfo(),
            reasons=[detection.reason],
        )

    # ---------------------------------------------------------
    # Expiry validation
    # ---------------------------------------------------------
    start = perf_counter()

    expiry_status, expiry_reason = validate_expiry(
        mrz_result.get("date_of_expiry")
    )

    expiry_time = perf_counter() - start

    # ---------------------------------------------------------
    # Printed fields against the MRZ
    # ---------------------------------------------------------
    start = perf_counter()

    consistency = check_consistency(
        mrz=mrz_result,
        viz_fields=viz_fields,
        viz_malformed=passport_result.get("viz_malformed", {}),
    )

    consistency_time = perf_counter() - start

    # ---------------------------------------------------------
    # Forensic ML
    # ---------------------------------------------------------
    start = perf_counter()
    print("[VERIFY] Starting forensic ML...")

    ml_result = analyze_passport(
        str(path)
    )

    ml_time = perf_counter() - start
    log_memory("after-forensic-ml")
    
    print(
    f"[VERIFY] Forensic ML completed in {ml_time:.2f}s"
    )
    

    tampering = ml_result.tampering

    # ---------------------------------------------------------
    # Risk engine
    # ---------------------------------------------------------
    start = perf_counter()

    risk_result = calculate_risk(
        mrz_valid=mrz_result.get(
            "valid",
            False,
        ),
        expiry_status=expiry_status,
        tampering_score=tampering.score,
        tampering_status=tampering.status,
        consistency_status=consistency.status,
    )

    risk_time = perf_counter() - start

    status = risk_result.status
    risk_score = risk_result.score
    reasons = risk_result.reasons

    # ---------------------------------------------------------
    # Additional reasons
    # ---------------------------------------------------------
    if ocr_result["status"] == "FAIL":
        reasons.append(
            "OCR failed to extract readable passport text."
        )

    if expiry_reason:
        reasons.append(expiry_reason)

    reasons.extend(consistency.mismatches)

    # ---------------------------------------------------------
    # Verification checks
    # ---------------------------------------------------------
    checks = VerificationChecks(
        ocr=ocr_result["status"],
        mrz=mrz_result["status"],
        expiry=expiry_status,
        tampering=tampering.status,
        face="NOT_RUN",
        consistency=consistency.status,
    )

    # ---------------------------------------------------------
    # Timing
    # ---------------------------------------------------------
    total_time = perf_counter() - total_start

    print(
        f"[TIMING] "
        f"OCR+MRZ={ocr_mrz_time:.2f}s | "
        f"Expiry={expiry_time:.4f}s | "
        f"Consistency={consistency_time:.4f}s | "
        f"ML={ml_time:.2f}s | "
        f"Risk={risk_time:.4f}s | "
        f"TOTAL={total_time:.2f}s"
    )

    # ---------------------------------------------------------
    # Document information
    #
    # Prefer validated MRZ values.
    # Use OCR fallback when MRZ cannot provide a value.
    # ---------------------------------------------------------
    passport_number = (
        mrz_result.get("document_number")
        or ocr_fields.get("passport_number")
    )

    nationality = (
        mrz_result.get("nationality")
        or ocr_fields.get("nationality")
    )

    date_of_birth = (
        mrz_result.get("date_of_birth")
        or ocr_fields.get("date_of_birth")
    )

    date_of_expiry = (
        mrz_result.get("date_of_expiry")
        or ocr_fields.get("date_of_expiry")
    )

    name = (
    mrz_result.get("name")
    or ocr_fields.get("name")
        )

    issuing_country = mrz_result.get(
            "issuing_country"
        )
    print("[VERIFY] Verification completed successfully")

    # ---------------------------------------------------------
    # Final API response
    # ---------------------------------------------------------
    return VerificationResponse(
        status=status,
        risk_score=risk_score,

        document=DocumentInfo(
            document_type="passport",
            passport_number=passport_number,
            name=name,
            nationality=nationality,
            date_of_birth=date_of_birth,
            date_of_expiry=date_of_expiry,
            issuing_country=issuing_country
        ),

        checks=checks,

        mrz=MRZInfo(
            valid=mrz_result.get(
                "valid",
                False,
            ),

            checks=MRZChecks(
                document_number=mrz_result.get(
                    "checks",
                    {},
                ).get(
                    "document_number",
                    False,
                ),

                date_of_birth=mrz_result.get(
                    "checks",
                    {},
                ).get(
                    "date_of_birth",
                    False,
                ),

                date_of_expiry=mrz_result.get(
                    "checks",
                    {},
                ).get(
                    "date_of_expiry",
                    False,
                ),

                composite=mrz_result.get(
                    "checks",
                    {},
                ).get(
                    "composite",
                    False,
                ),
            ),

            errors=mrz_result.get(
                "errors",
                [],
            ),
        ),

        reasons=reasons,
    )


