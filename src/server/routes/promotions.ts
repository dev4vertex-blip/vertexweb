import { Router } from 'express';
import crypto from 'crypto';
import { memoryStore, PromotionRecord } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// Require authentication for all promotion management endpoints
router.use(authenticateUser);

/**
 * GET /api/v1/promotions
 * List all promotions and offers with optional search and filters
 */
router.get('/', requirePermission('PROMOTION_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { search, status, type, category } = req.query;

    let promos = memoryStore.promotions.filter((p) => !p.deleted_at);

    // Filter by status if provided and not 'ALL'
    if (status && status !== 'ALL') {
      promos = promos.filter((p) => p.status.toUpperCase() === String(status).toUpperCase());
    }

    // Filter by promotion type
    if (type && type !== 'ALL') {
      promos = promos.filter((p) => p.promotion_type.toUpperCase() === String(type).toUpperCase());
    }

    // Filter by category
    if (category && category !== 'ALL') {
      const catStr = String(category).toLowerCase();
      promos = promos.filter((p) => {
        if (!p.applicable_categories) return true;
        if (Array.isArray(p.applicable_categories)) {
          return p.applicable_categories.some(
            (c) => c.toLowerCase() === 'all' || c.toLowerCase().includes(catStr)
          );
        }
        return (
          String(p.applicable_categories).toLowerCase().includes('all') ||
          String(p.applicable_categories).toLowerCase().includes(catStr)
        );
      });
    }

    // Filter by search keyword (name or code)
    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      promos = promos.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    promos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Compute meta stats
    const allNonDeleted = memoryStore.promotions.filter((p) => !p.deleted_at);
    const activeCount = allNonDeleted.filter((p) => p.status === 'ACTIVE').length;
    const totalRedemptions = allNonDeleted.reduce((acc, p) => acc + (p.usage_count || 0), 0);
    const discountsDistributed = allNonDeleted.reduce((acc, p) => {
      // Estimate or calculate discount distributed
      const avgDiscount = p.discount_type === 'FIXED' ? p.discount_value : (p.max_discount || 250);
      return acc + (p.usage_count || 0) * avgDiscount;
    }, 0);

    return res.json({
      success: true,
      data: promos,
      meta: {
        total: promos.length,
        activeCount,
        totalRedemptions,
        discountsDistributed,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch promotions';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/promotions/:id
 * Get single promotion by ID
 */
router.get('/:id', requirePermission('PROMOTION_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const promo = memoryStore.promotions.find((p) => (p.id === id || p.code.toUpperCase() === id.toUpperCase()) && !p.deleted_at);

    if (!promo) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    return res.json({ success: true, data: promo });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch promotion';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/promotions
 * Create a new promotion / coupon / offer
 */
router.post('/', requirePermission('PROMOTION_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      code,
      description,
      promotion_type,
      discount_type,
      discount_value,
      min_order_value,
      max_discount,
      start_date,
      start_time,
      end_date,
      end_time,
      applicable_categories,
      applicable_services,
      customer_segment,
      usage_limit,
      per_customer_limit,
      status,
      terms_and_conditions,
    } = req.body;

    // Validate name
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Promotion / Offer name is required' });
    }

    // Validate code
    if (!code || !String(code).trim()) {
      return res.status(400).json({ success: false, error: 'Coupon / Offer code is required' });
    }

    const cleanCode = String(code).toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 3) {
      return res.status(400).json({ success: false, error: 'Code must be at least 3 alphanumeric characters' });
    }

    // Check duplicate code
    const existing = memoryStore.promotions.find(
      (p) => p.code.toUpperCase() === cleanCode && !p.deleted_at
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `A promotion with code "${cleanCode}" already exists. Please use a unique coupon code.`,
      });
    }

    // Validate discount value
    const numDiscountValue = Number(discount_value);
    if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
      return res.status(400).json({ success: false, error: 'Discount value must be greater than 0' });
    }

    const resolvedDiscountType = discount_type === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED';
    if (resolvedDiscountType === 'PERCENTAGE' && (numDiscountValue < 1 || numDiscountValue > 100)) {
      return res.status(400).json({ success: false, error: 'Percentage discount must be between 1% and 100%' });
    }

    // Date validations
    if (start_date && end_date) {
      const s = new Date(start_date);
      const e = new Date(end_date);
      if (e < s) {
        return res.status(400).json({ success: false, error: 'End date cannot be earlier than start date' });
      }
    }

    const now = new Date().toISOString();
    const newPromotion: PromotionRecord = {
      id: `promo-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`,
      name: String(name).trim(),
      code: cleanCode,
      description: description ? String(description).trim() : null,
      promotion_type: promotion_type || (resolvedDiscountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_AMOUNT'),
      discount_type: resolvedDiscountType,
      discount_value: numDiscountValue,
      min_order_value: Number(min_order_value) >= 0 ? Number(min_order_value) : 0,
      max_discount: max_discount !== undefined && max_discount !== null && max_discount !== '' ? Number(max_discount) : null,
      start_date: start_date || null,
      start_time: start_time || null,
      end_date: end_date || null,
      end_time: end_time || null,
      applicable_categories: applicable_categories || ['All'],
      applicable_services: applicable_services || ['All Services'],
      customer_segment: customer_segment || 'ALL',
      usage_limit: Number(usage_limit) > 0 ? Number(usage_limit) : 1000,
      usage_count: 0,
      per_customer_limit: Number(per_customer_limit) > 0 ? Number(per_customer_limit) : 1,
      status: (status && ['DRAFT', 'ACTIVE', 'INACTIVE'].includes(status)) ? status : 'ACTIVE',
      terms_and_conditions: terms_and_conditions ? String(terms_and_conditions).trim() : null,
      created_by: req.user?.name || req.user?.role || 'SUPER_ADMIN',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    memoryStore.promotions.unshift(newPromotion);

    // Audit log
    logAuditEvent({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'SUPER_ADMIN',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'PROMOTION_CREATED',
      entity: 'PROMOTION',
      entityId: newPromotion.id,
      newValue: {
        id: newPromotion.id,
        code: newPromotion.code,
        name: newPromotion.name,
        discountType: newPromotion.discount_type,
        discountValue: newPromotion.discount_value,
        status: newPromotion.status,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      data: newPromotion,
      message: `Promotion "${newPromotion.name}" (${newPromotion.code}) created successfully`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create promotion';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/v1/promotions/:id
 * Edit / Update an existing promotion
 */
router.put('/:id', requirePermission('PROMOTION_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const promoIndex = memoryStore.promotions.findIndex((p) => p.id === id && !p.deleted_at);

    if (promoIndex === -1) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    const currentPromo = memoryStore.promotions[promoIndex];
    const {
      name,
      code,
      description,
      promotion_type,
      discount_type,
      discount_value,
      min_order_value,
      max_discount,
      start_date,
      start_time,
      end_date,
      end_time,
      applicable_categories,
      applicable_services,
      customer_segment,
      usage_limit,
      per_customer_limit,
      status,
      terms_and_conditions,
    } = req.body;

    const finalName = name !== undefined ? String(name).trim() : currentPromo.name;
    if (!finalName) {
      return res.status(400).json({ success: false, error: 'Promotion / Offer name is required' });
    }

    const finalCode = code !== undefined ? String(code).trim() : currentPromo.code;
    if (!finalCode) {
      return res.status(400).json({ success: false, error: 'Coupon / Offer code is required' });
    }

    const cleanCode = String(finalCode).toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
    if (cleanCode.length < 3) {
      return res.status(400).json({ success: false, error: 'Code must be at least 3 alphanumeric characters' });
    }

    // Check duplicate code with other promos
    const duplicate = memoryStore.promotions.find(
      (p) => p.id !== id && p.code.toUpperCase() === cleanCode && !p.deleted_at
    );
    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: `Another promotion with code "${cleanCode}" already exists. Code must be unique.`,
      });
    }

    // Validate discount value
    const numDiscountValue = discount_value !== undefined ? Number(discount_value) : currentPromo.discount_value;
    if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
      return res.status(400).json({ success: false, error: 'Discount value must be greater than 0' });
    }

    const resolvedDiscountType = discount_type ? (discount_type === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED') : currentPromo.discount_type;
    if (resolvedDiscountType === 'PERCENTAGE' && (numDiscountValue < 1 || numDiscountValue > 100)) {
      return res.status(400).json({ success: false, error: 'Percentage discount must be between 1% and 100%' });
    }

    // Date validations
    if (start_date && end_date) {
      const s = new Date(start_date);
      const e = new Date(end_date);
      if (e < s) {
        return res.status(400).json({ success: false, error: 'End date cannot be earlier than start date' });
      }
    }

    const oldSnapshot = { ...currentPromo };

    const updatedPromotion: PromotionRecord = {
      ...currentPromo,
      name: String(name).trim(),
      code: cleanCode,
      description: description !== undefined ? (description ? String(description).trim() : null) : currentPromo.description,
      promotion_type: promotion_type || currentPromo.promotion_type,
      discount_type: resolvedDiscountType,
      discount_value: numDiscountValue,
      min_order_value: min_order_value !== undefined ? Math.max(0, Number(min_order_value)) : currentPromo.min_order_value,
      max_discount: max_discount !== undefined && max_discount !== null && max_discount !== '' ? Number(max_discount) : null,
      start_date: start_date !== undefined ? start_date : currentPromo.start_date,
      start_time: start_time !== undefined ? start_time : currentPromo.start_time,
      end_date: end_date !== undefined ? end_date : currentPromo.end_date,
      end_time: end_time !== undefined ? end_time : currentPromo.end_time,
      applicable_categories: applicable_categories !== undefined ? applicable_categories : currentPromo.applicable_categories,
      applicable_services: applicable_services !== undefined ? applicable_services : currentPromo.applicable_services,
      customer_segment: customer_segment !== undefined ? customer_segment : currentPromo.customer_segment,
      usage_limit: usage_limit !== undefined && Number(usage_limit) > 0 ? Number(usage_limit) : currentPromo.usage_limit,
      per_customer_limit: per_customer_limit !== undefined && Number(per_customer_limit) > 0 ? Number(per_customer_limit) : currentPromo.per_customer_limit,
      status: status || currentPromo.status,
      terms_and_conditions: terms_and_conditions !== undefined ? (terms_and_conditions ? String(terms_and_conditions).trim() : null) : currentPromo.terms_and_conditions,
      updated_at: new Date().toISOString(),
    };

    memoryStore.promotions[promoIndex] = updatedPromotion;

    // Audit log
    logAuditEvent({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'SUPER_ADMIN',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'PROMOTION_UPDATED',
      entity: 'PROMOTION',
      entityId: updatedPromotion.id,
      oldValue: oldSnapshot,
      newValue: updatedPromotion,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      data: updatedPromotion,
      message: `Promotion "${updatedPromotion.name}" (${updatedPromotion.code}) updated successfully`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update promotion';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/v1/promotions/:id/status
 * Activate or deactivate a promotion with granular permission checks
 */
router.patch('/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const targetStatus = String(status || '').toUpperCase();
    if (!['ACTIVE', 'INACTIVE', 'DRAFT', 'EXPIRED'].includes(targetStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Expected ACTIVE, INACTIVE, DRAFT, or EXPIRED' });
    }

    // Granular RBAC verification:
    // If activating: requires PROMOTION_ACTIVATE
    // If deactivating: requires PROMOTION_DEACTIVATE
    // (SUPER_ADMIN always passes)
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    if (!isSuperAdmin) {
      if (targetStatus === 'ACTIVE') {
        const canActivate =
          req.user?.permissions?.includes('PROMOTION_ACTIVATE') ||
          req.user?.permissions?.includes('PROMOTION_MANAGE') ||
          req.user?.permissions?.includes('PROMOTION_EDIT');
        if (!canActivate) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Permission PROMOTION_ACTIVATE required to activate promotions.' },
          });
        }
      } else {
        const canDeactivate =
          req.user?.permissions?.includes('PROMOTION_DEACTIVATE') ||
          req.user?.permissions?.includes('PROMOTION_MANAGE') ||
          req.user?.permissions?.includes('PROMOTION_EDIT');
        if (!canDeactivate) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Permission PROMOTION_DEACTIVATE required to deactivate promotions.' },
          });
        }
      }
    }

    const promoIndex = memoryStore.promotions.findIndex((p) => p.id === id && !p.deleted_at);
    if (promoIndex === -1) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    const oldStatus = memoryStore.promotions[promoIndex].status;
    memoryStore.promotions[promoIndex].status = targetStatus as any;
    memoryStore.promotions[promoIndex].updated_at = new Date().toISOString();

    const updated = memoryStore.promotions[promoIndex];

    // Audit log
    logAuditEvent({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'SUPER_ADMIN',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: targetStatus === 'ACTIVE' ? 'PROMOTION_ACTIVATED' : 'PROMOTION_DEACTIVATED',
      entity: 'PROMOTION',
      entityId: updated.id,
      oldValue: { status: oldStatus },
      newValue: { status: targetStatus },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      data: updated,
      message: `Promotion "${updated.name}" is now ${targetStatus}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update promotion status';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * DELETE /api/v1/promotions/:id
 * Delete or safely archive a promotion
 */
router.delete('/:id', requirePermission('PROMOTION_DELETE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const promoIndex = memoryStore.promotions.findIndex((p) => p.id === id && !p.deleted_at);

    if (promoIndex === -1) {
      return res.status(404).json({ success: false, error: 'Promotion not found or already deleted' });
    }

    const promo = memoryStore.promotions[promoIndex];
    const now = new Date().toISOString();

    // If promo was already used in redemptions, soft delete to preserve historical integrity
    promo.deleted_at = now;
    promo.status = 'ARCHIVED';
    promo.updated_at = now;

    // Audit log
    logAuditEvent({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'SUPER_ADMIN',
      userRole: req.user?.role || 'SUPER_ADMIN',
      action: 'PROMOTION_DELETED',
      entity: 'PROMOTION',
      entityId: promo.id,
      oldValue: { code: promo.code, name: promo.name, usageCount: promo.usage_count },
      newValue: { deleted_at: now, status: 'ARCHIVED' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Promotion "${promo.name}" (${promo.code}) deleted successfully`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete promotion';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
