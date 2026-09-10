import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.verification import router as verification_router


app = FastAPI(
    title="SIH26188 Document Screening API",
    description="AI-assisted passport and identity document screening system",
    version="0.1.0",
)


# Origins allowed to call the API.
#
# Deployments set ALLOWED_ORIGINS to a comma-separated list; hard-coding only
# the local dev server means the hosted frontend is refused by the browser.
# The default covers Vite, which moves to the next free port when 5173 is busy.
DEFAULT_ALLOWED_ORIGINS = [
        "https://sih-26188-six.vercel.app",
     "https://www.airoease.live",
    "https://airoease.live",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
] or DEFAULT_ALLOWED_ORIGINS


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "document-screening-api",
    }


app.include_router(verification_router)
