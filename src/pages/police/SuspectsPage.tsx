import { useState } from 'react';
import { Users, Search, Flag } from 'lucide-react';
import { mockSuspects } from '../../data/mockData';

export default function SuspectsPage() {
  const suspects = mockSuspects;
  const [searchTerm, setSearchTerm] = useState('');
  const [flaggedIds, setFlaggedIds] = useState<string[]>(['s2']); // Pre-flag one suspect

  const handleToggleFlag = (id: string) => {
    setFlaggedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredSuspects = suspects.filter(s => 
    s.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-bold text-2xl text-white">Repeat Offender Directory</h2>
          <p className="text-xs text-slate-500 mt-1">
             Cross-referenced suspect handles, phone numbers, and emails linked across complaints
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-dark-card border border-slate-900 rounded-xl p-4 flex gap-4 items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search suspect handle, phone number, email ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-900 focus:border-brand-red rounded-lg py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredSuspects.map((sus) => {
          const isFlagged = flaggedIds.includes(sus.id);
          return (
            <div 
              key={sus.id} 
              className={`bg-dark-card border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                isFlagged 
                  ? 'border-red-500/30 bg-red-500/5 shadow-lg shadow-red-500/5' 
                  : 'border-slate-900'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-200">{sus.handle}</h3>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
                      {sus.matchType}
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border uppercase ${
                    sus.riskScore >= 0.8 
                      ? 'text-red-400 bg-red-500/10 border-red-500/25' 
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                  }`}>
                    Risk: {(sus.riskScore * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400 font-mono">
                  <p className="truncate"><span className="text-slate-500">Phone:</span> {sus.phone}</p>
                  <p className="truncate"><span className="text-slate-500">Email:</span> {sus.email}</p>
                </div>

                <div className="bg-slate-950/30 border border-slate-900/60 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Linked Complaints:</span>
                  <span className="font-extrabold text-brand-red bg-red-500/10 px-2 py-0.5 border border-red-500/20 rounded font-mono">
                    {sus.linkedCasesCount} cases
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-900/60 shrink-0">
                <button
                  onClick={() => handleToggleFlag(sus.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                    isFlagged 
                      ? 'bg-red-500 text-white border-red-500 shadow shadow-red-500/15' 
                      : 'bg-slate-905 border-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{isFlagged ? 'FLAGGED HIGH ALERT' : 'FLAG SUSPECT'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSuspects.length === 0 && (
        <div className="text-center py-16 border border-dashed border-slate-900 rounded-2xl">
          <Users className="w-12 h-12 text-slate-655 mx-auto mb-2" />
          <p className="text-slate-500">No suspects found matching the criteria.</p>
        </div>
      )}
    </div>
  );
}
