import React from 'react';
import { Search, XCircle, ChevronRight } from 'lucide-react';

/* =========================================================================
   1. OperationsPageHeader
   Standard header component with title, descriptive subtitle, icon container,
   and action buttons area.
   ========================================================================= */
interface OperationsPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string; onClick?: () => void }>;
  className?: string;
}

export const OperationsPageHeader: React.FC<OperationsPageHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                {crumb.onClick ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="hover:text-slate-900 transition-colors font-medium truncate"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={idx === breadcrumbs.length - 1 ? 'font-semibold text-slate-800 truncate' : 'truncate'}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 tracking-tight truncate">{title}</h1>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-xs font-medium text-slate-600 mt-0.5 leading-relaxed break-words">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {actions}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   2. OperationsKpiGrid & OperationsKpiCard
   Equal-height KPI card grid with proper wrapping and contrast.
   ========================================================================= */
interface OperationsKpiGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const OperationsKpiGrid: React.FC<OperationsKpiGridProps> = ({
  children,
  columns = 4,
  className = '',
}) => {
  const colClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-4 items-stretch ${className}`}>
      {children}
    </div>
  );
};

interface OperationsKpiCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'indigo' | 'amber' | 'emerald' | 'blue' | 'purple' | 'slate';
  className?: string;
}

const VARIANT_ICON_STYLES: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  slate: 'bg-slate-100 text-slate-700',
};

export const OperationsKpiCard: React.FC<OperationsKpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  variant = 'indigo',
  className = '',
}) => {
  const iconStyle = VARIANT_ICON_STYLES[variant] || VARIANT_ICON_STYLES.indigo;

  return (
    <div
      className={`bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[110px] h-full ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase text-slate-500 tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <span className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center ${iconStyle}`}>
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2.5">
        <div className="text-2xl font-black text-slate-900 tracking-tight leading-none">
          {value}
        </div>
        {subtext && (
          <div className="text-xs font-semibold text-slate-600 mt-1.5 leading-snug break-words">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   3. OperationsToolbar & Status Tabs
   Responsive search field, filters, and status tabs with smooth internal scrolling.
   ========================================================================= */
interface OperationsToolbarProps {
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  filters?: React.ReactNode;
  tabs?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const OperationsToolbar: React.FC<OperationsToolbarProps> = ({
  search,
  filters,
  tabs,
  actions,
  className = '',
}) => {
  return (
    <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 ${className}`}>
      {/* Top row: search + filters + actions */}
      {(search || filters || actions) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {search && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={search.placeholder || 'Search records...'}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-sm font-semibold text-slate-900 bg-white placeholder:text-slate-400 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all"
              />
              {search.value && (
                <button
                  type="button"
                  onClick={() => search.onChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {filters && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {filters}
            </div>
          )}

          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Bottom row: status filter tabs with internal horizontal scroll without page overflow */}
      {tabs && (
        <div className="border-t border-slate-100 pt-3 relative">
          {tabs}
        </div>
      )}
    </div>
  );
};

export interface StatusTabItem {
  key: string;
  label: string;
  count?: number;
}

interface OperationsStatusTabsProps {
  tabs: StatusTabItem[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
}

export const OperationsStatusTabs: React.FC<OperationsStatusTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scroll-smooth ${className}`}>
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer select-none ${
              isSelected
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-800'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/* =========================================================================
   4. OperationsCard
   Clean container card for tables and main content.
   ========================================================================= */
interface OperationsCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const OperationsCard: React.FC<OperationsCardProps> = ({
  children,
  className = '',
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${
        noPadding ? '' : 'p-5'
      } ${className}`}
    >
      {children}
    </div>
  );
};
