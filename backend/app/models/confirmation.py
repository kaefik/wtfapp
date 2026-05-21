from uuid import uuid4
from sqlalchemy import Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, TimestampMixin


class Confirmation(Base, TimestampMixin):
    __tablename__ = "confirmations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    toilet_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("toilets.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_actual: Mapped[bool] = mapped_column(Boolean, nullable=False)

    toilet = relationship("Toilet", back_populates="confirmations")
    user = relationship("User", back_populates="confirmations")

    __table_args__ = (
        UniqueConstraint("toilet_id", "user_id", name="uniq_confirmation_toilet_user"),
    )
