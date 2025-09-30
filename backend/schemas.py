# schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --------------------------
# User
# --------------------------

# 기본 User 속성
class UserBase(BaseModel):
    user_name: str
    email: EmailStr

# User 생성 시 필요한 데이터
class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    # ⚠️ password 필드가 모델에 있어도 응답 스키마에 없으면 FastAPI가 에러를 낼 수 있음.
    # 안전하게 모델의 모든 필드를 명시하거나, 아니면 Response에서 숨길 필드를 잘 설정해야 함.
    
    # 💥 지금은 DB에 평문 비번이 있으므로, 임시로 password를 응답 스키마에 추가해야 로직이 작동함.
    # **********************************************
    # 🚨🚨🚨 임시 방편으로 password를 추가해서 500 에러를 피하자. 🚨🚨🚨
    password: str # ⚠️⚠️⚠️ 보안 취약! 테스트 후에 꼭 제거하거나 /login 엔드포인트로 바꿔야 함.
    # **********************************************

    class Config:
        orm_mode = True
        # from_attributes = True # Pydantic v2용


# --------------------------
# Post
# --------------------------

# 기본 Post 속성
class PostBase(BaseModel):
    title: str
    picture: Optional[str] = None
    # completed: bool = False
    user_id: int

# Post 생성 시 필요한 데이터
class PostCreate(PostBase):
    pass

# 응답으로 돌려줄 Post 데이터
class PostResponse(PostBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
