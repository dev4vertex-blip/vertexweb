import { AuthUser, PermissionKey, UserRole, ActionKey } from '../types/auth';

export const ALL_PERMISSIONS: PermissionKey[] = [
  'DASHBOARD_VIEW',
  'USER_VIEW',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DEACTIVATE',
  'USER_DELETE',
  'ROLE_VIEW',
  'ROLE_MANAGE',
  'BOOKING_VIEW',
  'BOOKING_CREATE',
  'BOOKING_ASSIGN',
  'BOOKING_CANCEL',
  'CUSTOMER_VIEW',
  'CUSTOMER_MANAGE',
  'TECHNICIAN_VIEW',
  'TECHNICIAN_MANAGE',
  'SALES_TEAM_VIEW',
  'SALES_TEAM_MANAGE',
  'MANAGERS_VIEW',
  'MANAGERS_MANAGE',
  'SERVICE_VIEW',
  'SERVICE_MANAGE',
  'CATEGORY_VIEW',
  'CATEGORY_MANAGE',
  'LOCATION_VIEW',
  'LOCATION_MANAGE',
  'AMC_VIEW',
  'AMC_MANAGE',
  'FINANCE_VIEW',
  'PAYMENT_VIEW',
  'PAYMENT_REFUND',
  'INVOICE_VIEW',
  'COMMISSION_VIEW',
  'COMMISSION_UPDATE',
  'SUPPORT_VIEW',
  'SUPPORT_RESOLVE',
  'REVIEW_VIEW',
  'REPORT_VIEW',
  'NOTIFICATION_VIEW',
  'INTEGRATION_VIEW',
  'INTEGRATION_MANAGE',
  'SETTINGS_VIEW',
  'SETTINGS_UPDATE',
  'AUDIT_LOG_VIEW',
];

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  SUPER_ADMIN: [...ALL_PERMISSIONS],

  MANAGER: [
    'DASHBOARD_VIEW',
    'USER_VIEW',
    'USER_CREATE',
    'USER_UPDATE',
    'USER_DEACTIVATE',
    'BOOKING_VIEW',
    'BOOKING_CREATE',
    'BOOKING_ASSIGN',
    'BOOKING_CANCEL',
    'CUSTOMER_VIEW',
    'CUSTOMER_MANAGE',
    'TECHNICIAN_VIEW',
    'TECHNICIAN_MANAGE',
    'SALES_TEAM_VIEW',
    'SALES_TEAM_MANAGE', // Manager can add, edit, activate and deactivate Sales Team members
    'SERVICE_VIEW',
    'SERVICE_MANAGE',
    'CATEGORY_VIEW',
    'LOCATION_VIEW',
    'LOCATION_MANAGE',
    'AMC_VIEW',
    'AMC_MANAGE',
    'SUPPORT_VIEW',
    'SUPPORT_RESOLVE',
    'REVIEW_VIEW',
    'REPORT_VIEW',
    'NOTIFICATION_VIEW',
  ],

  SALES: [
    'DASHBOARD_VIEW',
    'BOOKING_VIEW',
    'BOOKING_CREATE',
    'CUSTOMER_VIEW',
    'SERVICE_VIEW',
    'AMC_VIEW',
    'SUPPORT_VIEW',
    'REVIEW_VIEW',
    'REPORT_VIEW',
  ],

  FINANCE: [
    'DASHBOARD_VIEW',
    'FINANCE_VIEW',
    'PAYMENT_VIEW',
    'PAYMENT_REFUND',
    'INVOICE_VIEW',
    'COMMISSION_VIEW',
    'REPORT_VIEW',
    'AMC_VIEW',
    'AUDIT_LOG_VIEW',
  ],

  CUSTOMER: [
    'BOOKING_VIEW',
    'BOOKING_CREATE',
    'CUSTOMER_VIEW',
    'SERVICE_VIEW',
    'AMC_VIEW',
    'SUPPORT_VIEW',
  ],

  TECHNICIAN: [
    'BOOKING_VIEW',
    'TECHNICIAN_VIEW',
    'SUPPORT_VIEW',
  ],
};

// Route to required permissions mapping for Admin routes
export const ADMIN_ROUTE_PERMISSIONS: Record<string, PermissionKey[]> = {
  '/admin': ['DASHBOARD_VIEW'],
  '/admin/dashboard': ['DASHBOARD_VIEW'],
  '/admin/users': ['USER_VIEW'],
  '/admin/bookings': ['BOOKING_VIEW'],
  '/admin/customers': ['CUSTOMER_VIEW'],
  '/admin/technicians': ['TECHNICIAN_VIEW'],
  '/admin/sales': ['SALES_TEAM_VIEW'],
  '/admin/crm': ['SALES_VIEW'],
  '/admin/promotions': ['SERVICE_VIEW'],
  '/admin/managers': ['MANAGERS_VIEW'],
  '/admin/finance': ['FINANCE_VIEW'],
  '/admin/services': ['SERVICE_VIEW'],
  '/admin/categories': ['CATEGORY_VIEW'],
  '/admin/locations': ['LOCATION_VIEW'],
  '/admin/amc': ['AMC_VIEW'],
  '/admin/payments': ['PAYMENT_VIEW'],
  '/admin/invoices': ['INVOICE_VIEW'],
  '/admin/commission': ['COMMISSION_VIEW'],
  '/admin/support': ['SUPPORT_VIEW'],
  '/admin/reviews': ['REVIEW_VIEW'],
  '/admin/reports': ['REPORT_VIEW'],
  '/admin/notifications': ['NOTIFICATION_VIEW'],
  '/admin/integrations': ['INTEGRATION_VIEW'],
  '/admin/settings': ['SETTINGS_VIEW'],
  '/admin/audit-logs': ['AUDIT_LOG_VIEW'],
};

// Action permissions mapping
export const ACTION_PERMISSIONS: Record<ActionKey, PermissionKey> = {
  BOOKING_ASSIGN: 'BOOKING_ASSIGN',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DEACTIVATE: 'USER_DEACTIVATE',
  USER_DELETE: 'USER_DELETE',
  COMMISSION_UPDATE: 'COMMISSION_UPDATE',
  PAYMENT_VIEW: 'PAYMENT_VIEW',
  PAYMENT_REFUND: 'PAYMENT_REFUND',
  SALES_TEAM_MANAGE: 'SALES_TEAM_MANAGE',
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
  SYSTEM_INTEGRATION: 'INTEGRATION_MANAGE',
};

/**
 * Check if the user has a specific role or matches one of several roles
 */
export function hasRole(user: AuthUser | null, role: UserRole | UserRole[]): boolean {
  if (!user) return false;
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: AuthUser | null, permission: PermissionKey): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return user.permissions.includes(permission);
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(user: AuthUser | null, path: string): boolean {
  if (!user) return false;

  // Clean path (remove query params & trailing slashes if any)
  const cleanPath = path.split('?')[0].replace(/\/$/, '') || '/';

  // Super Admin can access everything
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Customer Routes
  if (cleanPath.startsWith('/customer')) {
    return user.role === 'CUSTOMER';
  }

  // Technician Routes
  if (cleanPath.startsWith('/technician')) {
    return user.role === 'TECHNICIAN';
  }

  // Admin Routes
  if (cleanPath.startsWith('/admin')) {
    // Only internal roles (SALES, MANAGER, FINANCE, SUPER_ADMIN) can access admin
    if (user.role === 'CUSTOMER' || user.role === 'TECHNICIAN') {
      return false;
    }

    const requiredPermissions = ADMIN_ROUTE_PERMISSIONS[cleanPath];
    if (!requiredPermissions || requiredPermissions.length === 0) {
      // Default to general dashboard permission check
      return hasPermission(user, 'DASHBOARD_VIEW');
    }

    return requiredPermissions.every((perm) => hasPermission(user, perm));
  }

  return true;
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(user: AuthUser | null, action: ActionKey): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;

  const requiredPermission = ACTION_PERMISSIONS[action];
  if (!requiredPermission) return false;

  return hasPermission(user, requiredPermission);
}
