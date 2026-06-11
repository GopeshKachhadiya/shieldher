# 🗺️ ShieldHer — Integrations, Maps & Red Zone Alert System
### Complete Technical Reference | Google Maps + 112 + Geofencing + Bonus Features

---

## Table of Contents

1. [All Integrations — Architecture Overview](#1-all-integrations--architecture-overview)
2. [Google Maps — Complete Integration](#2-google-maps--complete-integration)
3. [Direct 112 Emergency Call System](#3-direct-112-emergency-call-system)
4. [🔴 Red Hotspot Zone Alert System](#4--red-hotspot-zone-alert-system) ← Core New Feature
5. [Dummy Danger Zone Data — Ahmedabad](#5-dummy-danger-zone-data--ahmedabad)
6. [Geofencing Algorithm — Deep Dive](#6-geofencing-algorithm--deep-dive)
7. [Zone Entry / Exit Notification Pipeline](#7-zone-entry--exit-notification-pipeline)
8. [Zone Visit Database — Schema & Queries](#8-zone-visit-database--schema--queries)
9. [Zone Alert — Frontend Implementation](#9-zone-alert--frontend-implementation)
10. [Zone Alert — Backend Service](#10-zone-alert--backend-service)
11. [Voice-Activated SOS System](#11-voice-activated-sos-system)
12. [Offline / SMS Alert System](#12-offline--sms-alert-system)
13. [Multilingual Support (EN / HI / GU)](#13-multilingual-support-en--hi--gu)
14. [AI Unsafe Zone Prediction Engine](#14-ai-unsafe-zone-prediction-engine)
15. [Full Integration Connection Map](#15-full-integration-connection-map)
16. [Complete Tech Stack Per Feature](#16-complete-tech-stack-per-feature)

---

## 1. All Integrations — Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         SHIELDHER — ALL INTEGRATIONS                             │
│                                                                                  │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────────────┐  │
│  │  USER APP   │    │                   BACKEND LAYER                         │  │
│  │  (React.js) │    │                                                         │  │
│  │             │    │  ┌──────────────┐   ┌──────────────┐  ┌─────────────┐  │  │
│  │  ↕ Maps     │◄──►│  │  Node.js API │   │ Supabase DB  │  │ Python AI   │  │  │
│  │  ↕ Location │    │  │  :3000       │   │ (PostgreSQL) │  │ Service     │  │  │
│  │  ↕ Realtime │    │  └──────┬───────┘   └──────┬───────┘  └─────┬───────┘  │  │
│  │  ↕ SOS      │    │         │                   │                │          │  │
│  └─────────────┘    │  ┌──────▼───────────────────▼────────────────▼───────┐  │  │
│                     │  │              SERVICE INTEGRATIONS                  │  │  │
│                     │  │                                                    │  │  │
│                     │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │  │  │
│                     │  │  │ Google     │  │  Twilio    │  │  ERSS 112  │  │  │  │
│                     │  │  │ Maps API   │  │  SMS/Voice │  │  (ERSS.in) │  │  │  │
│                     │  │  └────────────┘  └────────────┘  └────────────┘  │  │  │
│                     │  │                                                    │  │  │
│                     │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  │  │  │
│                     │  │  │ Firebase   │  │  Claude    │  │  Web Speech│  │  │  │
│                     │  │  │ FCM Push   │  │  API (AI)  │  │  API (SOS) │  │  │  │
│                     │  │  └────────────┘  └────────────┘  └────────────┘  │  │  │
│                     │  │                                                    │  │  │
│                     │  │  ┌────────────┐  ┌────────────────────────────┐  │  │  │
│                     │  │  │  Supabase  │  │ Geofencing (Zone Alerts)   │  │  │  │
│                     │  │  │  Realtime  │  │ (Haversine + PostGIS)      │  │  │  │
│                     │  │  └────────────┘  └────────────────────────────┘  │  │  │
│                     │  └────────────────────────────────────────────────────┘  │  │
│                     └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Integration Summary Table

| Integration | Purpose | Type | Tech |
|---|---|---|---|
| Google Maps JS API | Live map, incident markers, routing | Frontend SDK | `@react-google-maps/api` |
| Google Geocoding API | Lat/Lng → human address | Backend REST | Axios |
| Google Places API | Nearby police stations | Frontend SDK | Google Maps JS |
| ERSS 112 API | Emergency dispatch notification | Backend REST | Axios (simulated) |
| Direct 112 Call | One-tap phone call | Frontend | `tel:` protocol |
| Twilio SMS | Guardian alerts, offline SOS | Backend SDK | `twilio` npm |
| Twilio Voice | Auto voice call on SOS | Backend SDK | `twilio` npm |
| Firebase FCM | Push notifications | Frontend+Backend | `firebase-admin` |
| Supabase Realtime | Live police dashboard | Frontend WS | `@supabase/supabase-js` |
| Claude API | FIR drafting, AI analysis | Backend SDK | `@anthropic-ai/sdk` |
| Web Speech API | Voice-triggered SOS | Frontend | Browser native |
| Geofencing Engine | Red zone entry/exit detection | Backend | Haversine + PostGIS |
| i18next | Multilingual EN/HI/GU | Frontend | `i18next` |

---

## 2. Google Maps — Complete Integration

### 2.1 APIs to Enable (Google Cloud Console)

Go to: `console.cloud.google.com` → APIs & Services → Enable APIs

```
✅ Maps JavaScript API          → renders the map in browser
✅ Geocoding API                → address ↔ coordinates conversion
✅ Places API                   → search nearby police stations
✅ Directions API               → route from user to safe location
✅ Maps Static API              → static map image for SMS alerts
✅ Distance Matrix API          → ETA calculation for police response
✅ Geolocation API (optional)   → IP-based fallback when GPS unavailable
```

### 2.2 API Key Security

```
In Google Cloud Console:
1. Create separate keys for Frontend and Backend
2. Frontend key → Restrict to HTTP referrers: shieldher.in/*, localhost:5173
3. Backend key  → Restrict to server IP addresses only
4. Both keys    → Restrict to only the APIs they need
```

### 2.3 Frontend — Google Maps Setup

#### Install

```bash
npm install @react-google-maps/api
npm install -D @types/google.maps
```

#### `src/lib/googleMaps.ts`

```typescript
// Single source of truth for Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  // Load these extra libraries on startup
  libraries: ['visualization', 'places', 'geometry'] as (
    'visualization' | 'places' | 'geometry'
  )[],
}

// Ahmedabad city center — default map starting point
export const AHMEDABAD_CENTER = { lat: 23.0225, lng: 72.5714 }
export const AHMEDABAD_BOUNDS = {
  north: 23.1200, south: 22.9200, east: 72.7000, west: 72.4500,
}

// Map zoom levels
export const ZOOM = {
  CITY:     11,  // see all of Ahmedabad
  DISTRICT: 13,  // see a neighborhood
  STREET:   16,  // see individual streets
  BUILDING: 18,  // see individual buildings
}

// Custom dark map theme for Police Dashboard
export const POLICE_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
]

// Safe zone map style (for user app — lighter, friendlier)
export const USER_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
]
```

### 2.4 Live Location Map — Component

#### `src/components/map/LiveIncidentMap.tsx`

```typescript
import {
  GoogleMap, Marker, InfoWindow, Circle,
  HeatmapLayer, useLoadScript, TrafficLayer
} from '@react-google-maps/api'
import { GOOGLE_MAPS_CONFIG, AHMEDABAD_CENTER, POLICE_MAP_STYLE, ZOOM } from '../../lib/googleMaps'

// Custom SVG marker icons
const INCIDENT_MARKERS = {
  sos_active:    { url: '/markers/sos-active.svg',    scaledSize: { width: 48, height: 48 } },
  sos_responded: { url: '/markers/sos-responded.svg', scaledSize: { width: 40, height: 40 } },
  sos_resolved:  { url: '/markers/sos-resolved.svg',  scaledSize: { width: 32, height: 32 } },
  danger_zone:   { url: '/markers/danger-zone.svg',   scaledSize: { width: 36, height: 36 } },
  police_station:{ url: '/markers/police-station.svg',scaledSize: { width: 36, height: 36 } },
  user_live:     { url: '/markers/user-live.svg',     scaledSize: { width: 44, height: 44 } },
}

interface Props {
  incidents: SOSIncident[]
  dangerZones: DangerZone[]
  showHeatmap: boolean
  showTraffic: boolean
  liveUserLocation?: { lat: number; lng: number }
}

export function LiveIncidentMap({
  incidents, dangerZones, showHeatmap, showTraffic, liveUserLocation
}: Props) {
  const { isLoaded, loadError } = useLoadScript(GOOGLE_MAPS_CONFIG)
  const [selectedIncident, setSelectedIncident] = useState<SOSIncident | null>(null)
  const [selectedZone, setSelectedZone] = useState<DangerZone | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  // Auto-pan to new active SOS
  useEffect(() => {
    const activeIncident = incidents.find(i => i.status === 'active')
    if (activeIncident && mapRef.current) {
      mapRef.current.panTo({ lat: activeIncident.latitude, lng: activeIncident.longitude })
      mapRef.current.setZoom(ZOOM.STREET)
    }
  }, [incidents])

  if (loadError) return <MapError />
  if (!isLoaded) return <MapSkeleton />

  return (
    <GoogleMap
      zoom={ZOOM.CITY}
      center={AHMEDABAD_CENTER}
      mapContainerClassName="w-full h-full"
      options={{
        styles: POLICE_MAP_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        // Restrict pan to Ahmedabad area
        restriction: {
          latLngBounds: AHMEDABAD_BOUNDS,
          strictBounds: false,
        },
      }}
      onLoad={(map) => { mapRef.current = map }}
    >
      {/* ── Traffic layer (optional) ── */}
      {showTraffic && <TrafficLayer />}

      {/* ── Heatmap layer (past 90 days incidents) ── */}
      {showHeatmap && (
        <HeatmapLayer
          data={incidents.map(i =>
            new google.maps.LatLng(i.latitude, i.longitude)
          )}
          options={{
            radius: 30,
            opacity: 0.7,
            gradient: [
              'rgba(0, 255, 0, 0)',
              'rgba(0, 255, 0, 1)',
              'rgba(255, 255, 0, 1)',
              'rgba(255, 128, 0, 1)',
              'rgba(255, 0, 0, 1)',
            ],
          }}
        />
      )}

      {/* ── Danger Zone Circles ── */}
      {dangerZones.map(zone => (
        <React.Fragment key={zone.id}>
          <Circle
            center={{ lat: zone.center_lat, lng: zone.center_lng }}
            radius={zone.radius_meters}
            options={{
              strokeColor: getRiskColor(zone.risk_level),
              strokeOpacity: 0.9,
              strokeWeight: 2,
              fillColor: getRiskColor(zone.risk_level),
              fillOpacity: 0.2,
              clickable: true,
              zIndex: 1,
            }}
            onClick={() => setSelectedZone(zone)}
          />
          <Marker
            position={{ lat: zone.center_lat, lng: zone.center_lng }}
            icon={INCIDENT_MARKERS.danger_zone}
            title={zone.name}
            onClick={() => setSelectedZone(zone)}
          />
        </React.Fragment>
      ))}

      {/* ── SOS Incident Markers ── */}
      {incidents.map(incident => (
        <Marker
          key={incident.id}
          position={{ lat: incident.latitude, lng: incident.longitude }}
          icon={INCIDENT_MARKERS[`sos_${incident.status}` as keyof typeof INCIDENT_MARKERS]
                ?? INCIDENT_MARKERS.sos_active}
          animation={incident.status === 'active'
            ? google.maps.Animation.BOUNCE : undefined}
          onClick={() => setSelectedIncident(incident)}
          zIndex={incident.status === 'active' ? 10 : 5}
        />
      ))}

      {/* ── Live User Location (during active SOS) ── */}
      {liveUserLocation && (
        <Marker
          position={liveUserLocation}
          icon={INCIDENT_MARKERS.user_live}
          zIndex={20}
          title="User live location"
        />
      )}

      {/* ── Incident Popup ── */}
      {selectedIncident && (
        <InfoWindow
          position={{ lat: selectedIncident.latitude, lng: selectedIncident.longitude }}
          onCloseClick={() => setSelectedIncident(null)}
        >
          <IncidentInfoCard incident={selectedIncident} />
        </InfoWindow>
      )}

      {/* ── Danger Zone Popup ── */}
      {selectedZone && (
        <InfoWindow
          position={{ lat: selectedZone.center_lat, lng: selectedZone.center_lng }}
          onCloseClick={() => setSelectedZone(null)}
        >
          <ZoneInfoCard zone={selectedZone} />
        </InfoWindow>
      )}
    </GoogleMap>
  )
}

function getRiskColor(level: number): string {
  const colors = { 1: '#22c55e', 2: '#84cc16', 3: '#f59e0b', 4: '#ef4444', 5: '#7f1d1d' }
  return colors[level as keyof typeof colors] ?? '#ef4444'
}
```

### 2.5 Reverse Geocoding (Backend)

#### `shieldher-api/src/utils/geoUtils.ts`

```typescript
import axios from 'axios'

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const { data } = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${lat},${lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY,
          language: 'en',
          result_type: 'street_address|sublocality|locality',
        },
        timeout: 5000,
      }
    )

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address
    }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    // Fallback: return raw coordinates
    return `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`
  }
}

// Calculate distance between two coordinates (Haversine formula)
export function haversineDistance(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371000  // Earth radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Find all danger zones a point is inside
export function getZonesContainingPoint(
  lat: number,
  lng: number,
  zones: DangerZone[]
): DangerZone[] {
  return zones.filter(zone => {
    const distance = haversineDistance(lat, lng, zone.center_lat, zone.center_lng)
    return distance <= zone.radius_meters
  })
}
```

### 2.6 Nearby Police Stations (Places API)

```typescript
// src/services/places.service.ts
export async function getNearbyPoliceStations(
  lat: number, lng: number, radiusMeters = 5000
): Promise<PoliceStation[]> {
  const service = new google.maps.places.PlacesService(document.createElement('div'))

  return new Promise((resolve, reject) => {
    service.nearbySearch(
      {
        location: { lat, lng },
        radius: radiusMeters,
        keyword: 'police station',
        type: 'police',
      },
      (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          resolve([])
          return
        }
        resolve(
          results.map(r => ({
            placeId: r.place_id ?? '',
            name: r.name ?? '',
            lat: r.geometry?.location?.lat() ?? 0,
            lng: r.geometry?.location?.lng() ?? 0,
            vicinity: r.vicinity ?? '',
            rating: r.rating,
          }))
        )
      }
    )
  })
}
```

### 2.7 Route to Nearest Safe Location

```typescript
// Display route from current location to nearest police station
export function showRouteToSafety(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  map: google.maps.Map
) {
  const directionsService = new google.maps.DirectionsService()
  const directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    polylineOptions: {
      strokeColor: '#22c55e',   // green route line
      strokeWeight: 5,
      strokeOpacity: 0.8,
    },
    suppressMarkers: true,
  })

  directionsService.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode.WALKING,
    provideRouteAlternatives: false,
  }, (result, status) => {
    if (status === 'OK' && result) {
      directionsRenderer.setDirections(result)
    }
  })
}
```

---

## 3. Direct 112 Emergency Call System

### 3.1 Overview & Fallback Chain

```
SOS Triggered
      │
      ├── Step 1: Node.js API → POST to ERSS 112 API  (primary — digital dispatch)
      │                ↓ if API fails (timeout / unreachable)
      ├── Step 2: Twilio Voice Call to 112 alternate number
      │                ↓ if voice also fails
      ├── Step 3: Direct browser tel: link → user's phone calls 112
      │                ↓ always runs simultaneously
      └── Step 4: Twilio SMS to guardians + police control room number
```

### 3.2 One-Tap 112 Call Button (Frontend)

#### `src/components/sos/EmergencyCallButton.tsx`

```typescript
import { Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function EmergencyCallButton() {
  const { t } = useTranslation()
  const [calling, setCalling] = useState(false)

  const handleCall112 = () => {
    setCalling(true)
    // Log the call attempt in Supabase
    supabase.from('audit_log').insert({
      entity_type: 'emergency_call',
      entity_id: crypto.randomUUID(),
      action: 'call_112_initiated',
      actor_type: 'user',
      metadata: { timestamp: new Date().toISOString() },
    })
    // Native phone call — works on mobile and triggers calling app on desktop
    window.location.href = 'tel:112'
    setTimeout(() => setCalling(false), 3000)
  }

  return (
    <button
      onClick={handleCall112}
      className="flex items-center gap-3 w-full p-4 rounded-2xl
                 bg-red-600 hover:bg-red-700 active:scale-95
                 text-white font-bold text-xl transition-all
                 shadow-lg shadow-red-600/30 border-2 border-red-400"
      aria-label="Call 112 directly"
    >
      <div className="p-2 rounded-full bg-white/20">
        <Phone className="w-7 h-7" />
      </div>
      <div className="text-left">
        <div className="text-xl font-black">112</div>
        <div className="text-xs font-normal opacity-80">
          {t('sos.call_112_direct')}
        </div>
      </div>
      {calling && (
        <div className="ml-auto animate-pulse text-sm">Calling...</div>
      )}
    </button>
  )
}

// Alternative helpline numbers shown in Safety Hub
export const HELPLINES = [
  { number: '112',  label: 'Police Emergency',       icon: '🚔', color: 'red' },
  { number: '1930', label: 'Cyber Crime Helpline',   icon: '💻', color: 'blue' },
  { number: '181',  label: 'Women Helpline',         icon: '👩', color: 'purple' },
  { number: '1091', label: 'Women in Distress',      icon: '🆘', color: 'orange' },
  { number: '100',  label: 'Police Control Room',    icon: '🚨', color: 'red' },
  { number: '1800-233-1091', label: 'NCW Helpline',  icon: '⚖️', color: 'teal' },
]
```

### 3.3 ERSS 112 API Integration (Simulated)

#### `shieldher-api/src/integrations/erss.integration.ts`

```typescript
import axios from 'axios'
import { logger } from '../utils/logger'

interface ERSSPayload {
  incident_id: string
  latitude: number
  longitude: number
  user_phone: string
  user_name: string
  incident_type: 'women_safety' | 'cyber_crime'
  address?: string
  platform_ref: string
}

interface ERSSResponse {
  success: boolean
  ticket_id: string
  estimated_response_time_minutes: number
  assigned_unit?: string
  error?: string
}

export const erssIntegration = {
  async notify(payload: ERSSPayload): Promise<ERSSResponse> {
    const requestBody = {
      // ERSS 112 Gujarat API schema (refer to ERSS technical spec)
      servicetype: 'women_safety',
      caller_number: payload.user_phone,
      caller_name: payload.user_name,
      latitude: payload.latitude,
      longitude: payload.longitude,
      address: payload.address ?? '',
      incident_details: `ShieldHer SOS alert. Platform Incident ID: ${payload.incident_id}`,
      source: 'ShieldHer_App',
      source_ref_id: payload.incident_id,
      priority: 'HIGH',
    }

    try {
      const { data } = await axios.post<ERSSResponse>(
        `${process.env.ERSS_API_URL}/dispatch`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.ERSS_API_KEY!,
            'X-Platform': 'ShieldHer',
          },
          timeout: 8000,  // 8 second timeout — ERSS must be fast
        }
      )

      logger.info('ERSS notified successfully', {
        ticket_id: data.ticket_id,
        incident_id: payload.incident_id,
        eta: data.estimated_response_time_minutes,
      })

      return data

    } catch (err: any) {
      logger.error('ERSS notification failed — falling back to Twilio', {
        error: err.message,
        incident_id: payload.incident_id,
      })

      // Fallback: SMS the police control room number directly
      await twilioService.sendSMS(
        process.env.POLICE_CONTROL_ROOM_PHONE!,
        `🚨 SHIELDHER EMERGENCY ALERT\nUser: ${payload.user_name} | Phone: ${payload.user_phone}\nLocation: ${payload.address}\nCoords: ${payload.latitude}, ${payload.longitude}\nRef: ${payload.incident_id}\nTime: ${new Date().toLocaleString('en-IN')}`
      )

      return {
        success: false,
        ticket_id: `FALLBACK_${Date.now()}`,
        estimated_response_time_minutes: -1,
        error: 'ERSS API unreachable — SMS fallback sent',
      }
    }
  },

  // Static map image URL (for SMS) — shows user's location as red pin
  getStaticMapUrl(lat: number, lng: number): string {
    const params = new URLSearchParams({
      center: `${lat},${lng}`,
      zoom: '15',
      size: '600x400',
      maptype: 'roadmap',
      markers: `color:red|label:S|${lat},${lng}`,
      key: process.env.GOOGLE_MAPS_API_KEY!,
    })
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
  },
}
```

### 3.4 Auto-call Trigger on SOS

```typescript
// In sos.service.ts — when SOS is triggered
async function triggerAllChannels(incident: SOSIncident, user: User) {
  await Promise.allSettled([

    // Channel 1: ERSS API (digital dispatch)
    erssIntegration.notify({
      incident_id: incident.id,
      latitude: incident.latitude,
      longitude: incident.longitude,
      user_phone: user.phone,
      user_name: user.full_name,
      address: incident.address,
      platform_ref: incident.id,
    }),

    // Channel 2: Twilio voice call to guardians (if SOS not acknowledged in 2 min)
    scheduleVoiceCallFallback(incident.id, user, 120_000),

    // Channel 3: FCM push to guardians' phones
    fcmService.sendToGuardians(user.id, {
      title: '🚨 EMERGENCY ALERT',
      body: `${user.full_name} needs help! Location: ${incident.address}`,
      data: { incidentId: incident.id, lat: incident.latitude, lng: incident.longitude },
    }),

    // Channel 4: SMS to guardians
    fetch(`${process.env.SUPABASE_URL}/functions/v1/notify-guardians`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ incident_id: incident.id, user_id: user.id }),
    }),
  ])
}

async function scheduleVoiceCallFallback(
  incidentId: string, user: User, delayMs: number
) {
  setTimeout(async () => {
    // Check if ERSS already acknowledged
    const { data: incident } = await supabaseAdmin
      .from('sos_incidents')
      .select('status, erss_ref_id')
      .eq('id', incidentId)
      .single()

    if (incident?.status === 'active' && !incident.erss_ref_id) {
      // Still not acknowledged — escalate with voice call
      const { data: guardians } = await supabaseAdmin
        .from('guardians')
        .select('phone, name')
        .eq('user_id', user.id)
        .order('priority', { ascending: true })
        .limit(2)  // call top 2 guardians

      for (const guardian of (guardians ?? [])) {
        await twilioService.sendSOSVoiceCall(
          guardian.phone,
          user.full_name,
          `https://maps.google.com/?q=${incident.latitude},${incident.longitude}`
        )
      }
    }
  }, delayMs)
}
```

---

## 4. 🔴 Red Hotspot Zone Alert System

### 4.1 What This System Does

The Red Hotspot Zone Alert System automatically monitors every woman's location as they move through the city. When they enter a predefined danger zone (a "red zone"), the system:

1. **Instantly sends an in-app notification** — "⚠️ You are entering a high-risk area"
2. **Sends an SMS** to the woman and optionally to a guardian
3. **Records the entry** in the database (timestamp, location, which zone)
4. **Monitors continuously** until she exits the zone
5. **Records the exit** — logs the total time spent in the zone
6. **Sends a safety confirmation** — "✅ You have safely left the risk zone"
7. **The police dashboard updates** in real-time showing how many women are in each zone

### 4.2 Zone Risk Levels

| Level | Color | Meaning | Example Trigger |
|---|---|---|---|
| 1 | 🟢 Green | Low risk | Generally safe, minor incidents |
| 2 | 🟡 Yellow | Moderate | Some harassment reports |
| 3 | 🟠 Orange | Elevated | Multiple incidents, exercise caution |
| 4 | 🔴 Red | High risk | Frequent incidents, avoid if possible |
| 5 | 🟣 Critical | Extreme | Active incidents, immediate alert |

### 4.3 Zone Types

```
TYPE 1: ALWAYS_ACTIVE
  - Dangerous at all hours
  - Example: Isolated industrial area

TYPE 2: TIME_BASED
  - Dangerous only during certain time bands
  - Example: Busy market safe during day, risky at night
  - Time bands: morning (6am-12pm), afternoon (12pm-6pm), evening (6pm-10pm), night (10pm-6am)

TYPE 3: INCIDENT_TRIGGERED
  - Normal zone flagged temporarily after reported incidents
  - Auto-expires after 48 hours with no new incidents
  - Created automatically by the AI engine
```

### 4.4 Database Schema for Zone System

#### Migration: `20240101000006_zone_system.sql`

```sql
-- ════════════════════════════════════════
-- DANGER ZONES — defined hotspot areas
-- ════════════════════════════════════════
CREATE TABLE public.danger_zones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  area            VARCHAR(100),           -- locality/area name: "Maninagar", "Kalupur"
  center_lat      DECIMAL(10, 8) NOT NULL,
  center_lng      DECIMAL(11, 8) NOT NULL,
  radius_meters   INT NOT NULL,

  -- GeoJSON polygon (for non-circular zones like roads, markets)
  -- null if using circular radius
  polygon_coords  JSONB DEFAULT NULL,
  -- polygon_coords: [ [lat,lng], [lat,lng], ... ] (closed polygon)

  risk_level      SMALLINT NOT NULL DEFAULT 3
                    CHECK (risk_level BETWEEN 1 AND 5),
  zone_type       VARCHAR(20) NOT NULL DEFAULT 'always_active'
                    CHECK (zone_type IN ('always_active', 'time_based', 'incident_triggered')),

  -- Active time bands (null = always active)
  active_bands    JSONB DEFAULT NULL,
  -- active_bands: [
  --   { "days": "all", "from": "20:00", "to": "06:00" },
  --   { "days": "weekend", "from": "22:00", "to": "05:00" }
  -- ]

  -- Auto-expiry for incident-triggered zones
  expires_at      TIMESTAMPTZ DEFAULT NULL,

  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  incident_count  INT DEFAULT 0,
  current_users_inside INT DEFAULT 0,   -- live count updated in real-time

  -- Who created this zone
  created_by_officer UUID REFERENCES public.officers(id),
  ai_generated    BOOLEAN DEFAULT FALSE,  -- TRUE if created by AI clustering

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════
-- ZONE VISITS — every entry and exit event
-- ════════════════════════════════════════
CREATE TABLE public.zone_visits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.users(id),
  zone_id             UUID NOT NULL REFERENCES public.danger_zones(id),
  entered_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exited_at           TIMESTAMPTZ DEFAULT NULL,      -- NULL = still inside
  duration_minutes    INT DEFAULT NULL,              -- calculated on exit
  entry_lat           DECIMAL(10, 8) NOT NULL,
  entry_lng           DECIMAL(11, 8) NOT NULL,
  exit_lat            DECIMAL(10, 8),
  exit_lng            DECIMAL(11, 8),
  entry_alert_sent    BOOLEAN DEFAULT FALSE,
  entry_alert_channel VARCHAR(20),                  -- 'push', 'sms', 'both'
  exit_alert_sent     BOOLEAN DEFAULT FALSE,
  user_acknowledged   BOOLEAN DEFAULT FALSE,         -- did user tap "OK" on alert
  is_sos_triggered    BOOLEAN DEFAULT FALSE,         -- did this visit lead to SOS?
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════
-- USER ZONE STATE — current geofence state per user
-- (Redis-backed but also in DB for persistence)
-- ════════════════════════════════════════
CREATE TABLE public.user_zone_state (
  user_id           UUID PRIMARY KEY REFERENCES public.users(id),
  current_zone_ids  UUID[] DEFAULT '{}',     -- zones user is currently inside
  last_lat          DECIMAL(10, 8),
  last_lng          DECIMAL(11, 8),
  last_checked_at   TIMESTAMPTZ DEFAULT NOW(),
  geofence_enabled  BOOLEAN DEFAULT TRUE      -- user can opt out
);

-- ════════════════════════════════════════
-- ZONE ALERTS LOG — every notification sent
-- ════════════════════════════════════════
CREATE TABLE public.zone_alert_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id      UUID REFERENCES public.zone_visits(id),
  user_id       UUID REFERENCES public.users(id),
  zone_id       UUID REFERENCES public.danger_zones(id),
  alert_type    VARCHAR(20) NOT NULL
                  CHECK (alert_type IN ('zone_entry', 'zone_exit', 'zone_prolonged', 'zone_critical')),
  channel       VARCHAR(10) NOT NULL
                  CHECK (channel IN ('push', 'sms', 'both', 'inapp')),
  message       TEXT NOT NULL,
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  delivered     BOOLEAN DEFAULT NULL,       -- NULL = unknown, TRUE = confirmed delivery
  twilio_sid    VARCHAR(50)                 -- for SMS delivery tracking
);

-- ════════════════════════════════════════
-- TRIGGERS & FUNCTIONS
-- ════════════════════════════════════════

-- Auto-update zone's current_users_inside when visits change
CREATE OR REPLACE FUNCTION update_zone_user_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.danger_zones
  SET current_users_inside = (
    SELECT COUNT(*) FROM public.zone_visits
    WHERE zone_id = COALESCE(NEW.zone_id, OLD.zone_id)
    AND exited_at IS NULL
  )
  WHERE id = COALESCE(NEW.zone_id, OLD.zone_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_zone_user_count
  AFTER INSERT OR UPDATE ON public.zone_visits
  FOR EACH ROW EXECUTE FUNCTION update_zone_user_count();

-- Auto-calculate duration_minutes when exit is recorded
CREATE OR REPLACE FUNCTION calculate_zone_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.exited_at IS NOT NULL AND OLD.exited_at IS NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.exited_at - NEW.entered_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_zone_duration
  BEFORE UPDATE ON public.zone_visits
  FOR EACH ROW EXECUTE FUNCTION calculate_zone_duration();

-- Enable Realtime on zone tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.danger_zones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.zone_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_zone_state;

-- Indexes
CREATE INDEX idx_zone_visits_user_id ON public.zone_visits(user_id);
CREATE INDEX idx_zone_visits_zone_id ON public.zone_visits(zone_id);
CREATE INDEX idx_zone_visits_active ON public.zone_visits(user_id) WHERE exited_at IS NULL;
CREATE INDEX idx_danger_zones_active ON public.danger_zones(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_danger_zones_location ON public.danger_zones(center_lat, center_lng);
```

---

## 5. Dummy Danger Zone Data — Ahmedabad

These 10 pre-seeded zones are used for development and the hackathon demo. In production, zones are built from real incident data + AI clustering.

### Migration: `20240101000007_seed_zones.sql`

```sql
INSERT INTO public.danger_zones
  (name, description, area, center_lat, center_lng, radius_meters, risk_level, zone_type, active_bands, ai_generated)
VALUES

-- ────────────────────────────────────────────────────────────
-- ZONE 1: Kalupur Railway Station Area
-- Reason: High footfall, isolated at night, pickpockets + harassment
-- ────────────────────────────────────────────────────────────
(
  'Kalupur Railway Station Surroundings',
  'High footfall area with reports of eve-teasing and chain snatching. Risk increases significantly after 9 PM.',
  'Kalupur',
  23.02686, 72.59900,      -- center: near Kalupur station
  600,                      -- 600 meter radius
  4,                        -- RED
  'time_based',
  '[
    {"days": "all", "from": "21:00", "to": "06:00"},
    {"days": "weekend", "from": "20:00", "to": "06:00"}
  ]',
  FALSE
),

-- ────────────────────────────────────────────────────────────
-- ZONE 2: Lal Darwaja Bus Stand
-- Reason: Overcrowded, multiple harassment reports
-- ────────────────────────────────────────────────────────────
(
  'Lal Darwaja Bus Stand',
  'Major bus terminal with reports of harassment in crowded conditions and poor lighting in adjacent lanes.',
  'Lal Darwaja',
  23.02140, 72.58640,
  450,
  3,                        -- ORANGE
  'time_based',
  '[
    {"days": "all", "from": "20:00", "to": "07:00"}
  ]',
  FALSE
),

-- ────────────────────────────────────────────────────────────
-- ZONE 3: Gomtipur Industrial Area
-- Reason: Isolated roads, poor street lighting, multiple stalking complaints
-- ────────────────────────────────────────────────────────────
(
  'Gomtipur Industrial Zone',
  'Industrial zone with minimal foot traffic after factory hours. Multiple cyberstalking incidents reported from this area.',
  'Gomtipur',
  23.01900, 72.61900,
  700,
  4,                        -- RED
  'always_active',
  NULL,
  FALSE
),

-- ────────────────────────────────────────────────────────────
-- ZONE 4: Isanpur Night Market
-- Reason: Late night crowds, poor lighting, financial fraud reports
-- ────────────────────────────────────────────────────────────
(
  'Isanpur Night Market Area',
  'Congested market area with reports of phone snatching and UPI fraud. Poorly lit after midnight.',
  'Isanpur',
  22.98200, 72.62450,
  400,
  3,                        -- ORANGE
  'time_based',
  '[
    {"days": "all", "from": "22:00", "to": "05:00"}
  ]',
  FALSE
),

-- ────────────────────────────────────────────────────────────
-- ZONE 5: Rakhial Underpass
-- Reason: Isolated underpass, poor lighting, multiple SOS incidents
-- ────────────────────────────────────────────────────────────
(
  'Rakhial Road Underpass',
  'Underpass with history of robbery and harassment incidents. Avoid at night. No CCTV coverage.',
  'Rakhial',
  23.04800, 72.62100,
  300,
  5,                        -- CRITICAL
  'time_based',
  '[
    {"days": "all", "from": "20:00", "to": "07:00"}
  ]',
  FALSE
),

-- ────────────────────────────────────────────────────────────
-- ZONE 6: Shahpur Late Night
-- Reason: Isolated lanes, multiple blackmail/photo harassment reports
-- ────────────────────────────────────────────────────────────
(
  'Shahpur Residential Lanes',
  'Isolated residential lanes with complaints of illegal photography and blackmail. High risk after 11 PM.',
  'Shahpur',
  23.03000, 72.58100,
  350,
  4,                        -- RED
  'time_based',
  '[
    {"days": "all", "from": "23:00", "to": "05:30"}
  ]',
  FALSE
),

-- ────────────────────────────────────────────────────────────
-- ZONE 7: Vatva Industrial GIDC
-- Reason: Remote industrial area, history of violence
-- ────────────────────────────────────────────────────────────
(
  'Vatva GIDC Industrial Area',
  'Remote industrial estate with poor connectivity and frequent isolation after 6 PM.',
  'Vatva',
  22.96800, 72.64200,
  800,
  4,                        -- RED
  'time_based',
  '[
    {"days": "weekday", "from": "19:00", "to": "07:00"},
    {"days": "weekend", "from": "14:00", "to": "08:00"}
  ]',
  FALSE
),

-- ────────────────────────────────────────────────────────────
-- ZONE 8: Narol Highway Stretch
-- Reason: Long isolated highway section, minimal police presence
-- ────────────────────────────────────────────────────────────
(
  'Narol Highway Isolated Stretch',
  'Long stretch of highway with minimal lighting and sparse police patrolling.',
  'Narol',
  22.95400, 72.62600,
  900,
  3,                        -- ORANGE
  'time_based',
  '[
    {"days": "all", "from": "21:00", "to": "06:00"}
  ]',
  FALSE
),

-- ────────────────────────────────────────────────────────────
-- ZONE 9: Maninagar Station Back Roads
-- Reason: Multiple snatching and harassment complaints on back roads
-- ────────────────────────────────────────────────────────────
(
  'Maninagar Station Back Lanes',
  'Network of poorly lit back lanes behind the railway station. Multiple snatch-and-run incidents.',
  'Maninagar',
  22.99850, 72.59870,
  400,
  3,                        -- ORANGE
  'always_active',
  NULL,
  FALSE
),

-- ────────────────────────────────────────────────────────────
-- ZONE 10: Behrampura Isolated Block
-- Reason: AI-detected cluster from incident data
-- ────────────────────────────────────────────────────────────
(
  'Behrampura Isolated Block',
  'AI-detected high-incident cluster. 12 complaints in past 90 days in this 500m radius.',
  'Behrampura',
  23.00100, 72.60500,
  500,
  3,                        -- ORANGE
  'incident_triggered',
  NULL,
  TRUE                      -- AI generated
);
```

---

## 6. Geofencing Algorithm — Deep Dive

### 6.1 How It Works — Step by Step

```
Every 30 seconds (or on significant location change > 50 meters):
     │
     ▼
1. User's location is sent to backend: POST /api/v1/location/update
     │
     ▼
2. Backend: Load all ACTIVE danger zones from Redis cache
   (zones are cached for 5 minutes — no DB hit every 30s)
     │
     ▼
3. For each zone:
   a. If zone is time_based → check if current time falls in active band
   b. If zone is incident_triggered → check if not expired
   c. Run Haversine distance check:
      distance = haversineDistance(userLat, userLng, zoneLat, zoneLng)
      isInside = distance <= zone.radius_meters
     │
     ▼
4. Compare current inside-zones vs previous inside-zones (from Redis user state):
   new_zones    = currentInsideZones - previousInsideZones  → ZONE_ENTRY events
   exited_zones = previousInsideZones - currentInsideZones  → ZONE_EXIT events
     │
     ├── ZONE_ENTRY: fire entry alerts + create zone_visits record
     └── ZONE_EXIT:  fire exit alerts + update zone_visits record
```

### 6.2 Backend Service — Zone Check Engine

#### `shieldher-api/src/modules/zones/zoneMonitor.service.ts`

```typescript
import { supabaseAdmin } from '../../config/supabase'
import { haversineDistance } from '../../utils/geoUtils'
import { redis } from '../../config/redis'
import { zoneNotificationService } from './zoneNotification.service'

const ZONES_CACHE_KEY = 'active_danger_zones'
const ZONES_CACHE_TTL_SECONDS = 300  // 5 minutes
const USER_ZONE_STATE_PREFIX = 'user_zone_state:'

export const zoneMonitorService = {

  // Called on every location update
  async checkUserZones(
    userId: string,
    authUserId: string,
    lat: number,
    lng: number
  ) {
    // 1. Get all active zones (from Redis cache)
    const activeZones = await this.getActiveZonesCached()

    // 2. Find which zones the user is currently inside
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()
    const isWeekend = [0, 6].includes(now.getDay())

    const currentZoneIds = activeZones
      .filter(zone => {
        // Distance check
        const distance = haversineDistance(lat, lng, zone.center_lat, zone.center_lng)
        if (distance > zone.radius_meters) return false

        // Time band check for time_based zones
        if (zone.zone_type === 'time_based' && zone.active_bands) {
          return this.isWithinActiveBand(zone.active_bands, currentHour, currentMinutes, isWeekend)
        }

        // Expiry check for incident_triggered zones
        if (zone.zone_type === 'incident_triggered' && zone.expires_at) {
          return new Date(zone.expires_at) > now
        }

        // always_active zones: always true if within radius
        return true
      })
      .map(z => z.id)

    // 3. Get previous zone state for this user from Redis
    const prevStateRaw = await redis.get(`${USER_ZONE_STATE_PREFIX}${userId}`)
    const previousZoneIds: string[] = prevStateRaw ? JSON.parse(prevStateRaw) : []

    // 4. Calculate entry and exit events
    const enteredZoneIds = currentZoneIds.filter(id => !previousZoneIds.includes(id))
    const exitedZoneIds = previousZoneIds.filter(id => !currentZoneIds.includes(id))

    // 5. Process ZONE ENTRY events
    for (const zoneId of enteredZoneIds) {
      const zone = activeZones.find(z => z.id === zoneId)!
      await this.handleZoneEntry(userId, zone, lat, lng)
    }

    // 6. Process ZONE EXIT events
    for (const zoneId of exitedZoneIds) {
      const zone = activeZones.find(z => z.id === zoneId)
        ?? await this.getZoneById(zoneId)  // may have been deactivated
      await this.handleZoneExit(userId, zone, lat, lng)
    }

    // 7. Update user zone state in Redis + Supabase
    await redis.setex(
      `${USER_ZONE_STATE_PREFIX}${userId}`,
      120,  // expire after 2 minutes of inactivity
      JSON.stringify(currentZoneIds)
    )

    await supabaseAdmin
      .from('user_zone_state')
      .upsert({
        user_id: userId,
        current_zone_ids: currentZoneIds,
        last_lat: lat,
        last_lng: lng,
        last_checked_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    return {
      current_zones: currentZoneIds,
      entered_zones: enteredZoneIds,
      exited_zones: exitedZoneIds,
    }
  },

  async handleZoneEntry(
    userId: string,
    zone: DangerZone,
    lat: number,
    lng: number
  ) {
    // 1. Create zone visit record
    const { data: visit } = await supabaseAdmin
      .from('zone_visits')
      .insert({
        user_id: userId,
        zone_id: zone.id,
        entered_at: new Date().toISOString(),
        entry_lat: lat,
        entry_lng: lng,
      })
      .select('id')
      .single()

    // 2. Send notifications
    await zoneNotificationService.sendEntryAlert(userId, zone, visit!.id)

    // 3. Log
    logger.info('User entered danger zone', {
      userId, zoneId: zone.id, zoneName: zone.name, riskLevel: zone.risk_level
    })
  },

  async handleZoneExit(
    userId: string,
    zone: DangerZone | null,
    lat: number,
    lng: number
  ) {
    if (!zone) return

    // 1. Find the open visit record (exited_at IS NULL)
    const { data: openVisit } = await supabaseAdmin
      .from('zone_visits')
      .select('id, entered_at')
      .eq('user_id', userId)
      .eq('zone_id', zone.id)
      .is('exited_at', null)
      .order('entered_at', { ascending: false })
      .limit(1)
      .single()

    if (!openVisit) return

    // 2. Close the visit record
    const exitTime = new Date()
    const durationMinutes = Math.round(
      (exitTime.getTime() - new Date(openVisit.entered_at).getTime()) / 60000
    )

    await supabaseAdmin
      .from('zone_visits')
      .update({
        exited_at: exitTime.toISOString(),
        exit_lat: lat,
        exit_lng: lng,
        duration_minutes: durationMinutes,
      })
      .eq('id', openVisit.id)

    // 3. Send exit notification
    await zoneNotificationService.sendExitAlert(userId, zone, openVisit.id, durationMinutes)

    logger.info('User exited danger zone', {
      userId, zoneId: zone.id, zoneName: zone.name, durationMinutes
    })
  },

  isWithinActiveBand(
    bands: ActiveBand[],
    hour: number,
    minutes: number,
    isWeekend: boolean
  ): boolean {
    const timeInMinutes = hour * 60 + minutes

    return bands.some(band => {
      // Day type check
      if (band.days === 'weekday' && isWeekend) return false
      if (band.days === 'weekend' && !isWeekend) return false

      const [fromH, fromM] = band.from.split(':').map(Number)
      const [toH, toM] = band.to.split(':').map(Number)
      const fromMinutes = fromH * 60 + fromM
      const toMinutes = toH * 60 + toM

      // Handles overnight bands like 21:00 → 06:00
      if (fromMinutes > toMinutes) {
        // Band crosses midnight
        return timeInMinutes >= fromMinutes || timeInMinutes <= toMinutes
      }
      return timeInMinutes >= fromMinutes && timeInMinutes <= toMinutes
    })
  },

  async getActiveZonesCached(): Promise<DangerZone[]> {
    const cached = await redis.get(ZONES_CACHE_KEY)
    if (cached) return JSON.parse(cached)

    const { data } = await supabaseAdmin
      .from('danger_zones')
      .select('*')
      .eq('is_active', true)

    await redis.setex(ZONES_CACHE_KEY, ZONES_CACHE_TTL_SECONDS, JSON.stringify(data ?? []))
    return data ?? []
  },

  async getZoneById(zoneId: string): Promise<DangerZone | null> {
    const { data } = await supabaseAdmin
      .from('danger_zones')
      .select('*')
      .eq('id', zoneId)
      .single()
    return data
  },
}
```

### 6.3 Location Update Endpoint

#### `shieldher-api/src/modules/zones/zone.routes.ts`

```typescript
// POST /api/v1/location/update
router.post('/location/update',
  authMiddleware,
  rateLimiterMiddleware({ max: 120, windowMs: 60_000 }),  // 120/min = every 500ms max
  validateBody(locationUpdateSchema),
  asyncHandler(async (req, res) => {
    const { latitude, longitude, accuracy } = req.body
    const { id: authUserId } = req.user!

    // Get user DB id
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, geofence_enabled:user_zone_state(geofence_enabled)')
      .eq('auth_user_id', authUserId)
      .single()

    // Check if geofencing enabled for this user
    const geofenceEnabled = user?.geofence_enabled?.[0]?.geofence_enabled ?? true
    if (!geofenceEnabled) {
      return res.json({ zones_checked: false, reason: 'geofencing_disabled' })
    }

    // Run zone check
    const result = await zoneMonitorService.checkUserZones(
      user!.id, authUserId, latitude, longitude
    )

    res.json({
      zones_checked: true,
      current_zones: result.current_zones,
      entered_zones: result.entered_zones.length,
      exited_zones: result.exited_zones.length,
    })
  })
)
```

---

## 7. Zone Entry / Exit Notification Pipeline

### 7.1 Alert Messages by Risk Level

```typescript
// src/modules/zones/zoneNotification.service.ts

const ENTRY_MESSAGES = {
  en: {
    1: (zoneName: string) =>
      `📍 Low-risk area alert: You have entered ${zoneName}. Stay aware of your surroundings.`,
    2: (zoneName: string) =>
      `⚠️ Moderate risk: You have entered ${zoneName}. Some incidents have been reported here. Be cautious.`,
    3: (zoneName: string) =>
      `🟠 Caution: You are entering ${zoneName}, a known risk area. Please share your location with a trusted contact.`,
    4: (zoneName: string) =>
      `🔴 HIGH RISK AREA: You have entered ${zoneName}. Multiple incidents reported here. Your guardian has been notified. Stay alert!`,
    5: (zoneName: string) =>
      `🚨 CRITICAL ZONE: You have entered ${zoneName}. This is a HIGH DANGER area. Consider activating SOS or leaving immediately. Police notified.`,
  },
  hi: {
    4: (zoneName: string) =>
      `🔴 खतरनाक क्षेत्र: आप ${zoneName} में प्रवेश कर रही हैं। यहाँ कई घटनाएं रिपोर्ट हुई हैं। आपके परिवार को सूचित कर दिया गया है। सतर्क रहें!`,
    5: (zoneName: string) =>
      `🚨 अत्यंत खतरनाक: आप ${zoneName} में हैं। कृपया तुरंत SOS बटन दबाएं या इस क्षेत्र से निकल जाएं।`,
  },
  gu: {
    4: (zoneName: string) =>
      `🔴 ખતરનાક વિસ્તાર: તમે ${zoneName} માં પ્રવેશ કર્યો છે. અહીં અનેક ઘટનાઓ નોંધાઈ છે. તમારા પ્રિયજનોને જાણ કરવામાં આવી છે.`,
  },
}

const EXIT_MESSAGES = {
  en: {
    any: (zoneName: string, durationMinutes: number) =>
      `✅ Safe exit: You have left ${zoneName}. You were in the risk area for ${durationMinutes} minute(s). Stay safe!`,
  },
  hi: {
    any: (zoneName: string, durationMinutes: number) =>
      `✅ सुरक्षित: आप ${zoneName} से बाहर आ गई हैं (${durationMinutes} मिनट)। आपकी जानकारी सुरक्षित रूप से दर्ज कर ली गई है।`,
  },
  gu: {
    any: (zoneName: string, durationMinutes: number) =>
      `✅ સુરક્ષિત: તમે ${zoneName} છોડ્યો (${durationMinutes} મિનિટ). તમારી સ્થિતિ ડેટાબેઝમાં અપડેટ થઈ ગઈ છે.`,
  },
}

export const zoneNotificationService = {
  async sendEntryAlert(
    userId: string,
    zone: DangerZone,
    visitId: string
  ) {
    // Get user preferences
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('phone, preferred_language, guardians(phone, name, priority)')
      .eq('id', userId)
      .single()

    const lang = (user?.preferred_language ?? 'en') as 'en' | 'hi' | 'gu'
    const messages = ENTRY_MESSAGES[lang] ?? ENTRY_MESSAGES.en
    const message = (messages[zone.risk_level as keyof typeof messages]
      ?? messages[3])(zone.name)

    const results = await Promise.allSettled([
      // 1. FCM Push notification (if user has device token)
      this.sendPushNotification(userId, {
        title: zone.risk_level >= 4 ? '🚨 Danger Zone Alert' : '⚠️ Zone Alert',
        body: message,
        data: {
          type: 'zone_entry',
          zoneId: zone.id,
          zoneName: zone.name,
          riskLevel: zone.risk_level.toString(),
          visitId,
        },
      }),

      // 2. SMS for high-risk zones (4 and 5 only)
      ...(zone.risk_level >= 4 ? [
        twilioService.sendSMS(user!.phone, message),
      ] : []),

      // 3. Notify top guardian for critical zones (level 5)
      ...(zone.risk_level === 5 ? [
        this.notifyGuardian(
          user?.guardians?.[0],
          user?.full_name ?? 'A user',
          zone,
          'entry'
        ),
      ] : []),
    ])

    // Log to zone_alert_log
    await supabaseAdmin.from('zone_alert_log').insert({
      visit_id: visitId,
      user_id: userId,
      zone_id: zone.id,
      alert_type: 'zone_entry',
      channel: zone.risk_level >= 4 ? 'both' : 'push',
      message,
      sent_at: new Date().toISOString(),
    })

    // Mark alert as sent on the visit
    await supabaseAdmin
      .from('zone_visits')
      .update({
        entry_alert_sent: true,
        entry_alert_channel: zone.risk_level >= 4 ? 'both' : 'push',
      })
      .eq('id', visitId)
  },

  async sendExitAlert(
    userId: string,
    zone: DangerZone,
    visitId: string,
    durationMinutes: number
  ) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('phone, preferred_language')
      .eq('id', userId)
      .single()

    const lang = (user?.preferred_language ?? 'en') as 'en' | 'hi' | 'gu'
    const messages = EXIT_MESSAGES[lang] ?? EXIT_MESSAGES.en
    const message = messages.any(zone.name, durationMinutes)

    await Promise.allSettled([
      this.sendPushNotification(userId, {
        title: '✅ You have safely exited the area',
        body: message,
        data: {
          type: 'zone_exit',
          zoneId: zone.id,
          visitId,
          durationMinutes: durationMinutes.toString(),
        },
      }),
    ])

    // High-risk + long stay: send SMS exit confirmation too
    if (zone.risk_level >= 4 && durationMinutes >= 10) {
      await twilioService.sendSMS(user!.phone, message)
    }

    await supabaseAdmin.from('zone_alert_log').insert({
      visit_id: visitId,
      user_id: userId,
      zone_id: zone.id,
      alert_type: 'zone_exit',
      channel: 'push',
      message,
    })

    await supabaseAdmin
      .from('zone_visits')
      .update({ exit_alert_sent: true })
      .eq('id', visitId)
  },

  async sendPushNotification(userId: string, notification: FCMNotification) {
    // Get user's FCM token from Supabase
    const { data } = await supabaseAdmin
      .from('user_fcm_tokens')
      .select('token')
      .eq('user_id', userId)
      .single()

    if (!data?.token) return

    return fcmService.send({
      token: data.token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      android: {
        priority: 'high',
        notification: { sound: 'alert', channelId: 'zone_alerts' },
      },
    })
  },

  async notifyGuardian(
    guardian: Guardian | undefined,
    userName: string,
    zone: DangerZone,
    eventType: 'entry' | 'exit'
  ) {
    if (!guardian) return
    const msg = eventType === 'entry'
      ? `🚨 ALERT: ${userName} has entered a CRITICAL danger zone: ${zone.name}, ${zone.area}. Please check on them immediately.`
      : `✅ UPDATE: ${userName} has safely exited ${zone.name}.`
    return twilioService.sendSMS(guardian.phone, msg)
  },
}
```

### 7.2 In-App Zone Alert Component

#### `src/components/zones/ZoneAlertBanner.tsx`

```typescript
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

interface ZoneAlert {
  type: 'entry' | 'exit' | 'prolonged'
  zoneName: string
  riskLevel: number
  message: string
  visitId: string
}

export function ZoneAlertBanner() {
  const { user } = useAuthStore()
  const [activeAlert, setActiveAlert] = useState<ZoneAlert | null>(null)

  useEffect(() => {
    if (!user) return

    // Listen for real-time zone_visits table changes for this user
    const channel = supabase
      .channel(`zone-alerts-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'zone_visits',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // New zone visit = entry
          const { data: zone } = await supabase
            .from('danger_zones')
            .select('name, risk_level, area')
            .eq('id', payload.new.zone_id)
            .single()

          if (zone) {
            setActiveAlert({
              type: 'entry',
              zoneName: zone.name,
              riskLevel: zone.risk_level,
              message: getEntryMessage(zone.name, zone.risk_level),
              visitId: payload.new.id,
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'zone_visits',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Visit updated with exited_at = exit event
          if (payload.new.exited_at && !payload.old.exited_at) {
            const { data: zone } = await supabase
              .from('danger_zones')
              .select('name, risk_level')
              .eq('id', payload.new.zone_id)
              .single()

            if (zone) {
              setActiveAlert({
                type: 'exit',
                zoneName: zone.name,
                riskLevel: zone.risk_level,
                message: `✅ You have safely left ${zone.name}`,
                visitId: payload.new.id,
              })
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  if (!activeAlert) return null

  const isEntry = activeAlert.type === 'entry'
  const bgColor = isEntry
    ? activeAlert.riskLevel >= 4 ? 'bg-red-600' : 'bg-amber-500'
    : 'bg-green-600'

  return (
    <AnimatePresence>
      {activeAlert && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-50 ${bgColor}
                      text-white px-4 py-3 shadow-2xl`}
        >
          <div className="flex items-start gap-3 max-w-lg mx-auto">
            <div className="mt-0.5">
              {isEntry
                ? <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                : <CheckCircle className="w-6 h-6 flex-shrink-0" />
              }
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{activeAlert.message}</p>
              {isEntry && activeAlert.riskLevel >= 4 && (
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-3 py-1 bg-white text-red-600 rounded-full
                               text-xs font-bold"
                    onClick={() => {/* Navigate to SOS page */}}
                  >
                    🆘 Activate SOS
                  </button>
                  <button
                    className="px-3 py-1 bg-white/20 rounded-full text-xs"
                    onClick={() => {/* Share location with guardian */}}
                  >
                    📍 Share Location
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setActiveAlert(null)}
              className="opacity-80 hover:opacity-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## 8. Zone Visit Database — Schema & Queries

### 8.1 Key Queries

```typescript
// src/modules/zones/zoneQuery.service.ts

export const zoneQueryService = {

  // Get complete visit history for a user (with zone details)
  async getUserZoneHistory(userId: string, limit = 50) {
    return supabaseAdmin
      .from('zone_visits')
      .select(`
        id,
        entered_at,
        exited_at,
        duration_minutes,
        entry_lat, entry_lng,
        exit_lat, exit_lng,
        is_sos_triggered,
        danger_zones (
          name, area, risk_level, center_lat, center_lng, radius_meters
        )
      `)
      .eq('user_id', userId)
      .order('entered_at', { ascending: false })
      .limit(limit)
  },

  // Police: see all users currently in a specific zone
  async getUsersInZone(zoneId: string) {
    return supabaseAdmin
      .from('zone_visits')
      .select(`
        id,
        entered_at,
        users (
          id, full_name, phone
        )
      `)
      .eq('zone_id', zoneId)
      .is('exited_at', null)
      .order('entered_at', { ascending: true })
  },

  // Analytics: how long women stay in each zone on average
  async getZoneDurationStats() {
    return supabaseAdmin
      .from('zone_visits')
      .select(`
        zone_id,
        duration_minutes,
        danger_zones ( name, area, risk_level )
      `)
      .not('duration_minutes', 'is', null)
      .gt('duration_minutes', 0)
      .order('zone_id')
  },

  // Example output for the scenario:
  // "Woman entered at 11:00 AM, exited at 1:00 PM"
  async getVisitRecord(visitId: string) {
    return supabaseAdmin
      .from('zone_visits')
      .select(`
        id,
        entered_at,
        exited_at,
        duration_minutes,
        entry_lat, entry_lng,
        exit_lat, exit_lng,
        entry_alert_sent,
        exit_alert_sent,
        is_sos_triggered,
        danger_zones (
          name, area, risk_level, description
        ),
        users (
          full_name, phone
        ),
        zone_alert_log (
          alert_type, channel, message, sent_at, delivered
        )
      `)
      .eq('id', visitId)
      .single()
  },
  // Example return:
  // {
  //   id: "uuid",
  //   entered_at: "2024-01-15T05:30:00Z",  ← 11:00 AM IST
  //   exited_at: "2024-01-15T07:30:00Z",   ← 1:00 PM IST
  //   duration_minutes: 120,
  //   danger_zones: { name: "Kalupur Railway Station", risk_level: 4 },
  //   users: { full_name: "Priya Sharma", phone: "9876543210" },
  //   zone_alert_log: [
  //     { alert_type: "zone_entry", message: "🔴 HIGH RISK...", sent_at: "11:00 AM" },
  //     { alert_type: "zone_exit",  message: "✅ You have safely left...", sent_at: "1:00 PM" }
  //   ]
  // }
}
```

### 8.2 Police Dashboard — Zone Monitor Panel

Shows live occupancy for each danger zone and visit history.

```typescript
// Zone occupancy card on police dashboard
{
  // Data shape for dashboard
  zoneOccupancyData: [
    {
      zone: "Kalupur Railway Station",
      risk_level: 4,
      current_users: 3,       ← 3 women currently in this zone
      today_visits: 12,
      avg_duration_minutes: 8,
      alerts_sent_today: 12,
      sos_incidents_from_zone: 1,
    }
  ]
}
```

---

## 9. Zone Alert — Frontend Implementation

### 9.1 Location Polling Hook

#### `src/hooks/useLocationMonitoring.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react'
import api from '../lib/axios'
import { useAuthStore } from '../store/authStore'
import { useSOSStore } from '../store/sosStore'

const POLL_INTERVAL_NORMAL_MS = 30_000   // 30 seconds when idle
const POLL_INTERVAL_SOS_MS    = 10_000   // 10 seconds during active SOS

export function useLocationMonitoring() {
  const { isAuthenticated } = useAuthStore()
  const { isActive: isSosActive } = useSOSStore()
  const watchIdRef = useRef<number | null>(null)
  const lastPostedAt = useRef<number>(0)
  const minInterval = isSosActive ? POLL_INTERVAL_SOS_MS : POLL_INTERVAL_NORMAL_MS

  const postLocation = useCallback(async (position: GeolocationPosition) => {
    const now = Date.now()
    // Throttle: only post if enough time has passed since last post
    if (now - lastPostedAt.current < minInterval) return
    lastPostedAt.current = now

    try {
      await api.post('/location/update', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
      })
    } catch (error) {
      // Silent fail — don't interrupt user experience
      console.warn('Location update failed:', error)
    }
  }, [minInterval])

  useEffect(() => {
    if (!isAuthenticated) return
    if (!('geolocation' in navigator)) return

    // Use watchPosition for continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      postLocation,
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          // Show one-time prompt to enable location
          toast.warning('Enable location for safety monitoring')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [isAuthenticated, postLocation])
}
```

### 9.2 Zones Display on User Map

```typescript
// Show danger zones on the user's personal map with safe/unsafe labeling
export function UserSafetyMap({ userLocation }: { userLocation: Coords }) {
  const { data: zones } = useQuery({
    queryKey: ['danger_zones', 'active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('danger_zones')
        .select('id, name, area, center_lat, center_lng, radius_meters, risk_level, zone_type')
        .eq('is_active', true)
      return data ?? []
    },
    staleTime: 300_000,  // cache 5 minutes
  })

  return (
    <GoogleMap center={userLocation} zoom={15}>
      {zones?.map(zone => (
        <Circle
          key={zone.id}
          center={{ lat: zone.center_lat, lng: zone.center_lng }}
          radius={zone.radius_meters}
          options={{
            strokeColor: RISK_COLORS[zone.risk_level],
            fillColor: RISK_COLORS[zone.risk_level],
            fillOpacity: 0.15,
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />
      ))}
      {/* User's current position */}
      <Marker position={userLocation} icon={INCIDENT_MARKERS.user_live} />
    </GoogleMap>
  )
}
```

---

## 10. Zone Alert — Backend Service

### 10.1 Cron Job — Prolonged Stay Alert

If a user has been in a danger zone for more than 30 minutes, send an escalation alert.

```typescript
// src/jobs/zoneProlongedStay.job.ts
// Runs every 15 minutes via node-cron

import cron from 'node-cron'

cron.schedule('*/15 * * * *', async () => {
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  const { data: prolongedVisits } = await supabaseAdmin
    .from('zone_visits')
    .select(`
      id, user_id, zone_id, entered_at,
      danger_zones ( name, risk_level ),
      users ( phone, preferred_language )
    `)
    .is('exited_at', null)
    .lte('entered_at', thirtyMinsAgo)
    .gte('danger_zones.risk_level', 3)  // only for risk 3+

  for (const visit of (prolongedVisits ?? [])) {
    const zone = visit.danger_zones as any
    const user = visit.users as any

    // Don't send duplicate alerts — check if we sent one in last 30 min
    const { count } = await supabaseAdmin
      .from('zone_alert_log')
      .select('*', { count: 'exact', head: true })
      .eq('visit_id', visit.id)
      .eq('alert_type', 'zone_prolonged')
      .gte('sent_at', thirtyMinsAgo)

    if ((count ?? 0) === 0) {
      const stayMinutes = Math.round(
        (Date.now() - new Date(visit.entered_at).getTime()) / 60000
      )

      await zoneNotificationService.sendPushNotification(visit.user_id, {
        title: '⚠️ Extended Stay in Risk Area',
        body: `You have been in ${zone.name} for ${stayMinutes} minutes. Are you safe? Tap to confirm.`,
        data: {
          type: 'zone_prolonged',
          visitId: visit.id,
          zoneId: visit.zone_id,
        },
      })

      await supabaseAdmin.from('zone_alert_log').insert({
        visit_id: visit.id,
        user_id: visit.user_id,
        zone_id: visit.zone_id,
        alert_type: 'zone_prolonged',
        channel: 'push',
        message: `Extended stay in ${zone.name}: ${stayMinutes} minutes`,
      })
    }
  }
})
```

---

## 11. Voice-Activated SOS System

### 11.1 What It Does

The voice SOS system runs **continuously in the background** in the browser. It listens for specific trigger keywords in three languages. When detected, it silently activates the SOS without the user needing to touch their phone.

### 11.2 Trigger Keywords by Language

| Language | Keywords |
|---|---|
| English | `help me`, `help help`, `call police`, `emergency` |
| Hindi | `bachao`, `madad karo`, `police bulao`, `khatra hai` |
| Gujarati | `madad karo`, `bachav`, `police ne bulavo`, `jokhm che` |

### 11.3 Web Speech API Integration

#### `src/hooks/useVoiceSOS.ts`

```typescript
import { useEffect, useRef, useState } from 'react'
import { useSOS } from './useSOS'

const TRIGGER_KEYWORDS: Record<string, string[]> = {
  en: ['help me', 'help help', 'call police', 'emergency', 'call 112'],
  hi: ['bachao', 'madad karo', 'police bulao', 'khatra hai', 'mujhe bachao'],
  gu: ['madad karo', 'bachav', 'police ne bulavo', 'jokhm che'],
}

const RECOGNITION_LANGUAGES = ['en-IN', 'hi-IN', 'gu-IN']

export function useVoiceSOS(enabled: boolean, userLanguage: string) {
  const { trigger } = useSOS()
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [lastDetected, setLastDetected] = useState<string | null>(null)
  const cooldownRef = useRef(false)

  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window

  useEffect(() => {
    if (!enabled || !isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = userLanguage === 'hi' ? 'hi-IN'
                     : userLanguage === 'gu' ? 'gu-IN' : 'en-IN'
    recognition.maxAlternatives = 3

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      setIsListening(false)
      // Auto-restart (unless explicitly stopped)
      if (enabled) {
        setTimeout(() => recognition.start(), 500)
      }
    }

    recognition.onresult = (event) => {
      const transcripts: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          transcripts.push(event.results[i][j].transcript.toLowerCase().trim())
        }
      }

      // Check against keywords for all supported languages
      const allKeywords = Object.values(TRIGGER_KEYWORDS).flat()
      const detected = allKeywords.find(kw =>
        transcripts.some(t => t.includes(kw))
      )

      if (detected && !cooldownRef.current) {
        cooldownRef.current = true
        setLastDetected(detected)

        // Trigger SOS
        trigger('voice')

        // Cooldown: don't retrigger for 30 seconds
        setTimeout(() => { cooldownRef.current = false }, 30_000)
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        console.warn('Microphone permission denied for voice SOS')
      }
    }

    recognition.start()

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [enabled, userLanguage])

  return { isListening, lastDetected, isSupported }
}
```

### 11.4 Voice SOS Settings Component

```typescript
// src/components/sos/VoiceSOSToggle.tsx
export function VoiceSOSToggle() {
  const [enabled, setEnabled] = useState(false)
  const { isListening } = useVoiceSOS(enabled, 'hi')

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900">
      <div>
        <p className="font-semibold">Voice SOS</p>
        <p className="text-sm text-muted-foreground">
          Say "Bachao" or "Help Me" to trigger SOS
        </p>
        {enabled && (
          <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {isListening ? 'Listening...' : 'Starting...'}
          </p>
        )}
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={async (val) => {
          if (val) {
            // Request mic permission first
            try {
              await navigator.mediaDevices.getUserMedia({ audio: true })
              setEnabled(true)
            } catch {
              toast.error('Microphone access is required for Voice SOS')
            }
          } else {
            setEnabled(false)
          }
        }}
      />
    </div>
  )
}
```

---

## 12. Offline / SMS Alert System

### 12.1 How It Works

When a user has no internet (2G area, rural coverage, underground), they can text a keyword to a dedicated Twilio number to trigger SOS.

```
User has no internet
        │
        ▼
User texts "SOS" or "BACHAO" or "HELP"
to registered ShieldHer number: +91-XXXXXXXXXX
        │
        ▼
Twilio receives the SMS → calls our webhook
        │
        ▼
Node.js: Parse sender number → look up user in DB
        │
        ▼
Create SOS incident (no GPS — will use last known location)
        │
        ▼
Alert guardians via SMS + ERSS via API
        │
        ▼
Reply SMS to user: "SOS received. Police notified."
```

### 12.2 SMS Keywords (All Languages)

```typescript
const SMS_KEYWORDS = [
  // English
  'sos', 'help', 'emergency', 'police',
  // Hindi (transliterated)
  'bachao', 'madad', 'khatra', 'help karo',
  // Gujarati (transliterated)
  'madad karo', 'bachav', 'police',
  // Short codes
  '1', '911', '112', 'danger',
]
```

### 12.3 Twilio Webhook Handler

#### `shieldher-api/src/modules/sos/smsWebhook.controller.ts`

```typescript
import { Request, Response } from 'express'
import twilio from 'twilio'

// Twilio signs all webhooks — verify signature to prevent spoofing
function validateTwilioRequest(req: Request): boolean {
  const signature = req.headers['x-twilio-signature'] as string
  const url = `${process.env.API_BASE_URL}/webhooks/twilio/sms`
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    req.body
  )
}

export async function handleIncomingSMS(req: Request, res: Response) {
  // 1. Validate Twilio signature
  if (!validateTwilioRequest(req)) {
    return res.status(403).send('Forbidden')
  }

  const { Body: body, From: from, NumMedia } = req.body
  const normalizedBody = (body ?? '').trim().toLowerCase()
  const phone = from.replace('+91', '').replace('+', '')

  const twimlResponse = twilio.twiml.MessagingResponse
  const twiml = new twimlResponse()

  const isSOSKeyword = SMS_KEYWORDS.some(kw => normalizedBody.includes(kw))
  if (!isSOSKeyword) {
    twiml.message('ShieldHer: For emergencies, text "SOS" to this number or call 112.')
    return res.type('text/xml').send(twiml.toString())
  }

  // 2. Find user by phone
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .eq('phone', phone)
    .single()

  if (!user) {
    twiml.message(
      `ShieldHer: Number not registered. Please download ShieldHer app to register.` +
      ` For immediate help, call 112 or 1930.`
    )
    return res.type('text/xml').send(twiml.toString())
  }

  // 3. Get last known location
  const { data: lastState } = await supabaseAdmin
    .from('user_zone_state')
    .select('last_lat, last_lng, last_checked_at')
    .eq('user_id', user.id)
    .single()

  // 4. Create SOS incident
  const { data: incident } = await supabaseAdmin
    .from('sos_incidents')
    .insert({
      user_id: user.id,
      latitude: lastState?.last_lat ?? 0,
      longitude: lastState?.last_lng ?? 0,
      address: lastState?.last_lat
        ? `Last known: ${lastState.last_lat}, ${lastState.last_lng}`
        : 'Location unavailable (SMS SOS)',
      trigger_type: 'sms',
      status: 'active',
    })
    .select()
    .single()

  // 5. Fire alerts (ERSS + Guardians)
  await Promise.allSettled([
    erssIntegration.notify({
      incident_id: incident!.id,
      latitude: lastState?.last_lat ?? 0,
      longitude: lastState?.last_lng ?? 0,
      user_phone: phone,
      user_name: user.full_name ?? 'ShieldHer User',
      incident_type: 'women_safety',
      platform_ref: incident!.id,
    }),
    fetch(`${process.env.SUPABASE_URL}/functions/v1/notify-guardians`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ incident_id: incident!.id, user_id: user.id }),
    }),
  ])

  // 6. Reply confirmation to user
  twiml.message(
    `🆘 ShieldHer SOS received! Police and your emergency contacts have been notified.` +
    ` Ref: ${incident!.id.slice(0, 8).toUpperCase()}. ` +
    `If you can, call 112 directly for faster response.`
  )
  return res.type('text/xml').send(twiml.toString())
}
```

### 12.4 Twilio Webhook Registration

```
In Twilio Console → Phone Numbers → Your Number → Messaging:
  A message comes in: Webhook → POST → https://api.shieldher.in/webhooks/twilio/sms

In Node.js routes:
  app.post('/webhooks/twilio/sms', handleIncomingSMS)
```

---

## 13. Multilingual Support (EN / HI / GU)

### 13.1 i18n Architecture

```
public/
  locales/
    en/ translation.json   ← English (default)
    hi/ translation.json   ← Hindi
    gu/ translation.json   ← Gujarati
```

### 13.2 Translation Keys Structure

#### `public/locales/en/translation.json`

```json
{
  "app": { "name": "ShieldHer", "tagline": "Your Digital Shield" },
  "auth": {
    "login_title": "Welcome to ShieldHer",
    "phone_label": "Mobile Number",
    "otp_sent": "OTP sent to {{phone}}",
    "verify_otp": "Verify OTP",
    "resend": "Resend OTP"
  },
  "sos": {
    "button_hold": "Hold 3 seconds for SOS",
    "button_holding": "Keep holding...",
    "activated": "🆘 SOS Activated! Police and family notified.",
    "call_112": "Call 112 Directly",
    "silent_sos": "Silent SOS",
    "voice_sos": "Voice SOS"
  },
  "zones": {
    "entering_zone": "You are entering a risk area",
    "exiting_zone": "You have safely exited the area",
    "zone_entry_4": "🔴 High Risk Area: {{zoneName}}. Stay alert!",
    "zone_entry_5": "🚨 Critical Danger Zone: {{zoneName}}. Please leave immediately.",
    "zone_exit": "✅ Safely exited {{zoneName}} ({{minutes}} mins).",
    "prolonged_stay": "⚠️ You have been in {{zoneName}} for {{minutes}} minutes. Are you safe?"
  },
  "complaint": {
    "report_crime": "Report a Crime",
    "category_select": "What happened?",
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
    "title": "Emergency Helplines",
    "police": "Police Emergency: 112",
    "cyber": "Cyber Crime: 1930",
    "women": "Women Helpline: 181"
  }
}
```

#### `public/locales/hi/translation.json`

```json
{
  "app": { "name": "शील्डहर", "tagline": "आपकी डिजिटल ढाल" },
  "auth": {
    "login_title": "शील्डहर में आपका स्वागत है",
    "phone_label": "मोबाइल नंबर",
    "otp_sent": "{{phone}} पर OTP भेजा गया",
    "verify_otp": "OTP सत्यापित करें"
  },
  "sos": {
    "button_hold": "3 सेकंड दबाएं — SOS",
    "activated": "🆘 SOS सक्रिय! पुलिस और परिवार को सूचित किया गया।",
    "call_112": "112 पर सीधे कॉल करें"
  },
  "zones": {
    "entering_zone": "आप एक जोखिम क्षेत्र में प्रवेश कर रही हैं",
    "exiting_zone": "आप सुरक्षित रूप से क्षेत्र से बाहर आ गई हैं",
    "zone_entry_4": "🔴 उच्च जोखिम क्षेत्र: {{zoneName}}। सतर्क रहें!",
    "zone_entry_5": "🚨 अत्यंत खतरनाक: {{zoneName}}। कृपया तुरंत निकल जाएं।",
    "zone_exit": "✅ {{zoneName}} सुरक्षित रूप से छोड़ा ({{minutes}} मिनट)।"
  },
  "helplines": {
    "title": "आपातकालीन हेल्पलाइन",
    "police": "पुलिस आपातकाल: 112",
    "cyber": "साइबर अपराध: 1930",
    "women": "महिला हेल्पलाइन: 181"
  }
}
```

#### `public/locales/gu/translation.json`

```json
{
  "app": { "name": "શીલ્ડહર", "tagline": "તમારી ડિજિટલ ઢાલ" },
  "auth": {
    "login_title": "શીલ્ડહરમાં આપનું સ્વાગત છે",
    "phone_label": "મોબાઇલ નંબર",
    "otp_sent": "{{phone}} પર OTP મોકલ્યો"
  },
  "sos": {
    "button_hold": "3 સેકન્ડ દબાવો — SOS",
    "activated": "🆘 SOS સક્રિય! પોલીસ અને પરિવારને જાણ કરવામાં આવી.",
    "call_112": "112 પર સીધો કૉલ કરો"
  },
  "zones": {
    "entering_zone": "તમે જોખમ ક્ષેત્રમાં પ્રવેશ કરી રહ્યા છો",
    "zone_entry_4": "🔴 ઉચ્ચ જોખમ: {{zoneName}}. સાવધ રહો!",
    "zone_exit": "✅ {{zoneName}} સુરક્ષિત રીતે છોડ્યો ({{minutes}} મિનિટ)."
  },
  "helplines": {
    "police": "પોલીસ: 112",
    "cyber": "સાઇબર ક્રાઇમ: 1930",
    "women": "મહિલા હેલ્પલાઇન: 181"
  }
}
```

---

## 14. AI Unsafe Zone Prediction Engine

### 14.1 How AI Creates New Zones

```
Every night at 2:00 AM (cron job):
        │
        ▼
Fetch past 90 days of SOS incidents + complaints with GPS data
        │
        ▼
DBSCAN clustering algorithm groups nearby incidents
        │
        ▼
For each cluster:
  - If 3+ incidents in 500m radius → potential zone
  - Calculate cluster center + radius
  - Assign risk_level based on incident count + severity
        │
        ▼
Compare with existing zones:
  - New cluster not covered by existing zone → CREATE new zone (incident_triggered, expires 48h)
  - Existing zone's risk level changed → UPDATE zone
        │
        ▼
Insert/Update danger_zones in Supabase
        │
        ▼
Clear Redis zone cache (zones_cache_key) → next request fetches fresh zones
        │
        ▼
Police Dashboard notification: "3 new unsafe zones detected by AI"
```

### 14.2 Python AI Zone Predictor

#### `shieldher-ai/app/services/zone_predictor.py`

```python
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import numpy as np
from supabase import create_client
from datetime import datetime, timedelta

def predict_unsafe_zones():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    cutoff_date = (datetime.now() - timedelta(days=90)).isoformat()

    # Fetch incidents with location data
    incidents_res = supabase.from_('sos_incidents') \
        .select('latitude, longitude, created_at') \
        .gte('created_at', cutoff_date) \
        .neq('latitude', 0) \
        .execute()

    complaints_res = supabase.from_('complaints') \
        .select('latitude:0, longitude:0') \
        .execute()  # complaints don't have GPS directly — use related SOS if any

    incidents = incidents_res.data or []
    if len(incidents) < 5:
        return []   # not enough data

    coords = np.array([[i['latitude'], i['longitude']] for i in incidents])

    # Convert degrees to radians for haversine metric
    coords_rad = np.radians(coords)

    # DBSCAN: eps=500m in radians (500 / 6371000), min_samples=3
    eps_radians = 500 / 6_371_000
    db = DBSCAN(
        eps=eps_radians,
        min_samples=3,
        algorithm='ball_tree',
        metric='haversine'
    ).fit(coords_rad)

    labels = db.labels_
    unique_labels = set(labels) - {-1}  # -1 = noise

    new_zones = []
    for label in unique_labels:
        mask = labels == label
        cluster_points = coords[mask]
        n_points = len(cluster_points)

        center_lat = float(np.mean(cluster_points[:, 0]))
        center_lng = float(np.mean(cluster_points[:, 1]))

        # Radius = max distance from center to any point + 50m buffer
        max_dist = max(
            haversine_m(center_lat, center_lng, p[0], p[1])
            for p in cluster_points
        )
        radius = int(max_dist + 50)

        # Risk level based on incident count
        if n_points >= 15:   risk_level = 5
        elif n_points >= 10: risk_level = 4
        elif n_points >= 6:  risk_level = 3
        else:                risk_level = 2

        new_zones.append({
            'name': f'AI-Detected Zone (Cluster {label + 1})',
            'description': f'AI-detected unsafe area based on {n_points} incidents in the past 90 days.',
            'center_lat': center_lat,
            'center_lng': center_lng,
            'radius_meters': max(radius, 200),  # minimum 200m radius
            'risk_level': risk_level,
            'zone_type': 'incident_triggered',
            'ai_generated': True,
            'expires_at': (datetime.now() + timedelta(hours=48)).isoformat(),
            'incident_count': n_points,
        })

    # Upsert into Supabase
    if new_zones:
        supabase.from_('danger_zones') \
            .upsert(new_zones, on_conflict='center_lat,center_lng') \
            .execute()

    return new_zones

def haversine_m(lat1, lng1, lat2, lng2):
    R = 6_371_000
    dlat = np.radians(lat2 - lat1)
    dlng = np.radians(lng2 - lng1)
    a = np.sin(dlat/2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlng/2)**2
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
```

---

## 15. Full Integration Connection Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DATA FLOW — ALL FEATURES                          │
│                                                                         │
│  USER DEVICE                  BACKEND                  EXTERNAL         │
│  ───────────                  ───────                  ────────         │
│                                                                         │
│  [GPS Location]──────────►[Location Update API]                         │
│        │                        │                                       │
│        │               [Zone Check Engine]                              │
│        │                  │          │                                  │
│        │            [ZONE ENTRY]  [ZONE EXIT]                          │
│        │                  │          │                                  │
│        │            ┌─────▼──────────▼──────┐                          │
│        │            │   zone_visits (DB)     │                          │
│        │            │   zone_alert_log (DB)  │                          │
│        │            └─────────┬─────────────┘                          │
│        │                      │                                         │
│        │              ┌───────┴──────────┐                              │
│        │          [FCM Push]         [Twilio SMS]◄──────────────►       │
│        │              │                                  Twilio         │
│  [Alert Banner]◄───────┘                                 Cloud          │
│                                                                         │
│  [SOS Button]────────────────►[SOS Trigger API]                         │
│                                    │                                    │
│                          ┌─────────┼──────────────┐                    │
│                     [ERSS 112]  [Guardians] [Police Dashboard]         │
│                          │       SMS/FCM    Realtime WS                │
│                       Twilio                                            │
│                                                                         │
│  [Voice "Bachao"]────────►[Web Speech API]                              │
│                                 │                                       │
│                           [SOS Trigger API]──────────────────────►      │
│                                                                         │
│  [SMS "SOS"]──────────────────────────────────►[Twilio Webhook]         │
│                                                       │                  │
│                                              [SOS Trigger API]          │
│                                                                         │
│  [Report Wizard]─────────►[Complaint API]                               │
│        │                       │                                        │
│  [Evidence Upload]      [Claude API] → FIR Draft                        │
│        │                [AI Service] → Risk Score                       │
│  [Supabase Storage]                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Complete Tech Stack Per Feature

| Feature | Frontend Tech | Backend Tech | Database | External APIs |
|---|---|---|---|---|
| Live Map | `@react-google-maps/api`, `framer-motion` | Reverse geocoding via Axios | `sos_incidents`, `location_stream` | Google Maps JS API, Geocoding API |
| SOS Trigger | `zustand`, `framer-motion`, `sonner` | Node.js orchestration service | `sos_incidents` | ERSS API, Twilio, FCM |
| Direct 112 Call | `tel:` href, button component | Audit log on click | `audit_log` | None (native OS) |
| Zone Alert System | `@react-google-maps/api`, Supabase Realtime | Haversine engine, node-cron | `danger_zones`, `zone_visits`, `zone_alert_log` | Twilio SMS, FCM |
| Zone Entry/Exit DB | Supabase Realtime client | PostgreSQL triggers | `zone_visits` (with computed duration_minutes) | None |
| Voice SOS | Browser Web Speech API | None needed | `sos_incidents` | None (browser native) |
| Offline SMS SOS | None | Twilio Webhook handler | `sos_incidents`, `user_zone_state` | Twilio |
| Guardian Alerts | None | Supabase Edge Function + Twilio | `guardians` | Twilio SMS/Voice |
| Multilingual | `i18next`, `react-i18next` | None | `users.preferred_language` | None |
| AI Zone Prediction | None | Python DBSCAN (scikit-learn) | `danger_zones` (ai_generated=true) | None |
| Push Notifications | Firebase SDK | `firebase-admin` | `user_fcm_tokens` | Firebase FCM |
| Heatmap | Google Maps HeatmapLayer | Analytics query | `sos_incidents` | Google Maps Visualization Library |
| Nearby Police | Google Maps Places | None | None | Google Places API |
| FIR Drafting | None | `@anthropic-ai/sdk` | `fir_drafts` | Claude API |
| Evidence Upload | `react-dropzone`, `crypto-js` | Multer, ClamAV, Supabase Storage | `evidence_files` | Supabase Storage |
| Real-time Dashboard | Supabase Realtime | PostgreSQL publication | All tables | None |

---

*ShieldHer Integrations v1.0 | KanadShield Hackathon | PS-69EEFD950B72D*
