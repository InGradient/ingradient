from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from server.core.config import settings, ADMIN_EMAILS
from server.db.models import User
from sqlalchemy.orm import Session
from server.db.database import get_db
from passlib.context import CryptContext
import requests
import httpx
import logging

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def get_kratos_client() -> httpx.AsyncClient:
    """
    Create and return an httpx AsyncClient configured for Kratos API calls
    """
    logger = logging.getLogger(__name__)
    
    base_url = settings.KRATOS_PUBLIC_URL
    logger.debug(f"Creating Kratos client with base URL: {base_url}")
    
    return httpx.AsyncClient(
        base_url=base_url,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Session-Token": "",
            "X-CSRF-Token": ""
        },
        follow_redirects=True,
        timeout=30.0,
        verify=False  # 개발 환경에서만 사용
    )

async def test_kratos_connection():
    """
    Test the connection to Kratos server
    """
    logger = logging.getLogger(__name__)
    
    try:
        async with get_kratos_client() as client:
            response = await client.get("/health/ready")
            logger.debug(f"Kratos health check response: {response.status_code}")
            logger.debug(f"Kratos health check headers: {response.headers}")
            logger.debug(f"Kratos health check body: {response.text}")
            return response.status_code == 200
    except Exception as e:
        logger.error(f"Failed to connect to Kratos: {str(e)}", exc_info=True)
        return False

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current user information from Kratos session
    """
    try:
        # Validate Kratos session using public endpoint
        response = requests.get(
            f"{settings.KRATOS_PUBLIC_URL}/sessions/whoami",
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {credentials.credentials}",
            },
            timeout=10,
        )
        response.raise_for_status()
        session = response.json()
        email = session.get("identity", {}).get("traits", {}).get("email", "")
        # Compare emails in a case-insensitive manner
        session["is_admin"] = email.lower() in [e.lower() for e in ADMIN_EMAILS]
        return session
    except requests.exceptions.RequestException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_token(token: str) -> bool:
    """
    Verify token validity
    """
    try:
        response = requests.get(
            f"{settings.KRATOS_ADMIN_URL}/sessions/{token}"
        )
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False 