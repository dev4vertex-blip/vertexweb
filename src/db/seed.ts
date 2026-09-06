import { getDb } from './client.js';
import { runMigrations } from './migrate.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function seedDatabase() {
  await runMigrations();
  const { pglite } = await getDb();

  console.log('Seeding database with VERTEX master and demo records...');

  // Check if users table already seeded
  const check = await pglite.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(check.rows[0]?.count || '0', 10) > 0) {
    console.log('Database already contains records. Skipping seed.');
    return;
  }

  // 1. Seed States
  const states = [
    { name: 'Delhi', code: 'DL' },
    { name: 'Haryana', code: 'HR' },
    { name: 'Uttar Pradesh', code: 'UP' },
    { name: 'Maharashtra', code: 'MH' },
    { name: 'Karnataka', code: 'KA' },
    { name: 'Tamil Nadu', code: 'TN' },
    { name: 'West Bengal', code: 'WB' },
  ];

  for (const s of states) {
    await pglite.query(
      `INSERT INTO states (name, code) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      [s.name, s.code]
    );
  }

  // 2. Seed Cities
  const cities = [
    { name: 'Delhi', stateCode: 'DL', tier: 1 },
    { name: 'Gurgaon', stateCode: 'HR', tier: 1 },
    { name: 'Noida', stateCode: 'UP', tier: 1 },
    { name: 'Mumbai', stateCode: 'MH', tier: 1 },
    { name: 'Bangalore', stateCode: 'KA', tier: 1 },
    { name: 'Pune', stateCode: 'MH', tier: 1 },
    { name: 'Chennai', stateCode: 'TN', tier: 1 },
    { name: 'Kolkata', stateCode: 'WB', tier: 1 },
  ];

  for (const c of cities) {
    const sRes = await pglite.query(`SELECT id FROM states WHERE code = $1`, [c.stateCode]);
    const stateId = sRes.rows[0]?.id;
    if (stateId) {
      await pglite.query(
        `INSERT INTO cities (name, state_id, tier, active) VALUES ($1, $2, $3, TRUE)`,
        [c.name, stateId, c.tier]
      );
    }
  }

  // Map city names to IDs
  const cityRows = (await pglite.query(`SELECT id, name FROM cities`)).rows;
  const cityMap = new Map(cityRows.map((r: any) => [r.name, r.id]));

  // 3. Seed Roles
  const roles = [
    { code: 'SUPER_ADMIN', name: 'Super Admin', description: 'Complete system access, organization-wide governance, and critical infrastructure control' },
    { code: 'MANAGER', name: 'Operations Manager', description: 'Regional hub management, technician allocation, booking oversight, and sales team supervision' },
    { code: 'SALES', name: 'Sales & Growth Specialist', description: 'Customer onboarding, corporate accounts, AMC contract sales, and booking coordination' },
    { code: 'FINANCE', name: 'Finance & Accounts Officer', description: 'Invoice auditing, payment settlements, technician commissions, and fiscal reporting' },
    { code: 'TECHNICIAN', name: 'Service Technician', description: 'Field service execution, job status reporting, and customer site diagnostics' },
    { code: 'CUSTOMER', name: 'End Customer', description: 'Consumer access for booking on-demand services, tracking technician status, and managing AMCs' },
  ];

  for (const r of roles) {
    await pglite.query(
      `INSERT INTO roles (code, name, description, is_system_role) VALUES ($1, $2, $3, TRUE) ON CONFLICT (code) DO NOTHING`,
      [r.code, r.name, r.description]
    );
  }

  // 4. Seed Permissions
  const permissions = [
    { code: 'USER_VIEW', name: 'View Users', category: 'User Management', description: 'View user directory and team lists' },
    { code: 'USER_CREATE', name: 'Create Users', category: 'User Management', description: 'Create internal users or employees' },
    { code: 'USER_UPDATE', name: 'Update Users', category: 'User Management', description: 'Edit user details, roles and profiles' },
    { code: 'USER_DEACTIVATE', name: 'Deactivate Users', category: 'User Management', description: 'Deactivate or suspend user accounts' },
    { code: 'USER_DELETE', name: 'Delete Users', category: 'User Management', description: 'Soft-delete user accounts' },

    { code: 'ROLE_VIEW', name: 'View Roles', category: 'Role Governance', description: 'View role hierarchy and permissions' },
    { code: 'ROLE_MANAGE', name: 'Manage Roles', category: 'Role Governance', description: 'Modify role permission bindings' },

    { code: 'BOOKING_VIEW', name: 'View Bookings', category: 'Bookings', description: 'View service booking details and status' },
    { code: 'BOOKING_CREATE', name: 'Create Bookings', category: 'Bookings', description: 'Initiate new service bookings' },
    { code: 'BOOKING_UPDATE', name: 'Update Bookings', category: 'Bookings', description: 'Modify booking timeline, parts, and prices' },
    { code: 'BOOKING_ASSIGN', name: 'Assign Technician', category: 'Bookings', description: 'Assign field engineers to bookings' },
    { code: 'BOOKING_CANCEL', name: 'Cancel Bookings', category: 'Bookings', description: 'Cancel scheduled customer appointments' },

    { code: 'CUSTOMER_VIEW', name: 'View Customers', category: 'CRM', description: 'Access customer profiles and history' },
    { code: 'CUSTOMER_CREATE', name: 'Create Customers', category: 'CRM', description: 'Register new customer accounts' },
    { code: 'CUSTOMER_UPDATE', name: 'Update Customers', category: 'CRM', description: 'Edit customer addresses and details' },

    { code: 'TECHNICIAN_VIEW', name: 'View Technicians', category: 'Fleet', description: 'Access technician fleet directory' },
    { code: 'TECHNICIAN_CREATE', name: 'Create Technicians', category: 'Fleet', description: 'Onboard new service engineers' },
    { code: 'TECHNICIAN_UPDATE', name: 'Update Technicians', category: 'Fleet', description: 'Edit technician skills and areas' },
    { code: 'TECHNICIAN_ASSIGN', name: 'Dispatch Fleet', category: 'Fleet', description: 'Dispatch technicians across city zones' },

    { code: 'SALES_VIEW', name: 'View Sales', category: 'Sales', description: 'Inspect sales pipeline and team metrics' },
    { code: 'SALES_CREATE', name: 'Create Sales Personnel', category: 'Sales', description: 'Add new sales team specialists' },
    { code: 'SALES_UPDATE', name: 'Update Sales Personnel', category: 'Sales', description: 'Update targets and commissions' },

    { code: 'MANAGER_VIEW', name: 'View Managers', category: 'Operations', description: 'View regional operations directors' },
    { code: 'FINANCE_VIEW', name: 'View Finance', category: 'Finance', description: 'View fiscal accounts and audits' },

    { code: 'PAYMENT_VIEW', name: 'View Payments', category: 'Finance', description: 'View transaction logs and gateways' },
    { code: 'PAYMENT_MANAGE', name: 'Manage Payments', category: 'Finance', description: 'Initiate refunds and adjust charges' },
    { code: 'INVOICE_VIEW', name: 'View Invoices', category: 'Finance', description: 'View GST compliant customer invoices' },
    { code: 'INVOICE_MANAGE', name: 'Manage Invoices', category: 'Finance', description: 'Generate credit notes and revisions' },
    { code: 'COMMISSION_VIEW', name: 'View Commission', category: 'Finance', description: 'View technician/sales commission rates' },
    { code: 'COMMISSION_MANAGE', name: 'Manage Commission', category: 'Finance', description: 'Modify and approve commission payouts' },

    { code: 'SERVICE_VIEW', name: 'View Services', category: 'Catalog', description: 'Browse service rates and scope' },
    { code: 'SERVICE_CREATE', name: 'Create Services', category: 'Catalog', description: 'Publish new services and categories' },
    { code: 'SERVICE_UPDATE', name: 'Update Services', category: 'Catalog', description: 'Edit service pricing and inclusions' },
    { code: 'SERVICE_DELETE', name: 'Delete Services', category: 'Catalog', description: 'Archive obsolete service items' },

    { code: 'LOCATION_VIEW', name: 'View Locations', category: 'Network', description: 'Browse states, hubs and active pincodes' },
    { code: 'LOCATION_MANAGE', name: 'Manage Locations', category: 'Network', description: 'Add or expand city service hubs' },

    { code: 'AMC_VIEW', name: 'View AMCs', category: 'Contracts', description: 'Access Annual Maintenance Contracts' },
    { code: 'AMC_MANAGE', name: 'Manage AMCs', category: 'Contracts', description: 'Draft, renew, and schedule AMC visits' },

    { code: 'REPORT_VIEW', name: 'View Reports', category: 'Analytics', description: 'Access revenue and operational analytics' },
    { code: 'SUPPORT_VIEW', name: 'View Support', category: 'Support', description: 'Access customer helpdesk tickets' },
    { code: 'SUPPORT_MANAGE', name: 'Manage Support', category: 'Support', description: 'Resolve and escalate tickets' },
    { code: 'REVIEW_VIEW', name: 'View Reviews', category: 'Feedback', description: 'Monitor customer ratings and complaints' },

    { code: 'NOTIFICATION_VIEW', name: 'View Notifications', category: 'Communications', description: 'View system notices and alerts' },
    { code: 'NOTIFICATION_MANAGE', name: 'Manage Notifications', category: 'Communications', description: 'Dispatch bulk SMS and WhatsApp alerts' },

    { code: 'SETTINGS_VIEW', name: 'View Settings', category: 'Settings', description: 'View system configuration' },
    { code: 'SETTINGS_MANAGE', name: 'Manage Settings', category: 'Settings', description: 'Update platform parameters' },

    { code: 'AUDIT_VIEW', name: 'View Audit Logs', category: 'Security', description: 'Access immutable security audit trails' },
    { code: 'INTEGRATION_VIEW', name: 'View Integrations', category: 'Integrations', description: 'View payment gateways and SMS status' },
    { code: 'INTEGRATION_MANAGE', name: 'Manage Integrations', category: 'Integrations', description: 'Configure external API webhooks' },
  ];

  for (const p of permissions) {
    await pglite.query(
      `INSERT INTO permissions (code, name, category, description) VALUES ($1, $2, $3, $4) ON CONFLICT (code) DO NOTHING`,
      [p.code, p.name, p.category, p.description]
    );
  }

  // 5. Seed Role Permissions
  const rolePermissionAssignments: Record<string, string[]> = {
    SUPER_ADMIN: permissions.map(p => p.code),
    MANAGER: [
      'USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DEACTIVATE',
      'BOOKING_VIEW', 'BOOKING_UPDATE', 'BOOKING_ASSIGN',
      'CUSTOMER_VIEW', 'TECHNICIAN_VIEW', 'TECHNICIAN_ASSIGN',
      'SALES_VIEW', 'SERVICE_VIEW', 'LOCATION_VIEW', 'AMC_VIEW',
      'SUPPORT_VIEW', 'REVIEW_VIEW', 'REPORT_VIEW', 'NOTIFICATION_VIEW',
    ],
    SALES: [
      'BOOKING_VIEW', 'BOOKING_CREATE', 'BOOKING_UPDATE',
      'CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_UPDATE',
      'SERVICE_VIEW', 'SUPPORT_VIEW', 'REVIEW_VIEW', 'AMC_VIEW', 'REPORT_VIEW',
    ],
    FINANCE: [
      'PAYMENT_VIEW', 'PAYMENT_MANAGE', 'INVOICE_VIEW', 'INVOICE_MANAGE',
      'COMMISSION_VIEW', 'COMMISSION_MANAGE', 'REPORT_VIEW',
      'CUSTOMER_VIEW', 'BOOKING_VIEW', 'AUDIT_VIEW',
    ],
    TECHNICIAN: [
      'BOOKING_VIEW', 'TECHNICIAN_UPDATE', 'SUPPORT_VIEW',
    ],
    CUSTOMER: [
      'CUSTOMER_UPDATE', 'BOOKING_VIEW', 'BOOKING_CREATE', 'AMC_VIEW', 'SUPPORT_VIEW',
    ],
  };

  for (const [roleCode, permCodes] of Object.entries(rolePermissionAssignments)) {
    for (const permCode of permCodes) {
      await pglite.query(
        `INSERT INTO role_permissions (role_code, permission_code) VALUES ($1, $2) ON CONFLICT (role_code, permission_code) DO NOTHING`,
        [roleCode, permCode]
      );
    }
  }

  // 6. Seed Users & Profiles
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // Helper to insert user
  async function insertUser(userData: {
    id: string;
    publicId: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    cityName: string;
    avatar?: string;
  }) {
    const cityId = cityMap.get(userData.cityName) || null;
    await pglite.query(
      `INSERT INTO users (id, public_id, name, email, phone, password_hash, role, status, profile_image, city_id, created_at, updated_at, last_login_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        userData.id,
        userData.publicId,
        userData.name,
        userData.email,
        userData.phone,
        defaultPasswordHash,
        userData.role,
        userData.status,
        userData.avatar || null,
        cityId,
      ]
    );

    // Primary location scope
    if (cityId) {
      await pglite.query(
        `INSERT INTO user_location_scopes (id, user_id, city_id, scope_type, is_primary)
         VALUES ($1, $2, $3, 'CITY', TRUE)`,
        [crypto.randomUUID(), userData.id, cityId]
      );
    }

    return userData.id;
  }

  // 1 Super Admin
  const adminId = crypto.randomUUID();
  await insertUser({
    id: adminId,
    publicId: 'VXUSR-000001',
    name: 'Vikramaditya Sengupta',
    email: 'admin@vertex.demo',
    phone: '+91 99000 00001',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    cityName: 'Gurgaon',
    avatar: 'VS',
  });

  // 1 Manager
  const mgrId = crypto.randomUUID();
  await insertUser({
    id: mgrId,
    publicId: 'VXUSR-000002',
    name: 'Pooja Kashyap',
    email: 'manager@vertex.demo',
    phone: '+91 99000 00002',
    role: 'MANAGER',
    status: 'ACTIVE',
    cityName: 'Delhi',
    avatar: 'PK',
  });
  await pglite.query(
    `INSERT INTO manager_profiles (id, user_id, assigned_region, department, direct_reports_count)
     VALUES ($1, $2, 'Delhi NCR & Northern Hub', 'Hub Operations & Field Fleet', 6)`,
    [crypto.randomUUID(), mgrId]
  );

  // 3 Sales users
  const salesUsers = [
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000003',
      name: 'Karan Mehra',
      email: 'sales@vertex.demo',
      phone: '+91 99000 00003',
      cityName: 'Mumbai',
      target: 300000,
      rev: 245000,
      bookings: 42,
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000004',
      name: 'Amit Patel',
      email: 'amit.patel@vertex.demo',
      phone: '+91 99000 00005',
      cityName: 'Delhi',
      target: 250000,
      rev: 180000,
      bookings: 31,
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000005',
      name: 'Neha Sharma',
      email: 'neha.sharma@vertex.demo',
      phone: '+91 99000 00006',
      cityName: 'Bangalore',
      target: 280000,
      rev: 210000,
      bookings: 38,
    },
  ];

  for (const s of salesUsers) {
    await insertUser({
      id: s.id,
      publicId: s.publicId,
      name: s.name,
      email: s.email,
      phone: s.phone,
      role: 'SALES',
      status: 'ACTIVE',
      cityName: s.cityName,
    });
    await pglite.query(
      `INSERT INTO sales_profiles (id, user_id, employee_type, compensation_model, base_salary, commission_rate, monthly_target, revenue_generated, bookings_created)
       VALUES ($1, $2, 'FULL_TIME', 'FIXED_PLUS_COMMISSION', 45000, 8.5, $3, $4, $5)`,
      [crypto.randomUUID(), s.id, s.target, s.rev, s.bookings]
    );
  }

  // 2 Finance users
  const finUsers = [
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000006',
      name: 'Suresh Narang',
      email: 'finance@vertex.demo',
      phone: '+91 99000 00004',
      cityName: 'Bangalore',
      limit: 1000000,
      dept: 'Accounts, Payouts & Taxation',
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000007',
      name: 'Priya Roy',
      email: 'priya.roy@vertex.demo',
      phone: '+91 99000 00007',
      cityName: 'Mumbai',
      limit: 500000,
      dept: 'Billing & Auditor',
    },
  ];

  for (const f of finUsers) {
    await insertUser({
      id: f.id,
      publicId: f.publicId,
      name: f.name,
      email: f.email,
      phone: f.phone,
      role: 'FINANCE',
      status: 'ACTIVE',
      cityName: f.cityName,
    });
    await pglite.query(
      `INSERT INTO finance_profiles (id, user_id, department, approval_limit)
       VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), f.id, f.dept, f.limit]
    );
  }

  // 5 Technicians
  const technicians = [
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000008',
      name: 'Raj Kumar',
      email: 'raj.tech@vertexservices.in',
      phone: '9999990001',
      cityName: 'Gurgaon',
      skills: ['AC Repair', 'HVAC Maintenance', 'Inverter Servicing'],
      areas: ['DLF CyberCity', 'Golf Course Road', 'Sohna Road'],
      rating: 4.9,
      assigned: 84,
      completed: 81,
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000009',
      name: 'Vikram Singh',
      email: 'vikram.tech@vertexservices.in',
      phone: '9999990011',
      cityName: 'Delhi',
      skills: ['Plumbing', 'Water Heaters', 'Pressure Pumps'],
      areas: ['South Extension', 'Hauz Khas', 'Vasant Vihar'],
      rating: 4.8,
      assigned: 65,
      completed: 62,
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000010',
      name: 'Santosh Yadav',
      email: 'santosh.tech@vertexservices.in',
      phone: '9999990012',
      cityName: 'Noida',
      skills: ['Electrical Engineering', 'Smart Home Panels', 'MCB Wiring'],
      areas: ['Sector 62', 'Sector 18', 'Sector 137'],
      rating: 4.7,
      assigned: 72,
      completed: 69,
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000011',
      name: 'Manoj Verma',
      email: 'manoj.tech@vertexservices.in',
      phone: '9999990013',
      cityName: 'Mumbai',
      skills: ['Commercial Refrigeration', 'Washing Machines', 'Microwaves'],
      areas: ['Andheri West', 'Bandra', 'Powai'],
      rating: 4.8,
      assigned: 58,
      completed: 55,
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000012',
      name: 'Dinesh Gowda',
      email: 'dinesh.tech@vertexservices.in',
      phone: '9999990014',
      cityName: 'Bangalore',
      skills: ['VRV / VRF Systems', 'Chiller Plants', 'AC Ducting'],
      areas: ['Indiranagar', 'Koramangala', 'Whitefield'],
      rating: 4.9,
      assigned: 92,
      completed: 89,
    },
  ];

  for (const t of technicians) {
    await insertUser({
      id: t.id,
      publicId: t.publicId,
      name: t.name,
      email: t.email,
      phone: t.phone,
      role: 'TECHNICIAN',
      status: 'ACTIVE',
      cityName: t.cityName,
    });
    await pglite.query(
      `INSERT INTO technician_profiles (id, user_id, skills, service_areas, experience_years, rating, jobs_assigned, jobs_completed, verification_status)
       VALUES ($1, $2, $3, $4, 4, $5, $6, $7, 'VERIFIED')`,
      [crypto.randomUUID(), t.id, JSON.stringify(t.skills), JSON.stringify(t.areas), t.rating, t.assigned, t.completed]
    );
  }

  // 5 Customers
  const customers = [
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000013',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '9999990002',
      cityName: 'Gurgaon',
      type: 'INDIVIDUAL',
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000014',
      name: 'Anita Desai',
      email: 'anita.desai@example.com',
      phone: '9999990021',
      cityName: 'Mumbai',
      type: 'CORPORATE',
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000015',
      name: 'Rajesh Iyer',
      email: 'rajesh.iyer@example.com',
      phone: '9999990022',
      cityName: 'Bangalore',
      type: 'BUSINESS',
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000016',
      name: 'Sunita Rao',
      email: 'sunita.rao@example.com',
      phone: '9999990023',
      cityName: 'Delhi',
      type: 'INDIVIDUAL',
    },
    {
      id: crypto.randomUUID(),
      publicId: 'VXUSR-000017',
      name: 'Deepa Chatterjee',
      email: 'deepa.c@example.com',
      phone: '9999990024',
      cityName: 'Kolkata',
      type: 'BUSINESS',
    },
  ];

  for (const c of customers) {
    await insertUser({
      id: c.id,
      publicId: c.publicId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      cityName: c.cityName,
    });
    await pglite.query(
      `INSERT INTO customer_profiles (id, user_id, customer_type, preferred_language, notes)
       VALUES ($1, $2, $3, 'English', 'Priority customer with active AMC coverage')`,
      [crypto.randomUUID(), c.id, c.type]
    );
  }

  // 7. Initial Audit Log
  await pglite.query(
    `INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity, entity_id, old_value, new_value, ip_address, user_agent)
     VALUES ($1, $2, 'System Migration Engine', 'SUPER_ADMIN', 'DATABASE_INITIALIZED', 'SYSTEM', 'supabase_pg', NULL, '{"status":"READY","seededUsers":17}', '127.0.0.1', 'Node/VERTEX-DB')`,
    [crypto.randomUUID(), adminId]
  );

  console.log('Database seeding successfully finished. 17 users and complete RBAC matrix configured.');
}

// Run directly if invoked from CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
