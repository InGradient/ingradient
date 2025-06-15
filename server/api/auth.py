from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, ValidationError, TypeAdapter, ConfigDict
from typing import Optional
from datetime import datetime
import requests
import logging
from ..core.config import settings, ADMIN_EMAILS
from ..core.auth import get_current_user, get_kratos_client, test_kratos_connection
import httpx

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    email: str
    password: str

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

# -------------------------
# Modern Auth Endpoints
# -------------------------

@router.post("/register")
async def register(request: Request):
    """Register a new user using Kratos API mode (async)"""
    try:
        # Test Kratos connection first
        kratos_available = await test_kratos_connection()
        if not kratos_available:
            logger.error("Kratos server is not available")
            return JSONResponse(
                status_code=503,
                content={"detail": "Authentication service is not available"}
            )

        # Parse form data
        form_data = await request.form()
        email = form_data.get("email")
        password = form_data.get("password")

        if not email or not password:
            return JSONResponse(
                status_code=422,
                content={"detail": "Email and password are required"}
            )

        # Validate email format
        try:
            TypeAdapter(EmailStr).validate_python(email)
        except ValidationError as e:
            logger.error(f"Invalid email format for {email}: {str(e)}")
            return JSONResponse(
                status_code=422,
                content={"detail": "Invalid email format"}
            )

        # Validate password length
        if len(password) < 8:
            return JSONResponse(
                status_code=422,
                content={"detail": "Password must be at least 8 characters long"}
            )

        async with get_kratos_client() as client:
            try:
                # Get registration flow
                flow_response = await client.get("/self-service/registration/api")
                if flow_response.status_code != 200:
                    logger.error(f"Failed to get registration flow: {flow_response.text}")
                    return JSONResponse(
                        status_code=flow_response.status_code,
                        content={"detail": "Failed to initialize registration flow"}
                    )

                flow_data = flow_response.json()
                flow_id = flow_data.get("id")
                if not flow_id:
                    logger.error("No flow ID in Kratos registration response")
                    return JSONResponse(
                        status_code=500,
                        content={"detail": "Invalid flow response"}
                    )

                # Get CSRF token from flow data
                csrf_token = None
                for node in flow_data.get("ui", {}).get("nodes", []):
                    if node.get("attributes", {}).get("name") == "csrf_token":
                        csrf_token = node.get("attributes", {}).get("value")
                        break

                # Submit registration
                submit_url = flow_data["ui"]["action"]
                submit_data = {
                    "method": "password",
                    "password": password,
                    "traits": {
                        "email": email
                    }
                }
                if csrf_token:
                    submit_data["csrf_token"] = csrf_token

                submit_response = await client.post(
                    submit_url.replace("http://0.0.0.0:4433", ""),
                    json=submit_data
                )

                if submit_response.status_code != 200:
                    error_data = submit_response.json()
                    logger.error(f"Kratos registration failed: {error_data}")
                    return JSONResponse(
                        status_code=submit_response.status_code,
                        content={"detail": error_data}
                    )

                logger.info(f"User {email} registered successfully.")
                return submit_response.json()

            except Exception as e:
                logger.error(f"Error during registration process: {str(e)}", exc_info=True)
                return JSONResponse(
                    status_code=500,
                    content={"detail": f"Registration error: {str(e)}"}
                )

    except Exception as e:
        logger.error(f"Unexpected error in /auth/register endpoint: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": f"Unexpected error: {str(e)}"}
        )


@router.post("/login")
async def login(user_data: UserLogin):
    """Login using Kratos API mode (async)"""
    try:
        flow_url = f"{settings.KRATOS_PUBLIC_URL}/self-service/login/api"
        flow_response = requests.get(
            flow_url,
            headers={"Accept": "application/json"}
        )
        flow_response.raise_for_status()
        flow = flow_response.json()

        # Submit login flow
        login_url = flow["ui"]["action"]
        login_data = {
            "identifier": user_data.email,
            "password": user_data.password,
            "method": "password"
        }
        login_response = requests.post(
            login_url,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            json=login_data
        )
        login_response.raise_for_status()
        response_data = login_response.json()
        logger.info(f"User {user_data.email} logged in successfully.")
        return response_data

    except requests.exceptions.RequestException as e:
        error_detail = {"error": str(e), "response": None}
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail["response"] = e.response.text
            except Exception:
                error_detail["response"] = str(e.response)

        logger.error(f"Login failed for user {user_data.email}: {error_detail}")
        raise HTTPException(status_code=400, detail=error_detail)
