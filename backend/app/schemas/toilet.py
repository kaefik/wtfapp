import datetime
from pydantic import BaseModel, Field
from app.models.enums import Gender, ToiletType, PaperType
from uuid import UUID
from typing import Optional
from decimal import Decimal


class OpeningHoursSchema(BaseModel):
    model_config = {"extra": "forbid"}
    mon: Optional[list[str]] = None
    tue: Optional[list[str]] = None
    wed: Optional[list[str]] = None
    thu: Optional[list[str]] = None
    fri: Optional[list[str]] = None
    sat: Optional[list[str]] = None
    sun: Optional[list[str]] = None
    hol: Optional[list[str]] = None

    @classmethod
    def validate_hours(cls, v):
        if v is not None:
            for interval_list in v.values():
                if interval_list is not None and len(interval_list) not in (0, 2, 4):
                    raise ValueError("Must have 0, 2, or 4 time strings per day")
        return v


class ToiletCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    address: Optional[str] = Field(None, max_length=500)
    floor: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    location_hint: Optional[str] = None
    gender: Gender
    toilet_type: ToiletType
    is_free: bool = True
    price: Optional[Decimal] = None
    currency: str = "RUB"
    has_water: bool = False
    has_hot_water: bool = False
    has_soap: bool = False
    has_dryer: bool = False
    paper_type: PaperType = PaperType.UNKNOWN
    has_child_toilet: bool = False
    has_changing_table: bool = False
    is_accessible: bool = False
    cabin_count: Optional[int] = Field(None, ge=1)
    opening_hours: Optional[OpeningHoursSchema] = None


class ToiletUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)
    address: Optional[str] = Field(None, max_length=500)
    floor: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    location_hint: Optional[str] = None
    gender: Optional[Gender] = None
    toilet_type: Optional[ToiletType] = None
    is_free: Optional[bool] = None
    price: Optional[Decimal] = None
    currency: Optional[str] = None
    has_water: Optional[bool] = None
    has_hot_water: Optional[bool] = None
    has_soap: Optional[bool] = None
    has_dryer: Optional[bool] = None
    paper_type: Optional[PaperType] = None
    has_child_toilet: Optional[bool] = None
    has_changing_table: Optional[bool] = None
    is_accessible: Optional[bool] = None
    cabin_count: Optional[int] = Field(None, ge=1)
    opening_hours: Optional[OpeningHoursSchema] = None


class ReviewItemResponse(BaseModel):
    id: UUID
    rating: int
    text: Optional[str] = None
    photo_urls: list[str] = []
    user_nickname: str = ""
    user_avatar_url: Optional[str] = None
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class ReviewListResponse(BaseModel):
    items: list[ReviewItemResponse]
    next_cursor: Optional[str] = None
    total: int


class ToiletListItem(BaseModel):
    id: UUID
    name: str
    distance_m: Optional[float] = None
    lat: float
    lon: float
    address: Optional[str] = None
    floor: Optional[str] = None
    gender: Gender
    is_free: bool
    is_open_now: Optional[bool] = None
    rating_avg: Optional[Decimal] = None
    reviews_count: int = 0
    last_confirmed_at: Optional[datetime.datetime] = None
    photo_urls: list[str] = []

    model_config = {"from_attributes": True}


class NearbyResponse(BaseModel):
    items: list[ToiletListItem]
    next_cursor: Optional[str] = None
    total: int


class ToiletDetail(BaseModel):
    id: UUID
    name: str
    lat: float
    lon: float
    address: Optional[str] = None
    floor: Optional[str] = None
    description: Optional[str] = None
    location_hint: Optional[str] = None
    gender: Gender
    toilet_type: ToiletType
    is_free: bool
    price: Optional[Decimal] = None
    currency: str = "RUB"
    has_water: bool
    has_hot_water: bool
    has_soap: bool
    has_dryer: bool
    paper_type: PaperType
    has_child_toilet: bool
    has_changing_table: bool
    is_accessible: bool
    cabin_count: Optional[int] = None
    opening_hours: Optional[dict] = None
    is_open_now: Optional[bool] = None
    is_verified: bool
    rating_avg: Optional[Decimal] = None
    reviews_count: int = 0
    last_confirmed_at: Optional[datetime.datetime] = None
    photo_urls: list[str] = []
    created_by: Optional[UUID] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    reviews: ReviewListResponse

    model_config = {"from_attributes": True}
