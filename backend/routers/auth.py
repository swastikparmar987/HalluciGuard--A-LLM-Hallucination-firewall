from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from backend.firewall.cloudant_client import cloudant_service
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserSignup(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(user: UserSignup):
    # Check if user already exists
    existing = cloudant_service.get_user(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_doc = {
        "email": user.email,
        "password": user.password, # In a real app, hash this!
        "name": user.name,
        "created_at": datetime.utcnow().isoformat(),
        "role": "agent"
    }
    
    user_id = cloudant_service.log_user(user_doc)
    if not user_id:
        raise HTTPException(status_code=500, detail="Cloudant storage failure")
    
    return {"message": "Signup successful", "user_id": user_id}

@router.post("/login")
def login(user: UserLogin):
    try:
        existing = cloudant_service.get_user(user.email)
        if not existing or existing.get("password") != user.password:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "message": "Login successful",
            "user": {
                "email": existing.get("email"),
                "name": existing.get("name"),
                "role": existing.get("role", "agent"),
                "id": existing.get("_id")
            }
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Authentication server error: {str(e)}")
