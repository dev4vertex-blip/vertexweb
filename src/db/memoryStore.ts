import crypto from 'crypto';
import {
  ServiceCategoryRecord,
  ServiceRecord,
  AmcPlanRecord,
  PartnerRecord,
  CommissionRuleRecord,
  PartnerCommissionRecord,
  DepartmentRecord,
  DesignationRecord,
  ShiftRecord,
  EmployeeRecord,
  EmployeeAttendanceRecord,
  LeaveTypeRecord,
  LeaveBalanceRecord,
  LeaveRequestRecord,
  HolidayRecord,
  EmployeeDocumentRecord,
  RecruitmentJobRecord,
  CandidateRecord,
  EmployeeExitRecord,
  SalaryStructureRecord,
  PayrollRunRecord,
  PayslipRecord,
  INITIAL_SERVICE_CATEGORIES,
  INITIAL_SERVICES,
  INITIAL_AMC_PLANS,
  INITIAL_PARTNERS,
  INITIAL_COMMISSION_RULES,
  INITIAL_PARTNER_COMMISSIONS,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_SHIFTS,
  INITIAL_LEAVE_TYPES,
  INITIAL_HOLIDAYS,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_BALANCES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_EMPLOYEE_ATTENDANCE,
  INITIAL_EMPLOYEE_DOCUMENTS,
  INITIAL_RECRUITMENT_JOBS,
  INITIAL_CANDIDATES,
  INITIAL_EXITS,
  INITIAL_SALARY_STRUCTURES,
  INITIAL_PAYROLL_RUNS,
  INITIAL_PAYSLIPS,
} from './extendedSeedData.js';

export interface StateRecord {
  id: number;
  name: string;
  code: string;
  created_at: string;
}

export interface CityRecord {
  id: number;
  name: string;
  state_id: number;
  tier: number;
  active: boolean;
  state_name?: string;
  state_code?: string;
  created_at: string;
}

export interface RoleRecord {
  code: string;
  name: string;
  description: string;
  is_system_role: boolean;
  created_at: string;
}

export interface PermissionRecord {
  code: string;
  name: string;
  category: string;
  description: string;
  created_at: string;
}

export interface UserRecord {
  id: string;
  public_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  password_hash: string | null;
  role: string;
  status: string;
  profile_image: string | null;
  city_id: number | null;
  department?: string | null;
  designation?: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  deleted_at: string | null;
}

export interface AuditLogRecord {
  id: string;
  user_id: string | null;
  user_name: string;
  user_role: string;
  action: string;
  entity: string;
  entity_id: string | null;
  old_value: any;
  new_value: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface BookingRecord {
  id: string;
  public_id: string;
  service_id: string;
  service_name: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  technician_id: string | null;
  technician_name: string | null;
  technician_phone: string | null;
  technician_rating: number;
  status: string;
  scheduled_date: string;
  time_slot: string;
  service_address: string;
  total_amount: number;
  technician_cut: number;
  payment_status: string;
  otp: string;
  instructions: string;
  work_performed?: string;
  parts_used?: string;
  technician_notes?: string;
  customer_remarks?: string;
  required_parts?: string[];
  created_at: string;
  updated_at?: string;
  deleted_at: string | null;
}

export interface AttendanceRecord {
  id: string;
  technician_id: string;
  date: string;
  day: string;
  punch_in: string;
  punch_out: string | null;
  duration_hours: number;
  status: 'PRESENT' | 'HALF_DAY' | 'OFF' | 'LEAVE';
  hub: string;
}

export interface EarningsRecord {
  id: string;
  technician_id: string;
  job_id: string;
  service: string;
  customer: string;
  date: string;
  amount: number;
  status: 'Settled' | 'Processing';
}

export interface NotificationRecord {
  id: string;
  technician_id: string;
  title: string;
  desc: string;
  time: string;
  type: 'job' | 'rating' | 'payout' | 'system';
  is_read: boolean;
}

export interface LeadFollowupRecord {
  id: string;
  lead_id: string;
  scheduled_date: string;
  scheduled_time?: string | null;
  followup_type?: string | null;
  notes: string;
  outcome?: string | null;
  status?: 'OPEN' | 'COMPLETED' | 'CANCELLED';
  completed: boolean;
  completed_at?: string | null;
  completed_by?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
}

export interface LeadRecord {
  id: string;
  public_id: string;
  customer_name: string;
  company_name?: string | null;
  email?: string | null;
  phone: string;
  alternate_phone?: string | null;
  address?: string | null;
  service_interest: string;
  service_category?: string | null;
  requirement_details?: string | null;
  estimated_value: number;
  lead_source?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  created_by: string;
  created_by_name?: string | null;
  stage: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SITE_VISIT_SCHEDULED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST';
  status: 'ACTIVE' | 'WON' | 'LOST' | 'ARCHIVED';
  loss_reason?: string | null;
  won_booking_id?: string | null;
  won_customer_id?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  expected_followup_date?: string | null;
  expected_followup_time?: string | null;
  notes?: string | null;
  followups?: LeadFollowupRecord[];
  // Compatibility aliases
  lead_number?: string;
  customer_phone?: string;
  service_requirement?: string;
  source?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface PaymentRecord {
  id: string;
  public_id: string;
  booking_id?: string | null;
  customer_id?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  amount: number;
  currency: string;
  payment_method: 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'CHEQUE';
  payment_reference?: string | null;
  status: 'PENDING' | 'COLLECTED' | 'VERIFIED' | 'REFUNDED' | 'FAILED';
  collected_by: string;
  collected_by_name: string;
  collected_at: string;
  notes?: string | null;
  receipt_number?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  refund_reason?: string | null;
  refund_status: 'NONE' | 'REQUESTED' | 'APPROVED' | 'REJECTED';
  refund_amount?: number | null;
  refund_approved_by?: string | null;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
}

class MemoryStore {
  public states: StateRecord[] = [
    { id: 1, name: 'Delhi', code: 'DL', created_at: new Date().toISOString() },
    { id: 2, name: 'Haryana', code: 'HR', created_at: new Date().toISOString() },
    { id: 3, name: 'Uttar Pradesh', code: 'UP', created_at: new Date().toISOString() },
    { id: 4, name: 'Maharashtra', code: 'MH', created_at: new Date().toISOString() },
    { id: 5, name: 'Karnataka', code: 'KA', created_at: new Date().toISOString() },
    { id: 6, name: 'Tamil Nadu', code: 'TN', created_at: new Date().toISOString() },
    { id: 7, name: 'West Bengal', code: 'WB', created_at: new Date().toISOString() },
  ];

  public cities: CityRecord[] = [
    { id: 1, name: 'Delhi', state_id: 1, tier: 1, active: true, state_name: 'Delhi', state_code: 'DL', created_at: new Date().toISOString() },
    { id: 2, name: 'Gurgaon', state_id: 2, tier: 1, active: true, state_name: 'Haryana', state_code: 'HR', created_at: new Date().toISOString() },
    { id: 3, name: 'Noida', state_id: 3, tier: 1, active: true, state_name: 'Uttar Pradesh', state_code: 'UP', created_at: new Date().toISOString() },
    { id: 4, name: 'Mumbai', state_id: 4, tier: 1, active: true, state_name: 'Maharashtra', state_code: 'MH', created_at: new Date().toISOString() },
    { id: 5, name: 'Bangalore', state_id: 5, tier: 1, active: true, state_name: 'Karnataka', state_code: 'KA', created_at: new Date().toISOString() },
    { id: 6, name: 'Pune', state_id: 4, tier: 1, active: true, state_name: 'Maharashtra', state_code: 'MH', created_at: new Date().toISOString() },
    { id: 7, name: 'Chennai', state_id: 6, tier: 1, active: true, state_name: 'Tamil Nadu', state_code: 'TN', created_at: new Date().toISOString() },
    { id: 8, name: 'Kolkata', state_id: 7, tier: 1, active: true, state_name: 'West Bengal', state_code: 'WB', created_at: new Date().toISOString() },
  ];

  public roles: RoleRecord[] = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Platform Master Controller with omnipotent authority', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'ADMIN', name: 'System Administrator', description: 'Enterprise Administrator with elevated system privileges', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'MANAGER', name: 'Operations Hub Manager', description: 'Regional operations manager with fleet dispatch and sales supervision', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'SALES', name: 'Sales & Growth Specialist', description: 'Commercial AMC sales, customer acquisitions and quota manager', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'SALES_TEAM', name: 'Sales Representative', description: 'Field sales agent with lead conversion and booking creation rights', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'FINANCE', name: 'Finance & Billing Specialist', description: 'Invoicing, payouts, refund approvals, and tax ledger governance', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'MARKETING', name: 'Marketing Specialist', description: 'Promotions, lead generation campaigns, and marketing analytics', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'OPERATIONS', name: 'Operations Specialist', description: 'Fleet scheduling, hub operations, and service fulfillment', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'SUPPORT', name: 'Customer Support Executive', description: 'Customer helpdesk tickets, escalations, and issue resolutions', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'TECHNICIAN', name: 'Field Service Engineer', description: 'Verified appliance diagnostic and repair technician', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'CUSTOMER', name: 'Consumer / Commercial Client', description: 'Service customer booking repair and AMC services', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'HR', name: 'HR Manager', description: 'Human Resource, Personnel Onboarding, Attendance & Leaves Officer', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'PAYROLL', name: 'Payroll Specialist', description: 'Compensation, Deductions, Payslips & Monthly Payroll Processor', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'EMPLOYEE', name: 'Staff Employee', description: 'On-roll corporate and operational employee', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'PARTNER', name: 'Channel Partner', description: 'Authorized retail or corporate referral channel partner', is_system_role: true, created_at: new Date().toISOString() },
  ];

  public permissions: PermissionRecord[] = [
    { code: 'DASHBOARD_VIEW', name: 'View Dashboard', category: 'Analytics', description: 'View executive and operational summary metrics', created_at: new Date().toISOString() },
    { code: 'USER_VIEW', name: 'View Users', category: 'User Management', description: 'View user directory and team lists', created_at: new Date().toISOString() },
    { code: 'USER_CREATE', name: 'Create Users', category: 'User Management', description: 'Create internal users or employees', created_at: new Date().toISOString() },
    { code: 'USER_UPDATE', name: 'Update Users', category: 'User Management', description: 'Edit user details, roles and profiles', created_at: new Date().toISOString() },
    { code: 'USER_EDIT', name: 'Edit Users', category: 'User Management', description: 'Edit user profile attributes', created_at: new Date().toISOString() },
    { code: 'USER_ACTIVATE', name: 'Activate Users', category: 'User Management', description: 'Reactivate suspended user accounts', created_at: new Date().toISOString() },
    { code: 'USER_DEACTIVATE', name: 'Deactivate Users', category: 'User Management', description: 'Deactivate or suspend user accounts', created_at: new Date().toISOString() },
    { code: 'USER_DELETE', name: 'Delete Users', category: 'User Management', description: 'Soft-delete user accounts', created_at: new Date().toISOString() },
    { code: 'USER_ROLE_ASSIGN', name: 'Assign User Roles', category: 'User Management', description: 'Assign roles to user accounts', created_at: new Date().toISOString() },
    { code: 'ROLE_VIEW', name: 'View Roles', category: 'Role Governance', description: 'View role hierarchy and permissions', created_at: new Date().toISOString() },
    { code: 'ROLE_MANAGE', name: 'Manage Roles', category: 'Role Governance', description: 'Modify role permission bindings', created_at: new Date().toISOString() },
    { code: 'BOOKING_VIEW', name: 'View Bookings', category: 'Bookings', description: 'View service booking details and status', created_at: new Date().toISOString() },
    { code: 'BOOKING_CREATE', name: 'Create Bookings', category: 'Bookings', description: 'Initiate new service bookings', created_at: new Date().toISOString() },
    { code: 'BOOKING_UPDATE', name: 'Update Bookings', category: 'Bookings', description: 'Modify booking timeline, parts, and prices', created_at: new Date().toISOString() },
    { code: 'BOOKING_EDIT', name: 'Edit Bookings', category: 'Bookings', description: 'Edit service booking details', created_at: new Date().toISOString() },
    { code: 'BOOKING_ASSIGN', name: 'Assign Technician', category: 'Bookings', description: 'Assign field engineers to bookings', created_at: new Date().toISOString() },
    { code: 'BOOKING_CANCEL', name: 'Cancel Bookings', category: 'Bookings', description: 'Cancel scheduled customer appointments', created_at: new Date().toISOString() },
    { code: 'CUSTOMER_VIEW', name: 'View Customers', category: 'CRM', description: 'Access customer profiles and history', created_at: new Date().toISOString() },
    { code: 'CUSTOMER_CREATE', name: 'Create Customers', category: 'CRM', description: 'Register new customer accounts', created_at: new Date().toISOString() },
    { code: 'CUSTOMER_UPDATE', name: 'Update Customers', category: 'CRM', description: 'Edit customer addresses and details', created_at: new Date().toISOString() },
    { code: 'CUSTOMER_EDIT', name: 'Edit Customers', category: 'CRM', description: 'Edit customer profile and contact details', created_at: new Date().toISOString() },
    { code: 'CUSTOMER_DEACTIVATE', name: 'Deactivate Customers', category: 'CRM', description: 'Deactivate customer accounts', created_at: new Date().toISOString() },
    { code: 'CUSTOMER_DELETE', name: 'Delete Customers', category: 'CRM', description: 'Remove customer accounts', created_at: new Date().toISOString() },
    { code: 'CUSTOMER_MANAGE', name: 'Manage Customers', category: 'CRM', description: 'Comprehensive customer administration', created_at: new Date().toISOString() },
    { code: 'LEAD_VIEW', name: 'View Leads', category: 'CRM Leads', description: 'View prospective sales inquiries and leads pipeline', created_at: new Date().toISOString() },
    { code: 'LEAD_CREATE', name: 'Create Leads', category: 'CRM Leads', description: 'Generate new leads from campaigns or inquiries', created_at: new Date().toISOString() },
    { code: 'LEAD_EDIT', name: 'Edit Leads', category: 'CRM Leads', description: 'Modify lead information and qualification status', created_at: new Date().toISOString() },
    { code: 'LEAD_DELETE', name: 'Delete Leads', category: 'CRM Leads', description: 'Remove or archive disqualified leads', created_at: new Date().toISOString() },
    { code: 'LEAD_ASSIGN', name: 'Assign Leads', category: 'CRM Leads', description: 'Delegate leads to sales reps or account managers', created_at: new Date().toISOString() },
    { code: 'LEAD_REASSIGN', name: 'Reassign Leads', category: 'CRM Leads', description: 'Reassign leads across team members', created_at: new Date().toISOString() },
    { code: 'LEAD_FOLLOWUP_CREATE', name: 'Schedule Lead Follow-up', category: 'CRM Leads', description: 'Create reminder/call logs for prospective leads', created_at: new Date().toISOString() },
    { code: 'LEAD_FOLLOWUP_COMPLETE', name: 'Complete Lead Follow-up', category: 'CRM Leads', description: 'Mark follow-up notes and outcomes as completed', created_at: new Date().toISOString() },
    { code: 'LEAD_CONVERT', name: 'Convert Leads', category: 'CRM Leads', description: 'Convert qualified lead into customer and service booking', created_at: new Date().toISOString() },
    { code: 'LEAD_WON', name: 'Mark Lead Won', category: 'CRM Leads', description: 'Mark deal as successfully closed and won', created_at: new Date().toISOString() },
    { code: 'LEAD_LOST', name: 'Mark Lead Lost', category: 'CRM Leads', description: 'Mark deal as closed lost with reason', created_at: new Date().toISOString() },
    { code: 'TECHNICIAN_VIEW', name: 'View Technicians', category: 'Fleet', description: 'Access technician fleet directory', created_at: new Date().toISOString() },
    { code: 'TECHNICIAN_CREATE', name: 'Create Technicians', category: 'Fleet', description: 'Onboard new service engineers', created_at: new Date().toISOString() },
    { code: 'TECHNICIAN_UPDATE', name: 'Update Technicians', category: 'Fleet', description: 'Edit technician skills and areas', created_at: new Date().toISOString() },
    { code: 'TECHNICIAN_ASSIGN', name: 'Dispatch Fleet', category: 'Fleet', description: 'Dispatch technicians across city zones', created_at: new Date().toISOString() },
    { code: 'TECHNICIAN_MANAGE', name: 'Manage Fleet', category: 'Fleet', description: 'Fleet allocation and tier management', created_at: new Date().toISOString() },
    { code: 'SALES_VIEW', name: 'View Sales', category: 'Sales', description: 'Inspect sales pipeline and team metrics', created_at: new Date().toISOString() },
    { code: 'SALES_CREATE', name: 'Create Sales Personnel', category: 'Sales', description: 'Add new sales team specialists', created_at: new Date().toISOString() },
    { code: 'SALES_UPDATE', name: 'Update Sales Personnel', category: 'Sales', description: 'Update targets and commissions', created_at: new Date().toISOString() },
    { code: 'SALES_TEAM_VIEW', name: 'View Sales Team', category: 'Sales', description: 'View sales representatives and hierarchy', created_at: new Date().toISOString() },
    { code: 'SALES_TEAM_MANAGE', name: 'Manage Sales Team', category: 'Sales', description: 'Manage sales representatives and quotas', created_at: new Date().toISOString() },
    { code: 'MANAGERS_VIEW', name: 'View Operations Managers', category: 'Operations', description: 'View regional operations directors', created_at: new Date().toISOString() },
    { code: 'MANAGER_VIEW', name: 'View Managers', category: 'Operations', description: 'View regional operations directors', created_at: new Date().toISOString() },
    { code: 'FINANCE_VIEW', name: 'View Finance', category: 'Finance', description: 'View fiscal accounts and audits', created_at: new Date().toISOString() },
    { code: 'PAYMENT_VIEW', name: 'View Payments', category: 'Finance', description: 'View transaction logs and gateways', created_at: new Date().toISOString() },
    { code: 'PAYMENT_CREATE', name: 'Create Payments', category: 'Finance', description: 'Record customer payment transactions', created_at: new Date().toISOString() },
    { code: 'PAYMENT_COLLECT', name: 'Collect Payments', category: 'Finance & Sales', description: 'Collect on-site or online booking payments', created_at: new Date().toISOString() },
    { code: 'PAYMENT_VERIFY', name: 'Verify Payments', category: 'Finance', description: 'Verify transaction bank reference and clearance', created_at: new Date().toISOString() },
    { code: 'PAYMENT_RECONCILE', name: 'Reconcile Payments', category: 'Finance', description: 'Reconcile gateway settlement batches', created_at: new Date().toISOString() },
    { code: 'PAYMENT_REFUND_REQUEST', name: 'Request Refund', category: 'Finance', description: 'Submit customer refund authorization requests', created_at: new Date().toISOString() },
    { code: 'PAYMENT_REFUND_APPROVE', name: 'Approve Refunds', category: 'Finance', description: 'Approve and execute financial refunds', created_at: new Date().toISOString() },
    { code: 'PAYMENT_EDIT', name: 'Edit Payments', category: 'Finance', description: 'Correct payment accounting details', created_at: new Date().toISOString() },
    { code: 'PAYMENT_MANAGE', name: 'Manage Payments', category: 'Finance', description: 'Initiate refunds and adjust charges', created_at: new Date().toISOString() },
    { code: 'PAYMENT_REFUND', name: 'Execute Refunds', category: 'Finance', description: 'Execute refund payments to customers', created_at: new Date().toISOString() },
    { code: 'INVOICE_VIEW', name: 'View Invoices', category: 'Finance', description: 'View GST compliant customer invoices', created_at: new Date().toISOString() },
    { code: 'INVOICE_CREATE', name: 'Generate Invoices', category: 'Finance', description: 'Generate tax invoices for completed bookings', created_at: new Date().toISOString() },
    { code: 'INVOICE_EDIT', name: 'Edit Invoices', category: 'Finance', description: 'Amend invoice items and billing info', created_at: new Date().toISOString() },
    { code: 'INVOICE_VOID', name: 'Void Invoices', category: 'Finance', description: 'Void or cancel generated invoices', created_at: new Date().toISOString() },
    { code: 'INVOICE_MANAGE', name: 'Manage Invoices', category: 'Finance', description: 'Generate credit notes and revisions', created_at: new Date().toISOString() },
    { code: 'COMMISSION_VIEW', name: 'View Commission', category: 'Finance', description: 'View technician/sales commission rates', created_at: new Date().toISOString() },
    { code: 'COMMISSION_UPDATE', name: 'Update Commission', category: 'Finance', description: 'Update commission percentage rates', created_at: new Date().toISOString() },
    { code: 'COMMISSION_MANAGE', name: 'Manage Commission', category: 'Finance', description: 'Modify and approve commission payouts', created_at: new Date().toISOString() },
    { code: 'PROMOTION_VIEW', name: 'View Promotions', category: 'Marketing', description: 'View marketing coupons and campaigns', created_at: new Date().toISOString() },
    { code: 'PROMOTION_CREATE', name: 'Create Promotions', category: 'Marketing', description: 'Launch new discount vouchers and seasonal sales', created_at: new Date().toISOString() },
    { code: 'PROMOTION_EDIT', name: 'Edit Promotions', category: 'Marketing', description: 'Adjust campaign validity and discount tiers', created_at: new Date().toISOString() },
    { code: 'PROMOTION_DELETE', name: 'Delete Promotions', category: 'Marketing', description: 'Decommission marketing promotions', created_at: new Date().toISOString() },
    { code: 'PROMOTION_ACTIVATE', name: 'Activate Promotions', category: 'Marketing', description: 'Turn promotional campaign active on platform', created_at: new Date().toISOString() },
    { code: 'SERVICE_VIEW', name: 'View Services', category: 'Catalog', description: 'Browse service rates and scope', created_at: new Date().toISOString() },
    { code: 'SERVICE_CREATE', name: 'Create Services', category: 'Catalog', description: 'Publish new services and categories', created_at: new Date().toISOString() },
    { code: 'SERVICE_UPDATE', name: 'Update Services', category: 'Catalog', description: 'Edit service pricing and inclusions', created_at: new Date().toISOString() },
    { code: 'SERVICE_DELETE', name: 'Delete Services', category: 'Catalog', description: 'Archive obsolete service items', created_at: new Date().toISOString() },
    { code: 'LOCATION_VIEW', name: 'View Locations', category: 'Network', description: 'Browse states, hubs and active pincodes', created_at: new Date().toISOString() },
    { code: 'LOCATION_MANAGE', name: 'Manage Locations', category: 'Network', description: 'Add or expand city service hubs', created_at: new Date().toISOString() },
    { code: 'AMC_VIEW', name: 'View AMCs', category: 'Contracts', description: 'Access Annual Maintenance Contracts', created_at: new Date().toISOString() },
    { code: 'AMC_CREATE', name: 'Create AMCs', category: 'Contracts', description: 'Create AMC contracts for clients', created_at: new Date().toISOString() },
    { code: 'AMC_EDIT', name: 'Edit AMCs', category: 'Contracts', description: 'Modify terms of AMC contracts', created_at: new Date().toISOString() },
    { code: 'AMC_MANAGE', name: 'Manage AMCs', category: 'Contracts', description: 'Draft, renew, and schedule AMC visits', created_at: new Date().toISOString() },
    { code: 'REPORT_VIEW', name: 'View Reports', category: 'Analytics', description: 'Access revenue and operational analytics', created_at: new Date().toISOString() },
    { code: 'REPORT_EXPORT', name: 'Export Reports', category: 'Analytics', description: 'Export operational data to CSV/Excel', created_at: new Date().toISOString() },
    { code: 'SUPPORT_VIEW', name: 'View Support', category: 'Support', description: 'Access customer helpdesk tickets', created_at: new Date().toISOString() },
    { code: 'SUPPORT_RESOLVE', name: 'Resolve Tickets', category: 'Support', description: 'Resolve and conclude customer complaints', created_at: new Date().toISOString() },
    { code: 'SUPPORT_MANAGE', name: 'Manage Support', category: 'Support', description: 'Resolve and escalate tickets', created_at: new Date().toISOString() },
    { code: 'REVIEW_VIEW', name: 'View Reviews', category: 'Feedback', description: 'Monitor customer ratings and complaints', created_at: new Date().toISOString() },
    { code: 'NOTIFICATION_VIEW', name: 'View Notifications', category: 'Communications', description: 'View system notices and alerts', created_at: new Date().toISOString() },
    { code: 'NOTIFICATION_MANAGE', name: 'Manage Notifications', category: 'Communications', description: 'Dispatch bulk SMS and WhatsApp alerts', created_at: new Date().toISOString() },
    { code: 'SETTINGS_VIEW', name: 'View Settings', category: 'Settings', description: 'View system configuration', created_at: new Date().toISOString() },
    { code: 'SETTINGS_UPDATE', name: 'Update Settings', category: 'Settings', description: 'Update system configuration and rules', created_at: new Date().toISOString() },
    { code: 'SETTINGS_EDIT', name: 'Edit Settings', category: 'Settings', description: 'Modify application configuration parameters', created_at: new Date().toISOString() },
    { code: 'SETTINGS_MANAGE', name: 'Manage Settings', category: 'Settings', description: 'Full settings governance', created_at: new Date().toISOString() },
    { code: 'AUDIT_VIEW', name: 'View Audit Logs', category: 'Security & Audit', description: 'Access compliance security trail and user action history', created_at: new Date().toISOString() },
    { code: 'AUDIT_LOG_VIEW', name: 'View Audit Log History', category: 'Security & Audit', description: 'Inspect full immutable audit trail records', created_at: new Date().toISOString() },
    { code: 'INTEGRATION_VIEW', name: 'View Integrations', category: 'Integrations', description: 'View third-party API connections', created_at: new Date().toISOString() },
    { code: 'INTEGRATION_MANAGE', name: 'Manage Integrations', category: 'Integrations', description: 'Configure webhooks and API credentials', created_at: new Date().toISOString() },
    // Super Admin Service Master Permissions
    { code: 'SERVICE_EDIT', name: 'Edit Services', category: 'Catalog', description: 'Edit service master parameters', created_at: new Date().toISOString() },
    { code: 'SERVICE_ACTIVATE', name: 'Activate Services', category: 'Catalog', description: 'Activate service in public catalog', created_at: new Date().toISOString() },
    { code: 'SERVICE_DEACTIVATE', name: 'Deactivate Services', category: 'Catalog', description: 'Deactivate service from catalog', created_at: new Date().toISOString() },
    { code: 'SERVICE_PRICE_EDIT', name: 'Edit Service Prices', category: 'Catalog', description: 'Modify pricing tiers and base charges', created_at: new Date().toISOString() },
    { code: 'SERVICE_MANAGE', name: 'Manage Services Catalog', category: 'Catalog', description: 'Full service catalog administration', created_at: new Date().toISOString() },
    { code: 'SERVICE_CATEGORY_MANAGE', name: 'Manage Service Categories', category: 'Catalog', description: 'Configure taxonomy and service categories', created_at: new Date().toISOString() },
    { code: 'CATEGORY_VIEW', name: 'View Service Categories', category: 'Catalog', description: 'Browse service taxonomy and categories', created_at: new Date().toISOString() },
    { code: 'CATEGORY_MANAGE', name: 'Manage Service Categories Master', category: 'Catalog', description: 'Create and update service categories', created_at: new Date().toISOString() },
    // AMC Plan Master Permissions
    { code: 'AMC_PLAN_CREATE', name: 'Create AMC Plans', category: 'Contracts', description: 'Create new annual maintenance packages', created_at: new Date().toISOString() },
    { code: 'AMC_PLAN_VIEW', name: 'View AMC Plans', category: 'Contracts', description: 'View AMC plan configuration', created_at: new Date().toISOString() },
    { code: 'AMC_PLAN_EDIT', name: 'Edit AMC Plans', category: 'Contracts', description: 'Edit AMC plan pricing, benefits and coverage', created_at: new Date().toISOString() },
    { code: 'AMC_PLAN_DELETE', name: 'Delete AMC Plans', category: 'Contracts', description: 'Archive obsolete AMC plans', created_at: new Date().toISOString() },
    { code: 'AMC_PLAN_ACTIVATE', name: 'Activate AMC Plans', category: 'Contracts', description: 'Publish AMC plan to consumers', created_at: new Date().toISOString() },
    { code: 'AMC_PLAN_DEACTIVATE', name: 'Deactivate AMC Plans', category: 'Contracts', description: 'Delist AMC plan from platform', created_at: new Date().toISOString() },
    { code: 'AMC_PLAN_PRICE_EDIT', name: 'Edit AMC Plan Price', category: 'Contracts', description: 'Modify base pricing and frequency discounts', created_at: new Date().toISOString() },
    { code: 'AMC_PLAN_BENEFIT_EDIT', name: 'Edit AMC Plan Benefits', category: 'Contracts', description: 'Configure covered visits and discount percentages', created_at: new Date().toISOString() },
    // Partner & Commission Permissions
    { code: 'PARTNER_CREATE', name: 'Create Channel Partners', category: 'Partners', description: 'Onboard channel and referral partners', created_at: new Date().toISOString() },
    { code: 'PARTNER_VIEW', name: 'View Channel Partners', category: 'Partners', description: 'View partner directories and compliance details', created_at: new Date().toISOString() },
    { code: 'PARTNER_EDIT', name: 'Edit Channel Partners', category: 'Partners', description: 'Modify partner accounts, terms and contacts', created_at: new Date().toISOString() },
    { code: 'PARTNER_DELETE', name: 'Delete Channel Partners', category: 'Partners', description: 'De-register or archive partner accounts', created_at: new Date().toISOString() },
    { code: 'PARTNER_ACTIVATE', name: 'Activate Channel Partners', category: 'Partners', description: 'Activate partner referral status', created_at: new Date().toISOString() },
    { code: 'PARTNER_DEACTIVATE', name: 'Deactivate Channel Partners', category: 'Partners', description: 'Suspend partner referral rights', created_at: new Date().toISOString() },
    { code: 'PARTNER_COMMISSION_VIEW', name: 'View Partner Commissions', category: 'Partners', description: 'Inspect commission accruals and ledgers', created_at: new Date().toISOString() },
    { code: 'PARTNER_COMMISSION_CREATE', name: 'Create Commission Rules', category: 'Partners', description: 'Set up partner commission models', created_at: new Date().toISOString() },
    { code: 'PARTNER_COMMISSION_EDIT', name: 'Edit Commission Rules', category: 'Partners', description: 'Modify commission rates and effective dates', created_at: new Date().toISOString() },
    { code: 'PARTNER_COMMISSION_DELETE', name: 'Delete Commission Rules', category: 'Partners', description: 'Remove inactive commission rules', created_at: new Date().toISOString() },
    { code: 'PARTNER_COMMISSION_APPROVE', name: 'Approve Commission Payouts', category: 'Partners', description: 'Authorize monthly partner commission disbursement', created_at: new Date().toISOString() },
    { code: 'PARTNER_COMMISSION_RECALCULATE', name: 'Recalculate Commissions', category: 'Partners', description: 'Re-run retro commission computations', created_at: new Date().toISOString() },
    // HR Module Permissions
    { code: 'HR_EMPLOYEE_CREATE', name: 'Create Employees', category: 'Human Resources', description: 'Onboard on-roll personnel', created_at: new Date().toISOString() },
    { code: 'HR_EMPLOYEE_VIEW', name: 'View Employees', category: 'Human Resources', description: 'Access staff directory and records', created_at: new Date().toISOString() },
    { code: 'HR_EMPLOYEE_EDIT', name: 'Edit Employees', category: 'Human Resources', description: 'Update employee job details and profiles', created_at: new Date().toISOString() },
    { code: 'HR_EMPLOYEE_DELETE', name: 'Delete Employees', category: 'Human Resources', description: 'Archive staff member accounts', created_at: new Date().toISOString() },
    { code: 'HR_EMPLOYEE_ACTIVATE', name: 'Activate Employees', category: 'Human Resources', description: 'Activate employee accounts', created_at: new Date().toISOString() },
    { code: 'HR_EMPLOYEE_DEACTIVATE', name: 'Deactivate Employees', category: 'Human Resources', description: 'Suspend or put employee on sabbatical', created_at: new Date().toISOString() },
    { code: 'HR_DEPARTMENT_MANAGE', name: 'Manage Departments', category: 'Human Resources', description: 'Configure organizational units and headcounts', created_at: new Date().toISOString() },
    { code: 'HR_DESIGNATION_MANAGE', name: 'Manage Designations', category: 'Human Resources', description: 'Set job titles and hierarchical levels', created_at: new Date().toISOString() },
    { code: 'HR_SHIFT_MANAGE', name: 'Manage Shifts', category: 'Human Resources', description: 'Configure working shifts and grace periods', created_at: new Date().toISOString() },
    { code: 'HR_DOCUMENT_VIEW', name: 'View HR Documents', category: 'Human Resources', description: 'Access contracts and statutory employee files', created_at: new Date().toISOString() },
    { code: 'HR_DOCUMENT_UPLOAD', name: 'Upload HR Documents', category: 'Human Resources', description: 'Upload verified Aadhaar, PAN and appointment letters', created_at: new Date().toISOString() },
    { code: 'HR_DOCUMENT_DELETE', name: 'Delete HR Documents', category: 'Human Resources', description: 'Remove superseded personnel documents', created_at: new Date().toISOString() },
    { code: 'HR_ATTENDANCE_VIEW', name: 'View Attendance', category: 'Human Resources', description: 'Monitor daily punches and biometric check-ins', created_at: new Date().toISOString() },
    { code: 'HR_ATTENDANCE_EDIT', name: 'Edit Attendance', category: 'Human Resources', description: 'Rectify punch logs or mark attendance regularizations', created_at: new Date().toISOString() },
    { code: 'HR_ATTENDANCE_APPROVE', name: 'Approve Attendance', category: 'Human Resources', description: 'Approve regularization and overtime requests', created_at: new Date().toISOString() },
    { code: 'HR_LEAVE_VIEW', name: 'View Leave Requests', category: 'Human Resources', description: 'View staff leave records and balances', created_at: new Date().toISOString() },
    { code: 'HR_LEAVE_CREATE', name: 'Apply Leave for Staff', category: 'Human Resources', description: 'Submit leave request on behalf of employee', created_at: new Date().toISOString() },
    { code: 'HR_LEAVE_EDIT', name: 'Edit Leave Requests', category: 'Human Resources', description: 'Modify leave types or dates', created_at: new Date().toISOString() },
    { code: 'HR_LEAVE_APPROVE', name: 'Approve Leaves', category: 'Human Resources', description: 'Sanction requested employee time off', created_at: new Date().toISOString() },
    { code: 'HR_LEAVE_REJECT', name: 'Reject Leaves', category: 'Human Resources', description: 'Decline employee leave requests', created_at: new Date().toISOString() },
    { code: 'HR_HOLIDAY_MANAGE', name: 'Manage Holidays', category: 'Human Resources', description: 'Publish corporate and optional holiday calendars', created_at: new Date().toISOString() },
    { code: 'HR_ASSET_MANAGE', name: 'Manage Assets', category: 'Human Resources', description: 'Track hardware, tools and uniform allocations', created_at: new Date().toISOString() },
    { code: 'HR_PERFORMANCE_VIEW', name: 'View Performance', category: 'Human Resources', description: 'Access KPI reviews and appraisal ratings', created_at: new Date().toISOString() },
    { code: 'HR_PERFORMANCE_CREATE', name: 'Create Performance Appraisal', category: 'Human Resources', description: 'Initiate staff appraisal cycle', created_at: new Date().toISOString() },
    { code: 'HR_PERFORMANCE_EDIT', name: 'Edit Performance Appraisal', category: 'Human Resources', description: 'Update ratings and manager feedback', created_at: new Date().toISOString() },
    { code: 'HR_RECRUITMENT_VIEW', name: 'View Recruitment', category: 'Human Resources', description: 'View job openings and candidate pipeline', created_at: new Date().toISOString() },
    { code: 'HR_RECRUITMENT_CREATE', name: 'Create Job Openings', category: 'Human Resources', description: 'Post new talent requisitions', created_at: new Date().toISOString() },
    { code: 'HR_RECRUITMENT_EDIT', name: 'Edit Job Openings', category: 'Human Resources', description: 'Manage candidate interview stages and offers', created_at: new Date().toISOString() },
    { code: 'HR_EXIT_MANAGE', name: 'Manage Employee Exits', category: 'Human Resources', description: 'Coordinate resignations, clearances, and full-and-final settlement', created_at: new Date().toISOString() },
    // Payroll Module Permissions
    { code: 'PAYROLL_VIEW', name: 'View Payroll', category: 'Payroll', description: 'Access monthly payroll registers and cost reports', created_at: new Date().toISOString() },
    { code: 'PAYROLL_CREATE', name: 'Create Payroll Run', category: 'Payroll', description: 'Draft new monthly wage calculations', created_at: new Date().toISOString() },
    { code: 'PAYROLL_EDIT', name: 'Edit Payroll Run', category: 'Payroll', description: 'Adjust salary line items or working days', created_at: new Date().toISOString() },
    { code: 'PAYROLL_PROCESS', name: 'Process Payroll', category: 'Payroll', description: 'Compute gross, deductions, and net payouts', created_at: new Date().toISOString() },
    { code: 'PAYROLL_APPROVE', name: 'Approve Payroll', category: 'Payroll', description: 'Sign off payroll batch for bank disbursement', created_at: new Date().toISOString() },
    { code: 'PAYROLL_FINALIZE', name: 'Finalize Payroll', category: 'Payroll', description: 'Lock payroll register and disburse payslips', created_at: new Date().toISOString() },
    { code: 'PAYROLL_REOPEN', name: 'Reopen Payroll', category: 'Payroll', description: 'Unlock payroll batch for corrections', created_at: new Date().toISOString() },
    { code: 'PAYROLL_SALARY_STRUCTURE_VIEW', name: 'View Salary Structures', category: 'Payroll', description: 'View CTC breakdown models', created_at: new Date().toISOString() },
    { code: 'PAYROLL_SALARY_STRUCTURE_CREATE', name: 'Create Salary Structure', category: 'Payroll', description: 'Define compensation grades and slabs', created_at: new Date().toISOString() },
    { code: 'PAYROLL_SALARY_STRUCTURE_EDIT', name: 'Edit Salary Structure', category: 'Payroll', description: 'Update allowances, HRA, and statutory components', created_at: new Date().toISOString() },
    { code: 'PAYROLL_DEDUCTIONS_VIEW', name: 'View Deductions', category: 'Payroll', description: 'View tax, PF, ESI, and advance deductions', created_at: new Date().toISOString() },
    { code: 'PAYROLL_DEDUCTIONS_EDIT', name: 'Edit Deductions', category: 'Payroll', description: 'Adjust professional tax or custom payroll deductions', created_at: new Date().toISOString() },
    { code: 'PAYROLL_BONUS_VIEW', name: 'View Bonuses', category: 'Payroll', description: 'Inspect festival and performance incentive awards', created_at: new Date().toISOString() },
    { code: 'PAYROLL_BONUS_CREATE', name: 'Create Bonuses', category: 'Payroll', description: 'Allocate bonuses to eligible employees', created_at: new Date().toISOString() },
    { code: 'PAYROLL_BONUS_EDIT', name: 'Edit Bonuses', category: 'Payroll', description: 'Update incentive amounts and payout cycles', created_at: new Date().toISOString() },
    { code: 'PAYROLL_LOAN_VIEW', name: 'View Employee Loans', category: 'Payroll', description: 'Monitor staff advance and EMI deductions', created_at: new Date().toISOString() },
    { code: 'PAYROLL_LOAN_CREATE', name: 'Grant Employee Loans', category: 'Payroll', description: 'Sanction corporate emergency loans', created_at: new Date().toISOString() },
    { code: 'PAYROLL_LOAN_EDIT', name: 'Edit Employee Loans', category: 'Payroll', description: 'Reschedule loan installments', created_at: new Date().toISOString() },
    { code: 'PAYROLL_ADVANCE_VIEW', name: 'View Salary Advances', category: 'Payroll', description: 'Review mid-month advance salary requests', created_at: new Date().toISOString() },
    { code: 'PAYROLL_ADVANCE_CREATE', name: 'Grant Salary Advance', category: 'Payroll', description: 'Authorize advance disbursements', created_at: new Date().toISOString() },
    { code: 'PAYROLL_ADVANCE_EDIT', name: 'Edit Salary Advance', category: 'Payroll', description: 'Modify advance recovery schedules', created_at: new Date().toISOString() },
    { code: 'PAYSLIP_VIEW', name: 'View Payslips', category: 'Payroll', description: 'Access organization-wide digital payslips', created_at: new Date().toISOString() },
    { code: 'PAYSLIP_GENERATE', name: 'Generate Payslips', category: 'Payroll', description: 'Generate individual employee pay vouchers', created_at: new Date().toISOString() },
    { code: 'PAYSLIP_DOWNLOAD', name: 'Download Payslips', category: 'Payroll', description: 'Download PDF formatted wage statements', created_at: new Date().toISOString() },
    { code: 'PAYROLL_REPORT_VIEW', name: 'View Payroll Reports', category: 'Payroll', description: 'Access statutory liability and bank transfer files', created_at: new Date().toISOString() },
    { code: 'PAYROLL_REPORT_EXPORT', name: 'Export Payroll Reports', category: 'Payroll', description: 'Export NEFT/RTGS batch format and EPF return CSV', created_at: new Date().toISOString() },
    // Employee Self-Service Permissions
    { code: 'EMPLOYEE_PROFILE_VIEW', name: 'View Own Profile', category: 'Self Service', description: 'Employee view of own HR profile and job details', created_at: new Date().toISOString() },
    { code: 'EMPLOYEE_ATTENDANCE_VIEW', name: 'View Own Attendance', category: 'Self Service', description: 'Employee check-in history and punch logs', created_at: new Date().toISOString() },
    { code: 'EMPLOYEE_LEAVE_VIEW', name: 'View Own Leaves', category: 'Self Service', description: 'Employee view of personal leave balance and status', created_at: new Date().toISOString() },
    { code: 'EMPLOYEE_LEAVE_APPLY', name: 'Apply For Leave', category: 'Self Service', description: 'Submit leave request through self-service portal', created_at: new Date().toISOString() },
    { code: 'EMPLOYEE_PAYSLIP_VIEW', name: 'View Own Payslip', category: 'Self Service', description: 'Employee access to confidential personal payslips', created_at: new Date().toISOString() },
    { code: 'EMPLOYEE_PAYSLIP_DOWNLOAD', name: 'Download Own Payslip', category: 'Self Service', description: 'Download confidential PDF payslips', created_at: new Date().toISOString() },
    { code: 'EMPLOYEE_DOCUMENT_VIEW', name: 'View Own Documents', category: 'Self Service', description: 'Access own letters and verified ID proofs', created_at: new Date().toISOString() },
  ];

  public rolePermissions: { role_code: string; permission_code: string }[] = [];
  public userPermissions: { user_id: string; permission_code: string }[] = [];

  public users: UserRecord[] = [
    {
      id: 'usr-super-1',
      public_id: 'VXUSR-000001',
      name: 'Vikramaditya Sengupta',
      email: 'admin@vertex.demo',
      phone: '+91 99000 00001',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      profile_image: 'VS',
      city_id: 2,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-mgr-1',
      public_id: 'VXUSR-000002',
      name: 'Pooja Kashyap',
      email: 'manager@vertex.demo',
      phone: '+91 99000 00002',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'MANAGER',
      status: 'ACTIVE',
      profile_image: 'PK',
      city_id: 1,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-sales-1',
      public_id: 'VXUSR-000003',
      name: 'Karan Mehra',
      email: 'sales@vertex.demo',
      phone: '+91 99000 00003',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'SALES',
      status: 'ACTIVE',
      profile_image: 'KM',
      city_id: 4,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-fin-1',
      public_id: 'VXUSR-000006',
      name: 'Suresh Narang',
      email: 'finance@vertex.demo',
      phone: '+91 99000 00004',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'FINANCE',
      status: 'ACTIVE',
      profile_image: 'SN',
      city_id: 5,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'tech-1',
      public_id: 'VXUSR-000008',
      name: 'Raj Kumar',
      email: 'raj.tech@vertexservices.in',
      phone: '9999990001',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      profile_image: 'RT',
      city_id: 2,
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'tech-2',
      public_id: 'VXUSR-000009',
      name: 'Amit Technician',
      email: 'amit.tech@vertexservices.in',
      phone: '9999990011',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      profile_image: 'AT',
      city_id: 1,
      created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'tech-3',
      public_id: 'VXUSR-000010',
      name: 'Vikas Technician',
      email: 'vikas.tech@vertexservices.in',
      phone: '9999990012',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      profile_image: 'VT',
      city_id: 3,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'cust-1',
      public_id: 'VXUSR-000013',
      name: 'Rahul Sharma',
      email: 'customer@vertex.demo',
      phone: '9999990002',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      profile_image: 'RS',
      city_id: 2,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'cust-2',
      public_id: 'VXUSR-000014',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '9999990005',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      profile_image: 'PS',
      city_id: 2,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-admin-1',
      public_id: 'VXUSR-000015',
      name: 'Aditya Vardhan',
      email: 'admin.ops@vertex.demo',
      phone: '+91 99000 00015',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'ADMIN',
      status: 'ACTIVE',
      profile_image: 'AV',
      city_id: 1,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-salesteam-1',
      public_id: 'VXUSR-000016',
      name: 'Rohit Verma',
      email: 'salesteam@vertex.demo',
      phone: '+91 99000 00016',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'SALES_TEAM',
      status: 'ACTIVE',
      profile_image: 'RV',
      city_id: 2,
      created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-mkt-1',
      public_id: 'VXUSR-000017',
      name: 'Meera Sen',
      email: 'marketing@vertex.demo',
      phone: '+91 99000 00017',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'MARKETING',
      status: 'ACTIVE',
      profile_image: 'MS',
      city_id: 4,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-ops-1',
      public_id: 'VXUSR-000018',
      name: 'Gaurav Gill',
      email: 'operations@vertex.demo',
      phone: '+91 99000 00018',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'OPERATIONS',
      status: 'ACTIVE',
      profile_image: 'GG',
      city_id: 2,
      created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-sup-1',
      public_id: 'VXUSR-000019',
      name: 'Tanvi Saxena',
      email: 'support@vertex.demo',
      phone: '+91 99000 00019',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'SUPPORT',
      status: 'ACTIVE',
      profile_image: 'TS',
      city_id: 5,
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-hr-1',
      public_id: 'VXUSR-000020',
      name: 'Ananya Roy',
      email: 'hr@vertex.demo',
      phone: '+91 99000 00020',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'HR',
      status: 'ACTIVE',
      profile_image: 'AR',
      city_id: 1,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-pay-1',
      public_id: 'VXUSR-000021',
      name: 'Rohan Saxena',
      email: 'payroll@vertex.demo',
      phone: '+91 99000 00021',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'PAYROLL',
      status: 'ACTIVE',
      profile_image: 'RS',
      city_id: 2,
      created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-emp-1',
      public_id: 'VXUSR-000022',
      name: 'Vikram Malhotra',
      email: 'employee@vertex.demo',
      phone: '+91 99000 00022',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      profile_image: 'VM',
      city_id: 2,
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'usr-partner-1',
      public_id: 'VXUSR-000023',
      name: 'Vikas Agarwal',
      email: 'partner@vertex.demo',
      phone: '+91 99000 00023',
      password_hash: '$2a$10$eE0mQeE0mQeE0mQeE0mQe.4wFkQeE0mQeE0mQeE0mQeE0mQeE0mQe',
      role: 'PARTNER',
      status: 'ACTIVE',
      profile_image: 'VA',
      city_id: 2,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      deleted_at: null,
    },
  ];

  public serviceCategories: ServiceCategoryRecord[] = [...INITIAL_SERVICE_CATEGORIES];
  public services: ServiceRecord[] = [...INITIAL_SERVICES];
  public amcPlans: AmcPlanRecord[] = [...INITIAL_AMC_PLANS];
  public partners: PartnerRecord[] = [...INITIAL_PARTNERS];
  public commissionRules: CommissionRuleRecord[] = [...INITIAL_COMMISSION_RULES];
  public partnerCommissions: PartnerCommissionRecord[] = [...INITIAL_PARTNER_COMMISSIONS];
  public departments: DepartmentRecord[] = [...INITIAL_DEPARTMENTS];
  public designations: DesignationRecord[] = [...INITIAL_DESIGNATIONS];
  public shifts: ShiftRecord[] = [...INITIAL_SHIFTS];
  public employees: EmployeeRecord[] = [...INITIAL_EMPLOYEES];
  public employeeAttendance: EmployeeAttendanceRecord[] = [...INITIAL_EMPLOYEE_ATTENDANCE];
  public leaveTypes: LeaveTypeRecord[] = [...INITIAL_LEAVE_TYPES];
  public leaveBalances: LeaveBalanceRecord[] = [...INITIAL_LEAVE_BALANCES];
  public leaveRequests: LeaveRequestRecord[] = [...INITIAL_LEAVE_REQUESTS];
  public holidays: HolidayRecord[] = [...INITIAL_HOLIDAYS];
  public employeeDocuments: EmployeeDocumentRecord[] = [...INITIAL_EMPLOYEE_DOCUMENTS];
  public recruitmentJobs: RecruitmentJobRecord[] = [...INITIAL_RECRUITMENT_JOBS];
  public candidates: CandidateRecord[] = [...INITIAL_CANDIDATES];
  public employeeExits: EmployeeExitRecord[] = [...INITIAL_EXITS];
  public salaryStructures: SalaryStructureRecord[] = [...INITIAL_SALARY_STRUCTURES];
  public payrollRuns: PayrollRunRecord[] = [...INITIAL_PAYROLL_RUNS];
  public payslips: PayslipRecord[] = [...INITIAL_PAYSLIPS];

  public leads: LeadRecord[] = [
    {
      id: 'lead-001',
      public_id: 'VXLD-000001',
      customer_name: 'Ananya Roy',
      email: 'ananya.roy@delhicorp.com',
      phone: '+91 98111 22334',
      service_interest: 'Commercial HVAC Annual Contract',
      requirement_details: 'Facility with 24 cassette AC units requiring bi-monthly deep foam preventive maintenance.',
      estimated_value: 84000,
      assigned_to: 'usr-sales-1',
      assigned_to_name: 'Karan Mehra',
      created_by: 'usr-mkt-1',
      created_by_name: 'Meera Sen',
      stage: 'QUALIFIED',
      status: 'ACTIVE',
      city_id: 1,
      city_name: 'Delhi',
      followups: [
        {
          id: 'fol-001',
          lead_id: 'lead-001',
          scheduled_date: '2026-09-10',
          notes: 'Present customized AMC proposal to facility operations team.',
          outcome: null,
          completed: false,
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'lead-002',
      public_id: 'VXLD-000002',
      customer_name: 'Rajesh Singhania',
      email: 'rajesh.singhania@apextech.in',
      phone: '+91 98222 33445',
      service_interest: 'Multi-Floor Water Purifier & RO Setup',
      requirement_details: 'Replacement of industrial sediment membranes across 3 tower cafeterias.',
      estimated_value: 36000,
      assigned_to: 'usr-salesteam-1',
      assigned_to_name: 'Rohit Verma',
      created_by: 'usr-sales-1',
      created_by_name: 'Karan Mehra',
      stage: 'SITE_VISIT_SCHEDULED',
      status: 'ACTIVE',
      city_id: 2,
      city_name: 'Gurgaon',
      followups: [
        {
          id: 'fol-002',
          lead_id: 'lead-002',
          scheduled_date: '2026-09-08',
          notes: 'Lead engineer visit for water hardness TDS diagnostics.',
          outcome: 'TDS tested at 850ppm. Pre-filters recommended.',
          completed: true,
          completed_by: 'usr-salesteam-1',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: 'lead-003',
      public_id: 'VXLD-000003',
      customer_name: 'Deepak Chawla',
      email: 'deepak.c@chawlaenterprises.com',
      phone: '+91 98333 44556',
      service_interest: 'Modular Kitchen Deep Appliance Sanitization',
      requirement_details: 'Full deep cleanse of 4 built-in chimneys and microwave ovens.',
      estimated_value: 12500,
      assigned_to: null,
      assigned_to_name: null,
      created_by: 'usr-mkt-1',
      created_by_name: 'Meera Sen',
      stage: 'NEW',
      status: 'ACTIVE',
      city_id: 2,
      city_name: 'Gurgaon',
      followups: [],
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
  ];

  public payments: PaymentRecord[] = [
    {
      id: 'pay-001',
      public_id: 'VXPY-000001',
      booking_id: 'VTX-84920',
      customer_id: 'cust-1',
      customer_name: 'Rahul Sharma',
      customer_phone: '+91 98101 23456',
      amount: 499,
      currency: 'INR',
      payment_method: 'UPI',
      payment_reference: 'UPI/20260907/984129841',
      status: 'VERIFIED',
      collected_by: 'usr-sales-1',
      collected_by_name: 'Karan Mehra',
      collected_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      notes: 'On-site digital payment collected upon AC Jet foam completion.',
      receipt_number: 'RCP-2026-00142',
      verified_by: 'usr-fin-1',
      verified_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      refund_reason: null,
      refund_status: 'NONE',
      refund_amount: null,
      refund_approved_by: null,
      idempotency_key: 'idemp-pay-001',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pay-002',
      public_id: 'VXPY-000002',
      booking_id: 'VTX-84926',
      customer_id: 'cust-1',
      customer_name: 'Rahul Sharma',
      customer_phone: '+91 98101 23456',
      amount: 399,
      currency: 'INR',
      payment_method: 'CARD',
      payment_reference: 'POS-TXN-881923',
      status: 'COLLECTED',
      collected_by: 'tech-1',
      collected_by_name: 'Raj Kumar',
      collected_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      notes: 'Refrigerator defrost sensor payment collected on POS swipe.',
      receipt_number: 'RCP-2026-00178',
      verified_by: null,
      verified_at: null,
      refund_reason: null,
      refund_status: 'NONE',
      refund_amount: null,
      refund_approved_by: null,
      idempotency_key: 'idemp-pay-002',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public auditLogs: AuditLogRecord[] = [
    {
      id: 'audit-001',
      user_id: 'usr-super-1',
      user_name: 'Vikramaditya Sengupta',
      user_role: 'SUPER_ADMIN',
      action: 'SYSTEM_STARTUP',
      entity: 'SYSTEM',
      entity_id: null,
      old_value: null,
      new_value: { environment: 'Enterprise Production', mode: 'Active' },
      ip_address: '127.0.0.1',
      user_agent: 'VERTEX Enterprise Node Service',
      created_at: new Date().toISOString(),
    },
  ];

  public managerProfiles = [
    {
      id: 'mgr-prof-1',
      user_id: 'usr-mgr-1',
      assigned_region: 'Delhi NCR & Northern Hub',
      department: 'Hub Operations & Field Fleet',
      direct_reports_count: 6,
    },
  ];

  public salesProfiles = [
    {
      id: 'sales-prof-1',
      user_id: 'usr-sales-1',
      employee_type: 'FULL_TIME',
      compensation_model: 'FIXED_PLUS_COMMISSION',
      base_salary: 45000,
      commission_rate: 8.5,
      monthly_target: 300000,
      revenue_generated: 245000,
      bookings_created: 42,
    },
  ];

  public financeProfiles = [
    {
      id: 'fin-prof-1',
      user_id: 'usr-fin-1',
      department: 'Accounts, Payouts & Taxation',
      approval_limit: 1000000,
    },
  ];

  public technicianProfiles = [
    {
      id: 'tech-prof-1',
      user_id: 'tech-1',
      primary_skills: ['AC Repair', 'HVAC Maintenance'],
      skills: JSON.stringify(['AC Repair', 'HVAC Maintenance']),
      service_tier: 'SENIOR',
      rating: 4.9,
      total_jobs_assigned: 84,
      total_jobs_completed: 81,
      completed_jobs_count: 81,
      is_on_duty: true,
      kyc_status: 'VERIFIED',
    },
    {
      id: 'tech-prof-2',
      user_id: 'tech-2',
      primary_skills: ['Electrical Engineering', 'Smart Home Panels'],
      skills: JSON.stringify(['Electrical Engineering', 'Smart Home Panels']),
      service_tier: 'SPECIALIST',
      rating: 4.8,
      total_jobs_assigned: 65,
      total_jobs_completed: 62,
      completed_jobs_count: 62,
      is_on_duty: false,
      kyc_status: 'VERIFIED',
    },
    {
      id: 'tech-prof-3',
      user_id: 'tech-3',
      primary_skills: ['Plumbing', 'Water Heaters'],
      skills: JSON.stringify(['Plumbing', 'Water Heaters']),
      service_tier: 'SENIOR',
      rating: 4.82,
      total_jobs_assigned: 58,
      total_jobs_completed: 55,
      completed_jobs_count: 55,
      is_on_duty: true,
      kyc_status: 'VERIFIED',
    },
  ];

  public bookings: BookingRecord[] = [
    {
      id: 'VTX-84920',
      public_id: 'VTX-84920',
      service_id: 'srv-ac-repair',
      service_name: 'AC Repair & Deep Clean',
      customer_id: 'cust-1',
      customer_name: 'Rahul Sharma',
      customer_phone: '+91 98101 23456',
      technician_id: 'tech-1',
      technician_name: 'Raj Kumar',
      technician_phone: '+91 99999 90001',
      technician_rating: 4.9,
      status: 'In Progress',
      scheduled_date: 'Today, 7 Sep 2026',
      time_slot: '10:00 AM - 12:00 PM',
      service_address: 'Villa 14B, Hamilton Court, DLF Phase 4, Sector 28, Gurgaon',
      total_amount: 499,
      technician_cut: 380,
      payment_status: 'Paid Online',
      otp: '4821',
      instructions: 'Master bedroom split AC is dripping water inside onto the wooden floor.',
      required_parts: ['Water Tray Seal', 'Drain Pipe 1.5m', 'Anti-fungal Coil Cleaner'],
      created_at: new Date(Date.now() - 3600000).toISOString(),
      deleted_at: null,
    },
    {
      id: 'VTX-84921',
      public_id: 'VTX-84921',
      service_id: 'srv-ac-service',
      service_name: 'Dual Split AC Jet Foam Service',
      customer_id: 'cust-1',
      customer_name: 'Rahul Sharma',
      customer_phone: '+91 98101 23456',
      technician_id: 'tech-1',
      technician_name: 'Raj Kumar',
      technician_phone: '+91 99999 90001',
      technician_rating: 4.9,
      status: 'Assigned',
      scheduled_date: 'Today, 7 Sep 2026',
      time_slot: '02:00 PM - 03:30 PM',
      service_address: 'Flat 402, Tower B, Palm Grove Heights, Golf Course Road, Sector 54, Gurgaon',
      total_amount: 599,
      technician_cut: 450,
      payment_status: 'Paid Online',
      otp: '6743',
      instructions: 'Pre-summer dual split AC foam jet service requested. Customer has ladder available.',
      required_parts: ['Foam Jet Chemical Concentrate', 'High Pressure Nozzle'],
      created_at: new Date(Date.now() - 7200000).toISOString(),
      deleted_at: null,
    },
    {
      id: 'VTX-84924',
      public_id: 'VTX-84924',
      service_id: 'srv-plumbing',
      service_name: 'Bathroom Tap & Mixer Repair',
      customer_id: 'cust-1',
      customer_name: 'Rahul Sharma',
      customer_phone: '+91 98101 23456',
      technician_id: 'tech-3',
      technician_name: 'Vikas Technician',
      technician_phone: '+91 99999 90012',
      technician_rating: 4.82,
      status: 'Assigned',
      scheduled_date: 'Tomorrow, 8 Sep 2026',
      time_slot: '11:00 AM - 01:00 PM',
      service_address: 'Flat 804, Pinnacle Tower, Golf Course Road, Sector 43, Gurgaon',
      total_amount: 299,
      technician_cut: 230,
      payment_status: 'Paid Online',
      otp: '7392',
      instructions: 'Wall mixer tap is dripping continuously.',
      required_parts: ['Ceramic Cartridge 35mm', 'Teflon Tape'],
      created_at: new Date(Date.now() - 14400000).toISOString(),
      deleted_at: null,
    },
    {
      id: 'VTX-84925',
      public_id: 'VTX-84925',
      service_id: 'srv-electrical',
      service_name: 'Living Room Chandelier & MCB Trip Solved',
      customer_id: 'cust-1',
      customer_name: 'Rahul Sharma',
      customer_phone: '+91 98101 23456',
      technician_id: 'tech-2',
      technician_name: 'Amit Technician',
      technician_phone: '+91 99999 90011',
      technician_rating: 4.8,
      status: 'Completed',
      scheduled_date: '2026-09-02',
      time_slot: '02:00 PM - 04:00 PM',
      service_address: 'B-12 South Extension Part 2, New Delhi',
      total_amount: 299,
      technician_cut: 220,
      payment_status: 'Paid Online',
      otp: '9103',
      instructions: 'Tripping issue on lighting circuit.',
      work_performed: 'Identified loose neutral link on MCB distribution board, re-crimped and secured.',
      parts_used: 'Single Pole 16A C-Curve MCB',
      technician_notes: 'All load tests normal. Chandelier dimmer works smoothly.',
      customer_remarks: 'Prompt service and neat cleanup.',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      deleted_at: null,
    },
    {
      id: 'VTX-84926',
      public_id: 'VTX-84926',
      service_id: 'srv-refrigerator',
      service_name: 'Refrigerator Cooling Issue',
      customer_id: 'cust-1',
      customer_name: 'Rahul Sharma',
      customer_phone: '+91 98101 23456',
      technician_id: 'tech-1',
      technician_name: 'Raj Kumar',
      technician_phone: '+91 99999 90001',
      technician_rating: 4.9,
      status: 'Completed',
      scheduled_date: '2026-09-05',
      time_slot: '04:00 PM - 05:30 PM',
      service_address: 'Villa 14B, Hamilton Court, DLF Phase 4, Gurgaon',
      total_amount: 399,
      technician_cut: 300,
      payment_status: 'Paid Online',
      otp: '1290',
      instructions: 'Frost-free double door fridge not cooling in lower cabinet.',
      work_performed: 'Replaced defective defrost thermostat sensor and cleaned condenser fan.',
      parts_used: 'Bimetal Defrost Thermostat',
      technician_notes: 'Evaporator frost cleared and temperature cycle confirmed down to 4°C.',
      customer_remarks: 'Excellent work as always.',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      deleted_at: null,
    },
    {
      id: 'VTX-84930',
      public_id: 'VTX-84930',
      service_id: 'srv-electrical',
      service_name: 'Electrical Short Circuit Check',
      customer_id: 'cust-2',
      customer_name: 'Priya Sharma',
      customer_phone: '+91 99999 90005',
      technician_id: 'tech-2',
      technician_name: 'Amit Technician',
      technician_phone: '+91 99999 90011',
      technician_rating: 4.8,
      status: 'Assigned',
      scheduled_date: 'Today, 7 Sep 2026',
      time_slot: '03:00 PM - 05:00 PM',
      service_address: 'Flat 302, Green Glen Layout, Bellandur, Bangalore',
      total_amount: 499,
      technician_cut: 380,
      payment_status: 'Paid Online',
      otp: '5812',
      instructions: 'Circuit breaker trips when microwave turns on.',
      required_parts: ['32A Circuit Breaker', 'Multi-meter probe'],
      created_at: new Date(Date.now() - 3600000).toISOString(),
      deleted_at: null,
    },
  ];

  public attendanceRecords: AttendanceRecord[] = [
    {
      id: 'att-1',
      technician_id: 'tech-1',
      date: 'Today, 7 Sep 2026',
      day: 'Mon',
      punch_in: '08:45 AM',
      punch_out: null,
      duration_hours: 6.5,
      status: 'PRESENT',
      hub: 'Gurgaon Central Hub (Sector 29)',
    },
    {
      id: 'att-2',
      technician_id: 'tech-1',
      date: '6 Sep 2026',
      day: 'Sun',
      punch_in: '09:02 AM',
      punch_out: '06:15 PM',
      duration_hours: 9.2,
      status: 'PRESENT',
      hub: 'Gurgaon Central Hub (Sector 29)',
    },
    {
      id: 'att-3',
      technician_id: 'tech-1',
      date: '5 Sep 2026',
      day: 'Sat',
      punch_in: '08:50 AM',
      punch_out: '06:30 PM',
      duration_hours: 9.6,
      status: 'PRESENT',
      hub: 'Gurgaon Central Hub (Sector 29)',
    },
  ];

  public technicianEarnings: EarningsRecord[] = [
    {
      id: 'earn-1',
      technician_id: 'tech-1',
      job_id: 'JOB-901',
      service: 'AC Repair & Deep Clean',
      customer: 'Rahul Sharma',
      date: 'Today, 7 Sep 2026',
      amount: 380,
      status: 'Processing',
    },
    {
      id: 'earn-2',
      technician_id: 'tech-1',
      job_id: 'JOB-842',
      service: 'Refrigerator Defrost Repair',
      customer: 'Anita Desai',
      date: '5 Sep 2026',
      amount: 300,
      status: 'Settled',
    },
    {
      id: 'earn-3',
      technician_id: 'tech-1',
      job_id: 'JOB-839',
      service: 'Inverter Board Capacitor Service',
      customer: 'Vikram Mehta',
      date: '4 Sep 2026',
      amount: 450,
      status: 'Settled',
    },
  ];

  public technicianNotifications: NotificationRecord[] = [
    {
      id: 'notif-1',
      technician_id: 'tech-1',
      title: 'New Service Job Assigned',
      desc: 'Dual Split AC Jet Foam Service assigned for 02:00 PM today.',
      time: '1 hour ago',
      type: 'job',
      is_read: false,
    },
    {
      id: 'notif-2',
      technician_id: 'tech-1',
      title: '5-Star Rating Received!',
      desc: 'Rahul Sharma rated you 5 stars for refrigerator cooling repair.',
      time: 'Yesterday',
      type: 'rating',
      is_read: true,
    },
    {
      id: 'notif-3',
      technician_id: 'tech-1',
      title: 'Weekly Payout Processed',
      desc: '₹6,450 credited to your registered HDFC bank account.',
      time: '3 days ago',
      type: 'payout',
      is_read: true,
    },
  ];

  public customerProfiles = [
    {
      id: 'cust-prof-1',
      user_id: 'cust-1',
      customer_type: 'INDIVIDUAL',
    },
  ];

  public locationScopes = [
    {
      id: 'scope-1',
      user_id: 'usr-super-1',
      city_id: 2,
      scope_type: 'CITY',
      is_primary: true,
      city_name: 'Gurgaon',
    },
    {
      id: 'scope-2',
      user_id: 'usr-mgr-1',
      city_id: 1,
      scope_type: 'CITY',
      is_primary: true,
      city_name: 'Delhi',
    },
  ];

  constructor() {
    // Populate role permissions
    const ALL_PERMS = this.permissions.map((p) => p.code);

    // 1. SUPER_ADMIN: All permissions
    for (const code of ALL_PERMS) {
      this.rolePermissions.push({ role_code: 'SUPER_ADMIN', permission_code: code });
    }

    // 2. ADMIN: All operational and administrative permissions
    for (const code of ALL_PERMS) {
      this.rolePermissions.push({ role_code: 'ADMIN', permission_code: code });
    }

    // 3. MANAGER: Hub Operations, Team Management, Bookings, Leads, Customers, Fleet
    const MANAGER_PERMISSIONS = [
      'DASHBOARD_VIEW',
      'USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_EDIT', 'USER_DEACTIVATE', 'USER_ACTIVATE',
      'ROLE_VIEW',
      'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE', 'CUSTOMER_EDIT',
      'LEAD_VIEW', 'LEAD_CREATE', 'LEAD_EDIT', 'LEAD_ASSIGN', 'LEAD_REASSIGN', 'LEAD_FOLLOWUP_CREATE', 'LEAD_FOLLOWUP_COMPLETE', 'LEAD_CONVERT', 'LEAD_WON', 'LEAD_LOST', 'LEAD_MARK_WON', 'LEAD_MARK_LOST',
      'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_UPDATE', 'BOOKING_EDIT', 'BOOKING_ASSIGN', 'BOOKING_CANCEL',
      'TECHNICIAN_VIEW', 'TECHNICIAN_CREATE', 'TECHNICIAN_UPDATE', 'TECHNICIAN_ASSIGN', 'TECHNICIAN_MANAGE',
      'SALES_VIEW', 'SALES_CREATE', 'SALES_UPDATE', 'SALES_TEAM_VIEW', 'SALES_TEAM_MANAGE',
      'MANAGERS_VIEW', 'MANAGER_VIEW',
      'PAYMENT_VIEW', 'PAYMENT_COLLECT',
      'SERVICE_VIEW', 'LOCATION_VIEW', 'AMC_VIEW', 'AMC_MANAGE', 'REPORT_VIEW', 'SUPPORT_VIEW', 'REVIEW_VIEW', 'NOTIFICATION_VIEW',
      'HR_EMPLOYEE_VIEW', 'HR_ATTENDANCE_VIEW', 'HR_ATTENDANCE_APPROVE', 'HR_LEAVE_VIEW', 'HR_LEAVE_APPROVE', 'HR_LEAVE_REJECT',
    ];
    for (const code of MANAGER_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'MANAGER', permission_code: code });
    }

    // 4. SALES & SALES_TEAM: Commercial, Leads, Customers, Bookings, Payment Collection
    const SALES_PERMISSIONS = [
      'DASHBOARD_VIEW',
      'USER_VIEW',
      'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE', 'CUSTOMER_EDIT',
      'LEAD_VIEW', 'LEAD_CREATE', 'LEAD_EDIT', 'LEAD_ASSIGN', 'LEAD_FOLLOWUP_CREATE', 'LEAD_FOLLOWUP_COMPLETE', 'LEAD_CONVERT', 'LEAD_WON', 'LEAD_LOST', 'LEAD_MARK_WON', 'LEAD_MARK_LOST',
      'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_UPDATE', 'BOOKING_EDIT',
      'PAYMENT_VIEW', 'PAYMENT_COLLECT',
      'SALES_VIEW', 'SALES_TEAM_VIEW',
      'SERVICE_VIEW', 'LOCATION_VIEW', 'AMC_VIEW', 'AMC_CREATE', 'AMC_EDIT', 'AMC_MANAGE',
      'REVIEW_VIEW', 'REPORT_VIEW', 'SUPPORT_VIEW',
    ];
    for (const code of SALES_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'SALES', permission_code: code });
      this.rolePermissions.push({ role_code: 'SALES_TEAM', permission_code: code });
    }

    // 5. FINANCE: Ledger, Invoices, Settlements, Verifications, Refunds
    const FINANCE_PERMISSIONS = [
      'DASHBOARD_VIEW',
      'FINANCE_VIEW',
      'LEAD_VIEW', 'LEAD_CREATE',
      'PAYMENT_VIEW', 'PAYMENT_CREATE', 'PAYMENT_COLLECT', 'PAYMENT_VERIFY', 'PAYMENT_RECONCILE', 'PAYMENT_REFUND_REQUEST', 'PAYMENT_REFUND_APPROVE', 'PAYMENT_EDIT', 'PAYMENT_MANAGE', 'PAYMENT_REFUND',
      'INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_EDIT', 'INVOICE_VOID', 'INVOICE_MANAGE',
      'COMMISSION_VIEW', 'COMMISSION_UPDATE', 'COMMISSION_MANAGE',
      'PARTNER_COMMISSION_VIEW', 'PARTNER_COMMISSION_APPROVE', 'PARTNER_COMMISSION_RECALCULATE', 'PAYROLL_VIEW',
      'CUSTOMER_VIEW', 'BOOKING_VIEW', 'REPORT_VIEW', 'REPORT_EXPORT', 'AUDIT_VIEW', 'AUDIT_LOG_VIEW',
    ];
    for (const code of FINANCE_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'FINANCE', permission_code: code });
    }

    // 6. MARKETING: Campaigns, Promotions, Lead Ingestion, Analytics
    const MARKETING_PERMISSIONS = [
      'DASHBOARD_VIEW',
      'PROMOTION_VIEW', 'PROMOTION_CREATE', 'PROMOTION_EDIT', 'PROMOTION_DELETE', 'PROMOTION_ACTIVATE',
      'LEAD_VIEW', 'LEAD_CREATE', 'LEAD_EDIT',
      'CUSTOMER_VIEW', 'REPORT_VIEW', 'SERVICE_VIEW',
    ];
    for (const code of MARKETING_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'MARKETING', permission_code: code });
    }

    // 7. OPERATIONS: Fleet Scheduling, Service Dispatch, Locations
    const OPERATIONS_PERMISSIONS = [
      'DASHBOARD_VIEW',
      'LEAD_VIEW',
      'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_UPDATE', 'BOOKING_EDIT', 'BOOKING_ASSIGN', 'BOOKING_CANCEL',
      'TECHNICIAN_VIEW', 'TECHNICIAN_ASSIGN', 'TECHNICIAN_UPDATE', 'TECHNICIAN_MANAGE',
      'CUSTOMER_VIEW', 'LOCATION_VIEW', 'LOCATION_MANAGE',
      'PAYMENT_VIEW', 'PAYMENT_COLLECT',
      'SERVICE_VIEW', 'REPORT_VIEW',
    ];
    for (const code of OPERATIONS_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'OPERATIONS', permission_code: code });
    }

    // 8. SUPPORT: Helpdesk, Customer Service, Dispute Handling
    const SUPPORT_PERMISSIONS = [
      'DASHBOARD_VIEW',
      'LEAD_VIEW',
      'SUPPORT_VIEW', 'SUPPORT_RESOLVE', 'SUPPORT_MANAGE',
      'CUSTOMER_VIEW', 'CUSTOMER_UPDATE', 'CUSTOMER_EDIT',
      'BOOKING_VIEW', 'REVIEW_VIEW',
    ];
    for (const code of SUPPORT_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'SUPPORT', permission_code: code });
    }

    // 9. TECHNICIAN: Field Repairs, Self-profile, Job Completion, On-site Collection
    const TECHNICIAN_PERMISSIONS = [
      'BOOKING_VIEW', 'BOOKING_UPDATE', 'TECHNICIAN_UPDATE', 'PAYMENT_COLLECT', 'SERVICE_VIEW', 'REVIEW_VIEW',
    ];
    for (const code of TECHNICIAN_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'TECHNICIAN', permission_code: code });
    }

    // 10. CUSTOMER: Service Orders, Tracking, Profile, AMC
    const CUSTOMER_PERMISSIONS = [
      'BOOKING_VIEW', 'BOOKING_CREATE', 'CUSTOMER_UPDATE', 'CUSTOMER_EDIT', 'AMC_VIEW', 'SERVICE_VIEW', 'REVIEW_VIEW', 'SUPPORT_VIEW',
    ];
    for (const code of CUSTOMER_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'CUSTOMER', permission_code: code });
    }

    // 11. HR: Personnel, Departments, Designations, Shifts, Attendance, Leaves, Holidays, Performance, Recruitment, Exit
    const HR_PERMISSIONS = [
      'DASHBOARD_VIEW', 'USER_VIEW',
      'HR_EMPLOYEE_CREATE', 'HR_EMPLOYEE_VIEW', 'HR_EMPLOYEE_EDIT', 'HR_EMPLOYEE_DELETE', 'HR_EMPLOYEE_ACTIVATE', 'HR_EMPLOYEE_DEACTIVATE',
      'HR_DEPARTMENT_MANAGE', 'HR_DESIGNATION_MANAGE', 'HR_SHIFT_MANAGE',
      'HR_DOCUMENT_VIEW', 'HR_DOCUMENT_UPLOAD', 'HR_DOCUMENT_DELETE',
      'HR_ATTENDANCE_VIEW', 'HR_ATTENDANCE_EDIT', 'HR_ATTENDANCE_APPROVE',
      'HR_LEAVE_VIEW', 'HR_LEAVE_CREATE', 'HR_LEAVE_EDIT', 'HR_LEAVE_APPROVE', 'HR_LEAVE_REJECT',
      'HR_HOLIDAY_MANAGE', 'HR_ASSET_MANAGE',
      'HR_PERFORMANCE_VIEW', 'HR_PERFORMANCE_CREATE', 'HR_PERFORMANCE_EDIT',
      'HR_RECRUITMENT_VIEW', 'HR_RECRUITMENT_CREATE', 'HR_RECRUITMENT_EDIT',
      'HR_EXIT_MANAGE',
      'PAYROLL_VIEW', 'PAYSLIP_VIEW',
      'EMPLOYEE_PROFILE_VIEW', 'EMPLOYEE_ATTENDANCE_VIEW', 'EMPLOYEE_LEAVE_VIEW', 'EMPLOYEE_PAYSLIP_VIEW',
    ];
    for (const code of HR_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'HR', permission_code: code });
    }

    // 12. PAYROLL: Salaries, Computations, Deductions, Bonuses, Advances, Payslips, Reports
    const PAYROLL_PERMISSIONS = [
      'DASHBOARD_VIEW',
      'PAYROLL_VIEW', 'PAYROLL_CREATE', 'PAYROLL_EDIT', 'PAYROLL_PROCESS', 'PAYROLL_APPROVE', 'PAYROLL_FINALIZE',
      'PAYROLL_SALARY_STRUCTURE_VIEW', 'PAYROLL_SALARY_STRUCTURE_CREATE', 'PAYROLL_SALARY_STRUCTURE_EDIT',
      'PAYROLL_DEDUCTIONS_VIEW', 'PAYROLL_DEDUCTIONS_EDIT',
      'PAYROLL_BONUS_VIEW', 'PAYROLL_BONUS_CREATE', 'PAYROLL_BONUS_EDIT',
      'PAYROLL_LOAN_VIEW', 'PAYROLL_LOAN_CREATE', 'PAYROLL_LOAN_EDIT',
      'PAYROLL_ADVANCE_VIEW', 'PAYROLL_ADVANCE_CREATE', 'PAYROLL_ADVANCE_EDIT',
      'PAYSLIP_VIEW', 'PAYSLIP_GENERATE', 'PAYSLIP_DOWNLOAD',
      'PAYROLL_REPORT_VIEW', 'PAYROLL_REPORT_EXPORT',
      'HR_EMPLOYEE_VIEW', 'HR_ATTENDANCE_VIEW', 'HR_LEAVE_VIEW',
      'EMPLOYEE_PROFILE_VIEW', 'EMPLOYEE_PAYSLIP_VIEW', 'EMPLOYEE_PAYSLIP_DOWNLOAD',
    ];
    for (const code of PAYROLL_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'PAYROLL', permission_code: code });
    }

    // 13. EMPLOYEE: Self Service Portal
    const EMPLOYEE_PERMISSIONS = [
      'EMPLOYEE_PROFILE_VIEW',
      'EMPLOYEE_ATTENDANCE_VIEW',
      'EMPLOYEE_LEAVE_VIEW',
      'EMPLOYEE_LEAVE_APPLY',
      'EMPLOYEE_PAYSLIP_VIEW',
      'EMPLOYEE_PAYSLIP_DOWNLOAD',
      'EMPLOYEE_DOCUMENT_VIEW',
    ];
    for (const code of EMPLOYEE_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'EMPLOYEE', permission_code: code });
    }

    // 14. PARTNER: Referral & Channel Partner Portal
    const PARTNER_PERMISSIONS = [
      'PARTNER_VIEW',
      'PARTNER_COMMISSION_VIEW',
      'SERVICE_VIEW',
      'AMC_VIEW',
    ];
    for (const code of PARTNER_PERMISSIONS) {
      this.rolePermissions.push({ role_code: 'PARTNER', permission_code: code });
    }
  }

  public async executeQuery<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    // 0. information_schema.tables
    if (/information_schema\.tables/i.test(cleanSql)) {
      const tables = [
        { table_name: 'users' },
        { table_name: 'roles' },
        { table_name: 'permissions' },
        { table_name: 'role_permissions' },
        { table_name: 'user_location_scopes' },
        { table_name: 'states' },
        { table_name: 'cities' },
        { table_name: 'services' },
        { table_name: 'bookings' },
        { table_name: 'leads' },
        { table_name: 'lead_followups' },
        { table_name: 'payments' },
        { table_name: 'technician_profiles' },
        { table_name: 'manager_profiles' },
        { table_name: 'sales_profiles' },
        { table_name: 'finance_profiles' },
        { table_name: 'audit_logs' },
      ];
      return { rows: tables as any, rowCount: tables.length };
    }

    // 1. SELECT roles
    if (/SELECT \* FROM roles/i.test(cleanSql)) {
      return { rows: [...this.roles] as any, rowCount: this.roles.length };
    }

    // 2. SELECT permissions
    if (/SELECT \* FROM permissions/i.test(cleanSql)) {
      return { rows: [...this.permissions] as any, rowCount: this.permissions.length };
    }

    // 3. SELECT states
    if (/SELECT \* FROM states/i.test(cleanSql)) {
      return { rows: [...this.states] as any, rowCount: this.states.length };
    }

    // 4. SELECT cities
    if (/SELECT c\.\*, s\.name as state_name/i.test(cleanSql) || /SELECT \* FROM cities/i.test(cleanSql)) {
      return { rows: [...this.cities] as any, rowCount: this.cities.length };
    }

    // 5. SELECT audit_logs
    if (/SELECT \* FROM audit_logs/i.test(cleanSql)) {
      let filtered = [...this.auditLogs];
      if (params.length > 0 && typeof params[0] === 'string') {
        filtered = filtered.filter((l) => l.action === params[0]);
      }
      return { rows: filtered as any, rowCount: filtered.length };
    }

    // 6. INSERT INTO audit_logs
    if (/INSERT INTO audit_logs/i.test(cleanSql)) {
      const record: AuditLogRecord = {
        id: params[0] || crypto.randomUUID(),
        user_id: params[1] || null,
        user_name: params[2] || 'User',
        user_role: params[3] || 'ANONYMOUS',
        action: params[4] || 'ACTION',
        entity: params[5] || 'ENTITY',
        entity_id: params[6] || null,
        old_value: params[7],
        new_value: params[8],
        ip_address: params[9] || '127.0.0.1',
        user_agent: params[10] || 'VERTEX',
        created_at: new Date().toISOString(),
      };
      this.auditLogs.unshift(record);
      return { rows: [], rowCount: 1 };
    }

    // 7. SELECT COUNT(*) as total FROM users
    if (/SELECT COUNT\(\*\) as total FROM users/i.test(cleanSql) || /SELECT COUNT\(\*\) as c FROM users/i.test(cleanSql)) {
      const active = this.users.filter((u) => !u.deleted_at);
      return { rows: [{ total: active.length, c: active.length, count: active.length }] as any, rowCount: 1 };
    }

    // 8. Auth email lookup
    if (/WHERE LOWER\(email\) = \$1 AND deleted_at IS NULL/i.test(cleanSql)) {
      const email = String(params[0] || '').toLowerCase().trim();
      const match = this.users.find(
        (u) => !u.deleted_at && u.email && u.email.toLowerCase().trim() === email
      );
      return { rows: match ? ([match] as any) : [], rowCount: match ? 1 : 0 };
    }

    // 9. Auth phone lookup
    if (/phone LIKE \$1 OR phone = \$2/i.test(cleanSql)) {
      const p1 = String(params[0] || '').replace(/%/g, '');
      const p2 = String(params[1] || '');
      const match = this.users.find((u) => {
        if (u.deleted_at) return false;
        const clean = (u.phone || '').replace(/\D/g, '');
        return clean.endsWith(p1) || clean === p2.replace(/\D/g, '');
      });
      return { rows: match ? ([match] as any) : [], rowCount: match ? 1 : 0 };
    }

    // 10. User by id lookup with joins
    if (/FROM users u.*WHERE u\.id = \$1/i.test(cleanSql)) {
      const id = String(params[0]);
      const user = this.users.find((u) => u.id === id && !u.deleted_at);
      if (!user) return { rows: [], rowCount: 0 };

      const city = this.cities.find((c) => c.id === user.city_id);
      const role = this.roles.find((r) => r.code === user.role);
      const techProfile = this.technicianProfiles.find((t) => t.user_id === id);

      const enriched = {
        ...user,
        city_name: city?.name || 'Gurgaon',
        role_name: role?.name || user.role,
        rating: techProfile?.rating ?? 4.9,
        completed_jobs_count: techProfile?.completed_jobs_count ?? techProfile?.total_jobs_completed ?? 0,
        is_on_duty: techProfile?.is_on_duty ?? true,
        kyc_status: techProfile?.kyc_status ?? 'VERIFIED',
        skills: techProfile?.skills || JSON.stringify(['AC Repair', 'HVAC Maintenance']),
      };
      return { rows: [enriched] as any, rowCount: 1 };
    }

    // 10b. Update technician duty status
    if (/UPDATE technician_profiles SET is_on_duty = \$1 WHERE user_id = \$2/i.test(cleanSql)) {
      const isOnDuty = Boolean(params[0]);
      const userId = String(params[1]);
      const profile = this.technicianProfiles.find((t) => t.user_id === userId);
      if (profile) {
        profile.is_on_duty = isOnDuty;
      } else {
        this.technicianProfiles.push({
          id: `tech-prof-${Date.now()}`,
          user_id: userId,
          primary_skills: ['General Repair'],
          skills: JSON.stringify(['General Repair']),
          service_tier: 'STANDARD',
          rating: 4.8,
          total_jobs_assigned: 0,
          total_jobs_completed: 0,
          completed_jobs_count: 0,
          is_on_duty: isOnDuty,
          kyc_status: 'VERIFIED',
        });
      }
      return { rows: [], rowCount: 1 };
    }

    // 10c. Bookings queries
    if (/FROM bookings.*WHERE.*technician_id = \$1/i.test(cleanSql)) {
      const techId = String(params[0]);
      const jobs = this.bookings.filter((b) => b.technician_id === techId && !b.deleted_at);
      return { rows: jobs as any, rowCount: jobs.length };
    }

    if (/FROM bookings.*WHERE \(b\.id = \$1 OR b\.public_id = \$1\)/i.test(cleanSql) ||
        /FROM bookings.*WHERE \(id = \$1 OR public_id = \$1\)/i.test(cleanSql)) {
      const id = String(params[0]);
      const booking = this.bookings.find((b) => (b.id === id || b.public_id === id) && !b.deleted_at);
      return { rows: booking ? ([booking] as any) : [], rowCount: booking ? 1 : 0 };
    }

    if (/FROM bookings.*WHERE.*customer_id = \$1/i.test(cleanSql)) {
      const custId = String(params[0]);
      const customerBookings = this.bookings.filter((b) => b.customer_id === custId && !b.deleted_at);
      return { rows: customerBookings as any, rowCount: customerBookings.length };
    }

    if (/SELECT COUNT\(\*\).*FROM bookings/i.test(cleanSql)) {
      const count = this.bookings.filter((b) => !b.deleted_at).length;
      return { rows: [{ count, total: count }] as any, rowCount: 1 };
    }

    if (/SELECT SUM\(total_amount\).*FROM bookings/i.test(cleanSql)) {
      const sum = this.bookings.reduce((acc, b) => acc + (b.total_amount || 0), 0);
      return { rows: [{ total: sum, sum }] as any, rowCount: 1 };
    }

    if (/UPDATE bookings SET technician_id = \$1/i.test(cleanSql)) {
      const techId = String(params[0]);
      const bookingId = String(params[1]);
      const b = this.bookings.find((x) => x.id === bookingId || x.public_id === bookingId);
      const tech = this.users.find((u) => u.id === techId);
      if (b) {
        b.technician_id = techId;
        b.technician_name = tech?.name || 'Assigned Technician';
        b.technician_phone = tech?.phone || '+91 99999 90001';
        b.status = 'Assigned';
      }
      return { rows: b ? [b] as any : [], rowCount: b ? 1 : 0 };
    }

    if (/UPDATE bookings SET status = \$1/i.test(cleanSql)) {
      const status = String(params[0]);
      const bookingId = String(params[1]);
      const b = this.bookings.find((x) => x.id === bookingId || x.public_id === bookingId);
      if (b) {
        b.status = status;
      }
      return { rows: b ? [b] as any : [], rowCount: b ? 1 : 0 };
    }

    if (/FROM technician_attendance WHERE technician_id = \$1/i.test(cleanSql)) {
      const techId = String(params[0]);
      const att = this.attendanceRecords.filter((a) => a.technician_id === techId);
      return { rows: att as any, rowCount: att.length };
    }

    if (/FROM technician_earnings WHERE technician_id = \$1/i.test(cleanSql)) {
      const techId = String(params[0]);
      const earn = this.technicianEarnings.filter((e) => e.technician_id === techId);
      return { rows: earn as any, rowCount: earn.length };
    }

    if (/FROM technician_notifications WHERE technician_id = \$1/i.test(cleanSql)) {
      const techId = String(params[0]);
      const notifs = this.technicianNotifications.filter((n) => n.technician_id === techId);
      return { rows: notifs as any, rowCount: notifs.length };
    }

    // 11. Role permissions lookup
    if (/FROM role_permissions WHERE role_code = \$1/i.test(cleanSql)) {
      const roleCode = String(params[0]);
      const perms = this.rolePermissions
        .filter((rp) => rp.role_code === roleCode)
        .map((rp) => ({ permission_code: rp.permission_code }));
      return { rows: perms as any, rowCount: perms.length };
    }

    // 11b. Custom user permissions lookup
    if (/FROM user_permissions WHERE user_id = \$1/i.test(cleanSql)) {
      const userId = String(params[0]);
      const perms = (this.userPermissions || [])
        .filter((up) => up.user_id === userId)
        .map((up) => ({ permission_code: up.permission_code }));
      return { rows: perms as any, rowCount: perms.length };
    }

    // 12. User location scopes
    if (/FROM user_location_scopes uls.*WHERE uls\.user_id = \$1/i.test(cleanSql)) {
      const userId = String(params[0]);
      const scopes = this.locationScopes.filter((s) => s.user_id === userId);
      return { rows: scopes as any, rowCount: scopes.length };
    }

    // 13. Profiles lookup
    if (/FROM manager_profiles WHERE user_id = \$1/i.test(cleanSql)) {
      const p = this.managerProfiles.filter((m) => m.user_id === params[0]);
      return { rows: p as any, rowCount: p.length };
    }
    if (/FROM sales_profiles WHERE user_id = \$1/i.test(cleanSql)) {
      const p = this.salesProfiles.filter((s) => s.user_id === params[0]);
      return { rows: p as any, rowCount: p.length };
    }
    if (/FROM finance_profiles WHERE user_id = \$1/i.test(cleanSql)) {
      const p = this.financeProfiles.filter((f) => f.user_id === params[0]);
      return { rows: p as any, rowCount: p.length };
    }
    if (/FROM technician_profiles WHERE user_id = \$1/i.test(cleanSql)) {
      const p = this.technicianProfiles.filter((t) => t.user_id === params[0]);
      return { rows: p as any, rowCount: p.length };
    }
    if (/FROM customer_profiles WHERE user_id = \$1/i.test(cleanSql)) {
      const p = this.customerProfiles.filter((c) => c.user_id === params[0]);
      return { rows: p as any, rowCount: p.length };
    }

    // 14. UPDATE users SET last_login_at
    if (/UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = \$1/i.test(cleanSql)) {
      const id = String(params[0]);
      const u = this.users.find((x) => x.id === id);
      if (u) u.last_login_at = new Date().toISOString();
      return { rows: [], rowCount: 1 };
    }

    // 15. INSERT INTO users
    if (/INSERT INTO users/i.test(cleanSql)) {
      const newUser: UserRecord = {
        id: params[0] || crypto.randomUUID(),
        public_id: params[1] || `VXUSR-${Date.now().toString().slice(-6)}`,
        name: params[2] || 'User',
        email: params[3] || null,
        phone: params[4] || null,
        password_hash: params[5] || null,
        role: params[6] || 'CUSTOMER',
        status: params[7] || 'ACTIVE',
        profile_image: params[8] || null,
        city_id: params[9] || 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        deleted_at: null,
      };
      this.users.push(newUser);
      return { rows: [newUser] as any, rowCount: 1 };
    }

    // 16. Paginated list of users
    if (/SELECT.*u\.public_id as "publicId".*FROM users u/is.test(cleanSql)) {
      const active = this.users.filter((u) => !u.deleted_at);
      const rows = active.map((u) => {
        const c = this.cities.find((city) => city.id === u.city_id);
        const r = this.roles.find((role) => role.code === u.role);
        return {
          id: u.id,
          publicId: u.public_id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          roleName: r?.name || u.role,
          status: u.status,
          profileImage: u.profile_image,
          cityId: u.city_id,
          cityName: c?.name || 'Gurgaon',
          createdAt: u.created_at,
          updatedAt: u.updated_at,
          lastLoginAt: u.last_login_at,
        };
      });
      return { rows: rows as any, rowCount: rows.length };
    }

    // 17. Services
    if (/FROM services/i.test(cleanSql)) {
      const active = this.services.filter((s) => !s.deleted_at);
      const enriched = active.map((s) => {
        const cat = this.serviceCategories.find((c) => c.id === s.category_id);
        return {
          ...s,
          category_name: cat?.name || 'Home Appliance',
        };
      });
      return { rows: enriched as any, rowCount: enriched.length };
    }

    // 18. Service categories
    if (/FROM service_categories/i.test(cleanSql)) {
      const active = this.serviceCategories.filter((c) => !c.deleted_at);
      return { rows: active as any, rowCount: active.length };
    }

    // 19. AMC Plans
    if (/FROM amc_plans/i.test(cleanSql)) {
      const active = this.amcPlans.filter((p) => !p.deleted_at);
      return { rows: active as any, rowCount: active.length };
    }

    // 20. Partners
    if (/FROM partners/i.test(cleanSql)) {
      const active = this.partners.filter((p) => !p.deleted_at);
      return { rows: active as any, rowCount: active.length };
    }

    // Fallback for general queries
    return { rows: [], rowCount: 0 };
  }
}

export const memoryStore = new MemoryStore();
