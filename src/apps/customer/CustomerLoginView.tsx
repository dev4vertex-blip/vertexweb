import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { VertexLogo } from '../../components/common/VertexLogo';
import { Button } from '../../components/ui/Button';
import { isDemoLoginEnabled } from '../../shared/config';
import { Phone, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Shield } from 'lucide-react';

interface CustomerLoginViewProps {
  onSuccess?: () => void;
}

export const CustomerLoginView: React.FC<CustomerLoginViewProps> = ({ onSuccess }) => {
  const { loginWithOtp } = useAuth();
  const { addToast, setAppRole } = useApp();

  const demoEnabled = isDemoLoginEnabled();
  const [phone, setPhone] = useState(demoEnabled ? '9999990002' : '');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(demoEnabled ? '1234' : '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpStep(true);
    if (demoEnabled) {
      setOtp('1234');
      addToast('OTP Sent', 'Development OTP: 1234 (Test simulation)', 'info');
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
        role: 'CUSTOMER',
      });
      setAppRole('customer');
      addToast('Welcome to VERTEX', `Logged in as ${user.name}`, 'success');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid verification code.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="flex justify-center mb-4">
          <VertexLogo size="lg" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          VERTEX Customer App
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Book certified home repairs, appliance service, and AMC protection plans
        </p>

        {demoEnabled && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Development Mode: Test Login Active</span>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!otpStep ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit number"
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    required
                  />
                  <Phone className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {demoEnabled && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>Demo Customer: 9999990002</span>
                  <button
                    type="button"
                    onClick={() => setPhone('9999990002')}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Use Demo
                  </button>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full justify-center py-2.5">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOtpStep(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change number</span>
                </button>
                <span className="text-xs text-slate-500">+91 {phone.slice(-10)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 4-digit code"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>

              {demoEnabled && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Demo simulation OTP: <strong>1234</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtp('1234')}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Auto-fill 1234
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full justify-center py-2.5"
              >
                {loading ? 'Verifying...' : 'Verify & Enter App'}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Customer Session • 256-bit Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
