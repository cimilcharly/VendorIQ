from pydantic import BaseModel, model_validator
from datetime import datetime
from typing import Optional
from typing_extensions import Self

class ScenarioWeights(BaseModel):
    cost: float
    quality: float
    reliability: float
    delivery_time: float
    compliance: float
    rating: float
    financial_stability: float

    @model_validator(mode="after")
    def validate_weights(self) -> Self:
        total = sum([
            self.cost,
            self.quality,
            self.reliability,
            self.delivery_time,
            self.compliance,
            self.rating,
            self.financial_stability
        ])
        if abs(total - 100) > 0.01:
            raise ValueError("Weights must sum to 100")
        return self

class ScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None
    weights: ScenarioWeights

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    weights: Optional[ScenarioWeights] = None

class ScenarioResponse(ScenarioBase):
    id: int
    organization_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

