# 🎨 ShieldHer — Frontend Documentation
### Complete Technical Reference | React.js + Supabase + Tailwind CSS

---

## Table of Contents

1. [Tech Stack Overview](#1-tech-stack-overview)
2. [Project Initialization](#2-project-initialization)
3. [All Dependencies — Every Package Explained](#3-all-dependencies--every-package-explained)
4. [Environment Variables](#4-environment-variables)
5. [Folder Structure](#5-folder-structure)
6. [Supabase Client Setup](#6-supabase-client-setup)
7. [Authentication Flow (Supabase Auth)](#7-authentication-flow-supabase-auth)
8. [Routing Architecture](#8-routing-architecture)
9. [State Management Strategy](#9-state-management-strategy)
10. [Real-time Subscriptions (Supabase Realtime)](#10-real-time-subscriptions-supabase-realtime)
11. [Pages — User App](#11-pages--user-app)
12. [Pages — Police Dashboard](#12-pages--police-dashboard)
13. [Shared Components Library](#13-shared-components-library)
14. [SOS Module — Deep Dive](#14-sos-module--deep-dive)
15. [Cybercrime Report Wizard](#15-cybercrime-report-wizard)
16. [Evidence Upload (Supabase Storage)](#16-evidence-upload-supabase-storage)
17. [Google Maps Integration](#17-google-maps-integration)
18. [Internationalization (i18n)](#18-internationalization-i18n)
19. [Form Handling & Validation](#19-form-handling--validation)
20. [API Layer & React Query](#20-api-layer--react-query)
21. [Error Handling & Notifications](#21-error-handling--notifications)
22. [UI Design System](#22-ui-design-system)
23. [Performance Optimizations](#23-performance-optimizations)
24. [Build, Linting & Deployment](#24-build-linting--deployment)

---

## 1. Tech Stack Overview

| Layer | Technology | Version | Why |
|---|---|---|---|
| Framework | React | 18.3 | Industry standard, huge ecosystem, concurrent features |
| Build Tool | Vite | 5.x | Blazing fast HMR, better than CRA, ES modules native |
| Language | TypeScript | 5.x | Type safety, better DX, catches bugs at compile time |
| Styling | Tailwind CSS | 3.4 | Utility-first, no CSS bloat, easy responsive design |
| Component Library | shadcn/ui | Latest | Accessible, unstyled at core, works perfectly with Tailwind |
| Routing | React Router v6 | 6.x | De facto standard, nested routes, data loaders |
| Server State | TanStack Query (React Query) | 5.x | Caching, background sync, loading/error states for Supabase queries |
| Client State | Zustand | 4.x | Minimal boilerplate, no reducers, perfect for SOS/UI state |
| Database Client | @supabase/supabase-js | 2.x | Direct DB queries, Auth, Storage, Realtime from frontend |
| Maps | @react-google-maps/api | 2.x | Google Maps in React with hooks |
| Forms | React Hook Form | 7.x | Performant, uncontrolled, great with Zod |
| Validation | Zod | 3.x | Schema-based validation, TypeScript-first |
| HTTP Client | Axios | 1.x | For calls to our Node.js backend (AI, ERSS, Twilio) |
| i18n | i18next + react-i18next | Latest | Multilingual: English, Hindi, Gujarati |
| Charts | Recharts | 2.x | React-native chart library for police analytics |
| File Upload | react-dropzone | 14.x | Drag-and-drop with MIME type filtering |
| Hashing | crypto-js | 4.x | SHA-256 hash generation before file upload |
| Notifications | sonner | 1.x | Beautiful toast notifications |
| Icons | lucide-react | 0.x | Clean, consistent icon set |
| Date | date-fns | 3.x | Lightweight date formatting + manipulation |
| Animations | framer-motion | 11.x | Smooth SOS button animation, page transitions |

---

## 2. Project Initialization

### 2.1 Create the Project

```bash
# Create Vite + React + TypeScript project
npm create vite@latest shieldher-web -- --template react-ts

cd shieldher-web

# Install all dependencies at once
npm install \
  react-router-dom \
  @supabase/supabase-js \
  @tanstack/react-query \
  @tanstack/react-query-devtools \
  zustand \
  axios \
  react-hook-form \
  @hookform/resolvers \
  zod \
  i18next \
  react-i18next \
  i18next-browser-languagedetector \
  i18next-http-backend \
  @react-google-maps/api \
  recharts \
  react-dropzone \
  crypto-js \
  sonner \
  lucide-react \
  date-fns \
  framer-motion \
  clsx \
  tailwind-merge \
  class-variance-authority \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  @radix-ui/react-toast \
  @radix-ui/react-avatar \
  @radix-ui/react-badge \
  @radix-ui/react-progress \
  @radix-ui/react-tabs \
  @radix-ui/react-switch \
  @radix-ui/react-slider

# Dev dependencies
npm install -D \
  tailwindcss \
  postcss \
  autoprefixer \
  @types/crypto-js \
  @types/google.maps \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  prettier \
  eslint-config-prettier \
  husky \
  lint-staged

# Initialize Tailwind
npx tailwindcss init -p
```

### 2.2 Initialize shadcn/ui

```bash
npx shadcn-ui@latest init
# Choose: TypeScript → Yes
# Base color: Slate (professional look)
# CSS variables: Yes
# Tailwind config: tailwind.config.ts
# Components dir: src/components/ui
# Utils dir: src/lib/utils

# Install shadcn components we'll use
npx shadcn-ui@latest add button card input label badge
npx shadcn-ui@latest add dialog sheet alert-dialog
npx shadcn-ui@latest add dropdown-menu select
npx shadcn-ui@latest add form
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add table
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add tooltip
```

---

## 3. All Dependencies — Every Package Explained

### 3.1 Production Dependencies

#### `@supabase/supabase-js` ^2.x
The official Supabase JavaScript client. This single package gives us:
- `supabase.auth` — Phone OTP login, session management, user data
- `supabase.from('table')` — Full PostgreSQL queries (select, insert, update, delete, filters, joins)
- `supabase.storage` — Upload/download files (evidence screenshots, chat logs)
- `supabase.channel()` — Real-time subscriptions for live SOS alerts on police dashboard
- RLS (Row Level Security) is enforced automatically — users can only see their own data

```typescript
// What we get from ONE import:
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(URL, ANON_KEY)

supabase.auth.signInWithOtp({ phone: '+91...' })
supabase.from('complaints').select('*').eq('user_id', userId)
supabase.storage.from('evidence').upload(path, file)
supabase.channel('sos-alerts').on('postgres_changes', ...).subscribe()
```

#### `react-router-dom` ^6.x
Handles all client-side routing. We use:
- `createBrowserRouter` with `RouterProvider` (new v6 data API)
- Nested routes for layouts (user layout vs police layout)
- `loader` functions for pre-fetching data before page renders
- `ProtectedRoute` wrapper using `Navigate` to redirect unauthenticated users
- `Outlet` for shared layouts

#### `@tanstack/react-query` ^5.x
Manages all async server state (Supabase queries). Replaces useEffect+useState for data fetching. We use:
- `useQuery` — fetch and cache complaints list, guardian list, complaint detail
- `useMutation` — create SOS, submit complaint, upload evidence
- `useInfiniteQuery` — paginated complaint list for police dashboard
- `queryClient.invalidateQueries` — refresh data after mutations
- Automatic background refetching, loading/error states, retry logic

#### `zustand` ^4.x
Lightweight global state for UI-only state (not server state). We use it for:
- `useAuthStore` — current user session, role (user/officer)
- `useSOSStore` — active SOS state, timer, GPS coordinates being tracked
- `useUIStore` — language setting, sidebar open/close, active incident on map

Why Zustand over Redux? Zero boilerplate, no reducers, no actions, no dispatch. Just a store with getters and setters.

#### `axios` ^1.x
HTTP client for calls to our **Node.js backend** (not Supabase directly). Used for:
- `POST /api/sos/trigger` — orchestrates ERSS ping + Twilio SMS + WebSocket broadcast
- `POST /api/ai/scan-url` — proxy to Python AI service
- `POST /api/ai/draft-fir` — Claude API FIR generation
- `POST /api/ai/analyze-evidence` — deepfake / phishing detection

Configured with base URL, auth interceptor (attaches Supabase JWT), and error interceptor.

#### `react-hook-form` + `@hookform/resolvers` + `zod`
Form state management trio:
- `react-hook-form` — minimal re-renders, uncontrolled inputs, handles 100+ field forms
- `zod` — TypeScript-first schema validation: `.string().min(10)`, `.enum([...])`, `.url()`
- `@hookform/resolvers/zod` — bridges zod schema → react-hook-form validation
- Used in: Report Wizard (5 steps), Guardian form, Officer login, Profile setup

#### `i18next` + `react-i18next` + `i18next-browser-languagedetector`
Complete internationalization stack:
- `i18next` — core translation engine
- `react-i18next` — `useTranslation()` hook for components
- `i18next-browser-languagedetector` — auto-detects browser language
- `i18next-http-backend` — lazy-loads translation JSON files (don't bundle all languages upfront)
- Supports: English (`en`), Hindi (`hi`), Gujarati (`gu`)

#### `@react-google-maps/api` ^2.x
React wrapper for Google Maps JavaScript API. We use:
- `<GoogleMap>` — base map container
- `<Marker>` — SOS incident location markers
- `<InfoWindow>` — popup on marker click with incident details
- `useLoadScript` — loads the Maps SDK lazily
- `<HeatmapLayer>` — unsafe zone visualization (Google Maps Visualization library)

#### `recharts` ^2.x
Chart library for police analytics dashboard. We use:
- `<BarChart>` — incidents by category
- `<LineChart>` — incidents over time (daily/weekly trend)
- `<PieChart>` — incident type distribution
- `<AreaChart>` — response time trends
- All charts are responsive via `<ResponsiveContainer>`

#### `react-dropzone` ^14.x
File upload with drag-and-drop:
- `useDropzone()` hook — handles drag events, file selection
- MIME type validation: `accept={{ 'image/*': [], 'application/pdf': [], 'video/*': [] }}`
- `maxSize` enforcement (50MB per file)
- Returns `acceptedFiles` and `rejectedFiles` arrays

#### `crypto-js` ^4.x
Client-side SHA-256 hashing for evidence tamper-detection:
```typescript
import CryptoJS from 'crypto-js'
const fileHash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(arrayBuffer)).toString()
// stored alongside the file in MongoDB/Supabase for chain-of-custody
```

#### `framer-motion` ^11.x
Animations used for:
- SOS button pulse effect (red ring expanding outward)
- Page transitions (fade in/out between routes)
- Report wizard step transitions (slide left/right)
- Alert cards sliding in from top

#### `sonner` ^1.x
Toast notification library:
- `toast.success()`, `toast.error()`, `toast.loading()`, `toast.promise()`
- Used for: SOS triggered confirmation, evidence upload progress, complaint submission

#### `clsx` + `tailwind-merge` + `class-variance-authority`
The shadcn/ui utility trio for conditional class names:
- `clsx` — merge conditional class strings: `clsx('base', isActive && 'active')`
- `tailwind-merge` — merge Tailwind classes without conflicts: `twMerge('p-4', 'p-8')` → `'p-8'`
- `class-variance-authority` — creates variant-based component APIs: Button with `variant="primary"`, `size="lg"`

#### `lucide-react` ^0.x
Icon library. 1000+ clean SVG icons as React components. Used everywhere in the UI.

#### `date-fns` ^3.x
Date utility library:
- `format(date, 'dd MMM yyyy, hh:mm a')` — display timestamps
- `formatDistanceToNow(date)` — "2 hours ago"
- `isWithinInterval` — check if incident is within time range

---

## 4. Environment Variables

File: `shieldher-web/.env.local`

```env
# ==========================================
# SUPABASE (Required)
# ==========================================
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Anon key is safe to expose in frontend — RLS protects the data

# ==========================================
# NODE.JS BACKEND API (Required)
# ==========================================
VITE_API_BASE_URL=http://localhost:3000/api/v1
# In production: https://api.shieldher.in/api/v1

# ==========================================
# GOOGLE MAPS (Required for maps)
# ==========================================
VITE_GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Restrict this key to your domain in Google Console!

# ==========================================
# FEATURE FLAGS (Optional)
# ==========================================
VITE_ENABLE_VOICE_SOS=true
VITE_ENABLE_OFFLINE_SMS=false
VITE_ENABLE_AI_SCAN=true
VITE_ENABLE_HEATMAP=true

# ==========================================
# APP CONFIG
# ==========================================
VITE_APP_NAME=ShieldHer
VITE_DEFAULT_LANGUAGE=en
VITE_SOS_LOCATION_INTERVAL_MS=10000    # 10 seconds between GPS pings
VITE_MAX_EVIDENCE_FILE_SIZE_MB=50
VITE_MAX_EVIDENCE_FILES_PER_COMPLAINT=10
```

---

## 5. Folder Structure

```
shieldher-web/
│
├── public/
│   ├── locales/                    ← i18n translation files (lazy loaded)
│   │   ├── en/
│   │   │   └── translation.json
│   │   ├── hi/
│   │   │   └── translation.json
│   │   └── gu/
│   │       └── translation.json
│   ├── icons/
│   │   ├── sos-icon.svg
│   │   └── shield-logo.svg
│   └── manifest.json               ← PWA manifest
│
├── src/
│   │
│   ├── main.tsx                    ← App entry point, providers wrapper
│   ├── App.tsx                     ← Router setup
│   ├── vite-env.d.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts             ← Supabase client singleton
│   │   ├── axios.ts                ← Axios instance + interceptors
│   │   ├── queryClient.ts          ← React Query client config
│   │   └── utils.ts                ← cn() utility (clsx + twMerge)
│   │
│   ├── types/
│   │   ├── supabase.ts             ← Auto-generated Supabase types
│   │   ├── auth.types.ts
│   │   ├── sos.types.ts
│   │   ├── complaint.types.ts
│   │   ├── evidence.types.ts
│   │   ├── officer.types.ts
│   │   └── index.ts                ← Re-exports all types
│   │
│   ├── store/                      ← Zustand global stores
│   │   ├── authStore.ts
│   │   ├── sosStore.ts
│   │   └── uiStore.ts
│   │
│   ├── hooks/                      ← Custom React hooks
│   │   ├── useAuth.ts              ← Auth state + actions
│   │   ├── useGeolocation.ts       ← GPS coordinates + watch position
│   │   ├── useSOS.ts               ← SOS trigger + location streaming
│   │   ├── useSupabaseQuery.ts     ← Wrapper for React Query + Supabase
│   │   ├── useRealtime.ts          ← Supabase Realtime subscription
│   │   ├── useSilentSOS.ts         ← Keyboard shortcut detection
│   │   ├── useVoiceSOS.ts          ← Web Speech API keyword detection
│   │   ├── useFileUpload.ts        ← Evidence upload with hash + progress
│   │   └── useI18n.ts              ← Language switching helper
│   │
│   ├── services/                   ← API call functions
│   │   ├── auth.service.ts         ← OTP send/verify
│   │   ├── sos.service.ts          ← SOS trigger/update/resolve
│   │   ├── complaint.service.ts    ← CRUD complaints
│   │   ├── evidence.service.ts     ← Upload, hash, Supabase Storage
│   │   ├── guardian.service.ts     ← CRUD guardians
│   │   ├── ai.service.ts           ← URL scan, FIR draft, deepfake
│   │   ├── dashboard.service.ts    ← Police dashboard data
│   │   └── notification.service.ts ← FCM token registration
│   │
│   ├── components/
│   │   │
│   │   ├── ui/                     ← shadcn/ui base components (generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── table.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/
│   │   │   ├── PhoneInput.tsx      ← Phone number with country code
│   │   │   ├── OtpInput.tsx        ← 6-digit OTP input boxes
│   │   │   └── AuthGuard.tsx       ← Redirect unauthenticated users
│   │   │
│   │   ├── sos/
│   │   │   ├── SOSButton.tsx       ← Big red button with pulse animation
│   │   │   ├── SOSCountdown.tsx    ← 5-second countdown before trigger
│   │   │   ├── SOSActiveOverlay.tsx ← Full-screen "SOS Active" state
│   │   │   ├── PanicMode.tsx       ← Fake "Calculator" UI overlay
│   │   │   ├── SilentSOSIndicator.tsx
│   │   │   └── LocationShareStatus.tsx
│   │   │
│   │   ├── complaint/
│   │   │   ├── ReportWizard.tsx    ← 5-step wizard container
│   │   │   ├── steps/
│   │   │   │   ├── Step1Category.tsx
│   │   │   │   ├── Step2Description.tsx
│   │   │   │   ├── Step3Evidence.tsx
│   │   │   │   ├── Step4Suspect.tsx
│   │   │   │   └── Step5Review.tsx
│   │   │   ├── ComplaintCard.tsx   ← Summary card in list
│   │   │   ├── ComplaintStatus.tsx ← Status badge with icon
│   │   │   ├── FIRViewer.tsx       ← View AI-generated FIR
│   │   │   └── MessageThread.tsx   ← Officer ↔ User chat
│   │   │
│   │   ├── evidence/
│   │   │   ├── EvidenceDropzone.tsx
│   │   │   ├── EvidenceFileCard.tsx
│   │   │   ├── EvidenceViewer.tsx  ← View with hash verification
│   │   │   ├── UploadProgress.tsx
│   │   │   └── HashBadge.tsx       ← Show SHA-256 hash visually
│   │   │
│   │   ├── map/
│   │   │   ├── LiveIncidentMap.tsx ← Police dashboard map
│   │   │   ├── IncidentMarker.tsx
│   │   │   ├── IncidentPopup.tsx   ← Marker click popup
│   │   │   ├── HeatmapLayer.tsx    ← Unsafe zones overlay
│   │   │   ├── UserLocationMap.tsx ← User sharing their location
│   │   │   └── NearbyStations.tsx  ← Police stations on map
│   │   │
│   │   ├── dashboard/
│   │   │   ├── IncidentQueue.tsx   ← Live list with filters
│   │   │   ├── CaseCard.tsx
│   │   │   ├── AnalyticsCards.tsx  ← KPI metrics row
│   │   │   ├── IncidentChart.tsx   ← Bar chart
│   │   │   ├── CategoryPie.tsx     ← Pie chart
│   │   │   ├── ResponseTimeChart.tsx
│   │   │   └── SuspectProfile.tsx
│   │   │
│   │   ├── safety/
│   │   │   ├── URLScanner.tsx      ← Paste URL → AI scan result
│   │   │   ├── ProfileScanner.tsx
│   │   │   ├── SafetyTip.tsx       ← Single awareness card
│   │   │   ├── AlertFeed.tsx       ← Push cyber safety alerts
│   │   │   └── HelplineCard.tsx    ← 112, 1930, NCW
│   │   │
│   │   └── shared/
│   │       ├── Navbar.tsx          ← User app top nav
│   │       ├── PoliceNavbar.tsx    ← Police dashboard nav
│   │       ├── Sidebar.tsx         ← Police sidebar
│   │       ├── BottomNav.tsx       ← Mobile bottom navigation
│   │       ├── PageHeader.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── LanguageToggle.tsx
│   │       └── ThemeProvider.tsx
│   │
│   ├── pages/
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx       ← Phone number entry
│   │   │   ├── OtpPage.tsx         ← OTP verification
│   │   │   └── OnboardingPage.tsx  ← Profile + guardian setup
│   │   │
│   │   ├── user/
│   │   │   ├── HomePage.tsx        ← SOS + quick actions
│   │   │   ├── SOSPage.tsx         ← Dedicated SOS with map
│   │   │   ├── ReportPage.tsx      ← Report wizard entry
│   │   │   ├── MyComplaintsPage.tsx
│   │   │   ├── ComplaintDetailPage.tsx
│   │   │   ├── SafetyHubPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── GuardiansPage.tsx
│   │   │
│   │   └── police/
│   │       ├── PoliceDashboard.tsx ← Overview + live map
│   │       ├── PoliceLoginPage.tsx
│   │       ├── ActiveIncidents.tsx
│   │       ├── CaseListPage.tsx
│   │       ├── CaseDetailPage.tsx
│   │       ├── EvidenceViewPage.tsx
│   │       ├── AnalyticsPage.tsx
│   │       └── SuspectsPage.tsx
│   │
│   └── i18n/
│       └── i18n.ts                 ← i18next configuration
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── eslint.config.js
├── .prettierrc
├── .env.local
├── .env.example
└── package.json
```

---

## 6. Supabase Client Setup

### `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Typed client — Database type is auto-generated via Supabase CLI
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,           // store session in localStorage
    autoRefreshToken: true,         // refresh JWT before expiry
    detectSessionInUrl: true,       // handle magic link callbacks
  },
  realtime: {
    params: {
      eventsPerSecond: 10,          // rate limit for realtime events
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'shieldher-web/1.0',
    },
  },
})

// Export type helpers
export type SupabaseClient = typeof supabase
```

### `src/lib/axios.ts`

```typescript
import axios from 'axios'
import { supabase } from './supabase'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Response interceptor: handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.')
    }
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.')
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## 7. Authentication Flow (Supabase Auth)

### 7.1 Strategy
We use **Supabase Phone Auth (OTP via SMS)**. No passwords. Supabase handles:
- OTP generation and SMS delivery (via Twilio integration in Supabase dashboard)
- Session management (JWT access + refresh tokens)
- Auto token refresh

For **Police Officers**, they log in with Email + Password (Supabase Email Auth) + TOTP 2FA.

### 7.2 `src/store/authStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

type UserRole = 'user' | 'officer' | 'supervisor' | null

interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole
  isLoading: boolean
  isAuthenticated: boolean
  setSession: (session: Session | null) => void
  setRole: (role: UserRole) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      role: null,
      isLoading: true,
      isAuthenticated: false,

      setSession: (session) => set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      }),

      setRole: (role) => set({ role }),

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, role: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ role: state.role }), // only persist role
    }
  )
)
```

### 7.3 `src/hooks/useAuth.ts`

```typescript
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { setSession, setRole, ...state } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserRole(session.user.id)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session) fetchUserRole(session.user.id)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchUserRole(userId: string) {
    // Check if user is an officer (stored in officers table)
    const { data: officer } = await supabase
      .from('officers')
      .select('role')
      .eq('auth_user_id', userId)
      .single()

    setRole(officer ? (officer.role as any) : 'user')
  }

  async function sendOtp(phone: string) {
    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) throw error
  }

  async function verifyOtp(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    if (error) throw error
    return data
  }

  return { ...state, sendOtp, verifyOtp }
}
```

### 7.4 `src/components/auth/AuthGuard.tsx`

```typescript
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LoadingSpinner } from '../shared/LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'officer' | 'supervisor'
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, isLoading, role } = useAuthStore()
  const location = useLocation()

  if (isLoading) return <LoadingSpinner fullScreen />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && role !== requiredRole && role !== 'supervisor') {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
```

---

## 8. Routing Architecture

### `src/App.tsx`

```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const OtpPage = lazy(() => import('./pages/auth/OtpPage'))
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage'))
const HomePage = lazy(() => import('./pages/user/HomePage'))
const SOSPage = lazy(() => import('./pages/user/SOSPage'))
const ReportPage = lazy(() => import('./pages/user/ReportPage'))
const MyComplaintsPage = lazy(() => import('./pages/user/MyComplaintsPage'))
const ComplaintDetailPage = lazy(() => import('./pages/user/ComplaintDetailPage'))
const SafetyHubPage = lazy(() => import('./pages/user/SafetyHubPage'))
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'))
const GuardiansPage = lazy(() => import('./pages/user/GuardiansPage'))
const PoliceDashboard = lazy(() => import('./pages/police/PoliceDashboard'))
const CaseListPage = lazy(() => import('./pages/police/CaseListPage'))
const CaseDetailPage = lazy(() => import('./pages/police/CaseDetailPage'))
const AnalyticsPage = lazy(() => import('./pages/police/AnalyticsPage'))
const SuspectsPage = lazy(() => import('./pages/police/SuspectsPage'))

const router = createBrowserRouter([
  // ────────────── AUTH ROUTES ──────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/verify-otp', element: <OtpPage /> },
  {
    path: '/onboarding',
    element: (
      <AuthGuard>
        <OnboardingPage />
      </AuthGuard>
    ),
  },

  // ────────────── USER ROUTES ──────────────
  {
    path: '/',
    element: (
      <AuthGuard requiredRole="user">
        <UserLayout />  {/* Navbar + BottomNav wrapper */}
      </AuthGuard>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'sos', element: <SOSPage /> },
      { path: 'report', element: <ReportPage /> },
      { path: 'complaints', element: <MyComplaintsPage /> },
      { path: 'complaints/:id', element: <ComplaintDetailPage /> },
      { path: 'safety-hub', element: <SafetyHubPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'guardians', element: <GuardiansPage /> },
    ],
  },

  // ────────────── POLICE ROUTES ──────────────
  {
    path: '/police',
    element: (
      <AuthGuard requiredRole="officer">
        <PoliceLayout />  {/* Sidebar + top nav wrapper */}
      </AuthGuard>
    ),
    children: [
      { index: true, element: <PoliceDashboard /> },
      { path: 'cases', element: <CaseListPage /> },
      { path: 'cases/:id', element: <CaseDetailPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'suspects', element: <SuspectsPage /> },
    ],
  },

  // ────────────── POLICE AUTH ──────────────
  { path: '/police/login', element: <PoliceLoginPage /> },
])

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
```

---

## 9. State Management Strategy

| State Type | Tool | Examples |
|---|---|---|
| Server / async data | React Query + Supabase | Complaints list, Evidence list, Officer profile |
| Global UI state | Zustand | Current user, active SOS, language |
| Local component state | useState / useReducer | Wizard step, form dirty state |
| URL state | React Router | Filters, pagination, selected case ID |
| Real-time state | Supabase Realtime → Zustand | Live SOS incident list on police dashboard |

### `src/store/sosStore.ts`

```typescript
import { create } from 'zustand'

interface Coordinates {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface SOSStore {
  isActive: boolean
  incidentId: string | null
  currentLocation: Coordinates | null
  locationHistory: Coordinates[]
  triggerType: 'button' | 'silent' | 'voice' | null
  countingDown: boolean
  countdownSeconds: number

  startCountdown: () => void
  cancelCountdown: () => void
  activateSOS: (incidentId: string, triggerType: SOSStore['triggerType']) => void
  updateLocation: (coords: Coordinates) => void
  deactivateSOS: () => void
}

export const useSOSStore = create<SOSStore>((set, get) => ({
  isActive: false,
  incidentId: null,
  currentLocation: null,
  locationHistory: [],
  triggerType: null,
  countingDown: false,
  countdownSeconds: 5,

  startCountdown: () => set({ countingDown: true, countdownSeconds: 5 }),
  cancelCountdown: () => set({ countingDown: false, countdownSeconds: 5 }),

  activateSOS: (incidentId, triggerType) =>
    set({ isActive: true, incidentId, triggerType, countingDown: false }),

  updateLocation: (coords) =>
    set((state) => ({
      currentLocation: coords,
      locationHistory: [...state.locationHistory.slice(-100), coords], // keep last 100 points
    })),

  deactivateSOS: () =>
    set({
      isActive: false,
      incidentId: null,
      currentLocation: null,
      locationHistory: [],
      triggerType: null,
    }),
}))
```

---

## 10. Real-time Subscriptions (Supabase Realtime)

### Police Dashboard — Live SOS Alerts

```typescript
// src/hooks/useRealtime.ts
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

// Police dashboard: receive new SOS incidents in real-time
export function useRealtimeSOS() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('sos-incidents-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',           // new SOS triggered
          schema: 'public',
          table: 'sos_incidents',
        },
        (payload) => {
          // Invalidate the active incidents query → React Query refetches
          queryClient.invalidateQueries({ queryKey: ['sos', 'active'] })
          // Play alert sound
          new Audio('/sounds/alert.mp3').play()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',           // SOS status changed
          schema: 'public',
          table: 'sos_incidents',
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['sos', 'active'] })
          queryClient.invalidateQueries({
            queryKey: ['sos', payload.new.id]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient])
}

// User: receive status updates on their complaint
export function useRealtimeComplaintStatus(complaintId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`complaint-${complaintId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `id=eq.${complaintId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['complaints', complaintId] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [complaintId, queryClient])
}

// Police: real-time location stream during active SOS
export function useRealtimeLocation(incidentId: string, onLocation: (loc: any) => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`location-${incidentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_stream',
          filter: `incident_id=eq.${incidentId}`,
        },
        (payload) => onLocation(payload.new)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [incidentId])
}
```

---

## 11. Pages — User App

### 11.1 `HomePage.tsx` — The Main Screen

Layout: Large SOS button (center), 4 quick action cards (Report, Safety Hub, Track Complaint, Guardians), recent activity feed.

```
┌─────────────────────────┐
│   ShieldHer    🌐  👤   │  ← Navbar
├─────────────────────────┤
│  Hello, Priya 👋        │
│  You are safe           │
│                         │
│   ┌─────────────────┐   │
│   │                 │   │
│   │   🔴 HOLD SOS   │   │  ← SOSButton (holds 3s to trigger)
│   │                 │   │
│   └─────────────────┘   │
│                         │
│  ┌──────┐ ┌──────────┐  │
│  │Report│ │Safety Hub│  │  ← Quick action cards
│  └──────┘ └──────────┘  │
│  ┌──────┐ ┌──────────┐  │
│  │Track │ │Guardians │  │
│  └──────┘ └──────────┘  │
│                         │
│  Recent Activity        │
│  ─────────────────────  │
│  Complaint #1 • Pending │  ← Fetched via React Query
│  Complaint #2 • Resolved│
├─────────────────────────┤
│  🏠    🚨    📋    🛡️   │  ← Bottom nav
└─────────────────────────┘
```

### 11.2 `SOSPage.tsx`

- Full-screen Google Map showing user's current location
- SOSButton as floating overlay
- Live location accuracy indicator
- "Silent SOS" toggle (activates without any visible confirmation)
- Guardian list: shows who will be notified
- ERSS 112 call button as fallback

### 11.3 `ReportPage.tsx`

Entry for the 5-step Report Wizard. Passes initial category selection from HomePage quick taps.

### 11.4 `MyComplaintsPage.tsx`

- List of user's complaints (from Supabase via React Query)
- Filter by status (All / Open / Resolved)
- Sort by date
- Each card shows: category badge, status chip, date, evidence count
- Pull-to-refresh (for mobile PWA)

### 11.5 `ComplaintDetailPage.tsx`

- Complaint details + timeline
- Evidence gallery (thumbnails from Supabase Storage)
- FIR draft viewer (if generated)
- Message thread with assigned officer (Supabase Realtime)
- Status tracker (stepper: Submitted → Assigned → Investigating → Resolved)
- Option to add more evidence

### 11.6 `SafetyHubPage.tsx`

- URL Scanner: paste a link, get phishing score
- Profile Scanner: paste a social URL, get fake profile score
- Awareness articles (3 categories: WhatsApp Scams, Social Media Safety, Financial Fraud)
- Helpline cards: 112, 1930, NCW Helpline, Childline
- Safety Score: personal security checklist

### 11.7 `GuardiansPage.tsx`

- List of up to 5 guardians
- Add/Edit/Delete guardian
- Priority ordering (drag to reorder alert sequence)
- Test alert button: sends a test SMS to the guardian

---

## 12. Pages — Police Dashboard

### 12.1 `PoliceDashboard.tsx`

Two-column layout:
- **Left**: KPI cards (Active SOS today, Open Cases, Resolved This Week, Avg Response Time)
- **Right**: Live Google Map with incident markers + real-time Supabase subscription

### 12.2 `CaseListPage.tsx`

- Full complaint queue with advanced filters:
  - Status, Category, Priority, Assigned Officer, Date Range
- Sortable columns
- Bulk assign to officer
- Export to CSV/PDF

### 12.3 `CaseDetailPage.tsx`

- Full complaint details
- Evidence viewer with chain-of-custody log (who accessed, when)
- SHA-256 hash verification display
- FIR draft editor (AI-generated, editable, finalize button)
- Suggested IPC sections
- Assign to officer dropdown
- Message thread with complainant
- Add internal officer notes

### 12.4 `AnalyticsPage.tsx`

Charts (all using Recharts):
- Incidents over time (last 30/60/90 days) — Line chart
- Incidents by category — Bar chart
- Category distribution — Pie chart
- Response time trend — Area chart
- Top 5 most-reported areas — Table with map
- Officer-wise case closure rate — Bar chart

### 12.5 `SuspectsPage.tsx`

- Search suspect by phone, email, social handle
- Suspect profile: linked complaints count, risk score
- Cross-case pattern view
- Flag for priority investigation

---

## 13. Shared Components Library

### `SOSButton.tsx` — The Most Critical Component

```typescript
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSOS } from '../../hooks/useSOS'
import { useSOSStore } from '../../store/sosStore'

const HOLD_DURATION_MS = 3000  // 3 seconds hold to activate

export function SOSButton() {
  const [holding, setHolding] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdTimer = useRef<ReturnType<typeof setInterval>>()
  const { trigger } = useSOS()
  const { isActive, countingDown } = useSOSStore()

  const startHold = useCallback(() => {
    setHolding(true)
    const startTime = Date.now()
    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / HOLD_DURATION_MS, 1)
      setHoldProgress(progress)
      if (progress >= 1) {
        clearInterval(holdTimer.current)
        trigger('button')
      }
    }, 50)
  }, [trigger])

  const cancelHold = useCallback(() => {
    clearInterval(holdTimer.current)
    setHolding(false)
    setHoldProgress(0)
  }, [])

  if (isActive) return <SOSActiveOverlay />

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing rings — only when not holding */}
      {!holding && (
        <>
          <motion.div
            className="absolute rounded-full bg-red-400 opacity-30"
            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 160, height: 160 }}
          />
          <motion.div
            className="absolute rounded-full bg-red-400 opacity-20"
            animate={{ scale: [1, 2.2], opacity: [0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            style={{ width: 160, height: 160 }}
          />
        </>
      )}

      {/* Main button */}
      <motion.button
        className="relative w-40 h-40 rounded-full bg-red-600 text-white
                   flex flex-col items-center justify-center shadow-2xl
                   select-none touch-none"
        whileTap={{ scale: 0.95 }}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        aria-label="SOS Emergency Button - Hold for 3 seconds to activate"
      >
        {/* Circular progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="80" cy="80" r="74" fill="none" stroke="white"
            strokeWidth="6" strokeOpacity="0.3" />
          <circle cx="80" cy="80" r="74" fill="none" stroke="white"
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 74}`}
            strokeDashoffset={`${2 * Math.PI * 74 * (1 - holdProgress)}`}
            className="transition-all duration-75"
          />
        </svg>

        <span className="text-4xl mb-1">🆘</span>
        <span className="font-bold text-lg">SOS</span>
        <span className="text-xs opacity-80">
          {holding ? 'Hold...' : 'Hold 3s'}
        </span>
      </motion.button>
    </div>
  )
}
```

---

## 14. SOS Module — Deep Dive

### `src/hooks/useSOS.ts`

```typescript
import { useCallback } from 'react'
import { useSOSStore } from '../store/sosStore'
import { useGeolocation } from './useGeolocation'
import api from '../lib/axios'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export function useSOS() {
  const { activateSOS, deactivateSOS, updateLocation } = useSOSStore()
  const { getCurrentPosition, watchPosition, clearWatch } = useGeolocation()

  const trigger = useCallback(async (
    triggerType: 'button' | 'silent' | 'voice'
  ) => {
    try {
      // 1. Get current GPS position
      const coords = await getCurrentPosition()

      // 2. Call backend API (orchestrates ERSS + Twilio + Notifications)
      const { data } = await api.post('/sos/trigger', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        trigger_type: triggerType,
      })

      // 3. Update local store
      activateSOS(data.incident_id, triggerType)

      // 4. Start streaming location to Supabase every 10 seconds
      const watchId = watchPosition(async (newCoords) => {
        updateLocation(newCoords)

        // Insert into Supabase location_stream table
        await supabase.from('location_stream').insert({
          incident_id: data.incident_id,
          latitude: newCoords.latitude,
          longitude: newCoords.longitude,
          accuracy: newCoords.accuracy,
        })
      }, 10000)

      if (triggerType !== 'silent') {
        toast.error('🆘 SOS Activated! Police and guardians have been notified.', {
          duration: 10000,
        })
      }

      return { incidentId: data.incident_id, watchId }

    } catch (error) {
      toast.error('SOS failed. Calling 112 directly...')
      // Fallback: open phone dialer
      window.location.href = 'tel:112'
    }
  }, [])

  const resolve = useCallback(async (incidentId: string) => {
    await api.put(`/sos/${incidentId}/resolve`)
    deactivateSOS()
    clearWatch()
  }, [])

  return { trigger, resolve }
}
```

### `src/hooks/useSilentSOS.ts`

Detects secret keyboard shortcut (Ctrl+Shift+S on desktop) for silent SOS:

```typescript
import { useEffect } from 'react'
import { useSOS } from './useSOS'

export function useSilentSOS() {
  const { trigger } = useSOS()

  useEffect(() => {
    const COMBO = new Set(['Control', 'Shift', 's'])
    const pressed = new Set<string>()

    const onKeyDown = (e: KeyboardEvent) => {
      pressed.add(e.key)
      if (COMBO.every(k => pressed.has(k))) {
        e.preventDefault()
        trigger('silent')
      }
    }

    const onKeyUp = (e: KeyboardEvent) => pressed.delete(e.key)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [trigger])
}
```

### `src/hooks/useVoiceSOS.ts`

Uses Web Speech API for keyword detection:

```typescript
import { useEffect, useRef } from 'react'
import { useSOS } from './useSOS'

const TRIGGER_KEYWORDS = ['help me', 'bachao', 'madad karo']

export function useVoiceSOS(enabled: boolean) {
  const { trigger } = useSOS()
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if (!enabled || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) return

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognitionRef.current = recognition

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'hi-IN'  // Hindi by default, fallback to en-IN

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript.toLowerCase())
        .join(' ')

      if (TRIGGER_KEYWORDS.some(kw => transcript.includes(kw))) {
        trigger('voice')
        recognition.stop()
      }
    }

    recognition.onend = () => {
      if (enabled) recognition.start()  // restart continuously
    }

    recognition.start()
    return () => recognition.stop()
  }, [enabled])
}
```

---

## 15. Cybercrime Report Wizard

5-step form with React Hook Form + Zod. State persists across steps in a single `useForm` instance.

### Schema (`src/services/complaint.service.ts`)

```typescript
import { z } from 'zod'

export const complaintSchema = z.object({
  // Step 1
  category: z.enum([
    'cyberstalking', 'harassment', 'blackmail', 'identity_theft',
    'deepfake', 'financial_fraud', 'phishing', 'account_hacking', 'other'
  ]),

  // Step 2
  description: z.string().min(50, 'Please describe in at least 50 characters')
                         .max(5000),
  incident_date: z.date().max(new Date(), 'Date cannot be in the future'),

  // Step 3 — evidence file IDs (uploaded to Supabase Storage first)
  evidence_file_ids: z.array(z.string().uuid()).optional(),

  // Step 4
  suspect_platform: z.string().optional(),
  suspect_username: z.string().optional(),
  suspect_phone: z.string().optional(),
  suspect_email: z.string().email().optional().or(z.literal('')),
  suspect_url: z.string().url().optional().or(z.literal('')),

  // Step 5 — consent
  consent_evidence_sharing: z.boolean().refine(v => v === true, {
    message: 'You must consent to share evidence with the Cyber Crime Branch'
  }),
  want_fir: z.boolean().default(false),
})

export type ComplaintFormData = z.infer<typeof complaintSchema>
```

### Wizard Steps

**Step 1 — Category**: Grid of 9 crime type cards with icons, selects one.

**Step 2 — Description**: Textarea with character counter, date picker, AI-assist button ("Let AI help me describe this" — calls Claude API with brief notes → expanded formal description).

**Step 3 — Evidence Upload**: Dropzone + file list with SHA-256 hash display per file. Each file uploads to Supabase Storage immediately (not on final submit) → returns file ID for reference.

**Step 4 — Suspect Details**: Optional fields for suspect identification. URL field triggers auto-scan (phishing/fake profile score shown inline).

**Step 5 — Review**: Summary of all entered data, consent checkbox, "Submit Complaint" → FIR draft option.

---

## 16. Evidence Upload (Supabase Storage)

### `src/hooks/useFileUpload.ts`

```typescript
import { useState, useCallback } from 'react'
import CryptoJS from 'crypto-js'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

interface UploadedFile {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  sha256Hash: string
  storagePath: string
  publicUrl: string
  uploadedAt: string
}

export function useFileUpload(complaintId?: string) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const { user } = useAuthStore()

  const uploadFile = useCallback(async (file: File): Promise<UploadedFile> => {
    setUploading(true)
    setProgress(0)

    try {
      // 1. Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      setProgress(10)

      // 2. Compute SHA-256 hash for tamper detection
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any)
      const sha256Hash = CryptoJS.SHA256(wordArray).toString()
      setProgress(20)

      // 3. Build storage path: evidence/{userId}/{complaintId}/{timestamp}_{filename}
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `evidence/${user!.id}/${complaintId ?? 'temp'}/${timestamp}_${safeName}`

      // 4. Upload to Supabase Storage (evidence bucket — private, RLS protected)
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) throw uploadError
      setProgress(70)

      // 5. Get signed URL (valid for 1 hour — evidence should never be publicly accessible)
      const { data: signedUrlData } = await supabase.storage
        .from('evidence')
        .createSignedUrl(storagePath, 3600)

      setProgress(85)

      // 6. Insert evidence metadata into Supabase DB
      const { data: evidenceRecord, error: dbError } = await supabase
        .from('evidence_files')
        .insert({
          complaint_id: complaintId,
          user_id: user!.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          sha256_hash: sha256Hash,
          storage_path: storagePath,
        })
        .select()
        .single()

      if (dbError) throw dbError
      setProgress(100)

      const uploadedFile: UploadedFile = {
        id: evidenceRecord.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        sha256Hash,
        storagePath,
        publicUrl: signedUrlData?.signedUrl ?? '',
        uploadedAt: evidenceRecord.created_at,
      }

      setUploadedFiles(prev => [...prev, uploadedFile])
      return uploadedFile

    } finally {
      setUploading(false)
    }
  }, [user, complaintId])

  return { uploadFile, uploading, progress, uploadedFiles }
}
```

---

## 17. Google Maps Integration

### `src/components/map/LiveIncidentMap.tsx`

```typescript
import { GoogleMap, Marker, InfoWindow, useLoadScript, HeatmapLayer } from '@react-google-maps/api'

const LIBRARIES: ('visualization' | 'places')[] = ['visualization', 'places']

const MARKER_ICONS = {
  active: { url: '/icons/sos-active.svg', scaledSize: new google.maps.Size(40, 40) },
  responding: { url: '/icons/sos-responding.svg', scaledSize: new google.maps.Size(40, 40) },
  resolved: { url: '/icons/sos-resolved.svg', scaledSize: new google.maps.Size(30, 30) },
}

export function LiveIncidentMap({ incidents, heatmapEnabled }: Props) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  // Ahmedabad center
  const defaultCenter = { lat: 23.0225, lng: 72.5714 }

  if (!isLoaded) return <MapSkeleton />

  return (
    <GoogleMap
      zoom={12}
      center={defaultCenter}
      mapContainerClassName="w-full h-full rounded-lg"
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        styles: DARK_MAP_STYLE,  // custom dark theme for police dashboard
      }}
    >
      {/* Incident markers */}
      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={{ lat: incident.latitude, lng: incident.longitude }}
          icon={MARKER_ICONS[incident.status as keyof typeof MARKER_ICONS]}
          onClick={() => setSelectedIncident(incident)}
          animation={incident.status === 'active'
            ? google.maps.Animation.BOUNCE : undefined}
        />
      ))}

      {/* Popup on marker click */}
      {selectedIncident && (
        <InfoWindow
          position={{ lat: selectedIncident.latitude, lng: selectedIncident.longitude }}
          onCloseClick={() => setSelectedIncident(null)}
        >
          <IncidentPopup incident={selectedIncident} />
        </InfoWindow>
      )}

      {/* Heatmap overlay */}
      {heatmapEnabled && (
        <HeatmapLayer
          data={incidents.map(i => new google.maps.LatLng(i.latitude, i.longitude))}
          options={{ radius: 30, opacity: 0.6 }}
        />
      )}
    </GoogleMap>
  )
}
```

---

## 18. Internationalization (i18n)

### `src/i18n/i18n.ts`

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpApi from 'i18next-http-backend'

i18n
  .use(HttpApi)                // load translations from /public/locales/
  .use(LanguageDetector)       // auto-detect browser language
  .use(initReactI18next)
  .init({
    supportedLngs: ['en', 'hi', 'gu'],
    fallbackLng: 'en',
    defaultNS: 'translation',
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
```

### `public/locales/en/translation.json` (Sample)

```json
{
  "common": {
    "app_name": "ShieldHer",
    "loading": "Loading...",
    "error": "Something went wrong",
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save"
  },
  "sos": {
    "button_label": "Hold for SOS",
    "holding": "Hold...",
    "activated": "SOS Activated! Police notified.",
    "cancelled": "SOS Cancelled",
    "active_title": "Emergency Active",
    "active_subtitle": "Your location is being shared with police"
  },
  "complaint": {
    "report_title": "Report a Crime",
    "categories": {
      "cyberstalking": "Cyberstalking",
      "harassment": "Online Harassment",
      "blackmail": "Blackmail / Sextortion",
      "deepfake": "Deepfake Misuse",
      "financial_fraud": "Financial Fraud",
      "phishing": "Phishing / Scam Link",
      "identity_theft": "Identity Theft",
      "account_hacking": "Account Hacking",
      "other": "Other"
    }
  },
  "helplines": {
    "emergency": "Emergency: 112",
    "cybercrime": "Cyber Helpline: 1930",
    "women_helpline": "Women Helpline: 181"
  }
}
```

---

## 19. Form Handling & Validation

### Pattern Used Across All Forms

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
})

export function GuardianForm({ onSubmit }: Props) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Guardian's name" {...field} />
              </FormControl>
              <FormMessage />  {/* Shows Zod error messages */}
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save Guardian'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 20. API Layer & React Query

### Pattern for Supabase Queries

```typescript
// src/services/complaint.service.ts
import { supabase } from '../lib/supabase'

export const complaintService = {
  // Fetch user's own complaints (RLS auto-filters by user)
  getMyComplaints: async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        id, category, status, priority, created_at,
        evidence_files(count),
        officers(full_name, badge_number)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Police: get all complaints with filters
  getAllComplaints: async (filters: ComplaintFilters) => {
    let query = supabase
      .from('complaints')
      .select('*, users(phone, full_name), officers(full_name)')

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.priority) query = query.eq('priority', filters.priority)
    if (filters.from) query = query.gte('created_at', filters.from)
    if (filters.to) query = query.lte('created_at', filters.to)

    const { data, error } = await query
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
      .range(filters.offset, filters.offset + filters.limit - 1)

    if (error) throw error
    return data
  },
}
```

### React Query Hooks

```typescript
// src/hooks/useSupabaseQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { complaintService } from '../services/complaint.service'

export function useMyComplaints() {
  return useQuery({
    queryKey: ['complaints', 'mine'],
    queryFn: complaintService.getMyComplaints,
    staleTime: 30_000,          // consider fresh for 30s
    refetchOnWindowFocus: true,
  })
}

export function useSubmitComplaint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: complaintService.submit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints', 'mine'] })
    },
  })
}
```

---

## 21. Error Handling & Notifications

### Global Error Boundary

```typescript
// src/components/shared/ErrorBoundary.tsx
import { Component } from 'react'

export class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught error:', error, info)
    // Send to error tracking service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground mt-2">Please refresh the page</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

### Toast Setup in `main.tsx`

```typescript
import { Toaster } from 'sonner'

// In root render:
<Toaster
  position="top-center"
  richColors
  closeButton
  toastOptions={{
    duration: 5000,
    classNames: {
      error: 'border-red-500',
      success: 'border-green-500',
    },
  }}
/>
```

---

## 22. UI Design System

### Color Palette (Tailwind + CSS variables)

```css
/* src/index.css */
:root {
  --sos-red: 0 84% 60%;           /* hsl for SOS button */
  --sos-red-dark: 0 72% 51%;
  --safe-green: 142 76% 36%;
  --warning-amber: 38 92% 50%;
  --police-blue: 221 83% 53%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;  /* Police dashboard dark mode */
  --foreground: 210 40% 98%;
}
```

### Typography Scale

```
Heading 1: text-3xl font-bold          (page titles)
Heading 2: text-2xl font-semibold      (section headers)
Heading 3: text-xl font-semibold       (card titles)
Body:       text-base                  (regular text)
Small:      text-sm text-muted-foreground
Micro:      text-xs                    (badges, timestamps)
```

---

## 23. Performance Optimizations

- **Code splitting**: All pages are `lazy()` imported — only load when navigated to
- **React Query caching**: Prevents refetching same data multiple times
- **Supabase query optimization**: Use `.select('specific,columns')` — never `select('*')` in production
- **Image optimization**: Evidence thumbnails use Supabase Storage transform API for resizing
- **Virtualization**: Police case list uses `@tanstack/react-virtual` for 1000+ rows
- **Memoization**: Map markers memoized with `useMemo` to prevent Google Maps re-renders
- **Font loading**: Google Fonts preconnect + display=swap

---

## 24. Build, Linting & Deployment

### Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write src/**/*.{ts,tsx}",
    "type-check": "tsc --noEmit",
    "supabase:gen-types": "npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/supabase.ts"
  }
}
```

### Production Build

```bash
npm run build
# Output: dist/ folder
# Deploy to: Vercel / Netlify / Nginx static server
```

### Vercel Deployment (Recommended)

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

*ShieldHer Frontend v1.0 | Built with React 18 + Supabase + Tailwind*
