import { useState, useRef } from 'react';
import { ShieldCheck, MapPin, ShieldAlert, X, EyeOff } from 'lucide-react';
import { useActiveSOS } from '../../data/store';

interface ActiveSOSOverlayProps {
  onDeactivate: () => void;
}

export default function ActiveSOSOverlay({ onDeactivate }: ActiveSOSOverlayProps) {
  const [panicMode, setPanicMode] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [cancelHolding, setCancelHolding] = useState(false);
  const [cancelProgress, setCancelProgress] = useState(0);
  const cancelTimerRef = useRef<number | null>(null);
  
  const { activeSOS } = useActiveSOS();
  const coords = activeSOS ? { lat: activeSOS.latitude, lng: activeSOS.longitude } : { lat: 23.0225, lng: 72.5714 };

  // Cancel hold logic (2 seconds)
  const startCancelHold = () => {
    setCancelHolding(true);
    setCancelProgress(0);
    const startTime = Date.now();
    cancelTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / 2000, 1);
      setCancelProgress(pct);

      if (elapsed >= 2000) {
        window.clearInterval(cancelTimerRef.current!);
        setCancelHolding(false);
        onDeactivate();
      }
    }, 40);
  };

  const endCancelHold = () => {
    if (cancelTimerRef.current) window.clearInterval(cancelTimerRef.current);
    setCancelHolding(false);
    setCancelProgress(0);
  };

  // Calculator logic for Panic Mode
  const handleCalcPress = (val: string) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else if (val === '=') {
      try {
        // Safe evaluation simulation
        // If passcode typed (e.g. 911# or 1234) we deactivate panic mode
        if (calcInput === '911' || calcInput === '1234') {
          setPanicMode(false);
          setCalcInput('');
          return;
        }
        
        // Basic parser
        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, '');
        const res = Function(`"use strict"; return (${sanitized})`)();
        setCalcResult(String(res));
      } catch {
        setCalcResult('Error');
      }
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  if (panicMode) {
    // FAKE CALCULATOR INTERFACE
    const buttons = [
      '7', '8', '9', '/',
      '4', '5', '6', '*',
      '1', '2', '3', '-',
      'C', '0', '=', '+'
    ];

    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col justify-end p-6 max-w-md mx-auto border-x border-slate-900 shadow-2xl">
        <div className="flex-1 flex flex-col justify-end mb-6 text-right font-mono">
          <div className="text-slate-500 text-sm overflow-hidden whitespace-nowrap mb-1">
            {calcInput || '0'}
          </div>
          <div className="text-white text-4xl font-semibold overflow-hidden">
            {calcResult || '0'}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {buttons.map((btn) => (
            <button
              key={btn}
              onClick={() => handleCalcPress(btn)}
              className={`h-16 rounded-xl text-xl font-bold flex items-center justify-center transition-colors ${
                btn === '='
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : btn === 'C'
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : ['/', '*', '-', '+'].includes(btn)
                  ? 'bg-slate-800 text-amber-500 hover:bg-slate-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-800 text-center mt-4 uppercase tracking-widest font-mono">
          Standard Calculator Mode Active
        </p>
      </div>
    );
  }

  // STANDARD ACTIVE SOS UI
  return (
    <div className="fixed inset-0 bg-[#060309] z-50 flex flex-col justify-between p-6 max-w-md mx-auto border-x border-slate-900 shadow-2xl">
      <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
        {/* Pulsing Alarm Beacon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center glowing-red-orb pulse-ring-1">
            <ShieldAlert className="w-12 h-12 text-white animate-bounce" />
          </div>
        </div>

        <div>
          <h2 className="font-display font-bold text-2xl text-white tracking-wider uppercase leading-none">
            EMERGENCY ACTIVE
          </h2>
          <p className="text-xs text-red-400 font-semibold tracking-wide uppercase mt-2">
            Dispatches Sent to PCR & Cyber Cell
          </p>
        </div>

        {/* Dispatch indicators */}
        <div className="w-full bg-slate-950/80 border border-slate-900 rounded-2xl p-4 space-y-3.5 text-left">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Live Coordinates</span>
              <span className="text-xs text-slate-200 font-mono">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} (GPS ±6m)
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">PCR Status</span>
              <span className="text-xs text-emerald-400 font-semibold">
                {activeSOS?.status === 'responding' 
                  ? "Unit En Route (SI R. Joshi - PCR Van 12)" 
                  : activeSOS?.status === 'resolved'
                  ? "SOS RESOLVED BY CONTROL ROOM"
                  : "SOS Transmitted (Awaiting Dispatch)"}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-900/60 pt-3">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Contacts Alerted</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-brand-red font-medium">Ahmedabad Cyber Cell</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-medium">Rajesh Sharma (Father)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-medium">Sunita Sharma (Mother)</span>
            </div>
          </div>
        </div>

        {/* Panic button to toggle Calculator shield */}
        <button
          onClick={() => setPanicMode(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors border border-slate-800 cursor-pointer"
        >
          <EyeOff className="w-4 h-4 text-amber-500" />
          <span>Launch Panic Shield (Fake Calculator)</span>
        </button>
      </div>

      {/* Cancel Emergency SOS Action bar */}
      <div className="w-full space-y-3 pt-6 border-t border-slate-900/40">
        <div className="relative">
          {cancelHolding && (
            <div className="absolute inset-0 bg-slate-900/40 rounded-xl overflow-hidden pointer-events-none">
              <div 
                className="h-full bg-slate-800 transition-all duration-75"
                style={{ width: `${cancelProgress * 100}%` }}
              />
            </div>
          )}
          
          <button
            onMouseDown={startCancelHold}
            onMouseUp={endCancelHold}
            onMouseLeave={endCancelHold}
            onTouchStart={startCancelHold}
            onTouchEnd={endCancelHold}
            className="w-full relative bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-xs tracking-wider uppercase cursor-pointer"
          >
            <X className="w-4 h-4 text-red-500" />
            <span>{cancelHolding ? 'Hold to Confirm...' : 'Hold 2s to Cancel SOS'}</span>
          </button>
        </div>
        <p className="text-[9px] text-slate-600 text-center font-medium">
          Accidental triggers will be logged with Ahmedabad Police Control.
        </p>
      </div>
    </div>
  );
}
