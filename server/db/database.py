# server/db/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import uuid
from datetime import datetime
from server.core.config import MODEL_UPLOAD_DIR, DATABASE_URL
from tqdm import tqdm

engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def insert_default_model():
    """
    Inserts the default model (model_uint8.onnx) into the database
    if it exists and is not already registered.
    Downloads it if the file does not exist.
    """
    from server.db.models import AIModel
    import requests

    db = SessionLocal()

    dinov2_url = "https://huggingface.co/onnx-community/dinov2-small/resolve/main/onnx/model_uint8.onnx?download=true"
    
    default_file = os.path.join(MODEL_UPLOAD_DIR, "model_uint8.onnx")
    
    if not os.path.exists(default_file):
        print("Default model file does not exist. Downloading:", default_file)
        os.makedirs(os.path.dirname(default_file), exist_ok=True)
        try:
            response = requests.get(dinov2_url, stream=True)
            response.raise_for_status()

            total_size = int(response.headers.get('content-length', 0))
            block_size = 8192  # 8 KB
            progress_bar = tqdm(total=total_size, unit='iB', unit_scale=True)

            with open(default_file, "wb") as f:
                for chunk in response.iter_content(chunk_size=block_size):
                    if chunk:
                        f.write(chunk)
                        progress_bar.update(len(chunk))
            progress_bar.close()

            if total_size != 0 and progress_bar.n != total_size:
                print("⚠️ WARNING: Downloaded file size does not match expected size.")
            else:
                print("✅ Default model downloaded successfully.")

        except Exception as e:
            print("❌ Error downloading default model:", e)
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
    

def init_db():
    """
    Imports all models, creates tables, and inserts the default model.
    """
    from server.db import models  # 모든 모델이 로드되어야 Base.metadata에 등록됨
    Base.metadata.create_all(bind=engine)
    insert_default_model()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
