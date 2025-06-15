# my_app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

# Load environment variables from .env file (project root)
load_dotenv()

class Settings(BaseSettings):
    # Kratos settings
    KRATOS_PUBLIC_URL: str = os.getenv("KRATOS_PUBLIC_URL", "http://localhost:4433")
    KRATOS_ADMIN_URL: str = os.getenv("KRATOS_ADMIN_URL", "http://localhost:4434")
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

# Global variables
DATABASE_URL = settings.DATABASE_URL
UPLOAD_DIR = "./static"
MODEL_UPLOAD_DIR = os.path.join(UPLOAD_DIR, 'models')
TMP_FOLDER = "./.tmp"

# Create directories if they don't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "images"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "thumbnails"), exist_ok=True)
os.makedirs(MODEL_UPLOAD_DIR, exist_ok=True)
os.makedirs(TMP_FOLDER, exist_ok=True)

ADMIN_EMAILS = [e.strip() for e in os.getenv("ADMIN_EMAILS", "june@ingradient.ai").split(",") if e.strip()]
