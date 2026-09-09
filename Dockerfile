FROM python:3.12.10-slim

WORKDIR /app

COPY requirements.txt .

COPY backend/requirements.txt ./backend/requirements.txt
COPY ml/requirements.txt ./ml/requirements.txt
COPY ocr/requirements.txt ./ocr/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY ml ./ml
COPY ocr ./ocr

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]