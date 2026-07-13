from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import auth, vendors, scenarios, recommendations, reports, billing
from app.core.config import settings
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi import Request
from app.database import engine, Base

from app.core.logging import setup_logging, logger

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title="VendorIQ API",
    description="Decision Intelligence Platform for SME Procurement",
    version="1.0.0",
    lifespan=lifespan
)

import os

is_prod = os.getenv("ENV", "development").lower() == "production"
allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"] if is_prod else ["*"]
allow_headers = ["Content-Type", "Authorization", "X-Requested-With"] if is_prod else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=allow_methods,
    allow_headers=allow_headers,
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["Scenarios"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(billing.router, prefix="/api/billing", tags=["Billing"])

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": {
                "status": "error",
                "message": exc.detail if isinstance(exc.detail, str) else str(exc.detail),
                "code": f"ERR_{exc.status_code}",
                "details": exc.detail if not isinstance(exc.detail, str) else None
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_messages = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "invalid value")
        error_messages.append(f"{loc}: {msg}")
    message = "; ".join(error_messages) if error_messages else "Validation error"
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": {
                "status": "error",
                "message": message,
                "code": "ERR_VALIDATION",
                "details": errors
            }
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error occurred")
    return JSONResponse(
        status_code=500,
        content={
            "detail": {
                "status": "error",
                "message": "Internal server error",
                "code": "ERR_INTERNAL_SERVER_ERROR",
                "details": str(exc) if os.getenv("ENV", "development").lower() != "production" else None
            }
        }
    )

from fastapi import Response, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.core.redis import get_redis_client

@app.get("/")
async def root():
    return {"message": "VendorIQ API", "version": "1.0.0"}

@app.get("/health")
async def health_check(response: Response, db: Session = Depends(get_db)):
    db_status = "healthy"
    redis_status = "healthy"
    status_code = 200

    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = f"unhealthy: {str(e)}"
        status_code = 503

    client = get_redis_client()
    if client is None:
        redis_status = "unhealthy: client not initialized"
        status_code = 503
    else:
        try:
            client.ping()
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            redis_status = f"unhealthy: {str(e)}"
            status_code = 503

    if status_code != 200:
        response.status_code = status_code

    return {
        "status": "healthy" if status_code == 200 else "unhealthy",
        "dependencies": {
            "database": db_status,
            "redis": redis_status
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
