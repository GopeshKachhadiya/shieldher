import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, HelpCircle, LogOut, ChevronRight, Globe } from 'lucide-react';
import { useUserProfile } from '../../data/store';
import { t } from '../../data/translations';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useUserProfile();
  const lang = (profile.lang || 'en') as 'en' | 'hi' | 'gu';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const currentLangLabel = profile.lang === 'en' 
    ? 'English (EN)' 
    : profile.lang === 'hi' 
    ? 'Hindi (HI)' 
    : 'Gujarati (GU)';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-white">{t('profile_title', lang)}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t('profile_desc', lang)}
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-dark-card border border-slate-900 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-display font-extrabold text-2xl text-brand-red uppercase">
          {getInitials(profile.name)}
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-bold text-lg text-white">{profile.name}</h3>
          <span className="text-xs text-slate-550 block font-mono">{profile.phone}</span>
          
          {profile.aadhaar ? (
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mt-1.5 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('aadhaar_linked', lang)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold bg-slate-905 border border-slate-900 px-2 py-0.5 rounded-full mt-1.5 w-fit">
              <span>{t('unlinked_profile', lang)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Settings Options */}
      <div className="bg-dark-card border border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-900">
        {[
          { label: t('guardians_config', lang), desc: t('guardians_config_desc', lang), path: '/guardians', icon: User },
          { label: t('language_selection', lang), desc: `${t('language_current', lang)}${currentLangLabel}`, path: '', icon: Globe },
          { label: t('cyber_help_center', lang), desc: t('cyber_help_center_desc', lang), path: '/safety-hub', icon: HelpCircle }
        ].map((opt, idx) => {
          const Icon = opt.icon;
          return (
            <button
              key={idx}
              onClick={() => opt.path && navigate(opt.path)}
              className="w-full px-5 py-4 text-left hover:bg-slate-900/10 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-950/40 border border-slate-900 flex items-center justify-center text-slate-505 shrink-0">
                  <Icon className="w-4.5 h-4.5 text-brand-red" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{opt.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="space-y-3 pt-4">
        <button
          onClick={() => navigate('/police/login')}
          className="w-full bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-400 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wider cursor-pointer"
        >
          <span>{t('police_portal_btn', lang)}</span>
        </button>

        <button
          onClick={() => {
            setProfile({ ...profile, isLoggedIn: false });
            navigate('/login');
          }}
          className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-brand-red font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wider cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout_btn', lang)}</span>
        </button>
      </div>
    </div>
  );
}
