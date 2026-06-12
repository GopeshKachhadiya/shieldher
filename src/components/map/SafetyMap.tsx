import { useState, useRef, useEffect } from 'react';
import { Users, Flame, X, Navigation } from 'lucide-react';
import type { DangerZone, LiveIncident } from '../../data/store';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SafetyMapProps {
  userCoords: { lat: number; lng: number };
  incidents: LiveIncident[];
  dangerZones: DangerZone[];
  showHeatmap?: boolean;
  onTeleport?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export default function SafetyMap({
  userCoords,
  incidents,
  dangerZones,
  showHeatmap = false,
  onTeleport,
  interactive = true
}: SafetyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedZone, setSelectedZone] = useState<DangerZone | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<LiveIncident | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const zoneCirclesRef = useRef<L.Circle[]>([]);
  const incidentMarkersRef = useRef<L.Marker[]>([]);
  const lastCenteredCoords = useRef<{ lat: number; lng: number } | null>(null);

  const getRiskBorderColor = (level: number) => {
    if (level === 1) return '#22c55e';
    if (level === 2) return '#84cc16';
    if (level === 3) return '#f59e0b';
    if (level === 4) return '#ef4444';
    return '#f43f5e';
  };

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true
    }).setView([userCoords.lat, userCoords.lng], 14);

    mapRef.current = map;

    // Use CartoDB Dark Matter tile layer for a sleek dark theme matching the app aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    // Map click handler to clear selected overlays
    const handleMapClick = () => {
      setSelectedZone(null);
      setSelectedIncident(null);
    };
    map.on('click', handleMapClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleMapClick);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Resize/Dimension changes
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Update user marker position and auto-center if coordinates shifted significantly (e.g. Teleport)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Custom bright blue pulsing marker matching the app's User location styles
    const userIcon = L.divIcon({
      className: 'custom-user-marker-leaflet',
      html: `
        <div class="relative flex items-center justify-center" style="width: 32px; height: 32px;">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/25 border border-blue-500/40 animate-ping" style="animation-duration: 3s;"></div>
          <div class="relative w-3.5 h-3.5 rounded-full bg-blue-500 border border-white shadow-lg"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    }

    const dist = lastCenteredCoords.current
      ? Math.sqrt(Math.pow(userCoords.lat - lastCenteredCoords.current.lat, 2) + Math.pow(userCoords.lng - lastCenteredCoords.current.lng, 2))
      : Infinity;

    // Threshold of ~0.0015 degrees (~150m) to trigger auto-centering (prevents snapping during minor drifts/active SOS jitters)
    if (dist > 0.0015) {
      map.panTo([userCoords.lat, userCoords.lng]);
      lastCenteredCoords.current = userCoords;
    }
  }, [userCoords]);

  // Update Danger Zone geofences
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old zone circles
    zoneCirclesRef.current.forEach(c => c.remove());
    zoneCirclesRef.current = [];

    // Redraw zones
    dangerZones.forEach(zone => {
      const color = getRiskBorderColor(zone.risk_level);
      const isSelected = selectedZone?.id === zone.id;

      const circle = L.circle([zone.center_lat, zone.center_lng], {
        radius: zone.radius_meters,
        color: color,
        fillColor: color,
        fillOpacity: showHeatmap ? 0.45 : (isSelected ? 0.35 : 0.18),
        weight: isSelected ? 3 : 1.5,
      }).addTo(map);

      if (interactive) {
        circle.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedZone(zone);
          setSelectedIncident(null);
        });
      }

      zoneCirclesRef.current.push(circle);
    });
  }, [dangerZones, selectedZone, interactive, showHeatmap]);

  // Update Active SOS Incident Pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old incident markers
    incidentMarkersRef.current.forEach(m => m.remove());
    incidentMarkersRef.current = [];

    // Redraw incidents
    incidents.forEach(inc => {
      if (inc.status === 'resolved') return;

      const isResponding = inc.status === 'responding';
      const isSelected = selectedIncident?.id === inc.id;
      const sizeClass = isSelected ? 'w-10 h-10' : 'w-7.5 h-7.5';
      const badgeSizeClass = isSelected ? 'w-6 h-6 text-xs' : 'w-5.5 h-5.5 text-[10px]';

      const incidentIcon = L.divIcon({
        className: 'custom-incident-marker-leaflet',
        html: `
          <div class="relative flex items-center justify-center" style="width: 40px; height: 40px;">
            <div class="absolute ${sizeClass} rounded-full ${isResponding ? 'bg-amber-500/25 border border-amber-500/40' : 'bg-red-500/25 border border-red-500/40'} animate-ping" style="animation-duration: 2s;"></div>
            <div class="relative ${badgeSizeClass} rounded-full ${isResponding ? 'bg-amber-500' : 'bg-red-500'} border border-white flex items-center justify-center text-white shadow-xl">
              ${isResponding ? '⚠️' : '🚨'}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: incidentIcon }).addTo(map);

      if (interactive) {
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedIncident(inc);
          setSelectedZone(null);
        });
      }

      incidentMarkersRef.current.push(marker);
    });
  }, [incidents, selectedIncident, interactive]);

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.setView([userCoords.lat, userCoords.lng], 15);
      lastCenteredCoords.current = userCoords;
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950/60 flex flex-col">
      {/* Map rendering layer */}
      <div ref={containerRef} className="flex-1 w-full h-full z-10" />

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        className="absolute top-3 right-3 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-2.5 text-slate-350 hover:text-white transition-all hover:bg-slate-800 shadow-xl z-[1000] cursor-pointer"
        title="Recenter Map on GPS"
      >
        <Navigation className="w-4 h-4 rotate-45" />
      </button>

      {/* Floating Info Panels (Glassmorphism overlay on top of Leaflet Z-indices) */}
      {selectedZone && (
        <div className="absolute bottom-16 left-3 right-3 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-3.5 shadow-2xl flex flex-col gap-2 z-[1000] max-w-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-[8.5px] px-2 py-0.5 rounded border font-extrabold uppercase tracking-wide ${
                selectedZone.risk_level === 5 ? 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                  : selectedZone.risk_level === 4 ? 'text-red-400 bg-red-500/10 border-red-500/25'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
              }`}>
                Risk Level {selectedZone.risk_level} / 5
              </span>
              <h4 className="font-display font-extrabold text-sm text-slate-200 mt-1">{selectedZone.name}</h4>
              <span className="text-[10px] text-slate-500 font-medium">{selectedZone.area} Area</span>
            </div>
            <button
              onClick={() => setSelectedZone(null)}
              className="p-1 hover:bg-slate-800 rounded-full text-slate-450 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <p className="text-[10.5px] text-slate-400 leading-normal">{selectedZone.description}</p>
          
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Current inside: <strong className="text-slate-200">{selectedZone.current_users_inside || 0}</strong></span>
            </div>
            {onTeleport && (
              <button
                onClick={() => {
                  onTeleport(selectedZone.center_lat, selectedZone.center_lng);
                  setSelectedZone(null);
                }}
                className="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
              >
                Teleport Here
              </button>
            )}
          </div>
        </div>
      )}

      {selectedIncident && (
        <div className="absolute bottom-16 left-3 right-3 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-3.5 shadow-2xl flex flex-col gap-2 z-[1000] max-w-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4.5 h-4.5 text-brand-red animate-pulse" />
              <div>
                <h4 className="font-display font-extrabold text-sm text-slate-200">{selectedIncident.userName}</h4>
                <span className="text-[9.5px] text-slate-500 font-mono">ID: #{selectedIncident.id}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedIncident(null)}
              className="p-1 hover:bg-slate-800 rounded-full text-slate-450 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[10.5px] border-t border-slate-800/60 pt-2 font-medium">
            <div className="flex justify-between">
              <span className="text-slate-500">Trigger Mode:</span>
              <span className="text-slate-350 capitalize font-bold">{selectedIncident.triggerType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Distress Status:</span>
              <span className={`font-bold capitalize ${selectedIncident.status === 'active' ? 'text-brand-red' : 'text-amber-400'}`}>
                {selectedIncident.status}
              </span>
            </div>
            {selectedIncident.assignedOfficerId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Unit:</span>
                <span className="text-amber-400 font-bold font-mono">{selectedIncident.assignedOfficerId}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
