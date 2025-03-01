from fastapi import FastAPI, UploadFile, File
import uvicorn
import argparse
import os
import shutil

app = FastAPI()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def root():
    return {"message": "Ingradient API Running"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": file.filename, "location": file_location}

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
