from geoalchemy2 import WKTElement
from geoalchemy2.functions import ST_DWithin, ST_Distance, ST_Y, ST_X, ST_SetSRID, ST_MakePoint, ST_GeomFromEWKT
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.toilet import Toilet


def make_point(lat: float, lon: float) -> WKTElement:
    return WKTElement(f"POINT({lon} {lat})", srid=4326)


async def compute_distance(
    session: AsyncSession, lat: float, lon: float, toilet_id: str
) -> float:
    point = make_point(lat, lon)
    result = await session.execute(
        select(
            func.ST_Distance(
                func.ST_Transform(Toilet.geom, 3857),
                func.ST_Transform(point, 3857),
            )
        ).where(Toilet.id == toilet_id)
    )
    return result.scalar()


def nearby_query(lat: float, lon: float, radius_m: float):
    point = make_point(lat, lon)
    distance_expr = func.ST_Distance(
        func.ST_Transform(Toilet.geom, 3857),
        func.ST_Transform(point, 3857),
    ).label("distance_m")
    return distance_expr, point


def extract_lat_lon(geom) -> tuple[float, float]:
    if geom is None:
        return 0.0, 0.0
    return 0.0, 0.0
