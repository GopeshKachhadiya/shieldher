from pydantic import BaseModel
from typing import List, Optional

class UserLogin(BaseModel):
    phone: str

class UserVerify(BaseModel):
    phone: str
    otp: str

class PoliceLogin(BaseModel):
    badge: str
    password: str
    totp: Optional[str] = None

class UserProfileSchema(BaseModel):
    name: str
    phone: str
    lang: str
    aadhaar: Optional[str] = None
    role: Optional[str] = "user"

class GuardianSchema(BaseModel):
    id: Optional[str] = None
    name: str
    phone: str
    relation: str
    priority: int

class SuspectInfoSchema(BaseModel):
    platform: Optional[str] = None
    username: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    url: Optional[str] = None

class EvidenceFileSchema(BaseModel):
    name: str
    size: str
    hash: str

class ComplaintCreateSchema(BaseModel):
    category: str
    description: str
    incidentDate: str
    suspectInfo: SuspectInfoSchema
    evidenceFiles: List[EvidenceFileSchema]
    generateFir: bool

class MessageSchema(BaseModel):
    sender: str
    text: str

class ComplaintUpdateSchema(BaseModel):
    status: str

class SOSCreateSchema(BaseModel):
    triggerType: str # 'button' | 'silent' | 'voice' | 'sms'
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LocationUpdateSchema(BaseModel):
    latitude: float
    longitude: float

class DeepfakeDetectRequest(BaseModel):
    fileName: str
    fileSize: str
