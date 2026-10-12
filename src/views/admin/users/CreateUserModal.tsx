import React, { useState, useEffect } from 'react';
import {
  AuthUser,
  CityItem,
  RoleItem,
  DepartmentItem,
  DesignationItem,
  PermissionKey,
} from '../../../types/auth';
import { ROLE_PERMISSIONS } from '../../../auth/permissions';
import { api } from '../../../services/api';
import { FormDropdown, DropdownOption } from '../../../components/ui/FormDropdown';
import {
  X,
  UserPlus,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  cities: CityItem[];
  roles: RoleItem[];
  onUserCreated: () => void;
}

// Canonical fallback roles if API is delayed or empty
const FALLBACK_SYSTEM_ROLES: RoleItem[] = [
  { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Platform Master Controller with omnipotent authority' },
  { code: 'ADMIN', name: 'System Administrator', description: 'Platform Administrator with organizational control' },
  { code: 'MANAGER', name: 'Operations Manager', description: 'Regional operations manager with technician & booking oversight' },
  { code: 'SALES_TEAM', name: 'Sales Executive', description: 'Commercial sales executive handling leads and AMC deals' },
  { code: 'SALES', name: 'Sales Specialist', description: 'Lead generation and customer acquisition specialist' },
  { code: 'FINANCE', name: 'Finance Controller', description: 'Financial auditor with payment, invoice and ledger authority' },
  { code: 'MARKETING', name: 'Marketing Manager', description: 'Promotions, campaign discounts and growth analytics lead' },
  { code: 'OPERATIONS', name: 'Operations Executive', description: 'Dispatch and field scheduling coordinator' },
  { code: 'SUPPORT', name: 'Customer Support Representative', description: 'Helpdesk escalation handler and ticket resolution' },
  { code: 'HR', name: 'Human Resources Specialist', description: 'Internal staff management, payroll and onboarding' },
  { code: 'PAYROLL', name: 'Payroll Specialist', description: 'Staff compensation, bonus and reimbursement processing' },
  { code: 'TECHNICIAN', name: 'Certified Field Technician', description: 'Field service technician executing physical work orders' },
  { code: 'CUSTOMER', name: 'Retail Consumer / Business Client', description: 'End-user client requesting appliance repair and AMC plans' },
  { code: 'PARTNER', name: 'Authorized Service Partner', description: 'Third-party vendor agency delivering fulfillment capacity' },
];

const FALLBACK_DEPARTMENTS: DepartmentItem[] = [
  { id: 'dept-01', name: 'Human Resources & Talent', code: 'HR' },
  { id: 'dept-02', name: 'Payroll & Finance', code: 'FIN' },
  { id: 'dept-03', name: 'Fleet Operations & Dispatch', code: 'OPS' },
  { id: 'dept-04', name: 'Commercial Sales & Growth', code: 'SLS' },
  { id: 'dept-05', name: 'Appliance Diagnostics & Engineering', code: 'ENG' },
  { id: 'dept-06', name: 'Customer Experience & Escalations', code: 'SUP' },
];

// Grouped permissions for intuitive UI assignment
const PERMISSION_GROUPS: {
  title: string;
  category: string;
  permissions: { key: PermissionKey; label: string; description: string }[];
}[] = [
  {
    title: 'CRM & Lead Management',
    category: 'crm',
    permissions: [
      { key: 'LEAD_VIEW', label: 'View Leads & Pipeline', description: 'Access CRM dashboard and leads list' },
      { key: 'LEAD_CREATE', label: 'Create / Generate Leads', description: 'Capture new prospect and corporate leads' },
      { key: 'LEAD_EDIT', label: 'Edit & Update Leads', description: 'Modify deal size, contact info, notes' },
      { key: 'LEAD_ASSIGN', label: 'Assign Leads to Sales Team', description: 'Delegate leads to specific executives' },
      { key: 'LEAD_FOLLOWUP_CREATE', label: 'Schedule Follow-ups', description: 'Log client meetings, calls, next steps' },
      { key: 'LEAD_FOLLOWUP_COMPLETE', label: 'Complete Follow-ups', description: 'Mark scheduled tasks completed' },
      { key: 'LEAD_CONVERT', label: 'Convert to Booking / Customer', description: 'Convert qualified leads to work orders' },
      { key: 'LEAD_WON', label: 'Mark Lead as Won', description: 'Close contract won with AMC or booking' },
      { key: 'LEAD_LOST', label: 'Mark Lead as Lost', description: 'Archive lost lead with reason' },
      { key: 'LEAD_DELETE', label: 'Delete Lead Records', description: 'Permanently remove obsolete lead cards' },
    ],
  },
  {
    title: 'Bookings & Operations',
    category: 'operations',
    permissions: [
      { key: 'BOOKING_VIEW', label: 'View Bookings', description: 'Browse all platform work orders' },
      { key: 'BOOKING_CREATE', label: 'Create New Booking', description: 'Dispatch new service ticket' },
      { key: 'BOOKING_ASSIGN', label: 'Assign Technicians', description: 'Allocate field workforce' },
      { key: 'BOOKING_CANCEL', label: 'Cancel Booking', description: 'Void or cancel service orders' },
      { key: 'BOOKING_UPDATE', label: 'Update & Reschedule Booking', description: 'Modify work orders and schedule adjustments' },
    ],
  },
  {
    title: 'Customers & Accounts',
    category: 'customers',
    permissions: [
      { key: 'CUSTOMER_VIEW', label: 'View Customers', description: 'Access customer profiles and history' },
      { key: 'CUSTOMER_CREATE', label: 'Create Customers', description: 'Register new consumer accounts' },
      { key: 'CUSTOMER_EDIT', label: 'Edit Customer Data', description: 'Update customer contact/addresses' },
    ],
  },
  {
    title: 'Technicians & Fleet',
    category: 'technicians',
    permissions: [
      { key: 'TECHNICIAN_VIEW', label: 'View Technicians', description: 'Inspect field engineer roster' },
      { key: 'TECHNICIAN_MANAGE', label: 'Manage Technicians', description: 'Update status, duty, skillsets' },
      { key: 'SERVICE_VIEW', label: 'View Service Catalog', description: 'Browse platform catalog and rates' },
      { key: 'AMC_VIEW', label: 'View AMC Contracts', description: 'Inspect active maintenance agreements' },
    ],
  },
  {
    title: 'Finance & Administration',
    category: 'finance',
    permissions: [
      { key: 'PAYMENT_VIEW', label: 'View Payments', description: 'Inspect financial transactions' },
      { key: 'PAYMENT_COLLECT', label: 'Collect Payments', description: 'Record cash, UPI or card collections' },
      { key: 'USER_VIEW', label: 'View System Users', description: 'Browse internal staff accounts' },
      { key: 'USER_CREATE', label: 'Create System Users', description: 'Add new staff and grant credentials' },
    ],
  },
];

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  cities,
  roles,
  onUserCreated,
}) => {
  const isManager = currentUser?.role === 'MANAGER';
  const defaultRole = isManager ? 'SALES' : 'CUSTOMER';

  const [departments, setDepartments] = useState<DepartmentItem[]>(FALLBACK_DEPARTMENTS);
  const [designations, setDesignations] = useState<DesignationItem[]>([]);
  const [managersList, setManagersList] = useState<{ id: string; name: string; role: string }[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: defaultRole,
    department: '',
    designation: '',
    reportingManager: '',
    cityId: cities[0]?.id ? String(cities[0].id) : '1',
    status: 'ACTIVE',
    password: 'password123',
    // Sales profile
    employeeType: 'FULL_TIME',
    compensationModel: 'FIXED_PLUS_COMMISSION',
    baseSalary: '45000',
    commissionRate: '8.5',
    monthlyTarget: '250000',
    // Technician profile
    skills: 'AC Repair, HVAC Servicing',
    serviceAreas: 'Central Hub, Sector 14',
    experienceYears: '3',
    // Manager profile
    assignedRegion: 'Delhi NCR Hub',
    // Finance profile
    approvalLimit: '500000',
    // Customer profile
    customerType: 'INDIVIDUAL',
    notes: '',
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showPermissionsSection, setShowPermissionsSection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load master departments, designations, and managers
  useEffect(() => {
    if (!isOpen) return;

    api.getDepartments()
      .then((res) => {
        if (res && res.length > 0) setDepartments(res);
      })
      .catch(() => {});

    api.getDesignations()
      .then((res) => {
        if (res && res.length > 0) setDesignations(res);
      })
      .catch(() => {});

    api.getUsers({ limit: 50 })
      .then((res) => {
        if (res && res.data) {
          const eligibleManagers = res.data
            .filter((u) => ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(u.role))
            .map((u) => ({ id: u.publicId || String(u.id), name: u.name, role: u.role }));
          setManagersList(eligibleManagers);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Sync default permissions whenever selected role changes
  useEffect(() => {
    const roleKey = formData.role as keyof typeof ROLE_PERMISSIONS;
    const defaults = ROLE_PERMISSIONS[roleKey] || [];
    setSelectedPermissions([...defaults]);
  }, [formData.role]);

  if (!isOpen) return null;

  // Determine allowed roles according to strict RBAC policy
  const allRoles = roles && roles.length > 0 ? roles : FALLBACK_SYSTEM_ROLES;
  const availableRoles = isManager
    ? allRoles.filter((r) => r.code === 'SALES' || r.code === 'SALES_TEAM')
    : currentUser?.role === 'SUPER_ADMIN'
    ? allRoles
    : currentUser?.role === 'ADMIN'
    ? allRoles.filter((r) => r.code !== 'SUPER_ADMIN')
    : allRoles.filter((r) => !['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE'].includes(r.code));

  // Options for FormDropdown components
  const roleDropdownOptions: DropdownOption[] = availableRoles.map((r) => ({
    value: r.code,
    label: `${r.name} (${r.code})`,
    description: r.description || `System role for ${r.name}`,
    badge: r.code,
  }));

  const departmentDropdownOptions: DropdownOption[] = [
    { value: '', label: 'None / General (Not Department Specific)', description: 'General staff or non-departmental user' },
    ...departments.map((d) => ({
      value: d.name,
      label: `${d.name} (${d.code})`,
      description: d.manager_name ? `Head of Department: ${d.manager_name}` : undefined,
      badge: d.code,
    })),
  ];

  const filteredDesignations = formData.department
    ? designations.filter((des) => des.department_name === formData.department || !des.department_id)
    : designations;

  const designationDropdownOptions: DropdownOption[] = [
    { value: '', label: 'Standard Member / None' },
    ...(filteredDesignations.length > 0
      ? filteredDesignations.map((des) => ({
          value: des.title,
          label: des.title,
          badge: des.level || undefined,
        }))
      : [
          { value: 'Specialist Executive', label: 'Specialist Executive' },
          { value: 'Senior Associate', label: 'Senior Associate' },
          { value: 'Team Lead / Coordinator', label: 'Team Lead / Coordinator' },
        ]),
  ];

  const reportingManagerOptions: DropdownOption[] = [
    { value: '', label: 'Direct to Operations Central / None', description: 'Reports directly to organization leadership' },
    ...managersList.map((m) => ({
      value: m.id,
      label: `${m.name} (${m.role})`,
      badge: m.role,
    })),
  ];

  const cityDropdownOptions: DropdownOption[] = (cities.length > 0 ? cities : [
    { id: 1, name: 'Delhi NCR', code: 'DEL', state_name: 'Delhi' },
    { id: 2, name: 'Mumbai', code: 'BOM', state_name: 'Maharashtra' },
    { id: 3, name: 'Bengaluru', code: 'BLR', state_name: 'Karnataka' },
  ]).map((c) => ({
    value: String(c.id),
    label: `${c.name} (${c.state_name || 'India'})`,
    badge: (c as any).code || 'HUB',
  }));

  const statusDropdownOptions: DropdownOption[] = [
    { value: 'ACTIVE', label: 'ACTIVE — Authorized to login immediately', badge: 'Active' },
    { value: 'PENDING', label: 'PENDING — Onboarding in progress', badge: 'Pending' },
    { value: 'INACTIVE', label: 'INACTIVE — Deactivated account', badge: 'Inactive' },
    { value: 'SUSPENDED', label: 'SUSPENDED — Access temporarily halted', badge: 'Suspended' },
  ];

  const employeeTypeOptions: DropdownOption[] = [
    { value: 'FULL_TIME', label: 'Full Time Regular (Permanent)' },
    { value: 'CONTRACTOR', label: 'Independent Contractor' },
    { value: 'COMMISSION_ONLY', label: 'Commission Only Associate' },
  ];

  const customerTypeOptions: DropdownOption[] = [
    { value: 'INDIVIDUAL', label: 'Individual Homeowner / Resident' },
    { value: 'BUSINESS', label: 'Commercial Retail / Small Business' },
    { value: 'CORPORATE', label: 'Enterprise / Corporate Facilities' },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(null);
  };

  const handleDropdownChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg(null);
  };

  const handleTogglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const handleSelectAllGroup = (groupPerms: { key: PermissionKey }[]) => {
    const keys = groupPerms.map((p) => p.key);
    setSelectedPermissions((prev) => Array.from(new Set([...prev, ...keys])));
  };

  const handleResetToRoleDefaults = () => {
    const roleKey = formData.role as keyof typeof ROLE_PERMISSIONS;
    const defaults = ROLE_PERMISSIONS[roleKey] || [];
    setSelectedPermissions([...defaults]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrorMsg('Full Name must be at least 2 characters.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg('Mobile number must be a valid 10-digit Indian phone number.');
      return;
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: cleanPhone,
        role: formData.role,
        department: formData.department || undefined,
        designation: formData.designation || undefined,
        reportingManager: formData.reportingManager || undefined,
        cityId: formData.cityId ? parseInt(formData.cityId, 10) : undefined,
        status: formData.status,
        password: formData.password || 'password123',
        permissions: selectedPermissions,
      };

      if (formData.role === 'SALES' || formData.role === 'SALES_TEAM') {
        payload.employeeType = formData.employeeType;
        payload.compensationModel = formData.compensationModel;
        payload.baseSalary = parseFloat(formData.baseSalary) || 45000;
        payload.commissionRate = parseFloat(formData.commissionRate) || 8.5;
        payload.monthlyTarget = parseFloat(formData.monthlyTarget) || 250000;
      } else if (formData.role === 'TECHNICIAN') {
        payload.skills = formData.skills.split(',').map((s) => s.trim()).filter(Boolean);
        payload.serviceAreas = formData.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean);
        payload.experienceYears = parseInt(formData.experienceYears, 10) || 3;
      } else if (formData.role === 'MANAGER') {
        payload.assignedRegion = formData.assignedRegion;
        payload.department = formData.department || 'Hub Operations & Field Fleet';
      } else if (formData.role === 'FINANCE') {
        payload.department = formData.department || 'Payroll & Finance';
        payload.approvalLimit = parseFloat(formData.approvalLimit) || 500000;
      } else if (formData.role === 'CUSTOMER') {
        payload.customerType = formData.customerType;
        payload.notes = formData.notes;
      }

      const res = await api.createUser(payload);
      setSuccessMsg(res.message || 'User created successfully with assigned permissions.');
      setTimeout(() => {
        onUserCreated();
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xl w-full max-w-3xl my-8 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Create New System User</h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Onboard internal executives, sales reps, field engineers, or customers.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Manager Scope Banner */}
        {isManager && (
          <div className="bg-amber-100 dark:bg-amber-950/60 border-b border-amber-300 dark:border-amber-800 px-6 py-3 flex items-center gap-2.5 text-xs text-amber-950 dark:text-amber-200 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>Operations Manager Scope: Authorized to onboard Sales Specialists & CRM executives.</span>
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center gap-3 text-xs text-rose-900 dark:text-rose-200 font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-950 dark:text-emerald-200 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                Full Name <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Arjun Kapoor"
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                Mobile Number (10 Digits) <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-slate-700 dark:text-slate-300 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full pl-13 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                Work Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="arjun.sales@vertexservices.in"
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
              />
            </div>

            {/* System Role Dropdown - High stacking order (z-30) */}
            <div className="relative z-30">
              <FormDropdown
                id="create-user-role"
                name="role"
                label="System Role"
                required
                searchable
                disabled={isManager}
                options={roleDropdownOptions}
                value={formData.role}
                onChange={(val) => handleDropdownChange('role', val)}
                placeholder="Select system role..."
              />
            </div>

            {/* Department Dropdown - Stacking order (z-25) */}
            <div className="relative z-25">
              <FormDropdown
                id="create-user-department"
                name="department"
                label="Department"
                searchable
                options={departmentDropdownOptions}
                value={formData.department}
                onChange={(val) => handleDropdownChange('department', val)}
                placeholder="Select department..."
                helperText="Assign staff to an organizational department."
              />
            </div>

            {/* Designation Dropdown - Stacking order (z-25) */}
            <div className="relative z-25">
              <FormDropdown
                id="create-user-designation"
                name="designation"
                label="Designation / Position"
                options={designationDropdownOptions}
                value={formData.designation}
                onChange={(val) => handleDropdownChange('designation', val)}
                placeholder="Select designation..."
              />
            </div>

            {/* Reporting Manager Dropdown - Stacking order (z-20) */}
            <div className="relative z-20">
              <FormDropdown
                id="create-user-manager"
                name="reportingManager"
                label="Reporting Manager"
                options={reportingManagerOptions}
                value={formData.reportingManager}
                onChange={(val) => handleDropdownChange('reportingManager', val)}
                placeholder="Select reporting manager..."
              />
            </div>

            {/* Primary City / Hub Dropdown - Stacking order (z-20) */}
            <div className="relative z-20">
              <FormDropdown
                id="create-user-city"
                name="cityId"
                label="Primary City / Hub"
                required
                options={cityDropdownOptions}
                value={formData.cityId}
                onChange={(val) => handleDropdownChange('cityId', val)}
                placeholder="Select hub city..."
              />
            </div>

            {/* Initial Account Status Dropdown - Stacking order (z-10) */}
            <div className="relative z-10">
              <FormDropdown
                id="create-user-status"
                name="status"
                label="Initial Account Status"
                required
                options={statusDropdownOptions}
                value={formData.status}
                onChange={(val) => handleDropdownChange('status', val)}
                placeholder="Select status..."
              />
            </div>
          </div>

          {/* Role-Specific Profile Section */}
          {(formData.role === 'SALES' || formData.role === 'SALES_TEAM') && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4.5 rounded-xl border border-slate-300 dark:border-slate-700 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Sales Specialist Profile & AMC Targets
                </h4>
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  Lead & Revenue Owner
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <FormDropdown
                    id="sales-employee-type"
                    name="employeeType"
                    label="Employment Type"
                    options={employeeTypeOptions}
                    value={formData.employeeType}
                    onChange={(val) => handleDropdownChange('employeeType', val)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Monthly Target (₹)</label>
                  <input
                    type="number"
                    name="monthlyTarget"
                    value={formData.monthlyTarget}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.role === 'TECHNICIAN' && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4.5 rounded-xl border border-slate-300 dark:border-slate-700 space-y-3.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Technician Skills & Service Coverage
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Skills (Comma-separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g. AC Repair, Water Heaters, Plumbing"
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Service Areas / Hubs</label>
                  <input
                    type="text"
                    name="serviceAreas"
                    value={formData.serviceAreas}
                    onChange={handleChange}
                    placeholder="e.g. CyberCity, Sector 15"
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.role === 'CUSTOMER' && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4.5 rounded-xl border border-slate-300 dark:border-slate-700 space-y-3.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">Customer Category & Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FormDropdown
                    id="customer-type-dropdown"
                    name="customerType"
                    label="Customer Classification"
                    options={customerTypeOptions}
                    value={formData.customerType}
                    onChange={(val) => handleDropdownChange('customerType', val)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Account Remarks</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="e.g. High priority corporate account"
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Granular User Permissions Accordion (Super Admin / Admin Only) */}
          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
            <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <button
                type="button"
                onClick={() => setShowPermissionsSection(!showPermissionsSection)}
                className="w-full px-4.5 py-3.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Assigned Capabilities & Granular Permissions
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {selectedPermissions.length} Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {showPermissionsSection ? 'Hide Details' : 'View & Customize'}
                </span>
                {showPermissionsSection ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
              </div>
            </button>

            {showPermissionsSection && (
              <div className="p-4.5 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Permissions are pre-loaded based on system role and can be overridden.
                  </span>
                  <button
                    type="button"
                    onClick={handleResetToRoleDefaults}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Reset to Role Defaults
                  </button>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>{group.title}</span>
                        <button
                          type="button"
                          onClick={() => handleSelectAllGroup(group.permissions)}
                          className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                        >
                          Select All
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.permissions.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.key);
                          return (
                            <label
                              key={perm.key}
                              className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-medium'
                                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.key)}
                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-600"
                              />
                              <div>
                                <div className="font-semibold">{perm.label}</div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                  {perm.description}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create User Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
