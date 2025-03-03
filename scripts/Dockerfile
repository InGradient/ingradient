# 예: Python FastAPI 서버만 컨테이너로 구성
FROM python:3.10

WORKDIR /app
COPY server/ /app

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
