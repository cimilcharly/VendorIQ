from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class VendorMetricInline(BaseModel):
    cost: float
    quality: float
    delivery_time: float
    reliability: float
    compliance: float
    rating: float
    financial_stability: float

class VendorBase(BaseModel):
    name: str
    category: str
    region: str
    contact_email: str
    contact_phone: str
    gst_number: str

class VendorCreate(VendorBase):
    metrics: Optional[VendorMetricInline] = None

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    gst_number: Optional[str] = None

class VendorResponse(VendorBase):
    id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
