from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import argparse
import os
import shutil

app = FastAPI()


from ingradient.client import Ingradient
INGRADIENT_URL = 'http://localhost:8080'
ing = Ingradient(base_url=INGRADIENT_URL)


# CORS 미들웨어 추가: 모든 출처 허용 (개발 단계)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 현재 작업 디렉토리를 기준으로 uploads 폴더 생성
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads/images")
print("UPLOAD_DIR:", UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def root():
    return {"message": "Ingradient API Running"}

# 엔드포인트 이름을 '/upload-image'로 변경하여 프론트엔드와 일치시킵니다.
@app.post("/upload-image")
async def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": file.filename, "location": f"/uploads/images/{file.filename}"}

@app.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return {"file_path": file_path}
    return {"error": "File not found"}

def start_fastapi_server():
    """FastAPI 서버 실행"""
    parser = argparse.ArgumentParser(description="Start Ingradient API Server")
    parser.add_argument("--host", type=str, default="127.0.0.1",
                        help="Specify host address (default: 127.0.0.1). Use 0.0.0.0 for remote access.")
    args = parser.parse_args()
    uvicorn.run(app, host=args.host, port=8000)

if __name__ == "__main__":
    start_fastapi_server()
