import { pgTable, text, timestamp, integer, boolean, numeric, real, serial, uuid, date, jsonb } from 'drizzle-orm/pg-core';
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
// 2. CITIES (Locations)
// ----------------------------------------------------
export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  country: text('country').default('India'),
  stateId: integer('state_id').references(() => states.id).notNull(),
  city: text('city'),
  area: text('area'),
  pincode: text('pincode'),
  address: text('address'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  description: text('description'),
  tier: integer('tier').default(1).notNull(), // Tier 1, Tier 2
  active: boolean('active').default(true).notNull(),
  status: text('status').default('ACTIVE'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Canonical locations alias
export const locations = cities;

// ----------------------------------------------------
// 3. ROLES
// ----------------------------------------------------
export const roles = pgTable('roles', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  isSystemRole: boolean('is_system_role').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 4. PERMISSIONS
// ----------------------------------------------------
export const permissions = pgTable('permissions', {
  code: text('code').primaryKey(),
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
  id: text('id').primaryKey(), // UUID string
  publicId: text('public_id').notNull().unique(), // e.g. 'VXUSR-000001'
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  passwordHash: text('password_hash'),
  role: text('role').references(() => roles.code).notNull(),
  status: text('status').default('ACTIVE').notNull(),
  profileImage: text('profile_image'),
  cityId: integer('city_id').references(() => cities.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  deletedAt: timestamp('deleted_at'),
});

// ----------------------------------------------------
// 7. USER_LOCATION_SCOPES
// ----------------------------------------------------
export const userLocationScopes = pgTable('user_location_scopes', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  cityId: integer('city_id').references(() => cities.id),
  stateId: integer('state_id').references(() => states.id),
  scopeType: text('scope_type').default('CITY').notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 8. USER_PERMISSIONS (Direct overrides)
// ----------------------------------------------------
export const userPermissions = pgTable('user_permissions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  permissionCode: text('permission_code').references(() => permissions.code, { onDelete: 'cascade' }).notNull(),
  grantedBy: text('granted_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 9. PROFILES
// ----------------------------------------------------
export const customerProfiles = pgTable('customer_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  customerType: text('customer_type').default('INDIVIDUAL').notNull(),
  preferredLanguage: text('preferred_language').default('English'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const technicianProfiles = pgTable('technician_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  skills: text('skills').default('[]').notNull(),
  serviceAreas: text('service_areas').default('[]').notNull(),
  experienceYears: integer('experience_years').default(3).notNull(),
  rating: real('rating').default(4.8).notNull(),
  jobsAssigned: integer('jobs_assigned').default(0).notNull(),
  jobsCompleted: integer('jobs_completed').default(0).notNull(),
  verificationStatus: text('verification_status').default('VERIFIED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const salesProfiles = pgTable('sales_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  employeeType: text('employee_type').default('FULL_TIME').notNull(),
  compensationModel: text('compensation_model').default('FIXED_PLUS_COMMISSION').notNull(),
  baseSalary: numeric('base_salary').default('45000').notNull(),
  commissionRate: numeric('commission_rate').default('8.5').notNull(),
  monthlyTarget: numeric('monthly_target').default('250000').notNull(),
  revenueGenerated: numeric('revenue_generated').default('0').notNull(),
  bookingsCreated: integer('bookings_created').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const managerProfiles = pgTable('manager_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  assignedRegion: text('assigned_region').default('Delhi NCR').notNull(),
  department: text('department').default('Hub Operations & Fleet').notNull(),
  directReportsCount: integer('direct_reports_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const financeProfiles = pgTable('finance_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  department: text('department').default('Accounts & Audit').notNull(),
  approvalLimit: numeric('approval_limit').default('500000').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 10. AUDIT_LOGS
// ----------------------------------------------------
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(),
  entity: text('entity').default('USER').notNull(),
  entityId: text('entity_id'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 11. LEADS & FOLLOWUPS (CRM)
// ----------------------------------------------------
export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  customerName: text('customer_name').notNull(),
  companyName: text('company_name'),
  email: text('email'),
  phone: text('phone').notNull(),
  alternatePhone: text('alternate_phone'),
  address: text('address'),
  serviceInterest: text('service_interest').notNull(),
  serviceCategory: text('service_category'),
  requirementDetails: text('requirement_details'),
  estimatedValue: numeric('estimated_value', { precision: 12, scale: 2 }).default('0').notNull(),
  leadSource: text('lead_source').default('ORGANIC').notNull(),
  priority: text('priority').default('MEDIUM').notNull(),
  stage: text('stage').default('NEW').notNull(),
  status: text('status').default('ACTIVE').notNull(),
  lossReason: text('loss_reason'),
  wonBookingId: text('won_booking_id'),
  wonCustomerId: text('won_customer_id'),
  assignedTo: text('assigned_to').references(() => users.id),
  assignedToName: text('assigned_to_name'),
  createdBy: text('created_by').references(() => users.id).notNull(),
  cityId: integer('city_id').references(() => cities.id),
  cityName: text('city_name'),
  expectedFollowupDate: date('expected_followup_date'),
  expectedFollowupTime: text('expected_followup_time'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const leadFollowups = pgTable('lead_followups', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull(),
  scheduledDate: text('scheduled_date').notNull(),
  scheduledTime: text('scheduled_time'),
  followupType: text('followup_type').default('CALL'),
  notes: text('notes').notNull(),
  outcome: text('outcome'),
  status: text('status').default('OPEN').notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  completedBy: text('completed_by'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 12. SERVICE CATALOG
// ----------------------------------------------------
export const serviceCategories = pgTable('service_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').unique(),
  code: text('code').unique(),
  description: text('description'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(1).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const services = pgTable('services', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  categoryId: integer('category_id').references(() => serviceCategories.id).notNull(),
  categoryName: text('category_name'),
  description: text('description'),
  shortDescription: text('short_description'),
  price: numeric('price', { precision: 12, scale: 2 }).default('0').notNull(),
  basePrice: numeric('base_price', { precision: 12, scale: 2 }).default('0').notNull(),
  discountedPrice: numeric('discounted_price', { precision: 12, scale: 2 }),
  strikePrice: numeric('strike_price', { precision: 12, scale: 2 }),
  durationMinutes: integer('duration_minutes').default(60).notNull(),
  warrantyDays: integer('warranty_days').default(30).notNull(),
  slaHours: integer('sla_hours').default(4).notNull(),
  taxPercent: numeric('tax_percent', { precision: 5, scale: 2 }).default('18').notNull(),
  imageUrl: text('image_url'),
  status: text('status').default('ACTIVE').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(1).notNull(),
  features: text('features'),
  availability: text('availability'),
  requirements: text('requirements'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ----------------------------------------------------
// 13. CUSTOMER ADDRESSES
// ----------------------------------------------------
export const addresses = pgTable('addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  label: text('label').default('Home').notNull(),
  addressLine1: text('address_line_1').notNull(),
  addressLine2: text('address_line_2'),
  city: text('city').default('Gurgaon').notNull(),
  state: text('state').default('Haryana').notNull(),
  postalCode: text('postal_code').default('122001').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ----------------------------------------------------
// 14. BOOKINGS & COMPLETE LIFECYCLE
// ----------------------------------------------------
export const bookings = pgTable('bookings', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  customerId: text('customer_id').references(() => users.id).notNull(),
  serviceId: text('service_id').references(() => services.id),
  serviceName: text('service_name'),
  serviceCategory: text('service_category'),
  technicianId: text('technician_id').references(() => users.id),
  technicianName: text('technician_name'),
  technicianPhone: text('technician_phone'),
  scheduledDate: text('scheduled_date').notNull(),
  timeSlot: text('time_slot').notNull(),
  serviceAddress: text('service_address').notNull(),
  serviceAddressSnapshot: jsonb('service_address_snapshot'),
  servicePriceSnapshot: numeric('service_price_snapshot', { precision: 12, scale: 2 }),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  technicianCut: numeric('technician_cut', { precision: 12, scale: 2 }).default('0').notNull(),
  status: text('status').default('Pending').notNull(),
  paymentStatus: text('payment_status').default('PENDING').notNull(),
  otp: text('otp'),
  notes: text('notes'),
  instructions: text('instructions'),
  workPerformed: text('work_performed'),
  partsUsed: text('parts_used'),
  technicianNotes: text('technician_notes'),
  customerRemarks: text('customer_remarks'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: text('cancelled_by'),
  cancelledAt: timestamp('cancelled_at'),
  rescheduledFrom: text('rescheduled_from'),
  rescheduledAt: timestamp('rescheduled_at'),
  completedAt: timestamp('completed_at'),
  cityId: integer('city_id').references(() => cities.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const bookingItems = pgTable('booking_items', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'cascade' }).notNull(),
  serviceId: text('service_id').references(() => services.id),
  serviceName: text('service_name').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookingStatusHistory = pgTable('booking_status_history', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').references(() => bookings.id, { onDelete: 'cascade' }).notNull(),
  previousStatus: text('previous_status'),
  newStatus: text('new_status').notNull(),
  changedBy: text('changed_by').references(() => users.id),
  reason: text('reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 15. INVOICES & BILLING
// ----------------------------------------------------
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  bookingId: text('booking_id').references(() => bookings.id),
  customerId: text('customer_id').references(() => users.id).notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  billingAddress: text('billing_address'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default('0').notNull(),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  grandTotal: numeric('grand_total', { precision: 12, scale: 2 }).default('0').notNull(),
  amountPaid: numeric('amount_paid', { precision: 12, scale: 2 }).default('0').notNull(),
  balanceAmount: numeric('balance_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  currency: text('currency').default('INR').notNull(),
  status: text('status').default('ISSUED').notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  dueDate: text('due_date'),
  paidAt: timestamp('paid_at'),
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const invoiceItems = pgTable('invoice_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('18').notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 16. PAYMENTS & TRANSACTIONS
// ----------------------------------------------------
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  bookingId: text('booking_id'),
  customerId: text('customer_id').references(() => users.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('INR').notNull(),
  paymentMethod: text('payment_method').notNull(),
  paymentReference: text('payment_reference'),
  status: text('status').default('COLLECTED').notNull(),
  collectedBy: text('collected_by').references(() => users.id).notNull(),
  collectedByName: text('collected_by_name').notNull(),
  collectedAt: timestamp('collected_at').defaultNow().notNull(),
  notes: text('notes'),
  receiptNumber: text('receipt_number'),
  verifiedBy: text('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  refundReason: text('refund_reason'),
  refundStatus: text('refund_status').default('NONE').notNull(),
  refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }),
  refundApprovedBy: text('refund_approved_by'),
  idempotencyKey: text('idempotency_key').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Webhook idempotency storage
export const paymentWebhookEvents = pgTable('payment_webhook_events', {
  id: text('id').primaryKey(),
  provider: text('provider').default('RAZORPAY').notNull(),
  eventId: text('event_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload'),
  status: text('status').default('PROCESSED').notNull(),
  errorMessage: text('error_message'),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 17. AMC PLANS & SUBSCRIPTIONS
// ----------------------------------------------------
export const amcPlans = pgTable('amc_plans', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  name: text('name').notNull(),
  code: text('code').unique(),
  slug: text('slug').unique(),
  description: text('description'),
  durationMonths: integer('duration_months').default(12).notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).default('0').notNull(),
  basePrice: numeric('base_price', { precision: 12, scale: 2 }).default('0').notNull(),
  strikePrice: numeric('strike_price', { precision: 12, scale: 2 }),
  taxPercent: numeric('tax_percent', { precision: 5, scale: 2 }).default('18').notNull(),
  preventiveVisits: integer('preventive_visits').default(3).notNull(),
  breakdownVisits: integer('breakdown_visits').default(99).notNull(),
  sparePartsDiscountPercent: numeric('spare_parts_discount_percent', { precision: 5, scale: 2 }).default('15').notNull(),
  gasChargingIncluded: boolean('gas_charging_included').default(false).notNull(),
  prioritySlaHours: integer('priority_sla_hours').default(4).notNull(),
  includedServices: text('included_services'),
  visitFrequency: text('visit_frequency'),
  benefits: text('benefits'),
  exclusions: text('exclusions'),
  terms: text('terms'),
  status: text('status').default('ACTIVE').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const amcSubscriptions = pgTable('amc_subscriptions', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  customerId: text('customer_id').references(() => users.id).notNull(),
  planId: text('plan_id').references(() => amcPlans.id).notNull(),
  planName: text('plan_name').notNull(),
  planPriceSnapshot: numeric('plan_price_snapshot', { precision: 12, scale: 2 }).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').default('ACTIVE').notNull(),
  totalPreventiveVisits: integer('total_preventive_visits').default(3).notNull(),
  usedPreventiveVisits: integer('used_preventive_visits').default(0).notNull(),
  totalBreakdownVisits: integer('total_breakdown_visits').default(99).notNull(),
  usedBreakdownVisits: integer('used_breakdown_visits').default(0).notNull(),
  paymentStatus: text('payment_status').default('PAID').notNull(),
  coveredAppliances: text('covered_appliances'),
  serviceAddress: text('service_address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ----------------------------------------------------
// 18. PARTNERS & COMMISSIONS
// ----------------------------------------------------
export const partners = pgTable('partners', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  userId: text('user_id').references(() => users.id),
  companyName: text('company_name').notNull(),
  contactPerson: text('contact_person').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  status: text('status').default('ACTIVE').notNull(),
  address: text('address'),
  cityId: integer('city_id').references(() => cities.id),
  cityName: text('city_name'),
  commissionType: text('commission_type').default('PERCENTAGE').notNull(),
  defaultRate: numeric('default_rate', { precision: 5, scale: 2 }).default('10').notNull(),
  tier: text('tier').default('STANDARD').notNull(),
  panNumber: text('pan_number'),
  gstNumber: text('gst_number'),
  bankAccountNumber: text('bank_account_number'),
  bankIfsc: text('bank_ifsc'),
  bankName: text('bank_name'),
  totalReferrals: integer('total_referrals').default(0).notNull(),
  totalCommissionEarned: numeric('total_commission_earned', { precision: 12, scale: 2 }).default('0').notNull(),
  totalCommissionPaid: numeric('total_commission_paid', { precision: 12, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const commissionRules = pgTable('commission_rules', {
  id: text('id').primaryKey(),
  version: integer('version').default(1).notNull(),
  ruleName: text('rule_name').notNull(),
  ruleType: text('rule_type').default('PERCENTAGE').notNull(),
  serviceId: text('service_id').references(() => services.id),
  categoryId: integer('category_id').references(() => serviceCategories.id),
  rateValue: numeric('rate_value', { precision: 5, scale: 2 }).notNull(),
  effectiveFrom: text('effective_from').notNull(),
  effectiveTo: text('effective_to'),
  status: text('status').default('ACTIVE').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const partnerCommissions = pgTable('partner_commissions', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  partnerId: text('partner_id').references(() => partners.id).notNull(),
  partnerName: text('partner_name').notNull(),
  bookingId: text('booking_id').references(() => bookings.id),
  serviceName: text('service_name'),
  baseAmount: numeric('base_amount', { precision: 12, scale: 2 }).notNull(),
  commissionAmount: numeric('commission_amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('PENDING').notNull(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 19. FLEET: ATTENDANCE, EARNINGS, NOTIFICATIONS
// ----------------------------------------------------
export const technicianAttendance = pgTable('technician_attendance', {
  id: text('id').primaryKey(),
  technicianId: text('technician_id').references(() => users.id).notNull(),
  date: text('date').notNull(),
  day: text('day'),
  punchIn: timestamp('punch_in').notNull(),
  punchOut: timestamp('punch_out'),
  durationHours: numeric('duration_hours', { precision: 4, scale: 2 }).default('0').notNull(),
  status: text('status').default('PRESENT').notNull(),
  hub: text('hub').default('Gurgaon Central').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const technicianEarnings = pgTable('technician_earnings', {
  id: text('id').primaryKey(),
  technicianId: text('technician_id').references(() => users.id).notNull(),
  jobId: text('job_id').references(() => bookings.id),
  service: text('service').notNull(),
  customer: text('customer').notNull(),
  date: text('date').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('Settled').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const technicianNotifications = pgTable('technician_notifications', {
  id: text('id').primaryKey(),
  technicianId: text('technician_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  descText: text('desc_text').notNull(),
  timeText: text('time_text'),
  type: text('type').default('job').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customerNotifications = pgTable('customer_notifications', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('booking').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 20. SUPPORT & REVIEWS
// ----------------------------------------------------
export const supportTickets = pgTable('support_tickets', {
  id: text('id').primaryKey(),
  ticketCode: text('ticket_code').notNull().unique(),
  userId: text('user_id').references(() => users.id).notNull(),
  bookingId: text('booking_id').references(() => bookings.id),
  subject: text('subject').notNull(),
  category: text('category').default('GENERAL').notNull(),
  message: text('message').notNull(),
  status: text('status').default('OPEN').notNull(),
  priority: text('priority').default('MEDIUM').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  bookingId: text('booking_id').references(() => bookings.id).notNull(),
  customerId: text('customer_id').references(() => users.id).notNull(),
  technicianId: text('technician_id').references(() => users.id),
  rating: numeric('rating', { precision: 2, scale: 1 }).notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 21. PROMOTIONS & OFFERS
// ----------------------------------------------------
export const promotions = pgTable('promotions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  promotionType: text('promotion_type').default('PERCENTAGE').notNull(),
  discountType: text('discount_type').default('PERCENTAGE').notNull(),
  discountValue: numeric('discount_value', { precision: 12, scale: 2 }).notNull(),
  minOrderValue: numeric('min_order_value', { precision: 12, scale: 2 }).default('0'),
  maxDiscount: numeric('max_discount', { precision: 12, scale: 2 }),
  startDate: text('start_date'),
  startTime: text('start_time'),
  endDate: text('end_date'),
  endTime: text('end_time'),
  applicableCategories: text('applicable_categories'),
  applicableServices: text('applicable_services'),
  customerSegment: text('customer_segment').default('ALL'),
  usageLimit: integer('usage_limit').default(1000),
  usageCount: integer('usage_count').default(0),
  perCustomerLimit: integer('per_customer_limit').default(1),
  status: text('status').default('ACTIVE').notNull(),
  termsAndConditions: text('terms_and_conditions'),
  createdBy: text('created_by').default('SUPER_ADMIN'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// ----------------------------------------------------
// 22. FILE UPLOADS
// ----------------------------------------------------
export const fileUploads = pgTable('file_uploads', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  userRole: text('user_role').notNull(),
  category: text('category').notNull(),
  entityId: text('entity_id'),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  storageProvider: text('storage_provider').default('LOCAL_SECURE').notNull(),
  storagePath: text('storage_path').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// 23. HR & PAYROLL (Business Hub Only)
// ----------------------------------------------------
export const departments = pgTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  managerId: text('manager_id'),
  managerName: text('manager_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const designations = pgTable('designations', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  code: text('code'),
  departmentId: text('department_id').references(() => departments.id).notNull(),
  level: text('level').default('L3').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const shifts = pgTable('shifts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  gracePeriodMins: integer('grace_period_mins').default(15).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  employeeCode: text('employee_code').notNull().unique(),
  userId: text('user_id').references(() => users.id),
  firstName: text('first_name'),
  lastName: text('last_name'),
  fullName: text('full_name').notNull(),
  personalEmail: text('personal_email'),
  workEmail: text('work_email'),
  phone: text('phone').notNull(),
  dob: text('dob'),
  gender: text('gender'),
  address: jsonb('address'),
  emergencyContact: jsonb('emergency_contact'),
  joiningDate: text('joining_date'),
  employmentStatus: text('employment_status').default('ACTIVE').notNull(),
  departmentId: text('department_id').references(() => departments.id).notNull(),
  designationId: text('designation_id').references(() => designations.id).notNull(),
  shiftId: text('shift_id').references(() => shifts.id),
  workLocation: text('work_location'),
  employmentType: text('employment_type').default('FULL_TIME').notNull(),
  bankAccountNumber: text('bank_account_number'),
  bankName: text('bank_name'),
  bankIfsc: text('bank_ifsc'),
  panNumber: text('pan_number'),
  monthlyCtc: numeric('monthly_ctc', { precision: 12, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const employeeAttendance = pgTable('employee_attendance', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull(),
  date: text('date').notNull(),
  status: text('status').default('PRESENT').notNull(),
  punchIn: timestamp('punch_in'),
  punchOut: timestamp('punch_out'),
  workHours: numeric('work_hours', { precision: 4, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaveTypes = pgTable('leave_types', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  yearlyQuota: integer('yearly_quota').default(12).notNull(),
  isCarryForward: boolean('is_carry_forward').default(false).notNull(),
  description: text('description'),
});

export const leaveBalances = pgTable('leave_balances', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  leaveTypeCode: text('leave_type_code').references(() => leaveTypes.code).notNull(),
  totalAllocated: integer('total_allocated').default(12).notNull(),
  usedDays: integer('used_days').default(0).notNull(),
  balanceDays: integer('balance_days').default(12).notNull(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull(),
  leaveTypeCode: text('leave_type_code').references(() => leaveTypes.code).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  totalDays: integer('total_days').notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('PENDING').notNull(),
  appliedAt: timestamp('applied_at').defaultNow().notNull(),
});

export const holidays = pgTable('holidays', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  date: text('date').notNull().unique(),
  day: text('day'),
  isOptional: boolean('is_optional').default(false).notNull(),
});

export const salaryStructures = pgTable('salary_structures', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  version: integer('version').default(1).notNull(),
  effectiveFrom: text('effective_from').notNull(),
  basicPercent: numeric('basic_percent', { precision: 5, scale: 2 }).default('50').notNull(),
  hraPercent: numeric('hra_percent', { precision: 5, scale: 2 }).default('20').notNull(),
  specialAllowancePercent: numeric('special_allowance_percent', { precision: 5, scale: 2 }).default('30').notNull(),
  pfEmployeeRate: numeric('pf_employee_rate', { precision: 5, scale: 2 }).default('12').notNull(),
  esiEmployeeRate: numeric('esi_employee_rate', { precision: 5, scale: 2 }).default('0.75').notNull(),
  ptMonthly: numeric('pt_monthly', { precision: 10, scale: 2 }).default('200').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payrollRuns = pgTable('payroll_runs', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  monthYear: text('month_year').notNull().unique(),
  status: text('status').default('DRAFT').notNull(),
  totalGross: numeric('total_gross', { precision: 12, scale: 2 }).default('0').notNull(),
  totalDeductions: numeric('total_deductions', { precision: 12, scale: 2 }).default('0').notNull(),
  totalNet: numeric('total_net', { precision: 12, scale: 2 }).default('0').notNull(),
  employeeCount: integer('employee_count').default(0).notNull(),
  processedBy: text('processed_by'),
  processedAt: timestamp('processed_at'),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payslips = pgTable('payslips', {
  id: text('id').primaryKey(),
  publicId: text('public_id').notNull().unique(),
  payrollRunId: text('payroll_run_id').references(() => payrollRuns.id).notNull(),
  employeeId: text('employee_id').notNull(),
  employeeCode: text('employee_code').notNull(),
  employeeName: text('employee_name').notNull(),
  monthYear: text('month_year').notNull(),
  daysInMonth: integer('days_in_month').default(30).notNull(),
  payableDays: integer('payable_days').default(30).notNull(),
  earnings: jsonb('earnings').notNull(),
  deductions: jsonb('deductions').notNull(),
  netSalary: numeric('net_salary', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('PUBLISHED').notNull(),
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
  customerBookings: many(bookings, { relationName: 'customerBookings' }),
  technicianJobs: many(bookings, { relationName: 'technicianJobs' }),
  addresses: many(addresses),
  invoices: many(invoices),
  payments: many(payments),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
    relationName: 'customerBookings',
  }),
  technician: one(users, {
    fields: [bookings.technicianId],
    references: [users.id],
    relationName: 'technicianJobs',
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  items: many(bookingItems),
  statusHistory: many(bookingStatusHistory),
  invoices: many(invoices),
}));

// ----------------------------------------------------
// 34. FINANCIAL AUDIT & LEDGER ENTRIES
// ----------------------------------------------------
export const ledgerEntries = pgTable('ledger_entries', {
  id: text('id').primaryKey(),
  entryNumber: text('entry_number').notNull().unique(),
  entryType: text('entry_type').notNull(), // INVOICE_ISSUED, PAYMENT_COLLECTED, PAYMENT_VERIFIED, REFUND_PROCESSED, TECHNICIAN_PAYOUT
  account: text('account').notNull(), // ACCOUNTS_RECEIVABLE, CASH, BANK, REVENUE, TAX_PAYABLE, TECHNICIAN_COMMISSIONS_PAYABLE, REFUNDS
  debit: numeric('debit', { precision: 12, scale: 2 }).default('0').notNull(),
  credit: numeric('credit', { precision: 12, scale: 2 }).default('0').notNull(),
  currency: text('currency').default('INR').notNull(),
  referenceType: text('reference_type').notNull(), // INVOICE, PAYMENT, BOOKING, REFUND
  referenceId: text('reference_id').notNull(),
  description: text('description'),
  postedBy: text('posted_by'),
  postedAt: timestamp('posted_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

