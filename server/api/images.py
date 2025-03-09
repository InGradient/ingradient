# my_app/api/images.py
from fastapi import APIRouter, Depends, Body, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import shutil

from server.db.database import get_db
from server.db.models import Image, Dataset, Class
from server.utils.string_utils import to_camel_case, to_snake_case

router = APIRouter()

@router.get("/")
def list_images(dataset_ids: Optional[List[str]] = Query(None), db: Session = Depends(get_db)):
    """
    - dataset_ids가 제공되면, 해당 데이터셋과 연결된 이미지 목록만 반환 (중복 제거)
    - dataset_ids가 없으면 전체 이미지를 반환
    - 각 이미지에는 연결된 클래스 목록(classIds)도 포함
    """
    if dataset_ids:
        # dataset_ids에 연결된 이미지들을 distinct()로 중복 제거
        images = db.query(Image).join(Image.datasets).filter(Dataset.id.in_(dataset_ids)).distinct().all()
    else:
        images = db.query(Image).all()
    
    results = []
    for img in images:
        results.append({
            "id": img.id,
            "filename": img.filename,
            "fileLocation": img.file_location,
            "thumbnailLocation": img.thumbnail_location,
            "width": img.width,
            "height": img.height,
            "approval": img.approval,
            "comment": img.comment,
            "classIds": [cls.id for cls in img.classes],
            "properties": img.properties,
        })
    
    return results

@router.get("/{image_id}")
def get_image(image_id: str, db: Session = Depends(get_db)):
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        return {"error": "Image not found"}
    return img

@router.post("/{image_id}")
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
        # 현재 연결된 dataset들의 ID를 가져오기
        existing_dataset_ids = {ds.id for ds in img.datasets}

        # 추가할 dataset 찾기 (이미 연결되지 않은 dataset만 추가)
        datasets_to_add = [db.query(Dataset).filter(Dataset.id == dataset_id).first()
                        for dataset_id in new_dataset_ids if dataset_id not in existing_dataset_ids]

        # dataset 추가
        img.datasets.extend(filter(None, datasets_to_add))  # None이 아닌 값만 추가

        db.commit()
        db.refresh(img)

    if new_class_ids is not None:
        existing_class_ids = {cls.id for cls in img.classes}

        # 추가할 class 찾기
        classes_to_add = [db.query(Class).filter(Class.id == class_id).first()
                        for class_id in new_class_ids if class_id not in existing_class_ids]

        # 기존 관계 제거 후 새 class만 추가
        img.classes.clear()
        img.classes.extend(filter(None, classes_to_add))

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

@router.delete("/{image_id}")
def delete_image(
    image_id: str,
    selected_dataset_ids: Optional[List[str]] = Query(None),  # 리스트로 받기
    db: Session = Depends(get_db)
):
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        return {"error": "Image not found"}
    
    print("selected_dataset_ids", selected_dataset_ids)

    # dataset_id가 제공된 경우
    if selected_dataset_ids:
        # image와 연결된 각 dataset에 대해
        for ds in list(img.datasets):
            if ds.id in selected_dataset_ids:
                ds.images.remove(img)  # 해당 dataset과의 연결만 제거
        db.commit()
        db.refresh(img)

        # 제거 후 이미지가 연결된 데이터셋이 없으면 파일 삭제 및 이미지 완전 삭제
        if len(img.datasets) == 0:
            _delete_image_files(img)
            db.delete(img)
            db.commit()
            return {"message": f"Image {image_id} fully deleted (no remaining dataset connections)."}
        else:
            return {"message": f"Image {image_id} unlinked from datasets {selected_dataset_ids}."}
    else:
        # dataset_id가 제공되지 않으면, 기본적으로 파일과 DB 모두에서 완전 삭제
        _delete_image_files(img)
        db.delete(img)
        db.commit()
        return {"message": f"Image {image_id} and associated files deleted."}

def _delete_image_files(img: Image):
    """이미지 파일과 썸네일을 삭제하는 유틸 함수"""
    if img.file_location and os.path.exists(img.file_location):
        try:
            os.remove(img.file_location)
        except Exception as e:
            print(f"Failed to delete file: {img.file_location}, Error: {e}")

    if img.thumbnail_location and os.path.exists(img.thumbnail_location):
        try:
            os.remove(img.thumbnail_location)
        except Exception as e:
            print(f"Failed to delete thumbnail: {img.thumbnail_location}, Error: {e}")