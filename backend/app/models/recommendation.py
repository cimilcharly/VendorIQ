from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    score = Column(Float)
    rank = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    scenario = relationship("Scenario", back_populates="recommendations")
