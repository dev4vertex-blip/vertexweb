import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Bell,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CustomerProfileProps {
  onNavigateToAddresses: () => void;
  onNavigateToAMC: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToSupport: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  onNavigateToAddresses,
  onNavigateToAMC,
  onNavigateToNotifications,
  onNavigateToSupport,
}) => {
  const { currentCustomer, setAppRole, addToast } = useApp();
  const { logout } = useAuth();

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile & Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage personal info, addresses, and contracts</p>
      </div>

      {/* Customer Info Card */}
      <Card className="p-5 sm:p-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            {currentCustomer.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{currentCustomer.name}</h3>
              <Badge variant="success" size="sm">
                Verified
              </Badge>
            </div>
            <div className="mt-1 space-y-0.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{currentCustomer.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{currentCustomer.email}</span>
              </div>
            </div>
          </div>
        </div>

        {currentCustomer.activeAmcId && (
          <Badge variant="accent" size="sm" className="shrink-0">
            Active AMC Member
          </Badge>
        )}
      </Card>

      {/* Quick Navigation Menu */}
      <Card className="divide-y divide-slate-100">
        <button
          onClick={onNavigateToAddresses}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 text-slate-800">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">Saved Addresses</span>
              <span className="text-[11px] text-slate-500">
                {currentCustomer.activeAddresses.length} locations configured
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onNavigateToAMC}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 text-slate-800">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">Annual Maintenance Contract (AMC)</span>
              <span className="text-[11px] text-slate-500">
                {currentCustomer.activeAmcId ? 'Active Plan • 4 Free visits left' : 'Explore plans'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onNavigateToNotifications}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 text-slate-800">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">Notification Preferences</span>
              <span className="text-[11px] text-slate-500">Service alerts and reminders</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onNavigateToSupport}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 text-slate-800">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">Help & Support</span>
              <span className="text-[11px] text-slate-500">24x7 Customer care & FAQs</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </Card>

      {/* Log out / Switch role button */}
      <div className="pt-2">
        <Button
          variant="outline"
          className="w-full text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-300"
          leftIcon={<LogOut className="w-4 h-4" />}
          onClick={async () => {
            await logout();
            setAppRole('login');
            addToast('Logged out', 'Returned to role selection', 'info');
          }}
        >
          Sign Out of Customer Account
        </Button>
      </div>
    </div>
  );
};
