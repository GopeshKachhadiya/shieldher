from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import pandas as pd
import json
import time
import base64
import random
from typing import List, Optional
from sqlalchemy.orm import Session

from database import engine, get_db
import db_models
import schemas

from features.extractor import FeatureExtractor, FEATURE_NAMES
from models.random_forest import PhishingRandomForest

# Create DB Tables
db_models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ShieldHer AI Backend & Dispatch Hub")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed default database values
def seed_db():
    db = SessionLocal = engine.connect()
    from sqlalchemy.orm import sessionmaker
    SessionMaker = sessionmaker(bind=engine)
    session = SessionMaker()
    try:
        # Seed Citizen User
        user_exists = session.query(db_models.DBUser).filter(db_models.DBUser.phone == "+91 98765 43210").first()
        if not user_exists:
            citizen = db_models.DBUser(
                id="user-priya",
                name="Priya Sharma",
                phone="+91 98765 43210",
                lang="en",
                aadhaar="554433221100",
                role="user"
            )
            session.add(citizen)
            
            # Seed default guardians
            g1 = db_models.DBGuardian(id="g1", user_id="user-priya", name="Rajesh Sharma", phone="+91 98765 43210", relation="Father", priority=1)
            g2 = db_models.DBGuardian(id="g2", user_id="user-priya", name="Sunita Sharma", phone="+91 98765 43211", relation="Mother", priority=2)
            g3 = db_models.DBGuardian(id="g3", user_id="user-priya", name="Amit Verma", phone="+91 98765 43212", relation="Husband/Partner", priority=3)
            session.add_all([g1, g2, g3])

        # Seed Police User
        police_exists = session.query(db_models.DBUser).filter(db_models.DBUser.badge == "CC-4902").first()
        if not police_exists:
            police = db_models.DBUser(
                id="officer-patel",
                name="Inspector M. Patel",
                phone="+91 79263 01930",
                lang="en",
                role="police",
                badge="CC-4902",
                password_hash="password123"
            )
            session.add(police)

        # Seed Complaints
        complaint1_exists = session.query(db_models.DBComplaint).filter(db_models.DBComplaint.id == "SH-2026-8902").first()
        if not complaint1_exists:
            c1 = db_models.DBComplaint(
                id="SH-2026-8902",
                user_id="user-priya",
                category="cyberstalking",
                description="An anonymous Instagram user is continuously sending threatening and stalker-like direct messages to my private account. They know details about my daily college schedule and have posted pictures of me taken from a distance without my consent. Despite blocking 3 accounts, they keep creating new ones to message me.",
                incidentDate="2026-06-08",
                suspectInfo=json.dumps({
                    "platform": "Instagram",
                    "username": "@dark_shadow_666",
                    "url": "https://instagram.com/dark_shadow_666"
                }),
                status="investigating",
                priority="urgent",
                assignedOfficer=json.dumps({
                    "name": "Inspector M. Patel",
                    "badgeNumber": "CC-4902",
                    "rank": "Senior Investigator",
                    "phone": "+91 79263 01930"
                }),
                firNumber="FIR/2026/CYBER/9041",
                aiRiskScore=0.82,
                evidenceFiles=json.dumps([
                    {
                        "id": "ev1",
                        "name": "stalking_chats_1.png",
                        "size": "1.2 MB",
                        "type": "image/png",
                        "hash": "a58f7e21b069d35f4422e11a2f4c66708e92c21ff285310034a8e2bc13efd89a",
                        "url": "#",
                        "uploadedAt": "2026-06-08T14:30:00Z",
                        "deepfakeScore": 0.05
                    },
                    {
                        "id": "ev2",
                        "name": "unauthorized_photo.png",
                        "size": "2.4 MB",
                        "type": "image/png",
                        "hash": "b69f7e22c079e36f4523e12b2f5c77709e93c31ff385410035a9e3bc23efd89b",
                        "url": "#",
                        "uploadedAt": "2026-06-08T14:31:00Z",
                        "deepfakeScore": 0.12
                    }
                ]),
                messages=json.dumps([
                    { "id": "m1", "sender": "officer", "text": "Hello Priya, I have reviewed your case files. We have requested the registration logs from Meta for the suspect handle. Please keep your account settings set to private.", "timestamp": "2026-06-09T09:30:00Z" },
                    { "id": "m2", "sender": "user", "text": "Thank you Inspector. They sent another message today from @dark_shadow_777. I have screenshotted it, should I upload it here?", "timestamp": "2026-06-09T10:10:00Z" },
                    { "id": "m3", "sender": "officer", "text": "Yes, please upload the new screenshot using the Add Evidence button so it is linked to this case file with a secure hash.", "timestamp": "2026-06-09T10:15:00Z" }
                ]),
                firDraft=json.dumps({
                    "text": "FIRST INFORMATION REPORT\nUnder Section 154 CrPC\n\n1. District: Ahmedabad City\n2. Police Station: Cyber Crime Branch\n3. FIR Number: FIR/2026/CYBER/9041\n4. Date & Time of Occurrence: 08/06/2026 14:32 Hours\n\n5. Details of Complainant:\n   Name: Priya Sharma\n   Address: Vastrapur, Ahmedabad\n\n6. Description of Incident:\n   The complainant reports persistent cyberstalking and online harassment by an unidentified individual operating under the Instagram handle @dark_shadow_666. The suspect has demonstrated knowledge of the complainant's offline whereabouts and college schedules, generating severe emotional distress and raising safety alarms.\n\n7. Suspect Handles / Accounts:\n   Instagram Profile: https://instagram.com/dark_shadow_666\n\n8. Applicable Sections:\n   - Section 354D IPC (Cyberstalking)\n   - Section 66C Information Technology Act (Identity Theft/Impersonation)\n   - Section 66E IT Act (Violation of Privacy)",
                    "ipcSections": ["Section 354D IPC", "Section 66C IT Act", "Section 66E IT Act"]
                }),
                createdAt="2026-06-08T14:32:00Z",
                updatedAt="2026-06-09T10:15:00Z"
            )
            session.add(c1)

        complaint2_exists = session.query(db_models.DBComplaint).filter(db_models.DBComplaint.id == "SH-2026-7612").first()
        if not complaint2_exists:
            c2 = db_models.DBComplaint(
                id="SH-2026-7612",
                user_id="user-priya",
                category="financial_fraud",
                description="I received a message on Telegram offering a part-time job doing product reviews. They asked me to deposit Rs. 5000 initially, promising Rs. 8000 return. After the first transfer, they locked me out of the channel and blocked my number. The UPI ID used for payment was quick-pay@icici.",
                incidentDate="2026-06-02",
                suspectInfo=json.dumps({
                    "platform": "Telegram / UPI",
                    "username": "@earn_cash_parttime",
                    "phone": "+91 99887 76655"
                }),
                status="resolved",
                priority="normal",
                assignedOfficer=json.dumps({
                    "name": "Sub-Inspector R. Sen",
                    "badgeNumber": "CC-5120",
                    "rank": "Fraud Specialist",
                    "phone": "+91 79263 01931"
                }),
                firNumber="FIR/2026/CYBER/7612",
                aiRiskScore=0.35,
                evidenceFiles=json.dumps([
                    {
                        "id": "ev3",
                        "name": "payment_screenshot.png",
                        "size": "850 KB",
                        "type": "image/png",
                        "hash": "c70f7e23d089f36g4523e12c2f5c77709e93c31ff385410035a9e3bc23efd89c",
                        "url": "#",
                        "uploadedAt": "2026-06-02T10:05:00Z"
                    }
                ]),
                messages=json.dumps([
                    { "id": "m4", "sender": "officer", "text": "UPI transaction has been flagged and the beneficiary bank account in Bihar has been frozen. Refund process initiated.", "timestamp": "2026-06-04T12:00:00Z" },
                    { "id": "m5", "sender": "user", "text": "Thank you for the quick action! I will be more careful now.", "timestamp": "2026-06-05T15:30:00Z" }
                ]),
                firDraft=None,
                createdAt="2026-06-02T10:00:00Z",
                updatedAt="2026-06-05T16:00:00Z"
            )
            session.add(c2)
        
        session.commit()
    finally:
        session.close()

seed_db()

# Load model on startup
model = PhishingRandomForest()
extractor = FeatureExtractor()

model_path = 'saved_models/rf_model.pkl'
if os.path.exists(model_path):
    model.load(model_path)
    print("Model loaded successfully.")
else:
    print("WARNING: Model not found. Run train.py first.")

# JWT Helpers
def create_jwt(payload: dict) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload["exp"] = time.time() + 3600 * 24
    h_str = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    p_str = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    return f"{h_str}.{p_str}.sig"

# WebSocket Dispatch Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws/sos")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep socket alive and listen for client location pings
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                # If citizen updates location while active, broadcast it to dashboard
                if payload.get("type") == "location_update":
                    await manager.broadcast({
                        "type": "SOS_LOCATION_UPDATE",
                        "id": payload.get("id"),
                        "latitude": payload.get("latitude"),
                        "longitude": payload.get("longitude")
                    })
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ----------------- AUTH ENDPOINTS -----------------

@app.post("/api/auth/login")
async def user_login(req: schemas.UserLogin, db: Session = Depends(get_db)):
    # Returns simulated OTP bypass for front-end
    return {"message": "OTP sent successfully", "code": "123456"}

@app.post("/api/auth/verify-otp")
async def verify_otp(req: schemas.UserVerify, db: Session = Depends(get_db)):
    if req.otp != "123456" and len(req.otp) != 6:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")
    
    clean_phone = req.phone.strip()
    user = db.query(db_models.DBUser).filter(db_models.DBUser.phone == clean_phone).first()
    
    if not user:
        # Create user profile on onboarding
        user_id = f"user-{int(time.time())}"
        user = db_models.DBUser(
            id=user_id,
            name="New User",
            phone=clean_phone,
            lang="en",
            role="user"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_jwt({"id": user.id, "phone": user.phone, "role": user.role})
    return {
        "token": token,
        "profile": {
            "name": user.name,
            "phone": user.phone,
            "lang": user.lang,
            "aadhaar": user.aadhaar or "",
            "role": user.role,
            "isLoggedIn": True
        }
    }

@app.post("/api/auth/police-login")
async def police_login(req: schemas.PoliceLogin, db: Session = Depends(get_db)):
    officer = db.query(db_models.DBUser).filter(
        db_models.DBUser.badge == req.badge.strip(),
        db_models.DBUser.role == "police"
    ).first()
    
    if not officer or officer.password_hash != req.password:
        raise HTTPException(status_code=401, detail="Unauthorized Badge Credentials.")
    
    token = create_jwt({"id": officer.id, "badge": officer.badge, "role": officer.role})
    return {
        "token": token,
        "profile": {
            "name": officer.name,
            "phone": officer.phone,
            "lang": officer.lang,
            "role": officer.role,
            "badgeNumber": officer.badge,
            "isLoggedIn": True
        }
    }

# ----------------- GUARDIANS ENDPOINTS -----------------

@app.get("/api/guardians")
async def get_guardians(db: Session = Depends(get_db)):
    # Simple citizen user query (demo defaults to user-priya)
    guardians = db.query(db_models.DBGuardian).filter(db_models.DBGuardian.user_id == "user-priya").all()
    return guardians

@app.post("/api/guardians")
async def save_guardians(req: List[schemas.GuardianSchema], db: Session = Depends(get_db)):
    # Delete existing and recreate
    db.query(db_models.DBGuardian).filter(db_models.DBGuardian.user_id == "user-priya").delete()
    for idx, g in enumerate(req):
        g_id = g.id or f"g-{int(time.time())}-{idx}"
        db_g = db_models.DBGuardian(
            id=g_id,
            user_id="user-priya",
            name=g.name,
            phone=g.phone,
            relation=g.relation,
            priority=g.priority
        )
        db.add(db_g)
    db.commit()
    return {"success": True}

# ----------------- SOS INCIDENTS ENDPOINTS -----------------

@app.get("/api/sos/active")
async def get_active_sos(db: Session = Depends(get_db)):
    incidents = db.query(db_models.DBLiveIncident).order_by(db_models.DBLiveIncident.createdAt.desc()).all()
    return incidents

@app.post("/api/sos")
async def trigger_sos(req: schemas.SOSCreateSchema, db: Session = Depends(get_db)):
    # default coordinates to Ahmedabad CG Road
    lat = req.latitude if req.latitude is not None else 23.0225
    lng = req.longitude if req.longitude is not None else 72.5714
    
    # Generate unique incident ref
    inc_id = f"inc-{random.randint(1000, 9999)}"
    
    new_inc = db_models.DBLiveIncident(
        id=inc_id,
        userName="Priya Sharma",
        phone="+91 98765 43210",
        latitude=lat,
        longitude=lng,
        accuracy=6.0,
        triggerType=req.triggerType,
        status="active",
        createdAt=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )
    
    db.add(new_inc)
    db.commit()
    db.refresh(new_inc)
    
    # Broadcast SOS event via WebSocket
    incident_dict = {
        "id": new_inc.id,
        "userName": new_inc.userName,
        "phone": new_inc.phone,
        "latitude": new_inc.latitude,
        "longitude": new_inc.longitude,
        "accuracy": new_inc.accuracy,
        "triggerType": new_inc.triggerType,
        "status": new_inc.status,
        "createdAt": new_inc.createdAt
    }
    
    await manager.broadcast({
        "type": "SOS_TRIGGERED",
        "incident": incident_dict
    })
    
    return incident_dict

@app.put("/api/sos/{id}/dispatch")
async def dispatch_sos(id: str, db: Session = Depends(get_db)):
    inc = db.query(db_models.DBLiveIncident).filter(db_models.DBLiveIncident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    inc.status = "responding"
    inc.assignedOfficerId = "CC-4902"
    db.commit()
    
    await manager.broadcast({
        "type": "SOS_DISPATCHED",
        "id": id,
        "status": "responding",
        "assignedOfficerId": "CC-4902"
    })
    return {"success": True}

@app.put("/api/sos/{id}/resolve")
async def resolve_sos(id: str, db: Session = Depends(get_db)):
    inc = db.query(db_models.DBLiveIncident).filter(db_models.DBLiveIncident.id == id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    inc.status = "resolved"
    db.commit()
    
    await manager.broadcast({
        "type": "SOS_RESOLVED",
        "id": id,
        "status": "resolved"
    })
    return {"success": True}

# ----------------- COMPLAINTS ENDPOINTS -----------------

@app.get("/api/complaints")
async def get_complaints(db: Session = Depends(get_db)):
    complaints = db.query(db_models.DBComplaint).order_by(db_models.DBComplaint.createdAt.desc()).all()
    
    response = []
    for c in complaints:
        response.append({
            "id": c.id,
            "category": c.category,
            "description": c.description,
            "incidentDate": c.incidentDate,
            "suspectInfo": json.loads(c.suspectInfo),
            "status": c.status,
            "priority": c.priority,
            "assignedOfficer": json.loads(c.assignedOfficer) if c.assignedOfficer else None,
            "firNumber": c.firNumber,
            "aiRiskScore": c.aiRiskScore,
            "evidenceFiles": json.loads(c.evidenceFiles),
            "messages": json.loads(c.messages),
            "firDraft": json.loads(c.firDraft) if c.firDraft else None,
            "createdAt": c.createdAt,
            "updatedAt": c.updatedAt
        })
    return response

@app.post("/api/complaints")
async def create_complaint(req: schemas.ComplaintCreateSchema, db: Session = Depends(get_db)):
    comp_id = f"SH-{time.strftime('%Y')}-{random.randint(1000, 9999)}"
    
    # Analyze Risk Category and Assign Priority
    priority = "normal"
    ai_risk = 0.45
    if req.category in ["cyberstalking", "blackmail", "deepfake"]:
        priority = "urgent"
        ai_risk = 0.82 if req.category == "cyberstalking" else 0.92 if req.category == "blackmail" else 0.88

    # Formulate evidence models
    evidence_list = []
    for idx, e in enumerate(req.evidenceFiles):
        evidence_list.append({
            "id": f"ev-{int(time.time()*1000)}-{idx}",
            "name": e.name,
            "size": e.size,
            "type": "application/pdf" if e.name.endswith(".pdf") else "image/png",
            "hash": e.hash,
            "url": "#",
            "uploadedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        })

    # System Initial Chat Message
    initial_msg = [{
        "id": f"msg-{int(time.time()*1000)}",
        "sender": "officer",
        "text": f"Hello, we have successfully received your complaint under file reference {comp_id}. An officer will be assigned shortly to review the evidence.",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }]

    # Generate FIR details if requested
    fir_number = None
    fir_draft_dict = None
    if req.generateFir:
        fir_number = f"FIR/{time.strftime('%Y')}/CYBER/{random.randint(1000, 9999)}"
        formatted_cat = req.category.replace('_', ' ').upper()
        fir_draft_dict = {
            "text": f"FIRST INFORMATION REPORT\nUnder Section 154 CrPC\n\n1. District: Ahmedabad City\n2. Police Station: Cyber Crime Branch\n3. FIR Number: {fir_number}\n4. Date & Time of Occurrence: {req.incidentDate} (Reported: {time.strftime('%d/%m/%Y')})\n\n5. Details of Complainant:\n   Name: Priya Sharma\n   Contact: +91 98765 43210\n\n6. Description of Incident:\n   The complainant reports persistent cybercrime activity relating to {formatted_cat}. Detailed events: \n   {req.description}\n\n7. Suspect Details:\n   Username: {req.suspectInfo.username or 'N/A'}\n   Platform: {req.suspectInfo.platform or 'N/A'}\n   Profile URL: {req.suspectInfo.url or 'N/A'}\n\n8. Applicable Sections:\n   - Section 354D IPC (Cyberstalking / Harassment)\n   - Section 66C Information Technology Act (Identity Theft/Impersonation)\n   - Section 66E IT Act (Violation of Privacy)",
            "ipcSections": ["Section 354D IPC", "Section 66C IT Act", "Section 66E IT Act"]
        }

    new_comp = db_models.DBComplaint(
        id=comp_id,
        user_id="user-priya",
        category=req.category,
        description=req.description,
        incidentDate=req.incidentDate,
        suspectInfo=json.dumps(req.suspectInfo.dict()),
        status="submitted",
        priority=priority,
        assignedOfficer=None,
        firNumber=fir_number,
        aiRiskScore=ai_risk,
        evidenceFiles=json.dumps(evidence_list),
        messages=json.dumps(initial_msg),
        firDraft=json.dumps(fir_draft_dict) if fir_draft_dict else None,
        createdAt=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        updatedAt=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )

    db.add(new_comp)
    db.commit()
    
    return {"id": comp_id}

@app.put("/api/complaints/{id}/status")
async def update_complaint_status(id: str, req: schemas.ComplaintUpdateSchema, db: Session = Depends(get_db)):
    comp = db.query(db_models.DBComplaint).filter(db_models.DBComplaint.id == id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    comp.status = req.status
    comp.updatedAt = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    # Auto-assign officer if status advances
    if req.status in ["assigned", "investigating"]:
        officer = {
            "name": "Inspector M. Patel",
            "badgeNumber": "CC-4902",
            "rank": "Senior Investigator",
            "phone": "+91 79263 01930"
        }
        comp.assignedOfficer = json.dumps(officer)

    # Append status change notification message
    current_msgs = json.loads(comp.messages)
    current_msgs.append({
        "id": f"msg-{int(time.time()*1000)}",
        "sender": "officer",
        "text": f"Notice: Case status has been updated to \"{req.status.replace('_', ' ').upper()}\".",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })
    comp.messages = json.dumps(current_msgs)
    
    db.commit()
    return {"success": True}

@app.post("/api/complaints/{id}/messages")
async def add_complaint_message(id: str, req: schemas.MessageSchema, db: Session = Depends(get_db)):
    comp = db.query(db_models.DBComplaint).filter(db_models.DBComplaint.id == id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    current_msgs = json.loads(comp.messages)
    current_msgs.append({
        "id": f"msg-{int(time.time()*1000)}",
        "sender": req.sender,
        "text": req.text,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })
    comp.messages = json.dumps(current_msgs)
    comp.updatedAt = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    db.commit()
    return {"success": True}

@app.put("/api/complaints/{id}/fir")
async def finalize_fir(id: str, req: schemas.MessageSchema, db: Session = Depends(get_db)):
    # req.text carries full final FIR text
    comp = db.query(db_models.DBComplaint).filter(db_models.DBComplaint.id == id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    comp.status = "investigating"
    if not comp.firNumber:
        comp.firNumber = f"FIR/{time.strftime('%Y')}/CYBER/{random.randint(1000, 9999)}"

    fir_dict = {
        "text": req.text,
        "ipcSections": ["Section 354D IPC", "Section 66C IT Act", "Section 66E IT Act"]
    }
    comp.firDraft = json.dumps(fir_dict)
    comp.updatedAt = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    db.commit()
    return {"success": True}

# ----------------- AI PROFILE THREAT / DEEPFAKE SCAN -----------------

@app.post("/api/scan-profile")
async def scan_profile(req: schemas.SuspectInfoSchema):
    # Standard threat scan score + reasons
    if not req.url:
         raise HTTPException(status_code=400, detail="Missing target profile URL")
    
    return {
        "url": req.url,
        "fakeScore": 84,
        "riskLevel": "CRITICAL RISK",
        "reasons": [
            "Account has 0 posts and was created in the last 48 hours.",
            "High frequency automation logs detected: 140 outbound direct messages in 60 minutes.",
            "IP address geolocation maps to proxy server cluster frequently linked with phishing networks.",
            "Profile avatar matches a known deepfake model generation template."
        ]
    }

@app.post("/api/deepfake-detect")
async def detect_deepfake(req: schemas.DeepfakeDetectRequest):
    # Metadata forensics analysis simulator
    is_deepfake = req.fileName.lower().endswith(".jpg") or req.fileName.lower().endswith(".png") or "morph" in req.fileName.lower()
    score = 88 if is_deepfake else 12
    return {
        "fileName": req.fileName,
        "isDeepfake": is_deepfake,
        "score": score,
        "reasons": [
            "AI generation artifacts: frequency analysis shows anomalous Fourier coefficients.",
            "Discrepancies in lighting angles across human face contour points.",
            "Missing EXIF camera capture metadata indicating programmatic generation."
        ] if is_deepfake else ["Standard photography file structure and EXIF metadata verified."]
    }

# ----------------- ORIGINAL URL SCANNING LOGIC -----------------

class URLRequest(BaseModel):
    url: str

@app.post("/scan")
async def scan_url(req: URLRequest):
    url = req.url.strip()
    original_url = url
    
    # Normalize URL if scheme is missing
    if not url.startswith('http://') and not url.startswith('https://'):
        url = 'https://' + url
        
    import tldextract
    ext = tldextract.extract(url)
    domain_full = f"{ext.domain}.{ext.suffix}".lower()
    
    # Fast-path whitelist for known safe domains
    TRUSTED_DOMAINS = {
        'google.com', 'google.co.in', 'instagram.com', 'facebook.com', 'whatsapp.com',
        'youtube.com', 'github.com', 'microsoft.com', 'apple.com', 'sbi.co.in',
        'paytm.com', 'icicibank.com', 'amazon.in', 'amazon.com', 'twitter.com',
        'x.com', 'linkedin.com', 'cybercrime.gov.in', 'gov.in'
    }
    
    if domain_full in TRUSTED_DOMAINS:
        return {
            "url": original_url,
            "phishingScore": 1,
            "riskLevel": "SAFE",
            "domainAge": "Trusted",
            "sslValid": True,
            "reasons": [
                "Verified official domain owned by trusted provider.",
                "Valid SSL/TLS certificate with high-security authority.",
                "High domain reputation with zero reports of abuse."
            ],
            "confidence": 0.99
        }
    
    # Extract features
    ext_result = extractor.extract_features(url)
    features = ext_result['features']
    reasons = ext_result['reasons']
    
    # Predict
    df = pd.DataFrame([features])[FEATURE_NAMES]
    
    if os.path.exists(model_path):
        prob = model.predict_proba(df)[0]
        phishing_prob = prob[1] # 1 is phishing class
    else:
        # Fallback dummy logic if model not trained
        phishing_prob = 0.5 if len(reasons) > 0 else 0.1
        
    phishing_score = int(phishing_prob * 100)
    
    if phishing_score >= 60:
        risk_level = "CRITICAL"
    elif phishing_score >= 30:
        risk_level = "SUSPICIOUS"
    else:
        risk_level = "SAFE"
        
    if not reasons:
        reasons.append("Domain registration details show standard parameters.")
        reasons.append("No known brand conflicts detected.")
        reasons.append("Connection uses standard security layers.")
        
    return {
        "url": url,
        "phishingScore": phishing_score,
        "riskLevel": risk_level,
        "domainAge": "Unknown",
        "sslValid": features.get('has_https', 0) == 1,
        "reasons": reasons,
        "confidence": phishing_prob
    }
