# my_app/core/config.py
import os

DATABASE_URL = "sqlite:///./ingradient.db"
UPLOAD_DIR = "./uploads"
MODEL_UPLOAD_DIR = os.path.join(UPLOAD_DIR, 'models')
TMP_FOLDER = "./.tmp"

# 폴더 자동 생성
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "thumbnails"), exist_ok=True)
os.makedirs(MODEL_UPLOAD_DIR, exist_ok=True)
os.makedirs(TMP_FOLDER, exist_ok=True)
