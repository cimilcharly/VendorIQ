import os
import sys
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union, Any

class Settings(BaseSettings):
    PROJECT_NAME: str = "VendorIQ"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    DATABASE_URL: str = "postgresql://user:password@localhost:5432/vendoriq"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: Any = ["http://localhost:3000", "http://localhost:8000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str):
            import json
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
                return [str(parsed)]
            except Exception:
                return [v]
        return v

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "vendoriq-bucket"
    AWS_REGION: str = "us-east-1"

    GOOGLE_OAUTH_CLIENT_ID: str = ""
    GOOGLE_OAUTH_CLIENT_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()

# Runtime security check
if settings.SECRET_KEY == "your-secret-key-here-change-in-production":
    is_prod = os.getenv("ENV", "development").lower() == "production"
    if is_prod:
        raise ValueError("CRITICAL SECURITY ERROR: SECRET_KEY must be overridden in production!")
    else:
        print(
            "WARNING: Using default weak SECRET_KEY. Please override this in production environment.",
            file=sys.stderr
        )

