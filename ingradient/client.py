import requests

class Ingradient:
    def __init__(self, base_url="http://localhost:8000"):
        # URL 끝의 슬래시 제거하여 일관된 API 호출을 보장
        self.base_url = base_url.rstrip("/")

    def upload_image(self, file_path):
        """
        주어진 파일을 FastAPI 서버에 업로드합니다.
        :param file_path: 업로드할 이미지 경로
        :return: API 서버의 응답 JSON
        """
        url = f"{self.base_url}/upload-image"
        with open(file_path, "rb") as f:
            files = {"file": f}
            response = requests.post(url, files=files)
        return response.json()

    def download_file(self, filename):
        """
        지정한 파일을 FastAPI 서버에서 다운로드할 수 있는 경로를 반환합니다.
        :param filename: 다운로드할 파일 이름
        :return: 파일 경로 또는 오류 메시지
        """
        url = f"{self.base_url}/download/{filename}"
        response = requests.get(url)
        return response.json()
