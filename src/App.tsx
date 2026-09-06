import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoRoleBar } from './components/common/DemoRoleBar';
import { ToastContainer } from './components/ui/Toast';
import { LoginView } from './views/LoginView';
import { CustomerApp } from './views/customer/CustomerApp';
import { TechnicianApp } from './views/technician/TechnicianApp';
import { AdminPlatform } from './views/admin/AdminPlatform';

const AppContent: React.FC = () => {
  const { currentAppRole, setAppRole, toasts, removeToast } = useApp();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  // Active view router
  const renderActiveView = () => {
    if (!isAuthenticated || !user || currentAppRole === 'login') {
      return <LoginView />;
    }
    if (user.role === 'CUSTOMER' || currentAppRole === 'customer') {
      return <CustomerApp />;
    }
    if (user.role === 'TECHNICIAN' || currentAppRole === 'technician') {
      return <TechnicianApp />;
    }
    return <AdminPlatform />;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Demo Bar for rapid switching between Customer, Partner & Admin apps */}
      <DemoRoleBar />

      {/* Main View Router based on current active role */}
      <div className="flex-1 flex flex-col">
        {renderActiveView()}
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
