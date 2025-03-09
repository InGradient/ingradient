from sqlalchemy import Table, Column, ForeignKey

from server.db.database import Base

dataset_classes = Table(
    "dataset_classes",
    Base.metadata,
    Column("dataset_id", ForeignKey("datasets.id"), primary_key=True),
    Column("class_id", ForeignKey("classes.id"), primary_key=True),
)

dataset_images = Table(
    "dataset_images",
    Base.metadata,
    Column("dataset_id", ForeignKey("datasets.id"), primary_key=True),
    Column("image_id", ForeignKey("images.id"), primary_key=True),
)

class_images = Table(
    "class_images",
    Base.metadata,
    Column("class_id", ForeignKey("classes.id"), primary_key=True),
    Column("image_id", ForeignKey("images.id"), primary_key=True),
)

project_datasets = Table(
    "project_datasets",
    Base.metadata,
    Column("project_id", ForeignKey("projects.id"), primary_key=True),
    Column("dataset_id", ForeignKey("datasets.id"), primary_key=True),
)