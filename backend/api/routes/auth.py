from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import text
from backend.core.db import auth_engine
from backend.core.schemas import UserRegister, UserLogin, Token, AuthRequest
from backend.core.security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=dict)
async def register(request: UserRegister):
    try:
        # Email Normalization
        email = request.email.lower().strip()
        
        with auth_engine.begin() as conn: # Using begin for auto-commit
            # Check if exists
            result = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
            if result.fetchone():
                raise HTTPException(status_code=400, detail="User already exists")
            
            # Hash Password
            hashed_password = get_password_hash(request.password)
            
            # Insert
            conn.execute(text("""
                INSERT INTO users (email, password_hash, full_name) 
                VALUES (:email, :pwd, :name)
            """), {"email": email, "pwd": hashed_password, "name": request.full_name})
            
        return {"message": "User registered successfully", "success": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Register Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=Token)
async def login(request: UserLogin):
    try:
        email = request.email.lower().strip()
        
        with auth_engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, password_hash, full_name FROM users WHERE email = :email
            """), {"email": email})
            user = result.fetchone()
            
            if not user or not verify_password(request.password, user[1]): # user[1] is password_hash
                 raise HTTPException(status_code=400, detail="Invalid email or password")
            
            # Generate Token
            access_token = create_access_token(subject=email)
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": str(user[0]),
                    "email": email,
                    "name": user[2]
                }
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Login Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
