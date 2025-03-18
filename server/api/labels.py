import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, Body, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from server.db.database import get_db
from server.db.models import BoundingBox, Segmentation, KeyPoint, Image, Class
from server.utils.string_utils import to_snake_case, to_camel_case, recursive_to_snake_case, parse_datetime

router = APIRouter()

@router.post("/")
def update_labels(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """특정 이미지의 바운딩박스, 키포인트, 세그멘테이션을 한 번에 업서트."""
    data = recursive_to_snake_case(data)
    image_id = data.get("image_id")
    if not image_id:
        return {"error": "image_id is required"}

    bounding_boxes_data = data.get("bounding_boxes", [])
    key_points_data = data.get("key_points", [])
    segmentations_data = data.get("segmentations", [])

    # 기존 데이터 삭제
    db.query(BoundingBox).filter(BoundingBox.image_id == image_id).delete()
    db.query(KeyPoint).filter(KeyPoint.image_id == image_id).delete()
    db.query(Segmentation).filter(Segmentation.image_id == image_id).delete()
    db.commit()

    bb_results, kp_results, seg_results = [], [], []

    # 🟢 Bounding Box 저장
    for bb in bounding_boxes_data:
        if not bb.get("id"):
            bb["id"] = str(uuid.uuid4())
        bb["image_id"] = image_id  
        bb["created_at"] = parse_datetime(bb.get("created_at"))
        bb["updated_at"] = parse_datetime(bb.get("updated_at"))
        new_bbox = BoundingBox(**bb)
        db.add(new_bbox)
        bb_results.append({to_camel_case(k): v for k, v in new_bbox.__dict__.items() if not k.startswith("_")})

    # 🔵 KeyPoint 저장
    for kp in key_points_data:
        if not kp.get("id"):
            kp["id"] = str(uuid.uuid4())
        kp["image_id"] = image_id
        kp["created_at"] = parse_datetime(kp.get("created_at"))
        kp["updated_at"] = parse_datetime(kp.get("updated_at"))
        new_kp = KeyPoint(**kp)
        db.add(new_kp)
        kp_results.append({to_camel_case(k): v for k, v in new_kp.__dict__.items() if not k.startswith("_")})

    # 🔶 Segmentation 저장
    for seg in segmentations_data:
        if not seg.get("id"):
            seg["id"] = str(uuid.uuid4())
        seg["image_id"] = image_id
        seg["created_at"] = parse_datetime(seg.get("created_at"))
        seg["updated_at"] = parse_datetime(seg.get("updated_at"))
        new_seg = Segmentation(**seg)
        db.add(new_seg)
        seg_results.append({to_camel_case(k): v for k, v in new_seg.__dict__.items() if not k.startswith("_")})

    # 모든 변경 사항 DB에 저장
    db.commit()

    return {
        "imageId": image_id,
        "boundingBoxes": bb_results,
        "keyPoints": kp_results,
        "segmentations": seg_results,
    }

@router.get("/")
def list_labels(
    image_id: str = Query(..., description="Retrieve all labels for a specific image"),
    db: Session = Depends(get_db)
):
    """
    특정 image_id에 해당하는 모든 바운딩박스, 키포인트, 세그멘테이션을 조회
    """
    bounding_boxes = db.query(BoundingBox).filter(BoundingBox.image_id == image_id).all()
    keypoints = db.query(KeyPoint).filter(KeyPoint.image_id == image_id).all()
    segmentations = db.query(Segmentation).filter(Segmentation.image_id == image_id).all()

    return {
        "boundingBoxes": [
            {to_camel_case(k): v for k, v in bbox.__dict__.items() if not k.startswith("_")}
            for bbox in bounding_boxes
        ],
        "keyPoints": [
            {to_camel_case(k): v for k, v in kp.__dict__.items() if not k.startswith("_")}
            for kp in keypoints
        ],
        "segmentations": [
            {to_camel_case(k): v for k, v in seg.__dict__.items() if not k.startswith("_")}
            for seg in segmentations
        ],
    }