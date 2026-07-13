from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Scenario, User, Vendor, VendorMetric, Recommendation, Organization
from app.schemas.scenario import ScenarioCreate, ScenarioUpdate, ScenarioResponse
from app.core.security import get_current_user, check_role
from app.engine.decision import DecisionEngine, VendorData
from app.core.redis import get_redis_client
from app.core.logging import logger
import json

router = APIRouter()

@router.post("/", response_model=ScenarioResponse)
def create_scenario(scenario: ScenarioCreate, current_user: User = Depends(check_role(["admin", "procurement_manager"])), db: Session = Depends(get_db)):
    # Enforce free tier scenario limit (max 3 scenarios)
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if org and org.subscription_plan == "free":
        scenario_count = db.query(Scenario).filter(Scenario.organization_id == current_user.organization_id).count()
        if scenario_count >= 3:
            raise HTTPException(
                status_code=400,
                detail="Free tier limit reached. You can only create up to 3 scenarios. Please upgrade to premium for unlimited scenarios."
            )

    db_scenario = Scenario(
        organization_id=current_user.organization_id,
        name=scenario.name,
        description=scenario.description,
        weights=scenario.weights.model_dump(),
        created_by=current_user.id,
    )
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario


@router.get("/", response_model=List[ScenarioResponse])
def list_scenarios(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scenarios = db.query(Scenario).filter(Scenario.organization_id == current_user.organization_id).offset(skip).limit(limit).all()
    return scenarios

@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario(scenario_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario

@router.put("/{scenario_id}", response_model=ScenarioResponse)
def update_scenario(scenario_id: int, scenario: ScenarioUpdate, current_user: User = Depends(check_role(["admin", "procurement_manager"])), db: Session = Depends(get_db)):
    db_scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    if scenario.name:
        db_scenario.name = scenario.name
    if scenario.description:
        db_scenario.description = scenario.description
    if scenario.weights:
        db_scenario.weights = scenario.weights.model_dump()
        # Invalidate cache and database recommendations on weights change
        db.query(Recommendation).filter(Recommendation.scenario_id == scenario_id).delete()
        if redis_client := get_redis_client():
            try:
                redis_client.delete(f"topsis_cache:{scenario_id}")
            except Exception as e:
                logger.error(f"Redis cache delete failed: {e}")

    db.commit()
    db.refresh(db_scenario)
    return db_scenario

@router.delete("/{scenario_id}")
def delete_scenario(scenario_id: int, current_user: User = Depends(check_role(["admin", "procurement_manager"])), db: Session = Depends(get_db)):
    db_scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(db_scenario)
    db.commit()
    return {"message": "Scenario deleted"}

@router.post("/{scenario_id}/run")
def run_scenario(scenario_id: int, current_user: User = Depends(check_role(["admin", "procurement_manager"])), db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Get all vendors for organization
    vendors = db.query(Vendor).filter(Vendor.organization_id == current_user.organization_id).all()
    if not vendors:
        raise HTTPException(status_code=400, detail="No vendors found for this organization")

    # Try to fetch from Redis cache first
    redis_client = get_redis_client()
    cache_key = f"topsis_cache:{scenario_id}"
    if redis_client:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Redis cache read failed: {e}")

    # Prepare vendor data with latest metrics
    from sqlalchemy import func
    vendor_ids = [v.id for v in vendors]
    subq = db.query(
        VendorMetric.vendor_id,
        func.max(VendorMetric.created_at).label("max_created_at")
    ).filter(VendorMetric.vendor_id.in_(vendor_ids)).group_by(VendorMetric.vendor_id).subquery()

    latest_metrics = db.query(VendorMetric).join(
        subq,
        (VendorMetric.vendor_id == subq.c.vendor_id) & (VendorMetric.created_at == subq.c.max_created_at)
    ).all()

    metrics_map = {m.vendor_id: m for m in latest_metrics}

    vendor_data_list = []
    for vendor in vendors:
        latest_metric = metrics_map.get(vendor.id)
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

    # Run TOPSIS analysis
    scores = DecisionEngine.topsis(vendor_data_list, scenario.weights)

    # Delete old recommendations if they exist
    db.query(Recommendation).filter(Recommendation.scenario_id == scenario_id).delete()

    # Save new recommendations to database
    for rank, (vendor_id, score) in enumerate(scores, 1):
        rec = Recommendation(
            scenario_id=scenario_id,
            vendor_id=vendor_id,
            score=score,
            rank=rank,
        )
        db.add(rec)
    db.commit()

    response_data = {
        "scenario_id": scenario_id,
        "scenario_name": scenario.name,
        "weights": scenario.weights,
        "rankings": [{"vendor_id": vendor_id, "score": score} for vendor_id, score in scores]
    }

    if redis_client:
        try:
            redis_client.setex(cache_key, 300, json.dumps(response_data))
        except Exception as e:
            logger.error(f"Redis cache write failed: {e}")

    return response_data
