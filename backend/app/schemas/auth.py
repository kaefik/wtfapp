import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import UserRole
from uuid import UUID
from typing import Optional


class RegisterRequest(BaseModel):
    nickname: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    birth_date: Optional[datetime.date] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    nickname: str
    email: str
    full_name: Optional[str] = None
    birth_date: Optional[datetime.date] = None
    role: UserRole
    is_active: bool
    is_email_verified: bool
    avatar_url: Optional[str] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    nickname: Optional[str] = Field(None, min_length=2, max_length=50)
    full_name: Optional[str] = Field(None, max_length=150)
    birth_date: Optional[datetime.date] = None


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
