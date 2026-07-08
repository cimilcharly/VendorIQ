from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "VendorIQ"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    DATABASE_URL: str = "postgresql://user:password@localhost:5432/vendoriq"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "vendoriq-bucket"
    AWS_REGION: str = "us-east-1"

    GOOGLE_OAUTH_CLIENT_ID: str = ""
    GOOGLE_OAUTH_CLIENT_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
