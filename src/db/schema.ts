import { pgTable, text, timestamp, integer, boolean, numeric, real, serial, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------
// 1. STATES
// ----------------------------------------------------
export const states = pgTable('states', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 2. CITIES
// ----------------------------------------------------
export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  stateId: integer('state_id').references(() => states.id).notNull(),
  tier: integer('tier').default(1).notNull(), // Tier 1, Tier 2
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 3. ROLES
// ----------------------------------------------------
export const roles = pgTable('roles', {
  code: text('code').primaryKey(), // 'SUPER_ADMIN' | 'MANAGER' | 'SALES' | 'FINANCE' | 'TECHNICIAN' | 'CUSTOMER'
  name: text('name').notNull(),
  description: text('description').notNull(),
  isSystemRole: boolean('is_system_role').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 4. PERMISSIONS
// ----------------------------------------------------
export const permissions = pgTable('permissions', {
  code: text('code').primaryKey(), // e.g. 'USER_VIEW', 'USER_CREATE'
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 5. ROLE_PERMISSIONS
// ----------------------------------------------------
export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleCode: text('role_code').references(() => roles.code, { onDelete: 'cascade' }).notNull(),
  permissionCode: text('permission_code').references(() => permissions.code, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 6. USERS
// ----------------------------------------------------
export const users = pgTable('users', {
  id: text('id').primaryKey(), // UUID string internally
  publicId: text('public_id').notNull().unique(), // e.g. 'VXUSR-000001'
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  passwordHash: text('password_hash'),
  role: text('role').references(() => roles.code).notNull(),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED'
  profileImage: text('profile_image'),
  cityId: integer('city_id').references(() => cities.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  deletedAt: timestamp('deleted_at'), // Soft deletion support
});

// ----------------------------------------------------
// 7. USER_LOCATION_SCOPES
// ----------------------------------------------------
export const userLocationScopes = pgTable('user_location_scopes', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  cityId: integer('city_id').references(() => cities.id),
  stateId: integer('state_id').references(() => states.id),
  scopeType: text('scope_type').default('CITY').notNull(), // 'ALL_INDIA' | 'STATE' | 'CITY' | 'MULTI_CITY'
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 8. CUSTOMER_PROFILES
// ----------------------------------------------------
export const customerProfiles = pgTable('customer_profiles', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  customerType: text('customer_type').default('INDIVIDUAL').notNull(), // 'INDIVIDUAL' | 'BUSINESS' | 'CORPORATE'
  preferredLanguage: text('preferred_language').default('English'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 9. TECHNICIAN_PROFILES
// ----------------------------------------------------
export const technicianProfiles = pgTable('technician_profiles', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  skills: text('skills').default('[]').notNull(), // JSON string array of skills
  serviceAreas: text('service_areas').default('[]').notNull(), // JSON string array of locations
  experienceYears: integer('experience_years').default(3).notNull(),
  rating: real('rating').default(4.8).notNull(),
  jobsAssigned: integer('jobs_assigned').default(0).notNull(),
  jobsCompleted: integer('jobs_completed').default(0).notNull(),
  verificationStatus: text('verification_status').default('VERIFIED').notNull(), // 'VERIFIED' | 'PENDING' | 'REJECTED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 10. SALES_PROFILES
// ----------------------------------------------------
export const salesProfiles = pgTable('sales_profiles', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  employeeType: text('employee_type').default('FULL_TIME').notNull(), // 'FULL_TIME' | 'CONTRACTOR' | 'COMMISSION_ONLY'
  compensationModel: text('compensation_model').default('FIXED_PLUS_COMMISSION').notNull(), // 'FIXED_SALARY' | 'COMMISSION' | 'FIXED_PLUS_COMMISSION'
  baseSalary: numeric('base_salary').default('45000').notNull(),
  commissionRate: numeric('commission_rate').default('8.5').notNull(), // in percentage
  monthlyTarget: numeric('monthly_target').default('250000').notNull(),
  revenueGenerated: numeric('revenue_generated').default('0').notNull(),
  bookingsCreated: integer('bookings_created').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 11. MANAGER_PROFILES
// ----------------------------------------------------
export const managerProfiles = pgTable('manager_profiles', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  assignedRegion: text('assigned_region').default('Delhi NCR').notNull(),
  department: text('department').default('Hub Operations & Fleet').notNull(),
  directReportsCount: integer('direct_reports_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 12. FINANCE_PROFILES
// ----------------------------------------------------
export const financeProfiles = pgTable('finance_profiles', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  department: text('department').default('Accounts & Audit').notNull(),
  approvalLimit: numeric('approval_limit').default('500000').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 13. AUDIT_LOGS
// ----------------------------------------------------
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(), // UUID
  userId: text('user_id'), // User UUID or null for system
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(), // 'LOGIN' | 'LOGOUT' | 'USER_CREATED' | 'USER_UPDATED' | 'USER_ACTIVATED' | 'USER_DEACTIVATED' | 'ROLE_CHANGED' | 'PERMISSION_CHANGED' | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  entity: text('entity').default('USER').notNull(),
  entityId: text('entity_id'),
  oldValue: text('old_value'), // JSON string (sensitive secrets masked/never stored)
  newValue: text('new_value'), // JSON string
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// RELATIONS
// ----------------------------------------------------
export const statesRelations = relations(states, ({ many }) => ({
  cities: many(cities),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
  state: one(states, {
    fields: [cities.stateId],
    references: [states.id],
  }),
  users: many(users),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleCode],
    references: [roles.code],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionCode],
    references: [permissions.code],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  roleRef: one(roles, {
    fields: [users.role],
    references: [roles.code],
  }),
  city: one(cities, {
    fields: [users.cityId],
    references: [cities.id],
  }),
  locationScopes: many(userLocationScopes),
  customerProfile: one(customerProfiles, {
    fields: [users.id],
    references: [customerProfiles.userId],
  }),
  technicianProfile: one(technicianProfiles, {
    fields: [users.id],
    references: [technicianProfiles.userId],
  }),
  salesProfile: one(salesProfiles, {
    fields: [users.id],
    references: [salesProfiles.userId],
  }),
  managerProfile: one(managerProfiles, {
    fields: [users.id],
    references: [managerProfiles.userId],
  }),
  financeProfile: one(financeProfiles, {
    fields: [users.id],
    references: [financeProfiles.userId],
  }),
}));
