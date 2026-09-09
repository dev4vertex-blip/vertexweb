export type UserRole =
  | 'CUSTOMER'
  | 'TECHNICIAN'
  | 'SALES'
  | 'SALES_TEAM'
  | 'MANAGER'
  | 'FINANCE'
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MARKETING'
  | 'OPERATIONS'
  | 'SUPPORT'
  | 'HR'
  | 'PAYROLL'
  | 'EMPLOYEE'
  | 'PARTNER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED';

export type PermissionKey =
  | 'DASHBOARD_VIEW'
  | 'USER_VIEW'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_EDIT'
  | 'USER_ACTIVATE'
  | 'USER_DEACTIVATE'
  | 'USER_DELETE'
  | 'USER_ROLE_ASSIGN'
  | 'USER_PERMISSION_MANAGE'
  | 'ROLE_VIEW'
  | 'ROLE_MANAGE'
  | 'BOOKING_VIEW'
  | 'BOOKING_CREATE'
  | 'BOOKING_UPDATE'
  | 'BOOKING_EDIT'
  | 'BOOKING_ASSIGN'
  | 'BOOKING_CANCEL'
  | 'CUSTOMER_VIEW'
  | 'CUSTOMER_CREATE'
  | 'CUSTOMER_UPDATE'
  | 'CUSTOMER_EDIT'
  | 'CUSTOMER_DEACTIVATE'
  | 'CUSTOMER_DELETE'
  | 'CUSTOMER_MANAGE'
  | 'LEAD_VIEW'
  | 'LEAD_VIEW_OWN'
  | 'LEAD_VIEW_TEAM'
  | 'LEAD_VIEW_ALL'
  | 'LEAD_CREATE'
  | 'LEAD_EDIT'
  | 'LEAD_UPDATE'
  | 'LEAD_DELETE'
  | 'LEAD_ASSIGN'
  | 'LEAD_REASSIGN'
  | 'LEAD_FOLLOWUP_CREATE'
  | 'LEAD_FOLLOWUP_EDIT'
  | 'LEAD_FOLLOWUP_COMPLETE'
  | 'LEAD_CONVERT'
  | 'LEAD_WON'
  | 'LEAD_LOST'
  | 'LEAD_MARK_WON'
  | 'LEAD_MARK_LOST'
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
  | 'SERVICE_EDIT'
  | 'SERVICE_DELETE'
  | 'SERVICE_ACTIVATE'
  | 'SERVICE_DEACTIVATE'
  | 'SERVICE_PRICE_EDIT'
  | 'SERVICE_CATEGORY_MANAGE'
  | 'SERVICE_MANAGE'
  | 'CATEGORY_VIEW'
  | 'CATEGORY_MANAGE'
  | 'LOCATION_VIEW'
  | 'LOCATION_MANAGE'
  | 'AMC_VIEW'
  | 'AMC_CREATE'
  | 'AMC_EDIT'
  | 'AMC_MANAGE'
  | 'AMC_PLAN_CREATE'
  | 'AMC_PLAN_VIEW'
  | 'AMC_PLAN_EDIT'
  | 'AMC_PLAN_DELETE'
  | 'AMC_PLAN_ACTIVATE'
  | 'AMC_PLAN_DEACTIVATE'
  | 'AMC_PLAN_PRICE_EDIT'
  | 'AMC_PLAN_BENEFIT_EDIT'
  | 'PARTNER_CREATE'
  | 'PARTNER_VIEW'
  | 'PARTNER_EDIT'
  | 'PARTNER_DELETE'
  | 'PARTNER_ACTIVATE'
  | 'PARTNER_DEACTIVATE'
  | 'PARTNER_COMMISSION_VIEW'
  | 'PARTNER_COMMISSION_CREATE'
  | 'PARTNER_COMMISSION_EDIT'
  | 'PARTNER_COMMISSION_DELETE'
  | 'PARTNER_COMMISSION_APPROVE'
  | 'PARTNER_COMMISSION_RECALCULATE'
  | 'PAYMENT_VIEW'
  | 'PAYMENT_CREATE'
  | 'PAYMENT_COLLECT'
  | 'PAYMENT_VERIFY'
  | 'PAYMENT_RECONCILE'
  | 'PAYMENT_REFUND_REQUEST'
  | 'PAYMENT_REFUND_APPROVE'
  | 'PAYMENT_EDIT'
  | 'PAYMENT_MANAGE'
  | 'PAYMENT_REFUND'
  | 'INVOICE_VIEW'
  | 'INVOICE_CREATE'
  | 'INVOICE_EDIT'
  | 'INVOICE_VOID'
  | 'INVOICE_MANAGE'
  | 'COMMISSION_VIEW'
  | 'COMMISSION_UPDATE'
  | 'COMMISSION_MANAGE'
  | 'PROMOTION_VIEW'
  | 'PROMOTION_CREATE'
  | 'PROMOTION_EDIT'
  | 'PROMOTION_DELETE'
  | 'PROMOTION_ACTIVATE'
  | 'SUPPORT_VIEW'
  | 'SUPPORT_RESOLVE'
  | 'SUPPORT_MANAGE'
  | 'REVIEW_VIEW'
  | 'REPORT_VIEW'
  | 'REPORT_EXPORT'
  | 'NOTIFICATION_VIEW'
  | 'NOTIFICATION_MANAGE'
  | 'MARKETING_VIEW'
  | 'MARKETING_MANAGE'
  | 'OPERATIONS_VIEW'
  | 'OPERATIONS_MANAGE'
  | 'SALES_MANAGE'
  | 'USER_ASSIGN_ROLE'
  | 'LEAD_UPDATE'
  | 'INTEGRATION_VIEW'
  | 'INTEGRATION_MANAGE'
  | 'SETTINGS_VIEW'
  | 'SETTINGS_UPDATE'
  | 'SETTINGS_EDIT'
  | 'SETTINGS_MANAGE'
  | 'AUDIT_VIEW'
  | 'AUDIT_LOG_VIEW'
  // HR Module Permissions
  | 'HR_EMPLOYEE_CREATE'
  | 'HR_EMPLOYEE_VIEW'
  | 'HR_EMPLOYEE_EDIT'
  | 'HR_EMPLOYEE_DELETE'
  | 'HR_EMPLOYEE_ACTIVATE'
  | 'HR_EMPLOYEE_DEACTIVATE'
  | 'HR_DEPARTMENT_MANAGE'
  | 'HR_DESIGNATION_MANAGE'
  | 'HR_SHIFT_MANAGE'
  | 'HR_DOCUMENT_VIEW'
  | 'HR_DOCUMENT_UPLOAD'
  | 'HR_DOCUMENT_DELETE'
  | 'HR_ATTENDANCE_VIEW'
  | 'HR_ATTENDANCE_EDIT'
  | 'HR_ATTENDANCE_APPROVE'
  | 'HR_LEAVE_VIEW'
  | 'HR_LEAVE_CREATE'
  | 'HR_LEAVE_EDIT'
  | 'HR_LEAVE_APPROVE'
  | 'HR_LEAVE_REJECT'
  | 'HR_HOLIDAY_MANAGE'
  | 'HR_ASSET_MANAGE'
  | 'HR_PERFORMANCE_VIEW'
  | 'HR_PERFORMANCE_CREATE'
  | 'HR_PERFORMANCE_EDIT'
  | 'HR_RECRUITMENT_VIEW'
  | 'HR_RECRUITMENT_CREATE'
  | 'HR_RECRUITMENT_EDIT'
  | 'HR_EXIT_MANAGE'
  // Payroll Module Permissions
  | 'PAYROLL_VIEW'
  | 'PAYROLL_CREATE'
  | 'PAYROLL_EDIT'
  | 'PAYROLL_PROCESS'
  | 'PAYROLL_APPROVE'
  | 'PAYROLL_FINALIZE'
  | 'PAYROLL_REOPEN'
  | 'PAYROLL_SALARY_STRUCTURE_VIEW'
  | 'PAYROLL_SALARY_STRUCTURE_CREATE'
  | 'PAYROLL_SALARY_STRUCTURE_EDIT'
  | 'PAYROLL_DEDUCTIONS_VIEW'
  | 'PAYROLL_DEDUCTIONS_EDIT'
  | 'PAYROLL_BONUS_VIEW'
  | 'PAYROLL_BONUS_CREATE'
  | 'PAYROLL_BONUS_EDIT'
  | 'PAYROLL_LOAN_VIEW'
  | 'PAYROLL_LOAN_CREATE'
  | 'PAYROLL_LOAN_EDIT'
  | 'PAYROLL_ADVANCE_VIEW'
  | 'PAYROLL_ADVANCE_CREATE'
  | 'PAYROLL_ADVANCE_EDIT'
  | 'PAYSLIP_VIEW'
  | 'PAYSLIP_GENERATE'
  | 'PAYSLIP_DOWNLOAD'
  | 'PAYROLL_REPORT_VIEW'
  | 'PAYROLL_REPORT_EXPORT'
  // Employee Self-Service Permissions
  | 'EMPLOYEE_PROFILE_VIEW'
  | 'EMPLOYEE_ATTENDANCE_VIEW'
  | 'EMPLOYEE_LEAVE_VIEW'
  | 'EMPLOYEE_LEAVE_APPLY'
  | 'EMPLOYEE_PAYSLIP_VIEW'
  | 'EMPLOYEE_PAYSLIP_DOWNLOAD'
  | 'EMPLOYEE_DOCUMENT_VIEW';

export type ActionKey =
  | 'BOOKING_ASSIGN'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DEACTIVATE'
  | 'USER_DELETE'
  | 'CUSTOMER_CREATE'
  | 'CUSTOMER_EDIT'
  | 'CUSTOMER_DELETE'
  | 'LEAD_VIEW'
  | 'LEAD_CREATE'
  | 'LEAD_EDIT'
  | 'LEAD_DELETE'
  | 'LEAD_ASSIGN'
  | 'LEAD_REASSIGN'
  | 'LEAD_FOLLOWUP_CREATE'
  | 'LEAD_FOLLOWUP_COMPLETE'
  | 'LEAD_CONVERT'
  | 'LEAD_WON'
  | 'LEAD_LOST'
  | 'PAYMENT_COLLECT'
  | 'PAYMENT_VERIFY'
  | 'PAYMENT_REFUND'
  | 'COMMISSION_UPDATE'
  | 'PAYMENT_VIEW'
  | 'SALES_TEAM_MANAGE'
  | 'SETTINGS_UPDATE'
  | 'SYSTEM_INTEGRATION'
  | 'SERVICE_CREATE'
  | 'SERVICE_EDIT'
  | 'SERVICE_DELETE'
  | 'SERVICE_ACTIVATE'
  | 'SERVICE_DEACTIVATE'
  | 'SERVICE_PRICE_EDIT'
  | 'SERVICE_CATEGORY_MANAGE'
  | 'CATEGORY_MANAGE';

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

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'IN_PROGRESS'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'WON'
  | 'LOST';

export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface LeadItem {
  id: string;
  lead_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  city_id?: number | string;
  city_name?: string;
  service_category?: string;
  service_requirement?: string;
  source: string;
  priority: LeadPriority;
  status: LeadStatus;
  estimated_value: number;
  assigned_to_user_id?: string;
  assigned_to_name?: string;
  created_by_user_id?: string;
  created_by_name?: string;
  won_lost_reason?: string;
  notes?: string;
  converted_booking_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadFollowupItem {
  id: string;
  lead_id: string;
  type: 'CALL' | 'MEETING' | 'EMAIL' | 'NOTES';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes: string;
  followup_date: string;
  next_followup_date?: string;
  created_by_user_id?: string;
  created_by_name?: string;
  created_at: string;
}

export interface CreateLeadPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  city_id?: number | string;
  service_category?: string;
  service_requirement?: string;
  source?: string;
  priority?: LeadPriority;
  estimated_value?: number;
  assigned_to_user_id?: string;
  notes?: string;
}

export interface UpdateLeadPayload {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  city_id?: number | string;
  service_category?: string;
  service_requirement?: string;
  source?: string;
  priority?: LeadPriority;
  status?: LeadStatus;
  estimated_value?: number;
  assigned_to_user_id?: string;
  notes?: string;
  won_lost_reason?: string;
}

export interface AddFollowupPayload {
  type?: 'CALL' | 'MEETING' | 'EMAIL' | 'NOTES';
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes: string;
  followup_date?: string;
  next_followup_date?: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  manager_id?: string;
  manager_name?: string;
}

export interface DesignationItem {
  id: string;
  title: string;
  department_id: string;
  department_name?: string;
  level?: string;
}

