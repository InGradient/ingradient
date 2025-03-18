# ingradient_sdk/model.py
import requests

class ModelAPI:
    def __init__(self, client):
        self.client = client  # IngradientClient 인스턴스

    def inference(self, data: list):
        """
        기존 인퍼런스 호출 (예시)
        """
        payload = {"data": data}
        return self.client.request("POST", "/api/model/inference", json=payload)

    def upload(self, model_file_path: str, model_name: str, input_width: int, input_height: int):
        """
        모델 파일 업로드와 관련된 API 호출.
        파일은 multipart/form-data 형식으로 전송.
        """
        url = f"{self.client.base_url}/api/model/upload"
        with open(model_file_path, "rb") as f:
            files = {"model_file": (model_file_path.split("/")[-1], f)}
            data = {
                "model_name": model_name,
                "input_width": input_width,
                "input_height": input_height
            }
            resp = requests.post(url, files=files, data=data)
            resp.raise_for_status()
            return resp.json()

    def list(self):
        """
        등록된 모델 목록 조회 API 호출.
        """
        return self.client.request("GET", "/api/model/list")
