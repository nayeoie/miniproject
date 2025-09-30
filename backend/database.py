# database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ⚠️ 본인 MySQL 계정/비밀번호/DB명에 맞게 수정
DATABASE_URL = "mysql+pymysql://root:qpwl7584@localhost:3306/idol_board"

# DB 엔진 생성
engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True, pool_recycle=300)

# 세션 로컬 (DB와 연결된 세션 객체)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스 (모델들이 상속받을 클래스)
Base = declarative_base()

# 의존성 주입에서 사용할 DB 세션 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
