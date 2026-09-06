import React, { useState } from 'react';
import { AuthUser, CityItem, RoleItem } from '../../../types/auth';
import { api } from '../../../services/api';
import { X, UserPlus, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  cities: CityItem[];
  roles: RoleItem[];
  onUserCreated: () => void;
}

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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: defaultRole,
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
    department: 'Hub Operations & Field Fleet',
    // Finance profile
    approvalLimit: '500000',
    // Customer profile
    customerType: 'INDIVIDUAL',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter allowed roles based on caller permissions
  const availableRoles = isManager
    ? roles.filter((r) => r.code === 'SALES')
    : currentUser?.role === 'SUPER_ADMIN'
    ? roles
    : roles.filter((r) => !['SUPER_ADMIN', 'MANAGER', 'FINANCE'].includes(r.code));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
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
      // Prepare payload
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: cleanPhone,
        role: formData.role,
        cityId: formData.cityId ? parseInt(formData.cityId, 10) : undefined,
        status: formData.status,
        password: formData.password || 'password123',
      };

      if (formData.role === 'SALES') {
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
        payload.department = formData.department;
      } else if (formData.role === 'FINANCE') {
        payload.department = formData.department;
        payload.approvalLimit = parseFloat(formData.approvalLimit) || 500000;
      } else if (formData.role === 'CUSTOMER') {
        payload.customerType = formData.customerType;
        payload.notes = formData.notes;
      }

      const res = await api.createUser(payload);
      setSuccessMsg(res.message || 'User created successfully.');
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Create New User</h3>
              <p className="text-xs text-slate-500">Add an internal staff member, field engineer, or client.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Manager Scope Banner */}
        {isManager && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-800 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Operations Manager Scope: You are strictly authorized to onboard Sales Team specialists.</span>
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Arjun Kapoor"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mobile Number (10 Digits) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-slate-400">
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
                  className="w-full pl-12 pr-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="arjun.k@vertexservices.in"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role <span className="text-rose-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                disabled={isManager}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100"
              >
                {availableRoles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary City / Hub <span className="text-rose-500">*</span>
              </label>
              <select
                name="cityId"
                value={formData.cityId}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.state_name || 'India'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="ACTIVE">ACTIVE (Authorized to login)</option>
                <option value="PENDING">PENDING (Onboarding)</option>
                <option value="INACTIVE">INACTIVE (Deactivated)</option>
              </select>
            </div>
          </div>

          {/* Role-Specific Profile Section */}
          {formData.role === 'SALES' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Sales Specialist Profile & Targets
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Employee Type</label>
                  <select
                    name="employeeType"
                    value={formData.employeeType}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="CONTRACTOR">Contractor</option>
                    <option value="COMMISSION_ONLY">Commission Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Target (₹)</label>
                  <input
                    type="number"
                    name="monthlyTarget"
                    value={formData.monthlyTarget}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.role === 'TECHNICIAN' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Technician Skills & Coverage
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Skills (Comma-separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g. AC Repair, Water Heaters, Plumbing"
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Service Areas / Hubs</label>
                  <input
                    type="text"
                    name="serviceAreas"
                    value={formData.serviceAreas}
                    onChange={handleChange}
                    placeholder="e.g. CyberCity, Sector 15"
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.role === 'CUSTOMER' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Customer Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Customer Category</label>
                  <select
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  >
                    <option value="INDIVIDUAL">Individual Homeowner</option>
                    <option value="BUSINESS">Commercial / Retail</option>
                    <option value="CORPORATE">Corporate Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Account Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Optional notes or priority tag"
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
            >
              {isSubmitting ? 'Creating User...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
