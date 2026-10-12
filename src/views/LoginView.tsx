import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { VertexLogo } from '../components/common/VertexLogo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import {
  User,
  Wrench,
  Shield,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  Lock,
  Building,
  Home,
  Mail,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithCredentials, loginWithOtp } = useAuth();
  const { addToast, setAppRole } = useApp();

  const [activeTab, setActiveTab] = useState<'customer' | 'technician' | 'admin'>('customer');

  // Customer State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerOtpStep, setCustomerOtpStep] = useState(false);
  const [customerOtp, setCustomerOtp] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);

  // Technician State
  const [techPhone, setTechPhone] = useState('');
  const [techOtpStep, setTechOtpStep] = useState(false);
  const [techOtp, setTechOtp] = useState('');
  const [techLoading, setTechLoading] = useState(false);

  // Admin State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handlers
  const handleCustomerSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setCustomerLoading(true);
    try {
      await api.sendOtp(cleanPhone);
      setCustomerOtpStep(true);
      setCustomerOtp('');
      addToast('OTP Sent', `Verification code sent to +91 ${cleanPhone.slice(-10)}`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code.';
      setErrorMessage(msg);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCustomerVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setCustomerLoading(true);
    try {
      const user = await loginWithOtp({
        phone: customerPhone,
        otp: customerOtp,
        role: 'CUSTOMER',
      });
      setAppRole('customer');
      addToast('Welcome to VERTEX', `Logged in as ${user.name}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid verification code.';
      setErrorMessage(msg);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleTechSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanPhone = techPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit registered partner mobile number.');
      return;
    }
    setTechLoading(true);
    try {
      await api.sendOtp(cleanPhone);
      setTechOtpStep(true);
      setTechOtp('');
      addToast('OTP Sent', `Verification code sent to +91 ${cleanPhone.slice(-10)}`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send verification code.';
      setErrorMessage(msg);
    } finally {
      setTechLoading(false);
    }
  };

  const handleTechVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setTechLoading(true);
    try {
      const user = await loginWithOtp({
        phone: techPhone,
        otp: techOtp,
        role: 'TECHNICIAN',
      });
      setAppRole('technician');
      addToast('Technician Workspace', `Welcome back, ${user.name}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid verification code.';
      setErrorMessage(msg);
    } finally {
      setTechLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAdminLoading(true);
    try {
      const user = await loginWithCredentials({
        email: adminEmail,
        password: adminPassword,
      });

      const isStaffRole = [
        'SUPER_ADMIN',
        'ADMIN',
        'MANAGER',
        'SALES',
        'SALES_TEAM',
        'FINANCE',
        'MARKETING',
        'OPERATIONS',
        'SUPPORT',
      ].includes(user.role);

      if (!isStaffRole) {
        throw new Error('Access denied. VERTEX Admin Portal is reserved for authorized staff personnel.');
      }

      setAppRole('admin');
      addToast('Admin Authenticated', `Signed in as ${user.role} (${user.name})`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-slate-50 to-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <VertexLogo size="md" showSubtitle />
        <div className="flex items-center gap-3">
          <Badge variant="neutral" size="sm">
            Production Security Enforced
          </Badge>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Home & Office Maintenance Operating System
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col items-center justify-center">
        {/* Brand statement */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>On-Demand Repair, Facility Maintenance & AMC Solutions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            VERTEX
          </h1>
          <p className="mt-2 text-base text-slate-600 font-medium">
            Professional Home & Office Services
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Delhi NCR • Mumbai • Bangalore • Certified & Police-Verified Experts
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="w-full max-w-2xl mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 3 Entry Points Switcher */}
        <div className="w-full max-w-2xl">
          {/* Tab Selector */}
          <div className="grid grid-cols-3 p-1.5 bg-slate-200/80 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('customer');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Customer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('technician');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'technician'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Technician</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Platform</span>
            </button>
          </div>

          {/* Tab 1: Customer Login */}
          {activeTab === 'customer' && (
            <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Customer Access</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Book repairs, schedule preventive checks, and manage AMC subscriptions
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
              </div>

              {!customerOtpStep ? (
                /* Step 1: Phone Number */
                <form onSubmit={handleCustomerSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Registered Mobile Number
                    </label>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-slate-800">
                      <span className="bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-600 border-r border-slate-200 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        IN +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
                        placeholder="Enter 10-digit number"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={customerLoading}
                    className="w-full h-11 text-sm font-semibold"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {customerLoading ? 'Sending Verification Code...' : 'Continue to OTP Verification'}
                  </Button>
                </form>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleCustomerVerifyOtp} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Sent verification code to:</span>
                      <p className="text-sm font-bold text-slate-900">+91 {customerPhone.slice(-10)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomerOtpStep(false)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" /> Change Number
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Enter 4-Digit Verification OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={customerOtp}
                      onChange={(e) => setCustomerOtp(e.target.value)}
                      className="w-full px-4 py-3 text-center text-xl tracking-[0.5em] font-mono font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="••••"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={customerLoading}
                    className="w-full h-11 text-sm font-semibold"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {customerLoading ? 'Verifying Session...' : 'Verify & Access Customer Dashboard'}
                  </Button>
                </form>
              )}
            </Card>
          )}

          {/* Tab 2: Technician Login */}
          {activeTab === 'technician' && (
            <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Technician Partner Access</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Field execution portal for On-Demand jobs, Doorstep OTPs, and Weekly Payouts
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>

              {!techOtpStep ? (
                /* Step 1: Tech Phone Number */
                <form onSubmit={handleTechSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Partner Registered Mobile Number
                    </label>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-slate-800">
                      <span className="bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-600 border-r border-slate-200 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        IN +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={techPhone}
                        onChange={(e) => setTechPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
                        placeholder="Enter registered mobile"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={techLoading}
                    className="w-full h-11 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {techLoading ? 'Sending Verification Code...' : 'Continue to Partner Verification'}
                  </Button>
                </form>
              ) : (
                /* Step 2: Tech OTP Verification */
                <form onSubmit={handleTechVerifyOtp} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Partner Mobile:</span>
                      <p className="text-sm font-bold text-slate-900">+91 {techPhone.slice(-10)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTechOtpStep(false)}
                      className="text-xs text-slate-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" /> Change Number
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Enter 4-Digit Partner OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={techOtp}
                      onChange={(e) => setTechOtp(e.target.value)}
                      className="w-full px-4 py-3 text-center text-xl tracking-[0.5em] font-mono font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="••••"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={techLoading}
                    className="w-full h-11 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {techLoading ? 'Verifying...' : 'Verify & Enter Technician Workspace'}
                  </Button>
                </form>
              )}
            </Card>
          )}

          {/* Tab 3: Admin Platform Login */}
          {activeTab === 'admin' && (
            <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Admin Platform Clearance</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Central SaaS console for Operations, Dispatches, Finance & Audit Logs
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
              </div>

              {/* Form with Email & Password */}
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Authorized Work Email
                  </label>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-slate-800">
                    <span className="bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 border-r border-slate-200 flex items-center">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
                      placeholder="admin@vertexservices.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Security Password
                  </label>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-slate-800">
                    <span className="bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500 border-r border-slate-200 flex items-center">
                      <KeyRound className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-slate-900 focus:outline-none font-mono"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Strict RBAC: System dynamically assigns authorized dashboard clearance upon credential verification.</span>
                </div>

                <Button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full h-11 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {adminLoading ? 'Authenticating Staff...' : 'Sign In to Admin Platform'}
                </Button>
              </form>
            </Card>
          )}
        </div>

        {/* Feature Highlights / Trust Bar */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl text-center">
          <div className="p-4 rounded-xl bg-white/70 border border-slate-200/60">
            <Home className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-slate-900">Residential & Commercial</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Precision repairs for homes, offices & corporate complexes
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/70 border border-slate-200/60">
            <Shield className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-slate-900">Role-Based Access Control</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Strict RBAC enforcement across 6 primary organizational roles
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/70 border border-slate-200/60">
            <Building className="w-5 h-5 text-slate-800 mx-auto mb-1.5" />
            <h4 className="text-xs font-bold text-slate-900">Enterprise Audit Logging</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Immutable security trail tracking authentication and permission activity
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400">
        © 2026 VERTEX Services Pvt Ltd. All rights reserved. • ISO 9001:2015 Certified Facility Care
      </footer>
    </div>
  );
};
