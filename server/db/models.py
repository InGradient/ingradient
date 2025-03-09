import enum
from sqlalchemy import (
    Column, Integer, String, DateTime, JSON, Enum, ForeignKey, Float
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from server.db.database import Base

from .association_tables import (
    dataset_classes,
    dataset_images,
    class_images,
    project_datasets
)

class RoleEnum(str, enum.Enum):
    viewer = "viewer"
    editor = "editor"
    owner = "owner"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project_users = relationship("ProjectUser", back_populates="user")
    projects = relationship("Project", secondary="project_users", back_populates="users")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project_users = relationship("ProjectUser", back_populates="project")
    users = relationship("User", secondary="project_users", back_populates="projects")
    datasets = relationship("Dataset", secondary=project_datasets, back_populates="projects")


class ProjectUser(Base):
    """
    Project ↔ User 사이의 중간 테이블(Association Object).
    `role` 컬럼을 추가로 저장하기 위해 별도 모델로 선언.
    """
    __tablename__ = "project_users"

    project_id = Column(String, ForeignKey("projects.id"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.viewer, nullable=False)

    project = relationship("Project", back_populates="project_users")
    user = relationship("User", back_populates="project_users")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Dataset ↔ Class 관계
    classes = relationship("Class", secondary=dataset_classes, back_populates="datasets")

    # Dataset ↔ Image 관계
    images = relationship("Image", secondary=dataset_images, back_populates="datasets")

    # ✅ **추가된 부분: Dataset ↔ Project 관계**
    projects = relationship("Project", secondary=project_datasets, back_populates="datasets")

    @property
    def class_ids(self):
        return [cls.id for cls in self.classes]

    @property
    def image_ids(self):
        return [img.id for img in self.images]


class Class(Base):
    __tablename__ = "classes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    datasets = relationship(
        "Dataset",
        secondary=dataset_classes,
        back_populates="classes"
    )
    images = relationship(
        "Image",
        secondary=class_images,
        back_populates="classes"
    )

    # ─────────────── 추가: BoundingBox/KeyPoint/Segmentation 역참조 ───────────────
    bounding_boxes = relationship("BoundingBox", back_populates="class_")
    keypoints = relationship("KeyPoint", back_populates="class_")
    segmentations = relationship("Segmentation", back_populates="class_")
    # ──────────────────────────────────────────────────────────────────────────────

    @property
    def dataset_ids(self):
        return [ds.id for ds in self.datasets]

    @property
    def image_ids(self):
        return [img.id for img in self.images]


class Image(Base):
    __tablename__ = "images"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_location = Column(String, nullable=True)
    thumbnail_location = Column(String, nullable=True)
    upload_at = Column(DateTime(timezone=True), server_default=func.now())

    properties = Column(JSON, nullable=True, default={"description": "", "comment": ""})
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    approval = Column(String, nullable=True)
    comment = Column(String, nullable=True)
    labeled_by = Column(String, nullable=True)
    edited_by = Column(String, nullable=True)
    uploaded_by = Column(String, nullable=True)

    height = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    type = Column(String, nullable=True)
    size = Column(Integer, nullable=True)

    datasets = relationship(
        "Dataset",
        secondary=dataset_images,
        back_populates="images"
    )
    classes = relationship(
        "Class",
        secondary=class_images,
        back_populates="images",
        cascade="save-update, merge"
    )

    # ─────────────── 추가: BoundingBox/KeyPoint/Segmentation 역참조 ───────────────
    bounding_boxes = relationship("BoundingBox", back_populates="image")
    keypoints = relationship("KeyPoint", back_populates="image")
    segmentations = relationship("Segmentation", back_populates="image")
    # ──────────────────────────────────────────────────────────────────────────────

    @property
    def dataset_ids(self):
        return [ds.id for ds in self.datasets]

    @property
    def class_ids(self):
        return [cls.id for cls in self.classes]

class BoundingBox(Base):
    __tablename__ = "bounding_boxes"

    id = Column(String, primary_key=True, index=True)
    image_id = Column(
        String,
        ForeignKey("images.id", ondelete="CASCADE"),  # ON DELETE CASCADE는 선택사항
        nullable=False,
        index=True
    )
    class_id = Column(
        String,
        ForeignKey("classes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    x_min = Column(Float, nullable=False)
    y_min = Column(Float, nullable=False)
    x_max = Column(Float, nullable=False)
    y_max = Column(Float, nullable=False)

    confidence = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # relationships
    image = relationship("Image", back_populates="bounding_boxes")
    class_ = relationship("Class", back_populates="bounding_boxes")


class KeyPoint(Base):
    __tablename__ = "keypoints"

    id = Column(String, primary_key=True, index=True)
    image_id = Column(String, ForeignKey("images.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(String, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)

    # 좌표 (예: 단일 점)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)

    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # relationships
    image = relationship("Image", back_populates="keypoints")
    class_ = relationship("Class", back_populates="keypoints")


class Segmentation(Base):
    __tablename__ = "segmentations"

    id = Column(String, primary_key=True, index=True)
    image_id = Column(
        String,
        ForeignKey("images.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    class_id = Column(
        String,
        ForeignKey("classes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    # mask 데이터를 JSON으로 저장 (예: COCO RLE, 폴리곤 등)
    mask = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # relationships
    image = relationship("Image", back_populates="segmentations")
    class_ = relationship("Class", back_populates="segmentations")
