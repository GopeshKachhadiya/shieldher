import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Clock, FileText, Send, 
  MessageSquare, Upload, CheckCircle2 
} from 'lucide-react';
import { useComplaints, store } from '../../data/store';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const complaints = useComplaints();
  const complaint = complaints.find(c => c.id === id);

  const [message, setMessage] = useState('');
  const [addingEvidence, setAddingEvidence] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [complaint?.messages]);

  if (!complaint) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Complaint not found.</p>
        <button onClick={() => navigate('/complaints')} className="text-brand-red text-xs mt-2 underline">
          Back to List
        </button>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !complaint) return;

    store.addComplaintMessage(complaint.id, 'user', message);
    setMessage('');

    // Simulate officer responding after 2 seconds
    setTimeout(() => {
      store.addComplaintMessage(
        complaint.id,
        'officer',
        "Understood. Our cyber forensics team is inspecting the details. We will update the logs shortly."
      );
    }, 2500);
  };

  const handleAddEvidenceMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !complaint) return;
    setAddingEvidence(true);

    setTimeout(() => {
      const chars = '0123456789abcdef';
      let hash = '';
      for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * 16)];
      }

      const newEv = {
        id: `ev-${Date.now()}`,
        name: e.target.files![0].name,
        size: `${(e.target.files![0].size / (1024 * 1024)).toFixed(2)} MB`,
        type: e.target.files![0].type,
        hash: hash,
        url: '#',
        uploadedAt: new Date().toISOString()
      };

      const updatedComplaints = store.getComplaints().map(c => {
        if (c.id === complaint.id) {
          return {
            ...c,
            evidenceFiles: [...c.evidenceFiles, newEv]
          };
        }
        return c;
      });
      store.setComplaints(updatedComplaints);
      setAddingEvidence(false);
    }, 1200);
  };

  // Progression steps mapping
  const steps = [
    { label: 'Submitted', key: 'submitted' },
    { label: 'Assigned', key: 'assigned' },
    { label: 'Investigating', key: 'investigating' },
    { label: 'Resolved', key: 'resolved' }
  ];

  const currentStepIdx = steps.findIndex(s => s.key === complaint.status) !== -1 
    ? steps.findIndex(s => s.key === complaint.status) 
    : 2; // Default to investigating

  return (
    <div className="space-y-6">
      {/* Detail Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/complaints')} 
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div>
          <h2 className="font-display font-bold text-lg text-white">Case File Detail</h2>
          <span className="text-xs text-slate-500 font-mono">{complaint.id}</span>
        </div>
      </div>

      {/* Investigation Timeline Stepper */}
      <div className="bg-dark-card border border-slate-900 rounded-2xl p-4">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-3">Investigation Progress</span>
        <div className="flex justify-between items-center relative px-2">
          {/* Connecting line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-900 z-0" />
          <div 
            className="absolute top-4 left-4 h-0.5 bg-brand-red transition-all z-0"
            style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((st, idx) => {
            const isCompleted = idx <= currentStepIdx;
            return (
              <div key={st.key} className="flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                  isCompleted 
                    ? 'bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/20' 
                    : 'bg-slate-950 border-slate-900 text-slate-655'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Clock className="w-4 h-4" />}
                </div>
                <span className={`text-[9px] font-semibold mt-1.5 ${isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Case Details */}
      <div className="bg-dark-card border border-slate-900 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-red">Incident Summary</h3>
          <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-brand-red px-2 py-0.5 rounded font-bold">
            Risk: {(complaint.aiRiskScore * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{complaint.description}</p>
        
        {complaint.assignedOfficer && (
          <div className="bg-slate-900/60 border border-slate-850/80 rounded-xl p-3 flex items-start gap-3 mt-4">
            <Shield className="w-5 h-5 text-brand-red mt-0.5 shrink-0" />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-200">Investigating Officer</span>
              <p className="text-slate-400 font-medium">{complaint.assignedOfficer.name} ({complaint.assignedOfficer.rank})</p>
              <p className="text-[10px] text-slate-550">Badge: {complaint.assignedOfficer.badgeNumber} • Call: {complaint.assignedOfficer.phone}</p>
            </div>
          </div>
        )}
      </div>

      {/* Evidence checklist with Hashing */}
      <div className="bg-dark-card border border-slate-900 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand-red" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Chain of Custody Logs</h3>
          </div>
          
          {/* Add Evidence input trigger */}
          <div className="relative">
            <input 
              type="file" 
              onChange={handleAddEvidenceMock}
              disabled={addingEvidence}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
            <button 
              type="button" 
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-850 text-[10px] text-slate-400 font-bold uppercase hover:text-white"
            >
              <Upload className="w-3 h-3" />
              <span>{addingEvidence ? 'Uploading...' : 'Add Log'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {complaint.evidenceFiles.map((ev) => (
            <div key={ev.id} className="bg-slate-950/40 border border-slate-900 p-2.5 rounded-xl flex items-center justify-between text-[11px]">
              <div className="min-w-0 pr-3">
                <span className="font-bold text-slate-300 block truncate">{ev.name}</span>
                <span className="text-[9px] text-slate-500 font-mono block truncate mt-0.5">
                  Hash: {ev.hash}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold shrink-0 uppercase">{ev.size}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat messaging logs */}
      <div className="bg-dark-card border border-slate-900 rounded-2xl p-4 flex flex-col h-80">
        <div className="flex items-center gap-2 border-b border-slate-900 pb-2 mb-3 shrink-0">
          <MessageSquare className="w-4 h-4 text-brand-red" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Secure Officer Chat</h3>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3 no-scrollbar">
          {complaint.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-normal ${
                  isUser 
                    ? 'bg-brand-red text-white rounded-tr-none' 
                    : 'bg-slate-900 border border-slate-850 text-slate-300 rounded-tl-none'
                }`}>
                  <p>{msg.text}</p>
                  <span className={`text-[9px] block text-right mt-1 opacity-60`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 border-t border-slate-900/60 pt-3">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white flex items-center justify-center shrink-0 transition-colors shadow-lg shadow-brand-red/10 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
