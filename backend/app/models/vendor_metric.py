from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class VendorMetric(Base):
    __tablename__ = "vendor_metrics"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    cost = Column(Float)
    quality = Column(Float)
    delivery_time = Column(Float)
    reliability = Column(Float)
    compliance = Column(Float)
    rating = Column(Float)
    financial_stability = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = relationship("Vendor", back_populates="metrics")
