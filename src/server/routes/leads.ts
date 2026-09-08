import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../../db/client.js';
import { memoryStore, LeadRecord, LeadFollowupRecord } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePermission, requireAnyPermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// All lead management endpoints require authentication
router.use(authenticateUser);

/**
 * GET /api/v1/leads
 * List leads with filtering, search, and pagination
 * Required permission: LEAD_VIEW
 */
router.get('/', requirePermission('LEAD_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const currentUser = req.user;

    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const stageFilter = (req.query.stage as string || '').trim().toUpperCase();
    const statusFilter = (req.query.status as string || '').trim().toUpperCase();
    const assignedFilter = (req.query.assignedTo as string || '').trim();
    const search = (req.query.search as string || '').trim().toLowerCase();

    // Check in-memory store
    let leads = [...memoryStore.leads].filter((l) => !l.deleted_at);

    // Filter by role scope: If sales rep, only see assigned leads (unless super_admin, admin, or manager)
    if (['SALES', 'SALES_TEAM'].includes(currentUser.role) && !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      if (req.query.onlyAssigned === 'true') {
        leads = leads.filter((l) => l.assigned_to === currentUser.id);
      }
    }

    if (stageFilter && stageFilter !== 'ALL') {
      leads = leads.filter((l) => l.stage.toUpperCase() === stageFilter);
    }

    if (statusFilter && statusFilter !== 'ALL') {
      leads = leads.filter((l) => l.status.toUpperCase() === statusFilter);
    }

    if (assignedFilter && assignedFilter !== 'ALL') {
      leads = leads.filter((l) => l.assigned_to === assignedFilter);
    }

    if (search) {
      leads = leads.filter(
        (l) =>
          l.customer_name.toLowerCase().includes(search) ||
          (l.email && l.email.toLowerCase().includes(search)) ||
          l.phone.includes(search) ||
          l.public_id.toLowerCase().includes(search) ||
          l.service_interest.toLowerCase().includes(search)
      );
    }

    const total = leads.length;
    const startIndex = (page - 1) * limit;
    const paginatedLeads = leads.slice(startIndex, startIndex + limit);

    return res.json({
      success: true,
      data: paginatedLeads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve leads';
    return res.status(500).json({ success: false, error: { code: 'LEAD_FETCH_FAILED', message: msg } });
  }
});

/**
 * GET /api/v1/leads/:id
 * Retrieve single lead details with followups
 * Required permission: LEAD_VIEW
 */
router.get('/:id', requirePermission('LEAD_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: `Lead with ID ${id} not found.` },
      });
    }

    return res.json({
      success: true,
      data: lead,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve lead details';
    return res.status(500).json({ success: false, error: { code: 'LEAD_DETAIL_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/leads
 * Create a new commercial or residential service lead
 * Required permission: LEAD_CREATE
 */
router.post('/', requirePermission('LEAD_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const currentUser = req.user;
    const {
      customer_name,
      email,
      phone,
      service_interest,
      requirement_details,
      estimated_value,
      assigned_to,
      city_id,
      city_name,
    } = req.body;

    if (!customer_name || customer_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Customer name is required (minimum 2 characters).' },
      });
    }

    if (!phone || phone.trim().length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid contact phone number is required.' },
      });
    }

    if (!service_interest) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Service interest is required.' },
      });
    }

    // Resolve assigned staff user if provided
    let assignedStaffName: string | null = null;
    if (assigned_to) {
      const staffUser = memoryStore.users.find((u) => u.id === assigned_to || u.public_id === assigned_to);
      if (staffUser) {
        assignedStaffName = staffUser.name;
      }
    }

    const nextIdNum = memoryStore.leads.length + 1;
    const publicId = `VXLD-${String(nextIdNum).padStart(6, '0')}`;
    const newLeadId = `lead-${crypto.randomUUID()}`;

    const newLead: LeadRecord = {
      id: newLeadId,
      public_id: publicId,
      customer_name: customer_name.trim(),
      email: email ? email.trim().toLowerCase() : null,
      phone: phone.trim(),
      service_interest: service_interest.trim(),
      requirement_details: requirement_details ? requirement_details.trim() : null,
      estimated_value: estimated_value ? Number(estimated_value) : null,
      assigned_to: assigned_to || null,
      assigned_to_name: assignedStaffName,
      created_by: currentUser.id,
      created_by_name: currentUser.name,
      stage: 'NEW',
      status: 'ACTIVE',
      city_id: city_id ? Number(city_id) : 2,
      city_name: city_name || 'Gurgaon',
      followups: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    memoryStore.leads.unshift(newLead);

    // Audit log
    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'LEAD_CREATED',
      entity: 'LEAD',
      entityId: newLeadId,
      newValue: {
        public_id: publicId,
        customer_name: newLead.customer_name,
        service_interest: newLead.service_interest,
        estimated_value: newLead.estimated_value,
        assigned_to: newLead.assigned_to,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: `Lead ${publicId} created successfully.`,
      data: newLead,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create lead';
    return res.status(500).json({ success: false, error: { code: 'LEAD_CREATE_FAILED', message: msg } });
  }
});

/**
 * PUT /api/v1/leads/:id
 * Edit existing lead
 * Required permission: LEAD_EDIT (or alias LEAD_UPDATE)
 */
router.put('/:id', requireAnyPermission(['LEAD_EDIT', 'LEAD_UPDATE']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: `Lead ${id} not found.` },
      });
    }

    const {
      customer_name,
      email,
      phone,
      service_interest,
      requirement_details,
      estimated_value,
      stage,
      status,
      city_id,
      city_name,
    } = req.body;

    const oldState = { ...lead };

    if (customer_name !== undefined) lead.customer_name = customer_name.trim();
    if (email !== undefined) lead.email = email ? email.trim().toLowerCase() : null;
    if (phone !== undefined) lead.phone = phone.trim();
    if (service_interest !== undefined) lead.service_interest = service_interest.trim();
    if (requirement_details !== undefined) lead.requirement_details = requirement_details;
    if (estimated_value !== undefined) lead.estimated_value = Number(estimated_value);
    if (stage !== undefined) lead.stage = stage;
    if (status !== undefined) lead.status = status;
    if (city_id !== undefined) lead.city_id = Number(city_id);
    if (city_name !== undefined) lead.city_name = city_name;
    lead.updated_at = new Date().toISOString();

    // Audit log
    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'LEAD_UPDATED',
      entity: 'LEAD',
      entityId: lead.id,
      oldValue: {
        stage: oldState.stage,
        estimated_value: oldState.estimated_value,
        service_interest: oldState.service_interest,
      },
      newValue: {
        stage: lead.stage,
        estimated_value: lead.estimated_value,
        service_interest: lead.service_interest,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Lead ${lead.public_id} updated successfully.`,
      data: lead,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update lead';
    return res.status(500).json({ success: false, error: { code: 'LEAD_UPDATE_FAILED', message: msg } });
  }
});

/**
 * DELETE /api/v1/leads/:id
 * Delete a lead
 * Required permission: LEAD_DELETE
 */
router.delete('/:id', requirePermission('LEAD_DELETE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: `Lead ${id} not found.` },
      });
    }

    lead.deleted_at = new Date().toISOString();
    lead.status = 'ARCHIVED';
    lead.updated_at = new Date().toISOString();

    // Audit log
    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'LEAD_DELETED',
      entity: 'LEAD',
      entityId: lead.id,
      oldValue: { public_id: lead.public_id, customer_name: lead.customer_name },
      newValue: { deleted_at: lead.deleted_at },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Lead ${lead.public_id} successfully deleted.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete lead';
    return res.status(500).json({ success: false, error: { code: 'LEAD_DELETE_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/leads/:id/assign
 * Assign or reassign a lead to a sales specialist
 * Required permission: LEAD_ASSIGN (or LEAD_REASSIGN)
 */
router.post('/:id/assign', requireAnyPermission(['LEAD_ASSIGN', 'LEAD_REASSIGN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { assigned_to } = req.body;

    const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: `Lead ${id} not found.` },
      });
    }

    let staffName: string | null = null;
    if (assigned_to) {
      const staffUser = memoryStore.users.find(
        (u) => (u.id === assigned_to || u.public_id === assigned_to) && !u.deleted_at
      );
      if (!staffUser) {
        return res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'Assigned staff user does not exist.' },
        });
      }
      staffName = staffUser.name;
    }

    const previousAssignee = lead.assigned_to;
    lead.assigned_to = assigned_to || null;
    lead.assigned_to_name = staffName;
    lead.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: previousAssignee ? 'LEAD_REASSIGNED' : 'LEAD_ASSIGNED',
      entity: 'LEAD',
      entityId: lead.id,
      oldValue: { assigned_to: previousAssignee },
      newValue: { assigned_to: lead.assigned_to, assigned_to_name: lead.assigned_to_name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Lead ${lead.public_id} successfully assigned to ${staffName || 'Unassigned'}.`,
      data: lead,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to assign lead';
    return res.status(500).json({ success: false, error: { code: 'LEAD_ASSIGN_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/leads/:id/followups
 * Add a followup schedule or interaction record
 * Required permission: LEAD_FOLLOWUP_CREATE
 */
router.post('/:id/followups', requirePermission('LEAD_FOLLOWUP_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { scheduled_date, notes } = req.body;

    const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: `Lead ${id} not found.` },
      });
    }

    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Followup notes or task details are required.' },
      });
    }

    const followup: LeadFollowupRecord = {
      id: `fol-${crypto.randomUUID().slice(0, 8)}`,
      lead_id: lead.id,
      scheduled_date: scheduled_date || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      notes: notes.trim(),
      outcome: null,
      completed: false,
      created_at: new Date().toISOString(),
    };

    if (!lead.followups) lead.followups = [];
    lead.followups.push(followup);
    lead.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'LEAD_FOLLOWUP_SCHEDULED',
      entity: 'LEAD',
      entityId: lead.id,
      newValue: followup,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: 'Followup scheduled successfully.',
      data: followup,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create followup';
    return res.status(500).json({ success: false, error: { code: 'FOLLOWUP_CREATE_FAILED', message: msg } });
  }
});

/**
 * PATCH /api/v1/leads/:id/followups/:followupId/complete
 * Mark a followup as completed with meeting/call outcome notes
 * Required permission: LEAD_FOLLOWUP_COMPLETE
 */
router.patch('/:id/followups/:followupId/complete', requirePermission('LEAD_FOLLOWUP_COMPLETE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id, followupId } = req.params;
    const currentUser = req.user;
    const { outcome } = req.body;

    const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: `Lead ${id} not found.` },
      });
    }

    const followup = (lead.followups || []).find((f) => f.id === followupId);
    if (!followup) {
      return res.status(404).json({
        success: false,
        error: { code: 'FOLLOWUP_NOT_FOUND', message: `Followup ${followupId} not found on this lead.` },
      });
    }

    followup.completed = true;
    followup.outcome = outcome ? outcome.trim() : 'Completed without notes.';
    followup.completed_by = currentUser.id;
    lead.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'LEAD_FOLLOWUP_COMPLETED',
      entity: 'LEAD',
      entityId: lead.id,
      newValue: { followupId, outcome: followup.outcome },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: 'Followup completed successfully.',
      data: followup,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to complete followup';
    return res.status(500).json({ success: false, error: { code: 'FOLLOWUP_COMPLETE_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/leads/:id/convert
 * Convert a won lead into an active Customer account and Service Booking
 * Required permission: LEAD_CONVERT
 */
router.post('/:id/convert', requirePermission('LEAD_CONVERT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { service_id, scheduled_date, total_amount, notes } = req.body;

    const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: `Lead ${id} not found.` },
      });
    }

    // 1. Check if customer already exists with this phone or create new Customer
    let customer = memoryStore.users.find(
      (u) => u.phone === lead.phone || (lead.email && u.email === lead.email)
    );

    if (!customer) {
      const nextCustSeq = memoryStore.users.length + 1;
      const custPublicId = `VXUSR-${String(nextCustSeq).padStart(6, '0')}`;
      customer = {
        id: `cust-${crypto.randomUUID()}`,
        public_id: custPublicId,
        name: lead.customer_name,
        email: lead.email,
        phone: lead.phone,
        password_hash: null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        profile_image: lead.customer_name.slice(0, 2).toUpperCase(),
        city_id: lead.city_id || 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null,
        deleted_at: null,
      };
      memoryStore.users.push(customer);
      memoryStore.customerProfiles.push({
        id: `cust-prof-${crypto.randomUUID()}`,
        user_id: customer.id,
        customer_type: 'COMMERCIAL',
      });
    }

    // 2. Create Service Booking if service_id is provided
    let createdBooking: any = null;
    const nextBookingNum = memoryStore.bookings.length + 84930;
    const bookingPublicId = `VTX-${nextBookingNum}`;

    createdBooking = {
      id: `book-${crypto.randomUUID()}`,
      public_id: bookingPublicId,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      service_id: service_id || 'srv-001',
      service_name: lead.service_interest,
      technician_id: null,
      technician_name: null,
      status: 'Confirmed',
      scheduled_date: scheduled_date || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time_slot: '10:00 AM - 01:00 PM',
      total_amount: total_amount ? Number(total_amount) : (lead.estimated_value || 1499),
      payment_status: 'PENDING',
      city_id: lead.city_id || 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    memoryStore.bookings.unshift(createdBooking);

    // 3. Mark Lead as WON
    lead.stage = 'WON';
    lead.status = 'WON';
    lead.updated_at = new Date().toISOString();

    // 4. Audit Log
    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'LEAD_CONVERTED',
      entity: 'LEAD',
      entityId: lead.id,
      newValue: {
        lead_id: lead.id,
        customer_id: customer.id,
        booking_id: createdBooking.id,
        booking_public_id: createdBooking.public_id,
        converted_value: createdBooking.total_amount,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Lead ${lead.public_id} successfully converted! Created Customer (${customer.public_id}) and Booking (${createdBooking.public_id}).`,
      data: {
        lead,
        customer,
        booking: createdBooking,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to convert lead';
    return res.status(500).json({ success: false, error: { code: 'LEAD_CONVERT_FAILED', message: msg } });
  }
});

export default router;
