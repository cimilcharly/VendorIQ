from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Optional

class ScenarioWeights(BaseModel):
    cost: float
    quality: float
    reliability: float
    delivery: float
    compliance: float

    def validate_weights(self):
        total = sum([self.cost, self.quality, self.reliability, self.delivery, self.compliance])
        if abs(total - 100) > 0.01:
            raise ValueError("Weights must sum to 100")
        return True

class ScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None
    weights: Dict[str, float]

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    weights: Optional[Dict[str, float]] = None

class ScenarioResponse(ScenarioBase):
    id: int
    organization_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
