import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, CreditCard, Users, Check } from 'lucide-react';
import { store } from '../../data/store';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [lang, setLang] = useState('en');
  const [guardians, setGuardians] = useState([
    { name: '', phone: '', relation: 'Father' },
    { name: '', phone: '', relation: 'Mother' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleGuardianChange = (index: number, field: string, value: string) => {
    const newGuardians = [...guardians];
    newGuardians[index] = { ...newGuardians[index], [field]: value };
    setGuardians(newGuardians);
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Save profile
      const currentProfile = store.getProfile();
      store.setProfile({
        ...currentProfile,
        name,
        aadhaar,
        lang,
        isLoggedIn: true
      });
      // Save guardians
      const validGuardians = guardians
        .filter(g => g.name.trim() && g.phone.trim())
        .map((g, idx) => ({
          id: `g-onboard-${idx}`,
          name: g.name,
          phone: `+91 ${g.phone}`,
          relation: g.relation,
          priority: idx + 1
        }));
      if (validGuardians.length > 0) {
        store.setGuardians(validGuardians);
      }
      navigate('/');
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100 justify-center px-4 py-8">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-brand-red flex items-center justify-center shadow-lg shadow-brand-red/30 mx-auto mb-3">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-display font-bold text-2xl text-white">Setup Safety Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete these details to enable SOS routing and secure identity logs
        </p>
      </div>

      <form onSubmit={handleOnboardSubmit} className="space-y-5">
        {/* Full Name */}
        <div className="bg-dark-card border border-slate-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-brand-red border-b border-slate-900 pb-2">
            <User className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Identity Details</span>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-lg py-2.5 px-3.5 text-sm focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
              Aadhaar ID (Optional for Identity Hash)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <CreditCard className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="xxxx xxxx xxxx (12 digits)"
                maxLength={12}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-lg py-2.5 pl-10 pr-3 text-sm focus:outline-none transition-colors font-mono tracking-widest text-center"
              />
            </div>
          </div>
        </div>

        {/* Preferred Language */}
        <div className="bg-dark-card border border-slate-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-brand-red border-b border-slate-900 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Language Settings</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['en', 'hi', 'gu'].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                  lang === l
                    ? 'bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/20'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {l === 'en' ? 'English' : l === 'hi' ? 'Hindi' : 'Gujarati'}
              </button>
            ))}
          </div>
        </div>

        {/* Guardians setup */}
        <div className="bg-dark-card border border-slate-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-brand-red border-b border-slate-900 pb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Trusted Contacts (SOS Receivers)</span>
          </div>

          {guardians.map((g, idx) => (
            <div key={idx} className="space-y-2 border-b border-slate-900/60 pb-3 last:border-b-0 last:pb-0">
              <span className="text-[10px] text-slate-500 font-semibold">Guardian #{idx + 1}</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={g.name}
                  onChange={(e) => handleGuardianChange(idx, 'name', e.target.value)}
                  className="bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-lg py-2 px-3 text-xs focus:outline-none transition-colors"
                />
                <input
                  type="tel"
                  placeholder="Mobile (10 digits)"
                  value={g.phone}
                  onChange={(e) => handleGuardianChange(idx, 'phone', e.target.value.replace(/\D/g, ''))}
                  className="bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-lg py-2 px-3 text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Finish button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-red hover:bg-brand-red-dark disabled:bg-brand-red/50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-red/20 transition-all text-sm cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>{loading ? 'Finalizing Profile...' : 'Save & Enter Dashboard'}</span>
        </button>
      </form>
      </div>
    </div>
  );
}
