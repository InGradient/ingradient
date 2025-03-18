# ingradient_sdk/images.py
import uuid
import os

class ImageAPI:
    """
    /images 관련 API를 래핑하는 클래스
    """
    def __init__(self, client):
        self.client = client  # IngradientClient 인스턴스

    def get_list(self, dataset_id=None):
        """
        GET /api/images?dataset_ids=...
        특정 데이터셋(또는 여러 데이터셋)에 속한 이미지를 조회
        dataset_id가 None이면 모든 이미지를 가져옴
        dataset_id가 단일 str이면 해당 데이터셋,
        dataset_id가 list면 여러 데이터셋
        """
        if dataset_id is None:
            return self.client.request("GET", "/api/images")
        elif isinstance(dataset_id, str):
            return self.client.request("GET", "/api/images", params={"dataset_ids": dataset_id})
        elif isinstance(dataset_id, list):
            # 여러 데이터셋이면 Query 파라미터를 여러 번 붙이거나, requests에 튜플로 전달
            return self.client.request("GET", "/api/images", params=[("dataset_ids", ds) for ds in dataset_id])
        else:
            raise ValueError("dataset_id must be None, a string, or a list of strings.")
    
    def upload(self, dataset_id, file_path=None, file_paths=None):
        """
        서버에서 정의된 API:
          - POST /api/images/{image_id} 형태로 'upsert'개념으로 동작
          - 우리는 'upload' 시 ID를 직접 생성해서 전송

        dataset_id가 list인 경우, 여러 데이터셋에 연결
        """
        if file_paths is None and file_path is None:
            raise ValueError("file_path or file_paths must be provided.")

        # 업로드할 파일 경로들을 리스트 형태로 통일
        paths = file_paths if file_paths else [file_path]

        results = []
        for p in paths:
            image_id = str(uuid.uuid4())  # 새 이미지 ID를 임의로 생성
            payload = {
                "filename": os.path.basename(p),
                "file_location": p,
                "dataset_ids": dataset_id if isinstance(dataset_id, list) else [dataset_id]
            }
            # POST /images/{image_id}
            resp = self.client.request("POST", f"/api/images/{image_id}", json=payload)
            results.append(resp)

        return results if len(results) > 1 else results[0]

    def update(self, image_id: str, dataset_ids=None, class_ids=None, **kwargs):
        """
        특정 이미지를 업데이트(메타데이터, 연결된 데이터셋/클래스 등).
        실제 서버에서는 POST /api/images/{image_id} 로 upsert하므로 동일 엔드포인트 사용.
        """
        payload = {}
        
        if dataset_ids is not None:
            # 완전 교체를 원하면 server쪽에서는 img.datasets.clear() 후 다시 추가하는 로직
            payload["dataset_ids"] = dataset_ids
        
        if class_ids is not None:
            payload["class_ids"] = class_ids
        
        # 그 외 필드들(e.g. "filename", "properties" 등)은 kwargs로 처리
        for k, v in kwargs.items():
            payload[k] = v
        
        return self.client.request("POST", f"/api/images/{image_id}", json=payload)

    def delete(self, image_id: str, dataset_ids=None):
        """
        DELETE /api/images/{image_id}?selected_dataset_ids=...
        dataset_ids가 주어지면 해당 데이터셋과의 연결만 제거,
        아니면 완전 삭제
        """
        params = []
        if dataset_ids:
            if isinstance(dataset_ids, str):
                params = [("selected_dataset_ids", dataset_ids)]
            elif isinstance(dataset_ids, list):
                params = [("selected_dataset_ids", ds) for ds in dataset_ids]
        
        return self.client.request("DELETE", f"/api/images/{image_id}", params=params)
