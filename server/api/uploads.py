import asyncio
from fastapi import (
    APIRouter, BackgroundTasks, UploadFile, File, Form, Depends, Request,
    WebSocket, WebSocketDisconnect
)
import os
import shutil
import uuid
from typing import Optional, List
from server.utils.file_utils import create_thumbnail, delete_file
from server.core.config import UPLOAD_DIR, TMP_FOLDER
from server.utils.string_utils import to_camel_case

# ConnectionManager import (경로는 실제 프로젝트 구조에 맞게 수정하세요)
from server.core.websockets import manager 

router = APIRouter()

@router.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4()).replace("-", "")
    fname = f"{file_id}_{file.filename}"

    folder_path = os.path.join(UPLOAD_DIR, "images")
    thumbnail_folder = os.path.join(UPLOAD_DIR, "thumbnails")

    os.makedirs(folder_path, exist_ok=True)
    os.makedirs(thumbnail_folder, exist_ok=True)
    
    file_location = os.path.join(folder_path, fname)
    thumbnail_location = os.path.join(thumbnail_folder, fname)

    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
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

def process_files_in_background(session_id: str, file_ids: List[str], loop: asyncio.AbstractEventLoop):
    """실제 파일 처리 로직 (백그라운드에서 실행될 함수)"""
    final_folder = os.path.join(UPLOAD_DIR, "images")
    thumbnail_folder = os.path.join(UPLOAD_DIR, "thumbnails")
    tmp_session_folder = os.path.join(TMP_FOLDER, session_id)

    os.makedirs(final_folder, exist_ok=True)
    os.makedirs(thumbnail_folder, exist_ok=True)

    moved_files_info = []
    total_files = len(file_ids)
    processed_count = 0

    try:
        for i, file_id in enumerate(file_ids):
            # ... (파일 찾기 및 이동 로직) ...
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
            processed_count += 1
            # ... (파일 처리 완료) ...

            # N개마다 또는 일정 시간마다 진행률 전송
            if processed_count % 10 == 0 or processed_count == total_files:
                print(f"[{session_id}] Progress: {processed_count}/{total_files}")
                # 👇 전달받은 loop를 사용합니다.
                future = asyncio.run_coroutine_threadsafe(
                    manager.send_progress(session_id, processed_count, total_files), loop
                )
                future.result() # 작업이 메인 루프에서 실행되기를 기다림 (timeout 추가 고려)

        # 완료 메시지 전송
        # 👇 전달받은 loop를 사용합니다.
        future = asyncio.run_coroutine_threadsafe(
            manager.send_complete(session_id, moved_files_info), loop
        )
        future.result()

    except Exception as e:
        print(f"Error during background processing: {e}")
        # 👇 전달받은 loop를 사용합니다.
        future = asyncio.run_coroutine_threadsafe(
            manager.send_error(session_id, str(e)), loop
        )
        future.result()
    finally:
        # 백그라운드 스레드에서 루프를 닫거나 관리할 필요는 없습니다. (메인 루프이므로)
        pass # 특별히 할 일 없음


@router.post("/commit-uploads")
async def commit_uploads(
    request: Request,
    background_tasks: BackgroundTasks
):
    form_data = await request.form()
    session_id = form_data.get("session_id")
    file_ids = form_data.getlist("file_ids")

    print(f"Received commit request for session: {session_id}, files: {file_ids} ({len(file_ids)})")

    if not session_id or not file_ids:
        print("Error: session_id or file_ids missing in form data.")
        return {"status": "error", "message": "Missing session_id or file_ids"}

    # 👇 현재 실행 중인 이벤트 루프를 가져옵니다.
    loop = asyncio.get_running_loop() 

    # 👇 백그라운드 작업에 루프를 전달합니다.
    background_tasks.add_task(process_files_in_background, session_id, file_ids, loop) 
    
    return {"status": "processing_started"}


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

@router.websocket("/ws/commit-progress/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            # WebSocket 연결을 유지하고, 클라이언트로부터 메시지를 받을 수 있음
            # (여기서는 주로 서버 -> 클라이언트 통신이므로, 오래 대기)
            data = await websocket.receive_text()
            print(f"Received message from {session_id}: {data}") # (옵션) 클라이언트 메시지 처리
    except WebSocketDisconnect:
        manager.disconnect(session_id)
        print(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        print(f"Error in websocket for {session_id}: {e}")
        manager.disconnect(session_id)