from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy import text
from backend.core.security import ALGORITHM, SECRET_KEY
from backend.core.db import auth_engine
from backend.core.schemas import TokenData

# OAuth2 scheme tells FastAPI that the token comes in Authorization header: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except (JWTError, ValidationError):
        raise credentials_exception
        
    # Verify user exists in DB
    try:
        with auth_engine.connect() as conn:
            result = conn.execute(text("SELECT id, email, full_name FROM users WHERE email = :email"), {"email": token_data.email})
            user = result.fetchone()
            
            if user is None:
                raise credentials_exception
                
            return {
                "id": str(user[0]),
                "email": user[1],
                "full_name": user[2]
            }
    except Exception as e:
        print(f"Auth Dep Error: {e}")
        raise credentials_exception
