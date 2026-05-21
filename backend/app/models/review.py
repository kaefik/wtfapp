import datetime
from uuid import uuid4
from sqlalchemy import String, Integer, Text, SmallInteger, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, TimestampMixin


class ReviewPhoto(Base, TimestampMixin):
    __tablename__ = "review_photos"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    review_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)

    review = relationship("Review", back_populates="photos")


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    toilet_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("toilets.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)

    toilet = relationship("Toilet", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
    photos = relationship("ReviewPhoto", back_populates="review", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("toilet_id", "user_id", name="uniq_review_toilet_user"),
        Index("idx_reviews_toilet_id", "toilet_id"),
        Index("idx_reviews_user_id", "user_id"),
    )
