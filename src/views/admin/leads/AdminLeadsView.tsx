import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { LeadItem, LeadFollowupItem, LeadPriority, LeadStatus } from '../../../types/auth';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import {
  OperationsPageHeader,
  OperationsKpiGrid,
  OperationsKpiCard,
  OperationsToolbar,
  OperationsStatusTabs,
  OperationsCard,
} from '../components/OperationsDeskLayout';
import {
  Search,
  Plus,
  TrendingUp,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  MessageSquare,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export const AdminLeadsView: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { addToast } = useApp();

  // Permissions
  const canView = hasPermission('LEAD_VIEW') || ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'SALES_TEAM'].includes(user?.role || '');
  const canCreate = hasPermission('LEAD_CREATE') || ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'SALES_TEAM'].includes(user?.role || '');
  const canEdit = hasPermission('LEAD_EDIT') || ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'SALES_TEAM'].includes(user?.role || '');
  const canAssign = hasPermission('LEAD_ASSIGN') || ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '');
  const canFollowup = hasPermission('LEAD_FOLLOWUP_CREATE') || ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'SALES_TEAM'].includes(user?.role || '');
  const canConvert = hasPermission('LEAD_CONVERT') || ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'SALES_TEAM'].includes(user?.role || '');
  const canDelete = hasPermission('LEAD_DELETE') || ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '');

  // State
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeLead, setActiveLead] = useState<LeadItem | null>(null);
  const [leadFollowups, setLeadFollowups] = useState<LeadFollowupItem[]>([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);

  // Dynamic Service Categories from Master Catalog
  interface ServiceCategoryOption {
    id: number | string;
    name: string;
    code?: string;
    description?: string;
    active: boolean;
    sort_order?: number;
  }
  const [categories, setCategories] = useState<ServiceCategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState<string>('');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    city_name: 'Delhi NCR',
    service_category: '',
    service_requirement: '',
    source: 'Website Lead',
    priority: 'HIGH' as LeadPriority,
    estimated_value: '15000',
    assigned_to_user_id: '',
    notes: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    service_category: '',
    service_requirement: '',
    priority: 'HIGH' as LeadPriority,
    estimated_value: '0',
    assigned_to_user_id: '',
    notes: '',
  });

  // Follow-up Form State
  const [followupForm, setFollowupForm] = useState({
    type: 'CALL' as 'CALL' | 'MEETING' | 'EMAIL' | 'NOTES',
    notes: '',
    followup_date: new Date().toISOString().slice(0, 16),
    next_followup_date: '',
  });

  // Convert Form State
  const [convertForm, setConvertForm] = useState({
    address: '',
    scheduled_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    scheduled_slot: '10:00 AM - 12:00 PM',
    notes: '',
  });

  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Load leads and sales users
  const fetchLeads = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getLeads();
      setLeads(data || []);
    } catch (err: any) {
      console.error('Failed to load leads:', err);
      setErrorMsg(err.message || 'Unable to retrieve leads from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalesUsers = async () => {
    try {
      const res = await api.getUsers({ role: 'SALES' });
      setSalesUsers(res.data || []);
    } catch {
      // Fallback: load without filter
      try {
        const res = await api.getUsers();
        const list = res.data || [];
        setSalesUsers(
          list.filter((u: any) =>
            ['SALES', 'SALES_TEAM', 'MANAGER', 'SUPER_ADMIN'].includes(u.role)
          )
        );
      } catch (e) {
        console.warn('Failed to load sales team members', e);
      }
    }
  };

  const fetchActiveCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await api.getServiceCategories({ status: 'ACTIVE' });
      let rawList: any[] = [];
      if (res && res.success && Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res)) {
        rawList = res;
      } else if (res && Array.isArray((res as any).data)) {
        rawList = (res as any).data;
      }

      // Filter active and non-deleted categories strictly
      const activeList: ServiceCategoryOption[] = rawList
        .filter((c: any) => !c.deleted_at && c.active !== false && c.is_active !== false && c.status !== 'INACTIVE')
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          description: c.description,
          active: c.active !== false && c.is_active !== false,
          sort_order: c.sort_order ?? 999,
        }))
        .sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999) || a.name.localeCompare(b.name));

      setCategories(activeList);

      // If createForm.service_category is empty and active categories are available, initialize it with first active category
      setCreateForm((prev) => {
        if (!prev.service_category && activeList.length > 0) {
          return { ...prev, service_category: activeList[0].name };
        }
        return prev;
      });
    } catch (err: any) {
      console.error('Failed to load active service categories:', err);
      setCategoriesError(err.message || 'Unable to load service categories. Please try again.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchSalesUsers();
    fetchActiveCategories();
  }, []);

  // Fetch latest active categories whenever the Create modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      setCategorySearch('');
      fetchActiveCategories();
    }
  }, [isCreateModalOpen]);

  // Listen for cross-module category updates
  useEffect(() => {
    const handleCategoryUpdate = () => {
      fetchActiveCategories();
    };
    window.addEventListener('vertex:categories-updated', handleCategoryUpdate);
    return () => {
      window.removeEventListener('vertex:categories-updated', handleCategoryUpdate);
    };
  }, []);

  // Filtered categories for dropdown search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.trim().toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, categorySearch]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchTerm.trim() ||
        lead.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.customer_phone?.includes(searchTerm) ||
        lead.lead_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.service_requirement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.service_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === 'ALL' || lead.status === selectedStatus;
      const matchesPriority = selectedPriority === 'ALL' || lead.priority === selectedPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [leads, searchTerm, selectedStatus, selectedPriority]);

  // Statistics
  const stats = useMemo(() => {
    const total = leads.length;
    const pipelineValue = leads.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
    const wonCount = leads.filter((l) => l.status === 'WON').length;
    const wonValue = leads
      .filter((l) => l.status === 'WON')
      .reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
    const inProgressCount = leads.filter((l) =>
      ['NEW', 'CONTACTED', 'IN_PROGRESS', 'QUALIFIED', 'PROPOSAL_SENT'].includes(l.status)
    ).length;

    return { total, pipelineValue, wonCount, wonValue, inProgressCount };
  }, [leads]);

  // Handle Lead Creation
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.customer_name.trim() || createForm.customer_name.trim().length < 2) {
      addToast('Validation Error', 'Customer name must be at least 2 characters.', 'error');
      return;
    }

    const cleanPhone = createForm.customer_phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      addToast('Validation Error', 'Please enter a valid 10-digit Indian phone number.', 'error');
      return;
    }

    if (!createForm.service_category || !createForm.service_category.trim()) {
      addToast('Validation Error', 'Please select a valid Service Category.', 'error');
      return;
    }

    setIsActionSubmitting(true);
    try {
      const selectedCat = categories.find(
        (c) => c.name.toLowerCase() === createForm.service_category.trim().toLowerCase()
      );

      const payload = {
        customer_name: createForm.customer_name.trim(),
        customer_phone: cleanPhone,
        customer_email: createForm.customer_email.trim() || undefined,
        city_name: createForm.city_name,
        service_category: selectedCat ? selectedCat.name : createForm.service_category.trim(),
        category_id: selectedCat ? selectedCat.id : undefined,
        service_requirement: createForm.service_requirement.trim() || undefined,
        source: createForm.source,
        priority: createForm.priority,
        estimated_value: parseFloat(createForm.estimated_value) || 0,
        assigned_to_user_id: createForm.assigned_to_user_id || undefined,
        notes: createForm.notes.trim() || undefined,
      };

      const res = await api.createLead(payload);
      addToast('Lead Generated', res.message || 'Lead registered successfully in pipeline.', 'success');
      setIsCreateModalOpen(false);
      setCreateForm({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        city_name: 'Delhi NCR',
        service_category: categories.length > 0 ? categories[0].name : '',
        service_requirement: '',
        source: 'Website Lead',
        priority: 'HIGH',
        estimated_value: '15000',
        assigned_to_user_id: '',
        notes: '',
      });
      await fetchLeads();
    } catch (err: any) {
      addToast('Creation Failed', err.message || 'Failed to generate lead.', 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (lead: LeadItem) => {
    setActiveLead(lead);
    setEditForm({
      customer_name: lead.customer_name || '',
      customer_phone: lead.customer_phone || '',
      customer_email: lead.customer_email || '',
      service_category: lead.service_category || '',
      service_requirement: lead.service_requirement || '',
      priority: lead.priority || 'MEDIUM',
      estimated_value: String(lead.estimated_value || 0),
      assigned_to_user_id: lead.assigned_to_user_id || '',
      notes: lead.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Lead Edit
  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;

    setIsActionSubmitting(true);
    try {
      const selectedEditCat = categories.find(
        (c) => c.name.toLowerCase() === editForm.service_category.trim().toLowerCase()
      );

      const payload = {
        customer_name: editForm.customer_name.trim(),
        customer_phone: editForm.customer_phone.replace(/\D/g, ''),
        customer_email: editForm.customer_email.trim() || undefined,
        service_category: selectedEditCat ? selectedEditCat.name : (editForm.service_category.trim() || undefined),
        category_id: selectedEditCat ? selectedEditCat.id : undefined,
        service_requirement: editForm.service_requirement.trim() || undefined,
        priority: editForm.priority,
        estimated_value: parseFloat(editForm.estimated_value) || 0,
        assigned_to_user_id: editForm.assigned_to_user_id || undefined,
        notes: editForm.notes.trim() || undefined,
      };

      await api.updateLead(activeLead.id, payload);
      addToast('Lead Updated', 'Changes saved successfully.', 'success');
      setIsEditModalOpen(false);
      await fetchLeads();
    } catch (err: any) {
      addToast('Update Failed', err.message || 'Failed to update lead.', 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Quick Status Update
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await api.updateLeadStatus(leadId, newStatus);
      addToast('Status Updated', `Lead moved to ${newStatus}`, 'success');
      await fetchLeads();
    } catch (err: any) {
      addToast('Status Change Failed', err.message || 'Unable to update status.', 'error');
    }
  };

  // Open Follow-up Modal
  const handleOpenFollowup = async (lead: LeadItem) => {
    setActiveLead(lead);
    setIsFollowupModalOpen(true);
    setLoadingFollowups(true);
    try {
      const followups = await api.getLeadFollowups(lead.id);
      setLeadFollowups(followups || []);
    } catch (err) {
      console.warn('Failed to load follow-ups:', err);
    } finally {
      setLoadingFollowups(false);
    }
  };

  // Submit Follow-up
  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !followupForm.notes.trim()) {
      addToast('Validation', 'Please enter follow-up remarks or minutes of discussion.', 'error');
      return;
    }

    setIsActionSubmitting(true);
    try {
      await api.addLeadFollowup(activeLead.id, {
        type: followupForm.type,
        notes: followupForm.notes.trim(),
        followup_date: followupForm.followup_date,
        next_followup_date: followupForm.next_followup_date || undefined,
      });

      addToast('Follow-up Recorded', 'Scheduled task logged to CRM timeline.', 'success');
      setFollowupForm({
        type: 'CALL',
        notes: '',
        followup_date: new Date().toISOString().slice(0, 16),
        next_followup_date: '',
      });

      // Refresh followups list and leads
      const refreshed = await api.getLeadFollowups(activeLead.id);
      setLeadFollowups(refreshed || []);
      await fetchLeads();
    } catch (err: any) {
      addToast('Failed', err.message || 'Failed to log follow-up.', 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Open Convert Modal
  const handleOpenConvert = (lead: LeadItem) => {
    setActiveLead(lead);
    setConvertForm({
      address: lead.city_name ? `${lead.city_name} Hub Territory` : 'Corporate Head Office',
      scheduled_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      scheduled_slot: '10:00 AM - 12:00 PM',
      notes: `Converted from Lead ${lead.lead_number} (${lead.service_requirement || lead.service_category || 'Service'})`,
    });
    setIsConvertModalOpen(true);
  };

  // Submit Convert
  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;

    setIsActionSubmitting(true);
    try {
      const res = await api.convertLeadToBooking(activeLead.id, convertForm);
      addToast('Lead Converted!', res.message || 'Lead successfully transformed into a confirmed booking.', 'success');
      setIsConvertModalOpen(false);
      await fetchLeads();
    } catch (err: any) {
      addToast('Conversion Failed', err.message || 'Failed to convert lead to booking.', 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Handle Delete Lead
  const handleDeleteLead = async (lead: LeadItem) => {
    if (!window.confirm(`Are you sure you want to delete lead ${lead.lead_number} (${lead.customer_name})?`)) {
      return;
    }
    try {
      await api.deleteLead(lead.id);
      addToast('Lead Deleted', `Lead ${lead.lead_number} removed from pipeline.`, 'info');
      await fetchLeads();
    } catch (err: any) {
      addToast('Delete Failed', err.message || 'Failed to delete lead.', 'error');
    }
  };

  // Quick Assign Lead
  const handleQuickAssign = async (leadId: string, assignedUserId: string) => {
    try {
      await api.assignLead(leadId, assignedUserId);
      addToast('Lead Assigned', 'Sales representative allocated.', 'success');
      await fetchLeads();
    } catch (err: any) {
      addToast('Assign Failed', err.message || 'Failed to allocate sales rep.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <OperationsPageHeader
        title="Sales CRM & Lead Pipeline"
        subtitle="Generate, qualify, assign, follow up, and convert enterprise & residential leads."
        icon={<TrendingUp className="w-5 h-5 text-white" />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLeads}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>

            {canCreate ? (
              <button
                type="button"
                id="btn-generate-lead"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Generate Lead</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Read-Only View</span>
              </div>
            )}
          </>
        }
      />

      {/* KPI Stats Cards */}
      <OperationsKpiGrid columns={4}>
        <OperationsKpiCard
          label="Total Pipeline"
          value={`${stats.total} Leads`}
          subtext={
            <>
              Total Value:{' '}
              <span className="font-bold text-slate-900">
                ₹{stats.pipelineValue.toLocaleString('en-IN')}
              </span>
            </>
          }
          icon={<TrendingUp className="w-4 h-4" />}
          variant="indigo"
        />
        <OperationsKpiCard
          label="Active Deals"
          value={`${stats.inProgressCount} Open`}
          subtext="Under negotiation & proposals"
          icon={<Clock className="w-4 h-4" />}
          variant="amber"
        />
        <OperationsKpiCard
          label="Converted & Won"
          value={`${stats.wonCount} Deals`}
          subtext={`₹${stats.wonValue.toLocaleString('en-IN')} Realized Revenue`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="emerald"
        />
        <OperationsKpiCard
          label="Win Rate"
          value={stats.total > 0 ? `${Math.round((stats.wonCount / stats.total) * 100)}%` : '0%'}
          subtext="Conversion from qualified leads"
          icon={<ShieldCheck className="w-4 h-4" />}
          variant="blue"
        />
      </OperationsKpiGrid>

      {/* Filters & Search Toolbar with Integrated Horizontal Tabs */}
      <OperationsToolbar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Search by prospect name, phone number, lead #, or requirement...',
        }}
        filters={
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="whitespace-nowrap">Priority:</span>
            <select
              aria-label="Filter by Priority"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        }
        tabs={
          <OperationsStatusTabs
            tabs={[
              { key: 'ALL', label: 'All Leads', count: leads.length },
              { key: 'NEW', label: 'New Inbound', count: leads.filter((l) => l.status === 'NEW').length },
              { key: 'CONTACTED', label: 'Contacted', count: leads.filter((l) => l.status === 'CONTACTED').length },
              { key: 'IN_PROGRESS', label: 'In Progress', count: leads.filter((l) => l.status === 'IN_PROGRESS').length },
              { key: 'QUALIFIED', label: 'Qualified', count: leads.filter((l) => l.status === 'QUALIFIED').length },
              { key: 'PROPOSAL_SENT', label: 'Proposal Sent', count: leads.filter((l) => l.status === 'PROPOSAL_SENT').length },
              { key: 'WON', label: 'Won / Converted', count: leads.filter((l) => l.status === 'WON').length },
              { key: 'LOST', label: 'Lost', count: leads.filter((l) => l.status === 'LOST').length },
            ]}
            activeTab={selectedStatus}
            onChange={setSelectedStatus}
          />
        }
      />

      {/* Leads Table Container */}
      <OperationsCard noPadding className="border border-slate-200">
        {isLoading ? (
          <div className="p-12 text-center text-slate-600 font-semibold flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading CRM leads pipeline...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No leads found</h3>
            <p className="text-xs font-semibold text-slate-600 max-w-sm mx-auto">
              {searchTerm || selectedStatus !== 'ALL' || selectedPriority !== 'ALL'
                ? 'No leads matched your filter criteria. Try clearing search filters.'
                : 'Your sales pipeline is empty. Generate your first lead to start tracking deals.'}
            </p>
            {canCreate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                + Generate First Lead
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop & Tablet Table (Scrolls Horizontally inside its own container without pushing page) */}
            <div className="hidden md:block overflow-x-auto min-w-0 w-full">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="w-[14%] min-w-[130px] px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 text-left">
                      Lead Info
                    </th>
                    <th className="w-[22%] min-w-[200px] px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 text-left">
                      Prospect & Contact
                    </th>
                    <th className="min-w-[200px] px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 text-left">
                      Service Requirement
                    </th>
                    <th className="w-[12%] min-w-[110px] px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 text-left">
                      Deal Value
                    </th>
                    <th className="w-[15%] min-w-[140px] px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 text-left">
                      Sales Owner
                    </th>
                    <th className="w-[13%] min-w-[130px] px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 text-left">
                      Status
                    </th>
                    <th className="w-[14%] min-w-[130px] px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-700 text-right">
                      Workflow Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => {
                    const isWon = lead.status === 'WON';
                    const isLost = lead.status === 'LOST';

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 align-top">
                          <div className="font-mono font-bold text-xs text-indigo-700">
                            {lead.lead_number}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.city_name || 'National'}</span>
                          </div>
                          <div className="mt-1.5">
                            <Badge
                              variant={
                                lead.priority === 'URGENT'
                                  ? 'danger'
                                  : lead.priority === 'HIGH'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {lead.priority}
                            </Badge>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <div className="font-bold text-slate-900 text-sm leading-snug">
                            {lead.customer_name}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-1">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono">{lead.customer_phone}</span>
                          </div>
                          {lead.customer_email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5 truncate">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{lead.customer_email}</span>
                            </div>
                          )}
                          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                            Source: {lead.source || 'Website'}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 align-top max-w-xs">
                          <div className="font-bold text-slate-900 text-xs">
                            {lead.service_category || 'General Service'}
                          </div>
                          <div className="text-xs text-slate-600 line-clamp-2 mt-1 font-medium leading-relaxed break-words">
                            {lead.service_requirement || lead.notes || 'No specific requirement specified.'}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <div className="font-black text-slate-900 text-sm">
                            ₹{(Number(lead.estimated_value) || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            Estimated
                          </div>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          {canAssign ? (
                            <select
                              aria-label="Assign Sales Owner"
                              value={lead.assigned_to_user_id || ''}
                              onChange={(e) => handleQuickAssign(lead.id, e.target.value)}
                              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 cursor-pointer shadow-2xs truncate h-[32px]"
                            >
                              <option value="">Unassigned</option>
                              {salesUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-xs font-bold text-slate-800 py-1.5">
                              {lead.assigned_to_name || 'Unassigned'}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <select
                            aria-label="Lead Status"
                            value={lead.status}
                            disabled={!canEdit}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                            className={`w-full text-xs font-bold rounded-lg px-2.5 py-1.5 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs h-[32px] ${
                              lead.status === 'WON'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : lead.status === 'LOST'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : lead.status === 'QUALIFIED'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : lead.status === 'PROPOSAL_SENT'
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="NEW">NEW</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="QUALIFIED">QUALIFIED</option>
                            <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
                            <option value="WON">WON</option>
                            <option value="LOST">LOST</option>
                          </select>
                        </td>

                        <td className="px-4 py-3.5 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Follow-up Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenFollowup(lead)}
                              title="Schedule Follow-up / History"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>

                            {/* Convert to Booking Button */}
                            {!isWon && canConvert && (
                              <button
                                type="button"
                                onClick={() => handleOpenConvert(lead)}
                                title="Convert to Confirmed Booking"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                              >
                                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Convert</span>
                              </button>
                            )}

                            {isWon && lead.converted_booking_id && (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Booked
                              </span>
                            )}

                            {/* Edit Button */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(lead)}
                                title="Edit Lead Details"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete Button */}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteLead(lead)}
                                title="Delete Lead"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Lead Cards (Visible on screens < 768px for optimal touch experience) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const isWon = lead.status === 'WON';

                return (
                  <div key={lead.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-indigo-700">
                          {lead.lead_number}
                        </span>
                        <Badge
                          variant={
                            lead.priority === 'URGENT'
                              ? 'danger'
                              : lead.priority === 'HIGH'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {lead.priority}
                        </Badge>
                      </div>
                      <div className="font-black text-slate-900 text-sm">
                        ₹{(Number(lead.estimated_value) || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-base">{lead.customer_name}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                        <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.customer_phone}</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{lead.city_name || 'National'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{lead.service_category || 'General Service'}</div>
                      <div className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                        {lead.service_requirement || lead.notes || 'No requirement specified'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Sales Owner
                        </label>
                        {canAssign ? (
                          <select
                            aria-label="Assign Sales Owner"
                            value={lead.assigned_to_user_id || ''}
                            onChange={(e) => handleQuickAssign(lead.id, e.target.value)}
                            className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2 py-1.5"
                          >
                            <option value="">Unassigned</option>
                            {salesUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs font-bold text-slate-800 py-1">
                            {lead.assigned_to_name || 'Unassigned'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Lead Status
                        </label>
                        <select
                          aria-label="Lead Status"
                          value={lead.status}
                          disabled={!canEdit}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className="w-full text-xs font-bold rounded-lg px-2 py-1.5 border"
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="QUALIFIED">QUALIFIED</option>
                          <option value="PROPOSAL_SENT">PROPOSAL SENT</option>
                          <option value="WON">WON</option>
                          <option value="LOST">LOST</option>
                        </select>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenFollowup(lead)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(lead)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {!isWon && canConvert && (
                        <button
                          type="button"
                          onClick={() => handleOpenConvert(lead)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                        >
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Convert to Booking</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table Footer with Record Summary */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">
                Showing <span className="font-bold text-slate-900">{filteredLeads.length}</span> of{' '}
                <span className="font-bold text-slate-900">{leads.length}</span> total leads
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Pipeline Value in View:{' '}
                <span className="font-black text-slate-900">
                  ₹{filteredLeads.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0).toLocaleString('en-IN')}
                </span>
              </span>
            </div>
          </>
        )}
      </OperationsCard>

      {/* CREATE / GENERATE LEAD MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate New Customer Lead"
        size="lg"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 pt-1">
          <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 text-xs font-semibold text-indigo-950 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-700 shrink-0" />
            <span>
              Registering this lead makes it immediately visible to the sales fleet and triggers follow-up pipelines.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Prospect / Customer Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DLF Magnolias Residencies or Rakesh Sharma"
                value={createForm.customer_name}
                onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white placeholder:text-slate-400 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Contact Phone Number (10 Digits) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-slate-600">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="98100 00000"
                  value={createForm.customer_phone}
                  onChange={(e) => setCreateForm({ ...createForm, customer_phone: e.target.value })}
                  className="w-full pl-13 pr-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white placeholder:text-slate-400 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="prospect@example.com"
                value={createForm.customer_email}
                onChange={(e) => setCreateForm({ ...createForm, customer_email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white placeholder:text-slate-400 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Operating Territory / Hub
              </label>
              <select
                value={createForm.city_name}
                onChange={(e) => setCreateForm({ ...createForm, city_name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="Delhi NCR">Delhi NCR (Central & South)</option>
                <option value="Gurgaon">Gurgaon Cyber Hub & Sohna Road</option>
                <option value="Noida">Noida Expressway & Sector 62</option>
                <option value="Mumbai">Mumbai Western Suburbs & BKC</option>
                <option value="Bangalore">Bangalore Whitefield & Koramangala</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="create-lead-service-category" className="block text-xs font-bold uppercase tracking-wide text-slate-900">
                  Service Category <span className="text-rose-600">*</span>
                </label>
                {categories.length > 4 && (
                  <div className="relative flex items-center">
                    <Search className="w-3 h-3 absolute left-2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="pl-6 pr-6 py-0.5 text-xs bg-slate-50 text-slate-900 placeholder:text-slate-400 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-600 w-36 sm:w-44"
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => setCategorySearch('')}
                        className="absolute right-1 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Clear filter"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <select
                id="create-lead-service-category"
                required
                value={createForm.service_category}
                onChange={(e) => setCreateForm({ ...createForm, service_category: e.target.value })}
                disabled={isActionSubmitting || (categoriesLoading && categories.length === 0)}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {categoriesLoading && categories.length === 0 && (
                  <option value="" disabled>Loading active service categories...</option>
                )}
                {!categoriesLoading && categoriesError && categories.length === 0 && (
                  <option value="" disabled>Failed to load service categories</option>
                )}
                {!categoriesLoading && !categoriesError && filteredCategories.length === 0 && (
                  <option value="" disabled>
                    {categorySearch ? `No category matching "${categorySearch}"` : 'No active service categories available'}
                  </option>
                )}
                {filteredCategories.length > 0 && (
                  <>
                    {!createForm.service_category && (
                      <option value="" disabled>-- Select Service Category --</option>
                    )}
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.name} data-category-id={cat.id}>
                        {cat.name} {cat.code ? `(${cat.code})` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>

              {/* Error state with retry */}
              {categoriesError && (
                <div className="mt-1.5 flex items-center justify-between text-xs text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{categoriesError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchActiveCategories}
                    className="font-bold underline hover:text-rose-800 cursor-pointer ml-2"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty active categories notice */}
              {!categoriesLoading && !categoriesError && categories.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200 font-medium">
                  No active categories registered yet. Please create one in <span className="font-bold">Super Admin &gt; Service Categories</span>.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Lead Source
              </label>
              <select
                value={createForm.source}
                onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="Website Lead">Website Inquiry / Portal</option>
                <option value="Inbound Phone Call">Inbound Call Center</option>
                <option value="Field Sales Executive">Field Sales Executive</option>
                <option value="Customer Referral">Customer Referral</option>
                <option value="Corporate Partnership">Corporate Partnership</option>
                <option value="Digital Marketing">Google / Meta Campaign</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Estimated Deal Size (₹)
              </label>
              <input
                type="number"
                value={createForm.estimated_value}
                onChange={(e) => setCreateForm({ ...createForm, estimated_value: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Priority Level
              </label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as LeadPriority })}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Hot Prospect)</option>
                <option value="URGENT">Urgent (Immediate Callback)</option>
              </select>
            </div>
          </div>

          {canAssign && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Assign to Sales Representative
              </label>
              <select
                value={createForm.assigned_to_user_id}
                onChange={(e) => setCreateForm({ ...createForm, assigned_to_user_id: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="">Leave Unassigned (Pool Lead)</option>
                {salesUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email || u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
              Detailed Requirement & Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Needs full office 20-ton HVAC inspection and quotation for annual maintenance agreement."
              value={createForm.service_requirement}
              onChange={(e) => setCreateForm({ ...createForm, service_requirement: e.target.value })}
              className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 bg-white placeholder:text-slate-400 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isActionSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isActionSubmitting ? 'Generating Lead...' : 'Generate Lead & Add to CRM'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT LEAD MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Lead Details (${activeLead?.lead_number})`}
        size="md"
      >
        <form onSubmit={handleEditLead} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              required
              value={editForm.customer_name}
              onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Phone
              </label>
              <input
                type="text"
                required
                value={editForm.customer_phone}
                onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Deal Value (₹)
              </label>
              <input
                type="number"
                value={editForm.estimated_value}
                onChange={(e) => setEditForm({ ...editForm, estimated_value: e.target.value })}
                className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
              Service Category
            </label>
            <select
              value={editForm.service_category}
              onChange={(e) => setEditForm({ ...editForm, service_category: e.target.value })}
              className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300"
            >
              {editForm.service_category && !categories.some(c => c.name.toLowerCase() === editForm.service_category.toLowerCase()) && (
                <option value={editForm.service_category}>
                  {editForm.service_category} (Current)
                </option>
              )}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name} {cat.code ? `(${cat.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
              Priority
            </label>
            <select
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as LeadPriority })}
              className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
              Requirement & Notes
            </label>
            <textarea
              rows={3}
              value={editForm.service_requirement}
              onChange={(e) => setEditForm({ ...editForm, service_requirement: e.target.value })}
              className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isActionSubmitting}>
              {isActionSubmitting ? 'Saving...' : 'Save Lead'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* FOLLOW-UP & TIMELINE MODAL */}
      <Modal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        title={`Follow-up Timeline • ${activeLead?.customer_name}`}
        size="lg"
      >
        <div className="space-y-5">
          {/* New Follow-up Log Box */}
          <form onSubmit={handleAddFollowup} className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3">
            <h4 className="text-xs font-extrabold uppercase text-slate-900 tracking-wide flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-700" />
              <span>Log Follow-up Activity or Meeting</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-800 mb-1">Activity Type</label>
                <select
                  value={followupForm.type}
                  onChange={(e) => setFollowupForm({ ...followupForm, type: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white rounded border border-slate-300"
                >
                  <option value="CALL">Phone Call</option>
                  <option value="MEETING">In-Person / Zoom Meeting</option>
                  <option value="EMAIL">Email Sent</option>
                  <option value="NOTES">Internal Discussion Note</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-800 mb-1">Activity Date & Time</label>
                <input
                  type="datetime-local"
                  value={followupForm.followup_date}
                  onChange={(e) => setFollowupForm({ ...followupForm, followup_date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-800 mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  value={followupForm.next_followup_date}
                  onChange={(e) => setFollowupForm({ ...followupForm, next_followup_date: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white rounded border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-800 mb-1">
                Discussion Minutes & Action Items <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Spoke with facilities manager, agreed on ₹18,000 package. Next visit scheduled."
                value={followupForm.notes}
                onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
                className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white rounded border border-slate-300"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" disabled={isActionSubmitting}>
                {isActionSubmitting ? 'Saving...' : 'Add Follow-up Entry'}
              </Button>
            </div>
          </form>

          {/* Timeline of Past Follow-ups */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-extrabold uppercase text-slate-900 tracking-wider">
              Recorded Follow-up History ({leadFollowups.length})
            </h5>

            {loadingFollowups ? (
              <div className="text-xs font-semibold text-slate-500 py-4 text-center">
                Loading activity history...
              </div>
            ) : leadFollowups.length === 0 ? (
              <div className="text-xs font-semibold text-slate-500 py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No follow-ups recorded yet for this lead. Log the first call above.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {leadFollowups.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase">
                          {item.type}
                        </span>
                        <span>{item.created_by_name || 'Sales Staff'}</span>
                      </div>
                      <span className="text-slate-500 text-[11px] font-mono">
                        {item.followup_date || item.created_at}
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium pl-1">{item.notes}</p>
                    {item.next_followup_date && (
                      <div className="text-[11px] font-bold text-amber-700 pl-1">
                        Next Touchpoint: {item.next_followup_date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* CONVERT TO BOOKING MODAL */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Lead to Confirmed Booking"
        size="md"
      >
        <form onSubmit={handleConvertLead} className="space-y-4 pt-1">
          <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-950 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>
              1-Click Conversion: Automatically provisions an official customer record and work order booking in VERTEX Operations.
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="font-bold text-slate-900">Prospect: {activeLead?.customer_name}</div>
            <div className="text-slate-600">Phone: {activeLead?.customer_phone}</div>
            <div className="text-slate-600">
              Service: {activeLead?.service_category} • Estimated: ₹{activeLead?.estimated_value}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
              Service Execution Address <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={convertForm.address}
              onChange={(e) => setConvertForm({ ...convertForm, address: e.target.value })}
              className="w-full px-3.5 py-2 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Target Service Date
              </label>
              <input
                type="date"
                required
                value={convertForm.scheduled_date}
                onChange={(e) => setConvertForm({ ...convertForm, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Preferred Slot
              </label>
              <select
                value={convertForm.scheduled_slot}
                onChange={(e) => setConvertForm({ ...convertForm, scheduled_slot: e.target.value })}
                className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300"
              >
                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConvertModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isActionSubmitting}>
              {isActionSubmitting ? 'Converting...' : 'Confirm & Create Booking'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
