import { Router } from 'express';
import { getDb } from '../../db/client.js';
import { memoryStore } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requireRole, requirePermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// Strictly guard all admin endpoints: require staff credentials
// Enforces staff role authorization: requireRole(['SUPER_ADMIN', 'MANAGER', 'SALES', 'FINANCE'])
router.use(authenticateUser);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'SALES_TEAM', 'FINANCE', 'MARKETING', 'OPERATIONS', 'SUPPORT', 'HR', 'PAYROLL']));

/**
 * GET /api/v1/admin/stats
 * Overview dashboard metrics (accessible to all internal staff)
 */
router.get('/stats', requirePermission('DASHBOARD_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();

    const [userCount, bookingCount, revenueSum, techCount] = await Promise.all([
      pglite.query(`SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL`),
      pglite.query(`SELECT COUNT(*) as count FROM bookings WHERE deleted_at IS NULL`),
      pglite.query(`SELECT SUM(total_amount) as total FROM bookings WHERE payment_status = 'PAID'`),
      pglite.query(`SELECT COUNT(*) as count FROM users WHERE role = 'TECHNICIAN' AND deleted_at IS NULL`),
    ]);

    const totalUsers = parseInt(userCount.rows[0]?.count || '0', 10) || memoryStore.users.length;
    const totalBookings = parseInt(bookingCount.rows[0]?.count || '0', 10) || memoryStore.bookings.length;
    const totalRevenue = parseFloat(revenueSum.rows[0]?.total || '0') || memoryStore.bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const activeTechnicians = parseInt(techCount.rows[0]?.count || '0', 10) || memoryStore.users.filter((u) => u.role === 'TECHNICIAN').length;

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalRevenue,
        activeTechnicians,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load admin stats';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/admin/users
 * Full user directory with roles (requires USER_VIEW permission)
 */
router.get('/users', requirePermission('USER_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const { role } = req.query;

    let query = `SELECT id, public_id, name, email, phone, role, status, created_at, last_login_at FROM users WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (role && typeof role === 'string') {
      query += ` AND role = $1`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const usersRes = await pglite.query(query, params);

    return res.json({
      success: true,
      data: usersRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch admin users';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/admin/bookings
 * Booking management oversight (requires BOOKING_VIEW permission)
 */
router.get('/bookings', requirePermission('BOOKING_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const bookingsRes = await pglite.query(`
      SELECT b.*, s.name as service_name, c.name as customer_name, c.phone as customer_phone,
             t.name as technician_name, t.phone as technician_phone
      FROM bookings b
      LEFT JOIN services s ON s.id = b.service_id
      LEFT JOIN users c ON c.id = b.customer_id
      LEFT JOIN users t ON t.id = b.technician_id
      WHERE b.deleted_at IS NULL
      ORDER BY b.scheduled_date DESC LIMIT 100
    `);

    return res.json({
      success: true,
      data: bookingsRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch admin bookings';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/admin/bookings/:id/assign
 * Assign or reassign technician to a booking (requires BOOKING_ASSIGN permission)
 */
router.post('/bookings/:id/assign', requirePermission('BOOKING_ASSIGN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const bookingId = req.params.id;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({ success: false, error: 'technicianId is required' });
    }

    // Verify technician user exists
    let tech: any = null;
    const techUser = await pglite.query(
      `SELECT id, name, phone FROM users WHERE (id = $1 OR public_id = $1) AND role = 'TECHNICIAN' AND deleted_at IS NULL LIMIT 1`,
      [technicianId]
    );

    if (techUser && techUser.rows.length > 0) {
      tech = techUser.rows[0];
    } else {
      const memTech = memoryStore.users.find(
        (u) => (u.id === technicianId || u.public_id === technicianId) && u.role === 'TECHNICIAN'
      );
      if (memTech) {
        tech = { id: memTech.id, name: memTech.name, phone: memTech.phone };
      }
    }

    if (!tech) {
      return res.status(404).json({ success: false, error: 'Technician not found or not active' });
    }

    // Assign to booking in database and update status to Assigned
    await pglite.query(
      `UPDATE bookings SET technician_id = $1, status = 'Assigned', updated_at = CURRENT_TIMESTAMP WHERE (id = $2 OR public_id = $2)`,
      [tech.id, bookingId]
    );

    // Also update in-memory store booking
    const memBooking = memoryStore.bookings.find((b) => b.id === bookingId || b.public_id === bookingId);
    if (memBooking) {
      memBooking.technician_id = tech.id;
      memBooking.technician_name = tech.name;
      memBooking.technician_phone = tech.phone;
      memBooking.status = 'Assigned';
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Admin',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'BOOKING_ASSIGN',
      entity: 'BOOKINGS',
      entityId: bookingId,
      newValue: { technicianId: tech.id, status: 'Assigned' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Technician ${tech.name} assigned successfully to booking ${bookingId}`,
      technician: tech,
      status: 'Assigned',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to assign technician to booking';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/admin/customers
 * Customer directory management (requires CUSTOMER_VIEW permission)
 */
router.get('/customers', requirePermission('CUSTOMER_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const customersRes = await pglite.query(`
      SELECT u.id, u.public_id, u.name, u.email, u.phone, u.city, u.status, u.created_at,
             cp.customer_type, cp.total_bookings_count, cp.tier
      FROM users u
      LEFT JOIN customer_profiles cp ON cp.user_id = u.id
      WHERE u.role = 'CUSTOMER' AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC LIMIT 100
    `);

    return res.json({
      success: true,
      data: customersRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch customers';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/admin/customers
 * Create a new customer record
 * Required permission: CUSTOMER_CREATE
 */
router.post('/customers', requirePermission('CUSTOMER_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const currentUser = req.user;
    const { name, email, phone, city, customer_type, notes } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Customer name is required (min 2 chars).' });
    }
    if (!phone || phone.trim().length < 8) {
      return res.status(400).json({ success: false, error: 'Valid phone number is required.' });
    }

    const nextSeq = memoryStore.users.length + 1;
    const publicId = `VXUSR-${String(nextSeq).padStart(6, '0')}`;
    const newCustId = `cust-${Date.now()}`;

    const newCustomer = {
      id: newCustId,
      public_id: publicId,
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : null,
      phone: phone.trim(),
      password_hash: null,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      profile_image: name.slice(0, 2).toUpperCase(),
      city_id: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: null,
      deleted_at: null,
    };

    memoryStore.users.push(newCustomer);
    memoryStore.customerProfiles.push({
      id: `cust-prof-${Date.now()}`,
      user_id: newCustId,
      customer_type: customer_type || 'INDIVIDUAL',
    });

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CUSTOMER_CREATED',
      entity: 'CUSTOMER',
      entityId: newCustId,
      newValue: { name, email, phone, customer_type },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: `Customer ${name} (${publicId}) created successfully.`,
      data: newCustomer,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create customer';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/v1/admin/customers/:id
 * Update customer details
 * Required permission: CUSTOMER_UPDATE (or CUSTOMER_EDIT)
 */
router.put('/customers/:id', requirePermission('CUSTOMER_UPDATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { name, email, phone, city, status } = req.body;

    const customer = memoryStore.users.find(
      (u) => (u.id === id || u.public_id === id) && u.role === 'CUSTOMER' && !u.deleted_at
    );

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    const oldValues = { name: customer.name, email: customer.email, phone: customer.phone, status: customer.status };

    if (name !== undefined) customer.name = name.trim();
    if (email !== undefined) customer.email = email ? email.trim().toLowerCase() : null;
    if (phone !== undefined) customer.phone = phone.trim();
    if (status !== undefined) customer.status = status;
    customer.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CUSTOMER_UPDATED',
      entity: 'CUSTOMER',
      entityId: customer.id,
      oldValue: oldValues,
      newValue: { name: customer.name, email: customer.email, phone: customer.phone, status: customer.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Customer ${customer.name} updated successfully.`,
      data: customer,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update customer';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * DELETE /api/v1/admin/customers/:id
 * Soft delete customer
 * Required permission: CUSTOMER_DELETE
 */
router.delete('/customers/:id', requirePermission('CUSTOMER_DELETE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const customer = memoryStore.users.find(
      (u) => (u.id === id || u.public_id === id) && u.role === 'CUSTOMER' && !u.deleted_at
    );

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    customer.deleted_at = new Date().toISOString();
    customer.status = 'DELETED';
    customer.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CUSTOMER_DELETED',
      entity: 'CUSTOMER',
      entityId: customer.id,
      oldValue: { name: customer.name, public_id: customer.public_id },
      newValue: { deleted_at: customer.deleted_at },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Customer ${customer.name} (${customer.public_id}) deleted successfully.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete customer';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/admin/technicians
 * Technician fleet management (requires TECHNICIAN_VIEW permission)
 */
router.get('/technicians', requirePermission('TECHNICIAN_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const techRes = await pglite.query(`
      SELECT u.id, u.public_id, u.name, u.email, u.phone, u.city, u.status, u.created_at,
             tp.rating, tp.completed_jobs_count, tp.is_on_duty, tp.kyc_status, tp.skills
      FROM users u
      LEFT JOIN technician_profiles tp ON tp.user_id = u.id
      WHERE u.role = 'TECHNICIAN' AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC LIMIT 100
    `);

    return res.json({
      success: true,
      data: techRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch technicians';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/admin/services
 * Catalog & Services management (requires SERVICE_VIEW permission)
 */
router.get('/services', requirePermission('SERVICE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const servicesRes = await pglite.query(`
      SELECT s.*, c.name as category_name
      FROM services s
      LEFT JOIN service_categories c ON c.id = s.category_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.sort_order ASC, s.name ASC
    `);

    return res.json({
      success: true,
      data: servicesRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch services';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/admin/amc
 * AMC contracts management (requires AMC_VIEW permission)
 */
router.get('/amc', requirePermission('AMC_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const amcRes = await pglite.query(`
      SELECT sub.*, p.name as plan_name, u.name as customer_name, u.phone as customer_phone
      FROM amc_subscriptions sub
      LEFT JOIN amc_plans p ON p.id = sub.plan_id
      LEFT JOIN users u ON u.id = sub.customer_id
      WHERE sub.deleted_at IS NULL
      ORDER BY sub.created_at DESC LIMIT 100
    `);

    return res.json({
      success: true,
      data: amcRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch AMC subscriptions';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/admin/invoices
 * Invoices list (requires INVOICE_VIEW permission - Finance & Super Admin)
 */
router.get('/invoices', requirePermission('INVOICE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const invoicesRes = await pglite.query(`
      SELECT b.id, b.public_id, b.total_amount, b.tax_amount, b.payment_status, b.created_at,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             s.name as service_name
      FROM bookings b
      LEFT JOIN users u ON u.id = b.customer_id
      LEFT JOIN services s ON s.id = b.service_id
      WHERE b.deleted_at IS NULL
      ORDER BY b.created_at DESC LIMIT 100
    `);

    return res.json({
      success: true,
      data: invoicesRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch invoices';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/admin/payments
 * Payments list (requires PAYMENT_VIEW permission - Finance & Super Admin)
 */
router.get('/payments', requirePermission('PAYMENT_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const paymentsRes = await pglite.query(`
      SELECT b.id, b.public_id, b.total_amount, b.payment_status, b.created_at,
             u.name as customer_name, u.phone as customer_phone
      FROM bookings b
      LEFT JOIN users u ON u.id = b.customer_id
      WHERE b.deleted_at IS NULL
      ORDER BY b.created_at DESC LIMIT 100
    `);

    return res.json({
      success: true,
      data: paymentsRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch payments';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/admin/audit-logs
 * Security audit trail (requires AUDIT_LOG_VIEW permission)
 */
router.get('/audit-logs', requirePermission('AUDIT_LOG_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const logsRes = await pglite.query(`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100
    `);

    return res.json({
      success: true,
      data: logsRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch audit logs';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/admin/settings
 * Platform system configuration (requires SETTINGS_VIEW permission)
 */
router.get('/settings', requirePermission('SETTINGS_VIEW'), async (req: AuthenticatedRequest, res) => {
  return res.json({
    success: true,
    data: {
      platformName: 'VERTEX Enterprise',
      version: '3.0.0-PROD',
      maintenanceMode: false,
      dispatchStrategy: 'NEAREST_ACTIVE_PARTNER',
      amcGracePeriodDays: 30,
      currency: 'INR',
      gstRatePercent: 18,
      supportEmail: 'support@bookvertex.com',
      supportPhone: '+91 1800 200 4567',
    },
  });
});

export default router;
