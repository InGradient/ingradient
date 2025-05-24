# ingradient_sdk/base_plugin.py

class BasePlugin:
    """
    모든 플러그인이 상속받아야 할 기본 클래스.
    """
    name = "BasePlugin"
    version = "0.1.0"

    def run(self, data: dict) -> dict:
        """
        플러그인이 실행될 때 호출되는 메서드.
        data는 JSON 형태의 입력 데이터(예: 이미지 경로, 파라미터 등).
        반환값도 dict 형태.
        """
        raise NotImplementedError("Plugin must implement run() method.")
