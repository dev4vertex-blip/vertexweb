import { Router } from 'express';
import crypto from 'crypto';
import { memoryStore } from '../../db/memoryStore.js';
import { catalogRepository, ServiceCategoryEntity, ServiceEntity } from '../repositories/catalogRepository.js';
import { catalogService } from '../services/catalogService.js';
import { authenticateUser, AuthenticatedRequest, requirePlatform, requirePermission, requireAnyPermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// Require authentication and BUSINESS platform guard for all service management endpoints
router.use(authenticateUser);
router.use(requirePlatform('BUSINESS'));

/**
 * Helper to compute category dependencies across active services and commission rules
 */
export async function getCategoryDependencies(categoryId: number): Promise<{
  total: number;
  services: number;
  active_services: number;
  commission_rules: number;
  service_names: string[];
}> {
  const allServices = await catalogRepository.listServices({ categoryId });
  const activeServices = allServices.filter((s) => s.is_active || s.status === 'ACTIVE');
  const linkedRules = (memoryStore.commissionRules || []).filter((r) => r.category_id === categoryId && !r.deleted_at);

  return {
    total: allServices.length + linkedRules.length,
    services: allServices.length,
    active_services: activeServices.length,
    commission_rules: linkedRules.length,
    service_names: allServices.map((s) => s.name),
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

      // Authoritative PostgreSQL query
      let categories = await catalogRepository.listCategories();

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
      const enriched = await Promise.all(
        categories.map(async (c) => {
          const deps = await getCategoryDependencies(c.id);
          return {
            ...c,
            active: c.active !== false,
            status: c.active !== false ? 'ACTIVE' : 'INACTIVE',
            services: deps.services,
            active_services: deps.active_services,
            dependencies: deps,
          };
        })
      );

      // Sort by sort_order then name
      enriched.sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999) || a.name.localeCompare(b.name));

      const allDbCategories = await catalogRepository.listCategories();
      const allDbServices = await catalogRepository.listServices();

      const summary = {
        total: allDbCategories.length,
        active: allDbCategories.filter((c) => c.active !== false).length,
        inactive: allDbCategories.filter((c) => c.active === false).length,
        total_services_covered: allDbServices.filter((s) => s.category_id).length,
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
  }
);

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

    // Duplicate checks in PostgreSQL
    const existingCategories = await catalogRepository.listCategories();
    const existingName = existingCategories.find((c) => c.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (existingName) {
      return res.status(409).json({
        success: false,
        error: `A service category named "${cleanName}" already exists.`,
      });
    }

    const existingCode = existingCategories.find((c) => c.code && c.code.trim().toUpperCase() === cleanCode);
    if (existingCode) {
      return res.status(409).json({
        success: false,
        error: `A service category with code "${cleanCode}" already exists.`,
      });
    }

    const created = await catalogRepository.createCategory({
      name: cleanName,
      code: cleanCode,
      slug: cleanCode.toLowerCase().replace(/_/g, '-'),
      icon: icon && String(icon).trim() ? String(icon).trim() : '🛠️',
      description: description ? String(description).trim() : null,
      sort_order: sort_order !== undefined && sort_order !== null ? Number(sort_order) : 1,
      active: active !== undefined ? Boolean(active) : true,
    });

    // In-memory sync for backward compatibility
    memoryStore.serviceCategories.push({
      id: created.id,
      name: created.name,
      slug: created.slug || '',
      code: created.code || '',
      icon: created.icon || '🛠️',
      description: created.description,
      sort_order: created.sort_order,
      active: created.active,
      created_at: created.created_at,
      deleted_at: null,
    });

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CATEGORY_CREATE',
      entity: 'SERVICE_CATEGORY',
      entityId: String(created.id),
      newValue: created,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const deps = await getCategoryDependencies(created.id);

    return res.status(201).json({
      success: true,
      data: {
        ...created,
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
    const existing = await catalogRepository.getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const { name, code, icon, description, sort_order, active } = req.body;
    const updateData: Partial<ServiceCategoryEntity> = {};

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) {
        return res.status(400).json({ success: false, error: 'Category name cannot be empty' });
      }
      updateData.name = cleanName;
    }

    if (code !== undefined) {
      const cleanCode = String(code).trim().toUpperCase();
      if (!cleanCode) {
        return res.status(400).json({ success: false, error: 'Category code cannot be empty' });
      }
      updateData.code = cleanCode;
      updateData.slug = cleanCode.toLowerCase().replace(/_/g, '-');
    }

    if (icon !== undefined) updateData.icon = String(icon).trim() || '🛠️';
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (sort_order !== undefined) updateData.sort_order = Number(sort_order);
    if (active !== undefined) updateData.active = Boolean(active);

    const updated = await catalogRepository.updateCategory(id, updateData);

    // Sync in-memory store
    const memCat = memoryStore.serviceCategories.find((c) => c.id === id);
    if (memCat && updated) {
      Object.assign(memCat, updated);
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CATEGORY_UPDATE',
      entity: 'SERVICE_CATEGORY',
      entityId: String(id),
      oldValue: existing,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const deps = await getCategoryDependencies(id);

    return res.json({
      success: true,
      data: {
        ...updated,
        services: deps.services,
        active_services: deps.active_services,
        dependencies: deps,
      },
      message: `Category "${updated?.name}" updated successfully.`,
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
    const existing = await catalogRepository.getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const updated = await catalogRepository.updateCategory(id, { active: true });

    const memCat = memoryStore.serviceCategories.find((c) => c.id === id);
    if (memCat) {
      memCat.active = true;
      memCat.deleted_at = null;
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CATEGORY_ACTIVATE',
      entity: 'SERVICE_CATEGORY',
      entityId: String(id),
      oldValue: { active: existing.active },
      newValue: { active: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const deps = await getCategoryDependencies(id);

    return res.json({
      success: true,
      data: {
        ...updated,
        services: deps.services,
        active_services: deps.active_services,
        dependencies: deps,
      },
      message: `Category "${updated?.name}" is now active.`,
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
    const existing = await catalogRepository.getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const updated = await catalogRepository.updateCategory(id, { active: false });

    const memCat = memoryStore.serviceCategories.find((c) => c.id === id);
    if (memCat) {
      memCat.active = false;
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CATEGORY_DEACTIVATE',
      entity: 'SERVICE_CATEGORY',
      entityId: String(id),
      oldValue: { active: existing.active },
      newValue: { active: false },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const deps = await getCategoryDependencies(id);

    return res.json({
      success: true,
      data: {
        ...updated,
        services: deps.services,
        active_services: deps.active_services,
        dependencies: deps,
      },
      message: `Category "${updated?.name}" has been deactivated.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to deactivate category';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * DELETE /api/v1/services/categories/:id
 * Delete or safely archive a service category
 */
router.delete('/categories/:id', requirePermission('SERVICE_CATEGORY_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const category = await catalogRepository.getCategoryById(id);
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const deps = await getCategoryDependencies(id);
    const forceArchive = req.query.force_archive === 'true' || req.body?.force_archive === true;

    // Strict dependency check
    if (deps.total > 0 && !forceArchive) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category "${category.name}" because it contains ${deps.services} services (${deps.service_names.slice(0, 3).join(', ')}${deps.services > 3 ? '...' : ''}). Please reassign or delete these services first, or deactivate the category.`,
        dependencies: deps,
      });
    }

    await catalogRepository.softDeleteCategory(id);

    // Sync in-memory store
    const memIdx = memoryStore.serviceCategories.findIndex((c) => c.id === id);
    if (memIdx !== -1) {
      memoryStore.serviceCategories[memIdx].deleted_at = new Date().toISOString();
      memoryStore.serviceCategories[memIdx].active = false;
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CATEGORY_ARCHIVE',
      entity: 'SERVICE_CATEGORY',
      entityId: String(id),
      oldValue: { active: true, deleted_at: null },
      newValue: { active: false, reason: 'ARCHIVED' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      action: 'ARCHIVED',
      message: `Category "${category.name}" archived safely.`,
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
      const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
      const services = await catalogRepository.listServices({ activeOnly, categoryId });

      return res.json({ success: true, data: services });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch services';
      return res.status(500).json({ success: false, error: msg });
    }
  }
);

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

    const serviceId = `srv-${crypto.randomUUID()}`;
    const publicSuffix = Math.floor(1000 + Math.random() * 9000);
    const publicId = `VXSVC-${publicSuffix}`;

    const created = await catalogRepository.createService({
      id: serviceId,
      public_id: publicId,
      category_id: Number(category_id),
      name: String(name).trim(),
      slug: String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price: Number(base_price),
      base_price: Number(base_price),
      discounted_price: strike_price ? Number(strike_price) : null,
      strike_price: strike_price ? Number(strike_price) : null,
      duration_minutes: duration_minutes ? Number(duration_minutes) : 60,
      short_description: short_description || null,
      description: description || name,
      requirements: JSON.stringify(['Standard electric power supply', 'Clear workspace around appliance']),
      availability: JSON.stringify(['Morning', 'Afternoon', 'Evening']),
      features: typeof features === 'string' ? features : JSON.stringify(features || []),
      warranty_days: warranty_days ? Number(warranty_days) : 30,
      sla_hours: sla_hours ? Number(sla_hours) : 4,
      tax_percent: tax_rate ? Number(tax_rate) : 18.0,
      sort_order: sort_order ? Number(sort_order) : 1,
      image_url: image_url || null,
      status: 'ACTIVE',
      is_active: true,
    });

    // In-memory sync for backward compatibility
    memoryStore.services.push({
      id: created.id,
      public_id: created.public_id,
      category_id: created.category_id,
      name: created.name,
      slug: created.slug || '',
      price: Number(created.price),
      base_price: Number(created.base_price),
      discounted_price: created.discounted_price ? Number(created.discounted_price) : undefined,
      strike_price: created.strike_price ? Number(created.strike_price) : null,
      duration_minutes: created.duration_minutes,
      short_description: created.short_description,
      description: created.description || created.name,
      requirements: ['Standard electric power supply', 'Clear workspace around appliance'],
      availability: ['Morning', 'Afternoon', 'Evening'],
      features: Array.isArray(features) ? features : [],
      warranty_days: created.warranty_days,
      sla_hours: created.sla_hours,
      tax_rate: Number(created.tax_percent),
      tax_percent: Number(created.tax_percent),
      sort_order: created.sort_order,
      image_url: created.image_url,
      status: 'ACTIVE',
      is_active: true,
      created_at: created.created_at,
      updated_at: created.updated_at,
      deleted_at: null,
    });

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_CREATE',
      entity: 'SERVICE',
      entityId: serviceId,
      newValue: created,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: created });
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
    const existing = await catalogRepository.getServiceById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const {
      name,
      base_price,
      strike_price,
      duration_minutes,
      description,
      status,
      is_active,
    } = req.body;

    const updated = await catalogRepository.updateService(existing.id, {
      name: name !== undefined ? String(name).trim() : undefined,
      price: base_price !== undefined ? Number(base_price) : undefined,
      base_price: base_price !== undefined ? Number(base_price) : undefined,
      discounted_price: strike_price !== undefined ? Number(strike_price) : undefined,
      duration_minutes: duration_minutes !== undefined ? Number(duration_minutes) : undefined,
      description: description !== undefined ? description : undefined,
      status: status !== undefined ? status : undefined,
      is_active: is_active !== undefined ? Boolean(is_active) : undefined,
    });

    // In-memory sync
    const memService = memoryStore.services.find((s) => s.id === existing.id || s.public_id === existing.public_id);
    if (memService && updated) {
      Object.assign(memService, updated);
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_EDIT',
      entity: 'SERVICE',
      entityId: id,
      oldValue: existing,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: updated });
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

    const existing = await catalogRepository.getServiceById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const updated = await catalogRepository.updateService(existing.id, {
      price: base_price !== undefined ? Number(base_price) : undefined,
      base_price: base_price !== undefined ? Number(base_price) : undefined,
      discounted_price: strike_price !== undefined ? Number(strike_price) : undefined,
    });

    // In-memory sync
    const memService = memoryStore.services.find((s) => s.id === existing.id || s.public_id === existing.public_id);
    if (memService && updated) {
      memService.base_price = Number(updated.base_price);
      memService.price = Number(updated.price);
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_PRICE_EDIT',
      entity: 'SERVICE',
      entityId: id,
      oldValue: { base_price: existing.base_price },
      newValue: { base_price: updated?.base_price },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: updated });
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

    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const userPermissions: string[] = req.user?.permissions || [];

    const hasPerm =
      isSuperAdmin ||
      userPermissions.includes(requiredPerm) ||
      userPermissions.includes('SERVICE_EDIT') ||
      userPermissions.includes('SERVICE_MANAGE');

    if (!hasPerm) {
      return res.status(403).json({ success: false, error: `Forbidden: requires ${requiredPerm}` });
    }

    const existing = await catalogRepository.getServiceById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const updated = await catalogRepository.updateService(existing.id, {
      is_active: targetActive,
      status: targetActive ? 'ACTIVE' : 'INACTIVE',
    });

    const memService = memoryStore.services.find((s) => s.id === existing.id || s.public_id === existing.public_id);
    if (memService && updated) {
      memService.is_active = targetActive;
      memService.status = targetActive ? 'ACTIVE' : 'INACTIVE';
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: targetActive ? 'SERVICE_ACTIVATE' : 'SERVICE_DEACTIVATE',
      entity: 'SERVICE',
      entityId: id,
      oldValue: { is_active: existing.is_active },
      newValue: { is_active: targetActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: updated });
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
    const existing = await catalogRepository.getServiceById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    await catalogRepository.softDeleteService(existing.id);

    const memService = memoryStore.services.find((s) => s.id === existing.id || s.public_id === existing.public_id);
    if (memService) {
      memService.deleted_at = new Date().toISOString();
      memService.is_active = false;
      memService.status = 'INACTIVE';
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'SERVICE_DELETE',
      entity: 'SERVICE',
      entityId: id,
      oldValue: { is_active: true },
      newValue: { is_active: false, deleted_at: new Date().toISOString() },
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
