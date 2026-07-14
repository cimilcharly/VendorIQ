import os
import sys
from pydantic_settings import BaseSettings, SettingsConfigDict
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

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()

# Runtime security check
is_prod = os.getenv("ENV", "development").lower() == "production"
if is_prod:
    if settings.SECRET_KEY == "your-secret-key-here-change-in-production":
        raise ValueError("CRITICAL SECURITY ERROR: SECRET_KEY must be overridden in production!")
    if settings.DATABASE_URL == "postgresql://user:password@localhost:5432/vendoriq":
        raise ValueError("CRITICAL SECURITY ERROR: DATABASE_URL must be overridden in production!")
    if settings.REDIS_URL == "redis://localhost:6379/0":
        raise ValueError("CRITICAL SECURITY ERROR: REDIS_URL must be overridden in production!")
    
    # Assert CORS_ORIGINS contains at least one non-localhost, non-loopback domain in production
    prod_origins = [
        o for o in settings.CORS_ORIGINS
        if "localhost" not in o and "127.0.0.1" not in o
    ]
    if not prod_origins:
        raise ValueError("CRITICAL CORS CONFIG ERROR: CORS_ORIGINS must include a production domain when ENV=production!")
else:
    if settings.SECRET_KEY == "your-secret-key-here-change-in-production":
        print(
            "WARNING: Using default weak SECRET_KEY. Please override this in production environment.",
            file=sys.stderr
        )

