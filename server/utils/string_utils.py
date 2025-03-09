import re
from datetime import datetime

def to_snake_case(camel_str):
    """camelCase를 snake_case로 변환하는 함수"""
    return re.sub(r'(?<!^)(?=[A-Z])', '_', camel_str).lower()

def to_camel_case(snake_str):
    """snake_case를 camelCase로 변환하는 함수"""
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])

def recursive_to_snake_case(data):
    """딕셔너리, 리스트 내부까지 모든 키를 snake_case로 변환"""
    if isinstance(data, dict):
        return {to_snake_case(k): recursive_to_snake_case(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [recursive_to_snake_case(item) for item in data]
    else:
        return data  # 기본 데이터 타입은 그대로 반환

def parse_datetime(value):
    """문자열을 datetime 객체로 변환. 이미 datetime이면 그대로 반환."""
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return datetime.utcnow()
    return datetime.utcnow()