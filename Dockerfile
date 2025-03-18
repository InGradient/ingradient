# 1단계: Next.js 프론트엔드 빌드
FROM node:16 AS frontend

# 작업 디렉토리 설정
WORKDIR /app/web

# 프론트엔드 소스 복사
COPY web/ ./

# npm 의존성 설치 및 빌드
RUN npm install && npm run build

# 2단계: Python 기반 최종 이미지
FROM python:3.9-slim

# 작업 디렉토리 설정
WORKDIR /app

# 프론트엔드 빌드 결과 복사 (build 폴더만 포함)
COPY --from=frontend /app/web/build ./web/build

# Python 프로젝트 소스 복사
COPY . ./

# 패키지 설치 (setup.py를 이용한 설치)
RUN pip install --no-cache-dir .

# 기본 포트 노출 (예: 8000)
EXPOSE 8000

# 컨테이너 시작 시 ingradient 명령어 실행
CMD ["ingradient"]
