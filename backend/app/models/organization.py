from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    industry = Column(String)
    subscription_plan = Column(String, default="free")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="organization")
    vendors = relationship("Vendor", back_populates="organization")
    scenarios = relationship("Scenario", back_populates="organization")
