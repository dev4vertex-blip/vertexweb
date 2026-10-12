import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../../db/client.js';
import { memoryStore } from '../../db/memoryStore.js';
import { hashPassword, getFullUserById, logAuditEvent } from '../auth.js';
import { authenticateUser, requirePlatform, requirePermission, AuthenticatedRequest } from '../middleware.js';

const router = Router();

// Apply authentication and BUSINESS platform guard to user & customer administrative management routes
router.use(authenticateUser);
router.use(requirePlatform('BUSINESS'));

/**
 * GET /api/v1/users
 * Search, filter, and paginate users
 */
router.get('/', requirePermission('USER_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const currentUser = req.user;

    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '10', 10)));
    const offset = (page - 1) * limit;

    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const roleFilter = (req.query.role as string || '').trim();
    const statusFilter = (req.query.status as string || '').trim();
    const cityFilter = parseInt(req.query.cityId as string || '0', 10);
    const sortBy = ['created_at', 'name', 'public_id', 'role', 'status', 'last_login_at'].includes(req.query.sortBy as string)
      ? (req.query.sortBy as string)
      : 'created_at';
    const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build WHERE clauses
    const whereConditions: string[] = ['u.deleted_at IS NULL'];
    const queryParams: any[] = [];

    // Role-based scope restrictions:
    // If Manager: Can view Sales, Technicians, Customers or users in their region
    if (currentUser.role === 'MANAGER') {
      whereConditions.push(`u.role IN ('SALES', 'TECHNICIAN', 'CUSTOMER')`);
    }

    if (search) {
      queryParams.push(`%${search}%`);
      const idx = queryParams.length;
      whereConditions.push(
        `(LOWER(u.name) LIKE $${idx} OR LOWER(u.email) LIKE $${idx} OR u.phone LIKE $${idx} OR LOWER(u.public_id) LIKE $${idx})`
      );
    }

    if (roleFilter && roleFilter !== 'ALL') {
      queryParams.push(roleFilter);
      whereConditions.push(`u.role = $${queryParams.length}`);
    }

    if (statusFilter && statusFilter !== 'ALL') {
      queryParams.push(statusFilter);
      whereConditions.push(`u.status = $${queryParams.length}`);
    }

    if (cityFilter > 0) {
      queryParams.push(cityFilter);
      whereConditions.push(`u.city_id = $${queryParams.length}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count total matching
    const countSql = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const countRes = await pglite.query(countSql, queryParams);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Fetch paginated records with City and Role names
    const dataSql = `
      SELECT
        u.id,
        u.public_id as "publicId",
        u.name,
        u.email,
        u.phone,
        u.role,
        r.name as "roleName",
        u.status,
        u.profile_image as "profileImage",
        u.city_id as "cityId",
        c.name as "cityName",
        u.created_at as "createdAt",
        u.updated_at as "updatedAt",
        u.last_login_at as "lastLoginAt"
      FROM users u
      LEFT JOIN cities c ON u.city_id = c.id
      LEFT JOIN roles r ON u.role = r.code
      ${whereClause}
      ORDER BY u.${sortBy} ${sortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const dataRes = await pglite.query(dataSql, queryParams);

    return res.json({
      success: true,
      data: dataRes.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error('Fetch users error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_USERS_FAILED', message: 'Failed to retrieve users.' },
    });
  }
});

/**
 * GET /api/v1/users/:id
 * Retrieve user details including profile and audit history
 */
router.get('/:id', requirePermission('USER_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const user = await getFullUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User does not exist.' },
      });
    }

    // Role-based scope protection
    if (req.user.role === 'MANAGER' && !['SALES', 'TECHNICIAN', 'CUSTOMER'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view administrative users.' },
      });
    }

    // Fetch recent audit logs for this user
    const auditRes = await pglite.query(
      `SELECT * FROM audit_logs
       WHERE entity_id = $1 OR user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.params.id]
    );

    return res.json({
      success: true,
      user,
      auditHistory: auditRes.rows,
    });
  } catch (err: any) {
    console.error('Fetch user detail error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_USER_FAILED', message: 'Error retrieving user details.' },
    });
  }
});

/**
 * POST /api/v1/users
 * Create a new user with role profile
 */
router.post('/', requirePermission('USER_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const currentUser = req.user;
    const body = req.body;

    // 1. Validate required fields
    if (!body.name || body.name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Full name must be at least 2 characters.' },
      });
    }

    if (!body.role) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'User role must be specified.' },
      });
    }

    // 2. Strict Role Restrictions:
    // Manager can ONLY create SALES / SALES_TEAM team members!
    if (currentUser.role === 'MANAGER' && !['SALES', 'SALES_TEAM'].includes(body.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PRIVILEGE_RESTRICTION',
          message: 'Operations Managers are strictly authorized to create Sales Team members only.',
        },
      });
    }

    // ADMIN cannot create SUPER_ADMIN accounts
    if (currentUser.role === 'ADMIN' && body.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ROLE_ASSIGNMENT',
          message: 'Administrators cannot create Super Administrator accounts.',
        },
      });
    }

    // Other non-Super Admins cannot create administrative roles
    if (
      !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role) &&
      ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE'].includes(body.role)
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ROLE_ASSIGNMENT',
          message: 'You cannot create users with administrative privileges.',
        },
      });
    }

    // 3. Clean and validate phone and email
    const cleanEmail = body.email ? body.email.trim().toLowerCase() : null;
    const cleanPhone = body.phone ? body.phone.replace(/\D/g, '').slice(-10) : null;

    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' },
        });
      }

      // Check unique email
      const existingEmail = await pglite.query(
        `SELECT id FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`,
        [cleanEmail]
      );
      if (existingEmail.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_IN_USE', message: 'A user with this email address already exists.' },
        });
      }
    }

    if (cleanPhone) {
      if (cleanPhone.length !== 10) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PHONE', message: 'Phone number must be a valid 10-digit mobile number.' },
        });
      }

      // Check unique phone
      const existingPhone = await pglite.query(
        `SELECT id FROM users WHERE (phone LIKE $1 OR phone = $2) AND deleted_at IS NULL LIMIT 1`,
        [`%${cleanPhone}`, cleanPhone]
      );
      if (existingPhone.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: { code: 'PHONE_IN_USE', message: 'A user with this phone number already exists.' },
        });
      }
    }

    // 4. Generate next Public ID: VXUSR-0000XX
    const countRes = await pglite.query(`SELECT COUNT(*) as c FROM users`);
    const nextSeq = parseInt(countRes.rows[0]?.c || '17', 10) + 1;
    const publicId = `VXUSR-${String(nextSeq).padStart(6, '0')}`;

    const newUserId = crypto.randomUUID();
    const defaultPassword = body.password || 'password123';
    const passwordHash = await hashPassword(defaultPassword);
    const initialStatus = ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'].includes(body.status) ? body.status : 'ACTIVE';
    const cityId = body.cityId ? parseInt(body.cityId, 10) : null;

    // 5. Insert User
    await pglite.query(
      `INSERT INTO users (id, public_id, name, email, phone, password_hash, role, status, profile_image, city_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        newUserId,
        publicId,
        body.name.trim(),
        cleanEmail,
        cleanPhone ? `+91 ${cleanPhone}` : null,
        passwordHash,
        body.role,
        initialStatus,
        body.profileImage || null,
        cityId,
      ]
    );

    // 6. Create Primary Location Scope
    if (cityId) {
      await pglite.query(
        `INSERT INTO user_location_scopes (id, user_id, city_id, scope_type, is_primary, created_at)
         VALUES ($1, $2, $3, 'CITY', TRUE, CURRENT_TIMESTAMP)`,
        [crypto.randomUUID(), newUserId, cityId]
      );
    }

    // 7. Role-Specific Profile Insertion
    if (body.role === 'SALES') {
      const baseSalary = parseFloat(body.baseSalary) || 45000;
      const commissionRate = parseFloat(body.commissionRate) || 8.5;
      const monthlyTarget = parseFloat(body.monthlyTarget) || 250000;
      const employeeType = ['FULL_TIME', 'CONTRACTOR', 'COMMISSION_ONLY'].includes(body.employeeType) ? body.employeeType : 'FULL_TIME';
      const compensationModel = ['FIXED_SALARY', 'COMMISSION', 'FIXED_PLUS_COMMISSION'].includes(body.compensationModel) ? body.compensationModel : 'FIXED_PLUS_COMMISSION';

      await pglite.query(
        `INSERT INTO sales_profiles (id, user_id, employee_type, compensation_model, base_salary, commission_rate, monthly_target, revenue_generated, bookings_created, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, CURRENT_TIMESTAMP)`,
        [crypto.randomUUID(), newUserId, employeeType, compensationModel, baseSalary, commissionRate, monthlyTarget]
      );
    } else if (body.role === 'MANAGER') {
      await pglite.query(
        `INSERT INTO manager_profiles (id, user_id, assigned_region, department, direct_reports_count, created_at)
         VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP)`,
        [crypto.randomUUID(), newUserId, body.assignedRegion || 'Delhi NCR', body.department || 'Hub Operations & Fleet']
      );
    } else if (body.role === 'FINANCE') {
      await pglite.query(
        `INSERT INTO finance_profiles (id, user_id, department, approval_limit, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [crypto.randomUUID(), newUserId, body.department || 'Accounts & Audit', parseFloat(body.approvalLimit) || 500000]
      );
    } else if (body.role === 'TECHNICIAN') {
      const skillsArray = Array.isArray(body.skills) ? body.skills : (body.skills ? [body.skills] : ['General Maintenance']);
      const areasArray = Array.isArray(body.serviceAreas) ? body.serviceAreas : ['Central Zone'];
      await pglite.query(
        `INSERT INTO technician_profiles (id, user_id, skills, service_areas, experience_years, rating, jobs_assigned, jobs_completed, verification_status, created_at)
         VALUES ($1, $2, $3, $4, $5, 5.0, 0, 0, 'VERIFIED', CURRENT_TIMESTAMP)`,
        [crypto.randomUUID(), newUserId, JSON.stringify(skillsArray), JSON.stringify(areasArray), parseInt(body.experienceYears, 10) || 3]
      );
    } else if (body.role === 'CUSTOMER') {
      await pglite.query(
        `INSERT INTO customer_profiles (id, user_id, customer_type, preferred_language, notes, created_at)
         VALUES ($1, $2, $3, 'English', $4, CURRENT_TIMESTAMP)`,
        [crypto.randomUUID(), newUserId, body.customerType || 'INDIVIDUAL', body.notes || '']
      );
    }

    // 7b. Custom User Permissions if provided (e.g. granular overrides)
    if (Array.isArray(body.permissions)) {
      for (const pCode of body.permissions) {
        await pglite.query(
          `INSERT INTO user_permissions (id, user_id, permission_code, granted_by, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, permission_code) DO NOTHING`,
          [crypto.randomUUID(), newUserId, pCode, currentUser.id]
        ).catch(() => {});
        if (memoryStore.userPermissions) {
          memoryStore.userPermissions.push({ user_id: newUserId, permission_code: pCode });
        }
      }
    }

    // Sync to memoryStore fallback users in local development only
    if (process.env.NODE_ENV !== 'production') {
      memoryStore.users.push({
        id: newUserId,
        public_id: publicId,
        name: body.name.trim(),
        email: cleanEmail,
        phone: cleanPhone ? `+91 ${cleanPhone}` : null,
        password_hash: passwordHash,
        role: body.role,
        status: initialStatus,
        profile_image: body.profileImage || null,
        city_id: cityId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: null,
        deleted_at: null,
      });
    }

    // 8. Write Audit Log
    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: newUserId,
      newValue: {
        publicId,
        name: body.name,
        email: cleanEmail,
        role: body.role,
        status: initialStatus,
        cityId,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const fullCreatedUser = await getFullUserById(newUserId);

    return res.status(201).json({
      success: true,
      message: `User ${body.name} (${publicId}) successfully created.`,
      user: fullCreatedUser,
    });
  } catch (err: any) {
    console.error('Create user error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'CREATE_USER_FAILED', message: 'Failed to create user record in database.' },
    });
  }
});

/**
 * PUT /api/v1/users/:id
 * Update user details
 */
router.put('/:id', requirePermission('USER_UPDATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const currentUser = req.user;
    const targetUserId = req.params.id;
    const body = req.body;

    const existingUser = await getFullUserById(targetUserId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
    }

    // Super Admin Protection: Only Super Admin can modify another Super Admin
    if (existingUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only Super Administrators can modify Super Admin accounts.' },
      });
    }

    // Manager Protection: Manager can ONLY edit Sales users
    if (currentUser.role === 'MANAGER') {
      if (existingUser.role !== 'SALES') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Managers may only edit Sales team members.' },
        });
      }
      if (body.role && body.role !== 'SALES') {
        return res.status(403).json({
          success: false,
          error: { code: 'PRIVILEGE_ESCALATION_DENIED', message: 'Managers cannot modify user roles.' },
        });
      }
    }

    // Prevent privilege escalation: Non-Super Admin cannot promote users to SUPER_ADMIN or MANAGER
    if (currentUser.role !== 'SUPER_ADMIN' && body.role && body.role !== existingUser.role) {
      return res.status(403).json({
        success: false,
        error: { code: 'PRIVILEGE_ESCALATION_DENIED', message: 'You do not have permission to alter user roles.' },
      });
    }

    // Clean fields
    const updatedName = body.name ? body.name.trim() : existingUser.name;
    const updatedEmail = body.email ? body.email.trim().toLowerCase() : existingUser.email;
    const updatedPhone = body.phone ? body.phone.trim() : existingUser.phone;
    const updatedCityId = body.cityId !== undefined ? (body.cityId ? parseInt(body.cityId, 10) : null) : existingUser.cityId;
    const updatedRole = body.role || existingUser.role;

    // Execute update
    await pglite.query(
      `UPDATE users
       SET name = $1, email = $2, phone = $3, city_id = $4, role = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [updatedName, updatedEmail, updatedPhone, updatedCityId, updatedRole, targetUserId]
    );

    // Update role profile if Sales
    if (existingUser.role === 'SALES') {
      if (body.monthlyTarget !== undefined || body.baseSalary !== undefined || body.commissionRate !== undefined) {
        await pglite.query(
          `UPDATE sales_profiles
           SET monthly_target = COALESCE($1, monthly_target),
               base_salary = COALESCE($2, base_salary),
               commission_rate = COALESCE($3, commission_rate)
           WHERE user_id = $4`,
          [
            body.monthlyTarget ? parseFloat(body.monthlyTarget) : null,
            body.baseSalary ? parseFloat(body.baseSalary) : null,
            body.commissionRate ? parseFloat(body.commissionRate) : null,
            targetUserId,
          ]
        );
      }
    }

    // Update custom permissions if provided
    if (Array.isArray(body.permissions)) {
      await pglite.query(`DELETE FROM user_permissions WHERE user_id = $1`, [targetUserId]).catch(() => {});
      if (memoryStore.userPermissions) {
        memoryStore.userPermissions = memoryStore.userPermissions.filter((up) => up.user_id !== targetUserId);
      }
      for (const pCode of body.permissions) {
        await pglite.query(
          `INSERT INTO user_permissions (id, user_id, permission_code, granted_by, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, permission_code) DO NOTHING`,
          [crypto.randomUUID(), targetUserId, pCode, currentUser.id]
        ).catch(() => {});
        if (memoryStore.userPermissions) {
          memoryStore.userPermissions.push({ user_id: targetUserId, permission_code: pCode });
        }
      }
    }

    // Update status if provided
    if (body.status && ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'].includes(body.status)) {
      await pglite.query(`UPDATE users SET status = $1 WHERE id = $2`, [body.status, targetUserId]).catch(() => {});
    }

    // Sync memoryStore user
    const memUser = memoryStore.users.find((u) => u.id === targetUserId);
    if (memUser) {
      memUser.name = updatedName;
      memUser.email = updatedEmail;
      memUser.phone = updatedPhone;
      memUser.city_id = updatedCityId;
      memUser.role = updatedRole;
      if (body.status && ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'].includes(body.status)) {
        memUser.status = body.status;
      }
      if (body.department !== undefined) {
        memUser.department = body.department || null;
      }
      memUser.updated_at = new Date().toISOString();
    }

    // Write audit log
    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'USER_UPDATED',
      entity: 'USER',
      entityId: targetUserId,
      oldValue: {
        name: existingUser.name,
        email: existingUser.email,
        phone: existingUser.phone,
        role: existingUser.role,
        cityId: existingUser.cityId,
      },
      newValue: {
        name: updatedName,
        email: updatedEmail,
        phone: updatedPhone,
        role: updatedRole,
        cityId: updatedCityId,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const updatedUser = await getFullUserById(targetUserId);

    return res.json({
      success: true,
      message: `User ${updatedName} updated successfully.`,
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('Update user error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'UPDATE_USER_FAILED', message: 'Failed to update user.' },
    });
  }
});

/**
 * PATCH /api/v1/users/:id/status
 * Activate, Deactivate, or Suspend user
 */
router.patch('/:id/status', requirePermission('USER_DEACTIVATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const currentUser = req.user;
    const targetUserId = req.params.id;
    const { status, reason } = req.body;

    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: "Status must be 'ACTIVE', 'INACTIVE', or 'SUSPENDED'." },
      });
    }

    const targetUser = await getFullUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
    }

    // Protect Super Admin accounts
    if (targetUser.role === 'SUPER_ADMIN') {
      if (currentUser.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only Super Administrators can change Super Admin status.' },
        });
      }

      // Check if this is the last active Super Admin
      if (status !== 'ACTIVE') {
        const adminCount = await pglite.query(
          `SELECT COUNT(*) as c FROM users WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE' AND deleted_at IS NULL`
        );
        if (parseInt(adminCount.rows[0]?.c || '0', 10) <= 1) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'CANNOT_DEACTIVATE_LAST_ADMIN',
              message: 'Cannot deactivate the sole active Super Administrator account.',
            },
          });
        }
      }
    }

    // Manager can only deactivate Sales team members
    if (currentUser.role === 'MANAGER' && targetUser.role !== 'SALES') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Operations Managers are only permitted to deactivate Sales members.' },
      });
    }

    await pglite.query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, targetUserId]
    );

    const action = status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entity: 'USER',
      entityId: targetUserId,
      oldValue: { status: targetUser.status },
      newValue: { status, reason: reason || 'Administrative status change' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `User status updated to ${status}.`,
      status,
    });
  } catch (err: any) {
    console.error('Status update error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'STATUS_UPDATE_FAILED', message: 'Failed to update user status.' },
    });
  }
});

/**
 * DELETE /api/v1/users/:id
 * Soft delete user account
 */
router.delete('/:id', requirePermission('USER_DELETE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const currentUser = req.user;
    const targetUserId = req.params.id;

    const targetUser = await getFullUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
    }

    // NEVER allow deleting Super Admin accounts
    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 'CANNOT_DELETE_SUPER_ADMIN', message: 'Super Administrator accounts cannot be deleted.' },
      });
    }

    // Soft delete
    await pglite.query(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP, status = 'DELETED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [targetUserId]
    );

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'USER_DELETED',
      entity: 'USER',
      entityId: targetUserId,
      oldValue: { publicId: targetUser.publicId, name: targetUser.name, role: targetUser.role },
      newValue: { deletedAt: new Date().toISOString() },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.publicId}) successfully deleted.`,
    });
  } catch (err: any) {
    console.error('Delete user error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'DELETE_USER_FAILED', message: 'Failed to delete user.' },
    });
  }
});

/**
 * POST /api/v1/users/:id/reset-password
 * Reset user password with security enforcement
 * Required permission: USER_UPDATE (or alias USER_EDIT)
 */
router.post('/:id/reset-password', requirePermission('USER_UPDATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const currentUser = req.user;
    const targetUserId = req.params.id;
    const { newPassword } = req.body;

    const targetUser = await getFullUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
    }

    // Role restrictions: Non-Super Admin cannot reset Super Admin password
    if (targetUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only Super Administrators can reset Super Admin passwords.' },
      });
    }

    // Manager can ONLY reset password for Sales team members
    if (currentUser.role === 'MANAGER' && targetUser.role !== 'SALES') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Operations Managers can only reset credentials for Sales members.' },
      });
    }

    const passwordToSet = newPassword || 'Vertex@2026';
    const passwordHash = await hashPassword(passwordToSet);

    await pglite.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [passwordHash, targetUserId]
    );

    // Also update in-memory store if present
    const memUser = memoryStore.users.find((u) => u.id === targetUserId || u.public_id === targetUserId);
    if (memUser) {
      memUser.password_hash = passwordHash;
      memUser.updated_at = new Date().toISOString();
    }

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'USER_PASSWORD_RESET',
      entity: 'USER',
      entityId: targetUserId,
      oldValue: null,
      newValue: { resetBy: currentUser.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `Password reset successfully for user ${targetUser.name}.`,
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'PASSWORD_RESET_FAILED', message: 'Failed to reset password.' },
    });
  }
});

/**
 * PATCH /api/v1/users/:id/role
 * Reassign user role
 * Required permission: USER_ASSIGN_ROLE (or USER_UPDATE)
 */
router.patch('/:id/role', requirePermission('USER_UPDATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const currentUser = req.user;
    const targetUserId = req.params.id;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'New role must be provided.' },
      });
    }

    const targetUser = await getFullUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
      });
    }

    // Role Escalation Protection: Only Super Admin can change Super Admin or promote to Super Admin
    if ((targetUser.role === 'SUPER_ADMIN' || role === 'SUPER_ADMIN') && currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Super Administrator roles can only be altered by Super Admin.' },
      });
    }

    // Manager cannot change roles
    if (currentUser.role === 'MANAGER') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Managers do not have privilege to modify user roles.' },
      });
    }

    const oldRole = targetUser.role;
    await pglite.query(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [role, targetUserId]
    );

    const memUser = memoryStore.users.find((u) => u.id === targetUserId || u.public_id === targetUserId);
    if (memUser) {
      memUser.role = role;
      memUser.updated_at = new Date().toISOString();
    }

    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'USER_ROLE_CHANGED',
      entity: 'USER',
      entityId: targetUserId,
      oldValue: { role: oldRole },
      newValue: { role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: `User ${targetUser.name} role changed from ${oldRole} to ${role}.`,
      role,
    });
  } catch (err: any) {
    console.error('Role update error:', err);
    return res.status(500).json({
      success: false,
      error: { code: 'ROLE_UPDATE_FAILED', message: 'Failed to update user role.' },
    });
  }
});

export default router;
