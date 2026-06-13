import { useState, useEffect } from 'react';
import { 
  Users, MapPin, ShieldAlert, ShieldCheck, AlertTriangle, 
  Search, History, Clock, Navigation
} from 'lucide-react';
import { 
  useMonitoredGirls, useDangerZones, useLiveIncidents 
} from '../../data/store';
import SafetyMap from '../../components/map/SafetyMap';


export default function CitizenTrackerPage() {
  const [monitoredGirls, updateGirlLocation, triggerGirlSOS] = useMonitoredGirls();
  const dangerZones = useDangerZones();
  const incidents = useLiveIncidents();

  // Active City Selector: 'ahmedabad' | 'surat'
  const [activeCity, setActiveCity] = useState<'ahmedabad' | 'surat'>('ahmedabad');
  
  // Selected Girl ID
  const [selectedGirlId, setSelectedGirlId] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Predefined locations for simulation
  const ahmedabadLocations = [
    { name: 'Vastrapur Lake (Safe Area)', lat: 23.0338, lng: 72.5250, isSafe: true },
    { name: 'Kalupur Station (Red Zone)', lat: 23.02686, lng: 72.59900, isSafe: false },
    { name: 'Rakhial Underpass (Critical Zone)', lat: 23.04800, lng: 72.62100, isSafe: false },
    { name: 'Gomtipur Industrial (Red Zone)', lat: 23.01900, lng: 72.61900, isSafe: false },
    { name: 'Behrampura Block (Orange Zone)', lat: 23.00100, lng: 72.60500, isSafe: false }
  ];

  const suratLocations = [
    { name: 'Vesu Residential (Safe Area)', lat: 21.1350, lng: 72.7850, isSafe: true },
    { name: 'Surat Station (Red Zone)', lat: 21.2050, lng: 72.8400, isSafe: false },
    { name: 'Dumas Beach Stretch (Red Zone)', lat: 21.0750, lng: 72.7150, isSafe: false },
    { name: 'Chowk Bazaar Market (Orange Zone)', lat: 21.1980, lng: 72.8170, isSafe: false },
    { name: 'Adajan Isolated Lanes (Red Zone)', lat: 21.1850, lng: 72.7950, isSafe: false }
  ];

  const simulationLocations = activeCity === 'ahmedabad' ? ahmedabadLocations : suratLocations;

  // Filter girls based on the active city and search term
  // Ahmedabad: lat > 22.0, Surat: lat < 22.0
  const filteredGirls = monitoredGirls.filter(girl => {
    const isCityMatch = activeCity === 'ahmedabad' ? girl.latitude > 22.0 : girl.latitude < 22.0;
    const isSearchMatch = girl.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          girl.phone.includes(searchTerm);
    return isCityMatch && isSearchMatch;
  });

  // Calculate stats for the active city
  const cityGirls = monitoredGirls.filter(girl => activeCity === 'ahmedabad' ? girl.latitude > 22.0 : girl.latitude < 22.0);
  const totalCount = cityGirls.length;
  const safeCount = cityGirls.filter(g => g.status === 'safe').length;
  const warningCount = cityGirls.filter(g => g.status === 'warning').length;
  const dangerCount = cityGirls.filter(g => g.status === 'danger').length;

  const selectedGirl = monitoredGirls.find(g => g.id === selectedGirlId) || null;

  // If active city changes, set selectedGirlId to first girl of that city or null
  useEffect(() => {
    const cityGirlsList = monitoredGirls.filter(girl => activeCity === 'ahmedabad' ? girl.latitude > 22.0 : girl.latitude < 22.0);
    if (cityGirlsList.length > 0) {
      setSelectedGirlId(cityGirlsList[0].id);
    } else {
      setSelectedGirlId(null);
    }
  }, [activeCity]);

  // Center coordinate for the map based on selected city
  const cityCenter = activeCity === 'ahmedabad' 
    ? { lat: 23.0225, lng: 72.5714 } // Ahmedabad Center
    : { lat: 21.1702, lng: 72.8311 }; // Surat Center

  // User Coords for safety map
  const mapCenter = selectedGirl 
    ? { lat: selectedGirl.latitude, lng: selectedGirl.longitude }
    : cityCenter;

  const handleSimulateMove = (lat: number, lng: number) => {
    if (selectedGirlId) {
      updateGirlLocation(selectedGirlId, lat, lng);
    }
  };

  const handleTriggerSOS = () => {
    if (selectedGirlId) {
      triggerGirlSOS(selectedGirlId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-bold';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-400 font-bold animate-pulse';
      case 'danger':
        return 'bg-red-500/10 border-red-500/25 text-brand-red font-bold animate-pulse border glowing-red-orb';
      default:
        return 'bg-slate-500/10 border-slate-500/25 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-white">Live Citizen Safety Tracker</h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Real-time GPS tracking, geofence monitoring, and dwell time analysis for women safety dispatch units
          </p>
        </div>

        {/* City Toggle Buttons */}
        <div className="flex bg-slate-950 border border-slate-900 rounded-xl p-1 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveCity('ahmedabad')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeCity === 'ahmedabad'
                ? 'bg-brand-red text-white shadow shadow-brand-red/10'
                : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            Ahmedabad District
          </button>
          <button
            onClick={() => setActiveCity('surat')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeCity === 'surat'
                ? 'bg-brand-red text-white shadow shadow-brand-red/10'
                : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            Surat District
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: `Monitored in ${activeCity === 'ahmedabad' ? 'Ahmedabad' : 'Surat'}`, val: `${totalCount} Citizens`, icon: Users, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
          { label: 'Confirmed Safe', val: `${safeCount} Active`, icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Inside Danger Zones', val: `${warningCount} Warning`, icon: AlertTriangle, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
          { label: 'Active SOS Distress', val: `${dangerCount} Critical`, icon: ShieldAlert, color: 'text-red-500 bg-red-500/10 border-red-500/20' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-dark-card border border-slate-900 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">{kpi.label}</span>
                <span className="text-lg font-display font-extrabold text-slate-200 mt-1 block">{kpi.val}</span>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[600px]">
        {/* Left Side: Directory & Details (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Citizen List */}
          <div className="bg-dark-card border border-slate-900 rounded-xl flex flex-col h-[320px]">
            <div className="p-3.5 border-b border-slate-900 flex items-center justify-between shrink-0">
              <h3 className="font-display font-bold text-xs text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-red" />
                <span>Monitored Registry</span>
              </h3>
              
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded-full border border-slate-900 text-slate-400 font-mono">
                Seeded: {totalCount}
              </span>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-900/60 bg-slate-950/20">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-900 focus:border-brand-red rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Girls List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
              {filteredGirls.map((girl) => {
                const initials = girl.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                return (
                  <button
                    key={girl.id}
                    onClick={() => setSelectedGirlId(girl.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer hover:border-slate-800 ${
                      selectedGirlId === girl.id
                        ? 'bg-slate-900/40 border-brand-red shadow-lg'
                        : 'bg-slate-950/20 border-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${girl.avatarColor} flex items-center justify-center font-display font-extrabold text-xs text-[#060913]`}>
                        {initials}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{girl.name}</h4>
                        <span className="text-[10px] text-slate-550 font-mono">{girl.phone}</span>
                      </div>
                    </div>

                    <span className={`text-[8px] px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${getStatusBadge(girl.status)}`}>
                      {girl.status}
                    </span>
                  </button>
                );
              })}

              {filteredGirls.length === 0 && (
                <div className="text-center py-12 text-slate-550 text-xs">
                  No citizens found in this district registry.
                </div>
              )}
            </div>
          </div>

          {/* Citizen Details & History (Dwell Times) */}
          {selectedGirl && (
            <div className="bg-dark-card border border-slate-900 rounded-xl p-4 flex-1 space-y-4 flex flex-col justify-between overflow-hidden">
              <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
                
                {/* Profile Header */}
                <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-100">{selectedGirl.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">Cellular: {selectedGirl.phone}</p>
                    <span className="text-[9px] text-slate-550 mt-1 block">
                      Last GPS Ping: {new Date(selectedGirl.lastSeen).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className={`text-[9.5px] px-2.5 py-1 rounded border uppercase font-extrabold ${getStatusBadge(selectedGirl.status)}`}>
                    {selectedGirl.status}
                  </span>
                </div>

                {/* Coords Card */}
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Coordinates</span>
                  </span>
                  <span className="font-mono text-slate-300">
                    {selectedGirl.latitude.toFixed(5)}, {selectedGirl.longitude.toFixed(5)}
                  </span>
                </div>

                {/* Visit History Log & Dwell Times */}
                <div className="space-y-2">
                  <span className="text-[9.5px] text-slate-550 font-bold uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dwell Time Log (Danger Zones)</span>
                  </span>

                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {selectedGirl.history.length > 0 ? (
                      selectedGirl.history.map((visit, idx) => (
                        <div 
                          key={visit.id || idx} 
                          className="bg-slate-950/20 border border-slate-900/60 rounded-lg p-2 flex justify-between items-start text-[10.5px] font-sans"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-200 block truncate max-w-[200px]">
                              {visit.locationName}
                            </span>
                            <span className="text-[9px] text-slate-550">
                              Entered: {new Date(visit.enteredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {visit.exitedAt && ` | Exited: ${new Date(visit.exitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-350 bg-slate-900/65 px-2 py-0.5 rounded border border-slate-800 font-mono text-[9.5px] shrink-0">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{visit.durationMinutes}m spent</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-slate-550 text-center py-6 border border-dashed border-slate-900 rounded-lg">
                        No history entries recorded. Subject has stayed in safe zones.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Simulation Movement Controls */}
              <div className="border-t border-slate-900 pt-3 space-y-2.5 shrink-0 bg-dark-card z-10">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">
                  🛡️ Active Dispatch Simulator
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9.5px] text-slate-550 block font-semibold">Simulate Walk / Teleport To:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {simulationLocations.map((loc, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSimulateMove(loc.lat, loc.lng)}
                          className="bg-slate-950 border border-slate-900 hover:border-slate-800 text-[10px] font-medium p-1.5 rounded-lg text-left text-slate-400 hover:text-slate-200 truncate cursor-pointer transition-colors"
                          title={loc.name}
                        >
                          📍 {loc.name.split(' (')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerSOS}
                    disabled={selectedGirl.status === 'danger'}
                    className={`col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                      selectedGirl.status === 'danger'
                        ? 'bg-red-500/10 border border-red-500/20 text-red-500/50 cursor-not-allowed'
                        : 'bg-brand-red hover:bg-brand-red-dark text-white shadow shadow-brand-red/20'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Trigger Manual distress SOS</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Map Visualizer (7 Columns) */}
        <div className="lg:col-span-7 bg-dark-card border border-slate-900 rounded-xl overflow-hidden min-h-[500px] flex flex-col relative">
          {/* Map Title Control Bar */}
          <div className="p-3 border-b border-slate-900 flex justify-between items-center bg-slate-950/20 z-10 shrink-0">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-brand-red rotate-45" />
              <span className="text-xs font-bold text-slate-350">
                GPS Tracking Grid ({activeCity === 'ahmedabad' ? 'Ahmedabad Area' : 'Surat Area'})
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Map Sync: Active</span>
            </div>
          </div>

          {/* Leaflet Map rendering */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
            <SafetyMap
              userCoords={mapCenter}
              incidents={incidents}
              dangerZones={dangerZones}
              monitoredGirls={monitoredGirls}
              showHeatmap={false}
              interactive={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
