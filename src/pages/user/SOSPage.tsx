import { useState, useEffect } from 'react';
import { Phone, EyeOff } from 'lucide-react';
import SOSButton from '../../components/sos/SOSButton';
import ActiveSOSOverlay from '../../components/sos/ActiveSOSOverlay';
import { 
  useActiveSOS, 
  store, 
  useUserCoords, 
  useDangerZones, 
  useLiveIncidents, 
  useUserProfile,
  haversineDistance
} from '../../data/store';
import SafetyMap from '../../components/map/SafetyMap';
import { t } from '../../data/translations';
import type { Language } from '../../data/translations';

export default function SOSPage() {
  const { activeSOS } = useActiveSOS();
  const sosActive = !!activeSOS;
  const [silentMode, setSilentMode] = useState(false);
  const [coords, updateCoords] = useUserCoords();
  const incidents = useLiveIncidents();
  const zones = useDangerZones();
  const [profile] = useUserProfile();
  const lang = (profile.lang || 'en') as Language;

  // Auto-drifting coordinates logic during active SOS
  useEffect(() => {
    let interval: number | undefined;
    if (sosActive && activeSOS) {
      interval = window.setInterval(() => {
        const nextCoords = {
          lat: coords.lat + (Math.random() - 0.5) * 0.0001,
          lng: coords.lng + (Math.random() - 0.5) * 0.0001
        };
        updateCoords(nextCoords);
        store.updateSOSLocation(activeSOS.id, nextCoords.lat, nextCoords.lng);
      }, 4000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [sosActive, coords, activeSOS, updateCoords]);

  const handleTrigger = (type: 'button' | 'silent' | 'voice') => {
    store.triggerSOS(type, coords);
  };

  // Compute distance to all danger zones and retrieve 3 nearest
  const nearestZones = [...zones]
    .map(zone => {
      const distance = haversineDistance(coords.lat, coords.lng, zone.center_lat, zone.center_lng);
      return { ...zone, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {sosActive && (
        <ActiveSOSOverlay onDeactivate={() => activeSOS && store.resolveSOS(activeSOS.id)} />
      )}

      {/* Header and Details */}
      <div>
        <h2 className="font-display font-bold text-2xl text-white">{t('emergency_center', lang)}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t('distress_desc', lang)}
        </p>
      </div>

      {/* Vector Interactive Map Panel */}
      <div className="relative h-72 rounded-2xl bg-slate-950 border border-slate-900 overflow-hidden shadow-inner">
        <SafetyMap
          userCoords={coords}
          incidents={incidents}
          dangerZones={zones}
          onTeleport={(lat, lng) => updateCoords({ lat, lng })}
        />
        
        {/* Floating location details overlay */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-slate-350">
              {t('gps_position', lang)}: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase">Acc. ±4m</span>
        </div>
      </div>

      {/* Geofencing Proximity Indicators */}
      <div className="bg-dark-card border border-slate-900 rounded-2xl p-4 space-y-3">
        <h3 className="font-display font-bold text-xs text-slate-550 uppercase tracking-wider px-1">
          {t('nearest_zones', lang)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {nearestZones.map((z) => (
            <div 
              key={z.id} 
              className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-xs flex flex-col justify-between gap-2.5"
            >
              <div>
                <p className="font-bold text-slate-200 line-clamp-1">{z.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{z.area} Area</p>
              </div>
              <div className="flex justify-between items-center mt-1 border-t border-slate-900/60 pt-2 shrink-0">
                <span className="font-mono text-[10px] text-slate-400 font-bold">{z.distance.toFixed(0)}m away</span>
                <span className={`text-[8.5px] font-extrabold px-2 py-0.5 border rounded uppercase ${
                  z.risk_level === 5 ? 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                    : z.risk_level === 4 ? 'text-red-400 bg-red-500/10 border-red-500/25'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                }`}>
                  Risk {z.risk_level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Trigger Button */}
      <div className="bg-dark-card border border-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
        <SOSButton onTrigger={handleTrigger} isActive={sosActive} />
        
        <div className="flex items-center gap-6 mt-4 border-t border-slate-900/60 pt-4 w-full justify-center">
          {/* Silent SOS toggle */}
          <button
            onClick={() => setSilentMode(!silentMode)}
            className={`flex items-center gap-2 py-1.5 px-3.5 rounded-lg text-xs font-semibold border transition-all ${
              silentMode
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <EyeOff className="w-4 h-4" />
            <span>{t('silent_mode', lang)}: {silentMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Speed Dial list */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-xs text-slate-500 uppercase tracking-wider px-1">
          {t('speed_dial', lang)}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: '112', label: t('pcr_emergency', lang) },
            { num: '181', label: t('abhayam_helpline', lang) },
            { num: '1091', label: t('women_distress', lang) }
          ].map((tel) => (
            <a
              key={tel.num}
              href={`tel:${tel.num}`}
              className="bg-dark-card border border-slate-900 rounded-xl p-3 text-center hover:bg-slate-900/40 transition-colors flex flex-col items-center"
            >
              <Phone className="w-4 h-4 text-brand-red mb-1.5" />
              <span className="text-sm font-bold text-slate-200">{tel.num}</span>
              <span className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap">{tel.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Mobile triple-press warning */}
      <div className="bg-slate-900/50 border border-slate-950 rounded-xl p-3 text-center">
        <p className="text-[10px] text-slate-500 leading-normal">
          💡 {t('shortcut_tip', lang)}
        </p>
      </div>
    </div>
  );
}
