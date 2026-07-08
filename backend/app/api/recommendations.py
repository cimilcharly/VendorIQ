from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Recommendation, Scenario, User, Vendor, VendorMetric
from app.schemas.recommendation import RecommendationResponse
from app.core.security import get_current_user
from app.engine.decision import DecisionEngine, VendorData

router = APIRouter()

@router.get("/scenario/{scenario_id}", response_model=List[RecommendationResponse])
def get_scenario_recommendations(scenario_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    recommendations = db.query(Recommendation).filter(Recommendation.scenario_id == scenario_id).order_by(Recommendation.rank).all()

    if not recommendations:
        # Generate recommendations on the fly if not already computed
        vendors = db.query(Vendor).filter(Vendor.organization_id == current_user.organization_id).all()

        vendor_data_list = []
        for vendor in vendors:
            latest_metric = db.query(VendorMetric).filter(VendorMetric.vendor_id == vendor.id).order_by(VendorMetric.created_at.desc()).first()
            if latest_metric:
                metrics = {
                    "cost": latest_metric.cost,
                    "quality": latest_metric.quality,
                    "delivery_time": latest_metric.delivery_time,
                    "reliability": latest_metric.reliability,
                    "compliance": latest_metric.compliance,
                    "rating": latest_metric.rating,
                    "financial_stability": latest_metric.financial_stability,
                }
                vendor_data_list.append(VendorData(vendor_id=vendor.id, vendor_name=vendor.name, metrics=metrics))

        scores = DecisionEngine.topsis(vendor_data_list, scenario.weights)

        # Save recommendations to database
        for rank, (vendor_id, score) in enumerate(scores, 1):
            recommendation = Recommendation(
                scenario_id=scenario_id,
                vendor_id=vendor_id,
                score=score,
                rank=rank,
            )
            db.add(recommendation)
        db.commit()

        recommendations = db.query(Recommendation).filter(Recommendation.scenario_id == scenario_id).order_by(Recommendation.rank).all()

    return recommendations

@router.get("/{recommendation_id}", response_model=RecommendationResponse)
def get_recommendation(recommendation_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recommendation = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    scenario = db.query(Scenario).filter(Scenario.id == recommendation.scenario_id).first()
    if scenario.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return recommendation
