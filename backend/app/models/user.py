import datetime
from uuid import uuid4
from sqlalchemy import String, Boolean, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, TimestampMixin
from app.models.enums import UserRole


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    nickname: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    birth_date: Mapped[datetime.date | None] = mapped_column(nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role"), default=UserRole.USER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    toilets = relationship("Toilet", back_populates="creator", foreign_keys="Toilet.created_by")
    reviews = relationship("Review", back_populates="user")
    confirmations = relationship("Confirmation", back_populates="user")
    reports_made = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")
    reports_resolved = relationship("Report", back_populates="resolver", foreign_keys="Report.resolved_by")
