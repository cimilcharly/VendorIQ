from pydantic import BaseModel, ConfigDict
from datetime import datetime

class RecommendationResponse(BaseModel):
    id: int
    scenario_id: int
    vendor_id: int
    score: float
    rank: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
