import redis
from app.core.config import settings
from app.core.logging import logger

try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
except Exception as e:
    logger.error(f"Failed to initialize Redis client: {e}")
    redis_client = None

def get_redis_client():
    return redis_client
