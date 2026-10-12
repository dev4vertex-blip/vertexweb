import { Router } from 'express';
import { getDb } from '../../db/client.js';
import { authenticateUser, AuthenticatedRequest, requirePlatform, requireRole, requirePermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// Strictly guard all Business Hub / admin endpoints: require valid BUSINESS platform credentials
router.use(authenticateUser);
router.use(requirePlatform('BUSINESS'));
router.use(requireRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'SALES_TEAM', 'FINANCE', 'MARKETING', 'OPERATIONS', 'SUPPORT', 'HR', 'PAYROLL', 'EMPLOYEE']));

/**
 * GET /api/v1/admin/stats
 * Overview dashboard metrics (accessible to all internal staff)
 */
router.get('/stats', requirePermission('DASHBOARD_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const currentUser = req.user;
    const { pglite } = await getDb();

    // Sales role isolation: Scoped to their own performance and targets
    if (currentUser && (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM')) {
      const [leadsRes, profileRes] = await Promise.all([
        pglite.query(`SELECT COUNT(*) as count FROM leads WHERE assigned_to = $1 AND deleted_at IS NULL`, [currentUser.id]),
        pglite.query(`SELECT revenue_generated, bookings_created FROM sales_profiles WHERE user_id = $1 LIMIT 1`, [currentUser.id]),
      ]);

      const ownRevenue = parseFloat(profileRes.rows[0]?.revenue_generated || '0');
      const ownBookings = parseInt(profileRes.rows[0]?.bookings_created || '0', 10);
      const ownLeadsCount = parseInt(leadsRes.rows[0]?.count || '0', 10);

      return res.json({
        success: true,
        scope: 'PERSONAL',
        data: {
          totalUsers: ownLeadsCount,
          totalBookings: ownBookings,
          totalRevenue: ownRevenue,
          activeTechnicians: 0,
        },
      });
    }

    const [userCount, bookingCount, revenueSum, techCount] = await Promise.all([
      pglite.query(`SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL`),
      pglite.query(`SELECT COUNT(*) as count FROM bookings WHERE deleted_at IS NULL`),
      pglite.query(`SELECT SUM(total_amount) as total FROM bookings WHERE payment_status = 'PAID'`),
      pglite.query(`SELECT COUNT(*) as count FROM users WHERE role = 'TECHNICIAN' AND deleted_at IS NULL`),
    ]);

    const totalUsers = parseInt(userCount.rows[0]?.count || '0', 10);
    const totalBookings = parseInt(bookingCount.rows[0]?.count || '0', 10);
    const totalRevenue = parseFloat(revenueSum.rows[0]?.total || '0');
    const activeTechnicians = parseInt(techCount.rows[0]?.count || '0', 10);

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
    const currentUser = req.user;

    const { pglite } = await getDb();

    // Sales role isolation: only see bookings created by or assigned to self
    if (currentUser && (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM')) {
      const ownBookingsRes = await pglite.query(`
        SELECT b.*, s.name as service_name, c.name as customer_name, c.phone as customer_phone,
               t.name as technician_name, t.phone as technician_phone
        FROM bookings b
        LEFT JOIN services s ON s.id = b.service_id
        LEFT JOIN users c ON c.id = b.customer_id
        LEFT JOIN users t ON t.id = b.technician_id
        WHERE b.deleted_at IS NULL AND (b.sales_rep_id = $1 OR b.created_by = $1)
        ORDER BY b.scheduled_date DESC LIMIT 100
      `, [currentUser.id]);
      return res.json({
        success: true,
        scope: 'PERSONAL',
        data: ownBookingsRes.rows,
      });
    }
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
    // Verify technician user exists
    const techUser = await pglite.query(
      `SELECT id, name, phone FROM users WHERE (id = $1 OR public_id = $1) AND role = 'TECHNICIAN' AND deleted_at IS NULL LIMIT 1`,
      [technicianId]
    );

    if (!techUser || techUser.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Technician not found or not active' });
    }

    const tech = techUser.rows[0];

    // Assign to booking in database and update status to Assigned
    await pglite.query(
      `UPDATE bookings SET technician_id = $1, status = 'Assigned', updated_at = CURRENT_TIMESTAMP WHERE (id = $2 OR public_id = $2)`,
      [tech.id, bookingId]
    );

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
    const currentUser = req.user;
    const { pglite } = await getDb();

    // Sales role isolation: only see customers assigned to their leads or created by them
    if (currentUser && (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM')) {
      const salesCustomersRes = await pglite.query(`
        SELECT DISTINCT u.id, u.public_id, u.name, u.email, u.phone, u.city, u.status, u.created_at,
               cp.customer_type, cp.total_bookings_count, cp.tier
        FROM users u
        LEFT JOIN customer_profiles cp ON cp.user_id = u.id
        LEFT JOIN leads l ON (l.phone = u.phone OR l.won_customer_id = u.id)
        WHERE u.role = 'CUSTOMER' AND u.deleted_at IS NULL AND (l.assigned_to = $1 OR l.created_by = $1)
        ORDER BY u.created_at DESC LIMIT 100
      `, [currentUser.id]);
      return res.json({
        success: true,
        scope: 'PERSONAL',
        data: salesCustomersRes.rows,
      });
    }

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

    const countRes = await pglite.query(`SELECT COUNT(*) as count FROM users`);
    const nextSeq = parseInt(countRes.rows[0]?.count || '0', 10) + 1;
    const publicId = `VXUSR-${String(nextSeq).padStart(6, '0')}`;
    const newCustId = crypto.randomUUID();

    const insertUserRes = await pglite.query(
      `INSERT INTO users (id, public_id, name, email, phone, role, status, profile_image, city_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'CUSTOMER', 'ACTIVE', $6, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [newCustId, publicId, name.trim(), email ? email.trim().toLowerCase() : null, phone.trim(), name.slice(0, 2).toUpperCase()]
    );

    await pglite.query(
      `INSERT INTO customer_profiles (id, user_id, customer_type, notes, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO NOTHING`,
      [crypto.randomUUID(), newCustId, customer_type || 'INDIVIDUAL', notes || null]
    );

    const newCustomer = insertUserRes.rows[0];

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
    const { name, email, phone, status } = req.body;
    const { pglite } = await getDb();

    const customerRes = await pglite.query(
      `SELECT * FROM users WHERE (id = $1 OR public_id = $1) AND role = 'CUSTOMER' AND deleted_at IS NULL LIMIT 1`,
      [id]
    );

    if (customerRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    const customer = customerRes.rows[0];

    const oldValues = { name: customer.name, email: customer.email, phone: customer.phone, status: customer.status };

    const updateRes = await pglite.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        name !== undefined ? name.trim() : null,
        email !== undefined ? email.trim().toLowerCase() : null,
        phone !== undefined ? phone.trim() : null,
        status !== undefined ? status : null,
        customer.id,
      ]
    );

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
      data: updateRes.rows[0],
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
    const { pglite } = await getDb();

    const customerRes = await pglite.query(
      `SELECT * FROM users WHERE (id = $1 OR public_id = $1) AND role = 'CUSTOMER' AND deleted_at IS NULL LIMIT 1`,
      [id]
    );

    if (customerRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    const customer = customerRes.rows[0];

    await pglite.query(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP, status = 'DELETED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [customer.id]
    );

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CUSTOMER_DELETED',
      entity: 'CUSTOMER',
      entityId: customer.id,
      oldValue: { name: customer.name, public_id: customer.public_id },
      newValue: { status: 'DELETED' },
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
      SELECT inv.id, inv.invoice_number, inv.booking_id, inv.customer_id, inv.customer_name,
             inv.customer_email, inv.customer_phone, inv.subtotal, inv.discount_amount,
             inv.tax_amount, inv.grand_total, inv.amount_paid, inv.balance_amount,
             inv.currency, inv.status, inv.issued_at, inv.paid_at,
             b.public_id as booking_public_id, s.name as service_name
      FROM invoices inv
      LEFT JOIN bookings b ON b.id = inv.booking_id
      LEFT JOIN services s ON s.id = b.service_id
      WHERE inv.deleted_at IS NULL
      ORDER BY inv.issued_at DESC LIMIT 100
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
      SELECT p.*, b.public_id as booking_public_id
      FROM payments p
      LEFT JOIN bookings b ON b.id = p.booking_id
      ORDER BY p.collected_at DESC LIMIT 100
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
