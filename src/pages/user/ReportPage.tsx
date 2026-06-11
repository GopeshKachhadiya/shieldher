import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, MessageSquareOff, Key, ScanFace, DollarSign, 
  Link2, UserX, Lock, HelpCircle, ArrowRight, ArrowLeft, 
  UploadCloud, FileCheck, Bot, Trash, ShieldCheck 
} from 'lucide-react';
import { cybercrimeCategories, getProfileScanResult } from '../../data/mockData';
import { store } from '../../data/store';

export default function ReportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Form States
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<{ id: string; name: string; size: string; hash: string }[]>([]);
  const [suspectInfo, setSuspectInfo] = useState({ platform: 'Instagram', username: '', url: '' });
  const [consent, setConsent] = useState(false);
  const [wantFir, setWantFir] = useState(false);
  
  // Action states
  const [aiDrafting, setAiDrafting] = useState(false);
  const [scanningProfile, setScanningProfile] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Map Category IDs to Lucide Icons
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'cyberstalking': return ShieldAlert;
      case 'harassment': return MessageSquareOff;
      case 'blackmail': return Key;
      case 'deepfake': return ScanFace;
      case 'financial_fraud': return DollarSign;
      case 'phishing': return Link2;
      case 'identity_theft': return UserX;
      case 'account_hacking': return Lock;
      default: return HelpCircle;
    }
  };

  // AI Assistant Drafting mock
  const handleAiDraft = () => {
    if (description.length < 20) {
      alert("Please enter a brief outline of the event (minimum 20 characters) first.");
      return;
    }
    setAiDrafting(true);
    setTimeout(() => {
      setDescription(prev => 
        `COMPLAINT DRAFT (AI ENHANCED):\n\nI am reporting an incident of cybercrime regarding ${category.toUpperCase().replace('_', ' ')}. On or around ${incidentDate || 'recent date'}, the suspect operating under username "${suspectInfo.username || 'unidentified'}" contacted me. \n\nDetails of events:\n${prev}\n\nThis behavior is causing immense distress and constitutes a breach of digital privacy and harassment. I request investigation by the Ahmedabad Police Cyber Crime branch.`
      );
      setAiDrafting(false);
    }, 1500);
  };

  // File Upload mock + hash calculation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    
    // Simulate reading file and hashing
    setTimeout(() => {
      const filesArr = Array.from(e.target.files!);
      const newFiles = filesArr.map((f, idx) => {
        // Generate pseudo-SHA256 hash
        const chars = '0123456789abcdef';
        let hash = '';
        for (let i = 0; i < 64; i++) {
          hash += chars[Math.floor(Math.random() * 16)];
        }
        return {
          id: `ev-${Date.now()}-${idx}`,
          name: f.name,
          size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
          hash: hash
        };
      });

      setEvidenceFiles(prev => [...prev, ...newFiles]);
      setUploading(false);
    }, 1200);
  };

  const removeFile = (id: string) => {
    setEvidenceFiles(prev => prev.filter(f => f.id !== id));
  };

  // Suspect scan lookup mock
  const handleProfileScan = () => {
    if (!suspectInfo.url) return;
    setScanningProfile(true);
    setScanResult(null);
    setTimeout(() => {
      const res = getProfileScanResult(suspectInfo.url);
      setScanResult(res);
      setScanningProfile(false);
    }, 2000);
  };

  // Submit Complaint Mock
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    
    store.addComplaint(
      category,
      description,
      incidentDate,
      suspectInfo,
      evidenceFiles,
      wantFir
    );
    
    navigate('/complaints');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-white">Report Cybercrime</h2>
        <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
          <span>Step {step} of 5</span>
          <span className="font-semibold text-brand-red">
            {step === 1 && 'Incident Category'}
            {step === 2 && 'Incident Details'}
            {step === 3 && 'Evidence Safe'}
            {step === 4 && 'Suspect Directory'}
            {step === 5 && 'Consent & File'}
          </span>
        </div>

        {/* Step Progress indicators */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden flex">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div 
              key={idx}
              className={`flex-1 h-full transition-all border-r border-slate-950 last:border-0 ${
                idx <= step ? 'bg-brand-red' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">Select incident category:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {cybercrimeCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              const isSelected = category === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-500/10 border-brand-red shadow-lg shadow-brand-red/5'
                      : 'bg-dark-card border-slate-900 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                    isSelected ? 'bg-brand-red text-white border-brand-red' : 'bg-slate-900 border-slate-850 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {cat.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal mt-1">{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!category}
              className="bg-brand-red hover:bg-brand-red-dark disabled:bg-brand-red/50 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: INCIDENT DESCRIPTION & DATE */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-dark-card border border-slate-900 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Incident Occurrence Date
              </label>
              <input
                type="date"
                required
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-lg py-2.5 px-3 text-sm focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Detailed Narrative Description
                </label>
                <button
                  type="button"
                  onClick={handleAiDraft}
                  disabled={aiDrafting}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-semibold uppercase tracking-wider hover:bg-slate-950 transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{aiDrafting ? 'Drafting...' : 'AI Assist'}</span>
                </button>
              </div>
              <textarea
                required
                rows={7}
                placeholder="Provide details about what happened. Include site/platform names, what the messages said, and details about the harassment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-lg py-2.5 px-3 text-xs focus:outline-none transition-colors leading-relaxed"
              />
              <span className="text-[10px] text-slate-500 block text-right mt-1">
                {description.length} characters (Min 50 recommended)
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={description.length < 10 || !incidentDate}
              className="bg-brand-red hover:bg-brand-red-dark disabled:bg-brand-red/50 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EVIDENCE FILES UPLOADER */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-dark-card border border-slate-900 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Upload Cyber Evidence Files</h4>
            
            {/* Drag & Drop Area */}
            <div className="relative border-2 border-dashed border-slate-800 hover:border-brand-red/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-950/20">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-slate-500 mb-2 animate-bounce" />
              <span className="text-xs font-bold text-slate-350">Drag screenshots or PDF files here</span>
              <span className="text-[9px] text-slate-600 mt-1">Accepts PNG, JPG, PDF up to 50MB</span>
            </div>

            {uploading && (
              <div className="flex items-center justify-center gap-2.5 text-xs text-brand-red font-medium py-3 border border-slate-900/60 rounded-xl bg-slate-950/40">
                <span className="w-4 h-4 rounded-full border-2 border-brand-red border-t-transparent animate-spin" />
                <span>Hashing & encrypting upload in progress...</span>
              </div>
            )}

            {/* Evidence List */}
            {evidenceFiles.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Uploaded Evidence Checklist</span>
                {evidenceFiles.map((file) => (
                  <div key={file.id} className="bg-slate-900/60 border border-slate-850/80 rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-start gap-3">
                      <FileCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-355 block truncate">{file.name}</span>
                        <span className="text-[9px] text-slate-550 block font-mono mt-0.5 truncate max-w-[240px]">
                          SHA-256: {file.hash}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(file.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="bg-brand-red hover:bg-brand-red-dark text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUSPECT DETAILS */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-dark-card border border-slate-900 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Suspect Platform Details</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Social Platform
                </label>
                <select
                  value={suspectInfo.platform}
                  onChange={(e) => setSuspectInfo(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-brand-red text-white"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Other">Other Platform</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Username/Handle
                </label>
                <input
                  type="text"
                  placeholder="e.g. @dark_shadow_666"
                  value={suspectInfo.username}
                  onChange={(e) => setSuspectInfo(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-lg py-2.5 px-3 text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Profile Link/URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://instagram.com/profile"
                  value={suspectInfo.url}
                  onChange={(e) => setSuspectInfo(prev => ({ ...prev, url: e.target.value }))}
                  className="flex-1 bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-lg py-2 px-3 text-xs focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleProfileScan}
                  disabled={!suspectInfo.url || scanningProfile}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-350 border border-slate-800 py-2 px-3.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {scanningProfile ? 'Scanning...' : 'Scan Profile'}
                </button>
              </div>
            </div>

            {/* Suspect Scan result card */}
            {scanResult && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-400 uppercase tracking-wide">AI Threat Profile Analysis</span>
                  <span className="text-[10px] font-extrabold bg-red-500/20 text-brand-red px-2 py-0.5 rounded">
                    Score: {scanResult.fakeScore}%
                  </span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] leading-relaxed">
                  {scanResult.reasons.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(5)}
              className="bg-brand-red hover:bg-brand-red-dark text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW, CONSENT & SUBMIT */}
      {step === 5 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-dark-card border border-slate-900 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-semibold text-slate-350 uppercase tracking-wider">Review Complaint File</h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-900/60">
                <span className="text-slate-500">Incident Category</span>
                <span className="font-semibold text-slate-200 capitalize">{category.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900/60">
                <span className="text-slate-500">Incident Date</span>
                <span className="font-semibold text-slate-200">{incidentDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900/60">
                <span className="text-slate-500">Evidence Files</span>
                <span className="font-semibold text-slate-200">{evidenceFiles.length} uploaded</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-900/60">
                <span className="text-slate-500">Suspect Handle</span>
                <span className="font-semibold text-slate-200">{suspectInfo.username || 'Unspecified'}</span>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-brand-red cursor-pointer"
                />
                <span className="leading-relaxed">
                  I consent to sharing my uploaded evidence and hash logs securely with the Ahmedabad Cyber Crime Cell.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantFir}
                  onChange={(e) => setWantFir(e.target.checked)}
                  className="mt-0.5 accent-brand-red cursor-pointer"
                />
                <span className="leading-relaxed">
                  Generate an AI draft FIR report automatically for reviewing in the inspector queue.
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={!consent}
              className="bg-brand-red hover:bg-brand-red-dark disabled:bg-brand-red/50 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Submit Complaint</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
