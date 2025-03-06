# server/db/crud.py

from fastapi import APIRouter, Depends, Form, UploadFile
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from server.db.database import SessionLocal
from server.db.models import Dataset, Class, Image

router = APIRouter()

# --------------------------------------------------
# DB 종속성 (SessionLocal)
# --------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------
# Pydantic Schemas
# --------------------------------------------------

# Dataset
class DatasetCreate(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    image_ids: Optional[str] = None
    class_ids: Optional[str] = None

# Class
class ClassCreate(BaseModel):
    id: str
    name: str
    color: Optional[str] = None
    dataset_ids: Optional[List[str]] = [] 
    image_ids: Optional[List[str]] = []

# Image
class ImageCreate(BaseModel):
    id: str = Form(...)
    filename: str = Form(...)
    upload_path: Optional[str] = Form("")
    image_url: Optional[str] = Form("")
    dataset_ids: List[str] = Form([])
    class_ids: List[str] = Form([])
    approval: str = Form("pending")
    comment: str = Form("")
    labeled_by: Optional[str] = Form(None)
    edited_by: Optional[str] = Form(None)
    uploaded_by: Optional[str] = Form(None)
    properties: dict = Form({})
    file: Optional[UploadFile] = None

    class Config:
        orm_mode = True

# --------------------------------------------------
# Dataset CRUD
# --------------------------------------------------

@router.get("/datasets")
def list_datasets(db: Session = Depends(get_db)):
    return db.query(Dataset).all()

@router.post("/datasets")
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

@router.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        return {"error": "Dataset not found"}
    return ds

@router.put("/datasets/{dataset_id}")
def update_dataset(dataset_id: str, updated_data: dict, db: Session = Depends(get_db)):
    """
    updated_data 예시: {"name": "New Dataset Name", "description": "Updated desc"}
    """
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        return {"error": "Dataset not found"}

    for field, value in updated_data.items():
        setattr(ds, field, value)

    db.commit()
    db.refresh(ds)
    return ds

@router.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        return {"error": "Dataset not found"}

    db.delete(ds)
    db.commit()
    return {"message": f"Dataset {dataset_id} deleted"}

# --------------------------------------------------
# Class CRUD
# --------------------------------------------------

@router.get("/classes")
def list_classes(db: Session = Depends(get_db)):
    return db.query(Class).all()

@router.post("/classes")
def create_class(cls_data: ClassCreate, db: Session = Depends(get_db)):
    cls_ = Class(
        id=cls_data.id,
        name=cls_data.name,
        color=cls_data.color,
        dataset_ids=cls_data.dataset_ids
    )
    db.add(cls_)
    db.commit()
    db.refresh(cls_)
    return cls_

@router.get("/classes/{class_id}")
def get_class(class_id: str, db: Session = Depends(get_db)):
    cls_ = db.query(Class).filter(Class.id == class_id).first()
    if not cls_:
        return {"error": "Class not found"}
    return cls_

@router.put("/classes/{class_id}")
def update_class(class_id: str, updated_data: dict, db: Session = Depends(get_db)):
    """
    updated_data 예시: {"name": "New Class Name", "color": "#FFFFAA", "dataset_id": "dataset2"}
    """
    cls_ = db.query(Class).filter(Class.id == class_id).first()
    if not cls_:
        return {"error": "Class not found"}

    for field, value in updated_data.items():
        setattr(cls_, field, value)

    db.commit()
    db.refresh(cls_)
    return cls_

@router.delete("/classes/{class_id}")
def delete_class(class_id: str, db: Session = Depends(get_db)):
    cls_ = db.query(Class).filter(Class.id == class_id).first()
    if not cls_:
        return {"error": "Class not found"}
    db.delete(cls_)
    db.commit()
    return {"message": f"Class {class_id} deleted"}

# --------------------------------------------------
# Image CRUD
# --------------------------------------------------

@router.get("/images")
def list_images(db: Session = Depends(get_db)):
    return db.query(Image).all()

@router.post("/images", response_model=None)  # ✅ Pydantic 모델 강제 사용 안 함
def create_image(img_data: ImageCreate, db: Session = Depends(get_db)):
    """DB에 새로운 이미지 추가"""
    new_img = Image(
        id=img_data.id,
        filename=img_data.filename,
        upload_path=img_data.upload_path,
        imageURL=img_data.imageURL,
        dataset_id=img_data.dataset_id,
        class_id=img_data.class_id,
        approval=img_data.approval,
        comment=img_data.comment,
        labeled_by=img_data.labeled_by,
        edited_by=img_data.edited_by,
        uploaded_by=img_data.uploaded_by,
        properties=img_data.properties
    )
    db.add(new_img)
    db.commit()
    db.refresh(new_img)

    return {  # ✅ `dict`로 변환하여 반환
        "id": new_img.id,
        "filename": new_img.filename,
        "upload_path": new_img.upload_path,
        "imageURL": new_img.imageURL,
        "dataset_id": new_img.dataset_id,
        "class_id": new_img.class_id,
        "approval": new_img.approval,
        "comment": new_img.comment,
        "labeled_by": new_img.labeled_by,
        "edited_by": new_img.edited_by,
        "uploaded_by": new_img.uploaded_by,
        "properties": new_img.properties
    }

@router.get("/images/{image_id}")
def get_image(image_id: str, db: Session = Depends(get_db)):
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        return {"error": "Image not found"}
    return img

@router.put("/images/{image_id}")
def update_image(image_id: str, updated_data: dict, db: Session = Depends(get_db)):
    """
    updated_data 예시:
    {
      "dataset_id": "dataset2",
      "class_id": "class3",
      "approval": "approved",
      "comment": "Looks good",
      "properties": {"desc": "A cute dog."}
    }
    """
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        return {"error": "Image not found"}

    for field, value in updated_data.items():
        setattr(img, field, value)

    db.commit()
    db.refresh(img)
    return img

@router.delete("/images/{image_id}")
def delete_image(image_id: str, db: Session = Depends(get_db)):
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        return {"error": "Image not found"}
    db.delete(img)
    db.commit()
    return {"message": f"Image {image_id} deleted"}
