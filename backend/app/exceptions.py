import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError


class AppError(Exception):
    status_code = 500
    default_code = "INTERNAL_ERROR"

    def __init__(self, detail="An error occurred", code=None, fields=None):
        self.detail = detail
        self.code = code or self.default_code
        self.fields = fields or []
        super().__init__(detail)


class NotFoundError(AppError):
    status_code = 404
    default_code = "NOT_FOUND"


class ForbiddenError(AppError):
    status_code = 403
    default_code = "FORBIDDEN"


class ConflictError(AppError):
    status_code = 409
    default_code = "CONFLICT"


class GoneError(AppError):
    status_code = 410
    default_code = "GONE"


class RateLimitError(AppError):
    status_code = 429
    default_code = "RATE_LIMIT"


class BadRequestError(AppError):
    status_code = 400
    default_code = "BAD_REQUEST"


class UnauthorizedError(AppError):
    status_code = 401
    default_code = "UNAUTHORIZED"


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "code": exc.code,
                "fields": exc.fields,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ):
        fields = []
        for error in exc.errors():
            loc = ".".join(str(part) for part in error.get("loc", []))
            fields.append({"field": loc, "message": error.get("msg", "")})
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation error",
                "code": "VALIDATION_ERROR",
                "fields": fields,
            },
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        return JSONResponse(
            status_code=409,
            content={
                "detail": "Database integrity error",
                "code": "CONFLICT",
                "fields": [],
            },
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        detail = (
            str(exc)
            if os.getenv("ENVIRONMENT") == "development"
            else "Internal server error"
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": detail,
                "code": "INTERNAL_ERROR",
                "fields": [],
            },
        )
