FROM python:3.12.10-slim

WORKDIR /app

# libgomp1 provides libgomp.so.1, the GNU OpenMP runtime. PaddlePaddle and
# scikit-learn both link against it and load it lazily, so the container
# starts and /health answers while every call to /verify fails with
# "libgomp.so.1: cannot open shared object file". The slim base image does
# not carry it; libgl1 and libglib2.0-0 are for OpenCV.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
COPY ml/requirements.txt ./ml/requirements.txt
COPY backend/requirements.txt ./backend/requirements.txt
COPY ocr/requirements.txt ./ocr/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY ml ./ml
COPY ocr ./ocr

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]