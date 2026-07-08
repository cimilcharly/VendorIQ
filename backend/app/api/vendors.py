from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Vendor, VendorMetric, User
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse
from app.schemas.vendor_metric import VendorMetricCreate, VendorMetricResponse
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=VendorResponse)
def create_vendor(vendor: VendorCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def list_vendors(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vendors = db.query(Vendor).filter(Vendor.organization_id == current_user.organization_id).all()
    return vendors

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.organization_id == current_user.organization_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(vendor_id: int, vendor: VendorUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.organization_id == current_user.organization_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    for key, value in vendor.dict(exclude_unset=True).items():
        setattr(db_vendor, key, value)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

@router.delete("/{vendor_id}")
def delete_vendor(vendor_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.organization_id == current_user.organization_id).first()
    if not db_vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(db_vendor)
    db.commit()
    return {"message": "Vendor deleted"}

@router.post("/{vendor_id}/metrics", response_model=VendorMetricResponse)
def add_vendor_metrics(vendor_id: int, metric: VendorMetricCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.organization_id == current_user.organization_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    db_metric = VendorMetric(**metric.dict())
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric

@router.get("/{vendor_id}/metrics", response_model=List[VendorMetricResponse])
def get_vendor_metrics(vendor_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id, Vendor.organization_id == current_user.organization_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor.metrics
