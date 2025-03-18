# ingradient_sdk/client.py
import requests
import uuid

class IngradientClient:
    """
    공통 HTTP 통신 로직을 수행하는 간단한 래퍼 클래스입니다.
    """
    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url.rstrip("/")
    
    def request(self, method, endpoint, **kwargs):
        """
        예: self.request("GET", "/datasets", params={"key": "value"})
        """
        url = f"{self.base_url}{endpoint}"
        resp = requests.request(method, url, **kwargs)
        resp.raise_for_status()  # 상태 코드가 400 이상이면 예외 발생
        return resp.json()


class Ingradient:
    """
    사용자 편의를 위한 통합 클래스.
    datasets.py, images.py, classes.py에서 정의한 API 래퍼를 여기서 묶어서 제공.
    """
    def __init__(self, url="http://127.0.0.1:8000"):
        from .datasets import DatasetAPI
        from .images import ImageAPI
        from .classes import ClassAPI
        from .model import ModelAPI  

        self.client = IngradientClient(base_url=url)

        # 서버 연결 테스트: /ping 엔드포인트를 호출하여 서버 연결을 확인
        try:
            response = self.client.request("GET", "/ping")
            print(f"Server connection successful: {response}")
        except Exception as e:
            print(f"Server connection failed: {e}")
            raise e

        # 하위 기능들 초기화
        self.dataset = DatasetAPI(self.client)
        self.image = ImageAPI(self.client)
        self.classes = ClassAPI(self.client)
        self.model = ModelAPI(self.client)
        
        print(f"Ingradient SDK initialized with base URL: {url}")
