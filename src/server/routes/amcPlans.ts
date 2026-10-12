import { Router } from 'express';
import crypto from 'crypto';
import { memoryStore } from '../../db/memoryStore.js';
import { amcRepository, AmcPlanEntity } from '../repositories/amcRepository.js';
import { amcService } from '../services/amcService.js';
import { authenticateUser, AuthenticatedRequest, requirePlatform, requirePermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// Require authentication and BUSINESS platform guard for AMC Plan administrative management
router.use(authenticateUser);
router.use(requirePlatform('BUSINESS'));

/**
 * GET /api/v1/amc-plans
 * List all AMC plans (AMC_PLAN_VIEW)
 */
router.get('/', requirePermission('AMC_PLAN_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    const plans = await amcRepository.listPlans(activeOnly);
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

    const planId = `amc-plan-${crypto.randomUUID()}`;
    const publicSuffix = Math.floor(1000 + Math.random() * 9000);
    const publicId = `AMC-${publicSuffix}`;
    const cleanCode = String(code).toUpperCase().trim();
    const slug = cleanCode.toLowerCase().replace(/_/g, '-');

    const created = await amcRepository.createPlan({
      id: planId,
      public_id: publicId,
      name: String(name).trim(),
      code: cleanCode,
      slug,
      duration_months: duration_months ? Number(duration_months) : 12,
      price: Number(base_price),
      base_price: Number(base_price),
      strike_price: strike_price ? Number(strike_price) : null,
      preventive_visits: preventive_visits ? Number(preventive_visits) : 2,
      breakdown_visits: breakdown_visits ? Number(breakdown_visits) : 4,
      spare_parts_discount_percent: spare_parts_discount_percent ? Number(spare_parts_discount_percent) : 15,
      gas_charging_included: Boolean(gas_charging_included),
      priority_sla_hours: priority_sla_hours ? Number(priority_sla_hours) : 4,
      benefits: JSON.stringify(Array.isArray(benefits) ? benefits : []),
      is_active: true,
      status: 'ACTIVE',
    });

    // In-memory sync for backward compatibility
    memoryStore.amcPlans.push({
      id: created.id,
      name: created.name,
      code: created.code || cleanCode,
      tier: tier || 'STANDARD',
      appliance_category: appliance_category || 'AIR_CONDITIONER',
      duration_months: created.duration_months,
      base_price: Number(created.base_price),
      strike_price: created.strike_price ? Number(created.strike_price) : null,
      preventive_visits: created.preventive_visits,
      breakdown_visits: created.breakdown_visits,
      spare_parts_discount_percent: Number(created.spare_parts_discount_percent),
      gas_charging_included: created.gas_charging_included,
      priority_sla_hours: created.priority_sla_hours,
      benefits: Array.isArray(benefits) ? benefits : [],
      coverage_details: coverage_details || null,
      is_active: true,
      created_at: created.created_at,
      updated_at: created.updated_at || created.created_at,
      deleted_at: null,
    });

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'AMC_PLAN_CREATE',
      entity: 'AMC_PLAN',
      entityId: planId,
      newValue: created,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: created });
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
    const existing = await amcRepository.getPlanById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'AMC plan not found' });
    }

    const {
      name,
      duration_months,
      base_price,
      strike_price,
      preventive_visits,
      breakdown_visits,
      spare_parts_discount_percent,
      priority_sla_hours,
    } = req.body;

    const updated = await amcRepository.updatePlan(existing.id, {
      name: name !== undefined ? String(name).trim() : undefined,
      duration_months: duration_months !== undefined ? Number(duration_months) : undefined,
      base_price: base_price !== undefined ? Number(base_price) : undefined,
      strike_price: strike_price !== undefined ? Number(strike_price) : undefined,
      preventive_visits: preventive_visits !== undefined ? Number(preventive_visits) : undefined,
      breakdown_visits: breakdown_visits !== undefined ? Number(breakdown_visits) : undefined,
      spare_parts_discount_percent: spare_parts_discount_percent !== undefined ? Number(spare_parts_discount_percent) : undefined,
      priority_sla_hours: priority_sla_hours !== undefined ? Number(priority_sla_hours) : undefined,
    });

    // In-memory sync
    const memPlan = memoryStore.amcPlans.find((p) => p.id === existing.id || p.code === existing.code);
    if (memPlan && updated) {
      Object.assign(memPlan, updated);
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'AMC_PLAN_EDIT',
      entity: 'AMC_PLAN',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: updated });
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

    const existing = await amcRepository.getPlanById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'AMC plan not found' });
    }

    const updated = await amcRepository.updatePlan(existing.id, {
      base_price: base_price !== undefined ? Number(base_price) : undefined,
      strike_price: strike_price !== undefined ? Number(strike_price) : undefined,
    });

    const memPlan = memoryStore.amcPlans.find((p) => p.id === existing.id || p.code === existing.code);
    if (memPlan && updated) {
      memPlan.base_price = Number(updated.base_price);
      memPlan.strike_price = updated.strike_price ? Number(updated.strike_price) : null;
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'AMC_PLAN_PRICE_EDIT',
      entity: 'AMC_PLAN',
      entityId: id,
      oldValue: { base_price: existing.base_price, strike_price: existing.strike_price },
      newValue: { base_price: updated?.base_price, strike_price: updated?.strike_price },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update AMC pricing';
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

    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const userPermissions: string[] = req.user?.permissions || [];
    const hasPerm = isSuperAdmin || userPermissions.includes(requiredPerm) || userPermissions.includes('AMC_PLAN_EDIT');

    if (!hasPerm) {
      return res.status(403).json({ success: false, error: `Forbidden: requires ${requiredPerm}` });
    }

    const existing = await amcRepository.getPlanById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'AMC plan not found' });
    }

    const updated = await amcRepository.updatePlan(existing.id, {
      is_active: Boolean(is_active),
      status: is_active ? 'ACTIVE' : 'INACTIVE',
    });

    const memPlan = memoryStore.amcPlans.find((p) => p.id === existing.id || p.code === existing.code);
    if (memPlan) {
      memPlan.is_active = Boolean(is_active);
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: is_active ? 'AMC_PLAN_ACTIVATE' : 'AMC_PLAN_DEACTIVATE',
      entity: 'AMC_PLAN',
      entityId: id,
      oldValue: { is_active: existing.is_active },
      newValue: { is_active: Boolean(is_active) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: updated });
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
    const existing = await amcRepository.getPlanById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'AMC plan not found' });
    }

    await amcRepository.softDeletePlan(existing.id);

    const memPlan = memoryStore.amcPlans.find((p) => p.id === existing.id || p.code === existing.code);
    if (memPlan) {
      memPlan.deleted_at = new Date().toISOString();
      memPlan.is_active = false;
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'AMC_PLAN_DELETE',
      entity: 'AMC_PLAN',
      entityId: id,
      oldValue: { is_active: true },
      newValue: { is_active: false, deleted_at: new Date().toISOString() },
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
