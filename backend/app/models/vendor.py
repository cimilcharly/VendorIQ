from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    name = Column(String, index=True)
    category = Column(String)
    region = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    gst_number = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="vendors")
    metrics = relationship("VendorMetric", back_populates="vendor", cascade="all, delete-orphan")
