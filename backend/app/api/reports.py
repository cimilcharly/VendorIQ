from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Scenario, User, Vendor, VendorMetric, Recommendation
from app.core.security import get_current_user
from app.engine.decision import DecisionEngine, VendorData
from io import BytesIO
import json

router = APIRouter()

def ensure_recommendations(scenario_id: int, current_user: User, db: Session):
    recommendations = db.query(Recommendation).filter(Recommendation.scenario_id == scenario_id).order_by(Recommendation.rank).all()
    if not recommendations:
        scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            return []
        vendors = db.query(Vendor).filter(Vendor.organization_id == current_user.organization_id).all()
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
        
        if vendor_data_list:
            scores = DecisionEngine.topsis(vendor_data_list, scenario.weights)
            for rank, (vendor_id, score) in enumerate(scores, 1):
                rec = Recommendation(
                    scenario_id=scenario_id,
                    vendor_id=vendor_id,
                    score=score,
                    rank=rank,
                )
                db.add(rec)
            db.commit()
            recommendations = db.query(Recommendation).filter(Recommendation.scenario_id == scenario_id).order_by(Recommendation.rank).all()
    return recommendations

@router.get("/stats")
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vendors_count = db.query(Vendor).filter(Vendor.organization_id == current_user.organization_id).count()
    scenarios_count = db.query(Scenario).filter(Scenario.organization_id == current_user.organization_id).count()
    
    # Scenarios that have recommendations
    completed_scenarios = db.query(Scenario.id).filter(
        Scenario.organization_id == current_user.organization_id
    ).join(Recommendation, Recommendation.scenario_id == Scenario.id).distinct().count()

    return {
        "vendors": vendors_count,
        "scenarios": scenarios_count,
        "completed": completed_scenarios
    }

@router.get("/scenario/{scenario_id}/summary")
def get_scenario_summary(scenario_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id, Scenario.organization_id == current_user.organization_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    recommendations = ensure_recommendations(scenario_id, current_user, db)

    vendors_detail = []
    for rec in recommendations[:5]:
        vendor = db.query(Vendor).filter(Vendor.id == rec.vendor_id).first()
        if vendor:
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

    recommendations = ensure_recommendations(scenario_id, current_user, db)

    vendors_with_metrics = []
    for rec in recommendations:
        vendor = db.query(Vendor).filter(Vendor.id == rec.vendor_id).first()
        if not vendor:
            continue
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
