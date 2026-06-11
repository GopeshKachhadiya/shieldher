import { useState, useEffect } from 'react';
import { 
  initialGuardians, 
  initialComplaints, 
  mockLiveIncidents 
} from './mockData';
import type { Guardian, Complaint, LiveIncident } from './mockData';
export type { Guardian, Complaint, LiveIncident };

export interface UserProfile {
  name: string;
  phone: string;
  lang: string;
  aadhaar?: string;
  isLoggedIn: boolean;
}

export interface DangerZone {
  id: string;
  name: string;
  description: string;
  area: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  risk_level: 1 | 2 | 3 | 4 | 5;
  zone_type: 'always_active' | 'time_based' | 'incident_triggered';
  current_users_inside: number;
}

export interface ZoneVisit {
  id: string;
  userId: string;
  zoneId: string;
  enteredAt: string;
  exitedAt?: string;
  durationMinutes?: number;
  entryLat: number;
  entryLng: number;
  exitLat?: number;
  exitLng?: number;
}

export interface ZoneAlert {
  type: 'entry' | 'exit';
  zoneName: string;
  riskLevel: number;
  message: string;
  timestamp: string;
}

// Ahmedabad City Center (CG Road) default location
export const initialDangerZones: DangerZone[] = [
  {
    id: 'zone-1',
    name: 'Kalupur Railway Station Surroundings',
    description: 'High footfall area with reports of eve-teasing and chain snatching. Risk increases significantly after 9 PM.',
    area: 'Kalupur',
    center_lat: 23.02686,
    center_lng: 72.59900,
    radius_meters: 600,
    risk_level: 4,
    zone_type: 'time_based',
    current_users_inside: 0
  },
  {
    id: 'zone-2',
    name: 'Lal Darwaja Bus Stand',
    description: 'Major bus terminal with reports of harassment in crowded conditions and poor lighting in adjacent lanes.',
    area: 'Lal Darwaja',
    center_lat: 23.02140,
    center_lng: 72.58640,
    radius_meters: 450,
    risk_level: 3,
    zone_type: 'time_based',
    current_users_inside: 0
  },
  {
    id: 'zone-3',
    name: 'Gomtipur Industrial Zone',
    description: 'Industrial zone with minimal foot traffic after factory hours. Multiple cyberstalking incidents reported from this area.',
    area: 'Gomtipur',
    center_lat: 23.01900,
    center_lng: 72.61900,
    radius_meters: 700,
    risk_level: 4,
    zone_type: 'always_active',
    current_users_inside: 0
  },
  {
    id: 'zone-4',
    name: 'Isanpur Night Market Area',
    description: 'Congested market area with reports of phone snatching and UPI fraud. Poorly lit after midnight.',
    area: 'Isanpur',
    center_lat: 22.98200,
    center_lng: 72.62450,
    radius_meters: 400,
    risk_level: 3,
    zone_type: 'time_based',
    current_users_inside: 0
  },
  {
    id: 'zone-5',
    name: 'Rakhial Road Underpass',
    description: 'Underpass with history of robbery and harassment incidents. Avoid at night. No CCTV coverage.',
    area: 'Rakhial',
    center_lat: 23.04800,
    center_lng: 72.62100,
    radius_meters: 300,
    risk_level: 5,
    zone_type: 'time_based',
    current_users_inside: 0
  },
  {
    id: 'zone-6',
    name: 'Shahpur Residential Lanes',
    description: 'Isolated residential lanes with complaints of illegal photography and blackmail. High risk after 11 PM.',
    area: 'Shahpur',
    center_lat: 23.03000,
    center_lng: 72.58100,
    radius_meters: 350,
    risk_level: 4,
    zone_type: 'time_based',
    current_users_inside: 0
  },
  {
    id: 'zone-7',
    name: 'Vatva GIDC Industrial Area',
    description: 'Remote industrial estate with poor connectivity and frequent isolation after 6 PM.',
    area: 'Vatva',
    center_lat: 22.96800,
    center_lng: 72.64200,
    radius_meters: 800,
    risk_level: 4,
    zone_type: 'time_based',
    current_users_inside: 0
  },
  {
    id: 'zone-8',
    name: 'Narol Highway Isolated Stretch',
    description: 'Long stretch of highway with minimal lighting and sparse police patrolling.',
    area: 'Narol',
    center_lat: 22.95400,
    center_lng: 72.62600,
    radius_meters: 900,
    risk_level: 3,
    zone_type: 'time_based',
    current_users_inside: 0
  },
  {
    id: 'zone-9',
    name: 'Maninagar Station Back Lanes',
    description: 'Network of poorly lit back lanes behind the railway station. Multiple snatch-and-run incidents.',
    area: 'Maninagar',
    center_lat: 22.99850,
    center_lng: 72.59870,
    radius_meters: 400,
    risk_level: 3,
    zone_type: 'always_active',
    current_users_inside: 0
  },
  {
    id: 'zone-10',
    name: 'Behrampura Isolated Block',
    description: 'AI-detected high-incident cluster. 12 complaints in past 90 days in this 500m radius.',
    area: 'Behrampura',
    center_lat: 23.00100,
    center_lng: 72.60500,
    radius_meters: 500,
    risk_level: 3,
    zone_type: 'incident_triggered',
    current_users_inside: 0
  }
];

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Default initial state
const defaultProfile: UserProfile = {
  name: 'Priya Sharma',
  phone: '+91 98765 43210',
  lang: 'en',
  aadhaar: '',
  isLoggedIn: true
};

const STORE_KEYS = {
  PROFILE: 'shieldher_profile',
  GUARDIANS: 'shieldher_guardians',
  COMPLAINTS: 'shieldher_complaints',
  LIVE_INCIDENTS: 'shieldher_live_incidents',
  ACTIVE_SOS_ID: 'shieldher_active_sos_id',
  DANGER_ZONES: 'shieldher_danger_zones',
  ZONE_VISITS: 'shieldher_zone_visits',
  ACTIVE_ZONE_ALERT: 'shieldher_active_zone_alert',
  GEOFENCING_ENABLED: 'shieldher_geofencing_enabled',
  USER_COORDS: 'shieldher_user_coords'
};

// Simple event-based pub-sub listener set for this tab
const listeners = new Set<() => void>();
const notifyListeners = () => listeners.forEach(l => l());

// Helper functions to get/set raw items in localStorage
export const getStoredItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const setStoredItem = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyListeners();
  } catch (e) {
    console.error(e);
  }
};

// Global Store State Methods
export const store = {
  getProfile: () => getStoredItem<UserProfile>(STORE_KEYS.PROFILE, defaultProfile),
  setProfile: (profile: UserProfile) => setStoredItem(STORE_KEYS.PROFILE, profile),
  
  getGuardians: () => getStoredItem<Guardian[]>(STORE_KEYS.GUARDIANS, initialGuardians),
  setGuardians: (guardians: Guardian[]) => setStoredItem(STORE_KEYS.GUARDIANS, guardians),
  
  getComplaints: () => getStoredItem<Complaint[]>(STORE_KEYS.COMPLAINTS, initialComplaints),
  setComplaints: (complaints: Complaint[]) => setStoredItem(STORE_KEYS.COMPLAINTS, complaints),
  
  getLiveIncidents: () => getStoredItem<LiveIncident[]>(STORE_KEYS.LIVE_INCIDENTS, mockLiveIncidents),
  setLiveIncidents: (incidents: LiveIncident[]) => setStoredItem(STORE_KEYS.LIVE_INCIDENTS, incidents),
  
  getActiveSOSId: () => getStoredItem<string | null>(STORE_KEYS.ACTIVE_SOS_ID, null),
  setActiveSOSId: (id: string | null) => setStoredItem(STORE_KEYS.ACTIVE_SOS_ID, id),

  // Business logic mutations
  triggerSOS: (type: 'button' | 'silent' | 'voice' | 'sms', customCoords?: { lat: number; lng: number }) => {
    const profile = store.getProfile();
    const activeId = store.getActiveSOSId();
    if (activeId) return activeId; // Already active

    const newId = `inc-${Math.floor(1000 + Math.random() * 9000)}`;
    const coords = customCoords || { lat: 23.0225, lng: 72.5714 }; // CG Road default

    const newIncident: LiveIncident = {
      id: newId,
      userName: profile.name,
      phone: profile.phone,
      latitude: coords.lat,
      longitude: coords.lng,
      accuracy: 6,
      triggerType: type,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const currentIncidents = store.getLiveIncidents();
    // Add new incident to the top
    store.setLiveIncidents([newIncident, ...currentIncidents]);
    store.setActiveSOSId(newId);
    return newId;
  },

  updateSOSLocation: (id: string, lat: number, lng: number) => {
    const incidents = store.getLiveIncidents();
    const updated = incidents.map(inc => {
      if (inc.id === id) {
        return { ...inc, latitude: lat, longitude: lng };
      }
      return inc;
    });
    store.setLiveIncidents(updated);
  },

  resolveSOS: (id: string) => {
    const incidents = store.getLiveIncidents();
    const updated = incidents.map(inc => {
      if (inc.id === id) {
        return { ...inc, status: 'resolved' as const };
      }
      return inc;
    });
    store.setLiveIncidents(updated);
    
    // Clear active SOS locally if it was ours
    const activeId = store.getActiveSOSId();
    if (activeId === id) {
      store.setActiveSOSId(null);
    }
  },

  dispatchPCR: (id: string, officerId: string = 'CC-4902') => {
    const incidents = store.getLiveIncidents();
    const updated = incidents.map(inc => {
      if (inc.id === id) {
        return { ...inc, status: 'responding' as const, assignedOfficerId: officerId };
      }
      return inc;
    });
    store.setLiveIncidents(updated);
  },

  addComplaint: (category: string, description: string, date: string, suspect: { username: string; url: string; platform: string }, evidence: { name: string; size: string; hash: string }[], generateFir: boolean) => {
    const profile = store.getProfile();
    const compId = `SH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newComplaint: Complaint = {
      id: compId,
      category,
      description,
      incidentDate: date,
      suspectInfo: {
        platform: suspect.platform,
        username: suspect.username,
        url: suspect.url
      },
      status: 'submitted',
      priority: category === 'cyberstalking' || category === 'blackmail' || category === 'deepfake' ? 'urgent' : 'normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidenceFiles: evidence.map((e, idx) => ({
        id: `ev-${Date.now()}-${idx}`,
        name: e.name,
        size: e.size,
        type: e.name.endsWith('.pdf') ? 'application/pdf' : 'image/png',
        hash: e.hash,
        url: '#',
        uploadedAt: new Date().toISOString()
      })),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'officer',
          text: `Hello ${profile.name}, we have successfully received your complaint under file reference ${compId}. An officer will be assigned shortly to review the evidence.`,
          timestamp: new Date().toISOString()
        }
      ],
      aiRiskScore: category === 'cyberstalking' ? 0.82 : category === 'deepfake' ? 0.88 : category === 'blackmail' ? 0.92 : 0.45
    };

    if (generateFir) {
      const formattedCategory = category.replace('_', ' ').toUpperCase();
      newComplaint.firNumber = `FIR/${new Date().getFullYear()}/CYBER/${Math.floor(1000 + Math.random() * 9000)}`;
      newComplaint.firDraft = {
        text: `FIRST INFORMATION REPORT\nUnder Section 154 CrPC\n\n1. District: Ahmedabad City\n2. Police Station: Cyber Crime Branch\n3. FIR Number: ${newComplaint.firNumber}\n4. Date & Time of Occurrence: ${date} (Reported: ${new Date().toLocaleDateString()})\n\n5. Details of Complainant:\n   Name: ${profile.name}\n   Contact: ${profile.phone}\n\n6. Description of Incident:\n   The complainant reports persistent cybercrime activity relating to ${formattedCategory}. The detailed breakdown of events is as follows:\n   ${description}\n\n7. Suspect Details:\n   Username: ${suspect.username || 'N/A'}\n   Platform: ${suspect.platform || 'N/A'}\n   Profile URL: ${suspect.url || 'N/A'}\n\n8. Applicable Sections:\n   - Section 354D IPC (Cyberstalking / Harassment)\n   - Section 66C Information Technology Act (Identity Theft/Impersonation)\n   - Section 66E IT Act (Violation of Privacy)`,
        ipcSections: ['Section 354D IPC', 'Section 66C IT Act', 'Section 66E IT Act']
      };
    }

    const currentComplaints = store.getComplaints();
    store.setComplaints([newComplaint, ...currentComplaints]);
    return compId;
  },

  updateComplaintStatus: (id: string, status: Complaint['status']) => {
    const complaints = store.getComplaints();
    const updated = complaints.map(c => {
      if (c.id === id) {
        let assignedOfficer = c.assignedOfficer;
        if (status === 'assigned' || status === 'investigating') {
          assignedOfficer = {
            name: 'Inspector M. Patel',
            badgeNumber: 'CC-4902',
            rank: 'Senior Investigator',
            phone: '+91 79263 01930'
          };
        }
        
        // Push notification message in chat thread
        const systemMsg = {
          id: `msg-${Date.now()}`,
          sender: 'officer' as const,
          text: `Notice: Case status has been updated to "${status.replace('_', ' ').toUpperCase()}".`,
          timestamp: new Date().toISOString()
        };

        return { 
          ...c, 
          status, 
          assignedOfficer,
          updatedAt: new Date().toISOString(),
          messages: [...c.messages, systemMsg]
        };
      }
      return c;
    });
    store.setComplaints(updated);
  },

  addComplaintMessage: (complaintId: string, sender: 'user' | 'officer', text: string) => {
    const complaints = store.getComplaints();
    const updated = complaints.map(c => {
      if (c.id === complaintId) {
        return {
          ...c,
          updatedAt: new Date().toISOString(),
          messages: [
            ...c.messages,
            {
              id: `msg-${Date.now()}`,
              sender,
              text,
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return c;
    });
    store.setComplaints(updated);
  },

  finalizeFIR: (complaintId: string, text: string) => {
    const complaints = store.getComplaints();
    const updated = complaints.map(c => {
      if (c.id === complaintId) {
        const firNum = c.firNumber || `FIR/${new Date().getFullYear()}/CYBER/${Math.floor(1000 + Math.random() * 9000)}`;
        return {
          ...c,
          status: 'investigating' as const,
          firNumber: firNum,
          updatedAt: new Date().toISOString(),
          firDraft: {
            text,
            ipcSections: c.firDraft?.ipcSections || ['Section 354D IPC', 'Section 66C IT Act']
          }
        };
      }
      return c;
    });
    store.setComplaints(updated);
  },

  getDangerZones: () => getStoredItem<DangerZone[]>(STORE_KEYS.DANGER_ZONES, initialDangerZones),
  setDangerZones: (zones: DangerZone[]) => setStoredItem(STORE_KEYS.DANGER_ZONES, zones),
  
  getZoneVisits: () => getStoredItem<ZoneVisit[]>(STORE_KEYS.ZONE_VISITS, []),
  setZoneVisits: (visits: ZoneVisit[]) => setStoredItem(STORE_KEYS.ZONE_VISITS, visits),
  
  getActiveZoneAlert: () => getStoredItem<ZoneAlert | null>(STORE_KEYS.ACTIVE_ZONE_ALERT, null),
  setActiveZoneAlert: (alert: ZoneAlert | null) => setStoredItem(STORE_KEYS.ACTIVE_ZONE_ALERT, alert),
  
  getGeofencingEnabled: () => getStoredItem<boolean>(STORE_KEYS.GEOFENCING_ENABLED, true),
  setGeofencingEnabled: (enabled: boolean) => setStoredItem(STORE_KEYS.GEOFENCING_ENABLED, enabled),

  getUserCoords: () => getStoredItem<{ lat: number; lng: number }>(STORE_KEYS.USER_COORDS, { lat: 23.0225, lng: 72.5714 }),
  setUserCoords: (coords: { lat: number; lng: number }) => {
    setStoredItem(STORE_KEYS.USER_COORDS, coords);
    store.updateUserLocation(coords.lat, coords.lng);
  },

  updateProfileLanguage: (lang: string) => {
    const profile = store.getProfile();
    store.setProfile({ ...profile, lang });
  },

  simulateIncomingSMS: (phone: string, message: string) => {
    const coords = store.getUserCoords();
    const cleanPhone = phone.trim();
    console.log(`[Twilio Webhook] Incoming SMS from ${cleanPhone}: "${message}"`);
    
    // Trigger SOS in the store
    const sosId = store.triggerSOS('sms', coords);
    
    return {
      success: true,
      sosId,
      replyMessage: `🆘 ShieldHer SOS received! Police and emergency contacts have been notified. Ref: ${sosId}.`
    };
  },

  updateUserLocation: (lat: number, lng: number) => {
    if (!store.getGeofencingEnabled()) return;

    const zones = store.getDangerZones();
    const visits = store.getZoneVisits();
    const profile = store.getProfile();

    const insideZones: DangerZone[] = [];
    
    zones.forEach(zone => {
      const dist = haversineDistance(lat, lng, zone.center_lat, zone.center_lng);
      if (dist <= zone.radius_meters) {
        insideZones.push(zone);
      }
    });

    const activeVisits = visits.filter(v => !v.exitedAt);

    // 1. Process entries
    insideZones.forEach(zone => {
      const isAlreadyVisiting = activeVisits.some(v => v.zoneId === zone.id);
      if (!isAlreadyVisiting) {
        const visitId = `visit-${Math.floor(1000 + Math.random() * 9000)}`;
        const newVisit: ZoneVisit = {
          id: visitId,
          userId: 'user-priya',
          zoneId: zone.id,
          enteredAt: new Date().toISOString(),
          entryLat: lat,
          entryLng: lng
        };
        visits.push(newVisit);

        // Update zone occupancy
        zone.current_users_inside = (zone.current_users_inside || 0) + 1;

        // Set entry warning alert banner
        let localizedMsg = '';
        if (zone.risk_level === 3) {
          localizedMsg = profile.lang === 'hi' ? `सावधानी: आप ${zone.name} (जोखिम क्षेत्र) में प्रवेश कर रही हैं।`
            : profile.lang === 'gu' ? `સાવચેતી: તમે ${zone.name} (જોખમી વિસ્તાર) માં પ્રવેશ કરી રહ્યા છો.`
            : `Caution: You are entering ${zone.name}, a known risk area. Share your location.`;
        } else if (zone.risk_level === 4) {
          localizedMsg = profile.lang === 'hi' ? `🔴 खतरनाक क्षेत्र: आपने ${zone.name} में प्रवेश किया है। अभिभावकों और पुलिस को सूचित कर दिया गया है।`
            : profile.lang === 'gu' ? `🔴 જોખમી વિસ્તાર: તમે ${zone.name} માં પ્રવેશ કર્યો છે. વાલીઓ અને પોલીસને જાણ કરી છે.`
            : `🔴 HIGH RISK AREA: Entered ${zone.name}. Guardians and police notified. Stay alert!`;
        } else {
          localizedMsg = profile.lang === 'hi' ? `🚨 अत्यंत खतरनाक: आपने ${zone.name} में प्रवेश किया है। कृपया तुरंत बाहर निकलें या SOS दबाएं!`
            : profile.lang === 'gu' ? `🚨 અત્યંત જોખમી: તમે ${zone.name} માં પ્રવેશ કર્યો છે. તરત જ બહાર નીકળો અથવા SOS દબાવો!`
            : `🚨 CRITICAL ZONE: Entered ${zone.name}. High danger area. Leave immediately or trigger SOS!`;
        }

        store.setActiveZoneAlert({
          type: 'entry',
          zoneName: zone.name,
          riskLevel: zone.risk_level,
          message: localizedMsg,
          timestamp: new Date().toISOString()
        });

        // Trigger simulated Twilio SMS to guardians if risk >= 4
        if (zone.risk_level >= 4) {
          console.warn(`[TWILIO SMS] Alert: ${profile.name} entered danger zone: ${zone.name}.`);
        }
      }
    });

    // 2. Process exits
    activeVisits.forEach(visit => {
      const isStillInside = insideZones.some(z => z.id === visit.zoneId);
      if (!isStillInside) {
        const zoneIndex = zones.findIndex(z => z.id === visit.zoneId);
        const zone = zones[zoneIndex];
        visit.exitedAt = new Date().toISOString();
        visit.exitLat = lat;
        visit.exitLng = lng;
        
        const durationMs = new Date(visit.exitedAt).getTime() - new Date(visit.enteredAt).getTime();
        visit.durationMinutes = Math.max(1, Math.round(durationMs / 60000));

        if (zone) {
          zone.current_users_inside = Math.max(0, (zone.current_users_inside || 1) - 1);
          
          const localizedMsg = profile.lang === 'hi' ? `✅ सुरक्षित निकास: आप ${zone.name} से बाहर आ गई हैं।`
            : profile.lang === 'gu' ? `✅ સુરક્ષિત નિકાસ: તમે ${zone.name} માંથી બહાર નીકળી ગયા છો.`
            : `✅ Safe exit: You have left ${zone.name}. Stay safe!`;

          store.setActiveZoneAlert({
            type: 'exit',
            zoneName: zone.name,
            riskLevel: zone.risk_level,
            message: localizedMsg,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    store.setDangerZones(zones);
    store.setZoneVisits(visits);
  }
};

// React Reactive Hooks
export function useUserProfile() {
  const [profile, setProfileState] = useState(() => store.getProfile());

  useEffect(() => {
    const handler = () => setProfileState(store.getProfile());
    listeners.add(handler);
    window.addEventListener('storage', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const updateProfile = (newProfile: UserProfile) => {
    store.setProfile(newProfile);
  };

  return [profile, updateProfile] as const;
}

export function useGuardians() {
  const [guardians, setGuardiansState] = useState(() => store.getGuardians());

  useEffect(() => {
    const handler = () => setGuardiansState(store.getGuardians());
    listeners.add(handler);
    window.addEventListener('storage', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const updateGuardians = (newGuardians: Guardian[]) => {
    store.setGuardians(newGuardians);
  };

  return [guardians, updateGuardians] as const;
}

export function useComplaints() {
  const [complaints, setComplaintsState] = useState(() => store.getComplaints());

  useEffect(() => {
    const handler = () => setComplaintsState(store.getComplaints());
    listeners.add(handler);
    window.addEventListener('storage', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return complaints;
}

export function useLiveIncidents() {
  const [incidents, setIncidentsState] = useState(() => store.getLiveIncidents());

  useEffect(() => {
    const handler = () => setIncidentsState(store.getLiveIncidents());
    listeners.add(handler);
    window.addEventListener('storage', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return incidents;
}

export function useActiveSOS() {
  const [activeSOSId, setActiveSOSIdState] = useState(() => store.getActiveSOSId());
  const incidents = useLiveIncidents();

  useEffect(() => {
    const handler = () => setActiveSOSIdState(store.getActiveSOSId());
    listeners.add(handler);
    window.addEventListener('storage', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const activeSOS = incidents.find(inc => inc.id === activeSOSId) || null;

  return { activeSOSId, activeSOS };
}

export function useDangerZones() {
  const [zones, setZonesState] = useState(() => store.getDangerZones());

  useEffect(() => {
    const handler = () => setZonesState(store.getDangerZones());
    listeners.add(handler);
    window.addEventListener('storage', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return zones;
}

export function useZoneVisits() {
  const [visits, setVisitsState] = useState(() => store.getZoneVisits());

  useEffect(() => {
    const handler = () => setVisitsState(store.getZoneVisits());
    listeners.add(handler);
    window.addEventListener('storage', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return visits;
}

export function useActiveZoneAlert() {
  const [alert, setAlertState] = useState(() => store.getActiveZoneAlert());

  useEffect(() => {
    const handler = () => setAlertState(store.getActiveZoneAlert());
    listeners.add(handler);
    window.addEventListener('storage', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const clearAlert = () => store.setActiveZoneAlert(null);

  return [alert, clearAlert] as const;
}

export function useGeofencingEnabled() {
  const [enabled, setEnabledState] = useState(() => store.getGeofencingEnabled());

  useEffect(() => {
    const handler = () => setEnabledState(store.getGeofencingEnabled());
    listeners.add(handler);
    window.addEventListener('storage', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const toggleGeofencing = (val: boolean) => store.setGeofencingEnabled(val);

  return [enabled, toggleGeofencing] as const;
}

export function useUserCoords() {
  const [coords, setCoordsState] = useState(() => store.getUserCoords());

  useEffect(() => {
    const handler = () => setCoordsState(store.getUserCoords());
    listeners.add(handler);
    window.addEventListener('storage', handler);
    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const updateCoords = (c: { lat: number; lng: number }) => store.setUserCoords(c);

  return [coords, updateCoords] as const;
}
