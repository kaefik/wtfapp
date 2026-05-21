import datetime
from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: Optional[str] = Field(None, max_length=2000)


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    text: Optional[str] = Field(None, max_length=2000)


class ReviewResponse(BaseModel):
    id: UUID
    toilet_id: UUID
    user_id: UUID
    rating: int
    text: Optional[str] = None
    photo_urls: list[str] = []
    user_nickname: str = ""
    user_avatar_url: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class ReviewListParams(BaseModel):
    cursor: Optional[str] = None
    limit: int = Field(20, ge=1, le=50)
