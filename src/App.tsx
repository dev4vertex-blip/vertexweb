import React, { useEffect, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/ui/Toast';
import { AdminApp } from './apps/admin/AdminApp';
import { CustomerAppRoot } from './apps/customer/CustomerAppRoot';
import { TechnicianAppRoot } from './apps/technician/TechnicianAppRoot';
import { LoginView } from './views/LoginView';
import { getAppTarget } from './shared/config';

const AppContent: React.FC = () => {
  const { currentAppRole, setAppRole, toasts, removeToast } = useApp();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Determine target application: either through build flag VITE_APP_TARGET
  // or dynamically via path when previewing the unified multi-app repository.
  const activeAppTarget = useMemo(() => {
    const configuredTarget = getAppTarget();
    if (configuredTarget !== 'all') {
      return configuredTarget;
    }
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      if (pathname.startsWith('/admin') || pathname.startsWith('/crm')) return 'admin';
      if (pathname.startsWith('/customer')) return 'customer';
      if (pathname.startsWith('/technician') || pathname.startsWith('/partner')) return 'technician';
    }
    return 'all';
  }, []);

  // Synchronize currentAppRole with authenticated user session
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        if (currentAppRole !== 'login') {
          setAppRole('login');
        }
      } else if (user.role === 'CUSTOMER') {
        if (currentAppRole !== 'customer') {
          setAppRole('customer');
        }
      } else if (user.role === 'TECHNICIAN') {
        if (currentAppRole !== 'technician') {
          setAppRole('technician');
        }
      } else {
        if (currentAppRole !== 'admin') {
          setAppRole('admin');
        }
      }
    }
  }, [user, isAuthenticated, isLoading, currentAppRole, setAppRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Initializing VERTEX Core...</span>
        </div>
      </div>
    );
  }

  // 1. Standalone Admin Deployment Target
  if (activeAppTarget === 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
        <AdminApp />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // 2. Standalone Customer Deployment Target (Mobile App Shell)
  if (activeAppTarget === 'customer') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
        <CustomerAppRoot />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // 3. Standalone Technician Deployment Target (Partner Mobile Shell)
  if (activeAppTarget === 'technician') {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
        <TechnicianAppRoot />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    );
  }

  // 4. Unified Workspace (Default development mode with seamless role switching)
  const renderUnifiedView = () => {
    if (!isAuthenticated || !user || currentAppRole === 'login') {
      return <LoginView />;
    }
    if (user.role === 'CUSTOMER' || currentAppRole === 'customer') {
      return <CustomerAppRoot />;
    }
    if (user.role === 'TECHNICIAN' || currentAppRole === 'technician') {
      return <TechnicianAppRoot />;
    }
    return <AdminApp />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {renderUnifiedView()}
      </div>

      {/* Global Notification Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppProvider>
  );
}
