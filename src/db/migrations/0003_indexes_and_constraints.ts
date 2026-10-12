/**
 * 0003_indexes_and_constraints.sql
 * Step 2B: Targeted performance indexes and production constraints.
 * Safe, idempotent index creation matching actual backend query patterns.
 */
export const migration_0003_indexes = `
  -- Users & Auth indexes
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

  -- Locations & Cities
  CREATE INDEX IF NOT EXISTS idx_cities_code ON cities(code);
  CREATE INDEX IF NOT EXISTS idx_cities_status ON cities(status);
  CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(active);
  CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);

  -- Services & Categories
  CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
  CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
  CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
  CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON service_categories(slug);

  -- Addresses
  CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
  CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(user_id, is_default);

  -- Bookings & Lifecycle operations
  CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_technician_id ON bookings(technician_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
  CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON bookings(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
  CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id ON booking_items(booking_id);
  CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking ON booking_status_history(booking_id);

  -- Invoicing
  CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
  CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

  -- Payments & Webhook Idempotency
  CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
  CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_status ON payment_webhook_events(provider, status);

  -- AMC Plans & Subscriptions
  CREATE INDEX IF NOT EXISTS idx_amc_subscriptions_customer ON amc_subscriptions(customer_id);
  CREATE INDEX IF NOT EXISTS idx_amc_subscriptions_plan ON amc_subscriptions(plan_id);
  CREATE INDEX IF NOT EXISTS idx_amc_subscriptions_status ON amc_subscriptions(status);

  -- Partners & Commissions
  CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
  CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner ON partner_commissions(partner_id);
  CREATE INDEX IF NOT EXISTS idx_partner_commissions_booking ON partner_commissions(booking_id);
  CREATE INDEX IF NOT EXISTS idx_commission_rules_service ON commission_rules(service_id);

  -- Technician Fleet Tracking
  CREATE INDEX IF NOT EXISTS idx_tech_attendance_tech_date ON technician_attendance(technician_id, date);
  CREATE INDEX IF NOT EXISTS idx_tech_earnings_tech_date ON technician_earnings(technician_id, date);
  CREATE INDEX IF NOT EXISTS idx_tech_notifs_tech_read ON technician_notifications(technician_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_cust_notifs_cust_read ON customer_notifications(customer_id, is_read);

  -- CRM & Leads
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
  CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
  CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
  CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
  CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
  CREATE INDEX IF NOT EXISTS idx_lead_followups_lead_id ON lead_followups(lead_id);
  CREATE INDEX IF NOT EXISTS idx_lead_followups_scheduled ON lead_followups(scheduled_date, status);

  -- Support & Reviews
  CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
  CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
  CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);

  -- File Uploads
  CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
  CREATE INDEX IF NOT EXISTS idx_file_uploads_entity ON file_uploads(category, entity_id);

  -- HR & Payroll
  CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
  CREATE INDEX IF NOT EXISTS idx_employees_designation_id ON employees(designation_id);
  CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
  CREATE INDEX IF NOT EXISTS idx_employee_attendance_emp_date ON employee_attendance(employee_id, date);
  CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id);
  CREATE INDEX IF NOT EXISTS idx_payslips_run_id ON payslips(payroll_run_id);
  CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON payslips(employee_id);

  -- Audit Logs
  CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
`;
