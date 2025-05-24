import os 
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List

from server.db.database import get_db
from server.db.models import Dataset, Class, Image
from server.db.crud import DatasetCreate
from server.utils.string_utils import to_camel_case, to_snake_case

router = APIRouter()

@router.get("/")
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).all()
    results = []
    for ds in datasets:
        results.append({
            "id": ds.id,
            "name": ds.name,
            "description": ds.description,
            "uploadedAt": ds.uploaded_at.isoformat() if ds.uploaded_at else None,
            "updatedAt": ds.updated_at.isoformat() if ds.updated_at else None,
            "classIds": [cls.id for cls in ds.classes],
        })
    return results

@router.post("/")
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

@router.post("/{dataset_id}")
def upsert_dataset(
    dataset_id: str,
    updated_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    # 요청 데이터의 키(camelCase)를 snake_case로 변환
    updated_data = {to_snake_case(k): v for k, v in updated_data.items()}

    # 관계 업데이트용 데이터 추출 (없으면 None)
    new_class_ids = updated_data.pop("class_ids", None)
    new_image_ids = updated_data.pop("image_ids", None)

    # 기본값 설정 (필요 시 추가)
    updated_data.setdefault("description", "")

    # dataset_id를 기준으로 기존 데이터셋 조회
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()

    if ds:
        # 존재하면 업데이트
        for field, value in updated_data.items():
            setattr(ds, field, value)
        db.commit()
        db.refresh(ds)
    else:
        # 존재하지 않으면 새로 생성
        ds = Dataset(id=dataset_id, **updated_data)
        db.add(ds)
        db.commit()
        db.refresh(ds)

    # 클래스 관계 업데이트 (있으면 새로 설정)
    if new_class_ids is not None:
        ds.classes = []  # 기존 연결 초기화
        for class_id in new_class_ids:
            cls_obj = db.query(Class).filter(Class.id == class_id).first()
            if cls_obj:
                ds.classes.append(cls_obj)
        db.commit()
        db.refresh(ds)

    # 이미지 관계 업데이트 (있으면 새로 설정)
    if new_image_ids is not None:
        ds.images = []  # 기존 연결 초기화
        for image_id in new_image_ids:
            img = db.query(Image).filter(Image.id == image_id).first()
            if img:
                ds.images.append(img)
        db.commit()
        db.refresh(ds)

    # 응답 데이터를 snake_case에서 camelCase로 변환하여 반환
    ds_dict = ds.__dict__.copy()
    response_data = {
        to_camel_case(k): v
        for k, v in ds_dict.items()
        if not k.startswith("_")  # SQLAlchemy 내부 필드 제외
    }
    response_data["classIds"] = [cls.id for cls in ds.classes]
    response_data["imageIds"] = [img.id for img in ds.images]

    return response_data

@router.get("/{dataset_id}")
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

@router.put("/{dataset_id}")
def update_dataset(dataset_id: str, updated_data: dict, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        return {"error": "Dataset not found"}
    for field, value in updated_data.items():
        setattr(ds, field, value)
    db.commit()
    db.refresh(ds)
    return ds

def _delete_image_files(img: Image):
    """(이미지 파일 삭제 로직 분리)"""
    if img.file_location and os.path.exists(img.file_location):
        try:
            print(f"Deleting file: {img.file_location}") # 로그 추가
            os.remove(img.file_location)
        except Exception as e:
            print(f"Failed to delete file: {img.file_location}, Error: {e}")

    if img.thumbnail_location and os.path.exists(img.thumbnail_location):
        try:
            print(f"Deleting thumbnail: {img.thumbnail_location}") # 로그 추가
            os.remove(img.thumbnail_location)
        except Exception as e:
            print(f"Failed to delete thumbnail: {img.thumbnail_location}, Error: {e}")

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        return {"error": "Dataset not found"}

    images_to_delete = []
    images_to_unlink = []

    # 1) 삭제/연결 해제할 이미지 결정
    for img in list(ds.images):
        print(f"Processing Image ID: {img.id}, Dataset Count: {len(img.datasets)}") # 로그 추가
        if len(img.datasets) == 1:
            images_to_delete.append(img)
        else:
            images_to_unlink.append(img)

    # 2) 연결 해제할 이미지 처리
    for img in images_to_unlink:
        print(f"Unlinking Image ID: {img.id} from Dataset {ds.id}") # 로그 추가
        ds.images.remove(img)

    # 3) 삭제할 이미지 처리 (파일 삭제 + DB 삭제 마킹)
    for img in images_to_delete:
        print(f"Deleting Image ID: {img.id}") # 로그 추가
        _delete_image_files(img) # 파일 삭제 먼저 수행
        db.delete(img)           # DB 삭제 마킹

    # 4) 클래스 처리 (동일한 로직)
    classes_to_delete = []
    classes_to_unlink = []
    for cls_obj in list(ds.classes):
        if len(cls_obj.datasets) == 1:
            classes_to_delete.append(cls_obj)
        else:
             classes_to_unlink.append(cls_obj)
    for cls_obj in classes_to_unlink:
        ds.classes.remove(cls_obj)
    for cls_obj in classes_to_delete:
        db.delete(cls_obj)

    # 5) 데이터셋 자체 삭제 마킹
    db.delete(ds)

    # 6) 모든 변경 사항을 한 번에 커밋
    try:
        db.commit()
    except Exception as e:
        db.rollback() # 오류 발생 시 롤백
        print(f"Failed to commit dataset deletion: {e}")
        return {"error": "Failed to delete dataset."}

    return {"message": f"Dataset {dataset_id} deleted."}