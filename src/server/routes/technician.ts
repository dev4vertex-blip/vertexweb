import { Router } from 'express';
import { getDb } from '../../db/client.js';
import { bookingRepository } from '../repositories/bookingRepository.js';
import { authenticateUser, AuthenticatedRequest, requirePlatform, requireRole } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// Platform boundary: strictly isolated to PARTNER platform tokens and TECHNICIAN / PARTNER role.
// Internal staff cannot access partner self-service routes (staff use Business Hub fleet management).
router.use(authenticateUser);
router.use(requirePlatform('PARTNER'));
router.use(requireRole(['TECHNICIAN', 'PARTNER']));

/**
 * GET /api/v1/technician/profile
 */
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const techRes = await pglite.query(
      `SELECT u.id, u.public_id, u.name, u.email, u.phone, u.city, u.avatar_url,
              tp.rating, tp.completed_jobs_count, tp.is_on_duty, tp.kyc_status, tp.skills
       FROM users u
       LEFT JOIN technician_profiles tp ON tp.user_id = u.id
       WHERE u.id = $1 LIMIT 1`,
      [userId]
    );

    if (techRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Technician profile not found' });
    }

    return res.json({
      success: true,
      data: techRes.rows[0],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch technician profile';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/technician/jobs
 * Get jobs assigned to THIS technician ONLY
 */
router.get('/jobs', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    // Notice: We intentionally do NOT return the otp in the job listing to prevent leak!
    const jobsRes = await pglite.query(
      `SELECT b.id, b.public_id, b.service_id, b.scheduled_date, b.time_slot,
              b.status, b.service_address, b.total_amount,
              s.name as service_name, c.name as customer_name, c.phone as customer_phone
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN users c ON c.id = b.customer_id
       WHERE b.technician_id = $1 AND b.deleted_at IS NULL
       ORDER BY b.scheduled_date ASC`,
      [userId]
    );

    return res.json({
      success: true,
      data: jobsRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch technician jobs';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/technician/jobs/:id
 * Get details for a specific assigned job with STRICT SERVER-SIDE OWNERSHIP VALIDATION
 * A technician can ONLY view jobs assigned to themselves.
 */
router.get('/jobs/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const jobId = req.params.id;

    const jobRes = await pglite.query(
      `SELECT b.*, s.name as service_name, c.name as customer_name, c.phone as customer_phone
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN users c ON c.id = b.customer_id
       WHERE (b.id = $1 OR b.public_id = $1) AND b.deleted_at IS NULL
       LIMIT 1`,
      [jobId]
    );

    if (jobRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const job = jobRes.rows[0];

    // STRICT SERVER-SIDE JOB OWNERSHIP AUTHORIZATION
    const isAssignedTech = job.technician_id === userId;
    const isStaff = ['SUPER_ADMIN', 'MANAGER'].includes(req.user?.role || '');

    if (!isAssignedTech && !isStaff) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You are not authorized to access this job. It is not assigned to you.',
      });
    }

    return res.json({
      success: true,
      data: job,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch job details';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Helper to check job ownership before performing lifecycle state changes
 */
async function authorizeJobAction(jobId: string, userId?: string, userRole?: string) {
  const { pglite } = await getDb();
  const jobRes = await pglite.query(
    `SELECT * FROM bookings WHERE (id = $1 OR public_id = $1) AND deleted_at IS NULL LIMIT 1`,
    [jobId]
  );

  if (jobRes.rows.length === 0) {
    return { ok: false, status: 404, error: 'Job not found', job: null };
  }

  const job = jobRes.rows[0];
  const isAssigned = job.technician_id === userId;
  const isStaff = ['SUPER_ADMIN', 'MANAGER'].includes(userRole || '');

  if (!isAssigned && !isStaff) {
    return {
      ok: false,
      status: 403,
      error: 'Forbidden: You cannot modify a job assigned to another technician.',
      job: null,
    };
  }

  return { ok: true, status: 200, error: null, job };
}

/**
 * POST /api/v1/technician/jobs/:id/accept
 */
router.post('/jobs/:id/accept', async (req: AuthenticatedRequest, res) => {
  try {
    const authCheck = await authorizeJobAction(req.params.id, req.user?.id, req.user?.role);
    if (!authCheck.ok) {
      return res.status(authCheck.status).json({ success: false, error: authCheck.error });
    }

    const currentStatus = authCheck.job.status;
    if (currentStatus !== 'Pending' && currentStatus !== 'Assigned') {
      return res.status(400).json({
        success: false,
        error: `Invalid transition: Job in '${currentStatus}' state cannot be accepted. Must be 'Pending' or 'Assigned'.`,
      });
    }

    const { pglite } = await getDb();
    await pglite.query(
      `UPDATE bookings SET status = $1 WHERE id = $2`,
      ['Accepted', authCheck.job.id]
    );

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Technician',
      userRole: req.user?.role || 'TECHNICIAN',
      action: 'JOB_ACCEPTED',
      entity: 'BOOKINGS',
      entityId: authCheck.job.id,
      oldValue: { status: currentStatus },
      newValue: { status: 'Accepted' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, status: 'Accepted', message: 'Job accepted successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to accept job';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/technician/jobs/:id/reject
 */
router.post('/jobs/:id/reject', async (req: AuthenticatedRequest, res) => {
  try {
    const authCheck = await authorizeJobAction(req.params.id, req.user?.id, req.user?.role);
    if (!authCheck.ok) {
      return res.status(authCheck.status).json({ success: false, error: authCheck.error });
    }

    const currentStatus = authCheck.job.status;
    if (currentStatus !== 'Pending' && currentStatus !== 'Assigned' && currentStatus !== 'Accepted') {
      return res.status(400).json({
        success: false,
        error: `Invalid transition: Job in '${currentStatus}' state cannot be rejected.`,
      });
    }

    const { pglite } = await getDb();
    await pglite.query(
      `UPDATE bookings SET technician_id = NULL, status = 'Pending' WHERE id = $1`,
      [authCheck.job.id]
    );

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Technician',
      userRole: req.user?.role || 'TECHNICIAN',
      action: 'JOB_REJECTED',
      entity: 'BOOKINGS',
      entityId: authCheck.job.id,
      oldValue: { status: currentStatus, technician_id: req.user?.id },
      newValue: { status: 'Pending', technician_id: null },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, status: 'Pending', message: 'Job rejected and unassigned' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reject job';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/technician/jobs/:id/en-route
 */
router.post('/jobs/:id/en-route', async (req: AuthenticatedRequest, res) => {
  try {
    const authCheck = await authorizeJobAction(req.params.id, req.user?.id, req.user?.role);
    if (!authCheck.ok) {
      return res.status(authCheck.status).json({ success: false, error: authCheck.error });
    }

    const currentStatus = authCheck.job.status;
    if (currentStatus !== 'Accepted') {
      return res.status(400).json({
        success: false,
        error: `Invalid transition: Job must be 'Accepted' before marking 'En Route'. Current state: '${currentStatus}'.`,
      });
    }

    const { pglite } = await getDb();
    await pglite.query(
      `UPDATE bookings SET status = $1 WHERE id = $2`,
      ['En Route', authCheck.job.id]
    );

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Technician',
      userRole: req.user?.role || 'TECHNICIAN',
      action: 'JOB_EN_ROUTE',
      entity: 'BOOKINGS',
      entityId: authCheck.job.id,
      oldValue: { status: currentStatus },
      newValue: { status: 'En Route' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, status: 'En Route', message: 'Technician is en route' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update to en route';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/technician/jobs/:id/arrived
 */
router.post('/jobs/:id/arrived', async (req: AuthenticatedRequest, res) => {
  try {
    const authCheck = await authorizeJobAction(req.params.id, req.user?.id, req.user?.role);
    if (!authCheck.ok) {
      return res.status(authCheck.status).json({ success: false, error: authCheck.error });
    }

    const currentStatus = authCheck.job.status;
    if (currentStatus !== 'En Route') {
      return res.status(400).json({
        success: false,
        error: `Invalid transition: Job must be 'En Route' before marking 'Arrived'. Current state: '${currentStatus}'.`,
      });
    }

    const { pglite } = await getDb();
    await pglite.query(
      `UPDATE bookings SET status = $1 WHERE id = $2`,
      ['Arrived', authCheck.job.id]
    );

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Technician',
      userRole: req.user?.role || 'TECHNICIAN',
      action: 'JOB_ARRIVED',
      entity: 'BOOKINGS',
      entityId: authCheck.job.id,
      oldValue: { status: currentStatus },
      newValue: { status: 'Arrived' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, status: 'Arrived', message: 'Technician arrived at location' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to mark arrival';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/technician/jobs/:id/start
 * Verifies Doorstep OTP and marks service started
 */
router.post('/jobs/:id/start', async (req: AuthenticatedRequest, res) => {
  try {
    const authCheck = await authorizeJobAction(req.params.id, req.user?.id, req.user?.role);
    if (!authCheck.ok) {
      return res.status(authCheck.status).json({ success: false, error: authCheck.error });
    }

    const currentStatus = authCheck.job.status;
    if (currentStatus !== 'Arrived') {
      return res.status(400).json({
        success: false,
        error: `Invalid transition: Technician must arrive before starting service. Current state: '${currentStatus}'.`,
      });
    }

    const { otp } = req.body;
    const requiredOtp = authCheck.job.otp;

    if (!requiredOtp || String(otp).trim() !== String(requiredOtp).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid doorstep verification OTP. Please ask customer for correct 4-digit code.',
      });
    }

    const { pglite } = await getDb();
    await pglite.query(
      `UPDATE bookings SET status = $1 WHERE id = $2`,
      ['In Progress', authCheck.job.id]
    );

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Technician',
      userRole: req.user?.role || 'TECHNICIAN',
      action: 'JOB_STARTED',
      entity: 'BOOKINGS',
      entityId: authCheck.job.id,
      oldValue: { status: currentStatus },
      newValue: { status: 'In Progress' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      status: 'In Progress',
      message: 'OTP verified. Service started successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to start service';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/technician/jobs/:id/complete
 * Submit Service Report & Mark Job as Completed
 */
router.post('/jobs/:id/complete', async (req: AuthenticatedRequest, res) => {
  try {
    const authCheck = await authorizeJobAction(req.params.id, req.user?.id, req.user?.role);
    if (!authCheck.ok) {
      return res.status(authCheck.status).json({ success: false, error: authCheck.error });
    }

    const currentStatus = authCheck.job.status;
    const { otp, workPerformed, partsUsed, technicianNotes, customerRemarks } = req.body;

    // Doorstep OTP validation: If job is 'Arrived' and OTP is provided, verify OTP before completing;
    // If job is already 'In Progress', OTP was verified during doorstep arrival.
    if (currentStatus === 'Arrived') {
      const requiredOtp = authCheck.job.otp;
      if (!requiredOtp || !otp || String(otp).trim() !== String(requiredOtp).trim()) {
        return res.status(400).json({
          success: false,
          error: 'Doorstep verification OTP is required to complete this job. Please enter the 4-digit code provided by the customer.',
        });
      }
    } else if (currentStatus !== 'In Progress') {
      return res.status(400).json({
        success: false,
        error: `Invalid transition: Job must be 'In Progress' or 'Arrived' (with valid OTP) before completion. Current state: '${currentStatus}'.`,
      });
    }

    const earningAmount = Number(authCheck.job.technician_cut) || Math.round((Number(authCheck.job.total_amount) || 0) * 0.7);

    const completedBooking = await bookingRepository.completeBookingWithTransaction(
      authCheck.job.id,
      {
        workPerformed: workPerformed || 'Standard service procedure completed.',
        partsUsed: partsUsed || 'None',
        technicianNotes: technicianNotes || 'All diagnostic tests passed.',
        customerRemarks: customerRemarks || 'Customer signed off satisfaction.',
      },
      req.user?.id || authCheck.job.technician_id,
      earningAmount
    );

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name || 'Technician',
      userRole: req.user?.role || 'TECHNICIAN',
      action: 'JOB_COMPLETED',
      entity: 'BOOKINGS',
      entityId: authCheck.job.id,
      oldValue: { status: currentStatus },
      newValue: { status: 'Completed', workPerformed, partsUsed },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      status: 'Completed',
      message: 'Service report submitted. Job completed successfully.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to complete job';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/technician/earnings
 */
router.get('/earnings', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const earnRes = await pglite.query(
      `SELECT * FROM technician_earnings WHERE technician_id = $1`,
      [userId]
    );

    return res.json({
      success: true,
      data: earnRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch technician earnings';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/technician/attendance
 */
router.get('/attendance', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const attRes = await pglite.query(
      `SELECT * FROM technician_attendance WHERE technician_id = $1`,
      [userId]
    );

    return res.json({
      success: true,
      data: attRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch attendance records';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/technician/attendance/punch
 * Biometric punch toggle
 */
router.post('/attendance/punch', async (req: AuthenticatedRequest, res) => {
  try {
    const { isCheckedIn } = req.body;
    return res.json({
      success: true,
      isCheckedIn: Boolean(isCheckedIn),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to record attendance punch';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/technician/notifications
 */
router.get('/notifications', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;

    const notifRes = await pglite.query(
      `SELECT * FROM technician_notifications WHERE technician_id = $1`,
      [userId]
    );

    return res.json({
      success: true,
      data: notifRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch notifications';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/technician/duty-toggle
 * Update technician on-duty status
 * Strict server-side verification: Technician can only toggle their OWN duty status
 */
router.post('/duty-toggle', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const userId = req.user?.id;
    const { isOnDuty, technicianId } = req.body;

    // Reject attempt to change another technician's status
    if (technicianId && technicianId !== userId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot change another technician\'s duty status',
      });
    }

    if (isOnDuty === undefined || isOnDuty === null) {
      return res.status(400).json({
        success: false,
        error: 'isOnDuty boolean value is required',
      });
    }

    const dutyState = typeof isOnDuty === 'boolean' ? isOnDuty : String(isOnDuty).toLowerCase() === 'true';

    await pglite.query(
      `UPDATE technician_profiles SET is_on_duty = $1 WHERE user_id = $2`,
      [dutyState, userId]
    );

    await logAuditEvent({
      userId,
      userName: req.user?.name || 'Technician',
      userRole: req.user?.role || 'TECHNICIAN',
      action: 'TECHNICIAN_DUTY_TOGGLE',
      entity: 'TECHNICIAN_PROFILES',
      entityId: userId,
      newValue: { isOnDuty: dutyState },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, isOnDuty: dutyState, technicianId: userId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle technician duty';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
