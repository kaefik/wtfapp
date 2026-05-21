import datetime
from pydantic import BaseModel, Field
from app.models.enums import ReportTargetType, ReportReason, ReportStatus, UserRole
from uuid import UUID
from typing import Optional


class ReportCreate(BaseModel):
    target_type: ReportTargetType
    target_id: UUID
    reason: ReportReason
    description: Optional[str] = Field(None, max_length=2000)


class ReportResolve(BaseModel):
    status: ReportStatus


class ReportResponse(BaseModel):
    id: UUID
    target_type: ReportTargetType
    target_id: UUID
    reporter_id: UUID
    reason: ReportReason
    description: Optional[str] = None
    status: ReportStatus
    resolved_by: Optional[UUID] = None
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None

    model_config = {"from_attributes": True}


class PhotoResponse(BaseModel):
    id: UUID
    url: str
    description: Optional[str] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserListItem(BaseModel):
    id: UUID
    nickname: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    items: list[UserListItem]
    next_cursor: Optional[str] = None
    total: int
