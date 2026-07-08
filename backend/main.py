from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import auth, vendors, scenarios, recommendations, reports
from app.core.config import settings
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

from fastapi import Response
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
