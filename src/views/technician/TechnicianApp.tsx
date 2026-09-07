import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VertexLogo } from '../../components/common/VertexLogo';
import { TechnicianDashboard } from './TechnicianDashboard';
import { TechnicianJobs } from './TechnicianJobs';
import { TechnicianJobDetails } from './TechnicianJobDetails';
import { TechnicianEarnings } from './TechnicianEarnings';
import { TechnicianAttendance } from './TechnicianAttendance';
import { TechnicianNotifications } from './TechnicianNotifications';
import { TechnicianProfile } from './TechnicianProfile';
import { TechnicianJob } from '../../types';
import {
  Home,
  Briefcase,
  Wallet,
  Clock,
  User,
  Bell,
  Power,
  ArrowLeft,
} from 'lucide-react';
import { useMobileNavigation } from '../../shared/navigation/MobileNavigation';

export type TechnicianScreen =
  | 'dashboard'
  | 'jobs'
  | 'job-details'
  | 'earnings'
  | 'attendance'
  | 'notifications'
  | 'profile';

export const TechnicianApp: React.FC = () => {
  const { currentTechnician, toggleTechnicianDuty } = useApp();

  let mobileNav: ReturnType<typeof useMobileNavigation> | null = null;
  try {
    mobileNav = useMobileNavigation();
  } catch {
    mobileNav = null;
  }

  const [localScreen, setLocalScreen] = useState<TechnicianScreen>('dashboard');
  const currentScreen = (mobileNav?.currentScreen as TechnicianScreen) || localScreen;
  const [selectedJob, setSelectedJob] = useState<TechnicianJob | null>(null);

  const navigateTo = (screen: TechnicianScreen) => {
    if (mobileNav) {
      mobileNav.push(screen);
    } else {
      setLocalScreen(screen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectJob = (job: TechnicianJob) => {
    setSelectedJob(job);
    navigateTo('job-details');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Technician Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 sm:top-[33px] z-30 shadow-2xs">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {mobileNav && mobileNav.canGoBack && (
              <button
                type="button"
                onClick={() => mobileNav?.goBack()}
                className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Back"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
            )}
            <button
              onClick={() => (mobileNav ? mobileNav.reset('dashboard') : navigateTo('dashboard'))}
              className="cursor-pointer text-left focus:outline-none"
            >
              <VertexLogo size="sm" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              Partner App
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Duty toggle button */}
            <button
              onClick={toggleTechnicianDuty}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                currentTechnician.isOnDuty
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Power className="w-3 h-3" />
              <span className="hidden sm:inline">
                {currentTechnician.isOnDuty ? 'On Duty' : 'Offline'}
              </span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigateTo('notifications')}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => navigateTo('profile')}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                {currentTechnician.name[0]}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
        {currentScreen === 'dashboard' && (
          <TechnicianDashboard
            onSelectJob={handleSelectJob}
            onNavigateToJobs={() => navigateTo('jobs')}
            onNavigateToEarnings={() => navigateTo('earnings')}
            onNavigateToAttendance={() => navigateTo('attendance')}
          />
        )}

        {currentScreen === 'jobs' && <TechnicianJobs onSelectJob={handleSelectJob} />}

        {currentScreen === 'job-details' && selectedJob && (
          <TechnicianJobDetails job={selectedJob} onBack={() => navigateTo('jobs')} />
        )}

        {currentScreen === 'earnings' && <TechnicianEarnings />}

        {currentScreen === 'attendance' && <TechnicianAttendance />}

        {currentScreen === 'notifications' && <TechnicianNotifications />}

        {currentScreen === 'profile' && <TechnicianProfile />}
      </main>

      {/* Technician Bottom Navigation */}
      <nav
        aria-label="Technician navigation"
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-4 z-40 shadow-lg sm:max-w-md sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 sm:rounded-2xl sm:border"
      >
        <div className="flex items-center justify-around">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              currentScreen === 'dashboard'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => navigateTo('jobs')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              currentScreen === 'jobs' || currentScreen === 'job-details'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-5 h-5 mb-0.5" />
            <span>Jobs</span>
          </button>

          <button
            onClick={() => navigateTo('earnings')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              currentScreen === 'earnings'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-5 h-5 mb-0.5" />
            <span>Earnings</span>
          </button>

          <button
            onClick={() => navigateTo('attendance')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              currentScreen === 'attendance'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span>Attendance</span>
          </button>

          <button
            onClick={() => navigateTo('profile')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              currentScreen === 'profile' || currentScreen === 'notifications'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
