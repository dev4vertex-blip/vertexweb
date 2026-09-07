import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { VertexLogo } from '../../components/common/VertexLogo';
import { Button } from '../../components/ui/Button';
import { isDemoLoginEnabled } from '../../shared/config';
import { Phone, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Wrench, ShieldCheck } from 'lucide-react';

interface TechnicianLoginViewProps {
  onSuccess?: () => void;
}

export const TechnicianLoginView: React.FC<TechnicianLoginViewProps> = ({ onSuccess }) => {
  const { loginWithOtp } = useAuth();
  const { addToast, setAppRole } = useApp();

  const demoEnabled = isDemoLoginEnabled();
  const [phone, setPhone] = useState(demoEnabled ? '9999990001' : '');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(demoEnabled ? '1234' : '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit registered partner number.');
      return;
    }
    setOtpStep(true);
    if (demoEnabled) {
      setOtp('1234');
      addToast('OTP Sent', 'Development Partner OTP: 1234 (Test simulation)', 'info');
    } else {
      setOtp('');
      addToast('OTP Sent', `Verification code sent to +91 ${cleanPhone.slice(-10)}`, 'info');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      const user = await loginWithOtp({
        phone,
        otp,
        role: 'TECHNICIAN',
      });
      setAppRole('technician');
      addToast('Welcome Partner', `Logged in as ${user.name}`, 'success');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid partner credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="flex justify-center mb-4">
          <VertexLogo size="lg" isDark />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20 mb-2">
          <Wrench className="w-3 h-3" />
          <span>VERTEX PARTNER APP</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Technician Fleet Portal
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Job dispatch, on-demand service execution, and instant payout tracking
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 shadow-xl rounded-2xl border border-slate-700 sm:px-10">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!otpStep ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Partner Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit number"
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-900/90 border border-slate-600 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                  <Phone className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {demoEnabled && (
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700 text-xs text-slate-400 flex items-center justify-between">
                  <span>Demo Partner: 9999990001</span>
                  <button
                    type="button"
                    onClick={() => setPhone('9999990001')}
                    className="text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    Use Demo
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
              >
                <span>Request OTP</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOtpStep(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change number</span>
                </button>
                <span className="text-xs text-slate-400">+91 {phone.slice(-10)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 4-digit code"
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-600 rounded-xl text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              {demoEnabled && (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Demo Partner OTP: <strong>1234</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp('1234')}
                    className="text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    Auto-fill 1234
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full justify-center py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
              >
                {loading ? 'Verifying Partner Session...' : 'Verify & Open Partner App'}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>KYC Verified Partner Terminal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
