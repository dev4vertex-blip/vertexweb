import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { TechnicianApp } from '../../views/technician/TechnicianApp';
import { TechnicianLoginView } from './TechnicianLoginView';
import { MobileNavigationProvider } from '../../shared/navigation/MobileNavigation';

export const TechnicianAppRoot: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Opening Partner Terminal...</span>
        </div>
      </div>
    );
  }

  // If not logged in or not a technician, show Technician Login View
  if (!isAuthenticated || !user || user.role !== 'TECHNICIAN') {
    return <TechnicianLoginView />;
  }

  // Wrap in mobile navigation stack to support hardware back button & native transitions
  return (
    <MobileNavigationProvider initialScreen="dashboard">
      <TechnicianApp />
    </MobileNavigationProvider>
  );
};

export default TechnicianAppRoot;
