import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminPlatform } from '../../views/admin/AdminPlatform';
import { AdminLoginView } from './AdminLoginView';
import { UnauthorizedView } from '../../components/auth/UnauthorizedView';

export const AdminApp: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Initializing Admin Portal...</span>
        </div>
      </div>
    );
  }

  // If not logged in, show Admin Login View
  if (!isAuthenticated || !user) {
    return <AdminLoginView />;
  }

  // If logged in with non-staff role (e.g. Customer, Technician, Employee self-service, Partner), block access
  const isStaffRole = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'SALES_TEAM', 'FINANCE', 'MARKETING', 'OPERATIONS', 'SUPPORT', 'HR', 'PAYROLL'].includes(user.role);
  if (!isStaffRole) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <UnauthorizedView
          title="Administrative Portal Restricted"
          message="This system is reserved for authorized VERTEX internal personnel. Your account does not have internal staff privileges."
          showLoginButton
        />
      </div>
    );
  }

  // Render the complete 21-module Administrative Platform
  return <AdminPlatform />;
};

export default AdminApp;
