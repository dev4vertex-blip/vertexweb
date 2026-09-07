import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types/auth';
import { isDemoLoginEnabled } from '../../shared/config';
import { Shield, User, Wrench, LogOut, Layers, Sparkles } from 'lucide-react';

export const DemoRoleBar: React.FC = () => {
  if (!isDemoLoginEnabled()) {
    return null;
  }

  const { user, isAuthenticated, loginWithCredentials, loginWithOtp, logout } = useAuth();
  const { addToast, setAppRole } = useApp();

  const handleSwitchRole = async (targetRole: UserRole) => {
    try {
      if (targetRole === 'CUSTOMER') {
        await loginWithOtp({ phone: '9999990002', otp: '1234', role: 'CUSTOMER' });
        setAppRole('customer');
        addToast('Switched Role', 'Switched to Demo Customer (Rahul Sharma)', 'info');
      } else if (targetRole === 'TECHNICIAN') {
        await loginWithOtp({ phone: '9999990001', otp: '1234', role: 'TECHNICIAN' });
        setAppRole('technician');
        addToast('Switched Role', 'Switched to Demo Partner (Raj Kumar)', 'info');
      } else {
        let email = 'admin@vertex.demo';
        if (targetRole === 'MANAGER') email = 'manager@vertex.demo';
        if (targetRole === 'SALES') email = 'sales@vertex.demo';
        if (targetRole === 'FINANCE') email = 'finance@vertex.demo';

        await loginWithCredentials({ email, password: 'Admin@123', role: targetRole });
        setAppRole('admin');
        addToast('Switched Role', `Switched to Admin Perspective: ${targetRole}`, 'info');
      }
    } catch {
      addToast('Error', 'Unable to switch demo account', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    setAppRole('login');
    addToast('Logged Out', 'Session terminated. Returned to login portal.', 'info');
  };

  return (
    <aside
      aria-label="Development environment controls"
      className="bg-slate-950 text-white text-xs border-b border-slate-800 px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none z-50 sticky top-0"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 font-bold tracking-wide text-blue-400">
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">VERTEX DEV RBAC</span>
          <span className="sm:hidden">RBAC</span>
        </div>
        <span className="text-slate-700 hidden md:inline">|</span>
        {isAuthenticated && user ? (
          <div className="hidden lg:flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">Session:</span>
            <span className="font-bold text-white">{user.name}</span>
            <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded">
              {user.role}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 hidden md:inline">Not Authenticated (Login View)</span>
        )}
      </div>

      {/* Role Tabs for rapid 1-click switching during review */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[11px] text-slate-400 mr-1 hidden xl:inline">Switch Demo Role:</span>

        {/* Customer */}
        <button
          type="button"
          onClick={() => handleSwitchRole('CUSTOMER')}
          className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
            user?.role === 'CUSTOMER'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <User className="w-3 h-3" />
          <span>Customer</span>
        </button>

        {/* Technician */}
        <button
          type="button"
          onClick={() => handleSwitchRole('TECHNICIAN')}
          className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
            user?.role === 'TECHNICIAN'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-3 h-3" />
          <span>Technician</span>
        </button>

        {/* Super Admin */}
        <button
          type="button"
          onClick={() => handleSwitchRole('SUPER_ADMIN')}
          className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
            user?.role === 'SUPER_ADMIN'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Shield className="w-3 h-3" />
          <span>Super Admin</span>
        </button>

        {/* Manager */}
        <button
          type="button"
          onClick={() => handleSwitchRole('MANAGER')}
          className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
            user?.role === 'MANAGER'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Manager
        </button>

        {/* Sales */}
        <button
          type="button"
          onClick={() => handleSwitchRole('SALES')}
          className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
            user?.role === 'SALES'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Sales
        </button>

        {/* Finance */}
        <button
          type="button"
          onClick={() => handleSwitchRole('FINANCE')}
          className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
            user?.role === 'FINANCE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Finance
        </button>

        {/* Logout button */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out of active session"
            className="ml-1 px-2 py-1 rounded text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};
