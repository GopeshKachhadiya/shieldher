import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, UserCheck, Key, Shield, ArrowRight } from 'lucide-react';

export default function PoliceLoginPage() {
  const navigate = useNavigate();
  const [badge, setBadge] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!badge || !password) {
      setError('Please fill in badge number and credential password.');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigate('/police');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#04060d] text-slate-100 justify-center px-6 py-12 relative">
      {/* Background radial gradient accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-sm mx-auto flex flex-col items-center z-10">
        <div className="w-20 h-20 rounded-2xl bg-[#121824] border border-slate-900 flex items-center justify-center shadow-2xl mb-5">
          <ShieldAlert className="w-10 h-10 text-brand-red animate-pulse" />
        </div>
        <h1 className="font-display font-extrabold text-2xl tracking-wider text-white uppercase text-center">
          SHIELDHER DISPATCH DECK
        </h1>
        <p className="text-xs text-slate-500 mt-2 text-center max-w-[280px]">
          Ahmedabad City Cyber Branch • Authorization Protocol 69EEFD
        </p>

        {/* Credentials Form Card */}
        <div className="bg-dark-card border border-slate-900 rounded-2xl p-6 shadow-2xl w-full mt-8">
          {error && (
            <div className="mb-4 px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-brand-red font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Officer Badge ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. CC-4902"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-900 focus:border-brand-red rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none transition-all font-mono tracking-widest"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Officer Cryptographic Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
                  <Key className="w-4.5 h-4.5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-900 focus:border-brand-red rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none transition-all tracking-widest"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex justify-between">
                <span>2FA TOTP TOKEN</span>
                <span className="text-[9px] text-slate-600 font-semibold uppercase">SECURE PASS</span>
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit authentication token"
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950/60 border border-slate-900 focus:border-brand-red rounded-xl py-3 px-4 text-xs text-white focus:outline-none transition-all text-center font-mono tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-brand-red-dark disabled:bg-brand-red/50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-red/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <span>{loading ? 'Authorizing Gateway...' : 'Access Dispatch Deck'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="mt-6 text-xs text-slate-550 hover:text-slate-400 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Return to Complainant Citizen Login</span>
        </button>
      </div>
    </div>
  );
}
