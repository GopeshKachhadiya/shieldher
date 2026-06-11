import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { store } from '../../data/store';

export default function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = (e: FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
    }, 1200);
  };

  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP code (e.g., 123456)');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const profile = store.getProfile();
      store.setProfile({
        ...profile,
        phone: `+91 ${phone}`,
        isLoggedIn: true
      });
      navigate('/');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100 justify-center px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-red flex items-center justify-center shadow-xl shadow-brand-red/35 mb-4">
          <Shield className="w-9 h-9 text-white" />
        </div>
        <h1 className="font-display font-bold text-3xl tracking-wider text-white">ShieldHer</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-[280px]">
          Ahmedabad City Safety Platform — Verify your identity to access distress & cybercrime tools
        </p>
      </div>

      <div className="bg-dark-card border border-slate-900 rounded-2xl p-6 shadow-xl">
        {error && (
          <div className="mb-4 px-3 py-2 rounded bg-red-500/10 border border-red-500/20 text-xs text-brand-red font-medium">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <span className="text-sm font-semibold">+91</span>
                </div>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-xl py-3 pl-14 pr-4 text-sm text-white focus:outline-none transition-colors font-medium tracking-wide"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-brand-red-dark disabled:bg-brand-red/50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-red/25 transition-all text-sm cursor-pointer"
            >
              <span>{loading ? 'Sending Code...' : 'Send OTP via SMS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs text-brand-red hover:underline"
                >
                  Change Number
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="6-digit OTP (e.g. 123456)"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900/50 border border-slate-800 focus:border-brand-red rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none transition-colors font-medium tracking-widest text-center"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                OTP sent to +91 {phone.substring(0,5)} {phone.substring(5)}. Enter any 6 digits to bypass in demo.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-brand-red-dark disabled:bg-brand-red/50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-red/25 transition-all text-sm cursor-pointer"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Log In'}</span>
              <Shield className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 text-center space-y-3">
        <button
          onClick={() => navigate('/onboarding')}
          className="text-xs text-slate-400 hover:text-slate-200 block mx-auto underline"
        >
          New user? Set up profile onboarding
        </button>

        <button
          onClick={() => navigate('/police/login')}
          className="w-full flex items-center justify-center gap-2 border border-slate-900 bg-slate-950/40 hover:bg-slate-950/90 text-xs text-slate-400 hover:text-slate-200 py-2.5 px-4 rounded-xl transition-all"
        >
          <ShieldAlert className="w-4 h-4 text-brand-red" />
          <span>👮 Officer Access: Cyber Crime Control Deck</span>
        </button>
      </div>
      </div>
    </div>
  );
}
