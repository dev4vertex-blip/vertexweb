import { Router } from 'express';
import { memoryStore } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

router.use(authenticateUser);

/**
 * GET /api/v1/partners
 * List all channel partners (PARTNER_VIEW)
 */
router.get('/', requirePermission('PARTNER_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user?.role;
    let partners = memoryStore.partners.filter((p) => !p.deleted_at);

    // If partner self-access, restrict to their own record
    if (userRole === 'PARTNER') {
      partners = partners.filter((p) => p.user_id === req.user?.id);
    }

    return res.json({ success: true, data: partners });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch partners';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/partners
 * Create partner profile (PARTNER_CREATE)
 */
router.post('/', requirePermission('PARTNER_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone,
      pan_number,
      gst_number,
      bank_account_number,
      bank_ifsc,
      bank_name,
      tier,
      notes,
    } = req.body;

    if (!company_name || !contact_person || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Company name, contact person, email, and phone are required' });
    }

    const partnerId = `ptnr-${Date.now()}`;
    const newPartner = {
      id: partnerId,
      public_id: `VXPTN-${String(memoryStore.partners.length + 1).padStart(4, '0')}`,
      company_name,
      contact_person,
      email,
      phone,
      pan_number: pan_number || null,
      gst_number: gst_number || null,
      bank_account_number: bank_account_number || null,
      bank_ifsc: bank_ifsc || null,
      bank_name: bank_name || null,
      tier: tier || 'STANDARD',
      total_referrals: 0,
      total_commission_earned: 0,
      total_commission_paid: 0,
      status: 'ACTIVE' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      notes: notes || null,
    };

    memoryStore.partners.push(newPartner);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PARTNER_CREATE',
      entity: 'PARTNER',
      entityId: partnerId,
      newValue: newPartner,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: newPartner });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create partner';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/v1/partners/:id
 * Edit partner profile (PARTNER_EDIT)
 */
router.put('/:id', requirePermission('PARTNER_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const partner = memoryStore.partners.find((p) => p.id === id && !p.deleted_at);
    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    const oldPartner = { ...partner };
    const {
      company_name,
      contact_person,
      email,
      phone,
      pan_number,
      gst_number,
      bank_account_number,
      bank_ifsc,
      bank_name,
      tier,
      notes,
    } = req.body;

    if (company_name) partner.company_name = company_name;
    if (contact_person) partner.contact_person = contact_person;
    if (email) partner.email = email;
    if (phone) partner.phone = phone;
    if (pan_number !== undefined) partner.pan_number = pan_number;
    if (gst_number !== undefined) partner.gst_number = gst_number;
    if (bank_account_number !== undefined) partner.bank_account_number = bank_account_number;
    if (bank_ifsc !== undefined) partner.bank_ifsc = bank_ifsc;
    if (bank_name !== undefined) partner.bank_name = bank_name;
    if (tier) partner.tier = tier;
    if (notes !== undefined) partner.notes = notes;
    partner.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PARTNER_EDIT',
      entity: 'PARTNER',
      entityId: id,
      oldValue: oldPartner,
      newValue: partner,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: partner });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update partner';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/v1/partners/:id/status
 * Activate or deactivate partner (PARTNER_ACTIVATE / PARTNER_DEACTIVATE)
 */
router.patch('/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACTIVE', 'INACTIVE', 'SUSPENDED'
    const requiredPerm = status === 'ACTIVE' ? 'PARTNER_ACTIVATE' : 'PARTNER_DEACTIVATE';

    const userRole = req.user?.role;
    const hasPerm = memoryStore.rolePermissions.some(
      (rp) => rp.role_code === userRole && (rp.permission_code === requiredPerm || rp.permission_code === 'PARTNER_EDIT' || userRole === 'SUPER_ADMIN')
    );

    if (!hasPerm) {
      return res.status(403).json({ success: false, error: `Forbidden: requires ${requiredPerm}` });
    }

    const partner = memoryStore.partners.find((p) => p.id === id && !p.deleted_at);
    if (!partner) {
      return res.status(404).json({ success: false, error: 'Partner not found' });
    }

    const oldStatus = partner.status;
    partner.status = status;
    partner.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: status === 'ACTIVE' ? 'PARTNER_ACTIVATE' : 'PARTNER_DEACTIVATE',
      entity: 'PARTNER',
      entityId: id,
      oldValue: { status: oldStatus },
      newValue: { status: partner.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: partner });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update partner status';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/partners/commission-rules
 * View versioned commission rules (PARTNER_COMMISSION_VIEW)
 */
router.get('/commission-rules', requirePermission('PARTNER_COMMISSION_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const rules = memoryStore.commissionRules.filter((r) => !r.deleted_at);
    return res.json({ success: true, data: rules });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch commission rules';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/partners/commission-rules
 * Create versioned commission rule (PARTNER_COMMISSION_CREATE)
 */
router.post('/commission-rules', requirePermission('PARTNER_COMMISSION_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      rule_type,
      rate_value,
      applies_to,
      service_id,
      category_id,
      amc_plan_id,
      partner_tier,
      effective_from,
      effective_to,
      min_booking_value,
      description,
    } = req.body;

    if (!name || !rule_type || rate_value === undefined) {
      return res.status(400).json({ success: false, error: 'Name, rule_type, and rate_value are required' });
    }

    const ruleId = `comm-rule-${Date.now()}`;
    const newRule = {
      id: ruleId,
      name,
      rule_type: rule_type as 'PERCENTAGE' | 'FIXED',
      rate_value: Number(rate_value),
      applies_to: applies_to || 'ALL',
      service_id: service_id || null,
      category_id: category_id ? Number(category_id) : null,
      amc_plan_id: amc_plan_id || null,
      partner_tier: partner_tier || 'ALL',
      effective_from: effective_from || new Date().toISOString(),
      effective_to: effective_to || null,
      version: 1,
      is_active: true,
      min_booking_value: min_booking_value ? Number(min_booking_value) : null,
      description: description || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    memoryStore.commissionRules.push(newRule);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PARTNER_COMMISSION_RULE_CREATE',
      entity: 'COMMISSION_RULE',
      entityId: ruleId,
      newValue: newRule,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: newRule });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create commission rule';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/v1/partners/commission-rules/:id
 * Edit commission rule (with version bumping) (PARTNER_COMMISSION_EDIT)
 */
router.put('/commission-rules/:id', requirePermission('PARTNER_COMMISSION_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const rule = memoryStore.commissionRules.find((r) => r.id === id && !r.deleted_at);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Commission rule not found' });
    }

    const oldRule = { ...rule };
    const {
      name,
      rule_type,
      rate_value,
      applies_to,
      service_id,
      category_id,
      amc_plan_id,
      partner_tier,
      effective_from,
      effective_to,
      is_active,
      min_booking_value,
      description,
    } = req.body;

    if (name) rule.name = name;
    if (rule_type) rule.rule_type = rule_type;
    if (rate_value !== undefined) rule.rate_value = Number(rate_value);
    if (applies_to) rule.applies_to = applies_to;
    if (service_id !== undefined) rule.service_id = service_id;
    if (category_id !== undefined) rule.category_id = category_id ? Number(category_id) : null;
    if (amc_plan_id !== undefined) rule.amc_plan_id = amc_plan_id;
    if (partner_tier) rule.partner_tier = partner_tier;
    if (effective_from) rule.effective_from = effective_from;
    if (effective_to !== undefined) rule.effective_to = effective_to;
    if (is_active !== undefined) rule.is_active = Boolean(is_active);
    if (min_booking_value !== undefined) rule.min_booking_value = Number(min_booking_value);
    if (description !== undefined) rule.description = description;

    rule.version += 1;
    rule.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PARTNER_COMMISSION_RULE_EDIT',
      entity: 'COMMISSION_RULE',
      entityId: id,
      oldValue: oldRule,
      newValue: rule,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: rule });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update commission rule';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/partners/commissions
 * View commission ledger (PARTNER_COMMISSION_VIEW)
 */
router.get('/commissions', requirePermission('PARTNER_COMMISSION_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const userRole = req.user?.role;
    let commissions = [...memoryStore.partnerCommissions];

    if (userRole === 'PARTNER') {
      const myPartner = memoryStore.partners.find((p) => p.user_id === req.user?.id);
      if (myPartner) {
        commissions = commissions.filter((c) => c.partner_id === myPartner.id);
      } else {
        commissions = [];
      }
    }

    const enriched = commissions.map((c) => {
      const partner = memoryStore.partners.find((p) => p.id === c.partner_id);
      const rule = memoryStore.commissionRules.find((r) => r.id === c.commission_rule_id);
      return {
        ...c,
        partner_name: partner?.company_name || 'Channel Partner',
        rule_name: rule?.name || 'Standard Commission',
      };
    });

    return res.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch commissions';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/v1/partners/commissions/:id/approve
 * Approve commission item (PARTNER_COMMISSION_APPROVE)
 */
const approveCommissionHandler = async (req: AuthenticatedRequest, res: any) => {
  try {
    const { id } = req.params;
    const comm = memoryStore.partnerCommissions.find((c) => c.id === id);
    if (!comm) {
      return res.status(404).json({ success: false, error: 'Commission record not found' });
    }

    if (comm.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, error: `Cannot approve commission with status ${comm.status}` });
    }

    const oldStatus = comm.status;
    comm.status = 'APPROVED';
    comm.approved_by = req.user?.id || 'usr-superadmin-1';
    comm.approved_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PARTNER_COMMISSION_APPROVE',
      entity: 'PARTNER_COMMISSION',
      entityId: id,
      oldValue: { status: oldStatus },
      newValue: { status: comm.status, approved_by: comm.approved_by, approved_at: comm.approved_at },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: comm });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to approve commission';
    return res.status(500).json({ success: false, error: msg });
  }
};

router.patch('/commissions/:id/approve', requirePermission('PARTNER_COMMISSION_APPROVE'), approveCommissionHandler);
router.post('/commissions/:id/approve', requirePermission('PARTNER_COMMISSION_APPROVE'), approveCommissionHandler);

/**
 * POST /api/v1/partners/commissions/:id/recalculate
 * Recalculate commission value (PARTNER_COMMISSION_RECALCULATE)
 */
router.post('/commissions/:id/recalculate', requirePermission('PARTNER_COMMISSION_RECALCULATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const comm = memoryStore.partnerCommissions.find((c) => c.id === id);
    if (!comm) {
      return res.status(404).json({ success: false, error: 'Commission record not found' });
    }

    const rule = memoryStore.commissionRules.find((r) => r.id === comm.commission_rule_id);
    if (!rule) {
      return res.status(400).json({ success: false, error: 'Associated commission rule not found' });
    }

    const oldAmount = comm.commission_amount;
    if (rule.rule_type === 'PERCENTAGE') {
      comm.commission_amount = Math.round(comm.booking_amount * (rule.rate_value / 100));
    } else {
      comm.commission_amount = rule.rate_value;
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PARTNER_COMMISSION_RECALCULATE',
      entity: 'PARTNER_COMMISSION',
      entityId: id,
      oldValue: { commission_amount: oldAmount },
      newValue: { commission_amount: comm.commission_amount },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: comm });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to recalculate commission';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
