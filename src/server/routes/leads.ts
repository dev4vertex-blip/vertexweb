import express from 'express';
import crypto from 'crypto';
import { getDb } from '../../db/client.js';
import { memoryStore, type LeadRecord, type LeadFollowupRecord } from '../../db/memoryStore.js';
import { authenticateUser, requirePermission, requireAnyPermission, type AuthenticatedRequest } from '../middleware.js';
import { logAuditEvent } from '../auth.js';
import { getManagerScope } from './managers.js';

const router = express.Router();

// Guard all leads endpoints with authentication middleware
router.use(authenticateUser);

/**
 * GET /api/v1/leads
 * Retrieve list of leads with filtering, search, and pagination
 * Required permission: LEAD_VIEW (or LEAD_VIEW_OWN, LEAD_VIEW_TEAM, LEAD_VIEW_ALL)
 */
router.get(
  '/',
  requireAnyPermission(['LEAD_VIEW', 'LEAD_VIEW_ALL', 'LEAD_VIEW_TEAM', 'LEAD_VIEW_OWN']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const currentUser = req.user;

      const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '25', 10)));
      const stageFilter = ((req.query.stage as string) || '').trim().toUpperCase();
      const statusFilter = ((req.query.status as string) || '').trim().toUpperCase();
      const priorityFilter = ((req.query.priority as string) || '').trim().toUpperCase();
      const sourceFilter = ((req.query.source as string) || '').trim();
      const assignedFilter = ((req.query.assignedTo as string) || '').trim();
      const search = ((req.query.search as string) || '').trim().toLowerCase();

      let leads = [...memoryStore.leads].filter((l) => !l.deleted_at);

      // Role and permission scope: Sales users are strictly restricted to their own assigned leads
      const isSalesUser = currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM';
      const hasViewAll =
        currentUser.role === 'SUPER_ADMIN' ||
        currentUser.role === 'ADMIN' ||
        currentUser.permissions.includes('LEAD_VIEW_ALL') ||
        currentUser.permissions.includes('ALL');

      const hasViewTeam =
        hasViewAll ||
        currentUser.role === 'MANAGER' ||
        currentUser.permissions.includes('LEAD_VIEW_TEAM');

      if (isSalesUser) {
        // Strict personal scope: ignore any query filters attempting to view other users' leads
        leads = leads.filter((l) => l.assigned_to === currentUser.id);
      } else if (currentUser.role === 'MANAGER') {
        // Strict Manager scope: only authorized sales team members or manager's own created leads
        const scope = getManagerScope(currentUser.id);
        leads = leads.filter((l) => scope.salesUserIds.includes(l.assigned_to) || l.created_by === currentUser.id);
        if (assignedFilter && assignedFilter !== 'ALL') {
          if (!scope.salesUserIds.includes(assignedFilter)) {
            leads = [];
          } else {
            leads = leads.filter((l) => l.assigned_to === assignedFilter);
          }
        }
      } else if (!hasViewAll && !hasViewTeam) {
        // Non-sales restricted staff
        leads = leads.filter(
          (l) => l.assigned_to === currentUser.id || l.created_by === currentUser.id
        );
      } else if (req.query.onlyAssigned === 'true') {
        leads = leads.filter((l) => l.assigned_to === currentUser.id);
      }

      // Filter by stage
      if (stageFilter && stageFilter !== 'ALL') {
        leads = leads.filter((l) => l.stage.toUpperCase() === stageFilter);
      }

      // Filter by status
      if (statusFilter && statusFilter !== 'ALL') {
        leads = leads.filter((l) => l.status.toUpperCase() === statusFilter);
      }

      // Filter by priority
      if (priorityFilter && priorityFilter !== 'ALL') {
        leads = leads.filter((l) => l.priority?.toUpperCase() === priorityFilter);
      }

      // Filter by lead source
      if (sourceFilter && sourceFilter !== 'ALL') {
        leads = leads.filter((l) => l.lead_source?.toLowerCase() === sourceFilter.toLowerCase());
      }

      // Filter by assigned user (allowed only for managers and admins)
      if (!isSalesUser && assignedFilter && assignedFilter !== 'ALL') {
        leads = leads.filter((l) => l.assigned_to === assignedFilter);
      }

      // Full-text search
      if (search) {
        leads = leads.filter(
          (l) =>
            l.customer_name.toLowerCase().includes(search) ||
            (l.company_name && l.company_name.toLowerCase().includes(search)) ||
            (l.email && l.email.toLowerCase().includes(search)) ||
            l.phone.includes(search) ||
            (l.alternate_phone && l.alternate_phone.includes(search)) ||
            l.public_id.toLowerCase().includes(search) ||
            l.service_interest.toLowerCase().includes(search) ||
            (l.service_category && l.service_category.toLowerCase().includes(search)) ||
            (l.assigned_to_name && l.assigned_to_name.toLowerCase().includes(search))
        );
      }

      const total = leads.length;
      const startIndex = (page - 1) * limit;
      const paginatedLeads = leads.slice(startIndex, startIndex + limit).map((l) => {
        const matchedCat = memoryStore.serviceCategories.find(
          (c) =>
            !c.deleted_at &&
            (String(c.id) === String((l as any).category_id) ||
             String(c.id) === String(l.service_category) ||
             c.name.toLowerCase() === (l.service_category || '').toLowerCase())
        );
        return {
          ...l,
          lead_number: l.lead_number || l.public_id,
          customer_phone: l.customer_phone || l.phone,
          service_requirement: l.service_requirement || l.service_interest || l.requirement_details,
          service_category: matchedCat ? matchedCat.name : (l.service_category || 'General Service'),
          category_id: matchedCat ? matchedCat.id : ((l as any).category_id || null),
          source: l.source || l.lead_source,
        };
      });

      // Compute quick summary metrics strictly over the SCOPED leads array
      const activeCount = leads.filter((l) => l.status === 'ACTIVE').length;
      const wonCount = leads.filter((l) => l.status === 'WON').length;
      const lostCount = leads.filter((l) => l.status === 'LOST').length;
      const pipelineValue = leads
        .filter((l) => l.status === 'ACTIVE')
        .reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);

      return res.json({
        success: true,
        data: paginatedLeads,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          summary: {
            active: activeCount,
            won: wonCount,
            lost: lostCount,
            pipelineValue,
          },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve leads';
      return res.status(500).json({ success: false, error: { code: 'LEAD_FETCH_FAILED', message: msg } });
    }
  }
);

/**
 * GET /api/v1/leads/:id
 * Retrieve single lead details with all followups
 * Required permission: LEAD_VIEW
 */
router.get(
  '/:id',
  requireAnyPermission(['LEAD_VIEW', 'LEAD_VIEW_ALL', 'LEAD_VIEW_TEAM', 'LEAD_VIEW_OWN']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);

      if (!lead) {
        return res.status(404).json({
          success: false,
          error: { code: 'LEAD_NOT_FOUND', message: `Lead with ID ${id} not found.` },
        });
      }

      // Role-based scope protection for individual Sales users and Managers
      const currentUser = req.user;
      if (currentUser && (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM')) {
        if (lead.assigned_to !== currentUser.id && lead.created_by !== currentUser.id) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You do not have permission to view this lead.' },
          });
        }
      } else if (currentUser && currentUser.role === 'MANAGER') {
        const scope = getManagerScope(currentUser.id);
        if (!scope.salesUserIds.includes(lead.assigned_to) && lead.created_by !== currentUser.id) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You do not have permission to view leads outside your authorized management scope.' },
          });
        }
      }

      return res.json({
        success: true,
        data: {
          ...lead,
          lead_number: lead.lead_number || lead.public_id,
          customer_phone: lead.customer_phone || lead.phone,
          service_requirement: lead.service_requirement || lead.service_interest || lead.requirement_details,
          source: lead.source || lead.lead_source,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve lead details';
      return res.status(500).json({ success: false, error: { code: 'LEAD_DETAIL_FAILED', message: msg } });
    }
  }
);

/**
 * POST /api/v1/leads
 * Create a new commercial, enterprise, or residential service lead
 * Required permission: LEAD_CREATE
 */
router.post('/', requirePermission('LEAD_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const currentUser = req.user;
    const {
      company_name,
      alternate_phone,
      address,
      service_category,
      requirement_details,
      estimated_value,
      priority,
      city_id,
      city_name,
      expected_followup_date,
      expected_followup_time,
      notes,
    } = req.body;

    const customer_name = req.body.customer_name;
    const phone = req.body.phone || req.body.customer_phone;
    const email = req.body.email || req.body.customer_email;
    const service_interest =
      req.body.service_interest || req.body.service_requirement || req.body.service_category || 'General Service Inquiry';
    const lead_source = req.body.lead_source || req.body.source || 'Inbound Direct';
    const assigned_to = req.body.assigned_to || req.body.assigned_to_user_id;

    // Resolve Service Category against registered active catalog
    const rawCategoryInput = req.body.category_id ?? req.body.service_category;
    let resolvedServiceCategory = req.body.service_category;
    let resolvedCategoryId: number | string | null = req.body.category_id ? Number(req.body.category_id) : null;

    if (rawCategoryInput !== undefined && rawCategoryInput !== null && String(rawCategoryInput).trim()) {
      const matchedCat = memoryStore.serviceCategories.find(
        (c) =>
          !c.deleted_at &&
          (String(c.id) === String(rawCategoryInput) ||
           c.name.toLowerCase() === String(rawCategoryInput).toLowerCase() ||
           (c.code && c.code.toLowerCase() === String(rawCategoryInput).toLowerCase()))
      );
      if (matchedCat) {
        resolvedServiceCategory = matchedCat.name;
        resolvedCategoryId = matchedCat.id;
      }
    }

    // 1. Validation
    if (!customer_name || customer_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Customer name is required (minimum 2 characters).' },
      });
    }

    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'A valid 10-digit mobile phone number is required.' },
      });
    }

    if (!service_interest || service_interest.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Service interest is required.' },
      });
    }

    const resolvedSource = lead_source ? lead_source.trim() : 'Inbound Direct';
    const resolvedPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority?.toUpperCase())
      ? priority.toUpperCase()
      : 'MEDIUM';

    // 2. Check duplicate active lead for same phone
    const existingActiveLead = memoryStore.leads.find(
      (l) => !l.deleted_at && l.status === 'ACTIVE' && l.phone.includes(cleanPhone)
    );
    if (existingActiveLead) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ACTIVE_LEAD',
          message: `An active lead (${existingActiveLead.public_id} - ${existingActiveLead.customer_name}) already exists with phone ${cleanPhone}. Please manage the existing lead.`,
          existingLeadId: existingActiveLead.id,
        },
      });
    }

    // 3. Resolve assigned staff name (Sales users strictly auto-assigned to themselves)
    let assignedStaffName: string | null = null;
    let finalAssignedTo = assigned_to || null;

    if (['SALES', 'SALES_TEAM'].includes(currentUser.role)) {
      finalAssignedTo = currentUser.id;
      assignedStaffName = currentUser.name;
    } else if (finalAssignedTo) {
      const staffUser = memoryStore.users.find(
        (u) => (u.id === finalAssignedTo || u.public_id === finalAssignedTo) && !u.deleted_at
      );
      if (staffUser) {
        assignedStaffName = staffUser.name;
        finalAssignedTo = staffUser.id;
      }
    }

    // 4. Generate Public ID
    const nextIdNum = memoryStore.leads.length + 1;
    const publicId = `VXLD-${String(nextIdNum).padStart(6, '0')}`;
    const newLeadId = `lead-${crypto.randomUUID()}`;

    // 5. Initial Followup if date provided or default scheduled
    const initialFollowups: LeadFollowupRecord[] = [];
    if (expected_followup_date) {
      initialFollowups.push({
        id: `fol-${crypto.randomUUID().slice(0, 8)}`,
        lead_id: newLeadId,
        scheduled_date: expected_followup_date,
        scheduled_time: expected_followup_time || '11:00 AM',
        followup_type: 'CALL',
        notes: notes ? `Initial Lead Inquiry: ${notes}` : 'Initial discussion and requirement scoping with customer.',
        outcome: null,
        status: 'OPEN',
        completed: false,
        completed_at: null,
        completed_by: null,
        cancellation_reason: null,
        created_at: new Date().toISOString(),
      });
    }

    const newLead: LeadRecord = {
      id: newLeadId,
      public_id: publicId,
      customer_name: customer_name.trim(),
      company_name: company_name ? company_name.trim() : null,
      email: email ? email.trim().toLowerCase() : null,
      phone: `+91 ${cleanPhone}`,
      alternate_phone: alternate_phone ? alternate_phone.trim() : null,
      address: address ? address.trim() : null,
      service_interest: service_interest.trim(),
      service_category: resolvedServiceCategory || 'General Service',
      category_id: resolvedCategoryId,
      requirement_details: requirement_details ? requirement_details.trim() : null,
      estimated_value: estimated_value ? Math.max(0, Number(estimated_value)) : 0,
      lead_source: resolvedSource,
      priority: resolvedPriority as any,
      assigned_to: finalAssignedTo,
      assigned_to_name: assignedStaffName,
      created_by: currentUser.id,
      created_by_name: currentUser.name,
      stage: 'NEW',
      status: 'ACTIVE',
      loss_reason: null,
      won_booking_id: null,
      won_customer_id: null,
      city_id: city_id ? Number(city_id) : 2,
      city_name: city_name || 'Gurgaon',
      expected_followup_date: expected_followup_date || null,
      expected_followup_time: expected_followup_time || null,
      notes: notes ? notes.trim() : null,
      followups: initialFollowups,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    memoryStore.leads.unshift(newLead);

    // Save to database if available
    try {
      const { pglite } = await getDb();
      await pglite.query(
        `INSERT INTO leads (
          id, public_id, customer_name, company_name, phone, alternate_phone, email, address,
          service_interest, service_category, requirement_details, estimated_value, lead_source,
          priority, stage, status, assigned_to, created_by, city_id, expected_followup_date, expected_followup_time, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
        [
          newLead.id,
          newLead.public_id,
          newLead.customer_name,
          newLead.company_name,
          newLead.phone,
          newLead.alternate_phone,
          newLead.email,
          newLead.address,
          newLead.service_interest,
          newLead.service_category,
          newLead.requirement_details,
          newLead.estimated_value,
          newLead.lead_source,
          newLead.priority,
          newLead.stage,
          newLead.status,
          newLead.assigned_to,
          newLead.created_by,
          newLead.city_id,
          newLead.expected_followup_date || null,
          newLead.expected_followup_time || null,
          newLead.notes,
        ]
      ).catch(() => {});
    } catch {
      // Memory fallback is primary
    }

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
        phone: newLead.phone,
        service_interest: newLead.service_interest,
        estimated_value: newLead.estimated_value,
        lead_source: newLead.lead_source,
        priority: newLead.priority,
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
 * Edit existing lead details
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

    // Role-based scope protection for individual Sales users and Managers
    if (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM') {
      if (lead.assigned_to !== currentUser.id && lead.created_by !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this lead.' },
        });
      }
    } else if (currentUser.role === 'MANAGER') {
      const scope = getManagerScope(currentUser.id);
      if (!scope.salesUserIds.includes(lead.assigned_to) && lead.created_by !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to modify leads outside your authorized management scope.' },
        });
      }
    }

    const {
      customer_name,
      company_name,
      email,
      phone,
      alternate_phone,
      address,
      service_interest,
      service_category,
      requirement_details,
      estimated_value,
      lead_source,
      priority,
      stage,
      status,
      city_id,
      city_name,
      expected_followup_date,
      expected_followup_time,
      notes,
    } = req.body;

    const oldState = { ...lead };

    if (customer_name !== undefined) lead.customer_name = customer_name.trim();
    if (company_name !== undefined) lead.company_name = company_name ? company_name.trim() : null;
    if (email !== undefined) lead.email = email ? email.trim().toLowerCase() : null;
    if (phone !== undefined) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      lead.phone = cleanPhone ? `+91 ${cleanPhone}` : phone.trim();
    }
    if (alternate_phone !== undefined) lead.alternate_phone = alternate_phone ? alternate_phone.trim() : null;
    if (address !== undefined) lead.address = address ? address.trim() : null;
    if (service_interest !== undefined) lead.service_interest = service_interest.trim();
    const updateCatInput = service_category !== undefined ? service_category : req.body.category_id;
    if (updateCatInput !== undefined) {
      const matchedCat = memoryStore.serviceCategories.find(
        (c) =>
          !c.deleted_at &&
          (String(c.id) === String(updateCatInput) ||
           c.name.toLowerCase() === String(updateCatInput).toLowerCase() ||
           (c.code && c.code.toLowerCase() === String(updateCatInput).toLowerCase()))
      );
      lead.service_category = matchedCat ? matchedCat.name : updateCatInput;
      lead.category_id = matchedCat ? matchedCat.id : (req.body.category_id ? Number(req.body.category_id) : lead.category_id);
    }
    if (requirement_details !== undefined) lead.requirement_details = requirement_details;
    if (estimated_value !== undefined) lead.estimated_value = Number(estimated_value);
    if (lead_source !== undefined) lead.lead_source = lead_source;
    if (priority !== undefined) lead.priority = priority;
    if (stage !== undefined) lead.stage = stage;
    if (status !== undefined) lead.status = status;
    if (city_id !== undefined) lead.city_id = Number(city_id);
    if (city_name !== undefined) lead.city_name = city_name;
    if (expected_followup_date !== undefined) lead.expected_followup_date = expected_followup_date;
    if (expected_followup_time !== undefined) lead.expected_followup_time = expected_followup_time;
    if (notes !== undefined) lead.notes = notes;
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
 * POST /api/v1/leads/:id/won
 * Mark a lead as WON. Cancels remaining open follow-ups while preserving history.
 * Required permission: LEAD_WON or LEAD_MARK_WON
 */
router.post('/:id/won', requireAnyPermission(['LEAD_WON', 'LEAD_MARK_WON']), async (req: AuthenticatedRequest, res) => {
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

    if (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM') {
      if (lead.assigned_to !== currentUser.id && lead.created_by !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to mark this lead as won.' },
        });
      }
    }

    lead.stage = 'WON';
    lead.status = 'WON';
    lead.loss_reason = null;
    lead.updated_at = new Date().toISOString();

    // Cancel remaining OPEN follow-ups
    if (lead.followups) {
      for (const fol of lead.followups) {
        if (!fol.completed && fol.status === 'OPEN') {
          fol.status = 'CANCELLED';
          fol.cancellation_reason = 'Lead marked as WON';
        }
      }
    }

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'LEAD_MARKED_WON',
      entity: 'LEAD',
      entityId: lead.id,
      newValue: { stage: 'WON', status: 'WON' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Lead ${lead.public_id} marked as WON!`,
      data: lead,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to mark lead as won';
    return res.status(500).json({ success: false, error: { code: 'LEAD_WON_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/leads/:id/lost
 * Mark a lead as LOST with mandatory reason. Cancels open follow-ups.
 * Required permission: LEAD_LOST or LEAD_MARK_LOST
 */
router.post('/:id/lost', requireAnyPermission(['LEAD_LOST', 'LEAD_MARK_LOST']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const { reason, notes } = req.body;

    const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Loss reason is required when marking a lead as Lost.' },
      });
    }

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: `Lead ${id} not found.` },
      });
    }

    if (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM') {
      if (lead.assigned_to !== currentUser.id && lead.created_by !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to mark this lead as lost.' },
        });
      }
    }
    lead.status = 'LOST';
    lead.loss_reason = reason.trim() + (notes ? ` - ${notes.trim()}` : '');
    lead.updated_at = new Date().toISOString();

    // Cancel remaining OPEN follow-ups
    if (lead.followups) {
      for (const fol of lead.followups) {
        if (!fol.completed && fol.status === 'OPEN') {
          fol.status = 'CANCELLED';
          fol.cancellation_reason = `Lead marked as LOST: ${lead.loss_reason}`;
        }
      }
    }

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'LEAD_MARKED_LOST',
      entity: 'LEAD',
      entityId: lead.id,
      newValue: { stage: 'LOST', status: 'LOST', loss_reason: lead.loss_reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Lead ${lead.public_id} marked as LOST.`,
      data: lead,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to mark lead as lost';
    return res.status(500).json({ success: false, error: { code: 'LEAD_LOST_FAILED', message: msg } });
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

    // Individual Sales users are forbidden from reassigning leads
    if (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Lead reassignment requires managerial or admin authorization.' },
      });
    }

    const { assigned_to } = req.body;

    const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: `Lead ${id} not found.` },
      });
    }

    // Manager scope enforcement
    if (currentUser.role === 'MANAGER') {
      const scope = getManagerScope(currentUser.id);
      if (!scope.salesUserIds.includes(lead.assigned_to) && lead.created_by !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Managers may only reassign leads within their authorized management scope.' },
        });
      }
      if (assigned_to && !scope.salesUserIds.includes(assigned_to) && assigned_to !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Managers may only assign leads to sales representatives within their authorized team.' },
        });
      }
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
    const { scheduled_date, scheduled_time, followup_type, notes } = req.body;

    const lead = memoryStore.leads.find((l) => (l.id === id || l.public_id === id) && !l.deleted_at);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: `Lead ${id} not found.` },
      });
    }

    if (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM') {
      if (lead.assigned_to !== currentUser.id && lead.created_by !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to schedule followups for this lead.' },
        });
      }
    }

    if (!notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Followup notes or task details are required.' },
      });
    }

    const followup: LeadFollowupRecord = {
      id: `fol-${crypto.randomUUID().slice(0, 8)}`,
      lead_id: lead.id,
      scheduled_date: scheduled_date || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      scheduled_time: scheduled_time || '11:00 AM',
      followup_type: followup_type || 'CALL',
      notes: notes.trim(),
      outcome: null,
      status: 'OPEN',
      completed: false,
      completed_at: null,
      completed_by: null,
      cancellation_reason: null,
      created_at: new Date().toISOString(),
    };

    if (!lead.followups) lead.followups = [];
    lead.followups.push(followup);
    lead.expected_followup_date = followup.scheduled_date;
    lead.expected_followup_time = followup.scheduled_time || null;
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
 * Mark a followup as completed with meeting/call outcome notes.
 * Optionally schedule the next follow-up. Does NOT change lead status.
 * Required permission: LEAD_FOLLOWUP_COMPLETE
 */
router.patch('/:id/followups/:followupId/complete', requirePermission('LEAD_FOLLOWUP_COMPLETE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id, followupId } = req.params;
    const currentUser = req.user;
    const { outcome, next_followup_date, next_followup_time, next_followup_notes, next_followup_type } = req.body;

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
    followup.status = 'COMPLETED';
    followup.outcome = outcome ? outcome.trim() : 'Completed without additional outcome notes.';
    followup.completed_at = new Date().toISOString();
    followup.completed_by = currentUser.id;
    lead.updated_at = new Date().toISOString();

    // Automatically schedule next follow-up if requested
    let nextFollowup: LeadFollowupRecord | null = null;
    if (next_followup_date) {
      nextFollowup = {
        id: `fol-${crypto.randomUUID().slice(0, 8)}`,
        lead_id: lead.id,
        scheduled_date: next_followup_date,
        scheduled_time: next_followup_time || '11:00 AM',
        followup_type: next_followup_type || 'CALL',
        notes: next_followup_notes ? next_followup_notes.trim() : 'Scheduled next follow-up discussion.',
        outcome: null,
        status: 'OPEN',
        completed: false,
        completed_at: null,
        completed_by: null,
        cancellation_reason: null,
        created_at: new Date().toISOString(),
      };
      lead.followups?.push(nextFollowup);
      lead.expected_followup_date = nextFollowup.scheduled_date;
      lead.expected_followup_time = nextFollowup.scheduled_time || null;
    }

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'LEAD_FOLLOWUP_COMPLETED',
      entity: 'LEAD',
      entityId: lead.id,
      newValue: { followupId, outcome: followup.outcome, nextFollowupId: nextFollowup?.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: 'Followup completed successfully.',
      data: {
        completedFollowup: followup,
        nextFollowup,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to complete followup';
    return res.status(500).json({ success: false, error: { code: 'FOLLOWUP_COMPLETE_FAILED', message: msg } });
  }
});

/**
 * POST /api/v1/leads/:id/convert
 * Convert a won lead into an active Customer account and Service Booking
 * Cancels remaining open follow-ups while keeping completed ones visible.
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

    if (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM') {
      if (lead.assigned_to !== currentUser.id && lead.created_by !== currentUser.id) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not have permission to convert this lead.' },
        });
      }
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
        customer_type: lead.company_name ? 'COMMERCIAL' : 'INDIVIDUAL',
      });
    }

    // 2. Create Service Booking
    const nextBookingNum = memoryStore.bookings.length + 84930;
    const bookingPublicId = `VTX-${nextBookingNum}`;

    const createdBooking = {
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
      notes: notes || lead.requirement_details || 'Converted from Commercial Lead',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    memoryStore.bookings.unshift(createdBooking as any);

    // 3. Update Lead to WON and link IDs
    lead.stage = 'WON';
    lead.status = 'WON';
    lead.won_booking_id = createdBooking.id;
    lead.won_customer_id = customer.id;
    lead.updated_at = new Date().toISOString();

    // 4. Cancel remaining open follow-ups
    if (lead.followups) {
      for (const fol of lead.followups) {
        if (!fol.completed && fol.status === 'OPEN') {
          fol.status = 'CANCELLED';
          fol.cancellation_reason = `Lead successfully converted to Booking (${bookingPublicId})`;
        }
      }
    }

    // 5. Audit Log
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
