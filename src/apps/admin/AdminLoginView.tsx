import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { VertexLogo } from '../../components/common/VertexLogo';
import { Button } from '../../components/ui/Button';
import { UserRole } from '../../types/auth';
import { isDemoLoginEnabled } from '../../shared/config';
import { Mail, KeyRound, AlertCircle, Shield, Sparkles, Building, Lock } from 'lucide-react';

interface AdminLoginViewProps {
  onSuccess?: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onSuccess }) => {
  const { loginWithCredentials, logout } = useAuth();
  const { addToast, setAppRole } = useApp();

  const demoEnabled = isDemoLoginEnabled();
  const [email, setEmail] = useState(demoEnabled ? 'admin@vertex.demo' : '');
  const [password, setPassword] = useState(demoEnabled ? 'Admin@123' : '');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPER_ADMIN');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      desc: 'Full System Access',
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
      label: 'Sales Executive',
      desc: 'Growth & Subscriptions',
      scope: 'Bookings, Customers, Catalog & AMC Subscriptions',
    },
    {
      role: 'FINANCE',
      email: 'finance@vertex.demo',
      label: 'Finance Officer',
      desc: 'Billing & Payouts',
      scope: 'Payments, Invoices, Commissions & Financial Reports',
    },
  ];

  const selectAdminDemoUser = (user: typeof adminDemoUsers[0]) => {
    setSelectedRole(user.role);
    setEmail(user.email);
    setPassword('Admin@123');
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      const user = await loginWithCredentials({
        email,
        password,
        role: demoEnabled ? selectedRole : undefined,
      });

      // Strict role verification: only authorized internal roles can enter Admin Web
      const isStaffRole = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE'].includes(user.role);
      if (!isStaffRole) {
        await logout();
        throw new Error('Access denied. VERTEX Admin Web is reserved exclusively for authorized internal personnel. Customer and Technician accounts cannot access this portal.');
      }

      setAppRole('admin');
      addToast('Welcome Admin', `Logged in as ${user.name} (${user.role})`, 'success');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials provided.';
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 mb-2">
          <Building className="w-3 h-3" />
          <span>VERTEX ADMIN CONSOLE</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Internal Operations & Staff Portal
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Executive operations, fleet dispatch, RBAC management, and financial ledgers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-10">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Demo Persona Picker (ONLY visible if DEMO_LOGIN_ENABLED) */}
          {demoEnabled && (
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Select Demo Administrative Persona</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {adminDemoUsers.map((item) => {
                  const isSelected = selectedRole === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => selectAdminDemoUser(item)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>{item.label}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vertexservices.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-600 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-600 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full justify-center py-2.5 font-bold"
            >
              {loading ? 'Authenticating Staff...' : 'Sign In to Admin Console'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strict Role-Based Access Control • SSL Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
