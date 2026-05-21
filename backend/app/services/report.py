from datetime import datetime, timezone
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError, ForbiddenError
from app.models.report import Report
from app.models.user import User
from app.models.enums import UserRole, ReportStatus


async def create_report(
    db: AsyncSession,
    target_type: str,
    target_id: str,
    reporter_id: str,
    reason: str,
    description: str | None = None,
) -> Report:
    report = Report(
        target_type=target_type,
        target_id=target_id,
        reporter_id=reporter_id,
        reason=reason,
        description=description,
    )
    db.add(report)
    await db.flush()
    return report


async def list_reports(
    db: AsyncSession,
    status: str | None = None,
    limit: int = 20,
    cursor: str | None = None,
) -> dict:
    query = select(Report).order_by(Report.created_at.desc())

    if status:
        query = query.where(Report.status == status)
    if cursor:
        query = query.where(Report.created_at < cursor)

    query = query.limit(limit + 1)
    result = await db.execute(query)
    reports = result.scalars().all()

    count_query = select(func.count()).select_from(Report)
    if status:
        count_query = count_query.where(Report.status == status)
    total = (await db.execute(count_query)).scalar()

    next_cursor = None
    if len(reports) > limit:
        next_cursor = reports[limit - 1].created_at.isoformat()

    return {
        "items": reports[:limit],
        "next_cursor": next_cursor,
        "total": total,
    }


async def resolve_report(
    db: AsyncSession, report_id: str, resolver_id: str, status: str
) -> Report:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("Report not found")
    report.status = status
    report.resolved_by = resolver_id
    report.resolved_at = datetime.now(timezone.utc)
    await db.flush()
    return report


async def list_users(
    db: AsyncSession, search: str | None = None, limit: int = 20, cursor: str | None = None
) -> dict:
    query = select(User).order_by(User.created_at.desc())

    if search:
        query = query.where(
            User.nickname.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if cursor:
        query = query.where(User.created_at < cursor)

    query = query.limit(limit + 1)
    result = await db.execute(query)
    users = result.scalars().all()

    count_query = select(func.count()).select_from(User)
    if search:
        count_query = count_query.where(
            User.nickname.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    total = (await db.execute(count_query)).scalar()

    next_cursor = None
    if len(users) > limit:
        next_cursor = users[limit - 1].created_at.isoformat()

    return {
        "items": users[:limit],
        "next_cursor": next_cursor,
        "total": total,
    }


async def get_user(db: AsyncSession, user_id: str) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    return user


async def change_role(db: AsyncSession, user_id: str, role: str) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    user.role = role
    await db.flush()
    return user


async def change_status(db: AsyncSession, user_id: str, is_active: bool) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    user.is_active = is_active
    await db.flush()
    return user


async def delete_user(db: AsyncSession, user_id: str) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User not found")
    await db.delete(user)
    await db.flush()
