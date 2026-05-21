import datetime
from uuid import uuid4
from decimal import Decimal
from sqlalchemy import String, Boolean, Integer, Text, Enum as SAEnum, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry
from app.database import Base, TimestampMixin
from app.models.enums import Gender, ToiletType, PaperType


class ToiletPhoto(Base, TimestampMixin):
    __tablename__ = "toilet_photos"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    toilet_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("toilets.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    uploaded_by: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    toilet = relationship("Toilet", back_populates="photos")


class Toilet(Base, TimestampMixin):
    __tablename__ = "toilets"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    geom = mapped_column(Geometry("POINT", srid=4326), nullable=False)
    floor: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location_hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    gender: Mapped[Gender] = mapped_column(SAEnum(Gender, name="gender"), nullable=False)
    toilet_type: Mapped[ToiletType] = mapped_column(SAEnum(ToiletType, name="toilet_type"), nullable=False)
    is_free: Mapped[bool] = mapped_column(Boolean, default=True)
    price: Mapped[Decimal | None] = mapped_column(nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="RUB")
    has_water: Mapped[bool] = mapped_column(Boolean, default=False)
    has_hot_water: Mapped[bool] = mapped_column(Boolean, default=False)
    has_soap: Mapped[bool] = mapped_column(Boolean, default=False)
    has_dryer: Mapped[bool] = mapped_column(Boolean, default=False)
    paper_type: Mapped[PaperType] = mapped_column(SAEnum(PaperType, name="paper_type"), default=PaperType.UNKNOWN)
    has_child_toilet: Mapped[bool] = mapped_column(Boolean, default=False)
    has_changing_table: Mapped[bool] = mapped_column(Boolean, default=False)
    is_accessible: Mapped[bool] = mapped_column(Boolean, default=False)
    cabin_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    opening_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    rating_avg: Mapped[Decimal | None] = mapped_column(nullable=True)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0)
    last_confirmed_at: Mapped[datetime.datetime | None] = mapped_column(nullable=True)
    created_by: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    creator = relationship("User", back_populates="toilets", foreign_keys=[created_by])
    photos = relationship("ToiletPhoto", back_populates="toilet", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="toilet", cascade="all, delete-orphan")
    confirmations = relationship("Confirmation", back_populates="toilet", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_toilets_geom", "geom", postgresql_using="gist"),
        Index("idx_toilets_created_at", "created_at"),
        Index("idx_toilets_created_by", "created_by"),
        Index("idx_toilets_gender", "gender"),
        Index("idx_toilets_toilet_type", "toilet_type"),
        Index("idx_toilets_is_deleted", "is_deleted"),
        Index("idx_toilets_is_verified", "is_verified"),
    )
