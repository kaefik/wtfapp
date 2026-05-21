from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.dependencies import get_db, get_current_user, require_role
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.report import ReportCreate, ReportResolve, ReportResponse
from app.services.report import create_report, list_reports, resolve_report

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.post("/", status_code=201, response_model=ReportResponse)
async def create_report_endpoint(
    data: ReportCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    report = await create_report(
        db, data.target_type, str(data.target_id), str(user.id),
        data.reason, data.description,
    )
    return ReportResponse.model_validate(report)


@router.get("/")
async def list_reports_endpoint(
    status: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    cursor: Optional[str] = None,
    user: User = Depends(require_role(UserRole.MODERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await list_reports(db, status, limit, cursor)


@router.patch("/{report_id}", response_model=ReportResponse)
async def resolve_report_endpoint(
    report_id: str,
    data: ReportResolve,
    user: User = Depends(require_role(UserRole.MODERATOR, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    report = await resolve_report(db, report_id, str(user.id), data.status)
    return ReportResponse.model_validate(report)
