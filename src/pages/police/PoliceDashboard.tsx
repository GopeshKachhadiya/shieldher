import { useState } from 'react';
import { 
  Radio, ShieldCheck, MapPin, UserCheck, Flame, CheckCircle, Users
} from 'lucide-react';
import { useLiveIncidents, useDangerZones, useUserCoords, store } from '../../data/store';
import SafetyMap from '../../components/map/SafetyMap';

export default function PoliceDashboard() {
  const incidents = useLiveIncidents();
  const zones = useDangerZones();
  const [userCoords] = useUserCoords();

  const [selectedIncId, setSelectedIncId] = useState<string | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  const selectedInc = incidents.find(i => i.id === selectedIncId) || incidents[0] || null;

  // Dispatch Unit Action Mock
  const handleDispatch = (id: string) => {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;

    if (inc.status === 'active') {
      store.dispatchPCR(id);
    } else if (inc.status === 'responding') {
      store.resolveSOS(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-500/10 border-red-500/25 text-brand-red font-bold animate-pulse';
      case 'responding':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-400 font-bold';
      case 'resolved':
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-bold';
      default:
        return 'bg-slate-500/10 border-slate-500/25 text-slate-400';
    }
  };

  const activeCount = incidents.filter(i => i.status === 'active').length;
  const respondingCount = incidents.filter(i => i.status === 'responding').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active SOS Pings', val: `${activeCount} Alarms`, icon: Flame, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
          { label: 'Units Responding', val: `${respondingCount} En Route`, icon: Radio, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
          { label: 'Resolved SOS (Today)', val: `${resolvedCount} Closed`, icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Avg Dispatch Time', val: '3m 42s', icon: UserCheck, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-dark-card border border-slate-900 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{kpi.label}</span>
                <span className="text-lg font-display font-extrabold text-slate-200 mt-1 block">{kpi.val}</span>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[500px]">
        {/* Left List (Live Emergency Feed - 5 Columns) */}
        <div className="lg:col-span-5 bg-dark-card border border-slate-900 rounded-xl flex flex-col overflow-hidden h-[500px]">
          <div className="p-4 border-b border-slate-900 flex items-center justify-between shrink-0">
            <h3 className="font-display font-bold text-xs text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-4.5 h-4.5 text-brand-red animate-pulse" />
              <span>Live Emergency Feed</span>
            </h3>
            <span className="text-[10px] bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full text-brand-red font-bold animate-pulse">
              {activeCount} active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {incidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => setSelectedIncId(inc.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer hover:border-slate-800 ${
                  selectedInc?.id === inc.id
                    ? 'bg-slate-900/40 border-brand-red shadow-lg shadow-brand-red/5'
                    : 'bg-slate-950/20 border-slate-900 text-slate-400'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <h4 className="text-xs font-bold text-slate-200">{inc.userName}</h4>
                  <span className={`text-[8.5px] px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${getStatusBadge(inc.status)}`}>
                    {inc.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-sans">
                  <span>Trigger: <strong className="text-slate-400 capitalize">{inc.triggerType}</strong></span>
                  <span className="font-mono">{new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Map (Vector Safety Map - 7 Columns) */}
        <div className="lg:col-span-7 bg-dark-card border border-slate-900 rounded-xl overflow-hidden h-[500px] flex flex-col relative">
          {/* Map Header Controls */}
          <div className="p-3 border-b border-slate-900 flex justify-between items-center bg-slate-950/20 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-red" />
              <span className="text-xs font-bold text-slate-350">GPS Dispatch Grid (Ahmedabad)</span>
            </div>
            
            {/* Heatmap filter trigger */}
            <button
              onClick={() => setHeatmapEnabled(!heatmapEnabled)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                heatmapEnabled
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Heatmap Overlay: {heatmapEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Interactive vector map */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
            <SafetyMap
              userCoords={userCoords}
              incidents={incidents}
              dangerZones={zones}
              showHeatmap={heatmapEnabled}
            />

            {/* Incident details popup if selected */}
            {selectedInc && (
              <div className="absolute bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-3.5 shadow-2xl w-60 z-20 top-4 left-4 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-[10px] text-slate-550 font-extrabold uppercase font-sans">Target profile</span>
                  <span className="text-[9px] font-bold text-slate-400 font-mono">#{selectedInc.id}</span>
                </div>
                <div className="text-xs space-y-1 font-sans">
                  <h4 className="font-bold text-slate-200">{selectedInc.userName}</h4>
                  <p className="text-slate-400 font-mono text-[10px]">{selectedInc.phone}</p>
                  <p className="text-slate-500 text-[10px] flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    <span>Coordinates: {selectedInc.latitude.toFixed(5)}, {selectedInc.longitude.toFixed(5)}</span>
                  </p>
                </div>

                <div className="flex gap-1.5 pt-2 border-t border-slate-800/60">
                  {selectedInc.status !== 'resolved' ? (
                    <button
                      onClick={() => handleDispatch(selectedInc.id)}
                      className={`flex-1 text-[10px] font-bold py-1.5 rounded transition-all cursor-pointer text-center uppercase tracking-wider ${
                        selectedInc.status === 'active'
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-sans'
                          : 'bg-emerald-500 text-white hover:bg-emerald-450 font-sans'
                      }`}
                    >
                      {selectedInc.status === 'active' ? 'Dispatch PCR' : 'Resolve SOS'}
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 py-1.5 rounded uppercase font-sans">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Alarm Resolved</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone Live Occupancy Monitor Table */}
      <div className="bg-dark-card border border-slate-900 rounded-xl overflow-hidden p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-slate-550" />
              <span>Danger Zone Live Monitor</span>
            </h3>
            <p className="text-[11px] text-slate-550 mt-0.5">Real-time occupancy tracking and hazard listings for Ahmedabad grids</p>
          </div>
          <span className="text-[10px] bg-slate-950/80 border border-slate-900 px-3 py-1 rounded text-slate-400 font-bold">
            Total Seeded Zones: {zones.length}
          </span>
        </div>

        <div className="overflow-x-auto w-full border border-slate-900 rounded-xl bg-slate-950/20">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-900 text-slate-550 uppercase tracking-widest text-[9.5px] font-extrabold">
                <th className="p-3">Zone Grid Name</th>
                <th className="p-3">Locality</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Zone Classification</th>
                <th className="p-3 text-center">Active Citizens Inside</th>
                <th className="p-3 text-right">Patrol Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 text-slate-350">
              {zones.map((zone) => {
                const hasPeople = zone.current_users_inside > 0;
                return (
                  <tr 
                    key={zone.id} 
                    className={`transition-colors hover:bg-slate-900/10 ${hasPeople ? 'bg-red-500/5' : ''}`}
                  >
                    <td className="p-3 font-semibold text-slate-200">
                      <div className="flex flex-col">
                        <span>{zone.name}</span>
                        <span className="text-[9.5px] text-slate-550 font-normal leading-relaxed mt-0.5 max-w-[320px]">{zone.description}</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-slate-400">{zone.area}</td>
                    <td className="p-3">
                      <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                        zone.risk_level === 5 ? 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                          : zone.risk_level === 4 ? 'text-red-400 bg-red-500/10 border-red-500/25'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                      }`}>
                        Level {zone.risk_level}
                      </span>
                    </td>
                    <td className="p-3 capitalize text-[10.5px] text-slate-450 font-medium">{zone.zone_type.replace('_', ' ')}</td>
                    <td className="p-3 text-center font-bold font-mono">
                      <span className={`px-2.5 py-1 rounded text-xs ${hasPeople ? 'bg-red-500 text-white animate-pulse font-extrabold' : 'text-slate-500 bg-slate-900/40'}`}>
                        {zone.current_users_inside || 0}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          alert(`[Simulation] Dispatched Cyber-PCR units to coordinate: ${zone.center_lat}, ${zone.center_lng} (${zone.name})`);
                        }}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                      >
                        Send Patrol
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
