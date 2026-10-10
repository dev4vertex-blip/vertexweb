import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock, UserCheck, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface UnauthorizedViewProps {
  /** The route or resource URL that was attempted */
  attemptedPath?: string;
  /** Optional callback to reset parent navigation state (e.g., in nested admin tab views) */
  onReturnToDashboard?: () => void;
  /** Optional custom title override */
  title?: string;
  /** Optional custom description override */
  message?: string;
  /** Optional expected or required role label */
  requiredRole?: string;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
  attemptedPath,
  onReturnToDashboard,
  title = '403 — Access Denied',
  message,
  requiredRole,
}) => {
  const { user, navigateTo, getDefaultDashboardForRole, logout } = useAuth();
  const { setAppRole, addToast } = useApp();

  // Determine authorized dashboard target
  const authorizedDashboardRoute = user ? getDefaultDashboardForRole(user.role) : '/login';

  const getDashboardLabel = () => {
    if (!user) return 'Return to Login';
    switch (user.role) {
      case 'CUSTOMER':
        return 'Return to Customer Portal';
      case 'TECHNICIAN':
        return 'Return to Partner Workspace';
      case 'SUPER_ADMIN':
      case 'MANAGER':
      case 'SALES':
      case 'FINANCE':
      default:
        return 'Return to Authorized Dashboard';
    }
  };

  const handleReturnToDashboard = () => {
    // Invoke parent reset callback if provided (e.g., reset activeSection to 'dashboard')
    if (onReturnToDashboard) {
      onReturnToDashboard();
    }

    if (user) {
      navigateTo(authorizedDashboardRoute);
      if (user.role === 'CUSTOMER') {
        setAppRole('customer');
      } else if (user.role === 'TECHNICIAN') {
        setAppRole('technician');
      } else {
        setAppRole('admin');
      }
    } else {
      navigateTo('/login');
      setAppRole('login');
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleReturnToDashboard();
    }
  };

  const handleSwitchAccount = async () => {
    await logout();
    setAppRole('login');
    navigateTo('/login');
    addToast('Session Ended', 'Please log in with credentials that have higher privileges.', 'info');
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'danger';
      case 'MANAGER':
        return 'accent';
      case 'SALES':
        return 'info';
      case 'FINANCE':
        return 'warning';
      case 'TECHNICIAN':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <div
      id="unauthorized-view-container"
      className="min-h-[65vh] flex items-center justify-center p-4 sm:p-6 lg:p-8"
    >
      <div
        id="unauthorized-card"
        className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center"
      >
        {/* Security Shield Icon Header */}
        <div
          id="unauthorized-icon-wrapper"
          className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-600 shadow-xs"
        >
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Security Category Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold uppercase tracking-wider mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Access Control</span>
        </div>

        {/* Status & Title */}
        <h1
          id="unauthorized-title"
          className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
        >
          {title}
        </h1>

        {/* Explanation Message */}
        <p
          id="unauthorized-message"
          className="mt-3 text-sm text-slate-600 leading-relaxed max-w-md mx-auto"
        >
          {message ||
            'You do not have administrative clearance to access this module. Please contact your organization administrator if you require access.'}
        </p>

        {/* Access Information Card */}
        <div
          id="unauthorized-diagnostics-box"
          className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-2.5"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              Active User
            </span>
            <span id="unauthorized-user-name" className="font-semibold text-slate-800">
              {user ? `${user.name} (${user.email})` : 'Unauthenticated Session'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Account Role</span>
            <Badge
              id="unauthorized-role-badge"
              variant={getRoleBadgeVariant(user?.role)}
              size="sm"
            >
              {user ? user.role : 'GUEST / NONE'}
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div
          id="unauthorized-actions-group"
          className="mt-6 flex flex-col sm:flex-row items-center gap-3 justify-center"
        >
          <Button
            id="return-to-dashboard-btn"
            variant="primary"
            leftIcon={<LayoutDashboard className="w-4 h-4" />}
            onClick={handleReturnToDashboard}
            className="w-full sm:w-auto"
          >
            {getDashboardLabel()}
          </Button>

          <Button
            id="unauthorized-go-back-btn"
            variant="outline"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={handleGoBack}
            className="w-full sm:w-auto"
          >
            Go Back
          </Button>
        </div>

        {/* Secondary Switch/Support Hint */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Need elevated permissions?</span>
          </div>
          <button
            id="unauthorized-switch-account-btn"
            type="button"
            onClick={handleSwitchAccount}
            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign in with different account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
