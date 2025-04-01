import os
import uvicorn
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from server.db.database import init_db
from server.api.datasets import router as datasets_router
from server.api.classes import router as classes_router
from server.api.images import router as images_router
from server.api.labels import router as labels_router
from server.api.uploads import router as uploads_router
from server.core.config import UPLOAD_DIR, TMP_FOLDER
from server.api.models import router as model_router
from server.core.cleanup import start_cleanup_worker

logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

def create_app() -> FastAPI:
    app = FastAPI()

    # ---- CORS 설정 ----
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- DB 초기화 및 API 라우터 등록 ----
    init_db()
    app.include_router(datasets_router, prefix="/api/datasets", tags=["datasets"])
    app.include_router(classes_router, prefix="/api/classes", tags=["classes"])
    app.include_router(images_router, prefix="/api/images", tags=["images"])
    app.include_router(labels_router, prefix="/api/labels", tags=["labels"]) 
    app.include_router(uploads_router, prefix="/api/uploads", tags=["uploads"])
    app.include_router(model_router, prefix="/api/model", tags=["model"])
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

    # 먼저 /ping 라우트 등록
    @app.get("/ping")
    def ping():
        return {"message": "pong"}

    # 그 후에 정적 파일을 루트 경로에 마운트
    static_dir = os.path.join(os.path.dirname(__file__), "..", "ingradient_sdk", "static")
    if os.path.exists(static_dir):
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")
    
    return app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
