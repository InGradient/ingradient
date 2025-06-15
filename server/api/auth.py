from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import requests
import logging
from ..core.config import settings, ADMIN_EMAILS
from ..core.auth import get_current_user

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str
    remember_me: bool = False

class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

@router.post("/register-legacy")
async def register(email: str, password: str):
    """
    Kratos를 통한 회원가입 (API 모드)
    """
    try:
        logging.info(f"Starting registration process for email: {email}")
        
        # 1. Registration flow 초기화
        flow_url = f"{settings.KRATOS_PUBLIC_URL}/self-service/registration/api"
        logging.info(f"Requesting registration flow from: {flow_url}")
        
        flow_response = requests.get(
            flow_url,
            headers={"Accept": "application/json"}
        )
        flow_response.raise_for_status()
        flow = flow_response.json()
        
        # 2. Registration flow 제출
        register_url = flow["ui"]["action"]
        logging.info(f"Submitting registration to: {register_url}")
        
        register_response = requests.post(
            register_url,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            json={
                "traits": {
                    "email": email
                },
                "password": password,
                "method": "password"
            }
        )
        register_response.raise_for_status()
        return register_response.json()
        
    except requests.exceptions.RequestException as e:
        error_detail = {
            "error": str(e),
            "response": None
        }
        
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail["response"] = e.response.text
            except Exception:
                error_detail["response"] = str(e.response)
        
        logging.error(f"Registration error: {error_detail}")
        raise HTTPException(status_code=400, detail=error_detail)

@router.post("/login-legacy")
async def login(email: str, password: str):
    """
    Kratos를 통한 로그인 (API 모드)
    """
    try:
        logging.info(f"Starting login process for email: {email}")
        
        # 1. Login flow 초기화
        flow_url = f"{settings.KRATOS_PUBLIC_URL}/self-service/login/api"
        logging.info(f"Requesting login flow from: {flow_url}")
        
        flow_response = requests.get(
            flow_url,
            headers={"Accept": "application/json"}
        )
        flow_response.raise_for_status()
        flow = flow_response.json()
        
        # 2. Login flow 제출
        login_url = flow["ui"]["action"]
        logging.info(f"Submitting login to: {login_url}")
        
        login_response = requests.post(
            login_url,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            json={
                "identifier": email,
                "password": password,
                "method": "password"
            }
        )
        login_response.raise_for_status()
        return login_response.json()
        
    except requests.exceptions.RequestException as e:
        error_detail = {
            "error": str(e),
            "response": None
        }
        
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail["response"] = e.response.text
            except Exception:
                error_detail["response"] = str(e.response)
        
        logging.error(f"Login error: {error_detail}")
        raise HTTPException(status_code=400, detail=error_detail)

@router.get("/session")
async def get_session(session_token: str):
    """Get session information via Kratos public whoami endpoint (using session token)."""
    try:
        response = requests.get(
            f"{settings.KRATOS_PUBLIC_URL}/sessions/whoami",
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {session_token}",
            },
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Session error: {str(e)}")
        if hasattr(e, "response") and e.response is not None:
            logger.error(f"Response content: {e.response.text}")
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Session retrieval failed",
                "error": str(e),
                "response": e.response.text if hasattr(e, "response") else None,
            },
        )

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user information
    """
    return current_user
