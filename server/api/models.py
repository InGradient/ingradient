import os
import uuid
import io
import numpy as np
from umap import UMAP
from typing import List

from PIL import Image as PILImage
from datetime import datetime
import onnxruntime as ort
import faiss  # pip install faiss-cpu (또는 faiss-gpu)
from fastapi import APIRouter, Depends, UploadFile, File, Body, HTTPException, Form, Query
from sqlalchemy.orm import Session
from server.db.database import get_db
from server.db.models import AIModel, Image, ImageFeature
from server.core.config import MODEL_UPLOAD_DIR

router = APIRouter()

# 모델별 Faiss 인덱스를 메모리에 캐싱할 딕셔너리
# 형식: { model_id: (faiss_index, feature_dim, counter) }
FAISS_INDEXES = {}

# 모델별 UUID 매핑: { model_id: { uuid_str: int64_id } }
FAISS_UUID_MAPPING = {}

def load_or_create_faiss_index(model: AIModel, feature_dim: int):
    """
    model_id에 해당하는 Faiss 인덱스를 메모리에 로드하거나,
    없으면 새로 생성해서 FAISS_INDEXES에 등록합니다.
    IndexIDMap을 사용하여, feature 벡터마다 사용자 정의 int64 id를 할당할 수 있습니다.
    """
    model_id = model.id
    if model_id in FAISS_INDEXES:
        return FAISS_INDEXES[model_id][0]
    
    index_path = os.path.join(MODEL_UPLOAD_DIR, f"{model_id}.index")
    if os.path.exists(index_path):
        print(f"Loading Faiss index for model {model_id}...")
        index = faiss.read_index(index_path)
        counter = index.ntotal  # 현재 저장된 벡터 수를 카운터로 사용
        FAISS_INDEXES[model_id] = (index, feature_dim, counter)
        # 초기화: 기존 매핑은 새로 로드 시 복원하지 않으므로 빈 dict로 시작
        FAISS_UUID_MAPPING.setdefault(model_id, {})
        return index
    else:
        print(f"Creating new Faiss index for model {model_id} with dimension {feature_dim}")
        base_index = faiss.IndexFlatL2(feature_dim)
        index = faiss.IndexIDMap2(base_index)
        FAISS_INDEXES[model_id] = (index, feature_dim, 0)
        FAISS_UUID_MAPPING[model_id] = {}
        return index

def save_faiss_index(model_id: str):
    """
    메모리에 있는 인덱스를 디스크에 저장합니다.
    """
    if model_id not in FAISS_INDEXES:
        return
    index, _, _ = FAISS_INDEXES[model_id]
    index_path = os.path.join(MODEL_UPLOAD_DIR, f"{model_id}.index")
    faiss.write_index(index, index_path)
    print('os.getcwd()', os.getcwd())
    print(f"Saved Faiss index to {index_path}")

@router.post("/upload", tags=["model"])
async def upload_model(
    model_file: UploadFile = File(...),
    model_name: str = Body(...),
    input_width: int = Body(...),
    input_height: int = Body(...),
    purpose: str = Body(...),
    db: Session = Depends(get_db)
):
    """
    모델 파일 업로드 및 DB 저장
    """
    model_id = str(uuid.uuid4())
    file_location = os.path.join(MODEL_UPLOAD_DIR, f"{model_id}_{model_file.filename}")
    with open(file_location, "wb") as f:
        content = await model_file.read()
        f.write(content)
    
    new_model = AIModel(
        id=model_id,
        name=model_name,
        file_location=file_location,
        input_width=input_width,
        input_height=input_height,
        purpose=purpose,
        uploaded_at=datetime.utcnow()
    )
    db.add(new_model)
    db.commit()
    db.refresh(new_model)
    
    return {
        "id": new_model.id,
        "name": new_model.name,
        "fileLocation": new_model.file_location,
        "inputWidth": new_model.input_width,
        "inputHeight": new_model.input_height,
        "purpose": new_model.purpose,
        "uploadedAt": new_model.uploaded_at.isoformat() if new_model.uploaded_at else None,
    }

@router.get("/list", tags=["model"])
def list_models(
    purpose: str = Query("", description="필터링할 모델의 purpose (빈 문자열이면 전체 조회)"),
    db: Session = Depends(get_db)
):
    """
    등록된 AI 모델 목록 조회 (purpose 필터 가능)
    """
    query = db.query(AIModel)
    if purpose:
        query = query.filter(AIModel.purpose == purpose)
    models = query.all()

    return [
        {
            "id": m.id,
            "name": m.name,
            "fileLocation": m.file_location,
            "inputWidth": m.input_width,
            "inputHeight": m.input_height,
            "purpose": m.purpose,
            "uploadedAt": m.uploaded_at.isoformat() if m.uploaded_at else None,
        }
        for m in models
    ]

@router.post("/extract_features", tags=["model"])
async def extract_features(
    model_id: str = Form(...),
    image_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    모델 ID와 이미지 ID를 받아 해당 이미지에서 feature 추출.
    추출한 feature 벡터는 Faiss 인덱스에 저장하고,
    ImageFeature 테이블에 { image_id, model_id, feature_id } 형태의 레코드를 생성합니다.
    그리고 feature_id (문자열)를 응답합니다.
    """
    # 모델 조회
    model_record = db.query(AIModel).filter(AIModel.id == model_id).first()
    if not model_record:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # 이미지 조회
    image_record = db.query(Image).filter(Image.id == image_id).first()
    if not image_record:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if not image_record.file_location or not os.path.exists(image_record.file_location):
        raise HTTPException(status_code=400, detail="Image file not found on disk")
    
    try:
        with open(image_record.file_location, "rb") as f:
            image_bytes = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to read image file")
    
    try:
        image = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    width, height = model_record.input_width, model_record.input_height
    image = image.resize((width, height))

    img_np = np.array(image).astype(np.float32) / 255.0
    img_np = img_np.transpose(2, 0, 1)
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)
    img_np = (img_np - mean) / std
    img_np = np.expand_dims(img_np, axis=0)

    try:
        session = ort.InferenceSession(model_record.file_location)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to load model")
    
    input_name = session.get_inputs()[0].name
    try:
        outputs = session.run(None, {input_name: img_np})
    except Exception as e:
        print("Inference error:", e)
        raise HTTPException(status_code=500, detail="Failed during inference")
    
    features = outputs[0]  # 예: shape = [1, D] 또는 [1, H, W, C]
    # 만약 feature가 3차원 이상이라면 flatten 처리 (1, -1)
    vector = features.reshape(1, -1).astype(np.float32)
    
    # Faiss 인덱스 로드/생성
    feature_dim = vector.shape[1]
    index = load_or_create_faiss_index(model_record, feature_dim)
    _, _, counter = FAISS_INDEXES[model_id]
    
    # 새로운 feature id (uuid 문자열) 생성
    new_feature_uuid = str(uuid.uuid4())
    new_feature_int_id = counter
    FAISS_INDEXES[model_id] = (index, feature_dim, counter + 1)
    FAISS_UUID_MAPPING.setdefault(model_id, {})[new_feature_uuid] = new_feature_int_id
    
    index.add_with_ids(vector, np.array([new_feature_int_id], dtype=np.int64))
    save_faiss_index(model_id)
    
    # ImageFeature 테이블에 새로운 레코드 생성
    image_feature = ImageFeature(
        image_id=image_id,
        model_id=model_id,
        feature_id=new_feature_uuid,
        feature_int_id=new_feature_int_id
    )
    db.add(image_feature)
    db.commit()
    
    return {"featureId": new_feature_uuid}

@router.get("/compress_features", tags=["model"])
def compress_features(
    image_ids: List[str] = Query(..., description="조회할 image ID 목록"),
    model_id: str = Query(..., description="차원 축소할 feature를 가진 모델의 ID"),
    method: str = Query("umap", description="차원 축소 방법 (기본: umap)"),
    db: Session = Depends(get_db)
):
    """
    주어진 image_ids와 model_id를 기반으로, 각 이미지에 대해 해당 모델로부터
    추출한 feature 벡터들을 UMAP 등으로 2차원으로 압축한 좌표를 반환합니다.
    """
    # 1. image_ids에 해당하는 이미지들을 DB에서 조회
    images = db.query(Image).filter(Image.id.in_(image_ids)).all()
    if not images:
        raise HTTPException(status_code=404, detail="No images found for the provided IDs")
    
    # 2. Faiss 인덱스가 메모리에 없다면 디스크에서 .index 파일 로드
    if model_id not in FAISS_INDEXES:
        model_record = db.query(AIModel).filter(AIModel.id == model_id).first()
        if not model_record:
            raise HTTPException(status_code=404, detail="Model not found in DB")

        index_path = os.path.join(MODEL_UPLOAD_DIR, f"{model_id}.index")
        if os.path.exists(index_path):
            try:
                index = faiss.read_index(index_path)
                feature_dim = index.d  # index에서 차원 수 가져오기
                counter = index.ntotal
                FAISS_INDEXES[model_id] = (index, feature_dim, counter)
                FAISS_UUID_MAPPING.setdefault(model_id, {})  # UUID 매핑은 다시 로드 필요 (여기선 생략)
            except Exception as e:
                print("Failed to load Faiss index from disk:", e)
                raise HTTPException(status_code=500, detail="Failed to load Faiss index from disk")
        else:
            raise HTTPException(
                status_code=404,
                detail="Faiss index not in memory or disk. Need to run extract_features first."
            )

    # 3. FAISS_INDEXES에서 해당 모델의 인덱스 정보 가져오기
    if model_id not in FAISS_INDEXES:
        raise HTTPException(status_code=404, detail="Faiss index not available")

    index, feature_dim, _ = FAISS_INDEXES[model_id]

    # 4. 각 이미지에 대해 ImageFeature 관계에서 model_id에 해당하는 feature_int_id를 찾고,
    #    해당 ID를 이용해 Faiss 인덱스로부터 벡터 복원
    valid_image_ids = []
    feature_vectors = []
    for img in images:
        feature_record = next((f for f in img.image_features if f.model_id == model_id), None)
        if not feature_record:
            print(f"No feature for image {img.id} and model {model_id}")
            continue
        
        int_feature_id = feature_record.feature_int_id
        if int_feature_id is None:
            continue

        try:
            vec = index.reconstruct(int_feature_id)
        except Exception as e:
            print(f"Reconstruct error for image {img.id}, feature_int_id={int_feature_id}: {e}")
            continue

        feature_vectors.append(vec)
        valid_image_ids.append(img.id)

    if not feature_vectors:
        return {"message": "No features found for the given images and model."}

    # 5. feature vector들을 numpy array로 변환
    try:
        feature_array = np.vstack(feature_vectors)  # shape: (n_samples, feature_dim)
    except Exception as e:
        print("Error during np.vstack of feature vectors:", e)
        raise HTTPException(status_code=500, detail="Failed to stack feature vectors")

    # 6. 차원 축소
    if method.lower() == "umap":
        try:
            sample_count = len(feature_array)

            if sample_count < 3:
                compressed = np.random.rand(sample_count, 2).astype(np.float32)
            else:
                safe_neighbors = max(2, sample_count - 1)

                reducer = UMAP(
                    n_components=2,
                    n_neighbors=safe_neighbors,
                    init="random",
                    random_state=42,
                    force_approximation_algorithm=True
                )
                compressed = reducer.fit_transform(feature_array)

        except Exception as e:
            print("UMAP reduction error:", e)
            raise HTTPException(status_code=500, detail="UMAP dimensionality reduction failed")

    # 7. 최종 결과 매핑
    coords = {img_id: compressed[i].tolist() for i, img_id in enumerate(valid_image_ids)}

    return {"featureCoordinates": coords}
