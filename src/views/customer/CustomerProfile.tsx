import React, { useState } from 'react';
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
  BookOpen,
  FileText,
  LogOut,
  ChevronRight,
  Sparkles,
  Tag,
  Star,
  Edit2,
  Check,
  X,
} from 'lucide-react';

interface CustomerProfileProps {
  onNavigateToAddresses: () => void;
  onNavigateToAMC: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToSupport: () => void;
  onNavigateToInvoices?: () => void;
  onNavigateToOffers?: () => void;
  onNavigateToReviews?: () => void;
  onNavigateToFAQ?: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  onNavigateToAddresses,
  onNavigateToAMC,
  onNavigateToNotifications,
  onNavigateToSupport,
  onNavigateToInvoices,
  onNavigateToOffers,
  onNavigateToReviews,
  onNavigateToFAQ,
}) => {
  const { currentCustomer, setCurrentCustomer, setAppRole, addToast } = useApp();
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentCustomer.name);
  const [email, setEmail] = useState(currentCustomer.email);
  const [phone, setPhone] = useState(currentCustomer.phone);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentCustomer({
      ...currentCustomer,
      name,
      email,
      phone,
    });
    setIsEditing(false);
    addToast('Profile Updated', 'Your contact details have been updated.', 'success');
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile & Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage personal info, addresses, and contracts</p>
      </div>

      {/* Customer Info Card */}
      <Card className="p-5 sm:p-6">
        {!isEditing ? (
          <div className="flex items-start justify-between gap-4">
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

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Edit profile"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {currentCustomer.activeAmcId && (
                <Badge variant="accent" size="sm" className="shrink-0">
                  AMC Active
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Edit Contact Details
              </h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Check className="w-3.5 h-3.5" />}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Quick Navigation Menu */}
      <Card className="divide-y divide-slate-100">
        {onNavigateToInvoices && (
          <button
            onClick={onNavigateToInvoices}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">Invoices & Receipts</span>
                <span className="text-[11px] text-slate-500">
                  Tax bills, GST invoices & payment history
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {onNavigateToOffers && (
          <button
            onClick={onNavigateToOffers}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">Offers & Coupons</span>
                <span className="text-[11px] text-slate-500">
                  Promo codes, discounts & cashback
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {onNavigateToReviews && (
          <button
            onClick={onNavigateToReviews}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">Reviews & Ratings</span>
                <span className="text-[11px] text-slate-500">
                  Past service ratings & feedback
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        <button
          onClick={onNavigateToAddresses}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer min-h-[52px]"
        >
          <div className="flex items-center gap-3 text-slate-800">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
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
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer min-h-[52px]"
        >
          <div className="flex items-center gap-3 text-slate-800">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">Annual Maintenance Contract (AMC)</span>
              <span className="text-[11px] text-slate-500">
                {currentCustomer.activeAmcId ? 'Active Plan • Free visits left' : 'Explore plans & warranties'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onNavigateToNotifications}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer min-h-[52px]"
        >
          <div className="flex items-center gap-3 text-slate-800">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">Notification Preferences</span>
              <span className="text-[11px] text-slate-500">Service alerts and reminders</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {onNavigateToFAQ && (
          <button
            onClick={onNavigateToFAQ}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer min-h-[52px]"
          >
            <div className="flex items-center gap-3 text-slate-800">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">FAQs & Service Policies</span>
                <span className="text-[11px] text-slate-500">
                  Bookings, payments, OTPs & technician safety
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        <button
          onClick={onNavigateToSupport}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer min-h-[52px]"
        >
          <div className="flex items-center gap-3 text-slate-800">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block">Help & Support</span>
              <span className="text-[11px] text-slate-500">24x7 Customer care & ticket resolution</span>
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
