import crypto from 'crypto';

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
    { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Complete system access, organization-wide governance, and critical infrastructure control', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'MANAGER', name: 'Operations Manager', description: 'Regional hub management, technician allocation, booking oversight, and sales team supervision', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'SALES', name: 'Sales & Growth Specialist', description: 'Customer onboarding, corporate accounts, AMC contract sales, and booking coordination', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'FINANCE', name: 'Finance & Accounts Officer', description: 'Invoice auditing, payment settlements, technician commissions, and fiscal reporting', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'TECHNICIAN', name: 'Service Technician', description: 'Field service execution, job status reporting, and customer site diagnostics', is_system_role: true, created_at: new Date().toISOString() },
    { code: 'CUSTOMER', name: 'End Customer', description: 'Consumer access for booking on-demand services, tracking technician status, and managing AMCs', is_system_role: true, created_at: new Date().toISOString() },
  ];

  public permissions: PermissionRecord[] = [
    { code: 'USER_VIEW', name: 'View Users', category: 'User Management', description: 'View user directory and team lists', created_at: new Date().toISOString() },
    { code: 'USER_CREATE', name: 'Create Users', category: 'User Management', description: 'Create internal users or employees', created_at: new Date().toISOString() },
    { code: 'USER_UPDATE', name: 'Update Users', category: 'User Management', description: 'Edit user details, roles and profiles', created_at: new Date().toISOString() },
    { code: 'USER_DEACTIVATE', name: 'Deactivate Users', category: 'User Management', description: 'Deactivate or suspend user accounts', created_at: new Date().toISOString() },
    { code: 'USER_DELETE', name: 'Delete Users', category: 'User Management', description: 'Soft-delete user accounts', created_at: new Date().toISOString() },
    { code: 'ROLE_VIEW', name: 'View Roles', category: 'Role Governance', description: 'View role hierarchy and permissions', created_at: new Date().toISOString() },
    { code: 'ROLE_MANAGE', name: 'Manage Roles', category: 'Role Governance', description: 'Modify role permission bindings', created_at: new Date().toISOString() },
    { code: 'BOOKING_VIEW', name: 'View Bookings', category: 'Bookings', description: 'View service booking details and status', created_at: new Date().toISOString() },
    { code: 'BOOKING_CREATE', name: 'Create Bookings', category: 'Bookings', description: 'Initiate new service bookings', created_at: new Date().toISOString() },
    { code: 'BOOKING_UPDATE', name: 'Update Bookings', category: 'Bookings', description: 'Modify booking timeline, parts, and prices', created_at: new Date().toISOString() },
    { code: 'BOOKING_ASSIGN', name: 'Assign Technician', category: 'Bookings', description: 'Assign field engineers to bookings', created_at: new Date().toISOString() },
    { code: 'BOOKING_CANCEL', name: 'Cancel Bookings', category: 'Bookings', description: 'Cancel scheduled customer appointments', created_at: new Date().toISOString() },
    { code: 'CUSTOMER_VIEW', name: 'View Customers', category: 'CRM', description: 'Access customer profiles and history', created_at: new Date().toISOString() },
    { code: 'CUSTOMER_CREATE', name: 'Create Customers', category: 'CRM', description: 'Register new customer accounts', created_at: new Date().toISOString() },
    { code: 'CUSTOMER_UPDATE', name: 'Update Customers', category: 'CRM', description: 'Edit customer addresses and details', created_at: new Date().toISOString() },
    { code: 'TECHNICIAN_VIEW', name: 'View Technicians', category: 'Fleet', description: 'Access technician fleet directory', created_at: new Date().toISOString() },
    { code: 'TECHNICIAN_CREATE', name: 'Create Technicians', category: 'Fleet', description: 'Onboard new service engineers', created_at: new Date().toISOString() },
    { code: 'TECHNICIAN_UPDATE', name: 'Update Technicians', category: 'Fleet', description: 'Edit technician skills and areas', created_at: new Date().toISOString() },
    { code: 'TECHNICIAN_ASSIGN', name: 'Dispatch Fleet', category: 'Fleet', description: 'Dispatch technicians across city zones', created_at: new Date().toISOString() },
    { code: 'SALES_VIEW', name: 'View Sales', category: 'Sales', description: 'Inspect sales pipeline and team metrics', created_at: new Date().toISOString() },
    { code: 'SALES_CREATE', name: 'Create Sales Personnel', category: 'Sales', description: 'Add new sales team specialists', created_at: new Date().toISOString() },
    { code: 'SALES_UPDATE', name: 'Update Sales Personnel', category: 'Sales', description: 'Update targets and commissions', created_at: new Date().toISOString() },
    { code: 'MANAGER_VIEW', name: 'View Managers', category: 'Operations', description: 'View regional operations directors', created_at: new Date().toISOString() },
    { code: 'FINANCE_VIEW', name: 'View Finance', category: 'Finance', description: 'View fiscal accounts and audits', created_at: new Date().toISOString() },
    { code: 'PAYMENT_VIEW', name: 'View Payments', category: 'Finance', description: 'View transaction logs and gateways', created_at: new Date().toISOString() },
    { code: 'PAYMENT_MANAGE', name: 'Manage Payments', category: 'Finance', description: 'Initiate refunds and adjust charges', created_at: new Date().toISOString() },
    { code: 'INVOICE_VIEW', name: 'View Invoices', category: 'Finance', description: 'View GST compliant customer invoices', created_at: new Date().toISOString() },
    { code: 'INVOICE_MANAGE', name: 'Manage Invoices', category: 'Finance', description: 'Generate credit notes and revisions', created_at: new Date().toISOString() },
    { code: 'COMMISSION_VIEW', name: 'View Commission', category: 'Finance', description: 'View technician/sales commission rates', created_at: new Date().toISOString() },
    { code: 'COMMISSION_MANAGE', name: 'Manage Commission', category: 'Finance', description: 'Modify and approve commission payouts', created_at: new Date().toISOString() },
    { code: 'SERVICE_VIEW', name: 'View Services', category: 'Catalog', description: 'Browse service rates and scope', created_at: new Date().toISOString() },
    { code: 'SERVICE_CREATE', name: 'Create Services', category: 'Catalog', description: 'Publish new services and categories', created_at: new Date().toISOString() },
    { code: 'SERVICE_UPDATE', name: 'Update Services', category: 'Catalog', description: 'Edit service pricing and inclusions', created_at: new Date().toISOString() },
    { code: 'SERVICE_DELETE', name: 'Delete Services', category: 'Catalog', description: 'Archive obsolete service items', created_at: new Date().toISOString() },
    { code: 'LOCATION_VIEW', name: 'View Locations', category: 'Network', description: 'Browse states, hubs and active pincodes', created_at: new Date().toISOString() },
    { code: 'LOCATION_MANAGE', name: 'Manage Locations', category: 'Network', description: 'Add or expand city service hubs', created_at: new Date().toISOString() },
    { code: 'AMC_VIEW', name: 'View AMCs', category: 'Contracts', description: 'Access Annual Maintenance Contracts', created_at: new Date().toISOString() },
    { code: 'AMC_MANAGE', name: 'Manage AMCs', category: 'Contracts', description: 'Draft, renew, and schedule AMC visits', created_at: new Date().toISOString() },
    { code: 'REPORT_VIEW', name: 'View Reports', category: 'Analytics', description: 'Access revenue and operational analytics', created_at: new Date().toISOString() },
    { code: 'SUPPORT_VIEW', name: 'View Support', category: 'Support', description: 'Access customer helpdesk tickets', created_at: new Date().toISOString() },
    { code: 'SUPPORT_MANAGE', name: 'Manage Support', category: 'Support', description: 'Resolve and escalate tickets', created_at: new Date().toISOString() },
    { code: 'REVIEW_VIEW', name: 'View Reviews', category: 'Feedback', description: 'Monitor customer ratings and complaints', created_at: new Date().toISOString() },
    { code: 'NOTIFICATION_VIEW', name: 'View Notifications', category: 'Communications', description: 'View system notices and alerts', created_at: new Date().toISOString() },
    { code: 'NOTIFICATION_MANAGE', name: 'Manage Notifications', category: 'Communications', description: 'Dispatch bulk SMS and WhatsApp alerts', created_at: new Date().toISOString() },
    { code: 'SETTINGS_VIEW', name: 'View Settings', category: 'Settings', description: 'View system configuration', created_at: new Date().toISOString() },
    { code: 'AUDIT_VIEW', name: 'View Audit Logs', category: 'Security & Audit', description: 'Access compliance security trail and user action history', created_at: new Date().toISOString() },
  ];

  public rolePermissions: { role_code: string; permission_code: string }[] = [];

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
      id: 'cust-1',
      public_id: 'VXUSR-000013',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
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
      service_tier: 'SENIOR',
      rating: 4.9,
      total_jobs_assigned: 84,
      total_jobs_completed: 81,
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
    for (const p of this.permissions) {
      this.rolePermissions.push({ role_code: 'SUPER_ADMIN', permission_code: p.code });
      if (['USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DEACTIVATE', 'ROLE_VIEW', 'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_UPDATE', 'BOOKING_ASSIGN', 'BOOKING_CANCEL', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE', 'TECHNICIAN_VIEW', 'TECHNICIAN_CREATE', 'TECHNICIAN_UPDATE', 'TECHNICIAN_ASSIGN', 'SALES_VIEW', 'MANAGER_VIEW', 'SERVICE_VIEW', 'LOCATION_VIEW', 'AMC_VIEW', 'REPORT_VIEW', 'SUPPORT_VIEW', 'REVIEW_VIEW', 'NOTIFICATION_VIEW'].includes(p.code)) {
        this.rolePermissions.push({ role_code: 'MANAGER', permission_code: p.code });
      }
      if (['USER_VIEW', 'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_UPDATE', 'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE', 'SALES_VIEW', 'SERVICE_VIEW', 'LOCATION_VIEW', 'AMC_VIEW', 'AMC_MANAGE', 'REVIEW_VIEW'].includes(p.code)) {
        this.rolePermissions.push({ role_code: 'SALES', permission_code: p.code });
      }
      if (['USER_VIEW', 'BOOKING_VIEW', 'CUSTOMER_VIEW', 'TECHNICIAN_VIEW', 'FINANCE_VIEW', 'PAYMENT_VIEW', 'PAYMENT_MANAGE', 'INVOICE_VIEW', 'INVOICE_MANAGE', 'COMMISSION_VIEW', 'COMMISSION_MANAGE', 'REPORT_VIEW'].includes(p.code)) {
        this.rolePermissions.push({ role_code: 'FINANCE', permission_code: p.code });
      }
      if (['BOOKING_VIEW', 'BOOKING_UPDATE', 'SERVICE_VIEW', 'REVIEW_VIEW'].includes(p.code)) {
        this.rolePermissions.push({ role_code: 'TECHNICIAN', permission_code: p.code });
      }
      if (['BOOKING_VIEW', 'BOOKING_CREATE', 'CUSTOMER_VIEW', 'SERVICE_VIEW', 'AMC_VIEW', 'REVIEW_VIEW'].includes(p.code)) {
        this.rolePermissions.push({ role_code: 'CUSTOMER', permission_code: p.code });
      }
    }
  }

  public async executeQuery<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[]; rowCount: number }> {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

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

      const enriched = {
        ...user,
        city_name: city?.name || 'Gurgaon',
        role_name: role?.name || user.role,
      };
      return { rows: [enriched] as any, rowCount: 1 };
    }

    // 11. Role permissions lookup
    if (/FROM role_permissions WHERE role_code = \$1/i.test(cleanSql)) {
      const roleCode = String(params[0]);
      const perms = this.rolePermissions
        .filter((rp) => rp.role_code === roleCode)
        .map((rp) => ({ permission_code: rp.permission_code }));
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

    // Fallback for general queries
    return { rows: [], rowCount: 0 };
  }
}

export const memoryStore = new MemoryStore();
