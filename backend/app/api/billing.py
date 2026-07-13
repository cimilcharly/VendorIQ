from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Organization, User
from app.core.security import get_current_user, check_role

router = APIRouter()

@router.post("/upgrade")
def upgrade_organization(
    current_user: User = Depends(check_role(["admin"])),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org.subscription_plan = "premium"
    db.commit()
    db.refresh(org)
    return {
        "message": "Successfully upgraded to premium tier (simulated billing)",
        "subscription_plan": org.subscription_plan
    }
