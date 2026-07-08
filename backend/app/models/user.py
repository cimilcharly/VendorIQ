from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    PROCUREMENT_MANAGER = "procurement_manager"
    VIEWER = "viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.VIEWER)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
