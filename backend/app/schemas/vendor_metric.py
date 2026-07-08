from pydantic import BaseModel
from datetime import datetime

class VendorMetricCreate(BaseModel):
    vendor_id: int
    cost: float
    quality: float
    delivery_time: float
    reliability: float
    compliance: float
    rating: float
    financial_stability: float

class VendorMetricResponse(BaseModel):
    id: int
    vendor_id: int
    cost: float
    quality: float
    delivery_time: float
    reliability: float
    compliance: float
    rating: float
    financial_stability: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
