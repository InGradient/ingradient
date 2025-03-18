# my_app/api/classes.py
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List

from server.db.database import get_db
from server.db.models import Class, Dataset, Image
from server.utils.string_utils import to_camel_case, to_snake_case

router = APIRouter()

@router.get("/")
def list_classes(db: Session = Depends(get_db)):
    classes_list = db.query(Class).all()
    result = []
    for cls_obj in classes_list:
        cls_dict = cls_obj.__dict__.copy()
        # 내부 속성 제외 후 camelCase 변환
        response_data = {
            to_camel_case(k): v for k, v in cls_dict.items() if not k.startswith("_")
        }
        result.append(response_data)
    return result

@router.post("/{class_id}")
def upsert_class(
    class_id: str,
    updated_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    updated_data = {to_snake_case(k): v for k, v in updated_data.items()}
    
    new_dataset_ids = updated_data.pop("dataset_ids", None)
    new_image_ids = updated_data.pop("image_ids", None)
    
    # 기존 class 조회
    cls_obj = db.query(Class).filter(Class.id == class_id).first()
    
    if cls_obj:
        # 존재하면 업데이트
        for field, value in updated_data.items():
            setattr(cls_obj, field, value)
        db.commit()
        db.refresh(cls_obj)
    else:
        # 존재하지 않으면 새로 생성
        cls_obj = Class(**updated_data)
        db.add(cls_obj)
        db.commit()
        db.refresh(cls_obj)
    
    # 클래스와 연결된 Dataset 관계 업데이트
    if new_dataset_ids is not None:
        cls_obj.datasets = []  # 기존 관계 초기화
        for ds_id in new_dataset_ids:
            dataset = db.query(Dataset).filter(Dataset.id == ds_id).first()
            if dataset:
                cls_obj.datasets.append(dataset)
        db.commit()
        db.refresh(cls_obj)
    
    # 클래스와 연결된 Image 관계 업데이트
    if new_image_ids is not None:
        cls_obj.images = []  # 기존 관계 초기화
        for img_id in new_image_ids:
            image = db.query(Image).filter(Image.id == img_id).first()
            if image:
                cls_obj.images.append(image)
        db.commit()
        db.refresh(cls_obj)
    
    # 응답: SQLAlchemy의 내부 필드 제거 및 snake_case → camelCase 변환
    cls_dict = cls_obj.__dict__.copy()
    response_data = {
        to_camel_case(k): v
        for k, v in cls_dict.items()
        if not k.startswith("_")
    }
    response_data["datasetIds"] = [ds.id for ds in cls_obj.datasets]
    response_data["imageIds"] = [img.id for img in cls_obj.images]
    
    return response_data

@router.get("/{class_id}")
def get_class(class_id: str, db: Session = Depends(get_db)):
    cls_ = db.query(Class).filter(Class.id == class_id).first()
    if not cls_:
        return {"error": "Class not found"}
    return cls_

@router.put("/{class_id}")
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

@router.delete("/{class_id}")
def delete_class(class_id: str, db: Session = Depends(get_db)):
    cls_ = db.query(Class).filter(Class.id == class_id).first()
    if not cls_:
        return {"error": "Class not found"}
    db.delete(cls_)
    db.commit()
    return {"message": f"Class {class_id} deleted"}