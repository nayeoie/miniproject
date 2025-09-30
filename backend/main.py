# main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import engine, get_db

# DB 테이블 생성 (없으면 자동 생성)
models.Base.metadata.create_all(bind=engine)

# FastAPI 인스턴스
app = FastAPI(
    title="Idol Board API",
    description="아이돌 덕질 게시판 백엔드",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # ⚠️ 모든 출처 허용! (이러면 CORS 에러는 100% 사라져야 해)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# 루트 엔드포인트
# ---------------------------
@app.get("/")
async def root():
    return {"message": "아이돌 덕질 게시판 API 서버 실행 중!"}

# ---------------------------
# Users 엔드포인트
# ---------------------------
@app.post("/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 이메일 중복 체크
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")
    
    new_user = models.User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
# 유저 데이터를 가져오는데 실패 하면 404 에러 발생
@app.get("/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

# ---------------------------
# Posts 엔드포인트
# ---------------------------
@app.post("/posts", response_model=schemas.PostResponse)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db)):
    # user_id가 실제 존재하는지 확인
    db_user = db.query(models.User).filter(models.User.id == post.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="해당 유저가 존재하지 않습니다.")
    
    new_post = models.Post(**post.dict())
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@app.get("/posts", response_model=List[schemas.PostResponse])
def get_posts(db: Session = Depends(get_db)):
    return db.query(models.Post).all()
