import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../../components/ui/Table';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { auditService } from '../../../auth/audit';
import { api } from '../../../services/api';
import {
  OperationsPageHeader,
  OperationsKpiGrid,
  OperationsKpiCard,
  OperationsToolbar,
  OperationsCard,
} from '../components/OperationsDeskLayout';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Shield,
  MapPin,
  Users,
  UserCheck,
  Lock,
  Edit2,
  Trash2,
  Eye,
  Power,
  RefreshCw,
  Phone,
  Mail,
  Building,
  Briefcase,
  Layers,
  Calendar,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react';

export interface ManagerRecord {
  id: string;
  public_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  profile_image?: string;
  city_id?: number;
  assigned_hub: string;
  team_scope: string;
  assigned_region: string;
  department: string;
  direct_reports_count: number;
  stats?: {
    supervised_reps_count: number;
    supervised_leads_count: number;
    active_leads_count: number;
    won_leads_count: number;
    active_bookings_count: number;
  };
  supervised_reps?: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
  }>;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

const COMMON_HUBS = [
  'Delhi Central Hub (DEL-CENTRAL)',
  'Gurgaon Cyber Hub (GGN-CYBER)',
  'Noida Tech Hub (NOI-TECH)',
  'Mumbai West Hub (BOM-WEST)',
  'Bangalore Whitefield Hub (BLR-WHITE)',
  'Hyderabad Hitec Hub (HYD-HITEC)',
];

const COMMON_SCOPES = [
  'Northern Commercial Sales & Field Fleet',
  'Western Enterprise Sales & Field Fleet',
  'Southern Tech Fleet & Residential AMC',
  'National Accounts & Escalation Operations',
];

const COMMON_DEPARTMENTS = [
  'Hub Operations & Field Fleet',
  'Commercial Sales & Enterprise Accounts',
  'Quality Assurance & Regional SLA',
  'Operations Management',
];

export const AdminManagersView: React.FC = () => {
  const { user, canPerformAction } = useAuth();
  const { addToast } = useApp();

  // State
  const [managers, setManagers] = useState<ManagerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [hubFilter, setHubFilter] = useState('ALL');
  const [scopeFilter, setScopeFilter] = useState('ALL');
  const [filterOptions, setFilterOptions] = useState<{ hubs: string[]; scopes: string[] }>({
    hubs: [],
    scopes: [],
  });
  const [accessScope, setAccessScope] = useState<'ALL' | 'SELF'>('ALL');

  // Modal states
  const [selectedManager, setSelectedManager] = useState<ManagerRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    assigned_hub: 'Delhi Central Hub (DEL-CENTRAL)',
    team_scope: 'Northern Commercial Sales & Field Fleet',
    department: 'Hub Operations & Field Fleet',
    assigned_region: 'Delhi NCR & Northern Hub',
    status: 'ACTIVE',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ManagerRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    assigned_hub: '',
    team_scope: '',
    department: '',
    assigned_region: '',
    status: 'ACTIVE',
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingManager, setDeletingManager] = useState<ManagerRecord | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<{
    counts: { active_sales_reps: number; active_leads: number; active_bookings: number; total_dependencies: number };
    can_delete: boolean;
  } | null>(null);
  const [checkingDependencies, setCheckingDependencies] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Permissions
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isManagerRole = user?.role === 'MANAGER';
  const isSalesUser = user?.role === 'SALES' || user?.role === 'SALES_TEAM';
  const canCreate = isSuperAdmin;
  const canDelete = isSuperAdmin;

  // Load Managers
  const fetchManagers = async () => {
    if (isSalesUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.getManagers({
        search: searchTerm,
        status: statusFilter,
        hub: hubFilter,
        team_scope: scopeFilter,
      });

      if (res && res.success) {
        setManagers(res.data || []);
        if (res.filters) {
          setFilterOptions({
            hubs: res.filters.hubs || [],
            scopes: res.filters.scopes || [],
          });
        }
        if (res.scope) {
          setAccessScope(res.scope);
        }
      } else {
        setError('Failed to retrieve managers dataset from server.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Error fetching managers';
      setError(msg);
      console.error('Managers fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [statusFilter, hubFilter, scopeFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchManagers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // KPI calculations
  const totalManagers = managers.length;
  const activeManagersCount = managers.filter((m) => m.status === 'ACTIVE').length;
  const totalSupervisedReps = useMemo(() => {
    return managers.reduce((sum, m) => sum + (m.stats?.supervised_reps_count || m.direct_reports_count || 0), 0);
  }, [managers]);
  const totalActiveLeads = useMemo(() => {
    return managers.reduce((sum, m) => sum + (m.stats?.active_leads_count || 0), 0);
  }, [managers]);

  // Form Validations
  const validateForm = (data: { name: string; email: string; phone: string; assigned_hub: string; team_scope: string }) => {
    const errors: Record<string, string> = {};
    if (!data.name.trim()) errors.name = 'Full name is required.';
    if (!data.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!data.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (data.phone.trim().length < 8) {
      errors.phone = 'Phone number must be at least 8 characters.';
    }
    if (!data.assigned_hub.trim()) errors.assigned_hub = 'Assigned hub/location is required.';
    if (!data.team_scope.trim()) errors.team_scope = 'Team scope is required.';
    return errors;
  };

  // Create Manager
  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      addToast('Permission Denied', 'Only Super Administrators can enroll operations managers.', 'error');
      return;
    }

    const errors = validateForm(createForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      const res = await api.createManager(createForm);
      if (res && res.success) {
        addToast('Manager Onboarded', `Successfully enrolled ${createForm.name} to ${createForm.assigned_hub}.`, 'success');
        auditService.record(
          'USER_CREATED',
          user?.id || 'admin',
          user?.name || 'Administrator',
          user?.role || 'SUPER_ADMIN',
          `Created Operations Manager: ${createForm.name} (${createForm.email})`,
          'SUCCESS'
        );
        setIsCreateModalOpen(false);
        setCreateForm({
          name: '',
          email: '',
          phone: '',
          password: '',
          assigned_hub: COMMON_HUBS[0],
          team_scope: COMMON_SCOPES[0],
          department: COMMON_DEPARTMENTS[0],
          assigned_region: 'Delhi NCR & Northern Hub',
          status: 'ACTIVE',
        });
        await fetchManagers();
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to create manager.';
      addToast('Onboarding Failed', msg, 'error');
      setFormErrors({ server: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (mgr: ManagerRecord) => {
    setEditingManager(mgr);
    setEditForm({
      name: mgr.name,
      email: mgr.email,
      phone: mgr.phone,
      assigned_hub: mgr.assigned_hub,
      team_scope: mgr.team_scope,
      department: mgr.department || 'Hub Operations & Field Fleet',
      assigned_region: mgr.assigned_region || '',
      status: mgr.status,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Submit Edit Manager
  const handleUpdateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManager) return;

    // Permissions: Super Admin or self edit
    const isSelf = user?.id === editingManager.id;
    if (!isSuperAdmin && !isSelf) {
      addToast('Permission Denied', 'You lack authorization to modify this manager.', 'error');
      return;
    }

    const errors = validateForm(editForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        department: editForm.department,
      };

      // Only Super Admin can reassign hub, team scope, or status
      if (isSuperAdmin) {
        payload.assigned_hub = editForm.assigned_hub;
        payload.team_scope = editForm.team_scope;
        payload.assigned_region = editForm.assigned_region;
        payload.status = editForm.status;
      }

      const res = await api.updateManager(editingManager.id, payload);
      if (res && res.success) {
        addToast('Manager Updated', `Successfully updated profile for ${editForm.name}.`, 'success');
        auditService.record(
          'USER_UPDATED',
          user?.id || 'admin',
          user?.name || 'Administrator',
          user?.role || 'SUPER_ADMIN',
          `Updated Operations Manager profile: ${editForm.name}`,
          'SUCCESS'
        );
        setIsEditModalOpen(false);
        setEditingManager(null);
        await fetchManagers();
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to update manager.';
      addToast('Update Failed', msg, 'error');
      setFormErrors({ server: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Toggle
  const handleToggleStatus = async (mgr: ManagerRecord) => {
    if (!isSuperAdmin) {
      addToast('Permission Denied', 'Only Super Administrators can alter manager active status.', 'error');
      return;
    }

    const nextStatus = mgr.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.updateManager(mgr.id, { status: nextStatus });
      if (res && res.success) {
        addToast('Status Updated', `${mgr.name} marked as ${nextStatus === 'ACTIVE' ? 'Active' : 'Inactive'}.`, 'success');
        auditService.record(
          nextStatus === 'ACTIVE' ? 'USER_UPDATED' : 'USER_DEACTIVATED',
          user?.id || 'admin',
          user?.name || 'Administrator',
          user?.role || 'SUPER_ADMIN',
          `Changed Manager ${mgr.name} status to ${nextStatus}`,
          'SUCCESS'
        );
        setManagers((prev) =>
          prev.map((m) => (m.id === mgr.id ? { ...m, status: nextStatus } : m))
        );
      }
    } catch (err: any) {
      addToast('Status Update Failed', err?.message || 'Server error', 'error');
    }
  };

  // Open Delete Modal with Dependency Check
  const handleOpenDelete = async (mgr: ManagerRecord) => {
    if (!canDelete) {
      addToast('Permission Denied', 'Only Super Administrators can delete manager accounts.', 'error');
      return;
    }

    setDeletingManager(mgr);
    setIsDeleteModalOpen(true);
    setCheckingDependencies(true);
    setDependencyInfo(null);

    try {
      const res = await api.getManagerDependencies(mgr.id);
      if (res && res.success) {
        setDependencyInfo(res.data);
      }
    } catch (err: any) {
      console.warn('Failed to load dependency counts:', err);
    } finally {
      setCheckingDependencies(false);
    }
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deletingManager) return;
    setSubmitting(true);

    try {
      const res = await api.deleteManager(deletingManager.id);
      if (res && res.success) {
        addToast('Manager Deleted', `${deletingManager.name} has been removed.`, 'success');
        auditService.record(
          'USER_DELETED',
          user?.id || 'admin',
          user?.name || 'Administrator',
          user?.role || 'SUPER_ADMIN',
          `Deleted Operations Manager ${deletingManager.name} (${deletingManager.id})`,
          'SUCCESS'
        );
        setIsDeleteModalOpen(false);
        setDeletingManager(null);
        await fetchManagers();
      }
    } catch (err: any) {
      const msg = err?.message || 'Cannot delete manager due to active dependencies.';
      addToast('Deletion Blocked', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Deactivate Instead of Delete
  const handleDeactivateInstead = async () => {
    if (!deletingManager) return;
    setSubmitting(true);

    try {
      await api.updateManager(deletingManager.id, { status: 'INACTIVE' });
      addToast('Manager Deactivated', `${deletingManager.name} is now Inactive. Dependencies remain protected.`, 'success');
      auditService.record(
        'USER_DEACTIVATED',
        user?.id || 'admin',
        user?.name || 'Administrator',
        user?.role || 'SUPER_ADMIN',
        `Deactivated Operations Manager ${deletingManager.name} instead of deleting`,
        'SUCCESS'
      );
      setIsDeleteModalOpen(false);
      setDeletingManager(null);
      await fetchManagers();
    } catch (err: any) {
      addToast('Deactivation Failed', err?.message || 'Server error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Details Drawer/Modal
  const handleOpenDetails = (mgr: ManagerRecord) => {
    setSelectedManager(mgr);
    setIsDetailsOpen(true);
  };

  // Access Denied view for Sales users
  if (isSalesUser) {
    return (
      <div className="space-y-6">
        <OperationsPageHeader
          title="Operations Managers"
          subtitle="Enterprise Field Leadership and Hub Supervisors"
        />
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto shadow-sm my-12">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Access Restricted</h3>
          <p className="text-sm text-slate-600 mb-6">
            The Managers module requires Regional Operations Manager or Super Administrator credentials. Your current role is limited to Personal Sales Territory records.
          </p>
          <div className="flex justify-center">
            <Badge variant="neutral" size="sm">
              Role: Sales Representative
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <OperationsPageHeader
        title="Operations Managers"
        subtitle="Supervise regional operational hubs, field team assignments, and operational SLA adherence"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchManagers}
              disabled={loading}
            >
              Refresh
            </Button>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setFormErrors({});
                  setIsCreateModalOpen(true);
                }}
              >
                Add Manager
              </Button>
            )}
          </div>
        }
      />

      {/* Scoped Visibility Banner for Managers */}
      {isManagerRole && (
        <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <span className="font-bold">Authorized Regional Scope: </span>
            <span>
              Showing manager records and operational jurisdiction assigned to your authorized hub profile ({user?.email}).
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <OperationsKpiGrid cols={4}>
        <OperationsKpiCard
          title="Operations Managers"
          value={totalManagers}
          subtext="Regional hub supervisors"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <OperationsKpiCard
          title="Active Overseers"
          value={activeManagersCount}
          subtext="Managing live field operations"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <OperationsKpiCard
          title="Supervised Workforce"
          value={`${totalSupervisedReps} Sales Reps`}
          subtext="Direct report specialists"
          icon={<UserCheck className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50"
        />
        <OperationsKpiCard
          title="Active Leads in Scope"
          value={totalActiveLeads}
          subtext="Live operational pipeline"
          icon={<Briefcase className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
      </OperationsKpiGrid>

      {/* Toolbar with Search and Live Dynamic Filters */}
      <OperationsToolbar
        searchPlaceholder="Search manager name, email, hub, or territory..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        countBadge={`${managers.length} Managers`}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Hub Filter */}
            {filterOptions.hubs.length > 0 && (
              <select
                value={hubFilter}
                onChange={(e) => setHubFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 max-w-[200px] truncate"
              >
                <option value="ALL">All Hubs</option>
                {filterOptions.hubs.map((hub) => (
                  <option key={hub} value={hub}>
                    {hub}
                  </option>
                ))}
              </select>
            )}

            {/* Team Scope Filter */}
            {filterOptions.scopes.length > 0 && (
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 max-w-[220px] truncate"
              >
                <option value="ALL">All Team Scopes</option>
                {filterOptions.scopes.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
        actions={
          canCreate ? (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setFormErrors({});
                setIsCreateModalOpen(true);
              }}
            >
              Add Operations Manager
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-500 border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Read-Only</span>
            </div>
          )
        }
      />

      {/* Main Table */}
      <OperationsCard noPadding>
        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-800">{error}</div>
            <Button size="sm" variant="outline" onClick={fetchManagers} className="mt-3">
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager & Contact</TableHead>
                  <TableHead>Assigned Hub</TableHead>
                  <TableHead>Team & Scope</TableHead>
                  <TableHead>Supervised Reps</TableHead>
                  <TableHead>Active Leads</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created / Active</TableHead>
                  <TableHead className="text-right">Admin Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                      <span className="text-xs">Loading live operations managers...</span>
                    </TableCell>
                  </TableRow>
                ) : managers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                      No operations managers found matching the active criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  managers.map((mgr) => {
                    const activeRepsCount = mgr.stats?.supervised_reps_count ?? mgr.direct_reports_count ?? 0;
                    const activeLeadsCount = mgr.stats?.active_leads_count ?? 0;
                    const createdDate = mgr.created_at ? new Date(mgr.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

                    return (
                      <TableRow key={mgr.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Manager & Contact */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {mgr.profile_image || mgr.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-sm">{mgr.name}</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                  {mgr.public_id}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {mgr.email}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {mgr.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Assigned Hub */}
                        <TableCell>
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {mgr.assigned_hub || 'Not Assigned'}
                            </span>
                            {mgr.assigned_region && (
                              <div className="text-[11px] text-slate-500 font-medium pl-1">
                                {mgr.assigned_region}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Team & Scope */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium text-xs text-slate-800">
                              {mgr.team_scope || 'Standard Operations'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {mgr.department || 'Operations Management'}
                            </div>
                          </div>
                        </TableCell>

                        {/* Supervised Reps */}
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                            <Users className="w-3 h-3" />
                            {activeRepsCount} {activeRepsCount === 1 ? 'Rep' : 'Reps'}
                          </span>
                        </TableCell>

                        {/* Active Leads */}
                        <TableCell>
                          <span className="font-semibold text-xs text-slate-800">
                            {activeLeadsCount} Leads
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge variant={mgr.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                            {mgr.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>

                        {/* Created / Active */}
                        <TableCell>
                          <div className="text-xs text-slate-700 font-medium">{createdDate}</div>
                          {mgr.last_login_at && (
                            <div className="text-[10px] text-slate-400">
                              Active {new Date(mgr.last_login_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </TableCell>

                        {/* Admin Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Details Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDetails(mgr)}
                              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
                              title="View Manager Profile & Team Scope"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>

                            {/* Edit Button (Super Admin or Self) */}
                            {(isSuperAdmin || user?.id === mgr.id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(mgr)}
                                className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
                                title="Edit Manager Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Toggle Status Button (Super Admin) */}
                            {isSuperAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(mgr)}
                                className={`h-7 w-7 p-0 ${
                                  mgr.status === 'ACTIVE'
                                    ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={mgr.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {/* Delete Button (Super Admin) */}
                            {isSuperAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDelete(mgr)}
                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                title="Delete Manager (With Dependency Check)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </OperationsCard>

      {/* ========================================================================= */}
      {/* CREATE MANAGER MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !submitting && setIsCreateModalOpen(false)}
        title="Onboard Operations Manager"
      >
        <form onSubmit={handleCreateManager} className="space-y-4">
          {formErrors.server && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formErrors.server}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name *
            </label>
            <Input
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Rajesh Varma"
            />
            {formErrors.name && <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Corporate Email *
              </label>
              <Input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="manager.hub@vertex.demo"
              />
              {formErrors.email && <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Official Phone *
              </label>
              <Input
                type="tel"
                required
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="+91 99000 00000"
              />
              {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Temporary Password (Optional)
            </label>
            <Input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Leave blank for secure system default"
            />
            <span className="text-[10px] text-slate-500">Defaults to standard verified credentials if blank.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Assigned Regional Hub *
            </label>
            <select
              value={createForm.assigned_hub}
              onChange={(e) => setCreateForm({ ...createForm, assigned_hub: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              {COMMON_HUBS.map((hub) => (
                <option key={hub} value={hub}>
                  {hub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Managed Team / Operational Scope *
            </label>
            <select
              value={createForm.team_scope}
              onChange={(e) => setCreateForm({ ...createForm, team_scope: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              {COMMON_SCOPES.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Department
              </label>
              <select
                value={createForm.department}
                onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                {COMMON_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Initial Account Status
              </label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive (Draft)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Onboarding...' : 'Confirm & Onboard Manager'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* EDIT MANAGER MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !submitting && setIsEditModalOpen(false)}
        title={editingManager ? `Edit Profile: ${editingManager.name}` : 'Edit Manager'}
      >
        <form onSubmit={handleUpdateManager} className="space-y-4">
          {formErrors.server && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formErrors.server}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name *
            </label>
            <Input
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            {formErrors.name && <p className="text-[11px] text-rose-600 mt-1">{formErrors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Corporate Email *
              </label>
              <Input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              {formErrors.email && <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Official Phone *
              </label>
              <Input
                type="tel"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
            </div>
          </div>

          {isSuperAdmin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assigned Regional Hub *
                </label>
                <select
                  value={editForm.assigned_hub}
                  onChange={(e) => setEditForm({ ...editForm, assigned_hub: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {COMMON_HUBS.map((hub) => (
                    <option key={hub} value={hub}>
                      {hub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Managed Team / Scope *
                </label>
                <select
                  value={editForm.team_scope}
                  onChange={(e) => setEditForm({ ...editForm, team_scope: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {COMMON_SCOPES.map((sc) => (
                    <option key={sc} value={sc}>
                      {sc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    {COMMON_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* VIEW MANAGER DETAILS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedManager ? `Manager Profile: ${selectedManager.name}` : 'Manager Profile'}
      >
        {selectedManager && (
          <div className="space-y-4">
            {/* Header info card */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-base flex items-center justify-center flex-shrink-0">
                {selectedManager.profile_image || selectedManager.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base truncate">{selectedManager.name}</h3>
                  <Badge variant={selectedManager.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                    {selectedManager.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{selectedManager.public_id}</div>
              </div>
            </div>

            {/* Hub & Territory Card */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Regional Hub Jurisdiction</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Operating Hub:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedManager.assigned_hub || 'Not Assigned'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Region / Territory:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedManager.assigned_region || 'National'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Managed Team Scope:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedManager.team_scope}</div>
                </div>
                <div>
                  <span className="text-slate-500">Department:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedManager.department}</div>
                </div>
              </div>
            </div>

            {/* Performance & Operational Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-lg font-bold text-slate-900">
                  {selectedManager.stats?.supervised_reps_count ?? selectedManager.direct_reports_count ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Sales Reps</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-lg font-bold text-indigo-600">
                  {selectedManager.stats?.active_leads_count ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Active Leads</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-lg font-bold text-emerald-600">
                  {selectedManager.stats?.won_leads_count ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">Won Contracts</div>
              </div>
            </div>

            {/* Supervised Team Roster */}
            <div>
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 flex items-center justify-between">
                <span>Supervised Sales Specialists</span>
                <Badge variant="neutral" size="sm">
                  {selectedManager.supervised_reps?.length || 0} Assigned
                </Badge>
              </div>

              {!selectedManager.supervised_reps || selectedManager.supervised_reps.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                  No individual sales representatives currently assigned to this manager.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {selectedManager.supervised_reps.map((rep) => (
                    <div key={rep.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{rep.name}</div>
                        <div className="text-[11px] text-slate-500">{rep.email} • {rep.phone}</div>
                      </div>
                      <Badge variant={rep.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                        {rep.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact & System Information */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{selectedManager.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-medium text-slate-800">{selectedManager.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created:</span>
                <span className="text-slate-700">
                  {new Date(selectedManager.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              {selectedManager.last_login_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Login:</span>
                  <span className="text-slate-700">
                    {new Date(selectedManager.last_login_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              {isSuperAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setIsDetailsOpen(false);
                    handleOpenEdit(selectedManager);
                  }}
                >
                  Edit Profile
                </Button>
              )}
              <Button size="sm" variant="primary" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* DELETE MANAGER MODAL (WITH DEPENDENCY CHECK) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !submitting && setIsDeleteModalOpen(false)}
        title="Delete Operations Manager"
      >
        {deletingManager && (
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Permanent Removal Warning</h4>
                <p className="text-xs text-rose-700 mt-1">
                  You are preparing to delete manager <span className="font-bold">{deletingManager.name}</span> ({deletingManager.assigned_hub}).
                </p>
              </div>
            </div>

            {/* Dependency Check Section */}
            {checkingDependencies ? (
              <div className="p-4 text-center text-xs text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-slate-400" />
                Scanning live team dependencies and active operational records...
              </div>
            ) : dependencyInfo && !dependencyInfo.can_delete ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Active Dependencies Detected — Permanent Deletion Blocked</span>
                </div>

                <p className="text-xs text-amber-800">
                  This manager currently supervises active operational records. Deleting this account would cause data orphans and break workflow isolation:
                </p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded border border-amber-200">
                    <div className="font-bold text-amber-900 text-sm">{dependencyInfo.counts.active_sales_reps}</div>
                    <div className="text-[10px] text-amber-700">Sales Reps</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-amber-200">
                    <div className="font-bold text-amber-900 text-sm">{dependencyInfo.counts.active_leads}</div>
                    <div className="text-[10px] text-amber-700">Active Leads</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-amber-200">
                    <div className="font-bold text-amber-900 text-sm">{dependencyInfo.counts.active_bookings}</div>
                    <div className="text-[10px] text-amber-700">Active Bookings</div>
                  </div>
                </div>

                <p className="text-[11px] text-amber-700 italic">
                  Recommended Action: Safely deactivate this manager instead to preserve reporting history and prevent unauthorized access.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 inline mr-1.5 text-emerald-600" />
                No active sales reps or live bookings are bound to this manager. Permanent deletion is permitted.
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>

              {dependencyInfo && !dependencyInfo.can_delete ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleDeactivateInstead}
                  disabled={submitting}
                >
                  {submitting ? 'Deactivating...' : 'Deactivate Manager Instead'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleConfirmDelete}
                  disabled={submitting || (dependencyInfo && !dependencyInfo.can_delete)}
                >
                  {submitting ? 'Deleting...' : 'Confirm Permanent Deletion'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
