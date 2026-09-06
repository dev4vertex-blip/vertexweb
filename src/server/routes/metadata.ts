import { Router } from 'express';
import { getDb } from '../../db/client.js';
import { authenticateUser, requirePermission, AuthenticatedRequest } from '../middleware.js';

const router = Router();

// Apply auth to metadata queries
router.use(authenticateUser);

/**
 * GET /api/v1/roles
 */
router.get('/roles', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const result = await pglite.query(`SELECT * FROM roles ORDER BY code ASC`);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/permissions
 */
router.get('/permissions', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const result = await pglite.query(`SELECT * FROM permissions ORDER BY category ASC, code ASC`);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/cities
 */
router.get('/cities', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const result = await pglite.query(`
      SELECT c.*, s.name as state_name, s.code as state_code
      FROM cities c
      JOIN states s ON c.state_id = s.id
      ORDER BY c.name ASC
    `);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/states
 */
router.get('/states', async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const result = await pglite.query(`SELECT * FROM states ORDER BY name ASC`);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * GET /api/v1/audit-logs
 * Security audit trail view
 */
router.get('/audit-logs', requirePermission('AUDIT_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const { pglite } = await getDb();
    const limit = Math.min(100, parseInt(req.query.limit as string || '50', 10));
    const action = req.query.action as string;

    let sql = `SELECT * FROM audit_logs`;
    const params: any[] = [];

    if (action) {
      params.push(action);
      sql += ` WHERE action = $1`;
    }

    sql += ` ORDER BY created_at DESC LIMIT ${limit}`;

    const result = await pglite.query(sql, params);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
