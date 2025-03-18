# ingradient_sdk/dataset.py
class DatasetAPI:
    """
    /datasets 관련 API를 래핑하는 클래스
    """
    def __init__(self, client):
        self.client = client  # IngradientClient 인스턴스
    
    def get_list(self):
        """
        GET /api/datasets
        모든 데이터셋 목록 가져오기
        """
        return self.client.request("GET", "/api/datasets")
    
    def get(self, dataset_id: str):
        """
        GET /api/datasets/{dataset_id}
        특정 데이터셋 정보 가져오기
        """
        return self.client.request("GET", f"/api/datasets/{dataset_id}")
    
    def create(self, name: str, description: str = ""):
        """
        POST /api/datasets
        새로운 데이터셋 생성
        """
        payload = {"name": name, "description": description}
        return self.client.request("POST", "/api/datasets", json=payload)
    
    def update(self, dataset_id: str, new_name: str = None, description: str = None):
        """
        PUT /api/datasets/{dataset_id}
        기존 데이터셋 정보 수정
        """
        data = {}
        if new_name is not None:
            data["name"] = new_name
        if description is not None:
            data["description"] = description
        
        return self.client.request("PUT", f"/api/datasets/{dataset_id}", json=data)
    
    def delete(self, dataset_id: str):
        """
        DELETE /api/datasets/{dataset_id}
        데이터셋 삭제
        """
        return self.client.request("DELETE", f"/api/datasets/{dataset_id}")
