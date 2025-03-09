import os
import shutil
from PIL import Image as PILImage

def create_thumbnail(image_path: str, thumbnail_path: str, size=(256, 256)):
    """썸네일 생성 유틸 함수"""
    try:
        with PILImage.open(image_path) as img:
            img.thumbnail(size)
            img.save(thumbnail_path, format=img.format)
        return thumbnail_path
    except Exception as e:
        print(f"Thumbnail creation failed: {e}")
        return None

def delete_file(file_path: str):
    """파일 삭제 유틸 함수"""
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Failed to delete file: {file_path}, Error: {e}")
