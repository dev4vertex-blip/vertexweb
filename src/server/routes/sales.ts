import { Router, Response } from 'express';
import { memoryStore } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePlatform, requirePermission } from '../middleware.js';
import { getManagerScope } from './managers.js';

const router = Router();

// Strictly authenticate all sales endpoints with BUSINESS platform guard
router.use(authenticateUser);
router.use(requirePlatform('BUSINESS'));

/**
 * Helper: Format currency in Indian Rupees notation
 */
function formatINR(val: number): string {
  return '₹' + Number(val || 0).toLocaleString('en-IN');
}

/**
 * GET /api/v1/sales/targets
 * Returns target and quota data strictly scoped by authenticated role.
 * - SALES: Returns ONLY personal target & quota (ignoring any query params).
 * - MANAGER: Returns team aggregate & member targets within manager scope.
 * - SUPER_ADMIN / ADMIN: Returns company-wide aggregate & all individual targets.
 */
router.get('/targets', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    // 1. INDIVIDUAL SALES USER: Strict personal isolation
    if (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM') {
      const ownProfile = memoryStore.salesProfiles.find((p) => p.user_id === currentUser.id);
      const monthlyTarget = ownProfile?.monthly_target || 300000;
      const revenueGenerated = ownProfile?.revenue_generated || 0;
      const achievementPct = monthlyTarget > 0 ? parseFloat(((revenueGenerated / monthlyTarget) * 100).toFixed(1)) : 0;

      // Calculate assigned leads stats
      const ownLeads = memoryStore.leads.filter((l) => !l.deleted_at && l.assigned_to === currentUser.id);
      const ownWonLeads = ownLeads.filter((l) => l.status === 'WON').length;
      const ownActiveLeads = ownLeads.filter((l) => l.status === 'ACTIVE').length;

      return res.json({
        success: true,
        scope: 'PERSONAL',
        data: {
          user_id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          employee_type: ownProfile?.employee_type || 'FULL_TIME',
          monthly_target: monthlyTarget,
          monthly_target_formatted: formatINR(monthlyTarget),
          revenue_generated: revenueGenerated,
          revenue_generated_formatted: formatINR(revenueGenerated),
          achievement_percentage: achievementPct,
          bookings_created: ownProfile?.bookings_created || 0,
          assigned_leads_count: ownLeads.length,
          active_leads_count: ownActiveLeads,
          won_leads_count: ownWonLeads,
          status: 'ACTIVE',
        },
      });
    }

    // 2. MANAGER: Returns team scope strictly within manager's authorized jurisdiction
    if (currentUser.role === 'MANAGER') {
      const scope = getManagerScope(currentUser.id);
      const members = scope.salesUsers.map((u) => {
        const prof = memoryStore.salesProfiles.find((p) => p.user_id === u.id);
        const target = prof?.monthly_target || 250000;
        const achieved = prof?.revenue_generated || 0;
        const pct = target > 0 ? parseFloat(((achieved / target) * 100).toFixed(1)) : 0;
        return {
          user_id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          territory: u.city_id === 1 ? 'Delhi NCR & Central Hub' : u.city_id === 2 ? 'Gurgaon & Cyber City' : 'Mumbai Metro & Coastal',
          monthly_target: target,
          monthly_target_formatted: formatINR(target),
          revenue_generated: achieved,
          revenue_generated_formatted: formatINR(achieved),
          achievement_percentage: pct,
          status: u.status === 'ACTIVE' ? 'Active' : 'Inactive',
        };
      });

      const teamTarget = members.reduce((sum, m) => sum + m.monthly_target, 0);
      const teamAchieved = members.reduce((sum, m) => sum + m.revenue_generated, 0);
      const teamPct = teamTarget > 0 ? parseFloat(((teamAchieved / teamTarget) * 100).toFixed(1)) : 0;

      return res.json({
        success: true,
        scope: 'TEAM',
        hub: scope.managerHub,
        team_scope: scope.teamScope,
        data: {
          team_target: teamTarget,
          team_target_formatted: formatINR(teamTarget),
          team_achieved: teamAchieved,
          team_achieved_formatted: formatINR(teamAchieved),
          team_achievement_percentage: teamPct,
          members,
        },
      });
    }

    // 3. SUPER ADMIN / ADMIN: Company-wide scope
    const allSalesUsers = memoryStore.users.filter((u) => !u.deleted_at && (u.role === 'SALES' || u.role === 'SALES_TEAM'));
    const members = allSalesUsers.map((u) => {
      const prof = memoryStore.salesProfiles.find((p) => p.user_id === u.id);
      const target = prof?.monthly_target || 300000;
      const achieved = prof?.revenue_generated || 0;
      const pct = target > 0 ? parseFloat(((achieved / target) * 100).toFixed(1)) : 0;
      return {
        user_id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        territory: u.city_id === 1 ? 'Delhi NCR & Central Hub' : u.city_id === 2 ? 'Gurgaon & Cyber City' : 'Mumbai Metro & Coastal',
        monthly_target: target,
        monthly_target_formatted: formatINR(target),
        revenue_generated: achieved,
        revenue_generated_formatted: formatINR(achieved),
        achievement_percentage: pct,
        status: u.status === 'ACTIVE' ? 'Active' : 'Inactive',
      };
    });

    const teamTarget = members.reduce((sum, m) => sum + m.monthly_target, 0);
    const teamAchieved = members.reduce((sum, m) => sum + m.revenue_generated, 0);
    const teamPct = teamTarget > 0 ? parseFloat(((teamAchieved / teamTarget) * 100).toFixed(1)) : 0;

    return res.json({
      success: true,
      scope: 'COMPANY',
      data: {
        team_target: teamTarget,
        team_target_formatted: formatINR(teamTarget),
        team_achieved: teamAchieved,
        team_achieved_formatted: formatINR(teamAchieved),
        team_achievement_percentage: teamPct,
        members,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve sales targets';
    return res.status(500).json({ success: false, error: { code: 'SALES_TARGETS_FAILED', message: msg } });
  }
});

/**
 * GET /api/v1/sales/performance
 * Returns performance metrics strictly scoped to user role.
 */
router.get('/performance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    if (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM') {
      const ownProfile = memoryStore.salesProfiles.find((p) => p.user_id === currentUser.id);
      const ownLeads = memoryStore.leads.filter((l) => !l.deleted_at && l.assigned_to === currentUser.id);
      const activeLeads = ownLeads.filter((l) => l.status === 'ACTIVE');
      const wonLeads = ownLeads.filter((l) => l.status === 'WON');
      const lostLeads = ownLeads.filter((l) => l.status === 'LOST');

      const pipelineValue = activeLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
      const wonValue = wonLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
      const totalResolved = wonLeads.length + lostLeads.length;
      const conversionRate = totalResolved > 0 ? parseFloat(((wonLeads.length / totalResolved) * 100).toFixed(1)) : 0;

      const monthlyTarget = ownProfile?.monthly_target || 300000;
      const revenueGenerated = ownProfile?.revenue_generated || wonValue;
      const quotaPct = monthlyTarget > 0 ? parseFloat(((revenueGenerated / monthlyTarget) * 100).toFixed(1)) : 0;

      return res.json({
        success: true,
        scope: 'PERSONAL',
        data: {
          user_id: currentUser.id,
          name: currentUser.name,
          monthly_target: monthlyTarget,
          revenue_generated: revenueGenerated,
          quota_achievement_percentage: quotaPct,
          total_assigned_leads: ownLeads.length,
          active_pipeline_leads: activeLeads.length,
          won_leads_count: wonLeads.length,
          pipeline_value: pipelineValue,
          won_value: wonValue,
          conversion_rate: conversionRate,
          bookings_created: ownProfile?.bookings_created || 0,
        },
      });
    }

    // Manager / Super Admin performance
    const isManager = currentUser.role === 'MANAGER';
    let leads = memoryStore.leads.filter((l) => !l.deleted_at);
    let totalTarget = 0;
    let totalAchieved = 0;

    if (isManager) {
      const scope = getManagerScope(currentUser.id);
      leads = leads.filter(
        (l) => scope.salesUserIds.includes(l.assigned_to) || l.created_by === currentUser.id
      );
      const teamProfiles = memoryStore.salesProfiles.filter((p) => scope.salesUserIds.includes(p.user_id));
      totalTarget = teamProfiles.reduce((sum, p) => sum + (p.monthly_target || 0), 0);
      totalAchieved = teamProfiles.reduce((sum, p) => sum + (p.revenue_generated || 0), 0);
    } else {
      totalTarget = memoryStore.salesProfiles.reduce((sum, p) => sum + (p.monthly_target || 0), 0);
      totalAchieved = memoryStore.salesProfiles.reduce((sum, p) => sum + (p.revenue_generated || 0), 0);
    }

    const activeLeads = leads.filter((l) => l.status === 'ACTIVE');
    const wonLeads = leads.filter((l) => l.status === 'WON');
    const lostLeads = leads.filter((l) => l.status === 'LOST');

    const pipelineValue = activeLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
    const wonValue = wonLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
    const totalResolved = wonLeads.length + lostLeads.length;
    const conversionRate = totalResolved > 0 ? parseFloat(((wonLeads.length / totalResolved) * 100).toFixed(1)) : 0;

    return res.json({
      success: true,
      scope: isManager ? 'TEAM' : 'COMPANY',
      data: {
        total_target: totalTarget,
        total_achieved: totalAchieved,
        quota_achievement_percentage: totalTarget > 0 ? parseFloat(((totalAchieved / totalTarget) * 100).toFixed(1)) : 0,
        total_leads: leads.length,
        active_pipeline_leads: activeLeads.length,
        won_leads_count: wonLeads.length,
        pipeline_value: pipelineValue,
        won_value: wonValue,
        conversion_rate: conversionRate,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve sales performance';
    return res.status(500).json({ success: false, error: { code: 'SALES_PERFORMANCE_FAILED', message: msg } });
  }
});

/**
 * GET /api/v1/sales/pipeline
 * Returns pipeline metrics strictly scoped to user role.
 */
router.get('/pipeline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    let scopedLeads = memoryStore.leads.filter((l) => !l.deleted_at);
    if (currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM') {
      scopedLeads = scopedLeads.filter((l) => l.assigned_to === currentUser.id);
    } else if (currentUser.role === 'MANAGER') {
      const scope = getManagerScope(currentUser.id);
      scopedLeads = scopedLeads.filter((l) => scope.salesUserIds.includes(l.assigned_to) || l.created_by === currentUser.id);
    }

    const activeLeads = scopedLeads.filter((l) => l.status === 'ACTIVE');
    const wonLeads = scopedLeads.filter((l) => l.status === 'WON');
    const lostLeads = scopedLeads.filter((l) => l.status === 'LOST');
    const pipelineValue = activeLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
    const wonValue = wonLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);

    return res.json({
      success: true,
      scope: currentUser.role === 'SALES' || currentUser.role === 'SALES_TEAM' ? 'PERSONAL' : currentUser.role === 'MANAGER' ? 'TEAM' : 'AGGREGATE',
      data: {
        total_leads: scopedLeads.length,
        active_leads: activeLeads.length,
        won_leads: wonLeads.length,
        lost_leads: lostLeads.length,
        pipeline_value: pipelineValue,
        pipeline_value_formatted: formatINR(pipelineValue),
        won_value: wonValue,
        won_value_formatted: formatINR(wonValue),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve sales pipeline';
    return res.status(500).json({ success: false, error: { code: 'SALES_PIPELINE_FAILED', message: msg } });
  }
});

/**
 * GET /api/v1/sales/team
 * Protected endpoint for Managers and Super Admins.
 * Individual Sales users are FORBIDDEN from viewing this endpoint.
 */
router.get('/team', requirePermission('SALES_TEAM_VIEW'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    let salesUsers = memoryStore.users.filter((u) => !u.deleted_at && (u.role === 'SALES' || u.role === 'SALES_TEAM'));

    if (currentUser?.role === 'MANAGER') {
      const scope = getManagerScope(currentUser.id);
      salesUsers = scope.salesUsers;
    }

    const members = salesUsers.map((u, idx) => {
      const prof = memoryStore.salesProfiles.find((p) => p.user_id === u.id);
      const target = prof?.monthly_target || 300000;
      const achieved = prof?.revenue_generated || 0;
      return {
        id: `SLS-${101 + idx}`,
        user_id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        territory: u.city_id === 1 ? 'Delhi NCR & Central Hub' : u.city_id === 2 ? 'Gurgaon & Cyber City' : 'Mumbai Metro & Coastal',
        amcTarget: formatINR(target),
        amcAchieved: formatINR(achieved),
        rawTarget: target,
        rawAchieved: achieved,
        status: u.status === 'ACTIVE' ? 'Active' : 'Inactive',
      };
    });

    const pipelineTarget = members.reduce((sum, m) => sum + m.rawTarget, 0);
    const achievedVolume = members.reduce((sum, m) => sum + m.rawAchieved, 0);
    const conversionRate = pipelineTarget > 0 ? ((achievedVolume / pipelineTarget) * 100).toFixed(1) : '0';

    return res.json({
      success: true,
      data: {
        members,
        stats: {
          totalReps: members.length,
          activeReps: members.filter((m) => m.status === 'Active').length,
          pipelineTarget: formatINR(pipelineTarget),
          rawPipelineTarget: pipelineTarget,
          achievedVolume: formatINR(achievedVolume),
          rawAchievedVolume: achievedVolume,
          conversionRate: `${conversionRate}%`,
        },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve sales team directory';
    return res.status(500).json({ success: false, error: { code: 'SALES_TEAM_FETCH_FAILED', message: msg } });
  }
});

export default router;
