import { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface SOSButtonProps {
  onTrigger: (triggerType: 'button' | 'silent' | 'voice') => void;
  isActive: boolean;
}

export default function SOSButton({ onTrigger, isActive }: SOSButtonProps) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const HOLD_TIME = 3000; // 3 seconds hold time

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isActive) return;
    setHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / HOLD_TIME, 1);
      setProgress(pct);

      if (elapsed >= HOLD_TIME) {
        clearInterval(timerRef.current!);
        setHolding(false);
        setProgress(0);
        onTrigger('button');
      }
    }, 40);
  };

  const endHold = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setHolding(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // SVG parameters
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      {/* Concentric Pulsing Rings (Only visible when not holding and not active) */}
      {!holding && !isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-40 h-40 rounded-full bg-red-500/20 absolute pulse-ring-1" />
          <div className="w-40 h-40 rounded-full bg-red-500/10 absolute pulse-ring-2" />
          <div className="w-40 h-40 rounded-full bg-red-500/5 absolute pulse-ring-3" />
        </div>
      )}

      {/* Trigger Button */}
      <button
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        className={`relative w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all select-none cursor-pointer duration-300 ${
          isActive
            ? 'bg-emerald-600 scale-100 glowing-green-orb'
            : holding
            ? 'bg-red-700 scale-95 shadow-inner'
            : 'bg-red-500 hover:bg-red-600 scale-100 glowing-red-orb'
        }`}
      >
        {/* Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="8"
          />
          <circle
            cx="88"
            cy="88"
            r={radius}
            fill="none"
            stroke="#ffffff"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-75"
          />
        </svg>

        {/* Button Content */}
        {isActive ? (
          <>
            <span className="text-4xl mb-1">🚨</span>
            <span className="font-display font-bold text-lg tracking-wider text-white">ACTIVE</span>
            <span className="text-[10px] text-emerald-100 uppercase tracking-widest mt-1">SOS Sent</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-10 h-10 text-white mb-1 animate-pulse" />
            <span className="font-display font-extrabold text-2xl tracking-widest text-white leading-none">
              SOS
            </span>
            <span className="text-[10px] text-red-100 font-semibold uppercase tracking-wider mt-1">
              {holding ? 'Holding...' : 'Hold 3s'}
            </span>
          </>
        )}
      </button>

      {/* Accidental click release tip */}
      {holding && (
        <span className="text-xs text-red-400 font-semibold mt-4 tracking-wide animate-pulse">
          Keep holding to alert emergency response...
        </span>
      )}
    </div>
  );
}
