from uuid import uuid4
from sqlalchemy import Text, ForeignKey, Index, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, TimestampMixin
from app.models.enums import ReportTargetType, ReportReason, ReportStatus


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    target_type: Mapped[ReportTargetType] = mapped_column(SAEnum(ReportTargetType, name="report_target_type"), nullable=False)
    target_id: Mapped[str] = mapped_column(UUID(as_uuid=True), nullable=False)
    reporter_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reason: Mapped[ReportReason] = mapped_column(SAEnum(ReportReason, name="report_reason"), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ReportStatus] = mapped_column(SAEnum(ReportStatus, name="report_status"), default=ReportStatus.PENDING)
    resolved_by: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    reporter = relationship("User", back_populates="reports_made", foreign_keys=[reporter_id])
    resolver = relationship("User", back_populates="reports_resolved", foreign_keys=[resolved_by])

    __table_args__ = (
        Index("idx_reports_status", "status"),
    )
