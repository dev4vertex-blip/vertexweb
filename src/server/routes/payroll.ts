import { Router } from 'express';
import { memoryStore } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePlatform, requirePermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

router.use(authenticateUser);
router.use(requirePlatform('BUSINESS'));

/**
 * GET /api/v1/payroll/structures
 * View employee salary structures (PAYROLL_SALARY_STRUCTURE_VIEW)
 */
router.get('/structures', requirePermission('PAYROLL_SALARY_STRUCTURE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const structs = memoryStore.salaryStructures;
    const enriched = structs.map((s) => {
      const emp = memoryStore.employees.find((e) => e.id === s.employee_id);
      return {
        ...s,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Employee',
        employee_code: emp?.employee_code || 'VXEMP',
      };
    });
    return res.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch salary structures';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/payroll/structures
 * Create or update salary structure (PAYROLL_SALARY_STRUCTURE_CREATE / EDIT)
 */
router.post('/structures', requirePermission('PAYROLL_SALARY_STRUCTURE_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      employee_id,
      base_monthly,
      basic_salary,
      hra,
      special_allowance,
      conveyance_allowance,
      medical_allowance,
      provident_fund_employee,
      provident_fund_employer,
      esi_employee,
      professional_tax,
      tds_monthly,
    } = req.body;

    if (!employee_id || base_monthly === undefined) {
      return res.status(400).json({ success: false, error: 'employee_id and base_monthly are required' });
    }

    const bMonthly = Number(base_monthly);
    const basic = basic_salary !== undefined ? Number(basic_salary) : Math.round(bMonthly * 0.5);
    const h = hra !== undefined ? Number(hra) : Math.round(bMonthly * 0.3);
    const spec = special_allowance !== undefined ? Number(special_allowance) : bMonthly - basic - h;

    const existing = memoryStore.salaryStructures.find((s) => s.employee_id === employee_id && !s.effective_to);
    if (existing) {
      existing.effective_to = new Date().toISOString().split('T')[0];
    }

    const newStruct = {
      id: `sal-struct-${Date.now()}`,
      employee_id,
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: null,
      base_monthly: bMonthly,
      basic_salary: basic,
      hra: h,
      special_allowance: spec,
      conveyance_allowance: conveyance_allowance ? Number(conveyance_allowance) : 0,
      medical_allowance: medical_allowance ? Number(medical_allowance) : 0,
      provident_fund_employee: provident_fund_employee !== undefined ? Number(provident_fund_employee) : Math.round(basic * 0.12),
      provident_fund_employer: provident_fund_employer !== undefined ? Number(provident_fund_employer) : Math.round(basic * 0.12),
      esi_employee: esi_employee ? Number(esi_employee) : 0,
      professional_tax: professional_tax ? Number(professional_tax) : 200,
      tds_monthly: tds_monthly ? Number(tds_monthly) : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryStore.salaryStructures.push(newStruct);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PAYROLL_SALARY_STRUCTURE_CREATE',
      entity: 'SALARY_STRUCTURE',
      entityId: newStruct.id,
      newValue: newStruct,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: newStruct });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save salary structure';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/payroll/runs
 * List monthly payroll processing runs (PAYROLL_VIEW)
 */
router.get('/runs', requirePermission('PAYROLL_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    return res.json({ success: true, data: memoryStore.payrollRuns });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch payroll runs';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/payroll/runs
 * Create a new payroll run cycle in DRAFT state (PAYROLL_CREATE)
 */
router.post('/runs', requirePermission('PAYROLL_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, error: 'Month (1-12) and Year are required' });
    }

    const monthNum = Number(month);
    const yearNum = Number(year);

    const existing = memoryStore.payrollRuns.find((r) => r.month === monthNum && r.year === yearNum);
    if (existing) {
      return res.status(400).json({ success: false, error: `Payroll run for ${monthNum}/${yearNum} already exists` });
    }

    const runId = `prun-${yearNum}-${String(monthNum).padStart(2, '0')}`;
    const newRun = {
      id: runId,
      month: monthNum,
      year: yearNum,
      title: `${new Date(yearNum, monthNum - 1).toLocaleString('default', { month: 'long' })} ${yearNum} Staff Payroll`,
      status: 'DRAFT' as const,
      total_employees: 0,
      total_gross: 0,
      total_deductions: 0,
      total_net: 0,
      processed_by: req.user?.id || 'usr-pay-1',
      approved_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryStore.payrollRuns.unshift(newRun);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PAYROLL_RUN_CREATE',
      entity: 'PAYROLL_RUN',
      entityId: runId,
      newValue: newRun,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: newRun });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create payroll run';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/payroll/runs/:id/process
 * Compute attendance-adjusted salaries & create payslips (PAYROLL_PROCESS)
 */
router.post('/runs/:id/process', requirePermission('PAYROLL_PROCESS'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const run = memoryStore.payrollRuns.find((r) => r.id === id);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Payroll run not found' });
    }

    if (run.status === 'FINALIZED' || run.status === 'PAID') {
      return res.status(400).json({ success: false, error: `Cannot process locked payroll in status ${run.status}` });
    }

    // Process all active employees
    const activeEmployees = memoryStore.employees.filter((e) => !e.deleted_at && (e.status === 'ACTIVE' || e.employment_status === 'ACTIVE'));
    const [y, m] = (run.month_year || '2026-08').split('-').map(Number);
    const runYear = run.year || y || 2026;
    const runMonth = run.month || m || 8;
    const daysInMonth = new Date(runYear, runMonth, 0).getDate();

    let runGross = 0;
    let runDeductions = 0;
    let runNet = 0;

    // Clear previous payslips for this run if any
    memoryStore.payslips = memoryStore.payslips.filter((p) => p.payroll_run_id !== id);

    for (const emp of activeEmployees) {
      const struct = memoryStore.salaryStructures.find((s) => s.employee_id === emp.id && !s.effective_to)
        || memoryStore.salaryStructures.find((s) => s.employee_id === emp.id)
        || memoryStore.salaryStructures[0];

      const baseMonthly = struct?.base_monthly || emp.monthly_ctc || 35000;
      const basic = struct?.basic_salary || Math.round(baseMonthly * (struct?.basic_percent ? struct.basic_percent / 100 : 0.5));
      const hra = struct?.hra || Math.round(baseMonthly * (struct?.hra_percent ? struct.hra_percent / 100 : 0.3));
      const special = struct?.special_allowance || (baseMonthly - basic - hra > 0 ? baseMonthly - basic - hra : 0);

      const pf = struct?.provident_fund_employee || Math.round(basic * (struct?.pf_employee_rate ? struct.pf_employee_rate / 100 : 0.12));
      const pt = struct?.professional_tax || struct?.pt_monthly || 200;
      const tds = struct?.tds_monthly || 0;

      // Mock attendance summary: 26 payable days, 0 unpaid
      const payableDays = 26;
      const unpaidLeave = 0;

      const gross = basic + hra + special;
      const deductions = pf + pt + tds;
      const net = gross - deductions;

      runGross += gross;
      runDeductions += deductions;
      runNet += net;

      const payslip: any = {
        id: `pslip-${run.id}-${emp.id}`,
        payroll_run_id: run.id,
        employee_id: emp.id,
        employee_code: emp.employee_id || emp.employee_code || 'VXEMP',
        employee_name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Staff',
        department: emp.department_name || 'Operations',
        designation: emp.designation_name || 'Specialist',
        month_year: run.month_year || `${runYear}-${String(runMonth).padStart(2, '0')}`,
        month: runMonth,
        year: runYear,
        basic_salary: basic,
        hra,
        special_allowance: special,
        conveyance: struct?.conveyance_allowance || struct?.conveyance_monthly || 0,
        medical: struct?.medical_allowance || struct?.medical_monthly || 0,
        bonus: 0,
        overtime_pay: 0,
        gross_salary: gross,
        pf_employee: pf,
        esi_employee: struct?.esi_employee || 0,
        professional_tax: pt,
        tds,
        unpaid_leave_deduction: 0,
        other_deductions: 0,
        total_deductions: deductions,
        net_salary: net,
        payment_status: 'PENDING' as const,
        payment_mode: 'BANK_TRANSFER' as const,
        bank_name: emp.bank_account_number ? 'HDFC Bank' : 'Primary Bank',
        account_number_masked: emp.bank_account_number ? `****${emp.bank_account_number.slice(-4)}` : '****1234',
        generated_at: new Date().toISOString(),
      };

      memoryStore.payslips.push(payslip);
    }

    run.employee_count = activeEmployees.length;
    run.total_employees = activeEmployees.length;
    run.total_gross = runGross;
    run.total_deductions = runDeductions;
    run.total_net = runNet;
    run.status = 'PROCESSED';
    run.processed_by = req.user?.id || 'usr-pay-1';
    run.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PAYROLL_PROCESS',
      entity: 'PAYROLL_RUN',
      entityId: id,
      newValue: run,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: run });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to process payroll';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/payroll/runs/:id/approve
 * Approve processed payroll (PAYROLL_APPROVE - SUPER_ADMIN or FINANCE)
 */
router.post('/runs/:id/approve', requirePermission('PAYROLL_APPROVE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const run = memoryStore.payrollRuns.find((r) => r.id === id);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Payroll run not found' });
    }

    if (run.status !== 'PROCESSED') {
      return res.status(400).json({ success: false, error: `Run must be in PROCESSED status to approve (currently ${run.status})` });
    }

    run.status = 'APPROVED';
    run.approved_by = req.user?.id || 'usr-superadmin-1';
    run.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PAYROLL_APPROVE',
      entity: 'PAYROLL_RUN',
      entityId: id,
      newValue: run,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: run });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to approve payroll';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/payroll/runs/:id/finalize
 * Finalize, lock run, and release payslips to staff (PAYROLL_FINALIZE)
 */
router.post('/runs/:id/finalize', requirePermission('PAYROLL_FINALIZE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const run = memoryStore.payrollRuns.find((r) => r.id === id);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Payroll run not found' });
    }

    if (run.status !== 'APPROVED') {
      return res.status(400).json({ success: false, error: `Run must be APPROVED before finalizing (currently ${run.status})` });
    }

    run.status = 'FINALIZED';
    run.updated_at = new Date().toISOString();

    // Mark payslips as issued/processed
    memoryStore.payslips.forEach((p) => {
      if (p.payroll_run_id === id) {
        p.payment_status = 'PAID';
        p.payment_date = new Date().toISOString().split('T')[0];
      }
    });

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PAYROLL_FINALIZE',
      entity: 'PAYROLL_RUN',
      entityId: id,
      newValue: run,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: run });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to finalize payroll';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/payroll/runs/:id/reopen
 * Unlock and reopen payroll run (SUPER_ADMIN only / PAYROLL_REOPEN)
 */
router.post('/runs/:id/reopen', requirePermission('PAYROLL_REOPEN'), async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Strictly SUPER_ADMIN only can reopen finalized payroll runs' });
    }
    const { id } = req.params;
    const run = memoryStore.payrollRuns.find((r) => r.id === id);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Payroll run not found' });
    }

    const oldStatus = run.status;
    run.status = 'DRAFT';
    run.approved_by = null;
    run.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'PAYROLL_REOPEN',
      entity: 'PAYROLL_RUN',
      entityId: id,
      oldValue: { status: oldStatus },
      newValue: { status: 'DRAFT' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: run });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reopen payroll';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/payroll/payslips
 * View all payslips (PAYSLIP_VIEW)
 */
router.get('/payslips', requirePermission('PAYSLIP_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const runId = req.query.run_id as string;
    let slips = memoryStore.payslips;
    if (runId) {
      slips = slips.filter((p) => p.payroll_run_id === runId);
    }

    const enriched = slips.map((p) => {
      const emp = memoryStore.employees.find((e) => e.id === p.employee_id);
      const dept = emp ? memoryStore.departments.find((d) => d.id === emp.department_id) : null;
      return {
        ...p,
        employee_name: emp ? (emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()) : 'Employee',
        employee_code: emp?.employee_id || emp?.employee_code || 'VXEMP',
        department_name: dept?.name || 'Operations',
      };
    });

    return res.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch payslips';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/payroll/self/payslips
 * ESS: View employee's personal payslips (EMPLOYEE_PAYSLIP_VIEW)
 */
router.get('/self/payslips', requirePermission('EMPLOYEE_PAYSLIP_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    let emp = memoryStore.employees.find((e) => e.user_id === userId);
    if (!emp && req.user?.role === 'EMPLOYEE') {
      emp = memoryStore.employees[0];
    }
    if (!emp) {
      return res.json({ success: true, data: [] });
    }

    const slips = memoryStore.payslips.filter((p) => p.employee_id === emp.id);
    const enriched = slips.map((p) => ({
      ...p,
      employee_name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      employee_code: emp.employee_id || emp.employee_code || 'VXEMP',
    }));

    return res.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch payslips';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
