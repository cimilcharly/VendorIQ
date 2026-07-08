from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    name = Column(String, index=True)
    description = Column(String)
    weights = Column(JSON)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="scenarios")
    recommendations = relationship("Recommendation", back_populates="scenario", cascade="all, delete-orphan")
