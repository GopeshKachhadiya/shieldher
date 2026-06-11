import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash, PhoneCall, AlertCircle } from 'lucide-react';
import type { Guardian } from '../../data/mockData';
import { useGuardians } from '../../data/store';

export default function GuardiansPage() {
  const navigate = useNavigate();
  const [guardians, setGuardians] = useGuardians();
  
  // Add guardian input states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Friend');
  
  // Test alert state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState('');

  const handleAddGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newG: Guardian = {
      id: `g-${Date.now()}`,
      name,
      phone: `+91 ${phone.replace(/\s+/g, '')}`,
      relation,
      priority: guardians.length + 1
    };

    setGuardians([...guardians, newG]);
    setName('');
    setPhone('');
    setShowAddForm(false);
  };

  const handleDeleteGuardian = (id: string) => {
    setGuardians(guardians.filter(g => g.id !== id));
  };

  const handleTestAlert = (guardian: Guardian) => {
    setTestingId(guardian.id);
    setAlertSuccess('');
    
    setTimeout(() => {
      setTestingId(null);
      setAlertSuccess(`Test alert SMS successfully sent to ${guardian.name} (${guardian.phone})!`);
      
      // Auto clear success message after 4 seconds
      setTimeout(() => setAlertSuccess(''), 4000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/')} 
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div>
          <h2 className="font-display font-bold text-lg text-white">Emergency Guardians</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage contacts notified during distress</p>
        </div>
      </div>

      {alertSuccess && (
        <div className="px-3 py-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium leading-relaxed">
          {alertSuccess}
        </div>
      )}

      {/* Guardians list */}
      <div className="space-y-3">
        {guardians.map((g) => (
          <div key={g.id} className="bg-dark-card border border-slate-900 rounded-2xl p-4 flex justify-between items-center gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-brand-red font-bold">
                  {g.priority}
                </span>
                <h4 className="text-sm font-bold text-slate-200 truncate">{g.name}</h4>
                <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full text-slate-400 font-semibold uppercase">
                  {g.relation}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-550 block pl-8">{g.phone}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Test Alert trigger */}
              <button
                onClick={() => handleTestAlert(g)}
                disabled={testingId !== null}
                className="p-2 rounded-xl bg-slate-905 border border-slate-900 text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-50 cursor-pointer"
                title="Send test distress SMS"
              >
                {testingId === g.id ? (
                  <span className="w-4 h-4 block rounded-full border border-slate-400 border-t-transparent animate-spin" />
                ) : (
                  <PhoneCall className="w-4 h-4 text-emerald-500" />
                )}
              </button>

              <button
                onClick={() => handleDeleteGuardian(g.id)}
                className="p-2 rounded-xl bg-slate-905 border border-slate-900 text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {guardians.length === 0 && (
        <div className="text-center py-12 border border-dashed border-slate-900 rounded-2xl">
          <AlertCircle className="w-10 h-10 text-slate-655 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No emergency contacts configured.</p>
        </div>
      )}

      {/* Add Guardian button/Form Toggle */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/20 text-slate-400 hover:text-white py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider font-semibold cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5 text-brand-red" />
          <span>Add Emergency Contact</span>
        </button>
      ) : (
        <form onSubmit={handleAddGuardian} className="bg-dark-card border border-slate-900 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 border-b border-slate-900 pb-2">
            Configure Contact
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-lg py-2 px-3 text-xs text-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Relation
              </label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-brand-red text-white"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Sister">Sister</option>
                <option value="Brother">Brother</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              required
              placeholder="10-digit number"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-lg py-2 px-3 text-xs text-white focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-450 border border-slate-800 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-red hover:bg-brand-red-dark text-white py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
            >
              Save Contact
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
