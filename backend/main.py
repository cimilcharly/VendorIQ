from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import auth, vendors, scenarios, recommendations, reports
from app.core.config import settings
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    yield
    print("Shutting down...")

app = FastAPI(
    title="VendorIQ API",
    description="Decision Intelligence Platform for SME Procurement",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors"])
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["Scenarios"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/")
async def root():
    return {"message": "VendorIQ API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
