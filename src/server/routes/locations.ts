import { Router } from 'express';
import { memoryStore, CityRecord } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

// Require authentication for all location endpoints
router.use(authenticateUser);

/**
 * Helper to compute dependency reference count for a location
 */
function getLocationDependencies(locationId: number) {
  const userCount = memoryStore.users.filter((u: any) => u.city_id === locationId).length;
  const bookingCount = memoryStore.bookings.filter((b: any) => b.city_id === locationId).length;
  const technicianCount = memoryStore.technicianProfiles.filter((t: any) => t.city_id === locationId).length;
  const scopeCount = memoryStore.locationScopes.filter((s: any) => s.city_id === locationId).length;

  const total = userCount + bookingCount + technicianCount + scopeCount;
  return {
    total,
    users: userCount,
    bookings: bookingCount,
    technicians: technicianCount,
    scopes: scopeCount,
  };
}

/**
 * GET /api/v1/locations
 * List all operational hubs and service locations
 */
router.get('/', requirePermission('LOCATION_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { search, status, state } = req.query;

    let locs = memoryStore.cities.filter((c) => !c.deleted_at);

    // Filter by status if provided and not 'ALL'
    if (status && String(status).toUpperCase() !== 'ALL') {
      const targetStatus = String(status).toUpperCase();
      locs = locs.filter((l) => {
        const itemStatus = (l.status || (l.active ? 'ACTIVE' : 'INACTIVE')).toUpperCase();
        return itemStatus === targetStatus;
      });
    }

    // Filter by state if provided
    if (state && String(state).trim()) {
      const st = String(state).trim().toLowerCase();
      locs = locs.filter((l) => {
        const stateObj = memoryStore.states.find((s) => s.id === l.state_id);
        const stateName = (stateObj ? stateObj.name : l.state_name || '').toLowerCase();
        const stateCode = (stateObj ? stateObj.code : l.state_code || '').toLowerCase();
        return (
          String(l.state_id) === st ||
          stateName === st ||
          stateName.includes(st) ||
          stateCode === st
        );
      });
    }

    // Filter by search keyword (checks name, code, city, area, pincode, state)
    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      // Intelligent synonym mappings for major Indian metropolitan hubs
      const cityAliases: Record<string, string[]> = {
        bengaluru: ['bangalore'],
        bangalore: ['bengaluru'],
        gurugram: ['gurgaon'],
        gurgaon: ['gurugram'],
        mumbai: ['bombay'],
        bombay: ['mumbai'],
        chennai: ['madras'],
        madras: ['chennai'],
        kolkata: ['calcutta'],
        calcutta: ['kolkata'],
      };
      const searchTerms = [q, ...(cityAliases[q] || [])];

      locs = locs.filter((l) => {
        const stateObj = memoryStore.states.find((s) => s.id === l.state_id);
        const stateName = (stateObj ? stateObj.name : l.state_name || '').toLowerCase();
        const stateCode = (stateObj ? stateObj.code : l.state_code || '').toLowerCase();
        const lName = (l.name || '').toLowerCase();
        const lCode = (l.code || '').toLowerCase();
        const lCity = (l.city || '').toLowerCase();
        const lArea = (l.area || '').toLowerCase();
        const lPin = (l.pincode || '').toLowerCase();

        return searchTerms.some(
          (term) =>
            lName.includes(term) ||
            lCode.includes(term) ||
            lCity.includes(term) ||
            lArea.includes(term) ||
            lPin.includes(term) ||
            stateName.includes(term) ||
            stateCode.includes(term)
        );
      });
    }

    // Enrich with state metadata and dependency counts
    const enriched = locs.map((l) => {
      const stateObj = memoryStore.states.find((s) => s.id === l.state_id);
      const deps = getLocationDependencies(l.id);
      return {
        ...l,
        state_name: stateObj ? stateObj.name : l.state_name || 'General',
        state_code: stateObj ? stateObj.code : l.state_code || 'GEN',
        status: l.status || (l.active ? 'ACTIVE' : 'INACTIVE'),
        usage_count: deps.total,
        dependencies: deps,
      };
    });

    // Sort by tier then name
    enriched.sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

    // Calculate global system metrics across all active non-deleted locations
    const allLocations = memoryStore.cities.filter((c) => !c.deleted_at);
    const globalSummary = {
      total: allLocations.length,
      active: allLocations.filter((c) => (c.status || (c.active ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE').length,
      states_count: new Set(allLocations.map((c) => c.state_id)).size,
      total_references: allLocations.reduce((sum, c) => sum + getLocationDependencies(c.id).total, 0),
    };

    return res.json({
      success: true,
      data: enriched,
      total: enriched.length,
      summary: globalSummary,
      available_states: memoryStore.states,
    });
  } catch (err: any) {
    console.error('Error fetching locations:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve locations.' },
    });
  }
});

/**
 * GET /api/v1/locations/:id
 * Retrieve a specific location by ID
 */
router.get('/:id', requirePermission('LOCATION_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const loc = memoryStore.cities.find((c) => c.id === id && !c.deleted_at);
    if (!loc) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Location with ID ${req.params.id} was not found.` },
      });
    }

    const stateObj = memoryStore.states.find((s) => s.id === loc.state_id);
    const deps = getLocationDependencies(loc.id);

    return res.json({
      success: true,
      data: {
        ...loc,
        state_name: stateObj ? stateObj.name : loc.state_name || 'General',
        state_code: stateObj ? stateObj.code : loc.state_code || 'GEN',
        status: loc.status || (loc.active ? 'ACTIVE' : 'INACTIVE'),
        usage_count: deps.total,
        dependencies: deps,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve location details.' },
    });
  }
});

/**
 * POST /api/v1/locations
 * Create a new operational service location (SUPER_ADMIN / LOCATION_CREATE)
 */
router.post('/', requirePermission('LOCATION_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      code,
      country = 'India',
      state_id,
      city,
      area,
      pincode,
      address,
      latitude,
      longitude,
      description,
      tier = 1,
      status = 'ACTIVE',
    } = req.body;

    // Validation: Name is required
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Location name is required and cannot be empty.' },
      });
    }

    // Validation: Code is required
    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Location code is required (e.g., DEL-CENTRAL).' },
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    // Validation: State must exist
    let resolvedStateId = Number(state_id);
    if (!resolvedStateId || isNaN(resolvedStateId)) {
      resolvedStateId = 1; // Default to state 1 if not specified
    }
    const stateRecord = memoryStore.states.find((s) => s.id === resolvedStateId);
    if (!stateRecord) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: `Invalid state ID: ${state_id}. Please select a valid state.` },
      });
    }

    // Uniqueness check: Code must be unique among active/existing locations
    const existingCode = memoryStore.cities.find(
      (c) => !c.deleted_at && c.code && c.code.toUpperCase() === cleanCode
    );
    if (existingCode) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_CODE',
          message: `A location with code '${cleanCode}' already exists (${existingCode.name}). Please specify a unique code.`,
        },
      });
    }

    // Uniqueness check: Name within same state must not duplicate
    const existingName = memoryStore.cities.find(
      (c) =>
        !c.deleted_at &&
        c.state_id === resolvedStateId &&
        c.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (existingName) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_NAME',
          message: `A location named '${cleanName}' already exists in ${stateRecord.name}.`,
        },
      });
    }

    // Determine new ID (max + 1)
    const maxId = memoryStore.cities.reduce((max, c) => (c.id > max ? c.id : max), 0);
    const newId = maxId + 1;

    const isActive = status !== 'INACTIVE' && status !== 'ARCHIVED';

    const newLocation: CityRecord = {
      id: newId,
      name: cleanName,
      code: cleanCode,
      country: country.trim() || 'India',
      state_id: resolvedStateId,
      state_name: stateRecord.name,
      state_code: stateRecord.code,
      city: (city && String(city).trim()) || cleanName,
      area: area ? String(area).trim() : undefined,
      pincode: pincode ? String(pincode).trim() : undefined,
      address: address ? String(address).trim() : undefined,
      latitude: latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) ? Number(longitude) : null,
      description: description ? String(description).trim() : undefined,
      tier: Number(tier) || 1,
      active: isActive,
      status: isActive ? 'ACTIVE' : 'INACTIVE',
      created_by: req.user?.name || req.user?.role || 'SUPER_ADMIN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryStore.cities.push(newLocation);

    // Comprehensive Audit Trail
    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'LOCATION_CREATED',
      entity: 'LOCATION',
      entityId: String(newId),
      newValue: {
        id: newId,
        name: cleanName,
        code: cleanCode,
        state: stateRecord.name,
        city: newLocation.city,
        status: newLocation.status,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      message: `Location '${cleanName}' (${cleanCode}) created successfully.`,
      data: {
        ...newLocation,
        usage_count: 0,
        dependencies: { total: 0, users: 0, bookings: 0, technicians: 0, scopes: 0 },
      },
    });
  } catch (err: any) {
    console.error('Error creating location:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create location.' },
    });
  }
});

/**
 * PUT /api/v1/locations/:id
 * Update an existing service location (SUPER_ADMIN / LOCATION_EDIT)
 */
router.put('/:id', requirePermission('LOCATION_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const locIndex = memoryStore.cities.findIndex((c) => c.id === id && !c.deleted_at);
    if (locIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Location with ID ${req.params.id} was not found.` },
      });
    }

    const existing = memoryStore.cities[locIndex];
    const {
      name,
      code,
      country,
      state_id,
      city,
      area,
      pincode,
      address,
      latitude,
      longitude,
      description,
      tier,
      status,
      active,
    } = req.body;

    // Validate non-empty name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Location name cannot be empty.' },
        });
      }
    }

    // Validate code uniqueness if changed
    if (code !== undefined) {
      const cleanCode = String(code).trim().toUpperCase();
      if (!cleanCode) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Location code cannot be empty.' },
        });
      }
      const codeDuplicate = memoryStore.cities.find(
        (c) => c.id !== id && !c.deleted_at && c.code && c.code.toUpperCase() === cleanCode
      );
      if (codeDuplicate) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: `A location with code '${cleanCode}' already exists (${codeDuplicate.name}).`,
          },
        });
      }
    }

    // Validate state if changed
    let resolvedStateId = existing.state_id;
    let stateRecord = memoryStore.states.find((s) => s.id === existing.state_id);
    if (state_id !== undefined) {
      resolvedStateId = Number(state_id);
      stateRecord = memoryStore.states.find((s) => s.id === resolvedStateId);
      if (!stateRecord) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATE', message: `Invalid state ID: ${state_id}.` },
        });
      }
    }

    // Check name duplication in state if changed
    const finalName = name !== undefined ? String(name).trim() : existing.name;
    if (name !== undefined || state_id !== undefined) {
      const nameDuplicate = memoryStore.cities.find(
        (c) =>
          c.id !== id &&
          !c.deleted_at &&
          c.state_id === resolvedStateId &&
          c.name.trim().toLowerCase() === finalName.toLowerCase()
      );
      if (nameDuplicate) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: `A location named '${finalName}' already exists in ${stateRecord?.name || 'this state'}.`,
          },
        });
      }
    }

    // Determine status & active synchronization
    let newStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' = existing.status || (existing.active ? 'ACTIVE' : 'INACTIVE');
    let newActive = existing.active;

    if (status !== undefined) {
      newStatus = String(status).toUpperCase() as any;
      newActive = newStatus === 'ACTIVE';
    } else if (active !== undefined) {
      newActive = Boolean(active);
      newStatus = newActive ? 'ACTIVE' : 'INACTIVE';
    }

    const previousCopy = { ...existing };

    const updated: CityRecord = {
      ...existing,
      name: finalName,
      code: code !== undefined ? String(code).trim().toUpperCase() : existing.code,
      country: country !== undefined ? String(country).trim() : existing.country || 'India',
      state_id: resolvedStateId,
      state_name: stateRecord ? stateRecord.name : existing.state_name,
      state_code: stateRecord ? stateRecord.code : existing.state_code,
      city: city !== undefined ? String(city).trim() : existing.city,
      area: area !== undefined ? String(area).trim() : existing.area,
      pincode: pincode !== undefined ? String(pincode).trim() : existing.pincode,
      address: address !== undefined ? String(address).trim() : existing.address,
      latitude: latitude !== undefined ? (latitude === null ? null : Number(latitude)) : existing.latitude,
      longitude: longitude !== undefined ? (longitude === null ? null : Number(longitude)) : existing.longitude,
      description: description !== undefined ? String(description).trim() : existing.description,
      tier: tier !== undefined ? Number(tier) : existing.tier,
      status: newStatus,
      active: newActive,
      updated_at: new Date().toISOString(),
    };

    memoryStore.cities[locIndex] = updated;

    // Comprehensive Audit Trail
    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'LOCATION_UPDATED',
      entity: 'LOCATION',
      entityId: String(id),
      oldValue: {
        name: previousCopy.name,
        code: previousCopy.code,
        status: previousCopy.status,
        state_id: previousCopy.state_id,
      },
      newValue: {
        name: updated.name,
        code: updated.code,
        status: updated.status,
        state_id: updated.state_id,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const deps = getLocationDependencies(id);

    return res.json({
      success: true,
      message: `Location '${updated.name}' updated successfully.`,
      data: {
        ...updated,
        usage_count: deps.total,
        dependencies: deps,
      },
    });
  } catch (err: any) {
    console.error('Error updating location:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update location.' },
    });
  }
});

/**
 * PATCH /api/v1/locations/:id
 * Partial update alias
 */
router.patch('/:id', requirePermission('LOCATION_EDIT'), async (req: AuthenticatedRequest, res) => {
  // Delegate directly to the PUT handler logic
  return (router as any).handle(req, res);
});

/**
 * POST /api/v1/locations/:id/activate
 * Activate a service location
 */
router.post('/:id/activate', requirePermission('LOCATION_ACTIVATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const loc = memoryStore.cities.find((c) => c.id === id && !c.deleted_at);
    if (!loc) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found.' },
      });
    }

    const previousStatus = loc.status;
    loc.status = 'ACTIVE';
    loc.active = true;
    loc.updated_at = new Date().toISOString();

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'LOCATION_ACTIVATED',
      entity: 'LOCATION',
      entityId: String(id),
      oldValue: { status: previousStatus, active: false },
      newValue: { status: 'ACTIVE', active: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const deps = getLocationDependencies(id);

    return res.json({
      success: true,
      message: `Location '${loc.name}' is now active and available for customer bookings.`,
      data: {
        ...loc,
        usage_count: deps.total,
        dependencies: deps,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to activate location.' },
    });
  }
});

/**
 * POST /api/v1/locations/:id/deactivate
 * Deactivate a service location
 */
router.post('/:id/deactivate', requirePermission('LOCATION_DEACTIVATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const loc = memoryStore.cities.find((c) => c.id === id && !c.deleted_at);
    if (!loc) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Location not found.' },
      });
    }

    const previousStatus = loc.status;
    loc.status = 'INACTIVE';
    loc.active = false;
    loc.updated_at = new Date().toISOString();

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'LOCATION_DEACTIVATED',
      entity: 'LOCATION',
      entityId: String(id),
      oldValue: { status: previousStatus, active: true },
      newValue: { status: 'INACTIVE', active: false },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const deps = getLocationDependencies(id);

    return res.json({
      success: true,
      message: `Location '${loc.name}' has been deactivated.`,
      data: {
        ...loc,
        usage_count: deps.total,
        dependencies: deps,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to deactivate location.' },
    });
  }
});

/**
 * DELETE /api/v1/locations/:id
 * Delete or safely archive a service location (SUPER_ADMIN / LOCATION_DELETE)
 * Strict Data Safety Rule: If referenced by bookings, users, technicians, or scopes,
 * safely archive/deactivate instead of hard deleting to preserve historical integrity.
 */
router.delete('/:id', requirePermission('LOCATION_DELETE'), async (req: AuthenticatedRequest, res) => {
  try {
    const id = Number(req.params.id);
    const locIndex = memoryStore.cities.findIndex((c) => c.id === id && !c.deleted_at);
    if (locIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Location with ID ${req.params.id} was not found.` },
      });
    }

    const targetLoc = memoryStore.cities[locIndex];
    const deps = getLocationDependencies(id);

    // Dependency check: If referenced by existing records, soft-delete / archive
    if (deps.total > 0) {
      targetLoc.status = 'ARCHIVED';
      targetLoc.active = false;
      targetLoc.updated_at = new Date().toISOString();

      logAuditEvent({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'LOCATION_DEACTIVATED',
        entity: 'LOCATION',
        entityId: String(id),
        oldValue: { status: 'ACTIVE', active: true },
        newValue: {
          status: 'ARCHIVED',
          active: false,
          reason: 'DEPENDENCY_PRESERVATION',
          summary: `Location archived safely due to ${deps.total} active dependency references (${deps.bookings} bookings, ${deps.users} users, ${deps.technicians} technicians).`,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({
        success: true,
        action: 'ARCHIVED',
        message: `Location '${targetLoc.name}' is referenced by ${deps.total} platform records (${deps.bookings} bookings, ${deps.users} users, ${deps.technicians} technicians). To safeguard platform history and billing integrity, it has been safely archived and deactivated rather than destroyed.`,
        data: {
          ...targetLoc,
          usage_count: deps.total,
          dependencies: deps,
        },
      });
    }

    // If NO dependencies exist: Safe hard deletion is permitted
    memoryStore.cities.splice(locIndex, 1);

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'LOCATION_DELETED',
      entity: 'LOCATION',
      entityId: String(id),
      oldValue: {
        id: targetLoc.id,
        name: targetLoc.name,
        code: targetLoc.code,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      action: 'DELETED',
      message: `Location '${targetLoc.name}' (${targetLoc.code || id}) was permanently removed because it had zero active dependencies.`,
      data: {
        id: targetLoc.id,
        name: targetLoc.name,
      },
    });
  } catch (err: any) {
    console.error('Error deleting location:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to process location deletion.' },
    });
  }
});

export default router;
