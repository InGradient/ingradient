# my_app/api/uploads.py
from fastapi import APIRouter, UploadFile, File, Form, Body, Query
import os
import shutil
import uuid
from typing import Optional, List
from server.utils.file_utils import create_thumbnail, delete_file
from server.core.config import UPLOAD_DIR, TMP_FOLDER
from server.utils.string_utils import to_camel_case

router = APIRouter()

@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...), upload_folder: str = Form("uploads")):
    file_id = str(uuid.uuid4()).replace("-", "")
    fname = f"{file_id}_{file.filename}"

    folder_path = os.path.join(UPLOAD_DIR, "images")
    thumbnail_folder = os.path.join(UPLOAD_DIR, "thumbnails")

    os.makedirs(folder_path, exist_ok=True)
    os.makedirs(thumbnail_folder, exist_ok=True)
    
    file_location = os.path.join(folder_path, fname)
    thumbnail_location = os.path.join(thumbnail_folder, fname)

    # 파일 저장
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # 썸네일 생성
    thumbnail_location = create_thumbnail(file_location, thumbnail_location)

    response = {
        "id": file_id,
        "filename": file.filename,
        "fileLocation": file_location,
        "thumbnailLocation": thumbnail_location,
    }
    return {to_camel_case(k): v for k, v in response.items()}

@router.post("/upload-temp")
async def upload_temp_file(file: UploadFile = File(...), session_id: str = Form(...)):
    tmp_session_folder = os.path.join(TMP_FOLDER, session_id)
    os.makedirs(tmp_session_folder, exist_ok=True)

    file_id = str(uuid.uuid4()).replace("-", "")
    tmp_file_path = os.path.join(tmp_session_folder, f"{file_id}_{file.filename}")

    with open(tmp_file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"fileId": file_id, "filename": file.filename, "tempLocation": tmp_file_path}

@router.post("/commit-uploads")
async def commit_uploads(session_id: str = Form(...), file_ids: List[str] = Body(...)): 
    final_folder = os.path.join(UPLOAD_DIR, "images")
    thumbnail_folder = os.path.join(UPLOAD_DIR, "thumbnails")

    os.makedirs(final_folder, exist_ok=True)
    os.makedirs(thumbnail_folder, exist_ok=True)

    tmp_session_folder = os.path.join(TMP_FOLDER, session_id)
    moved_files_info = []

    for file_id in file_ids:
        matched_files = [f for f in os.listdir(tmp_session_folder) if f.startswith(f"{file_id}_")]
        if not matched_files:
            continue

        tmp_filename = matched_files[0]
        tmp_file_path = os.path.join(tmp_session_folder, tmp_filename)
        final_file_path = os.path.join(final_folder, tmp_filename)

        shutil.move(tmp_file_path, final_file_path)
        thumbnail_path = create_thumbnail(final_file_path, os.path.join(thumbnail_folder, tmp_filename))

        moved_files_info.append({
            "id": file_id,
            "filename": tmp_filename.split("_", 1)[1],
            "fileLocation": final_file_path,
            "thumbnailLocation": thumbnail_path,
        })

    return {"status": "ok", "movedFiles": moved_files_info}

@router.delete("/cancel-uploads")
async def cancel_uploads(session_id: str = Form(...)):
    tmp_session_folder = os.path.join(TMP_FOLDER, session_id)
    if os.path.exists(tmp_session_folder):
        shutil.rmtree(tmp_session_folder)
    return {"status": "ok"}

@router.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return {"file_path": file_path}
    return {"error": "File not found"}
