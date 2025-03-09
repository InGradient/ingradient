# server/db/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./ingradient.db"
engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ---- 여기서 Base를 선언 ----
Base = declarative_base()

def init_db():
    """
    모든 모델을 실제로 로드하여 Base.metadata.create_all 이
    테이블 생성을 인식할 수 있도록 모델 임포트를 해주어야 합니다.
    """
    from server.db import models
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
