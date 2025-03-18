# server/api/model.py
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Body
from sqlalchemy.orm import Session
from server.db.database import get_db
from server.db.models import AIModel  # DB 모델: AIModel (미리 정의되어 있어야 함)
from server.core.config import MODEL_UPLOAD_DIR  # 모델 파일 저장 디렉토리 경로

router = APIRouter()

@router.post("/upload", tags=["model"])
async def upload_model(
    model_file: UploadFile = File(...),
    model_name: str = Body(...),
    input_width: int = Body(...),
    input_height: int = Body(...),
    db: Session = Depends(get_db)
):
    """
    모델 파일 업로드와 함께 모델명, 입력 이미지의 가로/세로 길이 등을 DB에 저장.
    """
    # 새 모델의 고유 ID 생성
    model_id = str(uuid.uuid4())
    
    # 파일 저장 경로 설정 (예: MODEL_UPLOAD_DIR이 미리 설정되어 있어야 함)
    file_location = os.path.join(MODEL_UPLOAD_DIR, f"{model_id}_{model_file.filename}")
    
    # 파일 저장
    with open(file_location, "wb") as f:
        content = await model_file.read()
        f.write(content)
    
    # DB에 모델 정보 저장 (AIModel은 id, name, file_location, input_width, input_height, uploaded_at 등의 필드를 가진다고 가정)
    new_model = AIModel(
        id=model_id,
        name=model_name,
        file_location=file_location,
        input_width=input_width,
        input_height=input_height,
        uploaded_at=datetime.utcnow()
    )
    db.add(new_model)
    db.commit()
    db.refresh(new_model)
    
    return {
        "id": new_model.id,
        "name": new_model.name,
        "fileLocation": new_model.file_location,
        "inputWidth": new_model.input_width,
        "inputHeight": new_model.input_height,
        "uploadedAt": new_model.uploaded_at.isoformat() if new_model.uploaded_at else None,
    }

@router.get("/list", tags=["model"])
def list_models(db: Session = Depends(get_db)):
    """
    등록된 AI 모델 목록 조회.
    """
    models = db.query(AIModel).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "fileLocation": m.file_location,
            "inputWidth": m.input_width,
            "inputHeight": m.input_height,
            "uploadedAt": m.uploaded_at.isoformat() if m.uploaded_at else None,
        }
        for m in models
    ]
