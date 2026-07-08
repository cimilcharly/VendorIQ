from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models import User, Organization
from app.schemas.user import UserCreate, UserResponse
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user_create: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_create.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create organization if not provided
    org_id = user_create.organization_id
    if not org_id:
        org = Organization(name=f"{user_create.full_name}'s Organization", industry="General")
        db.add(org)
        db.commit()
        db.refresh(org)
        org_id = org.id

    user = User(
        email=user_create.email,
        username=user_create.username,
        full_name=user_create.full_name,
        hashed_password=get_password_hash(user_create.password),
        organization_id=org_id,
        role="admin"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user
