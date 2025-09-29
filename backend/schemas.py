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

# 응답으로 돌려줄 User 데이터
class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# --------------------------
# Post
# --------------------------

# 기본 Post 속성
class PostBase(BaseModel):
    title: str
    picture: Optional[str] = None
    completed: bool = False
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
