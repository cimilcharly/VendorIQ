from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Scenario, User, Vendor, VendorMetric, Recommendation
from app.core.security import get_current_user
from io import BytesIO
import json

router = APIRouter()

@router.get("/scenario/{scenario_id}/summary")
def get_scenario_summary(scenario_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    recommendations = db.query(Recommendation).filter(Recommendation.scenario_id == scenario_id).order_by(Recommendation.rank).all()

    vendors_detail = []
    for rec in recommendations[:5]:
        vendor = db.query(Vendor).filter(Vendor.id == rec.vendor_id).first()
        vendors_detail.append({
            "vendor_id": vendor.id,
            "vendor_name": vendor.name,
            "category": vendor.category,
            "region": vendor.region,
            "score": rec.score,
            "rank": rec.rank,
        })

    return {
        "scenario_id": scenario_id,
        "scenario_name": scenario.name,
        "description": scenario.description,
        "weights": scenario.weights,
        "top_vendors": vendors_detail,
        "created_at": scenario.created_at,
    }

@router.get("/scenario/{scenario_id}/detailed")
def get_detailed_report(scenario_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    recommendations = db.query(Recommendation).filter(Recommendation.scenario_id == scenario_id).order_by(Recommendation.rank).all()

    vendors_with_metrics = []
    for rec in recommendations:
        vendor = db.query(Vendor).filter(Vendor.id == rec.vendor_id).first()
        metric = db.query(VendorMetric).filter(VendorMetric.vendor_id == rec.vendor_id).order_by(VendorMetric.created_at.desc()).first()

        vendor_info = {
            "vendor_id": vendor.id,
            "vendor_name": vendor.name,
            "category": vendor.category,
            "region": vendor.region,
            "contact_email": vendor.contact_email,
            "gst_number": vendor.gst_number,
            "score": rec.score,
            "rank": rec.rank,
        }

        if metric:
            vendor_info["metrics"] = {
                "cost": metric.cost,
                "quality": metric.quality,
                "delivery_time": metric.delivery_time,
                "reliability": metric.reliability,
                "compliance": metric.compliance,
                "rating": metric.rating,
                "financial_stability": metric.financial_stability,
            }

        vendors_with_metrics.append(vendor_info)

    return {
        "scenario_id": scenario_id,
        "scenario_name": scenario.name,
        "description": scenario.description,
        "weights": scenario.weights,
        "all_vendors": vendors_with_metrics,
        "created_at": scenario.created_at,
        "updated_at": scenario.updated_at,
    }

@router.post("/scenario/{scenario_id}/export")
def export_scenario_as_json(scenario_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = get_detailed_report(scenario_id, current_user, db)
    return report
