from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Vendor, VendorMetric, User, Recommendation
from app.core.redis import get_redis_client
from app.core.logging import logger
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse
from app.schemas.vendor_metric import VendorMetricCreate, VendorMetricResponse
from app.core.security import get_current_user, check_role

router = APIRouter()

@router.post("/", response_model=VendorResponse)
def create_vendor(vendor: VendorCreate, current_user: User = Depends(check_role(["admin", "procurement_manager"])), db: Session = Depends(get_db)):
    db_vendor = Vendor(
        organization_id=current_user.organization_id,
        name=vendor.name,
        category=vendor.category,
        region=vendor.region,
        contact_email=vendor.contact_email,
        contact_phone=vendor.contact_phone,
        gst_number=vendor.gst_number,
    )
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)

    if vendor.metrics:
        metric = VendorMetric(
            vendor_id=db_vendor.id,
            cost=vendor.metrics.cost,
            quality=vendor.metrics.quality,
            delivery_time=vendor.metrics.delivery_time,
            reliability=vendor.metrics.reliability,
            compliance=vendor.metrics.compliance,
            rating=vendor.metrics.rating,
            financial_stability=vendor.metrics.financial_stability,
        )
        db.add(metric)
        db.commit()

    return db_vendor

@router.get("/", response_model=List[VendorResponse])
def list_vendors(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vendors = db.query(Vendor).filter(Vendor.organization_id == current_user.organization_id).offset(skip).limit(limit).all()
    return vendors

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.organization_id == current_user.organization_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: int, vendor: VendorUpdate, current_user: User = Depends(check_role(["admin", "procurement_manager"])), db: Session = Depends(get_db)):
    db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.organization_id == current_user.organization_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    for key, value in vendor.dict(exclude_unset=True).items():
        setattr(db_vendor, key, value)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: int, current_user: User = Depends(check_role(["admin", "procurement_manager"])), db: Session = Depends(get_db)):
    db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.organization_id == current_user.organization_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(db_vendor)
    db.commit()
    return {"message": "Vendor deleted"}

@router.post("/{vendor_id}/metrics", response_model=VendorMetricResponse)
def add_vendor_metrics(vendor_id: int, metric: VendorMetricCreate, current_user: User = Depends(check_role(["admin", "procurement_manager"])), db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.organization_id == current_user.organization_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    db_metric = VendorMetric(**metric.dict())
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)

    # Invalidate all TOPSIS caches and recommendations since metrics have updated
    try:
        db.query(Recommendation).delete()
        db.commit()
    except Exception as e:
        logger.error(f"Failed to delete database recommendations: {e}")

    if redis_client := get_redis_client():
        try:
            keys = redis_client.keys("topsis_cache:*")
            if keys:
                redis_client.delete(*keys)
        except Exception as e:
            logger.error(f"Failed to clear Redis TOPSIS caches: {e}")

    return db_metric

@router.get("/{vendor_id}/metrics", response_model=List[VendorMetricResponse])
def get_vendor_metrics(vendor_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.organization_id == current_user.organization_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor.metrics
