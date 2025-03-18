# ingradient_sdk/classes.py
import uuid

class ClassAPI:
    """
    /classes 관련 API를 래핑하는 클래스
    """
    def __init__(self, client):
        self.client = client  # IngradientClient
    
    def get_list(self, dataset_id=None):
        """
        GET /classes (기본)
        GET /classes?dataset_id=... (가정) → 실제 구현은 서버에서 Query 파라미터를 어떻게 처리하는지에 따라 달라짐
        다만 서버 코드상에는 /classes? 가 dataset_id를 처리하는 로직이 없는 예시지만,
        원하는 경우 Query 파라미터로 dataset_id(s)를 넘길 수 있음.
        
        --> 실제 코드: dataset_id가 있으면 서버에서 필터링
        """
        # 예시: dataset_id가 list거나 str이라면 Query 파라미터로 넘긴다고 가정
        if dataset_id is None:
            return self.client.request("GET", "/api/classes")
        elif isinstance(dataset_id, str):
            # 직접적으로 /classes?dataset_id=xxx 와 같은 형식으로 호출해줘야 함
            return self.client.request("GET", "/api/classes", params={"dataset_id": dataset_id})
        elif isinstance(dataset_id, list):
            # 여러 개면 반복된 파라미터로 전달
            return self.client.request("GET", "/api/classes", params=[("dataset_id", ds) for ds in dataset_id])
        else:
            raise ValueError("dataset_id must be None, a string, or a list of strings.")
    
    def create(self, name: str, dataset_id: str):
        """
        POST /api/classes/{class_id} 로 'upsert' 방식 동작
        여기서는 새로운 클래스 ID를 생성하여 전송
        """
        class_id = str(uuid.uuid4())
        payload = {
            "name": name,
            "dataset_ids": [dataset_id]  # 필수
        }
        return self.client.request("POST", f"/api/classes/{class_id}", json=payload)
    
    def update(self, class_id: str, new_name: str = None, dataset_ids=None, image_ids=None):
        """
        PUT /classes/{class_id} 가 아니라, 실제 서버는 POST /classes/{class_id} (upsert_class) 또는
        PUT /classes/{class_id} (update_class) 둘 다 있음.

        여기서는 "이름 변경 등만 할 때" → PUT /classes/{class_id} 쓰거나
        데이터셋/이미지 연결까지 바꾸려면 POST /classes/{class_id}를 써야 하는데,
        서버 예시 코드상 "update_class"는 단순 필드만 바꿈, "upsert_class"는 관계까지 바꿔줌.
        """
        if new_name or dataset_ids or image_ids:
            # upsert_class = POST /classes/{class_id}
            payload = {}
            if new_name is not None:
                payload["name"] = new_name
            if dataset_ids is not None:
                payload["dataset_ids"] = dataset_ids
            if image_ids is not None:
                payload["image_ids"] = image_ids
            
            return self.client.request("POST", f"/api/classes/{class_id}", json=payload)
        else:
            # 아무 변경 없으면 그냥 GET
            return self.client.request("GET", f"/api/classes/{class_id}")
    
    def delete(self, class_id: str):
        """
        DELETE /api/classes/{class_id}
        """
        return self.client.request("DELETE", f"/api/classes/{class_id}")
