import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Home, AlertOctagon, HelpCircle, User, MessageSquareCode, Globe } from 'lucide-react';
import { useUserProfile, useActiveSOS, useUserCoords, store, initWebSocket } from '../../data/store';
import ActiveSOSOverlay from '../sos/ActiveSOSOverlay';
import ZoneAlertBanner from '../zones/ZoneAlertBanner';
import { t } from '../../data/translations';

export default function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, updateProfile] = useUserProfile();
  
  useEffect(() => {
    if (!profile.isLoggedIn || profile.role !== 'user') {
      navigate('/login');
    }
  }, [profile, navigate]);

  useEffect(() => {
    initWebSocket();
  }, []);

  const lang = (profile.lang || 'en') as 'en' | 'hi' | 'gu';
  const { activeSOS } = useActiveSOS();
  const [, updateCoords] = useUserCoords();

  // Background location watcher
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Update store coordinates
          updateCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('GPS watcher disabled or blocked:', error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [updateCoords]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { path: '/', label: t('nav_home', lang), icon: Home },
    { path: '/sos', label: t('nav_sos', lang), icon: AlertOctagon, highlight: true },
    { path: '/complaints', label: t('nav_complaints', lang), icon: MessageSquareCode },
    { path: '/safety-hub', label: t('nav_safety_hub', lang), icon: HelpCircle },
    { path: '/profile', label: t('nav_profile', lang), icon: User }
  ];

  const languages = {
    en: 'EN',
    hi: 'HI (हिन्दी)',
    gu: 'GU (ગુજરાતી)'
  };

  const handleLangToggle = () => {
    const nextLang = lang === 'en' ? 'hi' : lang === 'hi' ? 'gu' : 'en';
    updateProfile({ ...profile, lang: nextLang });
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col md:flex-row relative">
      <ZoneAlertBanner />
      
      {activeSOS && (
        <ActiveSOSOverlay onDeactivate={() => store.resolveSOS(activeSOS.id)} />
      )}
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-dark-card border-r border-slate-900 z-50 p-5 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8.5 h-8.5 rounded bg-brand-red flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-wider bg-gradient-to-r from-white via-slate-200 to-brand-red bg-clip-text text-transparent">
              ShieldHer
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-red-500/10 border-brand-red/25 text-white'
                      : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/40 border-transparent'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-brand-red' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-brand-red glowing-red-orb animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Bottom Footer */}
        <div className="border-t border-slate-900 pt-4 space-y-4">
          {/* Language selection dropdown in sidebar */}
          <button 
            onClick={handleLangToggle}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-900 text-xs text-slate-450 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-500" />
              <span>{t('language', lang)}</span>
            </div>
            <span className="font-bold text-brand-red bg-red-500/10 px-2 py-0.5 rounded text-[10px]">
              {languages[lang].split(' ')[0]}
            </span>
          </button>

          {/* User Profile Summary */}
          <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-900 p-3 rounded-2xl">
            <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-display font-extrabold text-xs text-brand-red uppercase shrink-0">
              {getInitials(profile.name)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-250 truncate">{profile.name}</h4>
              <span className="text-[10px] text-slate-550 block font-mono truncate">{profile.phone}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <header className="flex md:hidden sticky top-0 bg-dark-bg/95 backdrop-blur-md z-45 px-4 py-3 items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded bg-brand-red flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-wider bg-gradient-to-r from-white via-slate-200 to-brand-red bg-clip-text text-transparent">
            ShieldHer
          </span>
        </div>
        
        {/* Language selector toggle */}
        <button 
          onClick={handleLangToggle}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{languages[lang].split(' ')[0]}</span>
        </button>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
          <Outlet context={{ lang }} />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 bg-dark-bg/95 backdrop-blur-md border-t border-slate-900 z-45 items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));

          if (item.highlight) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center relative -top-4"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-brand-red-dark glowing-red-orb scale-105' 
                    : 'bg-brand-red glowing-red-orb hover:scale-105'
                }`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] text-brand-red font-semibold mt-1">{t('sos_short', lang)}</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-colors"
            >
              <Icon className={`w-5.5 h-5.5 transition-colors ${
                isActive ? 'text-brand-red' : 'text-slate-500 hover:text-slate-300'
              }`} />
              <span className={`text-[10px] mt-1 transition-colors ${
                isActive ? 'text-brand-red font-medium' : 'text-slate-500'
              }`}>
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
