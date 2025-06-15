import os
import uvicorn
import logging
import sys
from fastapi import FastAPI, HTTPException, Depends, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, ValidationError, TypeAdapter, ConfigDict
from server.db.database import init_db
from server.api.datasets import router as datasets_router
from server.api.classes import router as classes_router
from server.api.images import router as images_router
from server.api.labels import router as labels_router
from server.api.uploads import router as uploads_router
from server.core.config import UPLOAD_DIR, TMP_FOLDER, settings
from server.api.models import router as model_router
from server.core.cleanup import start_cleanup_worker
import requests
from dotenv import load_dotenv
from server.api.auth import router as auth_router
from .api import admin
import json
import httpx
from typing import Optional
from server.core.auth import get_kratos_client, test_kratos_connection
from server.api.projects import router as projects_router

# Overwrite uvicorn's logging level
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
if not root_logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)

logger = logging.getLogger("ingradient")

load_dotenv()

# Pydantic models for request validation
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "password123"
            }
        }

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = Field(False, alias="rememberMe")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "password123",
                "rememberMe": False
            }
        }
    )

def create_app() -> FastAPI:
    app = FastAPI(title="Ingradient API")

    # CORS 설정
    FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://211.118.24.136:3000,http://localhost:3000").split(",")
    logger.debug(f"CORS allow_origins set to: {FRONTEND_ORIGINS}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=FRONTEND_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(request: Request, exc: ValidationError):
        logger.error(f"Validation error: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()}
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Global exception handler caught: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)}
        )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Request logging middleware"""
        logger.info(f"Request: {request.method} {request.url}")
        try:
            response = await call_next(request)
            logger.info(f"Response status: {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            raise

    # DB 초기화 및 API 라우터 등록
    init_db()
    app.include_router(datasets_router, prefix="/api/datasets", tags=["datasets"])
    app.include_router(classes_router, prefix="/api/classes", tags=["classes"])
    app.include_router(images_router, prefix="/api/images", tags=["images"])
    app.include_router(labels_router, prefix="/api/labels", tags=["labels"]) 
    app.include_router(uploads_router, prefix="/api/uploads", tags=["uploads"])
    app.include_router(model_router, prefix="/api/model", tags=["model"])
    app.include_router(auth_router)
    app.include_router(admin.router)
    app.include_router(projects_router, prefix="/api/projects", tags=["projects"])
    app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

    # Kratos 설정
    KRATOS_PUBLIC_URL = os.getenv("KRATOS_PUBLIC_URL", "http://localhost:4433")
    KRATOS_ADMIN_URL = os.getenv("KRATOS_ADMIN_URL", "http://localhost:4434")

    # 먼저 /ping 라우트 등록
    @app.get("/ping")
    def ping():
        return {"message": "pong"}

    @app.get("/")
    async def root():
        return {"message": "Welcome to Ingradient API"}

    # Mount root static files (after all other routes)
    static_dir = os.path.join(os.path.dirname(__file__), "..", "ingradient_sdk", "static")
    if os.path.exists(static_dir):
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="app")
    
    return app

app = create_app()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
