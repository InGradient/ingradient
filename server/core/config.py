# my_app/core/config.py
import os

# 기본 디렉토리 설정
# BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# print("BASE_DIR", BASE_DIR)
UPLOAD_DIR = "../uploads"
TMP_FOLDER = "../.tmp"

# 폴더 자동 생성
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "thumbnails"), exist_ok=True)
os.makedirs(TMP_FOLDER, exist_ok=True)
