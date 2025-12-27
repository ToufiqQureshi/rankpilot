
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str 
    session_id: str 
    user_id: str = "user_default" 
    brand_voice_id: str | None = None 

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

# Backward compatibility (Deprecate later)
class AuthRequest(BaseModel):
    email: str
    password: str
    full_name: str | None = None
