# ⚙️ ShieldHer — Backend Documentation
### Complete Technical Reference | Node.js + Supabase + Python AI Service

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Supabase — Core Database Layer](#2-supabase--core-database-layer)
3. [Database Schema — Full SQL](#3-database-schema--full-sql)
4. [Row Level Security (RLS) Policies](#4-row-level-security-rls-policies)
5. [Supabase Auth Configuration](#5-supabase-auth-configuration)
6. [Supabase Storage Buckets](#6-supabase-storage-buckets)
7. [Supabase Realtime Configuration](#7-supabase-realtime-configuration)
8. [Supabase Edge Functions](#8-supabase-edge-functions)
9. [Node.js API — Setup & Structure](#9-nodejs-api--setup--structure)
10. [All Dependencies — Every Package Explained](#10-all-dependencies--every-package-explained)
11. [Environment Variables](#11-environment-variables)
12. [Module: Authentication](#12-module-authentication)
13. [Module: SOS & Emergency Response](#13-module-sos--emergency-response)
14. [Module: Complaints & Reporting](#14-module-complaints--reporting)
15. [Module: Evidence Management](#15-module-evidence-management)
16. [Module: Notifications](#16-module-notifications)
17. [Module: Police Dashboard API](#17-module-police-dashboard-api)
18. [Module: Guardian Management](#18-module-guardian-management)
19. [Python AI Service (FastAPI)](#19-python-ai-service-fastapi)
20. [Integration: ERSS 112](#20-integration-erss-112)
21. [Integration: Twilio SMS & Voice](#21-integration-twilio-sms--voice)
22. [Integration: Claude API (FIR Drafting)](#22-integration-claude-api-fir-drafting)
23. [Security Architecture](#23-security-architecture)
24. [Database Indexes & Performance](#24-database-indexes--performance)
25. [Deployment Guide](#25-deployment-guide)

---

## 1. Architecture Overview

```
                ┌─────────────────────────────────────────────┐
                │              SUPABASE PLATFORM               │
                │                                             │
                │  ┌──────────────┐  ┌────────────────────┐  │
                │  │  PostgreSQL  │  │  Supabase Auth     │  │
                │  │  Database    │  │  (Phone OTP +      │  │
                │  │  + RLS       │  │   Email/Password)  │  │
                │  └──────────────┘  └────────────────────┘  │
                │                                             │
                │  ┌──────────────┐  ┌────────────────────┐  │
                │  │  Supabase    │  │  Supabase          │  │
                │  │  Storage     │  │  Realtime          │  │
                │  │  (Evidence   │  │  (Live SOS alerts  │  │
                │  │   Files)     │  │   WebSocket)       │  │
                │  └──────────────┘  └────────────────────┘  │
                │                                             │
                │  ┌──────────────────────────────────────┐  │
                │  │  Supabase Edge Functions (Deno)      │  │
                │  │  - Guardian notifications            │  │
                │  │  - Webhook handlers                  │  │
                │  └──────────────────────────────────────┘  │
                └──────────────────┬──────────────────────────┘
                                   │ Supabase JS Client
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐  ┌────▼────┐  ┌─────▼──────┐
              │  Frontend │  │ Node.js │  │  Python    │
              │  React.js │  │  API    │  │  FastAPI   │
              │ (Supabase │  │ (Heavy  │  │  (AI/ML)   │
              │  direct   │  │  biz    │  │            │
              │  queries) │  │  logic) │  │            │
              └───────────┘  └────┬────┘  └─────┬──────┘
                                  │             │
                        ┌─────────┴────┐  ┌────▼────────┐
                        │   Twilio     │  │  Claude API │
                        │   SMS/Voice  │  │  (Anthropic)│
                        └─────────────┘  └─────────────┘
```

### Why This Stack?

| Concern | Solution | Reasoning |
|---|---|---|
| Database | Supabase (PostgreSQL) | Managed, scales to millions, built-in auth + storage + realtime |
| Auth | Supabase Auth | Phone OTP built-in, no custom JWT infra needed |
| File Storage | Supabase Storage | Integrated with DB, RLS policies apply to files too |
| Real-time | Supabase Realtime | WebSocket on DB changes, zero extra infrastructure |
| Business Logic | Node.js Express | Complex orchestration (ERSS + Twilio + AI) needs a real server |
| AI/ML | Python FastAPI | TensorFlow, PyTorch, HuggingFace all native in Python |
| AI Text Tasks | Claude API | FIR drafting, complaint analysis, entity extraction |
| SMS | Twilio | Reliable delivery in India, fallback SMS support |

---

## 2. Supabase — Core Database Layer

### 2.1 What Supabase Gives Us (Replacing Traditional Infrastructure)

| Traditional Stack | Replaced By |
|---|---|
| PostgreSQL server | Supabase managed Postgres |
| Redis for sessions | Supabase Auth (JWT sessions) |
| MongoDB for evidence metadata | Supabase JSONB columns in Postgres |
| S3 / MinIO for files | Supabase Storage |
| Socket.io / WebSocket server | Supabase Realtime |
| AWS Cognito / Custom auth | Supabase Auth (Phone OTP) |
| Custom REST CRUD API | Supabase PostgREST (auto-generated) |

### 2.2 Supabase Project Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local dev environment
supabase init
supabase start        # starts local Postgres, Studio, etc. via Docker

# Link to remote project
supabase link --project-ref YOUR_PROJECT_REF

# Generate TypeScript types from your schema
supabase gen types typescript --local > src/types/supabase.ts

# Run migrations
supabase db push      # push local migrations to remote
supabase db pull      # pull remote schema changes locally
```

### 2.3 Supabase Dashboard Configuration

**Project Settings → Auth:**
- Enable Phone provider (with Twilio: Account SID, Auth Token, Message Service SID)
- OTP expiry: 10 minutes
- Enable Email provider for officer login
- Disable email confirmation for faster testing

**Project Settings → Storage:**
- Create `evidence` bucket (private)
- Create `avatars` bucket (public)

**Project Settings → API:**
- Note down: Project URL, Anon Key, Service Role Key

---

## 3. Database Schema — Full SQL

All migrations go in: `supabase/migrations/`

### Migration: `20240101000001_initial_schema.sql`

```sql
-- ================================================
-- Enable required extensions
-- ================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- for fuzzy text search on suspects
CREATE EXTENSION IF NOT EXISTS "postgis";       -- for geographic queries (unsafe zones)
CREATE EXTENSION IF NOT EXISTS "pg_cron";       -- for scheduled jobs

-- ================================================
-- ENUM types
-- ================================================
CREATE TYPE user_role AS ENUM ('user', 'officer', 'supervisor', 'admin');
CREATE TYPE sos_status AS ENUM ('active', 'acknowledged', 'responding', 'resolved', 'false_alarm');
CREATE TYPE sos_trigger_type AS ENUM ('button', 'silent', 'voice', 'sms', 'shake');

CREATE TYPE complaint_status AS ENUM (
  'submitted', 'assigned', 'investigating',
  'pending_evidence', 'escalated', 'resolved', 'closed', 'rejected'
);
CREATE TYPE complaint_category AS ENUM (
  'cyberstalking', 'harassment', 'blackmail', 'identity_theft',
  'deepfake', 'financial_fraud', 'phishing', 'account_hacking', 'other'
);
CREATE TYPE complaint_priority AS ENUM ('urgent', 'normal', 'low');

CREATE TYPE evidence_type AS ENUM (
  'image', 'video', 'audio', 'document', 'chat_export', 'url', 'other'
);

CREATE TYPE notification_type AS ENUM (
  'sos_guardian', 'sos_police', 'complaint_update',
  'evidence_requested', 'cyber_alert', 'fir_ready'
);

-- ================================================
-- USERS — women registered on the platform
-- ================================================
CREATE TABLE public.users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id        UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone               VARCHAR(15) UNIQUE,
  full_name           VARCHAR(100),
  preferred_language  VARCHAR(5) DEFAULT 'en'
                        CHECK (preferred_language IN ('en', 'hi', 'gu')),
  is_profile_complete BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT TRUE,
  profile_photo_url   TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- OFFICERS — police and cyber cell personnel
-- ================================================
CREATE TABLE public.officers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  badge_number    VARCHAR(20) UNIQUE NOT NULL,
  full_name       VARCHAR(100) NOT NULL,
  rank            VARCHAR(50),
  department      VARCHAR(100),           -- 'Cyber Cell', 'PCR', 'Women Cell'
  phone           VARCHAR(15),
  email           VARCHAR(100) UNIQUE,
  role            user_role DEFAULT 'officer',
  is_on_duty      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- GUARDIANS — trusted emergency contacts
-- ================================================
CREATE TABLE public.guardians (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(15) NOT NULL,
  relation    VARCHAR(50),                -- 'Mother', 'Sister', 'Friend', etc.
  priority    SMALLINT DEFAULT 1          -- 1 = notify first
                CHECK (priority BETWEEN 1 AND 5),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

-- ================================================
-- SOS INCIDENTS
-- ================================================
CREATE TABLE public.sos_incidents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id),
  latitude          DECIMAL(10, 8) NOT NULL,
  longitude         DECIMAL(11, 8) NOT NULL,
  address           TEXT,                 -- reverse geocoded
  trigger_type      sos_trigger_type NOT NULL DEFAULT 'button',
  status            sos_status NOT NULL DEFAULT 'active',
  assigned_to       UUID REFERENCES public.officers(id),
  erss_ref_id       VARCHAR(50),          -- ERSS 112 ticket reference
  erss_notified_at  TIMESTAMPTZ,
  guardians_notified_count INT DEFAULT 0,
  notes             TEXT,                 -- officer notes
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at   TIMESTAMPTZ,
  resolved_at       TIMESTAMPTZ
);

-- ================================================
-- LOCATION STREAM — live GPS during SOS
-- ================================================
CREATE TABLE public.location_stream (
  id            BIGSERIAL PRIMARY KEY,
  incident_id   UUID NOT NULL REFERENCES public.sos_incidents(id) ON DELETE CASCADE,
  latitude      DECIMAL(10, 8) NOT NULL,
  longitude     DECIMAL(11, 8) NOT NULL,
  accuracy      FLOAT,                    -- GPS accuracy in meters
  altitude      FLOAT,
  speed         FLOAT,
  heading       FLOAT,
  captured_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- COMPLAINTS — cybercrime reports
-- ================================================
CREATE TABLE public.complaints (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id),
  category            complaint_category NOT NULL,
  sub_category        VARCHAR(100),
  description         TEXT NOT NULL,
  incident_date       DATE,
  suspect_info        JSONB DEFAULT '{}',
  -- suspect_info shape:
  -- { name?, phone?, email?, social_handles: [], urls: [], platform? }
  status              complaint_status NOT NULL DEFAULT 'submitted',
  priority            complaint_priority NOT NULL DEFAULT 'normal',
  assigned_to         UUID REFERENCES public.officers(id),
  fir_number          VARCHAR(50),
  ai_risk_score       FLOAT CHECK (ai_risk_score BETWEEN 0 AND 1),
  ai_ipc_sections     TEXT[],             -- suggested IPC sections
  portal_ref_id       VARCHAR(50),        -- cybercrime.gov.in reference
  wants_fir           BOOLEAN DEFAULT FALSE,
  is_anonymous        BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- EVIDENCE FILES — metadata (files stored in Supabase Storage)
-- ================================================
CREATE TABLE public.evidence_files (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id    UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
  sos_incident_id UUID REFERENCES public.sos_incidents(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES public.users(id),
  file_name       VARCHAR(255) NOT NULL,
  file_type       VARCHAR(100) NOT NULL,  -- MIME type
  evidence_type   evidence_type DEFAULT 'other',
  file_size       BIGINT NOT NULL,        -- bytes
  sha256_hash     VARCHAR(64) NOT NULL,   -- tamper detection
  storage_path    TEXT NOT NULL,          -- path in Supabase Storage bucket
  ai_analysis     JSONB DEFAULT '{}',
  -- ai_analysis shape:
  -- { deepfake_score?, phishing_urls?: [], entities?: [], nsfw_score?, processed_at? }
  custody_chain   JSONB DEFAULT '[]',
  -- custody_chain: array of { action, actor_id, actor_type, timestamp, ip }
  is_deleted      BOOLEAN DEFAULT FALSE,  -- soft delete
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- FIR DRAFTS — AI-generated First Information Reports
-- ================================================
CREATE TABLE public.fir_drafts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id        UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  draft_text          TEXT NOT NULL,
  generated_by        VARCHAR(10) DEFAULT 'ai' CHECK (generated_by IN ('ai', 'manual')),
  reviewed_by         UUID REFERENCES public.officers(id),
  is_finalized        BOOLEAN DEFAULT FALSE,
  ipc_sections        TEXT[],
  it_act_sections     TEXT[],
  finalized_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- COMPLAINT MESSAGES — officer ↔ user communication
-- ================================================
CREATE TABLE public.complaint_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id  UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL,            -- user_id or officer auth_user_id
  sender_type   VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'officer')),
  message       TEXT NOT NULL,
  attachments   TEXT[],                   -- storage paths
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- AUDIT LOG — every access to sensitive data
-- ================================================
CREATE TABLE public.audit_log (
  id            BIGSERIAL PRIMARY KEY,
  entity_type   VARCHAR(50) NOT NULL,     -- 'evidence', 'complaint', 'fir', 'sos'
  entity_id     UUID NOT NULL,
  action        VARCHAR(50) NOT NULL,     -- 'viewed', 'downloaded', 'modified', 'assigned'
  actor_id      UUID,
  actor_type    VARCHAR(20) NOT NULL,     -- 'user', 'officer', 'system'
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- SUSPECT PROFILES — cross-case suspect tracking
-- ================================================
CREATE TABLE public.suspect_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_numbers   TEXT[] DEFAULT '{}',
  email_addresses TEXT[] DEFAULT '{}',
  social_handles  TEXT[] DEFAULT '{}',
  known_names     TEXT[] DEFAULT '{}',
  risk_score      FLOAT DEFAULT 0.0,
  complaint_count INT DEFAULT 0,
  is_flagged      BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Link complaints to suspects
CREATE TABLE public.complaint_suspects (
  complaint_id    UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  suspect_id      UUID REFERENCES public.suspect_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (complaint_id, suspect_id)
);

-- ================================================
-- CYBER ALERTS — proactive safety alerts
-- ================================================
CREATE TABLE public.cyber_alerts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  alert_type    VARCHAR(50),              -- 'phishing', 'scam', 'malware', 'general'
  severity      VARCHAR(20) DEFAULT 'medium'
                  CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active     BOOLEAN DEFAULT TRUE,
  expires_at    TIMESTAMPTZ,
  created_by    UUID REFERENCES public.officers(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- UNSAFE ZONES — AI-predicted risk areas (for heatmap)
-- ================================================
CREATE TABLE public.unsafe_zones (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_name     VARCHAR(100),
  center_lat    DECIMAL(10, 8),
  center_lng    DECIMAL(11, 8),
  radius_meters INT,
  risk_level    INT CHECK (risk_level BETWEEN 1 AND 5),
  time_band     VARCHAR(20),              -- 'morning', 'afternoon', 'evening', 'night'
  incident_count INT DEFAULT 0,
  last_updated  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TRIGGER: auto-update updated_at columns
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_fir_updated_at
  BEFORE UPDATE ON public.fir_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TRIGGER: auto-create user profile after auth signup
-- ================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, phone)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================
-- TRIGGER: update suspect_profiles.complaint_count
-- ================================================
CREATE OR REPLACE FUNCTION update_suspect_complaint_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.suspect_profiles
  SET complaint_count = (
    SELECT COUNT(*) FROM public.complaint_suspects
    WHERE suspect_id = NEW.suspect_id
  )
  WHERE id = NEW.suspect_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_suspect_count
  AFTER INSERT OR DELETE ON public.complaint_suspects
  FOR EACH ROW EXECUTE FUNCTION update_suspect_complaint_count();
```

---

## 4. Row Level Security (RLS) Policies

RLS ensures users can only access their own data — enforced at the database level.

### Migration: `20240101000002_rls_policies.sql`

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fir_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspect_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_alerts ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────
-- HELPER: check if the current user is an officer
-- ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_officer()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.officers
    WHERE auth_user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.officers
    WHERE auth_user_id = auth.uid()
    AND role IN ('supervisor', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ────────────────────────────────────────────────────
-- USERS table
-- ────────────────────────────────────────────────────
-- Users can only see and edit their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Officers can see all users (for case management)
CREATE POLICY "officers_select_all_users" ON public.users
  FOR SELECT USING (is_officer());

-- ────────────────────────────────────────────────────
-- GUARDIANS table
-- ────────────────────────────────────────────────────
CREATE POLICY "guardians_all_own" ON public.guardians
  FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────
-- SOS INCIDENTS table
-- ────────────────────────────────────────────────────
-- Users: see/create/update only their own incidents
CREATE POLICY "sos_select_own" ON public.sos_incidents
  FOR SELECT USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "sos_insert_own" ON public.sos_incidents
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Officers: see ALL active incidents
CREATE POLICY "sos_officers_select_all" ON public.sos_incidents
  FOR SELECT USING (is_officer());

-- Officers: update incidents (assign, resolve)
CREATE POLICY "sos_officers_update" ON public.sos_incidents
  FOR UPDATE USING (is_officer());

-- ────────────────────────────────────────────────────
-- LOCATION STREAM table
-- ────────────────────────────────────────────────────
-- Users: insert their own location
CREATE POLICY "location_insert_own" ON public.location_stream
  FOR INSERT WITH CHECK (
    incident_id IN (
      SELECT id FROM public.sos_incidents
      WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

-- Officers: read all location streams
CREATE POLICY "location_officers_read" ON public.location_stream
  FOR SELECT USING (is_officer());

-- ────────────────────────────────────────────────────
-- COMPLAINTS table
-- ────────────────────────────────────────────────────
CREATE POLICY "complaints_select_own" ON public.complaints
  FOR SELECT USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR is_anonymous = TRUE  -- anonymous complaints viewable by submitter only via token
  );

CREATE POLICY "complaints_insert_own" ON public.complaints
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "complaints_update_own" ON public.complaints
  FOR UPDATE USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    AND status = 'submitted'  -- user can only edit unassigned complaints
  );

CREATE POLICY "complaints_officers_all" ON public.complaints
  FOR ALL USING (is_officer());

-- ────────────────────────────────────────────────────
-- EVIDENCE FILES table
-- ────────────────────────────────────────────────────
CREATE POLICY "evidence_select_own" ON public.evidence_files
  FOR SELECT USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "evidence_insert_own" ON public.evidence_files
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Evidence: no user DELETE (tamper-proof) — only system/supervisor can soft-delete
CREATE POLICY "evidence_delete_supervisor" ON public.evidence_files
  FOR UPDATE USING (is_supervisor());  -- only update is_deleted flag

CREATE POLICY "evidence_officers_select" ON public.evidence_files
  FOR SELECT USING (is_officer());

-- ────────────────────────────────────────────────────
-- COMPLAINT MESSAGES table
-- ────────────────────────────────────────────────────
CREATE POLICY "messages_select" ON public.complaint_messages
  FOR SELECT USING (
    -- users can see messages on their complaints
    complaint_id IN (
      SELECT id FROM public.complaints
      WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR is_officer()
  );

CREATE POLICY "messages_insert" ON public.complaint_messages
  FOR INSERT WITH CHECK (
    complaint_id IN (
      SELECT id FROM public.complaints
      WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    OR is_officer()
  );

-- ────────────────────────────────────────────────────
-- FIR DRAFTS table
-- ────────────────────────────────────────────────────
-- Users: read FIR on their own complaints
CREATE POLICY "fir_select_own" ON public.fir_drafts
  FOR SELECT USING (
    complaint_id IN (
      SELECT id FROM public.complaints
      WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
    AND is_finalized = TRUE  -- users only see finalized FIRs
  );

-- Officers: full access to all FIRs
CREATE POLICY "fir_officers_all" ON public.fir_drafts
  FOR ALL USING (is_officer());

-- ────────────────────────────────────────────────────
-- AUDIT LOG table
-- ────────────────────────────────────────────────────
-- No user-facing reads — only officers and system
CREATE POLICY "audit_officers_select" ON public.audit_log
  FOR SELECT USING (is_officer());

CREATE POLICY "audit_insert_any" ON public.audit_log
  FOR INSERT WITH CHECK (TRUE);  -- any authenticated actor can insert

-- ────────────────────────────────────────────────────
-- CYBER ALERTS table
-- ────────────────────────────────────────────────────
-- Everyone can read active alerts
CREATE POLICY "alerts_public_read" ON public.cyber_alerts
  FOR SELECT USING (is_active = TRUE);

-- Only officers can create/update alerts
CREATE POLICY "alerts_officers_manage" ON public.cyber_alerts
  FOR ALL USING (is_officer());
```

---

## 5. Supabase Auth Configuration

### 5.1 Phone Auth Setup (for Women Users)

In Supabase Dashboard → Authentication → Providers → Phone:
- **SMS Provider**: Twilio
- Twilio Account SID: `ACxxxxxxxx`
- Twilio Auth Token: `xxxxxxxx`
- Twilio Message Service SID: `MGxxxxxxxx`
- OTP Length: 6 digits
- OTP Expiry: 600 seconds (10 minutes)

### 5.2 Email Auth Setup (for Police Officers)

In Supabase Dashboard → Authentication → Providers → Email:
- Enable email/password
- Disable email confirmation (officers are onboarded manually by admin)
- Custom SMTP: SendGrid / Mailgun for branded emails

### 5.3 JWT Custom Claims (add user role to token)

```sql
-- supabase/functions/custom_access_token.sql
-- Add custom claims to JWT so frontend knows user role
CREATE OR REPLACE FUNCTION auth.custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
  claims JSONB;
  officer_role TEXT;
BEGIN
  claims := event -> 'claims';

  -- Check if user is an officer
  SELECT role::TEXT INTO officer_role
  FROM public.officers
  WHERE auth_user_id = (event ->> 'user_id')::UUID;

  IF officer_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_role}', to_jsonb(officer_role));
  ELSE
    claims := jsonb_set(claims, '{app_role}', '"user"');
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auth.custom_access_token_hook TO supabase_auth_admin;
```

---

## 6. Supabase Storage Buckets

### Migration: `20240101000003_storage_buckets.sql`

```sql
-- ── evidence bucket (PRIVATE — encrypted, police + owner access only) ──
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types, file_size_limit)
VALUES (
  'evidence',
  'evidence',
  FALSE,                            -- NOT public
  FALSE,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm',
    'audio/mpeg', 'audio/wav',
    'application/pdf',
    'text/plain',
    'application/zip'
  ],
  52428800                          -- 50 MB limit per file
);

-- ── avatars bucket (PUBLIC — profile photos) ──
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', TRUE, 5242880);   -- 5 MB limit

-- ── Storage RLS Policies ──

-- Evidence: user can upload to their own folder
CREATE POLICY "evidence_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'evidence'
    AND (storage.foldername(name))[1] = 'evidence'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

-- Evidence: user can read their own files
CREATE POLICY "evidence_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence'
    AND (storage.foldername(name))[2] = auth.uid()::TEXT
  );

-- Evidence: officers can read all evidence
CREATE POLICY "evidence_read_officers" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence'
    AND is_officer()
  );

-- Evidence: nobody deletes (tamper-proof)
-- (only supervisor can delete via service_role key in backend)

-- Avatars: public read
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Avatars: user can upload/update their own
CREATE POLICY "avatars_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = auth.uid()::TEXT || '.jpg'
  );
```

---

## 7. Supabase Realtime Configuration

### Migration: `20240101000004_realtime.sql`

```sql
-- Enable Realtime on tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_stream;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cyber_alerts;
```

### Realtime Channels Used

| Channel | Table | Events | Who Listens |
|---|---|---|---|
| `sos-incidents` | `sos_incidents` | INSERT, UPDATE | Police Dashboard |
| `location-{incidentId}` | `location_stream` | INSERT | Police tracking map |
| `complaint-{id}` | `complaints` | UPDATE | User (status updates) |
| `messages-{complaintId}` | `complaint_messages` | INSERT | Both user + officer |
| `cyber-alerts` | `cyber_alerts` | INSERT | All users |

---

## 8. Supabase Edge Functions

Edge Functions run on Deno at the edge (low latency). Used for lightweight triggers.

### `supabase/functions/notify-guardians/index.ts`

Called by Node.js API after SOS trigger — sends SMS to guardians:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Twilio } from 'https://esm.sh/twilio@4.0.0'

serve(async (req) => {
  const { incident_id, user_id } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch incident details
  const { data: incident } = await supabase
    .from('sos_incidents')
    .select('latitude, longitude, address')
    .eq('id', incident_id)
    .single()

  // Fetch guardians sorted by priority
  const { data: guardians } = await supabase
    .from('guardians')
    .select('name, phone')
    .eq('user_id', user_id)
    .eq('is_active', true)
    .order('priority', { ascending: true })

  const { data: user } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user_id)
    .single()

  const twilio = new Twilio(
    Deno.env.get('TWILIO_ACCOUNT_SID')!,
    Deno.env.get('TWILIO_AUTH_TOKEN')!
  )

  const mapsLink = `https://maps.google.com/?q=${incident.latitude},${incident.longitude}`
  const message = `🚨 EMERGENCY ALERT from ShieldHer\n${user.full_name} has triggered an SOS.\nLocation: ${incident.address || mapsLink}\nTrack live: ${mapsLink}\nContact: 112`

  // Send SMS to all guardians simultaneously
  const results = await Promise.allSettled(
    (guardians ?? []).map(guardian =>
      twilio.messages.create({
        body: message,
        from: Deno.env.get('TWILIO_PHONE_NUMBER')!,
        to: `+91${guardian.phone}`,
      })
    )
  )

  // Update incident: guardian notification count
  await supabase
    .from('sos_incidents')
    .update({ guardians_notified_count: results.filter(r => r.status === 'fulfilled').length })
    .eq('id', incident_id)

  return new Response(JSON.stringify({ sent: results.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Deploy: `supabase functions deploy notify-guardians`

---

## 9. Node.js API — Setup & Structure

The Node.js API handles heavy orchestration that Supabase Edge Functions can't do:
- ERSS 112 integration
- AI service proxy (Python FastAPI)
- Claude API FIR generation
- Complex SOS orchestration
- Twilio voice calls
- File virus scanning

### `shieldher-api/` structure

```
shieldher-api/
│
├── src/
│   │
│   ├── app.ts                      ← Express app setup
│   ├── server.ts                   ← HTTP server + graceful shutdown
│   │
│   ├── config/
│   │   ├── env.ts                  ← zod-validated env variables
│   │   ├── supabase.ts             ← Supabase admin client
│   │   └── constants.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts      ← Verify Supabase JWT
│   │   ├── rbac.middleware.ts      ← Role-based access
│   │   ├── rateLimiter.ts          ← express-rate-limit configs
│   │   ├── requestLogger.ts        ← Morgan + Winston
│   │   ├── errorHandler.ts         ← Global error handler
│   │   ├── validateBody.ts         ← Zod schema validation
│   │   └── auditLog.ts             ← Log to audit_log table
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   │
│   │   ├── sos/
│   │   │   ├── sos.routes.ts
│   │   │   ├── sos.controller.ts
│   │   │   ├── sos.service.ts
│   │   │   └── sos.schema.ts       ← Zod schemas
│   │   │
│   │   ├── complaints/
│   │   │   ├── complaints.routes.ts
│   │   │   ├── complaints.controller.ts
│   │   │   ├── complaints.service.ts
│   │   │   └── complaints.schema.ts
│   │   │
│   │   ├── evidence/
│   │   │   ├── evidence.routes.ts
│   │   │   ├── evidence.controller.ts
│   │   │   └── evidence.service.ts
│   │   │
│   │   ├── guardians/
│   │   │   ├── guardians.routes.ts
│   │   │   ├── guardians.controller.ts
│   │   │   └── guardians.service.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── twilio.service.ts
│   │   │   └── fcm.service.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── ai.routes.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.service.ts       ← proxy to Python AI service
│   │   │   └── claude.service.ts   ← Claude API integration
│   │   │
│   │   └── dashboard/
│   │       ├── dashboard.routes.ts
│   │       ├── dashboard.controller.ts
│   │       └── dashboard.service.ts
│   │
│   ├── integrations/
│   │   ├── erss.integration.ts     ← ERSS 112 API
│   │   └── cctns.integration.ts    ← Simulated CCTNS
│   │
│   └── utils/
│       ├── logger.ts               ← Winston logger
│       ├── asyncHandler.ts         ← try/catch wrapper for controllers
│       ├── ApiError.ts             ← Custom error class
│       └── geoUtils.ts             ← Reverse geocoding
│
├── .env
├── .env.example
├── tsconfig.json
├── Dockerfile
└── package.json
```

---

## 10. All Dependencies — Every Package Explained

### Production Dependencies

```json
{
  "dependencies": {
    "express": "^4.19.2",
    "@supabase/supabase-js": "^2.43.0",
    "axios": "^1.7.2",
    "zod": "^3.23.8",
    "twilio": "^5.1.0",
    "@anthropic-ai/sdk": "^0.24.0",
    "winston": "^3.13.0",
    "morgan": "^1.10.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.3.1",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.4",
    "node-clamav": "^0.2.3",
    "crypto": "builtin",
    "uuid": "^10.0.0",
    "dotenv": "^16.4.5",
    "compression": "^1.7.4",
    "express-validator": "^7.1.0",
    "date-fns": "^3.6.0"
  }
}
```

#### `express` ^4.x
REST API framework. Handles routing, middleware chaining. We use:
- `express.json()` — parse JSON bodies
- `express.urlencoded()` — parse form data
- `Router()` — modular route files per module
- Custom middleware pipeline: `requestLogger → cors → helmet → rateLimit → auth → rbac → handler → errorHandler`

#### `@supabase/supabase-js` ^2.x (Server-side)
On the backend, we use the **service role key** (bypasses RLS) for:
- Admin operations (officer creating complaints on behalf of user)
- Audit log insertions (system actor)
- Generating signed URLs for evidence download
- Verifying Supabase JWTs from incoming requests

```typescript
// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Admin client — bypasses all RLS (use with extreme care)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // NOT the anon key
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Verify incoming JWT from frontend
export async function verifySupabaseJWT(token: string) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error) throw new ApiError(401, 'Invalid token')
  return user
}
```

#### `twilio` ^5.x
Twilio Node.js SDK for:
- **SMS**: Guardian alerts, OTP (as backup to Supabase's built-in OTP)
- **Voice**: Automated voice call for SOS (reads out location + alert)
- **Webhook**: Incoming SMS for offline SOS trigger

#### `@anthropic-ai/sdk` ^0.24.x
Official Anthropic Claude SDK for:
- FIR draft generation from complaint description
- Translating complaint description to formal legal language
- Suggesting relevant IPC / IT Act sections
- AI-assisted complaint description writing

#### `helmet` ^7.x
Sets HTTP security headers automatically:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HTTPS enforcement)
- `Content-Security-Policy`
- `X-XSS-Protection`

#### `express-rate-limit` ^7.x
Rate limiting to prevent abuse:
- General API: 100 requests per 15 minutes
- SOS trigger: 5 per minute (prevent accidental spam)
- AI scan: 20 per hour (expensive operation)
- Auth OTP: 3 per 10 minutes

#### `multer` ^1.x
Multipart file upload middleware. Configured with:
- Memory storage (files never touch disk, go straight to Supabase Storage)
- MIME type filter (whitelist safe types)
- Size limit (50MB per file)

#### `sharp` ^0.33.x
High-performance image processing:
- Generate thumbnails for evidence images
- Strip EXIF metadata that may identify the officer viewing evidence (privacy)
- Convert HEIC (iPhone) to JPEG for cross-platform compatibility

#### `node-clamav` (or `clamscan`)
Virus scanning on uploaded evidence files before storing:
- Scans file buffer in memory before Supabase Storage upload
- Rejects infected files with 422 response

#### `winston` ^3.x
Structured logging:
- Log levels: `error`, `warn`, `info`, `http`, `debug`
- Transports: Console (dev), File (prod: `error.log`, `combined.log`)
- Format: JSON with timestamp, requestId, userId

---

## 11. Environment Variables

File: `shieldher-api/.env`

```env
# ==========================================
# SERVER
# ==========================================
NODE_ENV=development
PORT=3000
API_VERSION=v1

# ==========================================
# SUPABASE (Required)
# ==========================================
SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...        # public, for user-context calls
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # SECRET — bypasses RLS, never expose

# ==========================================
# TWILIO (Required for SMS/Voice)
# ==========================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# ANTHROPIC CLAUDE API (Required for AI)
# ==========================================
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxx

# ==========================================
# PYTHON AI SERVICE
# ==========================================
AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_API_KEY=internal-secret-key-for-service-auth

# ==========================================
# ERSS INTEGRATION (simulated in hackathon)
# ==========================================
ERSS_API_URL=https://erss-sim.shieldher.in/api
ERSS_API_KEY=erss-integration-key

# ==========================================
# GOOGLE MAPS (for reverse geocoding)
# ==========================================
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# CORS
# ==========================================
ALLOWED_ORIGINS=http://localhost:5173,https://shieldher.in

# ==========================================
# RATE LIMITING
# ==========================================
RATE_LIMIT_WINDOW_MS=900000         # 15 minutes
RATE_LIMIT_MAX=100
SOS_RATE_LIMIT_MAX=5
SOS_RATE_LIMIT_WINDOW_MS=60000      # 1 minute

# ==========================================
# CLAMAV (virus scanning)
# ==========================================
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310
```

---

## 12. Module: Authentication

### `src/middleware/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express'
import { verifySupabaseJWT } from '../config/supabase'
import { ApiError } from '../utils/ApiError'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string               // auth.uid()
        phone?: string
        email?: string
        app_role: 'user' | 'officer' | 'supervisor' | 'admin'
        db_user_id?: string      // public.users.id or public.officers.id
      }
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'No authorization token provided'))
  }

  const token = authHeader.split(' ')[1]

  const user = await verifySupabaseJWT(token)
  req.user = {
    id: user.id,
    phone: user.phone ?? undefined,
    email: user.email ?? undefined,
    app_role: (user.app_metadata?.app_role ?? 'user') as any,
  }

  next()
}
```

### `src/middleware/rbac.middleware.ts`

```typescript
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, 'Unauthorized'))
    if (!roles.includes(req.user.app_role)) {
      return next(new ApiError(403, 'Insufficient permissions'))
    }
    next()
  }
}

// Usage: router.put('/:id/assign', requireRole('officer', 'supervisor'), controller.assign)
```

---

## 13. Module: SOS & Emergency Response

### `src/modules/sos/sos.service.ts`

```typescript
import { supabaseAdmin } from '../../config/supabase'
import { erssIntegration } from '../../integrations/erss.integration'
import { twilioService } from '../notifications/twilio.service'
import { reverseGeocode } from '../../utils/geoUtils'
import axios from 'axios'

export const sosService = {
  async trigger(userId: string, payload: SOSTriggerPayload) {
    const { latitude, longitude, accuracy, trigger_type } = payload

    // 1. Reverse geocode the coordinates to a human-readable address
    const address = await reverseGeocode(latitude, longitude)

    // 2. Get user's DB id and full name
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, full_name, phone')
      .eq('auth_user_id', userId)
      .single()

    // 3. Create SOS incident in Supabase
    const { data: incident, error } = await supabaseAdmin
      .from('sos_incidents')
      .insert({
        user_id: user.id,
        latitude,
        longitude,
        address,
        trigger_type,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    // 4. Run these in parallel — don't await sequentially
    await Promise.allSettled([
      // Notify ERSS 112 (simulated)
      erssIntegration.notify({
        incident_id: incident.id,
        latitude,
        longitude,
        user_phone: user.phone,
        type: 'women_safety',
      }).then(({ erss_ref_id }) =>
        // Update incident with ERSS reference
        supabaseAdmin.from('sos_incidents')
          .update({ erss_ref_id, erss_notified_at: new Date().toISOString() })
          .eq('id', incident.id)
      ),

      // Notify guardians via Supabase Edge Function
      fetch(`${process.env.SUPABASE_URL}/functions/v1/notify-guardians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ incident_id: incident.id, user_id: user.id }),
      }),

      // Supabase Realtime will auto-broadcast the new row to police dashboard
      // (because we enabled realtime on sos_incidents table)
    ])

    return incident
  },

  async updateLocation(incidentId: string, userId: string, coords: LocationUpdate) {
    // Validate this incident belongs to the user
    const { data: incident } = await supabaseAdmin
      .from('sos_incidents')
      .select('id, user_id')
      .eq('id', incidentId)
      .eq('user_id', userId)
      .single()

    if (!incident) throw new ApiError(404, 'Incident not found')

    // Insert location point (Realtime broadcasts this to police dashboard)
    const { error } = await supabaseAdmin
      .from('location_stream')
      .insert({
        incident_id: incidentId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      })

    if (error) throw error
  },

  async resolve(incidentId: string, officerId?: string, notes?: string) {
    const { error } = await supabaseAdmin
      .from('sos_incidents')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        notes,
        ...(officerId && { assigned_to: officerId }),
      })
      .eq('id', incidentId)

    if (error) throw error
  },

  async getActiveSOS() {
    const { data, error } = await supabaseAdmin
      .from('sos_incidents')
      .select(`
        *,
        users (full_name, phone),
        officers (full_name, badge_number),
        location_stream (latitude, longitude, captured_at)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },
}
```

---

## 14. Module: Complaints & Reporting

### `src/modules/complaints/complaints.service.ts`

```typescript
export const complaintsService = {
  async create(authUserId: string, payload: CreateComplaintPayload) {
    // Get user DB id
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single()

    // Calculate AI risk score
    let aiRiskScore = 0.5
    try {
      const { data: aiResult } = await axios.post(
        `${process.env.AI_SERVICE_URL}/analyze-complaint`,
        { description: payload.description, category: payload.category }
      )
      aiRiskScore = aiResult.risk_score
    } catch { /* non-blocking */ }

    // Create complaint
    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .insert({
        user_id: user.id,
        category: payload.category,
        description: payload.description,
        incident_date: payload.incident_date,
        suspect_info: payload.suspect_info ?? {},
        wants_fir: payload.wants_fir ?? false,
        ai_risk_score: aiRiskScore,
        priority: aiRiskScore > 0.8 ? 'urgent'
                : aiRiskScore > 0.4 ? 'normal' : 'low',
      })
      .select()
      .single()

    if (error) throw error

    // If suspect info has phone/email/handle, check/update suspect profiles
    await this.linkSuspect(complaint.id, payload.suspect_info)

    // If user wants FIR, auto-generate via Claude
    if (payload.wants_fir) {
      await claudeService.generateFIRDraft(complaint.id, payload)
    }

    // Submit to cybercrime.gov.in portal (simulated)
    // await cybercrimePortal.submit(complaint)

    return complaint
  },

  async linkSuspect(complaintId: string, suspectInfo: any) {
    if (!suspectInfo?.phone && !suspectInfo?.email && !suspectInfo?.social_handles?.length) return

    // Check if suspect already exists (fuzzy match on phone/email)
    const { data: existing } = await supabaseAdmin
      .from('suspect_profiles')
      .select('id')
      .overlaps('phone_numbers', suspectInfo.phone ? [suspectInfo.phone] : [])
      .limit(1)

    let suspectId: string
    if (existing?.length) {
      suspectId = existing[0].id
      // Update with any new info
      await supabaseAdmin.from('suspect_profiles').update({
        phone_numbers: supabaseAdmin.rpc('array_union', {
          arr1: 'phone_numbers',
          new_val: suspectInfo.phone
        }),
      }).eq('id', suspectId)
    } else {
      // Create new suspect profile
      const { data: suspect } = await supabaseAdmin
        .from('suspect_profiles')
        .insert({
          phone_numbers: suspectInfo.phone ? [suspectInfo.phone] : [],
          email_addresses: suspectInfo.email ? [suspectInfo.email] : [],
          social_handles: suspectInfo.social_handles ?? [],
          known_names: suspectInfo.name ? [suspectInfo.name] : [],
        })
        .select('id')
        .single()
      suspectId = suspect!.id
    }

    // Link complaint ↔ suspect
    await supabaseAdmin
      .from('complaint_suspects')
      .upsert({ complaint_id: complaintId, suspect_id: suspectId })
  },

  async assignToOfficer(complaintId: string, officerId: string) {
    const { error } = await supabaseAdmin
      .from('complaints')
      .update({ assigned_to: officerId, status: 'assigned' })
      .eq('id', complaintId)

    if (error) throw error

    // Notify user via Supabase Realtime (via postgres_changes on complaints table)
    // (automatic — no extra code needed)
  },
}
```

---

## 15. Module: Evidence Management

### `src/modules/evidence/evidence.service.ts`

```typescript
import crypto from 'crypto'
import { supabaseAdmin } from '../../config/supabase'

export const evidenceService = {
  async processAndStore(
    file: Express.Multer.File,
    complaintId: string,
    authUserId: string,
    ipAddress: string
  ) {
    // 1. Compute SHA-256 hash of the file buffer
    const sha256Hash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex')

    // 2. Virus scan (ClamAV)
    const isClean = await virusScan(file.buffer)
    if (!isClean) {
      throw new ApiError(422, 'File failed virus scan')
    }

    // 3. Determine evidence type from MIME
    const evidenceType = inferEvidenceType(file.mimetype)

    // 4. Build storage path
    const timestamp = Date.now()
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `evidence/${authUserId}/${complaintId}/${timestamp}_${safeName}`

    // 5. Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('evidence')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        duplex: 'half',
      })

    if (uploadError) throw new ApiError(500, 'Storage upload failed')

    // 6. Get user DB id
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single()

    // 7. Save metadata to Supabase DB
    const { data: evidenceRecord, error: dbError } = await supabaseAdmin
      .from('evidence_files')
      .insert({
        complaint_id: complaintId,
        user_id: user!.id,
        file_name: file.originalname,
        file_type: file.mimetype,
        evidence_type: evidenceType,
        file_size: file.size,
        sha256_hash: sha256Hash,
        storage_path: storagePath,
        custody_chain: [{
          action: 'uploaded',
          actor_id: authUserId,
          actor_type: 'user',
          timestamp: new Date().toISOString(),
          ip: ipAddress,
        }],
      })
      .select()
      .single()

    if (dbError) throw new ApiError(500, 'DB insert failed')

    // 8. Send to AI service for analysis (non-blocking)
    this.queueAIAnalysis(evidenceRecord.id, storagePath, file.mimetype)

    return evidenceRecord
  },

  async generateSignedUrl(evidenceId: string, requestorId: string, requestorType: string, ip: string) {
    const { data: evidence } = await supabaseAdmin
      .from('evidence_files')
      .select('storage_path, sha256_hash, custody_chain')
      .eq('id', evidenceId)
      .single()

    if (!evidence) throw new ApiError(404, 'Evidence not found')

    // Add to custody chain
    const newCustody = {
      action: 'downloaded',
      actor_id: requestorId,
      actor_type: requestorType,
      timestamp: new Date().toISOString(),
      ip,
    }

    await supabaseAdmin
      .from('evidence_files')
      .update({
        custody_chain: [...(evidence.custody_chain as any[]), newCustody],
      })
      .eq('id', evidenceId)

    // Generate signed URL (valid 1 hour)
    const { data: signed } = await supabaseAdmin.storage
      .from('evidence')
      .createSignedUrl(evidence.storage_path, 3600)

    return { url: signed?.signedUrl, hash: evidence.sha256_hash }
  },

  async verifyIntegrity(evidenceId: string) {
    // Download the file and recompute hash to verify tamper-detection
    const { data: evidence } = await supabaseAdmin
      .from('evidence_files')
      .select('storage_path, sha256_hash')
      .eq('id', evidenceId)
      .single()

    const { data: fileData } = await supabaseAdmin.storage
      .from('evidence')
      .download(evidence!.storage_path)

    const buffer = Buffer.from(await (fileData as Blob).arrayBuffer())
    const currentHash = crypto.createHash('sha256').update(buffer).digest('hex')

    return {
      valid: currentHash === evidence!.sha256_hash,
      stored_hash: evidence!.sha256_hash,
      current_hash: currentHash,
    }
  },

  async queueAIAnalysis(evidenceId: string, storagePath: string, mimeType: string) {
    // Non-blocking — fire and forget
    axios.post(`${process.env.AI_SERVICE_URL}/analyze-evidence`, {
      evidence_id: evidenceId,
      storage_path: storagePath,
      mime_type: mimeType,
    }).then(({ data }) => {
      supabaseAdmin
        .from('evidence_files')
        .update({ ai_analysis: data })
        .eq('id', evidenceId)
    }).catch(err => logger.warn('AI analysis failed', { evidenceId, err: err.message }))
  },
}
```

---

## 16. Module: Notifications

### `src/modules/notifications/twilio.service.ts`

```typescript
import Twilio from 'twilio'

const client = Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

export const twilioService = {
  async sendSMS(to: string, message: string) {
    return client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: to.startsWith('+') ? to : `+91${to}`,
    })
  },

  async sendSOSVoiceCall(to: string, userName: string, locationUrl: string) {
    // TwiML voice call that reads out the emergency alert
    const twiml = `
      <Response>
        <Say voice="alice" language="en-IN">
          Emergency Alert from Shield Her.
          ${userName} has triggered an S O S emergency.
          Please check the location link sent to you by SMS and contact 112 immediately.
          This message will repeat twice.
        </Say>
        <Pause length="1"/>
        <Say voice="alice" language="en-IN">
          Emergency Alert from Shield Her.
          ${userName} needs your help. Contact 112 immediately.
        </Say>
      </Response>
    `

    return client.calls.create({
      twiml,
      to: to.startsWith('+') ? to : `+91${to}`,
      from: process.env.TWILIO_PHONE_NUMBER!,
    })
  },

  // Webhook handler for incoming SMS (offline SOS)
  async handleIncomingSMS(body: string, from: string) {
    const normalizedBody = body.trim().toLowerCase()
    const SOS_KEYWORDS = ['sos', 'help', 'emergency', 'bachao', 'madad']

    if (SOS_KEYWORDS.some(kw => normalizedBody.includes(kw))) {
      // Look up user by phone number
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', from.replace('+91', ''))
        .single()

      if (user) {
        // Create SOS incident (no GPS — SMS-based)
        await supabaseAdmin.from('sos_incidents').insert({
          user_id: user.id,
          latitude: 0,
          longitude: 0,
          trigger_type: 'sms',
          status: 'active',
        })

        return 'SOS received. Police and guardians are being notified. Stay safe.'
      }
    }

    return 'ShieldHer: We received your message. For emergencies, text SOS or call 112.'
  },
}
```

---

## 17. Module: Police Dashboard API

### `src/modules/dashboard/dashboard.service.ts`

```typescript
export const dashboardService = {
  async getStats(dateFrom: string, dateTo: string) {
    const [sosStats, complaintStats, responseStats] = await Promise.all([
      supabaseAdmin
        .from('sos_incidents')
        .select('status, created_at')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo),

      supabaseAdmin
        .from('complaints')
        .select('category, status, priority, created_at, resolved_at: updated_at')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo),

      supabaseAdmin
        .from('sos_incidents')
        .select('created_at, acknowledged_at, resolved_at')
        .eq('status', 'resolved')
        .gte('created_at', dateFrom),
    ])

    const avgResponseTimeMs = responseStats.data
      ?.filter(i => i.acknowledged_at)
      .map(i => new Date(i.acknowledged_at!).getTime() - new Date(i.created_at).getTime())
      .reduce((sum, t, _, arr) => sum + t / arr.length, 0) ?? 0

    return {
      total_sos: sosStats.data?.length ?? 0,
      active_sos: sosStats.data?.filter(i => i.status === 'active').length ?? 0,
      total_complaints: complaintStats.data?.length ?? 0,
      resolved_complaints: complaintStats.data?.filter(c => c.status === 'resolved').length ?? 0,
      urgent_complaints: complaintStats.data?.filter(c => c.priority === 'urgent').length ?? 0,
      avg_response_time_minutes: Math.round(avgResponseTimeMs / 60000),
      complaints_by_category: groupBy(complaintStats.data ?? [], 'category'),
    }
  },

  async getHeatmapData() {
    const { data } = await supabaseAdmin
      .from('sos_incidents')
      .select('latitude, longitude, created_at')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .not('latitude', 'eq', 0)

    return data?.map(i => ({ lat: i.latitude, lng: i.longitude })) ?? []
  },

  async searchSuspects(query: string) {
    const { data } = await supabaseAdmin
      .from('suspect_profiles')
      .select(`
        *,
        complaint_suspects (
          complaints (id, category, status, created_at)
        )
      `)
      .or(`
        phone_numbers.cs.{"${query}"},
        email_addresses.cs.{"${query}"},
        social_handles.cs.{"${query}"}
      `)
      .order('complaint_count', { ascending: false })
      .limit(20)

    return data
  },
}
```

---

## 18. Module: Guardian Management

```typescript
export const guardiansService = {
  async create(authUserId: string, payload: CreateGuardianPayload) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single()

    // Max 5 guardians
    const { count } = await supabaseAdmin
      .from('guardians')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)

    if ((count ?? 0) >= 5) {
      throw new ApiError(400, 'Maximum 5 guardians allowed')
    }

    return supabaseAdmin.from('guardians').insert({
      user_id: user!.id,
      ...payload,
    }).select().single()
  },

  async sendTestAlert(guardianId: string, authUserId: string) {
    const { data: guardian } = await supabaseAdmin
      .from('guardians')
      .select('phone, name')
      .eq('id', guardianId)
      .single()

    await twilioService.sendSMS(
      guardian!.phone,
      `This is a test alert from ShieldHer. ${guardian!.name}, you have been added as an emergency contact. You will be notified immediately in case of an emergency.`
    )
  },
}
```

---

## 19. Python AI Service (FastAPI)

### Structure

```
shieldher-ai/
├── app/
│   ├── main.py                 ← FastAPI app, CORS, routes
│   ├── config.py               ← pydantic-settings env config
│   ├── routers/
│   │   ├── url_scan.py
│   │   ├── profile_scan.py
│   │   ├── evidence_analysis.py
│   │   └── complaint_analysis.py
│   ├── services/
│   │   ├── phishing_detector.py
│   │   ├── deepfake_detector.py
│   │   ├── ner_extractor.py
│   │   └── risk_scorer.py
│   └── models/
│       └── (saved .pt / .h5 model files)
├── requirements.txt
└── Dockerfile
```

### `app/routers/url_scan.py`

```python
from fastapi import APIRouter
from pydantic import BaseModel, HttpUrl
import httpx
import tldextract
from datetime import datetime

router = APIRouter(prefix="/url-scan", tags=["URL Scan"])

class URLScanRequest(BaseModel):
    url: str

@router.post("")
async def scan_url(request: URLScanRequest):
    url = request.url
    result = {
        "url": url,
        "risk_level": "safe",    # safe | suspicious | dangerous
        "phishing_score": 0.0,   # 0.0 to 1.0
        "reasons": [],
        "domain_info": {},
    }

    try:
        ext = tldextract.extract(url)
        domain = f"{ext.domain}.{ext.suffix}"
        result["domain_info"]["domain"] = domain

        # Check 1: URL length (phishing URLs tend to be long)
        if len(url) > 200:
            result["reasons"].append("Unusually long URL")
            result["phishing_score"] += 0.2

        # Check 2: Special characters in domain (typosquatting)
        if any(c in ext.domain for c in ['-', '_', '0', '1']):
            result["reasons"].append("Domain contains suspicious characters")
            result["phishing_score"] += 0.15

        # Check 3: Check against VirusTotal (if API key available)
        # Check 4: Domain age via WHOIS
        # Check 5: Check against PhishTank database

        # Classify
        if result["phishing_score"] >= 0.7:
            result["risk_level"] = "dangerous"
        elif result["phishing_score"] >= 0.3:
            result["risk_level"] = "suspicious"

    except Exception as e:
        result["error"] = str(e)

    return result
```

### `app/routers/evidence_analysis.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import torch
from transformers import pipeline
import cv2
import numpy as np
from supabase import create_client

router = APIRouter(prefix="/analyze-evidence", tags=["Evidence Analysis"])

# Load models at startup (cached)
deepfake_classifier = pipeline(
    "image-classification",
    model="prithivida/deepfake-detection",
    device=0 if torch.cuda.is_available() else -1
)

@router.post("")
async def analyze_evidence(request: AnalyzeEvidenceRequest):
    # Download file from Supabase Storage
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    file_response = supabase.storage.from_("evidence").download(request.storage_path)
    file_bytes = file_response

    result = {
        "evidence_id": request.evidence_id,
        "deepfake_score": None,
        "phishing_urls": [],
        "entities": [],
        "nsfw_score": None,
        "processed_at": datetime.utcnow().isoformat(),
    }

    if request.mime_type.startswith("image/"):
        # Deepfake detection
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        predictions = deepfake_classifier(img_rgb)
        fake_pred = next((p for p in predictions if p["label"] == "fake"), None)
        result["deepfake_score"] = fake_pred["score"] if fake_pred else 0.0

    elif request.mime_type == "text/plain":
        # NER: extract phone numbers, emails, URLs, social handles
        text = file_bytes.decode("utf-8", errors="ignore")
        result["entities"] = extract_entities(text)
        result["phishing_urls"] = extract_and_scan_urls(text)

    return result
```

---

## 20. Integration: ERSS 112

### `src/integrations/erss.integration.ts`

```typescript
export const erssIntegration = {
  async notify(payload: ERSSPayload) {
    // Production: POST to https://erss.gujarat.gov.in/api/sos
    // Hackathon: simulated endpoint

    const { data } = await axios.post(
      `${process.env.ERSS_API_URL}/sos`,
      {
        incident_id: payload.incident_id,
        latitude: payload.latitude,
        longitude: payload.longitude,
        caller_phone: payload.user_phone,
        incident_type: 'women_safety',
        platform: 'shieldher',
        timestamp: new Date().toISOString(),
      },
      {
        headers: { 'X-API-Key': process.env.ERSS_API_KEY! },
        timeout: 5000,
      }
    )

    return { erss_ref_id: data.ticket_id, eta: data.estimated_response_time }
  },
}
```

---

## 21. Integration: Twilio SMS & Voice

Already covered in the Notifications module. Summary:
- SMS: guardian alerts, OTP backup, test alerts
- Voice: automated emergency call with TwiML
- Webhook: incoming SMS triggers offline SOS flow

---

## 22. Integration: Claude API (FIR Drafting)

### `src/modules/ai/claude.service.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const IPC_SECTION_MAP: Record<string, string[]> = {
  cyberstalking:    ['IPC 354D', 'IT Act 66C', 'IT Act 66E'],
  harassment:       ['IPC 354A', 'IPC 509', 'IT Act 66A'],
  blackmail:        ['IPC 383', 'IPC 384', 'IT Act 66E', 'IT Act 67A'],
  deepfake:         ['IT Act 67A', 'IT Act 66C', 'IPC 509'],
  identity_theft:   ['IT Act 66C', 'IT Act 66D', 'IPC 420'],
  financial_fraud:  ['IPC 420', 'IPC 406', 'IT Act 66C', 'IT Act 66D'],
  phishing:         ['IT Act 66C', 'IT Act 66D', 'IPC 420'],
}

export const claudeService = {
  async generateFIRDraft(complaintId: string, payload: any) {
    const suggestedSections = IPC_SECTION_MAP[payload.category] ?? ['IPC 420']

    const prompt = `You are a legal assistant for the Cyber Crime Branch, Ahmedabad. 
Draft a formal First Information Report (FIR) in English based on the following cybercrime complaint.

COMPLAINT DETAILS:
Category: ${payload.category}
Date of Incident: ${payload.incident_date ?? 'Not specified'}
Description: ${payload.description}
Suspect Information: ${JSON.stringify(payload.suspect_info ?? {})}
Relevant Sections: ${suggestedSections.join(', ')}

REQUIREMENTS:
1. Use formal legal language appropriate for an Indian FIR
2. Include: complainant details placeholder, date/time, incident description, suspect details, sections invoked
3. Keep it factual — do not add information not provided
4. Include a "Prayer" section requesting investigation
5. Format with clear headings

Draft the complete FIR text:`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const draftText = response.content[0].type === 'text'
      ? response.content[0].text : ''

    // Save to DB
    const { data: fir } = await supabaseAdmin
      .from('fir_drafts')
      .insert({
        complaint_id: complaintId,
        draft_text: draftText,
        generated_by: 'ai',
        ipc_sections: suggestedSections,
      })
      .select()
      .single()

    // Update complaint with suggested sections
    await supabaseAdmin
      .from('complaints')
      .update({ ai_ipc_sections: suggestedSections })
      .eq('id', complaintId)

    return fir
  },
}
```

---

## 23. Security Architecture

### 23.1 Authentication at Every Layer

```
Frontend → sends Supabase JWT in Authorization header
↓
Node.js API → auth.middleware.ts verifies JWT using supabase.auth.getUser()
↓
Supabase DB → RLS policies check auth.uid() for every query
↓
Supabase Storage → Storage policies check auth.uid() for every file op
```

### 23.2 Input Sanitization

```typescript
// src/middleware/validateBody.ts
import { z } from 'zod'

export function validateBody<T>(schema: z.Schema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(new ApiError(400, 'Validation failed', result.error.errors))
    }
    req.body = result.data  // replace with parsed + sanitized data
    next()
  }
}
```

### 23.3 File Security

```typescript
// Multer configuration — never store files on disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const ALLOWED_MIME = [
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/quicktime',
      'audio/mpeg', 'audio/wav',
      'application/pdf', 'text/plain', 'application/zip'
    ]
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new ApiError(400, 'File type not allowed'))
    }
    cb(null, true)
  },
})
```

---

## 24. Database Indexes & Performance

### Migration: `20240101000005_indexes.sql`

```sql
-- SOS incidents: fast lookup by user + status
CREATE INDEX idx_sos_user_id ON public.sos_incidents(user_id);
CREATE INDEX idx_sos_status ON public.sos_incidents(status);
CREATE INDEX idx_sos_created_at ON public.sos_incidents(created_at DESC);

-- Location stream: fast lookup by incident + time
CREATE INDEX idx_location_incident_id ON public.location_stream(incident_id);
CREATE INDEX idx_location_captured_at ON public.location_stream(captured_at DESC);

-- Complaints: most frequent query patterns
CREATE INDEX idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_assigned_to ON public.complaints(assigned_to);
CREATE INDEX idx_complaints_category ON public.complaints(category);
CREATE INDEX idx_complaints_priority ON public.complaints(priority);
CREATE INDEX idx_complaints_created_at ON public.complaints(created_at DESC);

-- Evidence: complaint lookup
CREATE INDEX idx_evidence_complaint_id ON public.evidence_files(complaint_id);
CREATE INDEX idx_evidence_user_id ON public.evidence_files(user_id);

-- Audit log: entity lookup
CREATE INDEX idx_audit_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON public.audit_log(created_at DESC);

-- Suspects: GIN index for array contains queries
CREATE INDEX idx_suspects_phones ON public.suspect_profiles USING GIN(phone_numbers);
CREATE INDEX idx_suspects_emails ON public.suspect_profiles USING GIN(email_addresses);
CREATE INDEX idx_suspects_handles ON public.suspect_profiles USING GIN(social_handles);

-- Complaints description: full-text search
CREATE INDEX idx_complaints_description_fts
  ON public.complaints
  USING GIN(to_tsvector('english', description));
```

---

## 25. Deployment Guide

### 25.1 Local Development

```bash
# Start Supabase locally
supabase start
# → Local Studio: http://localhost:54323
# → API URL: http://localhost:54321
# → Anon key: printed in terminal

# Start Node.js API
cd shieldher-api
cp .env.example .env    # fill in values
npm install
npm run dev             # ts-node-dev with hot reload

# Start Python AI service
cd shieldher-ai
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Start Frontend
cd shieldher-web
npm install
npm run dev             # Vite dev server at :5173
```

### 25.2 Docker Compose (Full Stack)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: ./shieldher-api
    ports: ['3000:3000']
    env_file: ./shieldher-api/.env
    depends_on: [redis]

  ai-service:
    build: ./shieldher-ai
    ports: ['8001:8001']
    env_file: ./shieldher-ai/.env

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  web:
    build: ./shieldher-web
    ports: ['80:80']
    env_file: ./shieldher-web/.env

  nginx:
    image: nginx:alpine
    ports: ['443:443', '80:80']
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
```

### 25.3 Supabase Database Migration Order

```bash
supabase db push    # applies migrations in order:
# 1. initial_schema.sql
# 2. rls_policies.sql
# 3. storage_buckets.sql
# 4. realtime.sql
# 5. indexes.sql
```

### 25.4 Production Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` never in frontend code
- [ ] All Supabase tables have RLS enabled (`ENABLE ROW LEVEL SECURITY`)
- [ ] Google Maps API key restricted to production domain
- [ ] Twilio webhook URL registered (`/webhooks/twilio/sms`)
- [ ] ClamAV daemon running on server
- [ ] HTTPS enforced via Nginx + Let's Encrypt
- [ ] Supabase daily backups enabled (dashboard → Database → Backups)
- [ ] Rate limiting tested for SOS endpoint

---

*ShieldHer Backend v1.0 | Built with Node.js + Supabase + Python FastAPI*
