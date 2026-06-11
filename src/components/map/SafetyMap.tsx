import { useState, useRef, useEffect } from 'react';
import { Users, Flame, X } from 'lucide-react';
import type { DangerZone, LiveIncident } from '../../data/store';

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
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [selectedZone, setSelectedZone] = useState<DangerZone | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<LiveIncident | null>(null);

  // Bounds for Ahmedabad plotting
  const bounds = {
    north: 23.1200,
    south: 22.9200,
    west: 72.4500,
    east: 72.7000
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: Math.max(300, entry.contentRect.width),
          height: Math.max(250, entry.contentRect.height)
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Map lat/lng coordinates to SVG x/y canvas pixels
  const getXY = (lat: number, lng: number) => {
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * dimensions.width;
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * dimensions.height;
    return { x, y };
  };

  const getRiskColor = (level: number) => {
    if (level === 1) return 'rgba(34, 197, 94, 0.4)'; // Green
    if (level === 2) return 'rgba(132, 204, 22, 0.4)'; // Lime
    if (level === 3) return 'rgba(245, 158, 11, 0.4)'; // Amber
    if (level === 4) return 'rgba(239, 68, 68, 0.45)'; // Red
    return 'rgba(225, 29, 72, 0.6)'; // Crimson/Critical
  };

  const getRiskBorderColor = (level: number) => {
    if (level === 1) return '#22c55e';
    if (level === 2) return '#84cc16';
    if (level === 3) return '#f59e0b';
    if (level === 4) return '#ef4444';
    return '#f43f5e';
  };

  // Convert danger zone radius in meters to SVG map pixels
  const getRadiusInPixels = (radiusMeters: number) => {
    // 1 degree longitude at Ahmedabad latitude is roughly 102.5 km (102500 meters)
    const longitudeSpanMeters = (bounds.east - bounds.west) * 102500;
    const pixelsPerMeter = dimensions.width / longitudeSpanMeters;
    return radiusMeters * pixelsPerMeter;
  };

  const userPos = getXY(userCoords.lat, userCoords.lng);

  // SVG shapes for Ahmedabad landmarks
  const renderLandmarks = () => {
    const riverPoints = [
      { lat: 23.1200, lng: 72.5800 },
      { lat: 23.0800, lng: 72.5850 },
      { lat: 23.0500, lng: 72.5700 },
      { lat: 23.0200, lng: 72.5600 },
      { lat: 22.9700, lng: 72.5750 },
      { lat: 22.9200, lng: 72.5900 }
    ].map(p => getXY(p.lat, p.lng));

    const pathD = `M ${riverPoints[0].x} ${riverPoints[0].y} ` + 
      riverPoints.slice(1).map(p => `S ${p.x} ${p.y}, ${p.x} ${p.y}`).join(' ');

    const highwayPoints = [
      { lat: 23.1200, lng: 72.5400 },
      { lat: 23.0500, lng: 72.5410 },
      { lat: 22.9800, lng: 72.5420 },
      { lat: 22.9200, lng: 72.5600 }
    ].map(p => getXY(p.lat, p.lng));

    const highwayD = `M ${highwayPoints[0].x} ${highwayPoints[0].y} ` +
      highwayPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

    const vastrapurLake = getXY(23.0338, 72.5250);
    const ashramRoadStart = getXY(23.0800, 72.5720);
    const ashramRoadEnd = getXY(22.9800, 72.5730);

    return (
      <g opacity="0.3">
        {/* Sabarmati River */}
        <path
          d={pathD}
          fill="none"
          stroke="#1e2e4f"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={pathD}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        {/* SG Highway */}
        <path
          d={highwayD}
          fill="none"
          stroke="#334155"
          strokeWidth="2.5"
          strokeDasharray="4 4"
        />
        {/* River Label */}
        <text
          x={riverPoints[2].x - 45}
          y={riverPoints[2].y}
          fill="#38bdf8"
          fontSize="9"
          fontWeight="bold"
          opacity="0.8"
          className="font-sans tracking-widest uppercase"
          transform={`rotate(-75, ${riverPoints[2].x - 45}, ${riverPoints[2].y})`}
        >
          Sabarmati River
        </text>
        {/* SG Highway Label */}
        <text
          x={highwayPoints[1].x - 10}
          y={highwayPoints[1].y + 30}
          fill="#94a3b8"
          fontSize="8"
          fontWeight="bold"
          opacity="0.8"
          className="font-sans tracking-wide"
          transform={`rotate(-85, ${highwayPoints[1].x - 10}, ${highwayPoints[1].y + 30})`}
        >
          SG Highway
        </text>
        {/* Vastrapur Lake */}
        <circle cx={vastrapurLake.x} cy={vastrapurLake.y} r="10" fill="#0284c7" />
        <text x={vastrapurLake.x + 14} y={vastrapurLake.y + 3} fill="#94a3b8" fontSize="8" fontWeight="bold">Vastrapur</text>
        {/* Ashram Road */}
        <line x1={ashramRoadStart.x} y1={ashramRoadStart.y} x2={ashramRoadEnd.x} y2={ashramRoadEnd.y} stroke="#1e293b" strokeWidth="1.5" />
      </g>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950/60 flex flex-col">
      {/* Visual map layer */}
      <svg className="flex-1 w-full h-full select-none" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
        {/* Grid pattern overlay */}
        <defs>
          <pattern id="mapGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(51, 65, 85, 0.12)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapGrid)" />

        {/* Major geographical landmarks */}
        {renderLandmarks()}

        {/* Heatmap Overlay Simulation */}
        {showHeatmap && (
          <g opacity="0.6">
            {dangerZones.map(zone => {
              const pos = getXY(zone.center_lat, zone.center_lng);
              const r = getRadiusInPixels(zone.radius_meters) * 1.5;
              return (
                <circle
                  key={`heat-${zone.id}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill={`url(#grad-${zone.id})`}
                />
              );
            })}
            <defs>
              {dangerZones.map(zone => {
                const color = getRiskBorderColor(zone.risk_level);
                return (
                  <radialGradient id={`grad-${zone.id}`} key={`def-${zone.id}`}>
                    <stop offset="0%" stopColor={color} stopOpacity="0.45" />
                    <stop offset="50%" stopColor={color} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </radialGradient>
                );
              })}
            </defs>
          </g>
        )}

        {/* Shaded Danger Geofences */}
        {dangerZones.map(zone => {
          const pos = getXY(zone.center_lat, zone.center_lng);
          const r = getRadiusInPixels(zone.radius_meters);
          const isSelected = selectedZone?.id === zone.id;
          
          return (
            <g key={zone.id} className="cursor-pointer">
              {/* Pulsing glow ring for level 4/5 zones */}
              {zone.risk_level >= 4 && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={r}
                  fill="none"
                  stroke={getRiskBorderColor(zone.risk_level)}
                  strokeWidth="1.5"
                  className="animate-ping"
                  style={{ animationDuration: zone.risk_level === 5 ? '2.5s' : '4s', opacity: 0.15 }}
                />
              )}
              {/* Outer geofence boundary */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={getRiskColor(zone.risk_level)}
                stroke={getRiskBorderColor(zone.risk_level)}
                strokeWidth={isSelected ? '2.5' : '1.2'}
                opacity={isSelected ? 0.95 : 0.8}
                onClick={() => {
                  if (interactive) {
                    setSelectedZone(zone);
                    setSelectedIncident(null);
                  }
                }}
                className="transition-all hover:opacity-100"
              />
            </g>
          );
        })}

        {/* SOS Incident Pins */}
        {incidents.map(inc => {
          if (inc.status === 'resolved') return null;
          const pos = getXY(inc.latitude, inc.longitude);
          const isSelected = selectedIncident?.id === inc.id;
          const isResponding = inc.status === 'responding';
          
          return (
            <g 
              key={inc.id} 
              className="cursor-pointer"
              onClick={() => {
                if (interactive) {
                  setSelectedIncident(inc);
                  setSelectedZone(null);
                }
              }}
            >
              {/* Ring pulse */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isSelected ? 22 : 14}
                fill="none"
                stroke={isResponding ? '#f59e0b' : '#ef4444'}
                strokeWidth="2"
                className="animate-ping"
              />
              {/* Pin body */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isSelected ? 9 : 6.5}
                fill={isResponding ? '#f59e0b' : '#ef4444'}
                stroke="#ffffff"
                strokeWidth="1.5"
                className="shadow-lg"
              />
            </g>
          );
        })}

        {/* User Current Position (Blue pulse) */}
        <g>
          <circle
            cx={userPos.x}
            cy={userPos.y}
            r="16"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            className="animate-ping"
            style={{ animationDuration: '3s' }}
          />
          <circle
            cx={userPos.x}
            cy={userPos.y}
            r="6"
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="shadow-lg"
          />
        </g>
      </svg>

      {/* Floating Info Panels (Glassmorphism overlay) */}
      {selectedZone && (
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3.5 shadow-2xl flex flex-col gap-2 z-30 max-w-sm">
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
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3.5 shadow-2xl flex flex-col gap-2 z-30 max-w-sm">
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
