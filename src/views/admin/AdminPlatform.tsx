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
import { AdminLeadsView } from './leads/AdminLeadsView';
import { AdminPromotionsView } from './promotions/AdminPromotionsView';
import { AdminManagersView } from './managers/AdminManagersView';
import { AdminGenericSectionView } from './AdminGenericSectionView';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { UnauthorizedView } from '../../components/auth/UnauthorizedView';
import { UserProfileDropdown } from '../../components/auth/UserProfileDropdown';
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
  Briefcase,
} from 'lucide-react';

interface SidebarItem {
  id: string;
  route: string;
  label: string;
  icon: React.ReactNode;
  category: 'core' | 'crm' | 'operations' | 'finance' | 'system';
}

const CATEGORY_METADATA: { key: 'core' | 'crm' | 'operations' | 'finance' | 'system'; label: string }[] = [
  { key: 'core', label: 'Core Platform' },
  { key: 'crm', label: 'CRM' },
  { key: 'operations', label: 'Team & Operations' },
  { key: 'finance', label: 'Finance & AMC' },
  { key: 'system', label: 'System & Support' },
];

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

  // CRM
  {
    id: 'leads',
    route: '/crm/leads',
    label: 'Leads',
    icon: <TrendingUp className="w-4 h-4" />,
    category: 'crm',
  },

  // Team & Operations
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
  {
    id: 'partners',
    route: '/admin/partners',
    label: 'Partners & Rules',
    icon: <Briefcase className="w-4 h-4" />,
    category: 'operations',
  },
  {
    id: 'hr',
    route: '/admin/hr',
    label: 'HR & Personnel',
    icon: <Users className="w-4 h-4" />,
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
  {
    id: 'payroll',
    route: '/admin/payroll',
    label: 'Payroll & Salaries',
    icon: <DollarSign className="w-4 h-4" />,
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
      // Redirection: Redirect old lead/crm routes to canonical '/crm/leads'
      if (
        path === '/admin/crm' ||
        path === '/admin/leads' ||
        path === '/crm' ||
        path === '/crm/' ||
        path === '/admin/crm-leads' ||
        path === '/admin/crm/leads' ||
        path === '/crm/lead' ||
        path === '/crm-lead' ||
        path === '/crm/leads' ||
        path === '/crm/leads/' ||
        path === '/leads'
      ) {
        if (path !== '/crm/leads') {
          window.history.replaceState(null, '', '/crm/leads');
        }
        return 'leads';
      }

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

  // Sync with browser back/forward buttons and enforce redirects
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (
        path === '/admin/crm' ||
        path === '/admin/leads' ||
        path === '/crm' ||
        path === '/crm/' ||
        path === '/admin/crm-leads' ||
        path === '/admin/crm/leads' ||
        path === '/crm/lead' ||
        path === '/crm-lead' ||
        path === '/crm/leads' ||
        path === '/crm/leads/' ||
        path === '/leads'
      ) {
        if (path !== '/crm/leads') {
          window.history.replaceState(null, '', '/crm/leads');
        }
        setActiveSection('leads');
        return;
      }

      const match = ALL_SIDEBAR_ITEMS.find((item) => item.route.toLowerCase() === path);
      if (match) {
        setActiveSection(match.id);
      } else if (path === '/admin' || path === '/admin/' || path === '/') {
        setActiveSection('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Ensure any initial load on old routes redirects cleanly to /crm/leads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (
        path === '/admin/crm' ||
        path === '/admin/leads' ||
        path === '/crm' ||
        path === '/crm/' ||
        path === '/admin/crm-leads' ||
        path === '/admin/crm/leads' ||
        path === '/crm/lead' ||
        path === '/crm-lead' ||
        path === '/leads'
      ) {
        window.history.replaceState(null, '', '/crm/leads');
      }
    }
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
            {/* Centralized User Profile Dropdown */}
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar with Consistent Width & Icon Alignment */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 min-w-[16rem] max-w-[16rem] shrink-0 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 flex flex-col justify-between select-none ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ top: '64px' }}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-2.5">
            <div className="px-2.5 pb-1 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Navigation
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {visibleItems.length} modules
              </span>
            </div>

            {CATEGORY_METADATA.map((cat) => {
              const catItems = visibleItems.filter((item) => item.category === cat.key);
              if (catItems.length === 0) return null;

              return (
                <div key={cat.key} className="pt-1.5 first:pt-0">
                  <div className="px-2.5 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {cat.label}
                  </div>
                  <div className="space-y-0.5">
                    {catItems.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigateToSection(item.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left group ${
                            isActive
                              ? 'bg-slate-900 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 shrink-0 flex items-center justify-center transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate flex-1">{item.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar footer status */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">VERTEX Console</span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Body with Strict RBAC Route Guard */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 min-w-0">
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

                {(activeSection === 'crm' || activeSection === 'leads') && <AdminLeadsView />}

                {activeSection === 'promotions' && <AdminPromotionsView />}

                {activeSection === 'managers' && <AdminManagersView />}

                {activeSection !== 'dashboard' &&
                  activeSection !== 'users' &&
                  activeSection !== 'bookings' &&
                  activeSection !== 'customers' &&
                  activeSection !== 'technicians' &&
                  activeSection !== 'crm' &&
                  activeSection !== 'leads' &&
                  activeSection !== 'promotions' &&
                  activeSection !== 'managers' && (
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
