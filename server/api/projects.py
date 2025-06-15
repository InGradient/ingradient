from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid
from server.db.database import get_db
from server.db.models import Project, ProjectUser, User, RoleEnum, Dataset
from server.core.auth import get_current_user

router = APIRouter()

# ────────────────────────────────
# Pydantic Schemas
# ────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# ────────────────────────────────
# Helper utilities
# ────────────────────────────────

def _get_or_create_user(db: Session, email: str) -> User:
    """Fetch a User by email, or create the user record if it does not exist."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _project_response(project: Project) -> dict:
    """Serialize a Project SQLAlchemy model into a plain dict suitable for JSON."""
    created_ts = project.created_at.isoformat() if project.created_at else None
    updated_ts = project.updated_at.isoformat() if getattr(project, "updated_at", None) else created_ts
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "createdAt": created_ts,
        "updatedAt": updated_ts,
    }

# ────────────────────────────────
# Routes
# ────────────────────────────────

@router.get("/", tags=["projects"])
def list_projects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Return all projects that the authenticated user participates in."""
    email = current_user.get("identity", {}).get("traits", {}).get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    user = _get_or_create_user(db, email)
    projects = user.projects  # via relationship Project.users
    return [_project_response(p) for p in projects]


@router.post("/", status_code=201, tags=["projects"])
def create_project(
    payload: ProjectCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new project and associate the authenticated user as owner."""
    email = current_user.get("identity", {}).get("traits", {}).get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    user = _get_or_create_user(db, email)

    project = Project(
        id=str(uuid.uuid4()),
        name=payload.name,
        description=payload.description,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # link user as owner role
    project_user = ProjectUser(project_id=project.id, user_id=user.id, role=RoleEnum.owner)
    db.add(project_user)
    db.commit()

    return _project_response(project)


@router.get("/{project_id}", tags=["projects"])
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Return project details if authenticated user is a member of the project."""
    email = current_user.get("identity", {}).get("traits", {}).get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    user = _get_or_create_user(db, email)
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project not in user.projects:
        raise HTTPException(status_code=403, detail="Forbidden")

    return _project_response(project)


@router.put("/{project_id}", tags=["projects"])
def update_project(
    project_id: str,
    payload: ProjectUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update project details. Only users with owner or editor role can update."""
    email = current_user.get("identity", {}).get("traits", {}).get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    user = _get_or_create_user(db, email)
    project_user = db.query(ProjectUser).filter(
        ProjectUser.project_id == project_id, ProjectUser.user_id == user.id
    ).first()
    if not project_user or project_user.role not in [RoleEnum.owner, RoleEnum.editor]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description

    db.commit()
    db.refresh(project)
    return _project_response(project)


@router.delete("/{project_id}", status_code=204, tags=["projects"])
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a project. Only owner can delete."""
    email = current_user.get("identity", {}).get("traits", {}).get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    user = _get_or_create_user(db, email)
    project_user = db.query(ProjectUser).filter(
        ProjectUser.project_id == project_id, ProjectUser.user_id == user.id
    ).first()
    if not project_user or project_user.role != RoleEnum.owner:
        raise HTTPException(status_code=403, detail="Only owner can delete project")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete all project_users first
    db.query(ProjectUser).filter(ProjectUser.project_id == project_id).delete()
    db.delete(project)
    db.commit()
    return

@router.get("/{project_id}/datasets", tags=["projects"])
def list_project_datasets(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List datasets linked to the given project that current user participates in."""
    email = current_user.get("identity", {}).get("traits", {}).get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    user = _get_or_create_user(db, email)

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project not in user.projects:
        raise HTTPException(status_code=403, detail="Forbidden")

    datasets = project.datasets
    return [
        {
            "id": ds.id,
            "name": ds.name,
            "description": ds.description,
            "uploadedAt": ds.uploaded_at.isoformat() if ds.uploaded_at else None,
            "updatedAt": ds.updated_at.isoformat() if ds.updated_at else None,
        }
        for ds in datasets
    ]

@router.post("/{project_id}/datasets/{dataset_id}", status_code=204, tags=["projects"])
def attach_dataset_to_project(
    project_id: str,
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Link an existing dataset to a project (owner or editor only)."""
    email = current_user.get("identity", {}).get("traits", {}).get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    user = _get_or_create_user(db, email)
    project_user = db.query(ProjectUser).filter(
        ProjectUser.project_id == project_id, ProjectUser.user_id == user.id
    ).first()
    if not project_user or project_user.role not in [RoleEnum.owner, RoleEnum.editor]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if dataset not in project.datasets:
        project.datasets.append(dataset)
        db.commit()

    return 