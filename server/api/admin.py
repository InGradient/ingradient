from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..core.auth import get_current_user
from ..db.database import get_db
from sqlalchemy.orm import Session
from ..db.models import User

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
async def get_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all users (admin only)
    """
    # Check if user is admin
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access admin features"
        )
    
    # Get all users from database
    db_users = db.query(User).all()

    if not db_users:
        # Fall back to current Kratos identity list (only current user)
        identity = current_user.get("identity", {})
        email = identity.get("traits", {}).get("email", "")
        user_id = identity.get("id", "")
        created_at = identity.get("created_at")
        return [{
            "id": user_id,
            "email": email,
            "created_at": created_at,
            "is_active": True,
        }]

    # Serialize SQLAlchemy objects to dict
    return [
        {
            "id": u.id,
            "email": u.email,
            "created_at": u.created_at,
            "is_active": True,
        }
        for u in db_users
    ] 