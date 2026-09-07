import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { VertexLogo } from '../../components/common/VertexLogo';
import { UserRole } from '../../types/auth';
import { AdminDashboard } from './AdminDashboard';
import { AdminBookingsView } from './AdminBookingsView';
import { AdminCustomersView } from './AdminCustomersView';
import { AdminTechniciansView } from './AdminTechniciansView';
import { UserManagementView } from './users/UserManagementView';
import { AdminGenericSectionView } from './AdminGenericSectionView';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { UnauthorizedView } from '../../components/auth/UnauthorizedView';
import { UserProfileDropdown } from '../../components/auth/UserProfileDropdown';
import { isDemoLoginEnabled } from '../../shared/config';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Wrench,
  UserCheck,
  Shield,
  DollarSign,
  Package,
  Grid,
  MapPin,
  ShieldCheck,
  CreditCard,
  FileText,
  Percent,
  HelpCircle,
  Star,
  BarChart3,
  Bell,
  Cpu,
  Settings,
  History,
  Menu,
  X,
  Lock,
  Sparkles,
  TrendingUp,
  Tag,
} from 'lucide-react';

interface SidebarItem {
  id: string;
  route: string;
  label: string;
  icon: React.ReactNode;
  category: 'core' | 'operations' | 'finance' | 'system';
}

const ALL_SIDEBAR_ITEMS: SidebarItem[] = [
  // Core
  {
    id: 'dashboard',
    route: '/admin/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    category: 'core',
  },
  {
    id: 'users',
    route: '/admin/users',
    label: 'User Management',
    icon: <Users className="w-4 h-4" />,
    category: 'core',
  },
  {
    id: 'bookings',
    route: '/admin/bookings',
    label: 'Bookings',
    icon: <CalendarCheck className="w-4 h-4" />,
    category: 'core',
  },
  {
    id: 'customers',
    route: '/admin/customers',
    label: 'Customers',
    icon: <Users className="w-4 h-4" />,
    category: 'core',
  },
  {
    id: 'technicians',
    route: '/admin/technicians',
    label: 'Technicians',
    icon: <Wrench className="w-4 h-4" />,
    category: 'core',
  },

  // Team & Operations
  {
    id: 'crm',
    route: '/admin/crm',
    label: 'Sales CRM & Leads',
    icon: <TrendingUp className="w-4 h-4" />,
    category: 'operations',
  },
  {
    id: 'promotions',
    route: '/admin/promotions',
    label: 'Promotions & Offers',
    icon: <Tag className="w-4 h-4" />,
    category: 'operations',
  },
  {
    id: 'sales-team',
    route: '/admin/sales',
    label: 'Sales Team',
    icon: <UserCheck className="w-4 h-4" />,
    category: 'operations',
  },
  {
    id: 'managers',
    route: '/admin/managers',
    label: 'Managers',
    icon: <Shield className="w-4 h-4" />,
    category: 'operations',
  },
  {
    id: 'services',
    route: '/admin/services',
    label: 'Services',
    icon: <Package className="w-4 h-4" />,
    category: 'operations',
  },
  {
    id: 'categories',
    route: '/admin/categories',
    label: 'Categories',
    icon: <Grid className="w-4 h-4" />,
    category: 'operations',
  },
  {
    id: 'locations',
    route: '/admin/locations',
    label: 'Locations',
    icon: <MapPin className="w-4 h-4" />,
    category: 'operations',
  },

  // Finance & AMC
  {
    id: 'amc',
    route: '/admin/amc',
    label: 'AMC',
    icon: <ShieldCheck className="w-4 h-4" />,
    category: 'finance',
  },
  {
    id: 'finance',
    route: '/admin/finance',
    label: 'Finance',
    icon: <DollarSign className="w-4 h-4" />,
    category: 'finance',
  },
  {
    id: 'payments',
    route: '/admin/payments',
    label: 'Payments',
    icon: <CreditCard className="w-4 h-4" />,
    category: 'finance',
  },
  {
    id: 'invoices',
    route: '/admin/invoices',
    label: 'Invoices',
    icon: <FileText className="w-4 h-4" />,
    category: 'finance',
  },
  {
    id: 'commission',
    route: '/admin/commission',
    label: 'Commission',
    icon: <Percent className="w-4 h-4" />,
    category: 'finance',
  },

  // System, Insights & Support
  {
    id: 'support',
    route: '/admin/support',
    label: 'Support',
    icon: <HelpCircle className="w-4 h-4" />,
    category: 'system',
  },
  {
    id: 'reviews',
    route: '/admin/reviews',
    label: 'Reviews',
    icon: <Star className="w-4 h-4" />,
    category: 'system',
  },
  {
    id: 'reports',
    route: '/admin/reports',
    label: 'Reports',
    icon: <BarChart3 className="w-4 h-4" />,
    category: 'system',
  },
  {
    id: 'notifications',
    route: '/admin/notifications',
    label: 'Notifications',
    icon: <Bell className="w-4 h-4" />,
    category: 'system',
  },
  {
    id: 'integrations',
    route: '/admin/integrations',
    label: 'Integrations',
    icon: <Cpu className="w-4 h-4" />,
    category: 'system',
  },
  {
    id: 'settings',
    route: '/admin/settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
    category: 'system',
  },
  {
    id: 'audit-logs',
    route: '/admin/audit-logs',
    label: 'Audit Logs',
    icon: <History className="w-4 h-4" />,
    category: 'system',
  },
];

export const AdminPlatform: React.FC = () => {
  const { user, canAccessRoute, loginWithCredentials } = useAuth();
  const { addToast } = useApp();

  // Initialize active section from current URL path if in browser
  const getInitialSection = (): string => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const match = ALL_SIDEBAR_ITEMS.find((item) => item.route.toLowerCase() === path);
      if (match) return match.id;
      if (path.startsWith('/admin/')) {
        const seg = path.replace('/admin/', '').split('/')[0];
        const matchSeg = ALL_SIDEBAR_ITEMS.find((item) => item.id === seg);
        if (matchSeg) return matchSeg.id;
      }
    }
    return 'dashboard';
  };

  const [activeSection, setActiveSection] = useState<string>(getInitialSection);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const match = ALL_SIDEBAR_ITEMS.find((item) => item.route.toLowerCase() === path);
      if (match) {
        setActiveSection(match.id);
      } else if (path === '/admin' || path === '/admin/') {
        setActiveSection('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync active section with window route or default
  const currentItem = ALL_SIDEBAR_ITEMS.find((i) => i.id === activeSection) || ALL_SIDEBAR_ITEMS[0];
  const activeRoute = currentItem.route;

  // Filter sidebar dynamically using central permission engine
  const visibleItems = ALL_SIDEBAR_ITEMS.filter((item) => canAccessRoute(item.route));

  // Determine if active route is permitted
  const hasAccessToCurrentSection = canAccessRoute(activeRoute);

  const getSectionTitle = (id: string) => {
    const item = ALL_SIDEBAR_ITEMS.find((i) => i.id === id);
    return item ? item.label : 'Dashboard';
  };

  const navigateToSection = (itemId: string) => {
    const item = ALL_SIDEBAR_ITEMS.find((i) => i.id === itemId);
    setActiveSection(itemId);
    setIsSidebarOpen(false);
    if (item && typeof window !== 'undefined' && window.location.pathname !== item.route) {
      window.history.pushState(null, '', item.route);
    }
  };

  // Quick switch between admin personas for verification (only when demo enabled)
  const handleAdminRoleSwitch = async (role: UserRole) => {
    let email = 'admin@vertex.demo';
    if (role === 'MANAGER') email = 'manager@vertex.demo';
    if (role === 'SALES') email = 'sales@vertex.demo';
    if (role === 'FINANCE') email = 'finance@vertex.demo';

    try {
      await loginWithCredentials({ email, password: 'Admin@123', role });
      addToast('Role Switched', `Active perspective: ${role}`, 'info');
    } catch {
      addToast('Error', 'Unable to switch demo persona', 'error');
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 sm:top-[33px] z-30 shadow-sm">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-slate-300 hover:text-white p-1 cursor-pointer"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              onClick={() => navigateToSection('dashboard')}
              className="cursor-pointer text-left focus:outline-none"
            >
              <VertexLogo size="sm" theme="dark" />
            </button>

            {/* Prominent Super Admin indicator or Command Center label */}
            {isSuperAdmin ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/80 border border-rose-800/80 px-2.5 py-1 rounded shadow-xs">
                <Sparkles className="w-3 h-3 text-rose-400" />
                SUPER ADMIN
              </span>
            ) : (
              <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-widest text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
                Admin Console
              </span>
            )}
          </div>

          {/* Right Header: Role Switcher & User Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Quick Role Switcher for verification - ONLY visible when demo login is enabled */}
            {isDemoLoginEnabled() && (
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-[11px] text-slate-400 mr-2 font-medium hidden sm:inline">
                  Test Role:
                </span>
                <select
                  value={user?.role || 'SUPER_ADMIN'}
                  onChange={(e) => handleAdminRoleSwitch(e.target.value as UserRole)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="SUPER_ADMIN" className="bg-slate-900 text-white">
                    SUPER_ADMIN (Full)
                  </option>
                  <option value="MANAGER" className="bg-slate-900 text-white">
                    MANAGER (Ops & Fleet)
                  </option>
                  <option value="SALES" className="bg-slate-900 text-white">
                    SALES (Catalog & AMC)
                  </option>
                  <option value="FINANCE" className="bg-slate-900 text-white">
                    FINANCE (Payouts & Dues)
                  </option>
                </select>
              </div>
            )}

            {/* Centralized User Profile Dropdown */}
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with Dynamic Permission Filter */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col justify-between ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ top: '64px' }}
        >
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Navigation ({visibleItems.length}/{ALL_SIDEBAR_ITEMS.length})</span>
              <Badge variant={isSuperAdmin ? 'danger' : 'neutral'} size="sm">
                {user?.role}
              </Badge>
            </div>

            {visibleItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Hidden modules notice for restricted roles */}
            {!isSuperAdmin && (
              <div className="mt-4 mx-2 p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {ALL_SIDEBAR_ITEMS.length - visibleItems.length} modules restricted by {user?.role} policy.
                </span>
              </div>
            )}
          </div>

          {/* Sidebar footer status */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">VERTEX RBAC Engine</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Body with Strict RBAC Route Guard */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {!hasAccessToCurrentSection ? (
              <UnauthorizedView
                attemptedPath={activeRoute}
                onReturnToDashboard={() => setActiveSection('dashboard')}
              />
            ) : (
              <>
                {activeSection === 'dashboard' && <AdminDashboard />}

                {activeSection === 'users' && <UserManagementView />}

                {activeSection === 'bookings' && <AdminBookingsView />}

                {activeSection === 'customers' && <AdminCustomersView />}

                {activeSection === 'technicians' && <AdminTechniciansView />}

                {activeSection !== 'dashboard' &&
                  activeSection !== 'users' &&
                  activeSection !== 'bookings' &&
                  activeSection !== 'customers' &&
                  activeSection !== 'technicians' && (
                    <AdminGenericSectionView
                      sectionKey={activeSection}
                      title={getSectionTitle(activeSection)}
                      subtitle={`Manage and oversee platform ${getSectionTitle(activeSection).toLowerCase()} data`}
                    />
                  )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
