from fastapi import FastAPI, Form, UploadFile, File, Depends, APIRouter, Request, Body
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import argparse
import os
import shutil
import uuid
from PIL import Image as PILImage

from sqlalchemy.orm import Session
from datetime import datetime
# DB 관련 import
from server.db.database import init_db, SessionLocal
from server.db.models import Dataset, Class, Image
# schemas from crud.py (예: Pydantic 모델)
from server.db.crud import DatasetCreate, ClassCreate, ImageCreate
from server.utils import to_camel_case, to_snake_case

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---- CORS 설정 ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- DB 초기화 ----
init_db()

# ---- 업로드 디렉토리 설정 ----
UPLOAD_DIR = os.path.abspath("uploads/images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Ingradient API Running"}

# ================================
#  DATASET API
# ================================

@api_router.get("/datasets")
def list_datasets(db: Session = Depends(get_db)):
    return db.query(Dataset).all()

@api_router.post("/datasets")
def create_dataset(dataset: DatasetCreate, db: Session = Depends(get_db)):
    ds = Dataset(
        id=dataset.id,
        name=dataset.name,
        description=dataset.description
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds

@api_router.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        return {"error": "Dataset not found"}

    image_ids = [img.id for img in ds.images]
    class_ids = [cls.id for cls in ds.classes]

    return {
        "id": ds.id,
        "name": ds.name,
        "description": ds.description,
        "uploadedAt": ds.uploaded_at.isoformat() if ds.uploaded_at else None,
        "updatedAt": ds.updated_at.isoformat() if ds.updated_at else None,
        "imageIds": image_ids,
        "classIds": class_ids
    }

@api_router.put("/datasets/{dataset_id}")
def update_dataset(dataset_id: str, updated_data: dict, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        return {"error": "Dataset not found"}
    for field, value in updated_data.items():
        setattr(ds, field, value)
    db.commit()
    db.refresh(ds)
    return ds

@api_router.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        return {"error": "Dataset not found"}
    db.delete(ds)
    db.commit()
    return {"message": f"Dataset {dataset_id} deleted"}

# ================================
#  CLASS API
# ================================

@api_router.get("/classes")
def list_classes(db: Session = Depends(get_db)):
    return db.query(Class).all()

@api_router.post("/classes")
def create_class(cls_data: ClassCreate, db: Session = Depends(get_db)):
    print("create_class", cls_data)
    cls_ = Class(
        id=cls_data.id,
        name=cls_data.name,
        color=cls_data.color
    )
    db.add(cls_)
    db.commit()
    db.refresh(cls_)

    if cls_data.dataset_ids:
        for dataset_id in cls_data.dataset_ids:
            dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
            if dataset:
                cls_.datasets.append(dataset)
        db.commit()
        db.refresh(cls_)

    return cls_

@api_router.get("/classes/{class_id}")
def get_class(class_id: str, db: Session = Depends(get_db)):
    cls_ = db.query(Class).filter(Class.id == class_id).first()
    if not cls_:
        return {"error": "Class not found"}
    return cls_

@api_router.put("/classes/{class_id}")
def update_class(class_id: str, updated_data: dict, db: Session = Depends(get_db)):
    print("Updated Class Data", updated_data)
    cls_ = db.query(Class).filter(Class.id == class_id).first()
    if not cls_:
        return {"error": "Class not found"}
    for field, value in updated_data.items():
        setattr(cls_, field, value)
    db.commit()
    db.refresh(cls_)
    return cls_

@api_router.delete("/classes/{class_id}")
def delete_class(class_id: str, db: Session = Depends(get_db)):
    cls_ = db.query(Class).filter(Class.id == class_id).first()
    if not cls_:
        return {"error": "Class not found"}
    db.delete(cls_)
    db.commit()
    return {"message": f"Class {class_id} deleted"}

# ================================
#  IMAGE API
# ================================

@api_router.get("/images")
def list_images(db: Session = Depends(get_db)):
    return db.query(Image).all()

@api_router.get("/images/{image_id}")
def get_image(image_id: str, db: Session = Depends(get_db)):
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        return {"error": "Image not found"}
    return img


@api_router.post("/images/{image_id}")
def upsert_image(image_id: str, updated_data: dict = Body(...), db: Session = Depends(get_db)):
    # ✅ 요청 데이터(`camelCase` → `snake_case` 변환)
    updated_data = {to_snake_case(k): v for k, v in updated_data.items()}

    new_dataset_ids = updated_data.pop("dataset_ids", None)
    new_class_ids = updated_data.pop("class_ids", None)

    updated_data.setdefault("properties", {"description": "", "comment": ""})

    img = db.query(Image).filter(Image.id == image_id).first()

    if img:
        for field, value in updated_data.items():
            setattr(img, field, value)
        db.commit()
        db.refresh(img)
    else:
        img = Image(**updated_data)
        db.add(img)
        db.commit()
        db.refresh(img)

    if new_dataset_ids is not None:
        img.datasets = []
        for dataset_id in new_dataset_ids:
            dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
            if dataset:
                img.datasets.append(dataset)
        db.commit()
        db.refresh(img)

    if new_class_ids is not None:
        img.classes = []
        for class_id in new_class_ids:
            cls_obj = db.query(Class).filter(Class.id == class_id).first()
            if cls_obj:
                img.classes.append(cls_obj)
        db.commit()
        db.refresh(img)

    # ✅ 응답(`snake_case` → `camelCase` 변환)
    img_dict = img.__dict__.copy()
    response_data = {
        to_camel_case(k): v
        for k, v in img_dict.items()
        if not k.startswith("_")  # SQLAlchemy 내부 필드 제거
    }

    response_data["datasetIds"] = [ds.id for ds in img.datasets]
    response_data["classIds"] = [cls.id for cls in img.classes]

    return response_data


@api_router.delete("/images/{image_id}")
def delete_image(image_id: str, db: Session = Depends(get_db)):
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        return {"error": "Image not found"}
    db.delete(img)
    db.commit()
    return {"message": f"Image {image_id} deleted"}

# ================================
#  파일 업로드 (업로드 & DB 저장) 및 관계 업데이트
# ================================

@api_router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    upload_folder: str = Form("uploads")
):
    file_id = str(uuid.uuid4()).replace("-", "")
    fname = f"{file_id}_{file.filename}"

    folder_path = os.path.join(upload_folder, "images")
    thumbnail_folder = os.path.join(upload_folder, 'thumbnails')

    os.makedirs(folder_path, exist_ok=True)
    os.makedirs(thumbnail_folder, exist_ok=True)
    
    file_location = os.path.join(folder_path, fname)
    thumbnail_location = os.path.join(thumbnail_folder, fname)
    
    # 파일 저장
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    try:
        with PILImage.open(file_location) as img:
            img.thumbnail((256, 256))  # ✅ 썸네일 크기 설정 (256x256)
            img.save(thumbnail_location, format=img.format)  # ✅ 동일한 형식으로 저장
    except Exception as e:
        print("Thumbnail creation failed:", e)
        thumbnail_location = None  # 에러 발생 시 썸네일 없음

    return {
        "id": file_id,
        "filename": file.filename,
        "file_location": file_location,
        "thumbnail_location": thumbnail_location,
    }

@api_router.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return {"file_path": file_path}
    return {"error": "File not found"}

# ================================
#  라우터 등록
# ================================
app.include_router(api_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

def start_fastapi_server():
    parser = argparse.ArgumentParser(description="Start Ingradient API Server")
    parser.add_argument("--host", type=str, default="127.0.0.1",
                        help="Specify host address (default: 127.0.0.1). Use 0.0.0.0 for remote access.")
    args = parser.parse_args()
    uvicorn.run(app, host=args.host, port=8000)

if __name__ == "__main__":
    start_fastapi_server()
