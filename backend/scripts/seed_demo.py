import asyncio
import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2 import WKTElement

from app.database import async_session_factory
from app.models.user import User
from app.models.toilet import Toilet
from app.models.review import Review
from app.models.enums import UserRole, Gender, ToiletType, PaperType
from app.services.auth import hash_password

MOSCOW_CENTER_LAT = 55.7558
MOSCOW_CENTER_LON = 37.6173

DEMO_TOILETS = [
    {"name": "Туалет на Красной площади", "lat": 55.7539, "lon": 37.6208, "address": "Красная площадь, 1", "gender": Gender.UNISEX, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_soap": True, "paper_type": PaperType.DISPENSER, "is_accessible": True, "cabin_count": 4},
    {"name": "ТЦ Мега — 1 этаж", "lat": 55.7517, "lon": 37.6319, "address": "ТЦ Мега, этаж 1", "floor": "1", "gender": Gender.MALE, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_hot_water": True, "has_soap": True, "has_dryer": True, "paper_type": PaperType.BOTH, "has_changing_table": True, "cabin_count": 6},
    {"name": "Казанский вокзал", "lat": 55.7736, "lon": 37.6556, "address": "Комсомольская пл., 2", "gender": Gender.UNISEX, "toilet_type": ToiletType.INDOOR, "is_free": False, "price": 100, "has_water": True, "has_soap": True, "paper_type": PaperType.IN_CABIN, "cabin_count": 8},
    {"name": "Парк Горького", "lat": 55.7298, "lon": 37.6036, "address": "Парк Горького", "gender": Gender.FEMALE, "toilet_type": ToiletType.OUTDOOR, "is_free": True, "has_water": False, "paper_type": PaperType.NONE, "cabin_count": 2},
    {"name": "Метро Охотный Ряд", "lat": 55.7572, "lon": 37.6164, "address": "Станция метро Охотный Ряд", "floor": "-1", "gender": Gender.UNISEX, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_soap": False, "paper_type": PaperType.UNKNOWN, "is_accessible": True, "cabin_count": 3},
    {"name": "ВДНХ павильон 1", "lat": 55.8318, "lon": 37.6307, "address": "ВДНХ, павильон 1", "floor": "1", "gender": Gender.MALE, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_hot_water": True, "has_soap": True, "has_dryer": True, "paper_type": PaperType.DISPENSER, "has_child_toilet": True, "has_changing_table": True, "is_accessible": True, "cabin_count": 5},
    {"name": "Биотуалет на Арбате", "lat": 55.7487, "lon": 37.5926, "address": "ул. Арбат", "gender": Gender.UNISEX, "toilet_type": ToiletType.PORTABLE, "is_free": True, "has_water": False, "paper_type": PaperType.NONE, "cabin_count": 1},
    {"name": "ТЦ Атриум — 2 этаж", "lat": 55.7744, "lon": 37.6550, "address": "ТЦ Атриум, этаж 2", "floor": "2", "gender": Gender.FEMALE, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_soap": True, "has_dryer": True, "paper_type": PaperType.IN_CABIN, "has_changing_table": True, "cabin_count": 4},
    {"name": "Парк Сокольники", "lat": 55.7923, "lon": 37.6760, "address": "Парк Сокольники", "gender": Gender.UNISEX, "toilet_type": ToiletType.OUTDOOR, "is_free": True, "has_water": True, "has_soap": False, "paper_type": PaperType.DISPENSER, "cabin_count": 3},
    {"name": "МГУ главный корпус", "lat": 55.7035, "lon": 37.5289, "address": "МГУ, главный корпус", "floor": "1", "gender": Gender.UNISEX, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_hot_water": True, "has_soap": True, "paper_type": PaperType.BOTH, "is_accessible": True, "cabin_count": 6},
    {"name": "Садовое кольцо — биотуалет", "lat": 55.7405, "lon": 37.6195, "address": "Садовое кольцо", "gender": Gender.MALE, "toilet_type": ToiletType.PORTABLE, "is_free": False, "price": 50, "has_water": False, "paper_type": PaperType.NONE, "cabin_count": 1},
    {"name": "ТЦ Европолис — 3 этаж", "lat": 55.7601, "lon": 37.6189, "address": "ТЦ Европолис, этаж 3", "floor": "3", "gender": Gender.FAMILY, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_hot_water": True, "has_soap": True, "has_dryer": True, "paper_type": PaperType.DISPENSER, "has_child_toilet": True, "has_changing_table": True, "is_accessible": True, "cabin_count": 4},
    {"name": "Ленинградский вокзал", "lat": 55.7763, "lon": 37.6553, "address": "Комсомольская пл., 3", "gender": Gender.UNISEX, "toilet_type": ToiletType.INDOOR, "is_free": False, "price": 150, "has_water": True, "has_soap": True, "has_dryer": True, "paper_type": PaperType.IN_CABIN, "is_accessible": True, "cabin_count": 10},
    {"name": "Парк Коломенское", "lat": 55.6675, "lon": 37.6681, "address": "Парк Коломенское", "gender": Gender.UNISEX, "toilet_type": ToiletType.OUTDOOR, "is_free": True, "has_water": False, "paper_type": PaperType.NONE, "cabin_count": 2},
    {"name": "Белорусский вокзал", "lat": 55.7770, "lon": 37.5822, "address": "пл. Тверская Застава, 1", "gender": Gender.MALE, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_soap": True, "paper_type": PaperType.DISPENSER, "cabin_count": 5},
    {"name": "ТЦ Метрополис — -1 этаж", "lat": 55.8236, "lon": 37.4967, "address": "ТЦ Метрополис, -1 этаж", "floor": "-1", "gender": Gender.FEMALE, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_hot_water": True, "has_soap": True, "has_dryer": True, "paper_type": PaperType.BOTH, "has_changing_table": True, "cabin_count": 3},
    {"name": "Биотуалет Кузьминки", "lat": 55.7079, "lon": 37.7628, "address": "Парк Кузьминки", "gender": Gender.UNISEX, "toilet_type": ToiletType.PORTABLE, "is_free": True, "has_water": False, "paper_type": PaperType.NONE, "cabin_count": 2},
    {"name": "Киевский вокзал", "lat": 55.7447, "lon": 37.5661, "address": "пл. Киевского вокзала, 1", "gender": Gender.UNISEX, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_soap": False, "paper_type": PaperType.DISPENSER, "is_accessible": True, "cabin_count": 4},
    {"name": "ТЦ Авиапарк — 1 этаж", "lat": 55.7928, "lon": 37.5317, "address": "ТЦ Авиапарк, этаж 1", "floor": "1", "gender": Gender.MALE, "toilet_type": ToiletType.INDOOR, "is_free": True, "has_water": True, "has_hot_water": True, "has_soap": True, "has_dryer": True, "paper_type": PaperType.IN_CABIN, "has_child_toilet": True, "is_accessible": True, "cabin_count": 8},
    {"name": "Парк Фили", "lat": 55.7411, "lon": 37.4780, "address": "Парк Фили", "gender": Gender.UNISEX, "toilet_type": ToiletType.OUTDOOR, "is_free": True, "has_water": True, "has_soap": False, "paper_type": PaperType.DISPENSER, "cabin_count": 2},
]


async def seed():
    async with async_session_factory() as db:
        from sqlalchemy import select

        existing = await db.execute(select(User).where(User.email == "admin@wtfapp.com"))
        if existing.scalar_one_or_none():
            print("Demo data already exists. Skipping.")
            return

        admin = User(
            nickname="admin",
            email="admin@wtfapp.com",
            password_hash=hash_password("admin12345"),
            role=UserRole.ADMIN,
            is_email_verified=True,
        )
        moderator = User(
            nickname="moderator",
            email="mod@wtfapp.com",
            password_hash=hash_password("mod12345"),
            role=UserRole.MODERATOR,
            is_email_verified=True,
        )
        user = User(
            nickname="demo_user",
            email="user@wtfapp.com",
            password_hash=hash_password("user12345"),
            role=UserRole.USER,
            is_email_verified=True,
        )
        db.add_all([admin, moderator, user])
        await db.flush()

        toilets = []
        for data in DEMO_TOILETS:
            lat = data.pop("lat")
            lon = data.pop("lon")
            geom = WKTElement(f"POINT({lon} {lat})", srid=4326)
            toilet = Toilet(**data, geom=geom, created_by=str(user.id))
            db.add(toilet)
            toilets.append(toilet)

        await db.flush()

        import random
        for toilet in toilets[:15]:
            rating = random.randint(3, 5)
            review = Review(
                toilet_id=toilet.id,
                user_id=user.id,
                rating=rating,
                text=f"Оценка: {rating}/5",
            )
            db.add(review)

        await db.commit()
        print(f"Created 3 users and {len(toilets)} toilets with reviews.")


if __name__ == "__main__":
    asyncio.run(seed())
