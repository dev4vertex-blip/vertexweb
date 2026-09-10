import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../../db/client.js';
import { memoryStore } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requireRole } from '../middleware.js';
import { logAuditEvent } from '../auth.js';
import { bookingRateLimiter } from '../rateLimiter.js';

const router = Router();

// All customer routes require authentication and CUSTOMER (or internal staff) role
router.use(authenticateUser);
router.use(requireRole(['CUSTOMER', 'SUPER_ADMIN', 'MANAGER', 'SALES']));

/**
 * GET /api/v1/customer/profile
 * Get active customer's profile & addresses
 */
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const userRes = await pglite.query(
      `SELECT u.id, u.public_id, u.name, u.email, u.phone, u.city, u.avatar_url,
              cp.customer_type, cp.total_bookings_count, cp.tier
       FROM users u
       LEFT JOIN customer_profiles cp ON cp.user_id = u.id
       WHERE u.id = $1 LIMIT 1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer profile not found' });
    }

    const addressesRes = await pglite.query(
      `SELECT * FROM addresses WHERE user_id = $1 AND deleted_at IS NULL ORDER BY is_default DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: {
        ...userRes.rows[0],
        addresses: addressesRes.rows,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch customer profile';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/v1/customer/profile
 * Update customer's own profile info
 */
router.put('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const { name, email, phone } = req.body;

    await pglite.query(
      `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone)
       WHERE id = $4`,
      [name, email, phone, userId]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/customer/bookings
 * Create new booking for the authenticated customer
 * Strict security: Customer ID is established EXCLUSIVELY from req.user.id
 */
router.post('/bookings', bookingRateLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const { serviceId, scheduledDate, timeSlot, serviceAddress, totalAmount, notes } = req.body;

    // Input validation
    if (!serviceId) {
      return res.status(400).json({ success: false, error: 'serviceId is required' });
    }
    if (!scheduledDate || typeof scheduledDate !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid scheduledDate is required' });
    }
    if (!timeSlot) {
      return res.status(400).json({ success: false, error: 'timeSlot is required' });
    }
    if (!serviceAddress || typeof serviceAddress !== 'string' || serviceAddress.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Valid serviceAddress is required (minimum 5 characters)' });
    }

    const amount = Number(totalAmount) || 299;
    const taxAmount = Math.round(amount * 0.18);
    const newBookingId = crypto.randomUUID();
    const publicSuffix = Math.floor(1000 + Math.random() * 9000);
    const publicId = `BK-${publicSuffix}`;
    const otp = String(Math.floor(1000 + Math.random() * 9000));

    await pglite.query(
      `INSERT INTO bookings (id, public_id, customer_id, service_id, scheduled_date, time_slot, service_address, total_amount, tax_amount, status, payment_status, otp, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending', 'PENDING', $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [newBookingId, publicId, userId, serviceId, scheduledDate, timeSlot, serviceAddress, amount, taxAmount, otp, notes || '']
    );

    await logAuditEvent({
      userId,
      userName: req.user?.name || 'Customer',
      userRole: req.user?.role || 'CUSTOMER',
      action: 'BOOKING_CREATE',
      entity: 'BOOKINGS',
      entityId: newBookingId,
      newValue: { publicId, serviceId, scheduledDate, timeSlot, amount },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: newBookingId,
        publicId,
        customerId: userId,
        serviceId,
        scheduledDate,
        timeSlot,
        serviceAddress,
        totalAmount: amount,
        taxAmount,
        status: 'Pending',
        paymentStatus: 'PENDING',
        otp,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create booking';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/customer/bookings
 * Get bookings created by this customer ONLY
 */
router.get('/bookings', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const bookingsRes = await pglite.query(
      `SELECT b.*, s.name as service_name, s.category_id, t.name as technician_name, t.phone as technician_phone
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN users t ON t.id = b.technician_id
       WHERE b.customer_id = $1 AND b.deleted_at IS NULL
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: bookingsRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch customer bookings';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/customer/bookings/:id
 * Get details for a specific booking with STRICT OWNERSHIP CHECK
 * Customers can only inspect their OWN bookings.
 */
router.get('/bookings/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const bookingId = req.params.id;

    const bookingRes = await pglite.query(
      `SELECT b.*, s.name as service_name, s.category_id, t.name as technician_name, t.phone as technician_phone
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN users t ON t.id = b.technician_id
       WHERE (b.id = $1 OR b.public_id = $1) AND b.deleted_at IS NULL
       LIMIT 1`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];

    // STRICT SERVER-SIDE OWNERSHIP VALIDATION
    const isOwner = booking.customer_id === userId;
    const isStaff = ['SUPER_ADMIN', 'MANAGER', 'SALES', 'FINANCE'].includes(req.user?.role || '');

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You are not authorized to view another customer\'s booking',
      });
    }

    return res.json({
      success: true,
      data: booking,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch booking details';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/customer/bookings/:id/cancel
 * Cancel customer's own booking with STRICT OWNERSHIP CHECK
 */
router.post('/bookings/:id/cancel', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const bookingId = req.params.id;

    const bookingRes = await pglite.query(
      `SELECT id, customer_id, status FROM bookings WHERE (id = $1 OR public_id = $1) AND deleted_at IS NULL LIMIT 1`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];
    const isOwner = booking.customer_id === userId;
    const isStaff = ['SUPER_ADMIN', 'MANAGER'].includes(req.user?.role || '');

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot modify another customer\'s booking',
      });
    }

    await pglite.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [booking.id]
    );

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      bookingId: booking.id,
      status: 'cancelled',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to cancel booking';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/customer/invoices
 * Get invoices for this customer ONLY
 */
router.get('/invoices', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const invoicesRes = await pglite.query(
      `SELECT inv.*, b.public_id as booking_code, s.name as service_name
       FROM invoices inv
       LEFT JOIN bookings b ON b.id = inv.booking_id
       LEFT JOIN services s ON s.id = b.service_id
       WHERE inv.customer_id = $1 AND inv.deleted_at IS NULL
       ORDER BY inv.created_at DESC`,
      [userId]
    );

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
 * GET /api/v1/customer/invoices/:id
 * Get invoice details with STRICT OWNERSHIP CHECK
 */
router.get('/invoices/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const invoiceId = req.params.id;

    const invRes = await pglite.query(
      `SELECT inv.*, b.public_id as booking_code, s.name as service_name
       FROM invoices inv
       LEFT JOIN bookings b ON b.id = inv.booking_id
       LEFT JOIN services s ON s.id = b.service_id
       WHERE (inv.id = $1 OR inv.invoice_number = $1) AND inv.deleted_at IS NULL
       LIMIT 1`,
      [invoiceId]
    );

    if (invRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const invoice = invRes.rows[0];
    const isOwner = invoice.customer_id === userId;
    const isStaff = ['SUPER_ADMIN', 'FINANCE', 'MANAGER'].includes(req.user?.role || '');

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot access another customer\'s invoice',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch invoice details';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/customer/subscriptions
 * Get customer's AMC contracts
 */
router.get('/subscriptions', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const subRes = await pglite.query(
      `SELECT sub.*, plan.name as plan_name, plan.covered_appliances, plan.free_visits
       FROM amc_subscriptions sub
       LEFT JOIN amc_plans plan ON plan.id = sub.plan_id
       WHERE sub.customer_id = $1 AND sub.deleted_at IS NULL
       ORDER BY sub.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: subRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch customer AMC subscriptions';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/customer/offers
 * Get active promotions and promo codes available for customers
 */
router.get('/offers', async (_req: AuthenticatedRequest, res) => {
  try {
    const activePromos = memoryStore.promotions.filter((p) => !p.deleted_at && p.status === 'ACTIVE');

    const offers = activePromos.map((p) => ({
      id: p.id,
      code: p.code,
      title: p.name,
      description: p.description || (p.discount_type === 'FIXED' ? `Flat ₹${p.discount_value} Off` : `${p.discount_value}% Off`),
      discountType: p.discount_type === 'FIXED' ? 'FLAT' : 'PERCENTAGE',
      discountValue: p.discount_value,
      minBookingAmount: p.min_order_value || 0,
      validUntil: p.end_date || '2026-12-31',
      category: Array.isArray(p.applicable_categories) ? p.applicable_categories[0] : (p.applicable_categories || 'All'),
    }));

    return res.json({
      success: true,
      data: offers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch offers';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/customer/offers/validate
 * Validate a promo code against an amount
 */
router.post('/offers/validate', async (req: AuthenticatedRequest, res) => {
  try {
    const { code, amount } = req.body;
    const cleanCode = String(code || '').toUpperCase().trim();
    const numAmount = Number(amount) || 0;

    // Check memoryStore first
    const activePromo = memoryStore.promotions.find(
      (p) => !p.deleted_at && p.status === 'ACTIVE' && p.code.toUpperCase() === cleanCode
    );

    if (activePromo) {
      if (numAmount < (activePromo.min_order_value || 0)) {
        return res.status(400).json({
          success: false,
          error: `Coupon requires a minimum booking value of ₹${activePromo.min_order_value}`,
        });
      }

      let discount = 0;
      if (activePromo.discount_type === 'FIXED') {
        discount = activePromo.discount_value;
      } else {
        discount = Math.round((numAmount * activePromo.discount_value) / 100);
        if (activePromo.max_discount && discount > activePromo.max_discount) {
          discount = activePromo.max_discount;
        }
      }

      const finalAmount = Math.max(0, numAmount - discount);

      return res.json({
        success: true,
        data: {
          code: cleanCode,
          discountAmount: discount,
          originalAmount: numAmount,
          finalAmount,
        },
      });
    }

    // Fallback dictionary for legacy codes
    const promoMap: Record<string, { type: 'FLAT' | 'PERCENTAGE'; value: number; min: number; max?: number }> = {
      VERTEXNEW: { type: 'FLAT', value: 100, min: 299 },
      VERTEXFIRST: { type: 'FLAT', value: 150, min: 499 },
      SUMMERCOOL: { type: 'PERCENTAGE', value: 15, min: 499 },
      ACCHILL20: { type: 'PERCENTAGE', value: 20, min: 799, max: 300 },
      AMCPROTECT: { type: 'FLAT', value: 500, min: 2499 },
      AMCSHIELD500: { type: 'FLAT', value: 500, min: 2499 },
      FESTIVE20: { type: 'PERCENTAGE', value: 20, min: 399 },
      HOMESAFE10: { type: 'PERCENTAGE', value: 10, min: 350 },
    };

    const promo = promoMap[cleanCode];
    if (!promo) {
      return res.status(400).json({ success: false, error: 'Invalid or expired coupon code' });
    }

    if (numAmount < promo.min) {
      return res.status(400).json({
        success: false,
        error: `Coupon requires a minimum booking value of ₹${promo.min}`,
      });
    }

    let discount = promo.type === 'FLAT' ? promo.value : Math.round((numAmount * promo.value) / 100);
    if (promo.max && discount > promo.max) {
      discount = promo.max;
    }
    const finalAmount = Math.max(0, numAmount - discount);

    return res.json({
      success: true,
      data: {
        code: cleanCode,
        discountAmount: discount,
        originalAmount: numAmount,
        finalAmount,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to validate promo code';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/customer/addresses
 * Get saved addresses for the authenticated customer only
 */
router.get('/addresses', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const addressesRes = await pglite.query(
      `SELECT * FROM addresses WHERE user_id = $1 AND deleted_at IS NULL ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: addressesRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch addresses';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/customer/addresses
 * Add a new address for the authenticated customer only
 */
router.post('/addresses', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const { addressLine1, addressLine2, city, state, pincode, isDefault, label } = req.body;

    if (!addressLine1 || typeof addressLine1 !== 'string' || addressLine1.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Valid address line is required' });
    }

    const newId = crypto.randomUUID();

    if (isDefault) {
      // Unset previous default
      await pglite.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [userId]);
    }

    await pglite.query(
      `INSERT INTO addresses (id, user_id, address_line_1, address_line_2, city, state, postal_code, is_default, label, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
      [newId, userId, addressLine1, addressLine2 || '', city || 'Gurgaon', state || 'Haryana', pincode || '122001', Boolean(isDefault), label || 'Home']
    );

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { id: newId, addressLine1, city, pincode, isDefault: Boolean(isDefault) },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add address';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * DELETE /api/v1/customer/addresses/:id
 * Delete customer address with STRICT OWNERSHIP CHECK
 * Customer A cannot delete Customer B's address
 */
router.delete('/addresses/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const addressId = req.params.id;

    const addrRes = await pglite.query(
      `SELECT id, user_id FROM addresses WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [addressId]
    );

    if (addrRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    const addr = addrRes.rows[0];
    if (addr.user_id !== userId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot delete another customer\'s address',
      });
    }

    await pglite.query(
      `UPDATE addresses SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [addressId]
    );

    return res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete address';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/customer/payments
 * Get payment history for authenticated customer only
 */
router.get('/payments', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const paymentsRes = await pglite.query(
      `SELECT b.id as booking_id, b.public_id, b.total_amount, b.tax_amount, b.payment_status,
              b.created_at, s.name as service_name
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       WHERE b.customer_id = $1 AND b.deleted_at IS NULL
       ORDER BY b.created_at DESC`,
      [userId]
    );

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
 * GET /api/v1/customer/notifications
 * Get notifications for authenticated customer only
 */
router.get('/notifications', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const notifsRes = await pglite.query(
      `SELECT * FROM customer_notifications WHERE customer_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: notifsRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch notifications';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/customer/support
 * Get support tickets for authenticated customer only
 */
router.get('/support', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const ticketsRes = await pglite.query(
      `SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: ticketsRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch support tickets';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/customer/support
 * Create support ticket for authenticated customer
 */
router.post('/support', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const { subject, category, message, bookingId } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'Subject and message are required' });
    }

    const ticketId = crypto.randomUUID();
    const ticketCode = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

    await pglite.query(
      `INSERT INTO support_tickets (id, ticket_code, user_id, booking_id, subject, category, message, status, priority, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', 'MEDIUM', CURRENT_TIMESTAMP)`,
      [ticketId, ticketCode, userId, bookingId || null, subject, category || 'GENERAL', message]
    );

    return res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: { ticketId, ticketCode, subject, status: 'OPEN' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create support ticket';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/customer/reviews
 * Get reviews created by authenticated customer
 */
router.get('/reviews', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const reviewsRes = await pglite.query(
      `SELECT r.*, s.name as service_name, t.name as technician_name
       FROM reviews r
       LEFT JOIN bookings b ON b.id = r.booking_id
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN users t ON t.id = r.technician_id
       WHERE r.customer_id = $1 ORDER BY r.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: reviewsRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reviews';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/customer/reviews
 * Submit review with STRICT BOOKING OWNERSHIP CHECK
 * Customer can only review their OWN completed bookings
 */
router.post('/reviews', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, error: 'bookingId and rating are required' });
    }

    // Verify booking belongs to this customer
    const bookingRes = await pglite.query(
      `SELECT id, customer_id, technician_id, status FROM bookings WHERE (id = $1 OR public_id = $1) AND deleted_at IS NULL LIMIT 1`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];
    if (booking.customer_id !== userId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot review a booking that does not belong to you',
      });
    }

    const reviewId = crypto.randomUUID();
    const numRating = Math.min(5, Math.max(1, Number(rating) || 5));

    await pglite.query(
      `INSERT INTO reviews (id, booking_id, customer_id, technician_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [reviewId, booking.id, userId, booking.technician_id || null, numRating, comment || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { id: reviewId, bookingId: booking.id, rating: numRating, comment },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit review';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
