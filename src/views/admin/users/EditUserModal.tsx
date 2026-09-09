import React, { useState, useEffect } from 'react';
import {
  AuthUser,
  CityItem,
  RoleItem,
  UserListItem,
  DepartmentItem,
  DesignationItem,
} from '../../../types/auth';
import { api } from '../../../services/api';
import { FormDropdown, DropdownOption } from '../../../components/ui/FormDropdown';
import { X, Edit3, AlertCircle, CheckCircle2, Check, Shield } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserListItem | null;
  currentUser: AuthUser | null;
  cities: CityItem[];
  roles: RoleItem[];
  onUserUpdated: () => void;
}

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

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUser,
  cities,
  roles,
  onUserUpdated,
}) => {
  const [departments, setDepartments] = useState<DepartmentItem[]>(FALLBACK_DEPARTMENTS);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    cityId: '',
    status: 'ACTIVE',
    monthlyTarget: '250000',
    baseSalary: '45000',
    commissionRate: '8.5',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    api.getDepartments()
      .then((res) => {
        if (res && res.length > 0) setDepartments(res);
      })
      .catch(() => {});
  }, [isOpen]);

  // Pre-populate existing user values
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone ? user.phone.replace('+91 ', '') : '',
        role: user.role || 'CUSTOMER',
        department: (user as any).department || '',
        cityId: user.cityId ? String(user.cityId) : '',
        status: user.status || 'ACTIVE',
        monthlyTarget: '250000',
        baseSalary: '45000',
        commissionRate: '8.5',
      });
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';
  const canEditRole = isSuperAdmin || (isAdmin && user.role !== 'SUPER_ADMIN');

  // Role dropdown options
  const allRoles = roles && roles.length > 0 ? roles : FALLBACK_SYSTEM_ROLES;
  const availableRoles = isSuperAdmin
    ? allRoles
    : isAdmin
    ? allRoles.filter((r) => r.code !== 'SUPER_ADMIN')
    : allRoles.filter((r) => r.code === user.role);

  const roleDropdownOptions: DropdownOption[] = availableRoles.map((r) => ({
    value: r.code,
    label: `${r.name} (${r.code})`,
    description: r.description || `System role for ${r.name}`,
    badge: r.code,
  }));

  // Status dropdown options
  const statusDropdownOptions: DropdownOption[] = [
    { value: 'ACTIVE', label: 'ACTIVE — Account operational & permitted', badge: 'Active' },
    { value: 'PENDING', label: 'PENDING — Onboarding / approval pending', badge: 'Pending' },
    { value: 'INACTIVE', label: 'INACTIVE — Account deactivated', badge: 'Inactive' },
    { value: 'SUSPENDED', label: 'SUSPENDED — Access temporarily revoked', badge: 'Suspended' },
  ];

  // Department dropdown options
  const departmentDropdownOptions: DropdownOption[] = [
    { value: '', label: 'None / General (Not Department Specific)', description: 'General staff or non-departmental user' },
    ...departments.map((d) => ({
      value: d.name,
      label: `${d.name} (${d.code})`,
      badge: d.code,
    })),
  ];

  // City dropdown options
  const cityDropdownOptions: DropdownOption[] = [
    { value: '', label: 'National / All India (Central)' },
    ...(cities.length > 0 ? cities : [
      { id: 1, name: 'Delhi NCR', code: 'DEL', state_name: 'Delhi' },
      { id: 2, name: 'Mumbai', code: 'BOM', state_name: 'Maharashtra' },
      { id: 3, name: 'Bengaluru', code: 'BLR', state_name: 'Karnataka' },
    ]).map((c) => ({
      value: String(c.id),
      label: `${c.name} (${c.state_name || 'India'})`,
      badge: (c as any).code || 'HUB',
    })),
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(null);
  };

  const handleDropdownChange = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Full Name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        cityId: formData.cityId ? parseInt(formData.cityId, 10) : undefined,
        status: formData.status,
        department: formData.department || undefined,
      };

      // Role modification validation
      if (canEditRole && formData.role && formData.role !== user.role) {
        payload.role = formData.role;
      }

      if (formData.role === 'SALES' || formData.role === 'SALES_TEAM' || user.role === 'SALES') {
        payload.monthlyTarget = parseFloat(formData.monthlyTarget) || undefined;
        payload.baseSalary = parseFloat(formData.baseSalary) || undefined;
        payload.commissionRate = parseFloat(formData.commissionRate) || undefined;
      }

      const res = await api.updateUser(user.id, payload);
      setSuccessMsg(res.message || 'User updated successfully.');
      setTimeout(() => {
        onUserUpdated();
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xl w-full max-w-2xl my-8 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit User Details</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {user.publicId} • {user.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 max-h-[80vh] overflow-y-auto pb-16">
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
              className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role Dropdown - High stacking order (z-30) */}
            <div className="relative z-30">
              <FormDropdown
                id="edit-user-role"
                name="role"
                label={`System Role ${canEditRole ? '' : '(Locked by Security Policy)'}`}
                disabled={!canEditRole}
                searchable
                options={roleDropdownOptions}
                value={formData.role}
                onChange={(val) => handleDropdownChange('role', val)}
                placeholder="Select role..."
                helperText={!canEditRole ? 'Role modification restricted to authorized administrators.' : undefined}
              />
            </div>

            {/* Account Status Dropdown - High stacking order (z-30) */}
            <div className="relative z-30">
              <FormDropdown
                id="edit-user-status"
                name="status"
                label="Account Status"
                required
                options={statusDropdownOptions}
                value={formData.status}
                onChange={(val) => handleDropdownChange('status', val)}
                placeholder="Select status..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department Dropdown - Stacking order (z-20) */}
            <div className="relative z-20">
              <FormDropdown
                id="edit-user-department"
                name="department"
                label="Assigned Department"
                searchable
                options={departmentDropdownOptions}
                value={formData.department}
                onChange={(val) => handleDropdownChange('department', val)}
                placeholder="Select department..."
              />
            </div>

            {/* Assigned City / Hub Dropdown - Stacking order (z-20) */}
            <div className="relative z-20">
              <FormDropdown
                id="edit-user-city"
                name="cityId"
                label="Assigned City / Hub"
                options={cityDropdownOptions}
                value={formData.cityId}
                onChange={(val) => handleDropdownChange('cityId', val)}
                placeholder="Select hub city..."
              />
            </div>
          </div>

          {(formData.role === 'SALES' || formData.role === 'SALES_TEAM' || user.role === 'SALES') && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4.5 rounded-xl border border-slate-300 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Sales Targets & Compensation
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Monthly Target (₹)</label>
                  <input
                    type="number"
                    name="monthlyTarget"
                    value={formData.monthlyTarget}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Base Salary (₹)</label>
                  <input
                    type="number"
                    name="baseSalary"
                    value={formData.baseSalary}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Commission (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

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
                <span>Updating User...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
