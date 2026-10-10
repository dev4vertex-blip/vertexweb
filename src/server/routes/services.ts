import { Router } from 'express';
import crypto from 'crypto';
import { memoryStore } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePermission, requireAnyPermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// Require authentication for all service management endpoints
router.use(authenticateUser);

/**
 * Helper to compute category dependencies across active services and commission rules
 */
export function getCategoryDependencies(categoryId: number): {
  total: number;
  services: number;
  active_services: number;
  commission_rules: number;
  service_names: string[];
} {
  const linkedServices = memoryStore.services.filter((s) => s.category_id === categoryId && !s.deleted_at);
  const activeServices = linkedServices.filter((s) => s.is_active || s.status === 'ACTIVE');
  const linkedRules = (memoryStore.commissionRules || []).filter((r) => r.category_id === categoryId && !r.deleted_at);

  return {
    total: linkedServices.length + linkedRules.length,
    services: linkedServices.length,
    active_services: activeServices.length,
    commission_rules: linkedRules.length,
    service_names: linkedServices.map((s) => s.name),
  };
}

/**
 * GET /api/v1/services/categories
 * List all service categories with search, status filter, and live dependency counts
 */
router.get(
  '/categories',
  requireAnyPermission([
    'SERVICE_VIEW',
    'CATEGORY_VIEW',
    'PROMOTION_VIEW',
    'PROMOTION_CREATE',
    'PROMOTION_EDIT',
    'LEAD_VIEW',
    'LEAD_CREATE',
    'LEAD_VIEW_ALL',
    'LEAD_VIEW_TEAM',
    'LEAD_VIEW_OWN',
    'SALES_VIEW',
    'SALES_CREATE',
    'CUSTOMER_VIEW',
    'BOOKING_VIEW',
    'BOOKING_CREATE',
  ]),
  async (req: AuthenticatedRequest, res) => {
  try {
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';
    const status = req.query.status ? String(req.query.status).trim().toUpperCase() : 'ALL';

    let categories = memoryStore.serviceCategories.filter((c) => !c.deleted_at);

    if (search) {
      categories = categories.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          (c.code && c.code.toLowerCase().includes(search)) ||
          (c.description && c.description.toLowerCase().includes(search)) ||
          (c.slug && c.slug.toLowerCase().includes(search))
      );
    }

    if (status === 'ACTIVE') {
      categories = categories.filter((c) => c.active !== false);
    } else if (status === 'INACTIVE') {
      categories = categories.filter((c) => c.active === false);
    }

    // Enrich with dynamic service & dependency counts
    const enriched = categories.map((c) => {
      const deps = getCategoryDependencies(c.id);
      return {
        ...c,
        active: c.active !== false,
        status: c.active !== false ? 'ACTIVE' : 'INACTIVE',
        services: deps.services,
        active_services: deps.active_services,
        dependencies: deps,
      };
    });

    // Sort by sort_order then name
    enriched.sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999) || a.name.localeCompare(b.name));

    const allNonDeleted = memoryStore.serviceCategories.filter((c) => !c.deleted_at);
    const summary = {
      total: allNonDeleted.length,
      active: allNonDeleted.filter((c) => c.active !== false).length,
      inactive: allNonDeleted.filter((c) => c.active === false).length,
      total_services_covered: memoryStore.services.filter((s) => !s.deleted_at && s.category_id).length,
    };

    return res.json({
      success: true,
      data: enriched,
      total: enriched.length,
      summary,
    });
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
    const { name, code, icon, description, sort_order, active } = req.body;
    const cleanName = name ? String(name).trim() : '';
    const cleanCode = code ? String(code).trim().toUpperCase() : cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }
    if (!cleanCode) {
      return res.status(400).json({ success: false, error: 'Category code is required' });
    }

    // Duplicate checks
    const existingName = memoryStore.serviceCategories.find(
      (c) => !c.deleted_at && c.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (existingName) {
      return res.status(409).json({
        success: false,
        error: `A service category named "${cleanName}" already exists.`,
      });
    }

    const existingCode = memoryStore.serviceCategories.find(
      (c) => !c.deleted_at && c.code && c.code.trim().toUpperCase() === cleanCode
    );
    if (existingCode) {
      return res.status(409).json({
        success: false,
        error: `A service category with code "${cleanCode}" already exists.`,
      });
    }

    // Auto-generate safe incremental ID
    const maxId = memoryStore.serviceCategories.reduce((max, c) => (c.id > max ? c.id : max), 0);
    const newId = maxId + 1;

    const newCategory = {
      id: newId,
      name: cleanName,
      slug: cleanCode.toLowerCase().replace(/_/g, '-'),
      code: cleanCode,
      icon: icon && String(icon).trim() ? String(icon).trim() : '🛠️',
      description: description ? String(description).trim() : null,
      sort_order: sort_order !== undefined && sort_order !== null ? Number(sort_order) : newId,
      active: active !== undefined ? Boolean(active) : true,
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

    const deps = getCategoryDependencies(newCategory.id);

    return res.status(201).json({
      success: true,
      data: {
        ...newCategory,
        services: deps.services,
        active_services: deps.active_services,
        dependencies: deps,
      },
      message: `Category "${cleanName}" created successfully.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create category';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/v1/services/categories/:id
 * Update an existing service category
 */
router.put('/categories/:id', requirePermission('SERVICE_CATEGORY_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const category = memoryStore.serviceCategories.find((c) => c.id === id && !c.deleted_at);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const oldCategory = { ...category };
    const { name, code, icon, description, sort_order, active } = req.body;

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) {
        return res.status(400).json({ success: false, error: 'Category name cannot be empty' });
      }
      const nameDuplicate = memoryStore.serviceCategories.find(
        (c) => c.id !== id && !c.deleted_at && c.name.trim().toLowerCase() === cleanName.toLowerCase()
      );
      if (nameDuplicate) {
        return res.status(409).json({
          success: false,
          error: `A category named "${cleanName}" already exists.`,
        });
      }
      category.name = cleanName;
    }

    if (code !== undefined) {
      const cleanCode = String(code).trim().toUpperCase();
      if (!cleanCode) {
        return res.status(400).json({ success: false, error: 'Category code cannot be empty' });
      }
      const codeDuplicate = memoryStore.serviceCategories.find(
        (c) => c.id !== id && !c.deleted_at && c.code && c.code.trim().toUpperCase() === cleanCode
      );
      if (codeDuplicate) {
        return res.status(409).json({
          success: false,
          error: `A category with code "${cleanCode}" already exists.`,
        });
      }
      category.code = cleanCode;
      category.slug = cleanCode.toLowerCase().replace(/_/g, '-');
    }

    if (icon !== undefined) category.icon = String(icon).trim() || '🛠️';
    if (description !== undefined) category.description = description ? String(description).trim() : null;
    if (sort_order !== undefined) category.sort_order = Number(sort_order);
    if (active !== undefined) category.active = Boolean(active);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CATEGORY_UPDATE',
      entity: 'SERVICE_CATEGORY',
      entityId: String(id),
      oldValue: oldCategory,
      newValue: category,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const deps = getCategoryDependencies(id);

    return res.json({
      success: true,
      data: {
        ...category,
        services: deps.services,
        active_services: deps.active_services,
        dependencies: deps,
      },
      message: `Category "${category.name}" updated successfully.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update category';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/services/categories/:id/activate
 * Activate a service category
 */
router.post('/categories/:id/activate', requirePermission('SERVICE_CATEGORY_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const category = memoryStore.serviceCategories.find((c) => c.id === id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const previousActive = category.active;
    category.active = true;
    category.deleted_at = null;

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CATEGORY_ACTIVATE',
      entity: 'SERVICE_CATEGORY',
      entityId: String(id),
      oldValue: { active: previousActive },
      newValue: { active: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const deps = getCategoryDependencies(id);

    return res.json({
      success: true,
      data: {
        ...category,
        services: deps.services,
        active_services: deps.active_services,
        dependencies: deps,
      },
      message: `Category "${category.name}" is now active.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to activate category';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/services/categories/:id/deactivate
 * Deactivate a service category
 */
router.post('/categories/:id/deactivate', requirePermission('SERVICE_CATEGORY_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const category = memoryStore.serviceCategories.find((c) => c.id === id && !c.deleted_at);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const previousActive = category.active;
    category.active = false;

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CATEGORY_DEACTIVATE',
      entity: 'SERVICE_CATEGORY',
      entityId: String(id),
      oldValue: { active: previousActive },
      newValue: { active: false },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const deps = getCategoryDependencies(id);

    return res.json({
      success: true,
      data: {
        ...category,
        services: deps.services,
        active_services: deps.active_services,
        dependencies: deps,
      },
      message: `Category "${category.name}" has been deactivated.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to deactivate category';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * DELETE /api/v1/services/categories/:id
 * Delete or safely archive a service category
 * Dependency protection: if linked services or commission rules exist,
 * block hard deletion or safely archive/deactivate unless force/safe archival requested.
 */
router.delete('/categories/:id', requirePermission('SERVICE_CATEGORY_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const categoryIndex = memoryStore.serviceCategories.findIndex((c) => c.id === id && !c.deleted_at);
    if (categoryIndex === -1) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const category = memoryStore.serviceCategories[categoryIndex];
    const deps = getCategoryDependencies(id);
    const forceArchive = req.query.force_archive === 'true' || req.body?.force_archive === true;

    // Strict dependency check
    if (deps.total > 0 && !forceArchive) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category "${category.name}" because it contains ${deps.services} services (${deps.service_names.slice(0, 3).join(', ')}${deps.services > 3 ? '...' : ''}). Please reassign or delete these services first, or deactivate the category.`,
        dependencies: deps,
      });
    }

    if (deps.total > 0 && forceArchive) {
      // Safely archive
      category.deleted_at = new Date().toISOString();
      category.active = false;

      await logAuditEvent({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'SERVICE_CATEGORY_ARCHIVE',
        entity: 'SERVICE_CATEGORY',
        entityId: String(id),
        oldValue: { active: true, deleted_at: null },
        newValue: { active: false, deleted_at: category.deleted_at, reason: 'ARCHIVED_WITH_DEPENDENCIES' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        success: true,
        action: 'ARCHIVED',
        message: `Category "${category.name}" archived safely due to linked services.`,
        data: { id: category.id, name: category.name },
      });
    }

    // Zero active dependencies: allow clean deletion
    memoryStore.serviceCategories.splice(categoryIndex, 1);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CATEGORY_DELETE',
      entity: 'SERVICE_CATEGORY',
      entityId: String(id),
      oldValue: { id: category.id, name: category.name, code: category.code },
      newValue: null,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      action: 'DELETED',
      message: `Category "${category.name}" deleted successfully.`,
      data: { id: category.id, name: category.name },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete category';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/services
 * List all services with category info
 */
router.get(
  '/',
  requireAnyPermission([
    'SERVICE_VIEW',
    'CATEGORY_VIEW',
    'PROMOTION_VIEW',
    'PROMOTION_CREATE',
    'PROMOTION_EDIT',
    'BOOKING_VIEW',
    'BOOKING_CREATE',
    'LEAD_VIEW',
    'LEAD_CREATE',
  ]),
  async (req: AuthenticatedRequest, res) => {
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
 * PATCH /api/v1/services/:id/pricing & /api/v1/services/:id/price
 * Dedicated pricing update (SERVICE_PRICE_EDIT)
 */
router.patch(['/:id/pricing', '/:id/price'], requirePermission('SERVICE_PRICE_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const base_price = req.body.base_price !== undefined ? req.body.base_price : req.body.basePrice;
    const strike_price = req.body.strike_price !== undefined ? req.body.strike_price : req.body.strikePrice;
    const tax_rate = req.body.tax_rate !== undefined ? req.body.tax_rate : req.body.taxRate;

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
    const targetActive = req.body.is_active !== undefined ? Boolean(req.body.is_active) : Boolean(req.body.active);
    const requiredPerm = targetActive ? 'SERVICE_ACTIVATE' : 'SERVICE_DEACTIVATE';

    // Super Admin has unconditional bypass across all service operations
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const userPermissions: string[] = req.user?.permissions || [];
    const userRole = req.user?.role;

    const hasPerm =
      isSuperAdmin ||
      userPermissions.includes(requiredPerm) ||
      userPermissions.includes('SERVICE_EDIT') ||
      userPermissions.includes('SERVICE_MANAGE') ||
      memoryStore.rolePermissions.some(
        (rp) =>
          rp.role_code === userRole &&
          (rp.permission_code === requiredPerm || rp.permission_code === 'SERVICE_EDIT' || rp.permission_code === 'SERVICE_MANAGE')
      );

    if (!hasPerm) {
      return res.status(403).json({ success: false, error: `Forbidden: requires ${requiredPerm}` });
    }

    const service = memoryStore.services.find((s) => s.id === id && !s.deleted_at);
    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const oldStatus = service.is_active;
    service.is_active = targetActive;
    service.status = targetActive ? 'ACTIVE' : 'INACTIVE';
    service.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: targetActive ? 'SERVICE_ACTIVATE' : 'SERVICE_DEACTIVATE',
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
