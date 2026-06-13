import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, FolderKanban, BarChart3, Users, LogOut, Map } from 'lucide-react';
import { useEffect } from 'react';
import { useUserProfile, store, initWebSocket } from '../../data/store';

export default function PoliceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile] = useUserProfile();

  useEffect(() => {
    if (!profile.isLoggedIn || profile.role !== 'police') {
      navigate('/police/login');
    }
  }, [profile, navigate]);

  useEffect(() => {
    initWebSocket();
  }, []);

  const menuItems = [
    { path: '/police', label: 'Incident Desk', icon: LayoutDashboard },
    { path: '/police/tracking', label: 'Citizen Tracker', icon: Map },
    { path: '/police/cases', label: 'Case Queue', icon: FolderKanban },
    { path: '/police/analytics', label: 'Analytics Center', icon: BarChart3 },
    { path: '/police/suspects', label: 'Repeat Offenders', icon: Users }
  ];

  return (
    <div className="flex min-h-screen bg-[#060913] text-slate-100 font-sans">
      {/* Desktop Sidebar Navigation */}
      <aside className="w-64 bg-dark-card border-r border-slate-900 flex flex-col z-20 shrink-0">
        <div className="p-5 border-b border-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-red flex items-center justify-center shadow-lg shadow-brand-red/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base tracking-wider leading-none">SHIELDHER</h1>
            <span className="text-[10px] text-brand-red font-semibold uppercase tracking-widest">CYBER CELL</span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/police' && location.pathname.startsWith(item.path));

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-red text-white shadow-lg shadow-brand-red/25' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign Out Section */}
        <div className="p-3 border-t border-slate-900">
          <button
            onClick={() => {
              store.setProfile({
                name: '',
                phone: '',
                lang: 'en',
                aadhaar: '',
                role: 'user',
                isLoggedIn: false
              });
              localStorage.removeItem('shieldher_jwt_token');
              navigate('/police/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Control Bar */}
        <header className="h-16 bg-dark-card border-b border-slate-900 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-display font-semibold text-lg text-slate-200">
              Ahmedabad Cyber Crime Branch
            </h2>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE INCIDENT SYNC</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col items-end">
              <span className="font-medium text-slate-300">Inspector A. Mehta</span>
              <span className="text-[10px] text-slate-500">Badge #CC-4902</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-display font-bold text-slate-200 uppercase">
              AM
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
