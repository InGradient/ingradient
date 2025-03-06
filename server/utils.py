import re

def to_snake_case(camel_str):
    """camelCase를 snake_case로 변환하는 함수"""
    return re.sub(r'(?<!^)(?=[A-Z])', '_', camel_str).lower()

def to_camel_case(snake_str):
    """snake_case를 camelCase로 변환하는 함수"""
    components = snake_str.split("_")
    return components[0] + "".join(x.title() for x in components[1:])
