from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Scenario, User, Vendor, VendorMetric
from app.schemas.scenario import ScenarioCreate, ScenarioUpdate, ScenarioResponse
from app.core.security import get_current_user
from app.engine.decision import DecisionEngine, VendorData

router = APIRouter()

@router.post("/", response_model=ScenarioResponse)
def create_scenario(scenario: ScenarioCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_scenario = Scenario(
        organization_id=current_user.organization_id,
        name=scenario.name,
        description=scenario.description,
        weights=scenario.weights,
        created_by=current_user.id,
    )
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

@router.get("/", response_model=List[ScenarioResponse])
def list_scenarios(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenarios = db.query(Scenario).filter(Scenario.organization_id == current_user.organization_id).all()
    return scenarios

@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario(scenario_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario

@router.put("/{scenario_id}", response_model=ScenarioResponse)
def update_scenario(scenario_id: int, scenario: ScenarioUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    if scenario.name:
        db_scenario.name = scenario.name
    if scenario.description:
        db_scenario.description = scenario.description
    if scenario.weights:
        db_scenario.weights = scenario.weights

    db.commit()
    db.refresh(db_scenario)
    return db_scenario

@router.delete("/{scenario_id}")
def delete_scenario(scenario_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not db_scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(db_scenario)
    db.commit()
    return {"message": "Scenario deleted"}

@router.post("/{scenario_id}/run")
def run_scenario(scenario_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Get all vendors for organization
    vendors = db.query(Vendor).filter(Vendor.organization_id == current_user.organization_id).all()
    if not vendors:
        raise HTTPException(status_code=400, detail="No vendors found for this organization")

    # Prepare vendor data with latest metrics
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

    # Run TOPSIS analysis
    scores = DecisionEngine.topsis(vendor_data_list, scenario.weights)

    return {
        "scenario_id": scenario_id,
        "scenario_name": scenario.name,
        "weights": scenario.weights,
        "rankings": [{"vendor_id": vendor_id, "score": score} for vendor_id, score in scores]
    }
