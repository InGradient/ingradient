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
    # models 모듈 내 AIModel 임포트 (모델이 정의되어 있어야 함)
    from server.db.models import AIModel

    db = SessionLocal()
    default_file = os.path.join("server/uploads/models", "model_uint8.onnx")
    
    # 기본 모델 파일이 존재하는지 확인
    if not os.path.exists(default_file):
        print("Default model file does not exist:", default_file)
        db.close()
        return

    # 이미 기본 모델이 등록되어 있는지 확인 (file_location 기준)
    exists = db.query(AIModel).filter(AIModel.file_location == default_file).first()
    if exists:
        db.close()
        return

    # 기본 모델 데이터 생성 (input_width와 input_height는 필요에 따라 조정)
    new_model = AIModel(
        id=str(uuid.uuid4()),
        name="DinoV2",
        file_location=default_file,
        input_width=224,   # 기본 입력 가로 길이 (필요시 변경)
        input_height=224,  # 기본 입력 세로 길이 (필요시 변경)
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
