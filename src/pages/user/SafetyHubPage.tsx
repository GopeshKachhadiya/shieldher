import React, { useState, useEffect } from 'react';
import { 
  Globe, Phone, BookOpen, Search, ShieldCheck, AlertTriangle, 
  ExternalLink, ArrowRight, Settings, Radio, Mic, MessageSquare, ShieldAlert
} from 'lucide-react';
import { 
  useUserProfile, useUserCoords, useGeofencingEnabled, store 
} from '../../data/store';
import { t } from '../../data/translations';
import type { Language } from '../../data/translations';

export default function SafetyHubPage() {
  const [profile] = useUserProfile();
  const lang = (profile.lang || 'en') as Language;
  
  const [activeTab, setActiveTab] = useState<'scanner' | 'helplines' | 'lessons' | 'simulation'>('scanner');
  
  // Link scanner state
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Geofencing states from store
  const [geofencingEnabled, toggleGeofencing] = useGeofencingEnabled();
  const [coords, updateCoords] = useUserCoords();

  // Voice SOS state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [voiceLog, setVoiceLog] = useState<string>('Voice SOS Engine ready. Turn ON to begin listening.');

  // SMS Simulator state
  const [smsPhone, setSmsPhone] = useState('+91 98765 43210');
  const [smsMessage, setSmsMessage] = useState('SOS');
  const [smsLog, setSmsLog] = useState<string>('');

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setScanResult(null);

    try {
      const response = await fetch('http://localhost:8000/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const result = await response.json();
      setScanResult(result);
    } catch (error) {
      console.error('Error scanning URL:', error);
      // Fallback for UI if backend is not running
      setScanResult({
        url,
        phishingScore: 0,
        riskLevel: 'SAFE',
        domainAge: 'Unknown',
        sslValid: url.startsWith('https'),
        reasons: ['Unable to reach AI backend. Assumed safe fallback.', 'Please start the FastAPI server on port 8000.']
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (level === 'SAFE') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (level === 'SUSPICIOUS') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  // Web Speech API Integration
  useEffect(() => {
    if (!voiceEnabled) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('SpeechRecognition is not supported in this browser. Use Chrome or Edge.');
      setVoiceLog('Error: SpeechRecognition API not supported.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
      setVoiceLog(prev => `Speech recognition active. Listening for trigger keywords...\n${prev}`);
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();
      setVoiceLog(prev => `Captured speech: "${transcript}"\n${prev}`);

      const triggerPhrases = [
        'help me', 'help help', 'emergency', 'call 112',
        'bachao', 'madad karo', 'khatra hai', 'mujhe bachao',
        'bachav', 'police ne bulavo'
      ];

      const matchedKeyword = triggerPhrases.find(kw => transcript.includes(kw));
      if (matchedKeyword) {
        setVoiceLog(prev => `🚨 DETECTED TRIGGER KEYWORD: "${matchedKeyword.toUpperCase()}". Triggering SOS distress beacon...\n${prev}`);
        // Trigger SOS in the store
        store.triggerSOS('voice', coords);
        setVoiceEnabled(false);
      }
    };

    recognition.onerror = (e: any) => {
      console.warn('SpeechRecognition error:', e);
      if (e.error === 'not-allowed') {
        setSpeechError('Microphone permission blocked by browser.');
      } else {
        setSpeechError(`Web Speech error: ${e.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Automatically restart if voiceEnabled is still toggled on
      if (voiceEnabled) {
        try {
          recognition.start();
        } catch (err) {}
      }
    };

    try {
      recognition.start();
    } catch (err) {
      setSpeechError('Failed to capture audio.');
    }

    return () => {
      try {
        recognition.stop();
      } catch (err) {}
    };
  }, [voiceEnabled, lang, coords]);

  const handleSimulateSMS = (e: React.FormEvent) => {
    e.preventDefault();
    setSmsLog(`POST /api/webhooks/twilio/sms HTTP/1.1\nContent-Type: application/x-www-form-urlencoded\nFrom: ${smsPhone}\nBody: ${smsMessage}\n\nProcessing...`);
    
    setTimeout(() => {
      const res = store.simulateIncomingSMS(smsPhone, smsMessage);
      setSmsLog(prev => `${prev}\n\nResponse status: 200 OK\nTwilio TwiML Reply:\n<Response>\n  <Message>${res.replyMessage}</Message>\n</Response>\n\nLive SOS Alert successfully pushed to Police incident map!`);
    }, 1000);
  };

  const teleportOptions = [
    { name: 'Vastrapur Area (Safe Area)', lat: 23.0338, lng: 72.5250, risk: 'Green (Level 1)' },
    { name: 'Kalupur Station (Red Zone)', lat: 23.02686, lng: 72.59900, risk: 'Red (Level 4)' },
    { name: 'Rakhial Underpass (Critical Zone)', lat: 23.04800, lng: 72.62100, risk: 'Crimson (Level 5)' },
    { name: 'Gomtipur Industrial (Red Zone)', lat: 23.01900, lng: 72.61900, risk: 'Red (Level 4)' },
    { name: 'Behrampura Block (Orange Zone)', lat: 23.00100, lng: 72.60500, risk: 'Orange (Level 3)' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-white">{t('cyber_hub', lang)}</h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          {t('cyber_hub_desc', lang)}
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-slate-950/80 border border-slate-900 rounded-xl p-1 shrink-0">
        {[
          { id: 'scanner', label: t('link_scanner', lang), icon: Globe },
          { id: 'helplines', label: t('directories', lang), icon: Phone },
          { id: 'lessons', label: t('awareness', lang), icon: BookOpen },
          { id: 'simulation', label: t('settings_simulation', lang), icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-brand-red text-white shadow shadow-brand-red/15'
                  : 'text-slate-500 hover:text-slate-350'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LINK SCANNER */}
      {activeTab === 'scanner' && (
        <div className="space-y-4">
          <div className="bg-dark-card border border-slate-900 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-200">{t('paste_link', lang)}</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                {t('scanner_desc', lang)}
              </p>
            </div>

            <form onSubmit={handleScanSubmit} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g. http://secure-payment-verify.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-red hover:bg-brand-red-dark disabled:bg-brand-red/50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-brand-red/10 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{loading ? t('scanning', lang) : t('scan_button', lang)}</span>
              </button>
            </form>

            {/* Scan Results Card */}
            {scanResult && (
              <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20">
                <div className="p-4 flex items-center justify-between border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    {scanResult.riskLevel === 'SAFE' ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    ) : scanResult.riskLevel === 'SUSPICIOUS' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-brand-red" />
                    )}
                    <span className="text-xs font-bold text-slate-250 truncate max-w-[150px]">
                      {scanResult.url}
                    </span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border uppercase ${getRiskColor(scanResult.riskLevel)}`}>
                    {scanResult.riskLevel}
                  </span>
                </div>

                <div className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 font-medium">
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                      <span className="text-[9px] text-slate-500 block uppercase mb-0.5">{t('phishing_threat', lang)}</span>
                      <span className="text-sm font-bold text-slate-200">{scanResult.phishingScore}% Risk</span>
                    </div>
                    <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                      <span className="text-[9px] text-slate-500 block uppercase mb-0.5">{t('ssl_cert', lang)}</span>
                      <span className={`text-sm font-bold ${scanResult.sslValid ? 'text-emerald-400' : 'text-brand-red'}`}>
                        {scanResult.sslValid ? 'Valid/Secure' : 'Unsigned/Risk'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-900/60">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{t('ai_audit', lang)}</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[10.5px] leading-relaxed">
                      {scanResult.reasons.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DIRECTORIES */}
      {activeTab === 'helplines' && (
        <div className="space-y-3">
          {[
            { name: 'National Cyber Crime Bureau', phone: '1930', desc: 'Direct portal to report financial frauds and secure frozen accounts.', link: 'https://cybercrime.gov.in/' },
            { name: 'All-in-One PCR Rescue', phone: '112', desc: 'Direct police rescue units dispatch dispatchers.', link: '' },
            { name: 'Abhayam Women Helpline', phone: '181', desc: 'Government of Gujarat women support services.', link: '' },
            { name: 'Ahmedabad Cyber Cell Desk', phone: '079 2630 1930', desc: 'Ahmedabad Cyber Crime branch helpline.', link: '' }
          ].map((item, idx) => (
            <div key={idx} className="bg-dark-card border border-slate-900 rounded-2xl p-4 flex justify-between items-start gap-4">
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-200">{item.name}</h4>
                <p className="text-[11px] text-slate-500 leading-normal">{item.desc}</p>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] text-brand-red hover:underline flex items-center gap-1">
                    <span>Visit website</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <a
                href={`tel:${item.phone.replace(/\s+/g, '')}`}
                className="bg-brand-red hover:bg-brand-red-dark text-white rounded-xl p-2.5 shrink-0 flex items-center justify-center shadow-lg shadow-brand-red/10 cursor-pointer"
              >
                <Phone className="w-4.5 h-4.5" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: AWARENESS CENTER */}
      {activeTab === 'lessons' && (
        <div className="space-y-3">
          {[
            { title: 'The WhatsApp Task Scam', desc: 'Scammers offer Rs. 50 per YouTube like, then prompt you to join Telegram channels and deposit large sums of money for higher tasks. Never deposit money for jobs.', duration: '5 min read' },
            { title: 'Sextortion Shield Guidelines', desc: 'If contacted on Instagram/WhatsApp with threats to release morphed or private photos, block immediately, do not pay money, and report under Blackmail category with screenshot evidence. Ahmedabad police maintains complete privacy.', duration: '7 min read' },
            { title: 'Social Media Hijacking Protection', desc: 'Secure your Instagram & WhatsApp accounts: turn on Two-Factor Authentication (2FA) immediately. Cyber cell records show 80% of hacking complaints occur on accounts without 2FA.', duration: '4 min read' }
          ].map((lesson, idx) => (
            <div key={idx} className="bg-dark-card border border-slate-900 rounded-2xl p-4 space-y-2 hover:border-slate-850 transition-colors">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Threat Protection</span>
                <span>{lesson.duration}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-200">{lesson.title}</h4>
              <p className="text-xs text-slate-455 leading-relaxed">{lesson.desc}</p>
              <button className="text-[11px] font-bold text-brand-red flex items-center gap-1 hover:underline mt-2">
                <span>Learn defensive actions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: SIMULATION CONTROLS */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          {/* Geofencing Controls */}
          <div className="bg-dark-card border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-200">{t('danger_zones', lang)} Geofencing</h3>
                <p className="text-[11px] text-slate-550 mt-0.5">Automated warnings when stepping into high-risk grids</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={geofencingEnabled}
                  onChange={(e) => toggleGeofencing(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-red" />
              </label>
            </div>

            <div className="border-t border-slate-900/60 pt-4 space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                {t('teleport_location', lang)}
              </span>
              <p className="text-[10.5px] text-slate-500 leading-normal">
                {t('teleport_desc', lang)}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {teleportOptions.map((opt) => {
                  const isHere = Math.abs(coords.lat - opt.lat) < 0.0001 && Math.abs(coords.lng - opt.lng) < 0.0001;
                  return (
                    <button
                      key={opt.name}
                      onClick={() => updateCoords({ lat: opt.lat, lng: opt.lng })}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isHere
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold font-sans'
                          : 'bg-slate-950/20 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200 font-sans'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block truncate pr-2">{opt.name}</span>
                        <span className="text-[9.5px] text-slate-500 font-medium font-sans">Risk: {opt.risk}</span>
                      </div>
                      <Radio className={`w-4 h-4 shrink-0 ${isHere ? 'text-blue-400' : 'text-slate-700'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Voice-Activated SOS */}
          <div className="bg-dark-card border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-1.5">
                  <Mic className={`w-4.5 h-4.5 ${isListening ? 'text-brand-red animate-pulse' : 'text-slate-550'}`} />
                  <span>{t('voice_sos', lang)} Settings</span>
                </h3>
                <p className="text-[11px] text-slate-550 mt-0.5">{t('voice_sos_desc', lang)}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-red" />
              </label>
            </div>

            <div className="border-t border-slate-900/60 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {isListening ? t('voice_sos_active', lang) : t('voice_sos_disabled', lang)}
                </span>
              </div>

              {speechError && (
                <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-[10px] font-bold">
                  ⚠️ {speechError}
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Voice Recognition Logs</span>
                <textarea
                  readOnly
                  value={voiceLog}
                  rows={3}
                  className="w-full bg-slate-950/60 border border-slate-900 rounded-lg p-2 font-mono text-[9.5px] text-slate-400 focus:outline-none resize-none no-scrollbar leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* SMS Webhook Simulator */}
          <div className="bg-dark-card border border-slate-900 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="w-4.5 h-4.5 text-slate-550" />
                <span>{t('sms_simulator', lang)}</span>
              </h3>
              <p className="text-[11px] text-slate-550 mt-0.5">{t('sms_simulator_desc', lang)}</p>
            </div>

            <form onSubmit={handleSimulateSMS} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-900/60 pt-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">{t('sms_phone', lang)}</label>
                  <input
                    type="text"
                    required
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase block">{t('sms_message', lang)}</label>
                  <input
                    type="text"
                    required
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-brand-red font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-brand-red hover:bg-brand-red-dark text-white font-extrabold w-full py-2.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-brand-red/10 cursor-pointer pt-3 shrink-0"
                >
                  {t('simulate_button', lang)}
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">TwiML Webhook HTTP Logs</span>
                <textarea
                  readOnly
                  placeholder="Webhook responses and TwiML logs will render here when a simulation runs..."
                  value={smsLog}
                  rows={7}
                  className="w-full bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 font-mono text-[9px] text-slate-455 focus:outline-none resize-none no-scrollbar leading-relaxed"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
