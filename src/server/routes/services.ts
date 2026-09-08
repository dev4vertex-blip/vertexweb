import { Router } from 'express';
import crypto from 'crypto';
import { memoryStore } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// Require authentication for all service management endpoints
router.use(authenticateUser);

/**
 * GET /api/v1/services/categories
 * List all service categories
 */
router.get('/categories', requirePermission('SERVICE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const categories = memoryStore.serviceCategories.filter((c) => !c.deleted_at);
    return res.json({ success: true, data: categories });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch categories';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/services/categories
 * Create a new service category
 */
router.post('/categories', requirePermission('SERVICE_CATEGORY_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, code, icon, description, sort_order } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Name and code are required' });
    }

    const newCategory = {
      id: memoryStore.serviceCategories.length + 1,
      name,
      slug: String(code).toLowerCase().replace(/\s+/g, '-'),
      code: String(code).toUpperCase().trim(),
      icon: icon || 'Wrench',
      description: description || null,
      sort_order: sort_order || memoryStore.serviceCategories.length + 1,
      active: true,
      created_at: new Date().toISOString(),
      deleted_at: null,
    };

    memoryStore.serviceCategories.push(newCategory);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CATEGORY_CREATE',
      entity: 'SERVICE_CATEGORY',
      entityId: String(newCategory.id),
      newValue: newCategory,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: newCategory });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create category';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/services
 * List all services with category info
 */
router.get('/', requirePermission('SERVICE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const activeOnly = req.query.active === 'true';
    let services = memoryStore.services.filter((s) => !s.deleted_at);
    if (activeOnly) {
      services = services.filter((s) => s.is_active || s.status === 'ACTIVE');
    }

    const enriched = services.map((s) => {
      const cat = memoryStore.serviceCategories.find((c) => c.id === s.category_id);
      return {
        ...s,
        category_name: cat?.name || 'Home Appliance',
        category_code: cat?.code || cat?.slug?.toUpperCase() || 'GENERAL',
      };
    });

    return res.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch services';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/services
 * Create a new service (Super Admin / SERVICE_CREATE)
 */
router.post('/', requirePermission('SERVICE_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      category_id,
      base_price,
      strike_price,
      duration_minutes,
      short_description,
      description,
      features,
      warranty_days,
      sla_hours,
      tax_rate,
      sort_order,
      image_url,
    } = req.body;

    if (!name || !category_id || base_price === undefined) {
      return res.status(400).json({ success: false, error: 'Name, category_id, and base_price are required' });
    }

    const serviceId = `srv-${Date.now()}`;
    const newService = {
      id: serviceId,
      public_id: `VXSVC-${String(memoryStore.services.length + 1).padStart(4, '0')}`,
      category_id: Number(category_id),
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price: Number(base_price),
      base_price: Number(base_price),
      discounted_price: strike_price ? Number(strike_price) : undefined,
      strike_price: strike_price ? Number(strike_price) : null,
      duration_minutes: duration_minutes ? Number(duration_minutes) : 60,
      short_description: short_description || null,
      description: description || name,
      requirements: ['Standard electric power supply', 'Clear workspace around appliance'],
      availability: ['Morning', 'Afternoon', 'Evening'],
      features: Array.isArray(features) ? features : [],
      warranty_days: warranty_days ? Number(warranty_days) : 30,
      sla_hours: sla_hours ? Number(sla_hours) : 4,
      tax_rate: tax_rate ? Number(tax_rate) : 18.0,
      tax_percent: tax_rate ? Number(tax_rate) : 18.0,
      sort_order: sort_order ? Number(sort_order) : memoryStore.services.length + 1,
      image_url: image_url || null,
      status: 'ACTIVE' as const,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    memoryStore.services.push(newService);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CREATE',
      entity: 'SERVICE',
      entityId: serviceId,
      newValue: newService,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: newService });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create service';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/v1/services/:id
 * Edit service details (Super Admin / SERVICE_EDIT)
 */
router.put('/:id', requirePermission('SERVICE_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const service = memoryStore.services.find((s) => s.id === id && !s.deleted_at);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const oldService = { ...service };
    const {
      name,
      category_id,
      base_price,
      strike_price,
      duration_minutes,
      short_description,
      description,
      features,
      warranty_days,
      sla_hours,
      tax_rate,
      sort_order,
      image_url,
    } = req.body;

    if (name) service.name = name;
    if (category_id !== undefined) service.category_id = Number(category_id);
    if (base_price !== undefined) {
      service.base_price = Number(base_price);
      service.price = Number(base_price);
    }
    if (strike_price !== undefined) {
      service.strike_price = Number(strike_price);
      service.discounted_price = Number(strike_price);
    }
    if (duration_minutes !== undefined) service.duration_minutes = Number(duration_minutes);
    if (short_description !== undefined) service.short_description = short_description;
    if (description !== undefined) service.description = description;
    if (features !== undefined) service.features = Array.isArray(features) ? features : [];
    if (warranty_days !== undefined) service.warranty_days = Number(warranty_days);
    if (sla_hours !== undefined) service.sla_hours = Number(sla_hours);
    if (tax_rate !== undefined) {
      service.tax_rate = Number(tax_rate);
      service.tax_percent = Number(tax_rate);
    }
    if (sort_order !== undefined) service.sort_order = Number(sort_order);
    if (image_url !== undefined) service.image_url = image_url;
    service.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_EDIT',
      entity: 'SERVICE',
      entityId: id,
      oldValue: oldService,
      newValue: service,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: service });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to edit service';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/v1/services/:id/pricing
 * Dedicated pricing update (SERVICE_PRICE_EDIT)
 */
router.patch('/:id/pricing', requirePermission('SERVICE_PRICE_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { base_price, strike_price, tax_rate } = req.body;

    const service = memoryStore.services.find((s) => s.id === id && !s.deleted_at);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const oldPricing = {
      base_price: service.base_price,
      strike_price: service.strike_price,
      tax_rate: service.tax_rate,
    };

    if (base_price !== undefined) {
      service.base_price = Number(base_price);
      service.price = Number(base_price);
    }
    if (strike_price !== undefined) {
      service.strike_price = Number(strike_price);
      service.discounted_price = Number(strike_price);
    }
    if (tax_rate !== undefined) {
      service.tax_rate = Number(tax_rate);
      service.tax_percent = Number(tax_rate);
    }
    service.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_PRICE_EDIT',
      entity: 'SERVICE',
      entityId: id,
      oldValue: oldPricing,
      newValue: { base_price: service.base_price, strike_price: service.strike_price, tax_rate: service.tax_rate },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: service });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update service pricing';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/v1/services/:id/status
 * Activate or deactivate a service (SERVICE_ACTIVATE / SERVICE_DEACTIVATE)
 */
router.patch('/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const requiredPerm = is_active ? 'SERVICE_ACTIVATE' : 'SERVICE_DEACTIVATE';

    // Verify user has the required permission
    const userRole = req.user?.role;
    const hasPerm = memoryStore.rolePermissions.some(
      (rp) => rp.role_code === userRole && (rp.permission_code === requiredPerm || rp.permission_code === 'SERVICE_EDIT' || userRole === 'SUPER_ADMIN')
    );

    if (!hasPerm) {
      return res.status(403).json({ success: false, error: `Forbidden: requires ${requiredPerm}` });
    }

    const service = memoryStore.services.find((s) => s.id === id && !s.deleted_at);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const oldStatus = service.is_active;
    service.is_active = Boolean(is_active);
    service.status = is_active ? 'ACTIVE' : 'INACTIVE';
    service.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: is_active ? 'SERVICE_ACTIVATE' : 'SERVICE_DEACTIVATE',
      entity: 'SERVICE',
      entityId: id,
      oldValue: { is_active: oldStatus },
      newValue: { is_active: service.is_active },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: service });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle service status';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * DELETE /api/v1/services/:id
 * Soft delete a service (SERVICE_DELETE)
 */
router.delete('/:id', requirePermission('SERVICE_DELETE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const service = memoryStore.services.find((s) => s.id === id && !s.deleted_at);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    service.deleted_at = new Date().toISOString();
    service.is_active = false;
    service.status = 'INACTIVE';
    service.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_DELETE',
      entity: 'SERVICE',
      entityId: id,
      oldValue: { is_active: true, deleted_at: null },
      newValue: { is_active: false, deleted_at: service.deleted_at },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, message: 'Service successfully deleted' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete service';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
