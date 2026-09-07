import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { VertexLogo } from '../components/common/VertexLogo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { UserRole } from '../types/auth';
import {
  User,
  Wrench,
  Shield,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  CheckCircle2,
  Lock,
  Building,
  Home,
  Mail,
  KeyRound,
  AlertCircle,
  Clock,
  Info,
} from 'lucide-react';
import { isDemoLoginEnabled } from '../shared/config';

export const LoginView: React.FC = () => {
  const { loginWithCredentials, loginWithOtp } = useAuth();
  const { addToast, setAppRole } = useApp();

  const demoEnabled = isDemoLoginEnabled();
  const [activeTab, setActiveTab] = useState<'customer' | 'technician' | 'admin'>('customer');

  // Customer State
  const [customerPhone, setCustomerPhone] = useState(demoEnabled ? '9999990002' : '');
  const [customerOtpStep, setCustomerOtpStep] = useState(false);
  const [customerOtp, setCustomerOtp] = useState('');
  const [customerLoading, setCustomerLoading] = useState(false);

  // Technician State
  const [techPhone, setTechPhone] = useState(demoEnabled ? '9999990001' : '');
  const [techOtpStep, setTechOtpStep] = useState(false);
  const [techOtp, setTechOtp] = useState('');
  const [techLoading, setTechLoading] = useState(false);

  // Admin State
  const [adminEmail, setAdminEmail] = useState(demoEnabled ? 'admin@vertex.demo' : '');
  const [adminPassword, setAdminPassword] = useState(demoEnabled ? 'Admin@123' : '');
  const [adminSelectedRole, setAdminSelectedRole] = useState<UserRole>('SUPER_ADMIN');
  const [adminLoading, setAdminLoading] = useState(false);

  // Error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Demo Accounts for 1-Click test filling
  const adminDemoUsers: {
    role: UserRole;
    email: string;
    label: string;
    desc: string;
    scope: string;
  }[] = [
    {
      role: 'SUPER_ADMIN',
      email: 'admin@vertex.demo',
      label: 'Super Admin',
      desc: 'Full Access',
      scope: 'Unrestricted access to all 21 modules & settings',
    },
    {
      role: 'MANAGER',
      email: 'manager@vertex.demo',
      label: 'Manager',
      desc: 'Ops & Fleet',
      scope: 'Bookings, Technicians, Sales Team, Services & Support',
    },
    {
      role: 'SALES',
      email: 'sales@vertex.demo',
      label: 'Sales',
      desc: 'Growth & AMC',
      scope: 'Bookings, Customers, Catalog & AMC Subscriptions',
    },
    {
      role: 'FINANCE',
      email: 'finance@vertex.demo',
      label: 'Finance',
      desc: 'Billing & Payouts',
      scope: 'Payments, Invoices, Commissions & Financial Reports',
    },
  ];

  // Handlers
  const handleCustomerSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setCustomerOtpStep(true);
    setCustomerOtp('1234'); // Pre-fill with dev OTP for convenience
    addToast('OTP Generated', 'Development OTP: 1234 (Simulation)', 'info');
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
      const msg = err instanceof Error ? err.message : 'Invalid OTP entered.';
      setErrorMessage(msg);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleTechSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!techPhone || techPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setTechOtpStep(true);
    setTechOtp('1234'); // Pre-fill with dev OTP for convenience
    addToast('OTP Generated', 'Development OTP: 1234 (Simulation)', 'info');
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
      const msg = err instanceof Error ? err.message : 'Invalid OTP entered.';
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
        role: adminSelectedRole,
      });
      setAppRole('admin');
      addToast('Admin Authenticated', `Signed in as ${user.role} (${user.name})`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMessage(msg);
    } finally {
      setAdminLoading(false);
    }
  };

  const selectAdminDemoUser = (user: (typeof adminDemoUsers)[0]) => {
    setAdminEmail(user.email);
    setAdminPassword('Admin@123');
    setAdminSelectedRole(user.role);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 via-slate-50 to-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <VertexLogo size="md" showSubtitle />
        <div className="flex items-center gap-3">
          <Badge variant="neutral" size="sm">
            Step 2: RBAC & Central Auth
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

        {/* Global Error Banner if any */}
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

              {/* Development Notice */}
              {demoEnabled && (
                <div className="mb-5 p-3 rounded-lg bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
                  <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Development Sandbox:</span> Real SMS gateway is
                    disabled. Use registered test mobile <strong>9999990002</strong> and simulation
                    OTP <strong>1234</strong>.
                  </div>
                </div>
              )}

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
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
                        placeholder="9999990002"
                        required
                      />
                    </div>
                  </div>

                  {demoEnabled && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <span className="text-slate-500">Official Demo Account:</span>
                      <button
                        type="button"
                        onClick={() => setCustomerPhone('9999990002')}
                        className="font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Use Rahul Sharma (9999990002)
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-sm font-semibold"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to OTP Verification
                  </Button>
                </form>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleCustomerVerifyOtp} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Sent development code to:</span>
                      <p className="text-sm font-bold text-slate-900">+91 {customerPhone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomerOtpStep(false)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
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
                      placeholder="1234"
                      required
                    />
                    {demoEnabled && (
                      <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
                        <span>Mock OTP: 1234</span>
                        <button
                          type="button"
                          onClick={() => setCustomerOtp('1234')}
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          Auto-fill 1234
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    isLoading={customerLoading}
                    className="w-full h-11 text-sm font-semibold"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Verify & Access Customer Dashboard
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

              {/* Development Notice */}
              {demoEnabled && (
                <div className="mb-5 p-3 rounded-lg bg-amber-50/70 border border-amber-100 flex items-start gap-2.5 text-xs text-amber-900">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Partner Sandbox:</span> Use registered technician
                    mobile <strong>9999990001</strong> and development OTP <strong>1234</strong>.
                  </div>
                </div>
              )}

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
                        value={techPhone}
                        onChange={(e) => setTechPhone(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm text-slate-900 focus:outline-none"
                        placeholder="9999990001"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-500">Official Partner Account:</span>
                    <button
                      type="button"
                      onClick={() => setTechPhone('9999990001')}
                      className="font-bold text-amber-700 hover:underline cursor-pointer"
                    >
                      Use Raj Technician (9999990001)
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-sm font-semibold bg-slate-900 hover:bg-slate-800"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to Partner Verification
                  </Button>
                </form>
              ) : (
                /* Step 2: Tech OTP Verification */
                <form onSubmit={handleTechVerifyOtp} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Partner Mobile:</span>
                      <p className="text-sm font-bold text-slate-900">+91 {techPhone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTechOtpStep(false)}
                      className="text-xs text-slate-600 hover:underline flex items-center gap-1"
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
                      placeholder="1234"
                      required
                    />
                    {demoEnabled && (
                      <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
                        <span>Mock OTP: 1234</span>
                        <button
                          type="button"
                          onClick={() => setTechOtp('1234')}
                          className="text-amber-700 font-semibold hover:underline"
                        >
                          Auto-fill 1234
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    isLoading={techLoading}
                    className="w-full h-11 text-sm font-semibold bg-slate-900 hover:bg-slate-800"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Verify & Enter Technician Workspace
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

              {/* 4 Demo Admin Accounts Picker */}
              {demoEnabled && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Select Demo Administrative Profile
                    </label>
                    <span className="text-[11px] text-blue-600 font-medium">1-Click Fast Fill</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {adminDemoUsers.map((item) => {
                      const isSelected = adminSelectedRole === item.role;
                      return (
                        <button
                          key={item.role}
                          type="button"
                          onClick={() => selectAdminDemoUser(item)}
                          className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold leading-tight flex items-center justify-between">
                            <span>{item.label}</span>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          </div>
                          <div
                            className={`text-[10px] mt-0.5 font-mono ${
                              isSelected ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {item.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                      placeholder="admin@vertex.demo"
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

                {/* Selected Role Scope Notice */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-900">
                      Clearance: {adminSelectedRole.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {adminDemoUsers.find((u) => u.role === adminSelectedRole)?.scope}
                  </p>
                </div>

                <Button
                  type="submit"
                  isLoading={adminLoading}
                  className="w-full h-11 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Enter Admin Platform as {adminSelectedRole.replace('_', ' ')}
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
