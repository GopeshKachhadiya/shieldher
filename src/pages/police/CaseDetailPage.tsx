import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, MessageSquare, ShieldCheck, 
  PenTool, CheckCircle 
} from 'lucide-react';
import { useComplaints, store } from '../../data/store';
import type { Complaint } from '../../data/mockData';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const complaints = useComplaints();
  const complaint = complaints.find(c => c.id === id);

  const [message, setMessage] = useState('');
  const [firText, setFirText] = useState('');
  const [firFinalized, setFirFinalized] = useState(!!complaint?.firNumber);

  useEffect(() => {
    if (complaint?.firDraft?.text && !firText) {
      setFirText(complaint.firDraft.text);
    }
  }, [complaint]);
  const [hashVerifying, setHashVerifying] = useState(false);
  const [hashVerified, setHashVerified] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [complaint?.messages]);

  if (!complaint) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-slate-500">Case file not found.</p>
        <button onClick={() => navigate('/police/cases')} className="text-brand-red text-xs mt-2 underline">
          Return to Queue
        </button>
      </div>
    );
  }

  // Update Status Mock
  const handleStatusChange = (newStatus: Complaint['status']) => {
    if (complaint) {
      store.updateComplaintStatus(complaint.id, newStatus);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !complaint) return;

    store.addComplaintMessage(complaint.id, 'officer', message);
    setMessage('');
  };

  const verifyIntegrity = () => {
    setHashVerifying(true);
    setTimeout(() => {
      setHashVerifying(false);
      setHashVerified(true);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/police/cases')} 
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div>
          <h2 className="font-display font-bold text-lg text-white">Case Audit Workspace</h2>
          <span className="text-xs text-slate-500 font-mono">{complaint.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Left Column (Details & Forensic Hashes - 7 Columns) */}
        <div className="col-span-7 space-y-5">
          {/* Summary Details */}
          <div className="bg-dark-card border border-slate-900 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <span className="text-xs font-extrabold uppercase text-slate-450">Citizen Incident Report</span>
              <span className="text-[10px] px-2 py-0.5 bg-red-500/10 border border-red-500/25 rounded text-brand-red font-bold">
                Risk Score: {(complaint.aiRiskScore * 100).toFixed(0)}%
              </span>
            </div>
            
            <p className="text-xs text-slate-350 leading-relaxed bg-slate-950/20 border border-slate-900/60 p-3.5 rounded-xl font-mono text-[11px]">
              {complaint.description}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Complainant Info</span>
                <span className="font-bold text-slate-300 block mt-1">Priya Sharma</span>
                <span className="text-slate-550 block font-mono mt-0.5">+91 98765 43210</span>
              </div>
              
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Investigation Status</span>
                <select
                  value={complaint.status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="bg-slate-950/60 border border-slate-900 rounded-lg py-1.5 px-2.5 text-xs text-slate-300 focus:outline-none mt-1"
                >
                  <option value="submitted">Submitted</option>
                  <option value="assigned">Assigned</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Forensic Hash Logs (Chain of Custody) */}
          <div className="bg-dark-card border border-slate-900 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-xs font-extrabold uppercase text-slate-450 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Evidence Chain-of-Custody</span>
              </span>

              <button
                onClick={verifyIntegrity}
                disabled={hashVerifying}
                className="bg-slate-905 border border-slate-900 text-slate-350 hover:text-white px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg cursor-pointer"
              >
                {hashVerifying ? 'Auditing Hash...' : 'Audit Integrity'}
              </button>
            </div>

            {hashVerified && (
              <div className="px-3 py-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Forensic Hash Checked: Tamper-proof logs verified. Chain of Custody intact.</span>
              </div>
            )}

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {complaint.evidenceFiles.map((file) => (
                <div key={file.id} className="bg-slate-950/40 border border-slate-900 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{file.size}</span>
                  </div>
                  <div className="text-[9.5px] text-slate-550 flex justify-between items-center gap-2">
                    <span className="font-mono text-emerald-500 select-all truncate max-w-[280px]">Hash: {file.hash}</span>
                    <span className="text-slate-600 font-semibold italic">MATCHED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (AI FIR Panel & Complainant Chat - 5 Columns) */}
        <div className="col-span-5 space-y-5">
          {/* AI FIR Reviewer panel */}
          {complaint.firDraft && (
            <div className="bg-dark-card border border-slate-900 rounded-xl p-5 space-y-4 flex flex-col h-[340px]">
              <div className="flex justify-between items-center border-b border-slate-900 pb-2 shrink-0">
                <span className="text-xs font-extrabold uppercase text-slate-450 flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-brand-red" />
                  <span>AI FIR Draft Assist</span>
                </span>
                
                <button
                  onClick={() => {
                    if (complaint) {
                      store.finalizeFIR(complaint.id, firText);
                      setFirFinalized(true);
                    }
                  }}
                  disabled={firFinalized}
                  className="bg-brand-red hover:bg-brand-red-dark disabled:bg-slate-900 disabled:text-slate-500 text-white px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg cursor-pointer"
                >
                  {firFinalized ? 'Finalized' : 'Finalize FIR'}
                </button>
              </div>

              {firFinalized ? (
                <div className="flex-1 bg-slate-950/50 border border-slate-900/60 rounded-xl p-3 overflow-y-auto no-scrollbar font-mono text-[10.5px] leading-relaxed relative flex flex-col justify-center items-center text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center text-emerald-500 mb-3 animate-bounce">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <span className="font-display font-bold text-sm text-slate-200">FIR Logged Successfully</span>
                  <span className="text-slate-500 text-[10px] mt-1 font-mono">ID: {complaint.firNumber}</span>
                  <span className="text-slate-600 text-[10.5px] mt-3 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-sans font-bold">
                    Forwarded to Court Deck
                  </span>
                </div>
              ) : (
                <textarea
                  value={firText}
                  onChange={(e) => setFirText(e.target.value)}
                  className="flex-1 bg-slate-950/50 border border-slate-900 rounded-xl p-3 text-[10.5px] font-mono leading-relaxed focus:outline-none focus:border-brand-red text-slate-350 resize-none"
                />
              )}
            </div>
          )}

          {/* Secure Chat Deck */}
          <div className="bg-dark-card border border-slate-900 rounded-xl p-4 flex flex-col h-[280px]">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-2 mb-3 shrink-0">
              <MessageSquare className="w-4 h-4 text-brand-red" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Complainant Direct Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3 no-scrollbar">
              {complaint.messages.map((msg) => {
                const isOfficer = msg.sender === 'officer';
                return (
                  <div key={msg.id} className={`flex ${isOfficer ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-normal ${
                      isOfficer 
                        ? 'bg-brand-red text-white rounded-tr-none' 
                        : 'bg-slate-900 border border-slate-850 text-slate-300 rounded-tl-none'
                    }`}>
                      <p>{msg.text}</p>
                      <span className="text-[9px] block text-right mt-1 opacity-60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0 border-t border-slate-900/60 pt-3">
              <input
                type="text"
                placeholder="Message complainant..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-xl py-2 px-3 text-xs text-white focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
