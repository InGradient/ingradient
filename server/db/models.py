from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from server.db.database import Base

# ↓↓↓ Many-to-Many 관계를 위한 테이블 import
from .association_tables import dataset_classes, dataset_images, class_images

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # M:N 관계: Dataset ↔ Class
    classes = relationship(
        "Class",
        secondary=dataset_classes,
        back_populates="datasets"
    )

    # M:N 관계: Dataset ↔ Image
    images = relationship(
        "Image",
        secondary=dataset_images,
        back_populates="datasets"
    )

    # 🔥 Dataset 내부에서 연결된 class_ids & image_ids 확인 가능하게 추가
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

    # M:N 관계: Class ↔ Dataset
    datasets = relationship(
        "Dataset",
        secondary=dataset_classes,
        back_populates="classes"
    )

    # M:N 관계: Class ↔ Image
    images = relationship(
        "Image",
        secondary=class_images,
        back_populates="classes"
    )

    # 🔥 Class 내부에서 연결된 dataset_ids & image_ids 확인 가능하게 추가
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
        back_populates="images"
    )

    @property
    def dataset_ids(self):
        return [ds.id for ds in self.datasets]

    @property
    def class_ids(self):
        return [cls.id for cls in self.classes]
