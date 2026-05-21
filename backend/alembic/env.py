import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

import geoalchemy2

from app.database import Base
from app.config import get_settings

from app.models import User, Toilet, ToiletPhoto, Review, ReviewPhoto, Confirmation, Report

config = context.config
config.set_main_option("sqlalchemy.url", get_settings().DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

POSTGIS_TABLES = {
    "spatial_ref_sys",
    "topology",
    "layer",
    "edges",
    "faces",
    "addr",
    "addrfeat",
    "bg",
    "county",
    "cousub",
    "featnames",
    "loader_lookuptables",
    "loader_platform",
    "loader_variables",
    "pagc_gaz",
    "pagc_lex",
    "pagc_rules",
    "place",
    "place_lookup",
    "state",
    "state_lookup",
    "street_type_lookup",
    "tabblock",
    "tabblock20",
    "tract",
    "zcta5",
    "zip_lookup",
    "zip_lookup_all",
    "zip_lookup_base",
    "zip_state",
    "zip_state_loc",
    "county_lookup",
    "countysub_lookup",
    "direction_lookup",
    "secondary_unit_lookup",
    "geocode_settings",
    "geocode_settings_default",
}


def _include_object(object, name, type_, reflected, compare_to):
    if type_ == "table":
        if name in POSTGIS_TABLES:
            return False
        if name.startswith("tiger.") or name.startswith("topology."):
            return False
    return True


def _render_item(type_, obj, autogen_context):
    if type_ == "type" and isinstance(obj, geoalchemy2.types.Geometry):
        autogen_context.imports.add("import geoalchemy2")
    return False


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=_include_object,
        render_item=_render_item,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=_include_object,
        render_item=_render_item,
    )
    with context.begin_transaction():
        context.execute("CREATE EXTENSION IF NOT EXISTS postgis")
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
