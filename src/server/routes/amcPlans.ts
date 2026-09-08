import { Router } from 'express';
import { memoryStore } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// Require authentication for AMC Plan endpoints
router.use(authenticateUser);

/**
 * GET /api/v1/amc-plans
 * List all AMC plans (AMC_PLAN_VIEW)
 */
router.get('/', requirePermission('AMC_PLAN_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    let plans = memoryStore.amcPlans.filter((p) => !p.deleted_at);
    if (activeOnly) {
      plans = plans.filter((p) => p.is_active);
    }
    return res.json({ success: true, data: plans });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch AMC plans';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/amc-plans
 * Create a new AMC plan (AMC_PLAN_CREATE)
 */
router.post('/', requirePermission('AMC_PLAN_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      code,
      tier,
      appliance_category,
      duration_months,
      base_price,
      strike_price,
      preventive_visits,
      breakdown_visits,
      spare_parts_discount_percent,
      gas_charging_included,
      priority_sla_hours,
      benefits,
      coverage_details,
    } = req.body;

    if (!name || !code || base_price === undefined) {
      return res.status(400).json({ success: false, error: 'Name, code, and base_price are required' });
    }

    const planId = `amc-plan-${Date.now()}`;
    const newPlan = {
      id: planId,
      name,
      code: String(code).toUpperCase().trim(),
      tier: tier || 'STANDARD',
      appliance_category: appliance_category || 'AIR_CONDITIONER',
      duration_months: duration_months ? Number(duration_months) : 12,
      base_price: Number(base_price),
      strike_price: strike_price ? Number(strike_price) : null,
      preventive_visits: preventive_visits ? Number(preventive_visits) : 2,
      breakdown_visits: breakdown_visits ? Number(breakdown_visits) : 4,
      spare_parts_discount_percent: spare_parts_discount_percent ? Number(spare_parts_discount_percent) : 15,
      gas_charging_included: Boolean(gas_charging_included),
      priority_sla_hours: priority_sla_hours ? Number(priority_sla_hours) : 4,
      benefits: Array.isArray(benefits) ? benefits : [],
      coverage_details: coverage_details || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    memoryStore.amcPlans.push(newPlan);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'AMC_PLAN_CREATE',
      entity: 'AMC_PLAN',
      entityId: planId,
      newValue: newPlan,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: newPlan });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create AMC plan';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/v1/amc-plans/:id
 * Edit AMC plan details (AMC_PLAN_EDIT)
 */
router.put('/:id', requirePermission('AMC_PLAN_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const plan = memoryStore.amcPlans.find((p) => p.id === id && !p.deleted_at);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'AMC plan not found' });
    }

    const oldPlan = { ...plan };
    const {
      name,
      tier,
      appliance_category,
      duration_months,
      base_price,
      strike_price,
      preventive_visits,
      breakdown_visits,
      spare_parts_discount_percent,
      gas_charging_included,
      priority_sla_hours,
      benefits,
      coverage_details,
    } = req.body;

    if (name) plan.name = name;
    if (tier) plan.tier = tier;
    if (appliance_category) plan.appliance_category = appliance_category;
    if (duration_months !== undefined) plan.duration_months = Number(duration_months);
    if (base_price !== undefined) plan.base_price = Number(base_price);
    if (strike_price !== undefined) plan.strike_price = Number(strike_price);
    if (preventive_visits !== undefined) plan.preventive_visits = Number(preventive_visits);
    if (breakdown_visits !== undefined) plan.breakdown_visits = Number(breakdown_visits);
    if (spare_parts_discount_percent !== undefined) plan.spare_parts_discount_percent = Number(spare_parts_discount_percent);
    if (gas_charging_included !== undefined) plan.gas_charging_included = Boolean(gas_charging_included);
    if (priority_sla_hours !== undefined) plan.priority_sla_hours = Number(priority_sla_hours);
    if (benefits !== undefined) plan.benefits = Array.isArray(benefits) ? benefits : [];
    if (coverage_details !== undefined) plan.coverage_details = coverage_details;
    plan.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'AMC_PLAN_EDIT',
      entity: 'AMC_PLAN',
      entityId: id,
      oldValue: oldPlan,
      newValue: plan,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: plan });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to edit AMC plan';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/v1/amc-plans/:id/pricing
 * Update AMC plan pricing (AMC_PLAN_PRICE_EDIT)
 */
router.patch('/:id/pricing', requirePermission('AMC_PLAN_PRICE_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { base_price, strike_price } = req.body;

    const plan = memoryStore.amcPlans.find((p) => p.id === id && !p.deleted_at);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'AMC plan not found' });
    }

    const oldPricing = { base_price: plan.base_price, strike_price: plan.strike_price };
    if (base_price !== undefined) plan.base_price = Number(base_price);
    if (strike_price !== undefined) plan.strike_price = Number(strike_price);
    plan.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'AMC_PLAN_PRICE_EDIT',
      entity: 'AMC_PLAN',
      entityId: id,
      oldValue: oldPricing,
      newValue: { base_price: plan.base_price, strike_price: plan.strike_price },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: plan });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update AMC pricing';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/v1/amc-plans/:id/benefits
 * Update AMC plan benefits & visits (AMC_PLAN_BENEFIT_EDIT)
 */
router.patch('/:id/benefits', requirePermission('AMC_PLAN_BENEFIT_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const {
      preventive_visits,
      breakdown_visits,
      spare_parts_discount_percent,
      gas_charging_included,
      priority_sla_hours,
      benefits,
    } = req.body;

    const plan = memoryStore.amcPlans.find((p) => p.id === id && !p.deleted_at);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'AMC plan not found' });
    }

    const oldBenefits = {
      preventive_visits: plan.preventive_visits,
      breakdown_visits: plan.breakdown_visits,
      spare_parts_discount_percent: plan.spare_parts_discount_percent,
      gas_charging_included: plan.gas_charging_included,
      priority_sla_hours: plan.priority_sla_hours,
      benefits: plan.benefits,
    };

    if (preventive_visits !== undefined) plan.preventive_visits = Number(preventive_visits);
    if (breakdown_visits !== undefined) plan.breakdown_visits = Number(breakdown_visits);
    if (spare_parts_discount_percent !== undefined) plan.spare_parts_discount_percent = Number(spare_parts_discount_percent);
    if (gas_charging_included !== undefined) plan.gas_charging_included = Boolean(gas_charging_included);
    if (priority_sla_hours !== undefined) plan.priority_sla_hours = Number(priority_sla_hours);
    if (benefits !== undefined) plan.benefits = Array.isArray(benefits) ? benefits : plan.benefits;
    plan.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'AMC_PLAN_BENEFIT_EDIT',
      entity: 'AMC_PLAN',
      entityId: id,
      oldValue: oldBenefits,
      newValue: {
        preventive_visits: plan.preventive_visits,
        breakdown_visits: plan.breakdown_visits,
        spare_parts_discount_percent: plan.spare_parts_discount_percent,
        gas_charging_included: plan.gas_charging_included,
        priority_sla_hours: plan.priority_sla_hours,
        benefits: plan.benefits,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: plan });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update AMC benefits';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/v1/amc-plans/:id/status
 * Activate / Deactivate AMC plan (AMC_PLAN_ACTIVATE / AMC_PLAN_DEACTIVATE)
 */
router.patch('/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const requiredPerm = is_active ? 'AMC_PLAN_ACTIVATE' : 'AMC_PLAN_DEACTIVATE';

    const userRole = req.user?.role;
    const hasPerm = memoryStore.rolePermissions.some(
      (rp) => rp.role_code === userRole && (rp.permission_code === requiredPerm || rp.permission_code === 'AMC_PLAN_EDIT' || userRole === 'SUPER_ADMIN')
    );

    if (!hasPerm) {
      return res.status(403).json({ success: false, error: `Forbidden: requires ${requiredPerm}` });
    }

    const plan = memoryStore.amcPlans.find((p) => p.id === id && !p.deleted_at);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'AMC plan not found' });
    }

    const oldStatus = plan.is_active;
    plan.is_active = Boolean(is_active);
    plan.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: is_active ? 'AMC_PLAN_ACTIVATE' : 'AMC_PLAN_DEACTIVATE',
      entity: 'AMC_PLAN',
      entityId: id,
      oldValue: { is_active: oldStatus },
      newValue: { is_active: plan.is_active },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: plan });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle AMC plan status';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * DELETE /api/v1/amc-plans/:id
 * Delete AMC plan (AMC_PLAN_DELETE)
 */
router.delete('/:id', requirePermission('AMC_PLAN_DELETE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const plan = memoryStore.amcPlans.find((p) => p.id === id && !p.deleted_at);
    if (!plan) {
      return res.status(404).json({ success: false, error: 'AMC plan not found' });
    }

    plan.deleted_at = new Date().toISOString();
    plan.is_active = false;
    plan.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'AMC_PLAN_DELETE',
      entity: 'AMC_PLAN',
      entityId: id,
      oldValue: { is_active: true, deleted_at: null },
      newValue: { is_active: false, deleted_at: plan.deleted_at },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, message: 'AMC plan deleted' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete AMC plan';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
