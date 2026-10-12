import { Router } from 'express';
import { memoryStore } from '../../db/memoryStore.js';
import { authenticateUser, AuthenticatedRequest, requirePlatform, requirePermission } from '../middleware.js';
import { logAuditEvent } from '../auth.js';

const router = Router();

router.use(authenticateUser);
router.use(requirePlatform('BUSINESS'));

/**
 * GET /api/v1/hr/departments
 * List departments
 */
router.get('/departments', requirePermission('HR_DEPARTMENT_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const deps = memoryStore.departments.filter((d) => !d.deleted_at);
    return res.json({ success: true, data: deps });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch departments';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/hr/departments
 * Create department
 */
router.post('/departments', requirePermission('HR_DEPARTMENT_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Name and code are required' });
    }

    const newDep = {
      id: `dept-${Date.now()}`,
      name,
      code: String(code).toUpperCase().trim(),
      description: description || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    memoryStore.departments.push(newDep);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'HR_DEPARTMENT_CREATE',
      entity: 'DEPARTMENT',
      entityId: newDep.id,
      newValue: newDep,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: newDep });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create department';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/hr/designations
 * List designations
 */
router.get('/designations', requirePermission('HR_DESIGNATION_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const desigs = memoryStore.designations.filter((d) => !d.deleted_at);
    return res.json({ success: true, data: desigs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch designations';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/hr/designations
 * Create designation
 */
router.post('/designations', requirePermission('HR_DESIGNATION_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { title, code, department_id, level, description } = req.body;
    if (!title || !code) {
      return res.status(400).json({ success: false, error: 'Title and code are required' });
    }

    const newDesig = {
      id: `desig-${Date.now()}`,
      title,
      code: String(code).toUpperCase().trim(),
      department_id: department_id || null,
      level: level || 'L1',
      description: description || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    memoryStore.designations.push(newDesig);
    return res.status(201).json({ success: true, data: newDesig });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create designation';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/hr/shifts
 * List shifts
 */
router.get('/shifts', requirePermission('HR_SHIFT_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    return res.json({ success: true, data: memoryStore.shifts.filter((s) => !s.deleted_at) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch shifts';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/hr/employees
 * List staff employees (HR_EMPLOYEE_VIEW)
 */
router.get('/employees', requirePermission('HR_EMPLOYEE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const emps = memoryStore.employees.filter((e) => !e.deleted_at);
    const enriched = emps.map((e) => {
      const dept = memoryStore.departments.find((d) => d.id === e.department_id);
      const desig = memoryStore.designations.find((d) => d.id === e.designation_id);
      return {
        ...e,
        department_name: dept?.name || 'Operations',
        designation_title: desig?.title || 'Staff',
      };
    });
    return res.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch employees';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/hr/employees
 * Onboard new employee (HR_EMPLOYEE_CREATE)
 */
router.post('/employees', requirePermission('HR_EMPLOYEE_CREATE'), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      first_name,
      last_name,
      work_email,
      phone,
      department_id,
      designation_id,
      date_of_joining,
      employment_type,
      work_location,
      pan_number,
      bank_account_number,
      bank_ifsc,
      base_salary,
    } = req.body;

    if (!first_name || !last_name || !work_email || !phone) {
      return res.status(400).json({ success: false, error: 'First name, last name, work email, and phone are required' });
    }

    const empId = `emp-${Date.now()}`;
    const empCode = `VXEMP-${String(memoryStore.employees.length + 1).padStart(4, '0')}`;

    const newEmp = {
      id: empId,
      employee_code: empCode,
      user_id: null,
      first_name,
      last_name,
      work_email,
      personal_email: null,
      phone,
      department_id: department_id || 'dept-ops',
      designation_id: designation_id || 'desig-tech-lead',
      date_of_joining: date_of_joining || new Date().toISOString().split('T')[0],
      employment_type: employment_type || 'FULL_TIME',
      status: 'ACTIVE' as const,
      reporting_manager_id: null,
      shift_id: 'shift-morning',
      work_location: work_location || 'Gurgaon Central Hub',
      pan_number: pan_number || null,
      bank_account_number: bank_account_number || null,
      bank_ifsc: bank_ifsc || null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    memoryStore.employees.push(newEmp);

    // Also auto-create a baseline salary structure if salary provided
    if (base_salary) {
      const basic = Math.round(Number(base_salary) * 0.5);
      const hra = Math.round(Number(base_salary) * 0.3);
      const special = Number(base_salary) - basic - hra;
      memoryStore.salaryStructures.push({
        id: `sal-struct-${Date.now()}`,
        employee_id: empId,
        effective_from: newEmp.date_of_joining,
        effective_to: null,
        base_monthly: Number(base_salary),
        basic_salary: basic,
        hra,
        special_allowance: special,
        conveyance_allowance: 0,
        medical_allowance: 0,
        provident_fund_employee: Math.round(basic * 0.12),
        provident_fund_employer: Math.round(basic * 0.12),
        esi_employee: 0,
        professional_tax: 200,
        tds_monthly: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'HR_EMPLOYEE_CREATE',
      entity: 'EMPLOYEE',
      entityId: empId,
      newValue: newEmp,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: newEmp });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to onboard employee';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/v1/hr/employees/:id
 * Edit employee details (HR_EMPLOYEE_EDIT)
 */
router.put('/employees/:id', requirePermission('HR_EMPLOYEE_EDIT'), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const emp = memoryStore.employees.find((e) => e.id === id && !e.deleted_at);
    if (!emp) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const oldEmp = { ...emp };
    const fields = [
      'first_name', 'last_name', 'work_email', 'personal_email', 'phone',
      'department_id', 'designation_id', 'employment_type', 'shift_id',
      'work_location', 'pan_number', 'bank_account_number', 'bank_ifsc',
      'emergency_contact_name', 'emergency_contact_phone',
    ];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        (emp as any)[f] = req.body[f];
      }
    }
    emp.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'HR_EMPLOYEE_EDIT',
      entity: 'EMPLOYEE',
      entityId: id,
      oldValue: oldEmp,
      newValue: emp,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: emp });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to edit employee';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/v1/hr/employees/:id/status
 * Activate / Deactivate employee (HR_EMPLOYEE_ACTIVATE / HR_EMPLOYEE_DEACTIVATE)
 */
router.patch('/employees/:id/status', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED', 'RESIGNED'
    const requiredPerm = status === 'ACTIVE' ? 'HR_EMPLOYEE_ACTIVATE' : 'HR_EMPLOYEE_DEACTIVATE';

    const userRole = req.user?.role;
    const hasPerm = memoryStore.rolePermissions.some(
      (rp) => rp.role_code === userRole && (rp.permission_code === requiredPerm || rp.permission_code === 'HR_EMPLOYEE_EDIT' || userRole === 'SUPER_ADMIN')
    );

    if (!hasPerm) {
      return res.status(403).json({ success: false, error: `Forbidden: requires ${requiredPerm}` });
    }

    const emp = memoryStore.employees.find((e) => e.id === id && !e.deleted_at);
    if (!emp) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const oldStatus = emp.status;
    emp.status = status;
    emp.updated_at = new Date().toISOString();

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: status === 'ACTIVE' ? 'HR_EMPLOYEE_ACTIVATE' : 'HR_EMPLOYEE_DEACTIVATE',
      entity: 'EMPLOYEE',
      entityId: id,
      oldValue: { status: oldStatus },
      newValue: { status: emp.status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: emp });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update employee status';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/hr/attendance
 * List attendance records (HR_ATTENDANCE_VIEW)
 */
router.get('/attendance', requirePermission('HR_ATTENDANCE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const records = memoryStore.employeeAttendance;
    const enriched = records.map((a) => {
      const emp = memoryStore.employees.find((e) => e.id === a.employee_id);
      return {
        ...a,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Employee',
        employee_code: emp?.employee_code || 'VXEMP',
      };
    });
    return res.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch attendance';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/hr/attendance/override
 * Manual attendance correction / approval (HR_ATTENDANCE_APPROVE)
 */
router.post('/attendance/override', requirePermission('HR_ATTENDANCE_APPROVE'), async (req: AuthenticatedRequest, res) => {
  try {
    const { employee_id, date, status, check_in, check_out, notes } = req.body;
    if (!employee_id || !date || !status) {
      return res.status(400).json({ success: false, error: 'employee_id, date, and status are required' });
    }

    let existing = memoryStore.employeeAttendance.find(
      (a) => a.employee_id === employee_id && a.date === date
    );

    if (existing) {
      const oldVal = { ...existing };
      existing.status = status;
      if (check_in) existing.check_in = check_in;
      if (check_out) existing.check_out = check_out;
      existing.notes = notes || existing.notes;
      existing.approved_by = req.user?.id || 'usr-hr-1';
      (existing as any).is_overridden = true;

      await logAuditEvent({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'HR_ATTENDANCE_OVERRIDE',
        entity: 'ATTENDANCE',
        entityId: existing.id,
        oldValue: oldVal,
        newValue: existing,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.json({ success: true, data: existing });
    } else {
      const newRec = {
        id: `att-${Date.now()}`,
        employee_id,
        date,
        check_in: check_in || '09:00',
        check_out: check_out || '18:00',
        work_hours: 8.0,
        status: status as any,
        shift_id: 'shift-morning',
        approved_by: req.user?.id || 'usr-hr-1',
        is_overridden: true,
        notes: notes || 'Manual HR Entry',
        created_at: new Date().toISOString(),
      };
      memoryStore.employeeAttendance.push(newRec);

      await logAuditEvent({
        userId: req.user?.id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'HR_ATTENDANCE_CREATE',
        entity: 'ATTENDANCE',
        entityId: newRec.id,
        newValue: newRec,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({ success: true, data: newRec });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to override attendance';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/hr/leaves
 * List leave requests (HR_LEAVE_VIEW)
 */
router.get('/leaves', requirePermission('HR_LEAVE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const leaves = memoryStore.leaveRequests;
    const enriched = leaves.map((l) => {
      const emp = memoryStore.employees.find((e) => e.id === l.employee_id);
      const lt = memoryStore.leaveTypes.find((t) => t.id === l.leave_type_id);
      return {
        ...l,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Employee',
        leave_type_name: lt?.name || 'Casual Leave',
      };
    });
    return res.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch leaves';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * Leave approval / action handler (HR_LEAVE_APPROVE / HR_LEAVE_REJECT)
 */
const leaveActionHandler = async (req: AuthenticatedRequest, res: any) => {
  try {
    const { id } = req.params;
    const { status, action, rejection_reason, remarks } = req.body;
    const targetStatus = status || (action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'APPROVED');
    const requiredPerm = targetStatus === 'APPROVED' ? 'HR_LEAVE_APPROVE' : 'HR_LEAVE_REJECT';

    const userRole = req.user?.role;
    const hasPerm = memoryStore.rolePermissions.some(
      (rp) => rp.role_code === userRole && (rp.permission_code === requiredPerm || rp.permission_code === 'HR_LEAVE_EDIT' || userRole === 'SUPER_ADMIN')
    );

    if (!hasPerm) {
      return res.status(403).json({ success: false, error: `Forbidden: requires ${requiredPerm}` });
    }

    const leave = memoryStore.leaveRequests.find((l) => l.id === id);
    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }

    const oldStatus = leave.status;
    leave.status = targetStatus;
    leave.approved_by = req.user?.id || 'usr-hr-1';
    leave.approved_at = new Date().toISOString();
    if (rejection_reason || remarks) leave.rejection_reason = rejection_reason || remarks;
    leave.updated_at = new Date().toISOString();

    // If approved, decrement leave balance
    if (targetStatus === 'APPROVED') {
      const balance = memoryStore.leaveBalances.find(
        (b) => b.employee_id === leave.employee_id && b.leave_type_id === leave.leave_type_id
      );
      if (balance) {
        balance.used_days += leave.total_days;
        balance.remaining_days = Math.max(0, balance.total_allocated - balance.used_days);
      }
    }

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: targetStatus === 'APPROVED' ? 'HR_LEAVE_APPROVE' : 'HR_LEAVE_REJECT',
      entity: 'LEAVE_REQUEST',
      entityId: id,
      oldValue: { status: oldStatus },
      newValue: { status: leave.status, approved_by: leave.approved_by },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, data: leave });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update leave';
    return res.status(500).json({ success: false, error: msg });
  }
};

router.patch('/leaves/:id/approve', leaveActionHandler);
router.post('/leaves/:id/approve', leaveActionHandler);
router.post('/leaves/:id/action', leaveActionHandler);
router.patch('/leaves/:id/action', leaveActionHandler);

/**
 * GET /api/v1/hr/holidays
 * View company holidays
 */
router.get('/holidays', async (req: AuthenticatedRequest, res) => {
  try {
    return res.json({ success: true, data: memoryStore.holidays });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch holidays';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/hr/recruitment
 * View job postings & candidates (HR_RECRUITMENT_VIEW)
 */
router.get('/recruitment', requirePermission('HR_RECRUITMENT_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    return res.json({
      success: true,
      data: {
        jobs: memoryStore.recruitmentJobs.filter((j) => !j.deleted_at),
        candidates: memoryStore.candidates.filter((c) => !c.deleted_at),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch recruitment';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/hr/exits
 * View exit management records (HR_EXIT_MANAGE)
 */
router.get('/exits', requirePermission('HR_EXIT_MANAGE'), async (req: AuthenticatedRequest, res) => {
  try {
    const exits = memoryStore.employeeExits;
    const enriched = exits.map((x) => {
      const emp = memoryStore.employees.find((e) => e.id === x.employee_id);
      return {
        ...x,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Employee',
        employee_code: emp?.employee_code || 'VXEMP',
      };
    });
    return res.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch exits';
    return res.status(500).json({ success: false, error: msg });
  }
});

// ==========================================
// EMPLOYEE SELF SERVICE (ESS) ENDPOINTS
// ==========================================

/**
 * GET /api/v1/hr/self/profile
 * ESS: View personal profile (EMPLOYEE_PROFILE_VIEW)
 */
router.get('/self/profile', requirePermission('EMPLOYEE_PROFILE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    let emp = memoryStore.employees.find((e) => e.user_id === userId);
    // Demo fallback for employee role
    if (!emp && req.user?.role === 'EMPLOYEE') {
      emp = memoryStore.employees[0];
    }
    if (!emp) {
      return res.status(404).json({ success: false, error: 'Employee profile not linked' });
    }

    const dept = memoryStore.departments.find((d) => d.id === emp.department_id);
    const desig = memoryStore.designations.find((d) => d.id === emp.designation_id);
    const shift = memoryStore.shifts.find((s) => s.id === emp.shift_id);
    const leaves = memoryStore.leaveBalances.filter((b) => b.employee_id === emp.id);

    return res.json({
      success: true,
      data: {
        ...emp,
        department_name: dept?.name || 'Operations',
        designation_title: desig?.title || 'Staff',
        shift_name: shift?.name || 'Standard Day Shift',
        leave_balances: leaves,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch profile';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/v1/hr/self/attendance
 * ESS: View personal attendance (EMPLOYEE_ATTENDANCE_VIEW)
 */
router.get('/self/attendance', requirePermission('EMPLOYEE_ATTENDANCE_VIEW'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    let emp = memoryStore.employees.find((e) => e.user_id === userId);
    if (!emp && req.user?.role === 'EMPLOYEE') {
      emp = memoryStore.employees[0];
    }
    if (!emp) {
      return res.json({ success: true, data: [] });
    }

    const records = memoryStore.employeeAttendance.filter((a) => a.employee_id === emp.id);
    return res.json({ success: true, data: records });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch attendance';
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/v1/hr/self/leaves
 * ESS: Apply for leave (EMPLOYEE_LEAVE_APPLY)
 */
router.post('/self/leaves', requirePermission('EMPLOYEE_LEAVE_APPLY'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    let emp = memoryStore.employees.find((e) => e.user_id === userId);
    if (!emp && req.user?.role === 'EMPLOYEE') {
      emp = memoryStore.employees[0];
    }
    if (!emp) {
      return res.status(404).json({ success: false, error: 'Employee record not found' });
    }

    const { leave_type_id, start_date, end_date, total_days, reason } = req.body;
    if (!leave_type_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, error: 'leave_type_id, start_date, and end_date are required' });
    }

    const newLeave = {
      id: `leave-${Date.now()}`,
      employee_id: emp.id,
      leave_type_id,
      start_date,
      end_date,
      total_days: Number(total_days) || 1,
      reason: reason || 'Personal',
      status: 'PENDING' as const,
      applied_at: new Date().toISOString(),
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryStore.leaveRequests.push(newLeave);

    await logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'EMPLOYEE_LEAVE_APPLY',
      entity: 'LEAVE_REQUEST',
      entityId: newLeave.id,
      newValue: newLeave,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: newLeave });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to apply for leave';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
