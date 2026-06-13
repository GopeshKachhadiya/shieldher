from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class DBUser(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    lang = Column(String, default="en")
    aadhaar = Column(String, nullable=True)
    role = Column(String, default="user") # 'user' or 'police'
    badge = Column(String, nullable=True, unique=True)
    password_hash = Column(String, nullable=True)

class DBGuardian(Base):
    __tablename__ = "guardians"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String)
    phone = Column(String)
    relation = Column(String)
    priority = Column(Integer)

class DBComplaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    category = Column(String)
    description = Column(String)
    incidentDate = Column(String)
    suspectInfo = Column(String) # JSON string
    status = Column(String, default="submitted")
    priority = Column(String, default="normal")
    assignedOfficer = Column(String, nullable=True) # JSON string
    firNumber = Column(String, nullable=True)
    aiRiskScore = Column(Float, default=0.0)
    evidenceFiles = Column(String) # JSON string
    messages = Column(String) # JSON string
    firDraft = Column(String, nullable=True) # JSON string
    createdAt = Column(String)
    updatedAt = Column(String)

class DBLiveIncident(Base):
    __tablename__ = "live_incidents"

    id = Column(String, primary_key=True, index=True)
    userName = Column(String)
    phone = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    accuracy = Column(Float)
    triggerType = Column(String) # 'button', 'silent', 'voice', 'sms'
    status = Column(String, default="active") # 'active', 'responding', 'resolved'
    assignedOfficerId = Column(String, nullable=True)
    createdAt = Column(String)

class DBMonitoredGirl(Base):
    __tablename__ = "monitored_girls"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="safe")
    lastSeen = Column(String)
    avatarColor = Column(String)
    history = Column(String) # JSON list

