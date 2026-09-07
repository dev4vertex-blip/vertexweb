import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CustomerApp } from '../../views/customer/CustomerApp';
import { CustomerLoginView } from './CustomerLoginView';
import { MobileNavigationProvider } from '../../shared/navigation/MobileNavigation';

export const CustomerAppRoot: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-600 font-medium">Opening VERTEX Services...</span>
        </div>
      </div>
    );
  }

  // If not logged in or not a customer, show Customer Login View
  if (!isAuthenticated || !user || user.role !== 'CUSTOMER') {
    return <CustomerLoginView />;
  }

  // Wrap in mobile navigation stack to support hardware back button & native transitions
  return (
    <MobileNavigationProvider initialScreen="home">
      <CustomerApp />
    </MobileNavigationProvider>
  );
};

export default CustomerAppRoot;
