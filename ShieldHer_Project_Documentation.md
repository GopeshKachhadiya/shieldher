# 🛡️ ShieldHer — Cyber-Integrated Safety Platform for Women
### KanadShield Hackathon | Problem Statement PS-69EEFD950B72D
### Cyber Crime Branch, Ahmedabad City

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [System Architecture](#3-system-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Module Breakdown](#5-module-breakdown)
6. [Database Schema](#6-database-schema)
7. [API Design](#7-api-design)
8. [AI/ML Features](#8-aiml-features)
9. [Security Architecture](#9-security-architecture)
10. [Integration Points](#10-integration-points)
11. [Frontend Structure](#11-frontend-structure)
12. [Backend Structure](#12-backend-structure)
13. [Development Roadmap](#13-development-roadmap)
14. [Deployment Guide](#14-deployment-guide)
15. [Bonus Features](#15-bonus-features)

---

## 1. Project Overview

**ShieldHer** is a Unified Cyber-Physical Safety Platform designed for women, acting as a Single Point of Contact (SPOC) that bridges emergency response, cybercrime reporting, and proactive digital safety mechanisms. It integrates directly with the Cyber Crime Branch, Ahmedabad City and ERSS (112) to enable real-time intervention and digital investigation.

### Vision
> Empower every woman with a digital shield — from instant SOS to AI-driven cyber threat detection, ensuring safety in both physical and digital spaces.

### Hackathon Submission Info
- **Team Name:** [Your Team Name]
- **Problem ID:** PS-69EEFD950B72D
- **Category:** Cyber + Physical Safety
- **Build Phase:** Website First → Mobile App Second

---

## 2. Key Features

| Feature | Description | Priority |
|---|---|---|
| One-Touch SOS | Instantly alerts police + cyber cell with live location | P0 |
| Cybercrime Reporting | Report stalking, harassment, fraud with evidence | P0 |
| Evidence Upload | Tamper-proof screenshots, chat logs, URLs | P0 |
| Police Dashboard | Real-time incident map + case management | P0 |
| AI Threat Detection | Fake profiles, phishing links, deepfake detection | P1 |
| Guardian Alerts | Notify trusted contacts during emergencies | P1 |
| Silent SOS / Panic Mode | Covert distress signal without visible interaction | P1 |
| Offline SMS Alert | SMS-based SOS when no internet available | P2 |
| Multilingual Support | English, Hindi, Gujarati | P2 |
| Unsafe Zone Prediction | AI heatmap of high-risk areas | P2 |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  ┌──────────────────┐          ┌──────────────────────────────────┐ │
│  │   Web App        │          │   Mobile App (Flutter - Phase 2) │ │
│  │   (React.js)     │          │                                  │ │
│  └────────┬─────────┘          └──────────────┬───────────────────┘ │
└───────────┼─────────────────────────────────┬─┘─────────────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                                │
│              (Nginx Reverse Proxy + Rate Limiter + WAF)             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
        ┌─────────────────────┼────────────────────┐
        ▼                     ▼                    ▼
┌──────────────┐   ┌─────────────────┐   ┌─────────────────────┐
│  Auth Service │   │   Core API      │   │  Real-Time Service  │
│  (JWT/OAuth)  │   │  (Node.js /     │   │  (Socket.io /       │
│               │   │   Express)      │   │   WebSockets)       │
└──────────────┘   └────────┬────────┘   └─────────────────────┘
                            │
        ┌───────────────────┼──────────────────────┐
        ▼                   ▼                       ▼
┌──────────────┐   ┌─────────────────┐   ┌─────────────────────┐
│  AI/ML Engine │   │  Evidence Store │   │  Notification       │
│  (Python /    │   │  Service        │   │  Service            │
│   FastAPI)    │   │  (Encrypted)    │   │  (FCM/SMS/Email)    │
└──────────────┘   └─────────────────┘   └─────────────────────┘
        │                   │
        ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                       DATA LAYER                              │
│  ┌────────────┐  ┌────────────┐  ┌─────────┐  ┌──────────┐  │
│  │ PostgreSQL │  │  MongoDB   │  │  Redis  │  │   AWS S3  │  │
│  │ (Users,    │  │ (Evidence, │  │ (Cache, │  │ (Media   │  │
│  │  Cases,    │  │  Reports)  │  │  RT     │  │  Files)  │  │
│  │  FIRs)     │  │            │  │  Data)  │  │          │  │
│  └────────────┘  └────────────┘  └─────────┘  └──────────┘  │
└──────────────────────────────────────────────────────────────┘
        │                   │
        ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                           │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐  │
│  │  ERSS (112)  │  │  Cybercrime   │  │  Police CCTNS DB  │  │
│  │  Integration │  │  Portal API   │  │  (Simulated)      │  │
│  └──────────────┘  └───────────────┘  └───────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow — SOS Alert

```
User Presses SOS
      │
      ▼
React App captures GPS + timestamp
      │
      ▼
POST /api/v1/sos/trigger  ──── JWT verified ──── rate-limited
      │
      ▼
Core API Server
  ├── Saves incident to PostgreSQL
  ├── Saves raw GPS stream to Redis (real-time)
  ├── Triggers WebSocket broadcast to Police Dashboard
  ├── Sends SMS/FCM to trusted contacts (Guardian Alerts)
  └── Calls ERSS 112 Integration (HTTP POST to simulated API)
      │
      ▼
Police Dashboard (React)
  ├── Receives real-time WebSocket ping
  ├── Live map updates (Google Maps API)
  └── Officer assigned → status updated
```

### 3.3 Data Flow — Cybercrime Evidence Submission

```
User uploads screenshot / chat log
      │
      ▼
Frontend: File picked → metadata collected
      │
      ▼
POST /api/v1/evidence/upload (multipart)
      │
      ├── File hashed (SHA-256) before upload  ← tamper-proof
      ├── Encrypted at rest (AES-256)
      ├── Stored in AWS S3 / local MinIO
      ├── Metadata saved to MongoDB (chain of custody log)
      └── Incident linked in PostgreSQL
      │
      ▼
AI/ML Engine processes:
  ├── Image scan for deepfake probability
  ├── URL extraction + phishing score
  └── Entity extraction (phone numbers, social handles)
      │
      ▼
Police Dashboard → Evidence viewer with audit trail
```

---

## 4. Tech Stack

### 4.1 Frontend (Web — Phase 1)

| Technology | Version | Purpose |
|---|---|---|
| **React.js** | 18.x | Core UI framework |
| **Vite** | 5.x | Build tool (fast dev server) |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **shadcn/ui** | Latest | Accessible component library |
| **React Router v6** | 6.x | Client-side routing |
| **React Query (TanStack)** | 5.x | Server state management |
| **Zustand** | 4.x | Client state management |
| **Socket.io Client** | 4.x | Real-time WebSocket connection |
| **Google Maps JS API** | Latest | Live location map |
| **i18next** | Latest | Multilingual (EN/HI/GU) |
| **React Hook Form + Zod** | Latest | Form handling + validation |
| **Axios** | Latest | HTTP client |
| **Chart.js / Recharts** | Latest | Police analytics dashboard |

### 4.2 Backend (Node.js — Core API)

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 20 LTS | Runtime |
| **Express.js** | 4.x | REST API framework |
| **TypeScript** | 5.x | Type safety |
| **Socket.io** | 4.x | Real-time WebSocket server |
| **Prisma ORM** | 5.x | PostgreSQL ORM |
| **Mongoose** | 8.x | MongoDB ODM (evidence) |
| **Redis (ioredis)** | 5.x | Caching + real-time state |
| **jsonwebtoken** | 9.x | JWT auth |
| **bcrypt** | 5.x | Password hashing |
| **Multer** | 1.x | File upload middleware |
| **Sharp** | 0.33.x | Image processing |
| **AWS SDK v3** | Latest | S3 file storage |
| **Nodemailer** | 6.x | Email notifications |
| **Twilio SDK** | Latest | SMS alerts |
| **Winston** | 3.x | Logging |
| **Helmet.js** | 7.x | HTTP security headers |
| **express-rate-limit** | 7.x | Rate limiting |

### 4.3 AI/ML Service (Python — FastAPI)

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.11 | Runtime |
| **FastAPI** | 0.110 | Async REST API |
| **TensorFlow / PyTorch** | Latest | Deep learning models |
| **Transformers (HuggingFace)** | Latest | NLP / text analysis |
| **OpenCV** | 4.x | Image/video processing |
| **Scikit-learn** | Latest | ML models |
| **Claude API (Anthropic)** | Latest | AI report drafting, threat analysis |
| **spaCy** | 3.x | NLP entity extraction |
| **Pillow** | Latest | Image handling |
| **celery + Redis** | Latest | Async task queue for AI jobs |

### 4.4 Databases

| Database | Use Case |
|---|---|
| **PostgreSQL 16** | Users, cases, FIRs, incidents, guardians |
| **MongoDB 7** | Evidence documents, complaint logs, audit trail |
| **Redis 7** | Real-time location streams, WebSocket state, sessions |
| **MinIO (or AWS S3)** | Encrypted file storage (images, videos, chat exports) |

### 4.5 Infrastructure / DevOps

| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Containerization for all services |
| **Nginx** | Reverse proxy + API gateway |
| **GitHub Actions** | CI/CD pipeline |
| **Certbot / Let's Encrypt** | HTTPS/TLS |
| **PM2** | Node.js process manager (production) |

---

## 5. Module Breakdown

### 5.1 User App Modules

#### 5.1.1 Authentication & Onboarding
- Phone OTP verification (Twilio / MSG91)
- Profile setup: Name, Aadhaar-linked ID (optional), emergency contacts
- Guardian contact addition (up to 5)
- Privacy consent + data policy
- Language selection (EN / HI / GU)

#### 5.1.2 Emergency SOS Module
- **One-touch SOS button** (prominent, red, center of app)
- **Silent SOS**: Volume button triple-press (mobile) / keyboard shortcut (web)
- **Panic Mode**: Fake app UI overlay while SOS runs in background
- Location auto-attached (GPS / IP-based fallback)
- Simultaneous actions on trigger:
  - WebSocket alert → Police Dashboard
  - SMS to guardians (Twilio)
  - Push notification to guardians (FCM)
  - API call to ERSS 112 (simulated)
  - Incident record created in DB
- **Live location sharing** (60-second intervals until resolved/cancelled)
- Siren + flashlight activation (mobile, Phase 2)

#### 5.1.3 Cybercrime Reporting Module
Supports the following incident categories:
- Online Stalking / Cyberstalking
- Sexual Harassment / Obscene Messages
- Blackmail / Sextortion
- Identity Theft / Impersonation
- Deepfake Misuse
- Financial Fraud / UPI Scam
- Phishing / Malware Link
- Social Media Account Hacking
- Other

**Report Wizard (5-step flow):**
1. Incident Category Selection
2. Description (with AI-assisted drafting)
3. Evidence Upload (screenshots, URLs, chat exports)
4. Suspect Details (username, phone, social links)
5. Review & Submit → FIR Draft generated

#### 5.1.4 Evidence Collection Module
- Accepts: JPG/PNG, PDF, MP4/MOV, TXT, ZIP, CSV
- Max file size: 50MB per file, 200MB per incident
- **Hashing before upload**: SHA-256 fingerprint generated client-side
- **Encrypted upload**: Files encrypted with AES-256 before storage
- **Metadata capture**: Device info, timestamp, GPS (EXIF preserved)
- Chain of custody log: every access, download, view is logged
- Tamper-proof: Hash verified on every access; any modification flags the evidence

#### 5.1.5 Complaint Tracker
- View all submitted complaints
- Real-time status updates: `Submitted → Assigned → Under Investigation → Resolved`
- Officer details (badge number, name) once assigned
- In-app messaging channel with assigned officer
- Option to add more evidence post-submission

#### 5.1.6 Cyber Safety Hub
- **Link Scanner**: Paste any URL → AI checks for phishing score, domain age, SSL
- **Profile Scanner**: Paste social media URL → check for fake profile indicators
- **Awareness Modules**: Short lessons on cyber safety (10-15 min)
- **Safety Alerts Feed**: Push alerts for active scams in Ahmedabad area
- **Helpline Directory**: 112, 1930 (Cyber Helpline), NCW, etc.

### 5.2 Police / Cyber Cell Dashboard Modules

#### 5.2.1 Live Incident Map
- Real-time Google Maps view of active SOS incidents
- Color-coded markers: Red (SOS active), Orange (under response), Green (resolved)
- Click marker → incident card popup (user details, location, type)
- Filtering: by type, by time range, by severity
- Heatmap toggle: density of incidents by area

#### 5.2.2 Case Management
- Incoming complaint queue (sorted by priority / time)
- Case assignment to officers
- FIR generation (auto-drafted by AI, editable)
- Evidence viewer (with chain of custody log)
- Status update flow with audit trail
- Court-ready evidence export (PDF with hash verification)

#### 5.2.3 Analytics Dashboard
- Total incidents: daily / weekly / monthly
- Incident breakdown by category
- Response time metrics
- Geographic hotspot analysis
- Repeat offender detection (cross-case phone/profile matching)
- Officer performance metrics

#### 5.2.4 Repeat Offender Tracker
- Suspects linked across multiple complaints
- Fuzzy matching on phone numbers, social handles, email IDs
- Risk score assigned to each suspect profile
- Flagged for priority investigation

---

## 6. Database Schema

### PostgreSQL — Core Tables

```sql
-- Users (women registering on platform)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(15) UNIQUE NOT NULL,
  full_name     VARCHAR(100),
  aadhaar_hash  VARCHAR(64),           -- SHA-256 of Aadhaar (never plain)
  language      VARCHAR(5) DEFAULT 'en',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Guardian / trusted contacts
CREATE TABLE guardians (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(15) NOT NULL,
  relation    VARCHAR(50),
  priority    INT DEFAULT 1,           -- alert order
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- SOS Incidents
CREATE TABLE sos_incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  latitude        DECIMAL(10, 8) NOT NULL,
  longitude       DECIMAL(11, 8) NOT NULL,
  address         TEXT,
  trigger_type    VARCHAR(20) CHECK (trigger_type IN ('button', 'silent', 'voice', 'sms')),
  status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'acknowledged', 'responding', 'resolved', 'false_alarm')),
  assigned_to     UUID REFERENCES officers(id),
  erss_ref_id     VARCHAR(50),         -- ERSS 112 ticket reference
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- Location stream (real-time tracking)
CREATE TABLE location_stream (
  id          BIGSERIAL PRIMARY KEY,
  incident_id UUID REFERENCES sos_incidents(id),
  latitude    DECIMAL(10, 8) NOT NULL,
  longitude   DECIMAL(11, 8) NOT NULL,
  accuracy    FLOAT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cybercrime Complaints
CREATE TABLE complaints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  category        VARCHAR(50) NOT NULL,
  sub_category    VARCHAR(100),
  description     TEXT NOT NULL,
  suspect_info    JSONB,               -- { name, phone, social_handles, email }
  status          VARCHAR(30) DEFAULT 'submitted'
                    CHECK (status IN ('submitted', 'assigned', 'investigating',
                                      'pending_evidence', 'escalated', 'resolved', 'closed')),
  priority        INT DEFAULT 2        -- 1=urgent, 2=normal, 3=low
                    CHECK (priority BETWEEN 1 AND 3),
  assigned_to     UUID REFERENCES officers(id),
  fir_number      VARCHAR(50),
  ai_risk_score   FLOAT,              -- 0.0 to 1.0
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Officers (Police / Cyber Cell)
CREATE TABLE officers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_number  VARCHAR(20) UNIQUE NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  rank          VARCHAR(50),
  department    VARCHAR(100),          -- 'Cyber Cell', 'PCR', 'Women Cell'
  phone         VARCHAR(15),
  email         VARCHAR(100),
  is_on_duty    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- FIR Drafts
CREATE TABLE fir_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID REFERENCES complaints(id),
  draft_text    TEXT NOT NULL,
  generated_by  VARCHAR(10) DEFAULT 'ai' CHECK (generated_by IN ('ai', 'manual')),
  reviewed_by   UUID REFERENCES officers(id),
  is_finalized  BOOLEAN DEFAULT FALSE,
  ipc_sections  TEXT[],               -- suggested IPC / IT Act sections
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  entity_type VARCHAR(50),            -- 'evidence', 'complaint', 'fir'
  entity_id   UUID,
  action      VARCHAR(50),            -- 'viewed', 'downloaded', 'modified', 'assigned'
  actor_id    UUID,
  actor_type  VARCHAR(20),            -- 'user', 'officer', 'system'
  ip_address  INET,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### MongoDB — Evidence Collections

```javascript
// evidence_files collection
{
  _id: ObjectId,
  complaint_id: "uuid-string",
  user_id: "uuid-string",
  file_name: "screenshot_1.png",
  file_type: "image/png",
  file_size: 204800,                  // bytes
  sha256_hash: "abc123...",           // tamper detection
  s3_key: "evidence/2024/01/...",     // encrypted S3 path
  encryption_key_ref: "kms-key-id",  // KMS reference
  metadata: {
    captured_at: ISODate,             // original creation time
    device_info: "iPhone 14 / iOS 17",
    gps: { lat: 23.03, lng: 72.58 },
    exif_preserved: true
  },
  ai_analysis: {
    deepfake_score: 0.12,             // 0=real, 1=fake
    phishing_urls: ["http://bad.com"],
    entities_found: ["9876543210", "@suspect_handle"],
    nsfw_score: 0.05,
    processed_at: ISODate
  },
  custody_chain: [
    {
      action: "uploaded",
      actor: "user-uuid",
      timestamp: ISODate,
      ip: "103.x.x.x"
    }
  ],
  created_at: ISODate
}

// complaint_messages collection (officer ↔ user communication)
{
  _id: ObjectId,
  complaint_id: "uuid-string",
  sender_id: "uuid-string",
  sender_type: "user | officer",
  message: "encrypted message text",
  attachments: [],
  read_by: [],
  created_at: ISODate
}
```

---

## 7. API Design

### Base URL: `https://api.shieldher.in/api/v1`

### Authentication
```
POST /auth/send-otp       { phone }
POST /auth/verify-otp     { phone, otp } → { accessToken, refreshToken }
POST /auth/refresh        { refreshToken } → { accessToken }
POST /auth/logout
```

### SOS Endpoints
```
POST /sos/trigger         { latitude, longitude, trigger_type }
PUT  /sos/:id/location    { latitude, longitude }   ← streaming updates
PUT  /sos/:id/resolve     { resolution_notes }
GET  /sos/history         ← user's past SOS incidents
GET  /sos/active          ← police dashboard, all active SOS
```

### Complaint Endpoints
```
POST /complaints               { category, description, suspect_info }
GET  /complaints               ← user's own complaints
GET  /complaints/:id
POST /complaints/:id/evidence  ← multipart form upload
GET  /complaints/:id/evidence
PUT  /complaints/:id/status    ← officer only
GET  /complaints/:id/fir       ← get AI FIR draft
POST /complaints/:id/messages  ← send message in complaint thread
GET  /complaints/:id/messages
```

### AI/Scan Endpoints
```
POST /ai/scan-url         { url } → { phishing_score, risk_level, details }
POST /ai/scan-profile     { social_url } → { fake_score, indicators }
POST /ai/draft-fir        { complaint_id } → { draft_text, ipc_sections }
POST /ai/analyze-evidence { evidence_id } → { deepfake_score, entities }
```

### Police Dashboard Endpoints
```
GET  /dashboard/incidents        ← all active incidents (paginated)
GET  /dashboard/complaints       ← complaint queue with filters
GET  /dashboard/heatmap          ← GeoJSON for map rendering
GET  /dashboard/analytics        ← stats and charts data
GET  /dashboard/suspects/:id     ← suspect profile + linked complaints
PUT  /dashboard/complaints/:id/assign   { officer_id }
```

### Guardian Endpoints
```
GET  /guardians
POST /guardians           { name, phone, relation, priority }
PUT  /guardians/:id
DELETE /guardians/:id
```

### WebSocket Events (Socket.io)
```
// Server → Police Dashboard
sos:new           { incident_id, user_name, lat, lng, timestamp }
sos:location_update  { incident_id, lat, lng }
sos:resolved      { incident_id }
complaint:new     { complaint_id, category, priority }

// Server → User App
sos:acknowledged  { incident_id, officer_name, eta }
complaint:status_update  { complaint_id, status, message }
alert:cyber_threat  { threat_type, description, action }
```

---

## 8. AI/ML Features

### 8.1 Phishing & Malicious URL Detection
- **Model**: Fine-tuned BERT + rule-based heuristics
- **Input**: URL string
- **Output**: Risk score (0–1), category (phishing/malware/safe), reasons
- **Data Sources**: PhishTank, OpenPhish, VirusTotal API
- **Latency target**: < 2 seconds

### 8.2 Fake Profile Detection
- **Model**: Multi-modal classifier (profile pic + username + bio)
- **Input**: Social media profile URL (scraped metadata)
- **Signals**: Account age, follower/following ratio, post frequency, profile photo reverse-image search
- **Output**: Fake probability score, red flags list
- **Latency target**: < 5 seconds

### 8.3 Deepfake Image/Video Detection
- **Model**: EfficientNet-based binary classifier + FaceForensics++ trained model
- **Input**: Uploaded image or video frame
- **Output**: Deepfake confidence score, highlighted regions (heatmap overlay)
- **Latency target**: < 10 seconds (async, Celery task)

### 8.4 Automated FIR/Complaint Drafting
- **Engine**: Claude API (Anthropic) — structured prompt with complaint details
- **Input**: Complaint description, category, suspect info, evidence summaries
- **Output**: Formal FIR draft (in English/Hindi), suggested IPC sections, IT Act sections
- **Example IPC Sections Mapped**:
  - Cyberstalking → IPC 354D + IT Act 66C/66E
  - Deepfake → IT Act 67A + IPC 509
  - Blackmail → IPC 384/383 + IT Act 66E
  - Financial Fraud → IPC 420 + IT Act 66C/66D

### 8.5 Unsafe Zone Prediction (Bonus)
- **Model**: Spatiotemporal clustering (DBSCAN / K-Means) on historical incident data
- **Input**: Lat/lng bounding box + time of day
- **Output**: GeoJSON risk zones, color-coded (red/amber/green)
- **Update frequency**: Nightly batch job

### 8.6 Text Entity Extraction
- **Model**: spaCy + custom NER
- **Input**: Complaint description or evidence text
- **Extracts**: Phone numbers, email addresses, URLs, social media handles, location mentions
- **Purpose**: Auto-populate suspect profile fields, link to known offenders

---

## 9. Security Architecture

### 9.1 Authentication & Authorization
- JWT (access token: 15 min) + Refresh token (7 days, stored in httpOnly cookie)
- Role-Based Access Control (RBAC): `user`, `officer`, `supervisor`, `admin`
- OTP via Twilio / MSG91 (rate-limited: 3 attempts per 10 min)
- Officer login: Badge number + password + TOTP (2FA)

### 9.2 Data Encryption
- **In transit**: TLS 1.3 (enforced via Nginx)
- **At rest**: AES-256-GCM for all evidence files (keys in AWS KMS or Vault)
- **Database**: PostgreSQL Transparent Data Encryption (TDE)
- **PII fields**: Phone, name, Aadhaar hash stored encrypted at column level

### 9.3 Evidence Integrity
- SHA-256 hash computed client-side before upload
- Hash stored in MongoDB alongside file
- Every file access triggers hash re-verification
- Blockchain-style audit trail: each custody record references the previous one

### 9.4 API Security
- Helmet.js for HTTP security headers
- CORS: Whitelist only known origins
- Rate limiting: 100 requests/15min per IP (general), 5/min on SOS trigger
- Input sanitization: express-validator + DOMPurify (frontend)
- SQL injection prevention: Prisma parameterized queries
- File upload: MIME type validation, magic byte check, virus scan (ClamAV)

### 9.5 Privacy
- Minimal data collection principle
- User can delete their account + all data (GDPR-inspired)
- Audit log retained for legal purposes even after deletion
- Anonymous reporting option (no account required for basic cyber complaint)
- No 3rd-party ad/analytics SDKs in the platform

---

## 10. Integration Points

### 10.1 ERSS (Emergency Response Support System — 112)
```
Integration Type: REST API (simulated in hackathon)
Endpoint:  POST https://erss.gujarat.gov.in/api/sos   [simulated]
Payload:   { incident_id, lat, lng, user_phone, type: "women_safety" }
Response:  { erss_ticket_id, estimated_response_time }
Fallback:  Direct SMS to 112 via Twilio if API fails
```

### 10.2 Cybercrime Portal (cybercrime.gov.in)
```
Integration Type: Form-based / API submission (simulated)
Action: Auto-submit complaint data + evidence links
Reference: https://cybercrime.gov.in/
Simulation: Internal endpoint that mirrors their schema
```

### 10.3 CCTNS (Crime and Criminal Tracking Network System)
```
Integration Type: Simulated REST API
Purpose: Cross-reference suspects against known criminal database
Endpoint: POST /cctns/lookup  { phone, name, aadhaar_hash }
Response: { found: bool, risk_level, prior_cases }
Note: Real integration requires MHA authorization; hackathon uses mock
```

### 10.4 Twilio (SMS + Voice)
```
Purpose: OTP delivery, Guardian SMS alerts, Offline SOS fallback
Services used: SMS API, Programmable Voice (for voice SOS)
Webhook: /webhooks/twilio/sms-status
```

### 10.5 Google Maps Platform
```
Services: Maps JavaScript API, Geocoding API, Places API
Purpose: Live incident map, address resolution, nearby police stations
```

---

## 11. Frontend Structure

```
shieldher-web/
├── public/
│   └── locales/          ← i18n JSON files (en, hi, gu)
├── src/
│   ├── components/
│   │   ├── ui/           ← shadcn/ui base components
│   │   ├── sos/          ← SOSButton, PanicMode, SilentSOS
│   │   ├── map/          ← LiveMap, IncidentMarker, Heatmap
│   │   ├── complaint/    ← ReportWizard, EvidenceUploader
│   │   ├── dashboard/    ← PoliceLayout, CaseQueue, Analytics
│   │   └── shared/       ← Navbar, Footer, Loader, Toast
│   ├── pages/
│   │   ├── user/
│   │   │   ├── Home.tsx
│   │   │   ├── SOS.tsx
│   │   │   ├── ReportCrime.tsx
│   │   │   ├── MyComplaints.tsx
│   │   │   ├── SafetyHub.tsx
│   │   │   └── Profile.tsx
│   │   ├── police/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LiveMap.tsx
│   │   │   ├── CaseList.tsx
│   │   │   ├── CaseDetail.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Suspects.tsx
│   │   └── auth/
│   │       ├── Login.tsx
│   │       └── OtpVerify.tsx
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useGeolocation.ts
│   │   ├── useSOS.ts
│   │   └── useAuth.ts
│   ├── store/
│   │   ├── authStore.ts    ← Zustand
│   │   ├── sosStore.ts
│   │   └── incidentStore.ts
│   ├── services/
│   │   ├── api.ts          ← Axios instance + interceptors
│   │   ├── socket.ts       ← Socket.io client singleton
│   │   └── evidence.ts     ← File hash + upload logic
│   ├── utils/
│   │   ├── fileHash.ts     ← SHA-256 client-side
│   │   ├── geoUtils.ts
│   │   └── formatters.ts
│   └── types/
│       └── index.ts        ← Shared TypeScript types
├── .env.example
├── vite.config.ts
└── tailwind.config.ts
```

---

## 12. Backend Structure

```
shieldher-api/
├── src/
│   ├── modules/
│   │   ├── auth/           ← OTP, JWT, refresh token
│   │   ├── sos/            ← SOS trigger, location stream
│   │   ├── complaints/     ← Report, status, evidence
│   │   ├── evidence/       ← Upload, hash verify, S3
│   │   ├── guardians/      ← Trusted contacts CRUD
│   │   ├── notifications/  ← SMS, FCM, Email
│   │   ├── dashboard/      ← Police APIs, analytics
│   │   └── ai/             ← Proxy to Python AI service
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── rateLimiter.ts
│   │   └── errorHandler.ts
│   ├── lib/
│   │   ├── prisma.ts       ← PostgreSQL client
│   │   ├── mongoose.ts     ← MongoDB client
│   │   ├── redis.ts        ← Redis client
│   │   ├── s3.ts           ← AWS S3 client
│   │   └── socket.ts       ← Socket.io server setup
│   ├── jobs/
│   │   ├── locationCleanup.job.ts
│   │   └── riskScoreUpdate.job.ts
│   └── app.ts
├── prisma/
│   └── schema.prisma
├── .env.example
├── Dockerfile
└── docker-compose.yml

shieldher-ai/                 ← Python FastAPI AI service
├── app/
│   ├── routers/
│   │   ├── url_scan.py
│   │   ├── profile_scan.py
│   │   ├── fir_draft.py
│   │   └── evidence_analysis.py
│   ├── models/
│   │   ├── deepfake_model.py
│   │   ├── phishing_model.py
│   │   └── ner_model.py
│   ├── tasks/              ← Celery async tasks
│   └── main.py
├── requirements.txt
└── Dockerfile
```

---

## 13. Development Roadmap

### Phase 1 — Website MVP (Hackathon Demo)
**Timeline: 24–36 hours**

- [ ] Project setup: Vite + React + Tailwind + shadcn
- [ ] Auth flow: Phone OTP + JWT
- [ ] SOS trigger + mock ERSS ping
- [ ] Live location display on Google Maps
- [ ] Cybercrime report form (5-step wizard)
- [ ] Evidence file upload with SHA-256 hash
- [ ] Police dashboard: incident list + live map
- [ ] AI FIR draft (Claude API integration)
- [ ] Basic phishing URL scanner
- [ ] Guardian alert (mock SMS trigger)
- [ ] Multilingual toggle (EN / HI / GU)

### Phase 2 — Website Full Features
**Timeline: 2–4 weeks post-hackathon**

- [ ] Full real-time WebSocket integration
- [ ] Complete evidence chain-of-custody module
- [ ] Deepfake detection integration
- [ ] Fake profile scanner
- [ ] Officer assignment workflow
- [ ] In-app messaging (officer ↔ user)
- [ ] Analytics dashboard with charts
- [ ] Repeat offender tracker
- [ ] Unsafe zone heatmap
- [ ] Voice-activated SOS (Web Speech API)

### Phase 3 — Mobile App (Flutter)
**Timeline: 4–6 weeks post-Phase 2**

- [ ] Flutter setup + shared API layer
- [ ] Mobile SOS with hardware button (volume triple-press)
- [ ] Background location sharing
- [ ] Push notifications (FCM)
- [ ] Offline SMS fallback
- [ ] Siren + flashlight on SOS
- [ ] Biometric login (fingerprint / face)
- [ ] App icon panic mode

---

## 14. Deployment Guide

### Prerequisites
- Docker + Docker Compose installed
- Node.js 20 LTS
- Python 3.11

### Quick Start (Development)
```bash
# Clone repository
git clone https://github.com/your-team/shieldher.git
cd shieldher

# Copy environment files
cp shieldher-api/.env.example shieldher-api/.env
cp shieldher-web/.env.example shieldher-web/.env
cp shieldher-ai/.env.example shieldher-ai/.env

# Start all services with Docker Compose
docker-compose up -d

# Run database migrations
cd shieldher-api
npx prisma migrate dev

# Start frontend dev server
cd shieldher-web
npm install && npm run dev
```

### Environment Variables
```env
# shieldher-api/.env
DATABASE_URL=postgresql://user:password@localhost:5432/shieldher
MONGODB_URI=mongodb://localhost:27017/shieldher_evidence
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=shieldher-evidence
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
AI_SERVICE_URL=http://localhost:8001
ERSS_API_URL=https://erss-sim.shieldher.in   # simulated

# shieldher-ai/.env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
REDIS_URL=redis://localhost:6379
```

### Docker Compose Services
```yaml
services:
  postgres:    port 5432
  mongodb:     port 27017
  redis:       port 6379
  api:         port 3000  (Node.js Express)
  ai-service:  port 8001  (Python FastAPI)
  web:         port 5173  (Vite dev) / 80 (prod via Nginx)
  minio:       port 9000  (S3-compatible local storage)
```

---

## 15. Bonus Features

### Voice-Activated SOS
- **Web**: Web Speech API — detect keyword "Help Me" / "Bachao" / "Madad"
- **Mobile (Phase 2)**: Background Whisper model (on-device) for privacy
- Triggered without touching the phone/screen

### Offline / SMS SOS
- Pre-registered keywords: User texts "SOS" to a dedicated number
- Twilio webhook parses SMS → triggers incident creation + guardian alerts
- Works without internet on 2G/3G networks

### Multilingual Support (i18next)
- Languages: English, Hindi, Gujarati
- Dynamic language switching (no page reload)
- RTL support ready for Urdu (future)
- AI drafts FIR in selected language

### AI Unsafe Zone Prediction
- Nightly cron job runs DBSCAN clustering on past 90 days of incidents
- Outputs risk polygons (GeoJSON) per time band (Morning/Afternoon/Evening/Night)
- Displayed as color overlay on the police dashboard and user's safety map
- Push alert: "You are near a high-risk zone — stay alert"

---

## Appendix A — Legal & Compliance References

| Law | Relevance |
|---|---|
| IT Act 2000 + Amendment 2008 | Cybercrime definitions, evidence admissibility |
| IPC Sections 354/354A/354D/509 | Harassment, stalking, obscene acts |
| POCSO Act | If victim is a minor |
| Indian Evidence Act (Sec 65B) | Digital evidence certification requirements |
| PDPB (Personal Data Protection Bill) | Data privacy compliance |

## Appendix B — Simulated Integration Notes

For the hackathon demo, the following are **simulated** via internal mock services:
- ERSS 112 API
- CCTNS database lookup
- Cybercrime portal submission

These are designed to mirror the real API schemas so that replacing with production endpoints requires **only a URL/credential change**, with no code refactoring.

---

*Built with ❤️ for women's safety | KanadShield Hackathon 2024*
*Cyber Crime Branch, Ahmedabad City | PS-69EEFD950B72D*
