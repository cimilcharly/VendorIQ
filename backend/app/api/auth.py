from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import jwt, JWTError
from app.database import get_db
from app.models import User, Organization
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    login_rate_limiter,
    register_rate_limiter,
)
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserResponse, dependencies=[Depends(register_rate_limiter)])
def register(user_create: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_create.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create organization if not provided
    org_id = user_create.organization_id
    assigned_role = user_create.role
    if not org_id:
        org = Organization(name=f"{user_create.full_name}'s Organization", industry="General")
        db.add(org)
        db.commit()
        db.refresh(org)
        org_id = org.id
        # First user is always admin
        assigned_role = "admin"

    user = User(
        email=user_create.email,
        username=user_create.username,
        full_name=user_create.full_name,
        hashed_password=get_password_hash(user_create.password),
        organization_id=org_id,
        role=assigned_role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", dependencies=[Depends(login_rate_limiter)])
def login(login_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)}, expires_delta=refresh_token_expires
    )

    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=False,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role
    }

@router.post("/refresh")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        # Fallback to Authorization header if cookies aren't used/available (for flexibility)
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        sub_str = payload.get("sub")
        if not sub_str:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user_id = int(sub_str)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    new_access_token = create_access_token(data={"sub": str(user.id)})
    
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )
    
    return {"access_token": new_access_token}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

