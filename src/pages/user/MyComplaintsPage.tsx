import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Clock, ShieldCheck } from 'lucide-react';
import { useComplaints, useUserProfile } from '../../data/store';
import { t } from '../../data/translations';

export default function MyComplaintsPage() {
  const navigate = useNavigate();
  const complaints = useComplaints();
  const [profile] = useUserProfile();
  const lang = (profile.lang || 'en') as 'en' | 'hi' | 'gu';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'assigned':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      case 'investigating':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'resolved':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      default:
        return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  const getPriorityStyle = (priority: string) => {
    return priority === 'urgent'
      ? 'text-brand-red border-red-500/20 bg-red-500/5'
      : 'text-slate-400 border-slate-800 bg-slate-900/40';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-white">{t('my_complaints_title', lang)}</h2>
        <p className="text-xs text-slate-500 mt-1">
          {t('my_complaints_desc', lang)}
        </p>
      </div>

      <div className="space-y-3">
        {complaints.map((comp) => (
          <button
            key={comp.id}
            onClick={() => navigate(`/complaints/${comp.id}`)}
            className="w-full bg-dark-card border border-slate-900 rounded-2xl p-4 text-left hover:border-slate-850 transition-colors flex justify-between items-center cursor-pointer"
          >
            <div className="space-y-2 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${getStatusStyle(comp.status)} font-semibold uppercase tracking-wider`}>
                  {comp.status}
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded border ${getPriorityStyle(comp.priority)} font-semibold uppercase tracking-wider`}>
                  {comp.priority}
                </span>
                <span className="text-[10px] text-slate-500">{new Date(comp.createdAt).toLocaleDateString()}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-200 capitalize">
                  {comp.category.replace('_', ' ')}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 leading-normal mt-0.5">
                  {comp.description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-slate-450 pt-1 border-t border-slate-900/60">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>{comp.evidenceFiles.length} Evidence Logs</span>
                </span>
                {comp.assignedOfficer && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{comp.assignedOfficer.name}</span>
                  </span>
                )}
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
          </button>
        ))}
      </div>

      {complaints.length === 0 && (
        <div className="text-center py-12 border border-dashed border-slate-900 rounded-2xl">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No complaints registered yet.</p>
        </div>
      )}
    </div>
  );
}
