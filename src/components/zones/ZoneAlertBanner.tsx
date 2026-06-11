import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActiveZoneAlert, useUserProfile, store } from '../../data/store';

export default function ZoneAlertBanner() {
  const navigate = useNavigate();
  const [activeAlert, clearAlert] = useActiveZoneAlert();
  const [profile] = useUserProfile();

  useEffect(() => {
    // If it's an exit alert, auto-dismiss after 5 seconds
    if (activeAlert && activeAlert.type === 'exit') {
      const timer = setTimeout(() => {
        clearAlert();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeAlert, clearAlert]);

  if (!activeAlert) return null;

  const isEntry = activeAlert.type === 'entry';
  
  // Choose banner colors based on risk level
  const getBannerStyles = () => {
    if (!isEntry) return 'bg-emerald-600 border-emerald-500 shadow-emerald-950/20';
    if (activeAlert.riskLevel === 3) return 'bg-amber-600 border-amber-500 shadow-amber-950/20';
    if (activeAlert.riskLevel === 4) return 'bg-red-600 border-red-500 shadow-red-950/20';
    return 'bg-rose-900 border-rose-800 shadow-rose-950/40';
  };

  const handleActivateSOS = () => {
    // Trigger SOS immediately
    store.triggerSOS('button');
    clearAlert();
    navigate('/sos');
  };

  const handleShareLocation = () => {
    alert(`[Simulation] Sharing location with ${profile.lang === 'hi' ? 'अभिभावक' : profile.lang === 'gu' ? 'વાલી' : 'emergency contacts'}: Priya Sharma is currently near ${activeAlert.zoneName}`);
    clearAlert();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 border-b backdrop-blur-md shadow-lg ${getBannerStyles()}`}
      >
        <div className="max-w-xl mx-auto flex items-start gap-3 text-white">
          <div className="mt-0.5 shrink-0">
            {isEntry ? (
              activeAlert.riskLevel >= 5 ? (
                <ShieldAlert className="w-5.5 h-5.5 text-white animate-pulse" />
              ) : (
                <AlertTriangle className="w-5.5 h-5.5 text-white" />
              )
            ) : (
              <CheckCircle className="w-5.5 h-5.5 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold font-sans leading-tight">
              {isEntry 
                ? (profile.lang === 'hi' ? 'खतरनाक क्षेत्र चेतावनी' : profile.lang === 'gu' ? 'જોખમી વિસ્તાર ચેતવણી' : 'Danger Zone Alert')
                : (profile.lang === 'hi' ? 'सुरक्षित निकास' : profile.lang === 'gu' ? 'સુરક્ષિત નિકાસ' : 'Safe Exit Confirmation')
              }
            </h4>
            <p className="text-[11px] opacity-95 mt-1 leading-normal font-medium">
              {activeAlert.message}
            </p>

            {isEntry && (
              <div className="flex gap-2.5 mt-2.5">
                <button
                  onClick={handleActivateSOS}
                  className="bg-white text-slate-900 font-extrabold px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider hover:bg-slate-100 transition-colors shadow"
                >
                  🆘 {profile.lang === 'hi' ? 'SOS दबाएं' : profile.lang === 'gu' ? 'SOS દબાવો' : 'Trigger SOS'}
                </button>
                <button
                  onClick={handleShareLocation}
                  className="bg-black/20 hover:bg-black/35 border border-white/20 text-white font-bold px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-colors"
                >
                  📍 {profile.lang === 'hi' ? 'स्थान साझा करें' : profile.lang === 'gu' ? 'લોકેશન શેર કરો' : 'Share Location'}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => clearAlert()}
            className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
