from pydantic import BaseModel
from datetime import datetime

class RecommendationResponse(BaseModel):
    id: int
    scenario_id: int
    vendor_id: int
    score: float
    rank: int
    created_at: datetime

    class Config:
        from_attributes = True
