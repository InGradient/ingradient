# server/db/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import uuid
from datetime import datetime
from server.core.config import MODEL_UPLOAD_DIR, DATABASE_URL


engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def insert_default_model():
    """
    기본 모델(model_uint8.onnx)이 존재하면 DB에 미리 추가합니다.
    이미 등록되어 있거나 파일이 없으면 삽입하지 않습니다.
    """
    from server.db.models import AIModel
    import requests

    db = SessionLocal()

    dinov2_url = "https://huggingface.co/onnx-community/dinov2-small/resolve/main/onnx/model_uint8.onnx?download=true"
    
    default_file = os.path.join("server/uploads/models", "model_uint8.onnx")
    
    # 기본 모델 파일이 존재하는지 확인, 없으면 다운로드 시도
    if not os.path.exists(default_file):
        print("Default model file does not exist. Downloading:", default_file)
        # 저장할 디렉토리 생성 (존재하지 않을 경우)
        os.makedirs(os.path.dirname(default_file), exist_ok=True)
        try:
            response = requests.get(dinov2_url, stream=True)
            response.raise_for_status()
            with open(default_file, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            print("Default model downloaded successfully.")
        except Exception as e:
            print("Error downloading default model:", e)
            db.close()
            return

    exists = db.query(AIModel).filter(AIModel.file_location == default_file).first()
    if exists:
        db.close()
        return

    new_model = AIModel(
        id=str(uuid.uuid4()),
        name="DinoV2",
        file_location=default_file,
        input_width=224,
        input_height=224,
        purpose="feature_extract",
        uploaded_at=datetime.utcnow()
    )
    db.add(new_model)
    db.commit()
    db.refresh(new_model)
    db.close()
    print("Default model inserted into database.")


def init_db():
    """
    모든 모델을 임포트하고, 테이블 생성 후 기본 모델을 삽입합니다.
    """
    import os
    print("DB 절대 경로:", os.path.abspath("./ingradient.db"))

    from server.db import models  # 모든 모델이 로드되어야 Base.metadata에 등록됨
    Base.metadata.create_all(bind=engine)
    insert_default_model()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
