export type UserRole =
  | 'CUSTOMER'
  | 'TECHNICIAN'
  | 'SALES'
  | 'MANAGER'
  | 'FINANCE'
  | 'SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED';

export type PermissionKey =
  | 'DASHBOARD_VIEW'
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DEACTIVATE'
  | 'USER_DELETE'
  | 'ROLE_VIEW'
  | 'ROLE_MANAGE'
  | 'BOOKING_VIEW'
  | 'BOOKING_CREATE'
  | 'BOOKING_UPDATE'
  | 'BOOKING_ASSIGN'
  | 'BOOKING_CANCEL'
  | 'CUSTOMER_VIEW'
  | 'CUSTOMER_CREATE'
  | 'CUSTOMER_UPDATE'
  | 'CUSTOMER_MANAGE'
  | 'TECHNICIAN_VIEW'
  | 'TECHNICIAN_CREATE'
  | 'TECHNICIAN_UPDATE'
  | 'TECHNICIAN_ASSIGN'
  | 'TECHNICIAN_MANAGE'
  | 'SALES_VIEW'
  | 'SALES_CREATE'
  | 'SALES_UPDATE'
  | 'SALES_TEAM_VIEW'
  | 'SALES_TEAM_MANAGE'
  | 'MANAGERS_VIEW'
  | 'MANAGERS_MANAGE'
  | 'MANAGER_VIEW'
  | 'FINANCE_VIEW'
  | 'SERVICE_VIEW'
  | 'SERVICE_CREATE'
  | 'SERVICE_UPDATE'
  | 'SERVICE_DELETE'
  | 'SERVICE_MANAGE'
  | 'CATEGORY_VIEW'
  | 'CATEGORY_MANAGE'
  | 'LOCATION_VIEW'
  | 'LOCATION_MANAGE'
  | 'AMC_VIEW'
  | 'AMC_MANAGE'
  | 'PAYMENT_VIEW'
  | 'PAYMENT_MANAGE'
  | 'PAYMENT_REFUND'
  | 'INVOICE_VIEW'
  | 'INVOICE_MANAGE'
  | 'COMMISSION_VIEW'
  | 'COMMISSION_UPDATE'
  | 'COMMISSION_MANAGE'
  | 'SUPPORT_VIEW'
  | 'SUPPORT_RESOLVE'
  | 'SUPPORT_MANAGE'
  | 'REVIEW_VIEW'
  | 'REPORT_VIEW'
  | 'NOTIFICATION_VIEW'
  | 'NOTIFICATION_MANAGE'
  | 'INTEGRATION_VIEW'
  | 'INTEGRATION_MANAGE'
  | 'SETTINGS_VIEW'
  | 'SETTINGS_UPDATE'
  | 'SETTINGS_MANAGE'
  | 'AUDIT_VIEW'
  | 'AUDIT_LOG_VIEW';

export type ActionKey =
  | 'BOOKING_ASSIGN'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DEACTIVATE'
  | 'USER_DELETE'
  | 'COMMISSION_UPDATE'
  | 'PAYMENT_VIEW'
  | 'PAYMENT_REFUND'
  | 'SALES_TEAM_MANAGE'
  | 'SETTINGS_UPDATE'
  | 'SYSTEM_INTEGRATION';

export interface AuthUser {
  id: string;
  publicId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  roleName?: string;
  status: string; // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'active'
  city?: string;
  cityId?: number;
  cityName?: string;
  permissions: PermissionKey[];
  avatar?: string;
  department?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  locationScopes?: any[];
  profile?: any;
}

export interface UserListItem {
  id: string;
  publicId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  roleName?: string;
  status: UserStatus;
  cityId?: number | null;
  cityName?: string | null;
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

export interface CityItem {
  id: number;
  name: string;
  state_id?: number;
  stateId?: number;
  tier: number;
  active?: boolean;
  state_name?: string;
  state_code?: string;
}

export interface RoleItem {
  code: UserRole;
  name: string;
  description: string;
  isSystemRole?: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  role?: UserRole;
}

export interface OtpCredentials {
  phone: string;
  otp: string;
  role: 'CUSTOMER' | 'TECHNICIAN';
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
}

export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'USER_ACTIVATED'
  | 'USER_DELETED'
  | 'ROLE_CHANGED'
  | 'PERMISSION_CHANGED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'SETTINGS_CHANGED';

export interface AuditLogEntry {
  id: string;
  timestamp?: string;
  created_at?: string;
  userId?: string;
  user_id?: string;
  userName?: string;
  user_name?: string;
  userRole?: string;
  user_role?: string;
  action: string;
  details?: string;
  old_value?: string;
  new_value?: string;
  ipAddress?: string;
  ip_address?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING';
}
