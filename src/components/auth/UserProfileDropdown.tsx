import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';

export const UserProfileDropdown: React.FC = () => {
  const { user, logout, navigateTo, canAccessRoute } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const canAccessSettings = canAccessRoute('/admin/settings');

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700 text-left focus:outline-none"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {user.avatar || user.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="hidden md:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs leading-none">{user.name}</span>
              {isSuperAdmin && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-900/80 border border-rose-500/50 text-rose-300 px-1.5 py-0.2 rounded">
                  SUPER ADMIN
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 leading-none mt-1 block font-mono">
              {user.role}
            </span>
          </div>

          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
            {/* Header info */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Authenticated User</span>
                {isSuperAdmin ? (
                  <Badge variant="danger" size="sm">
                    SUPER ADMIN
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    {user.role}
                  </Badge>
                )}
              </div>

              <h4 className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">{user.name}</h4>

              <div className="mt-2 space-y-1 text-xs text-slate-500 font-mono">
                {user.email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-1 space-y-0.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (user.role === 'CUSTOMER') {
                    navigateTo('/customer/profile');
                  } else if (user.role === 'TECHNICIAN') {
                    navigateTo('/technician/profile');
                  } else {
                    navigateTo('/admin/audit-logs');
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-left"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>My Profile & Clearance</span>
              </button>

              {canAccessSettings && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigateTo('/admin/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Platform Settings</span>
                </button>
              )}

              {/* Status indicator */}
              <div className="px-3 py-1.5 text-[11px] text-slate-400 flex items-center justify-between">
                <span>City Jurisdiction:</span>
                <span className="font-semibold text-slate-700">{user.city}</span>
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-1 mt-1 border-t border-slate-100 p-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        isLoading={isLoggingOut}
      />
    </>
  );
};
