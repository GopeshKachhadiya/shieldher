import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Globe, FileText, Users, ArrowRight, BellRing } from 'lucide-react';
import SOSButton from '../../components/sos/SOSButton';
import ActiveSOSOverlay from '../../components/sos/ActiveSOSOverlay';
import { useActiveSOS, useUserProfile, store } from '../../data/store';

export default function HomePage() {
  const navigate = useNavigate();
  const { activeSOS } = useActiveSOS();
  const [profile] = useUserProfile();
  const sosActive = !!activeSOS;

  const quickActions = [
    { 
      path: '/report', 
      title: 'Report Cybercrime', 
      desc: 'Stalking, blackmail, online scams', 
      icon: ShieldAlert, 
      color: 'text-red-500 bg-red-500/10 border-red-500/20' 
    },
    { 
      path: '/safety-hub', 
      title: 'Safety Hub', 
      desc: 'Scan links & fake profile alerts', 
      icon: Globe, 
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
    },
    { 
      path: '/complaints', 
      title: 'Track Complaints', 
      desc: 'View status & chat with officers', 
      icon: FileText, 
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' 
    },
    { 
      path: '/guardians', 
      title: 'Guardians', 
      desc: 'Configure emergency alerts', 
      icon: Users, 
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' 
    }
  ];

  const handleSosTrigger = () => {
    store.triggerSOS('button');
  };

  const handleSosDeactivate = () => {
    if (activeSOS) {
      store.resolveSOS(activeSOS.id);
    }
  };

  return (
    <div className="space-y-6">
      {sosActive && (
        <ActiveSOSOverlay onDeactivate={handleSosDeactivate} />
      )}

      {/* Greeting and Status Panel */}
      <div className="bg-dark-card border border-slate-900 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-white">Hello, {profile.name} 👋</h2>
          <p className="text-xs text-slate-500 mt-1">
            Status: <span className="text-emerald-400 font-semibold">Secure</span> • Safeguard Enabled
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <BellRing className="w-4 h-4 text-brand-red animate-swing" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column - SOS Trigger */}
        <div className="md:col-span-5 flex flex-col">
          <div className="bg-dark-card border border-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1 min-h-[300px]">
            <h3 className="font-display font-semibold text-sm text-slate-400 uppercase tracking-widest mb-1">
              Emergency Trigger
            </h3>
            <p className="text-xs text-slate-650 mb-6 max-w-[285px] leading-relaxed">
              Press and hold for 3 seconds during immediate threat to alert the police cyber branch & guardians.
            </p>
            <SOSButton onTrigger={handleSosTrigger} isActive={sosActive} />
          </div>
        </div>

        {/* Right column - Safety Actions & Recent */}
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-xs text-slate-500 uppercase tracking-wider px-1">
              Safety Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.path}
                    onClick={() => navigate(act.path)}
                    className="bg-dark-card border border-slate-900 rounded-2xl p-4 text-left hover:border-slate-850 hover:bg-slate-950/20 transition-all flex flex-col justify-between h-32 cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${act.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-200 leading-tight">
                        {act.title}
                      </h4>
                      <p className="text-[10px] text-slate-550 mt-1 line-clamp-2 leading-tight">
                        {act.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Alert Card */}
          <div className="bg-dark-card border border-slate-900 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-950/10 transition-colors cursor-pointer" onClick={() => navigate('/complaints/SH-2026-8902')}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-brand-red">
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-slate-200">Stalking Case #SH-8902</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Assigned to Officer M. Patel • Investigating</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
