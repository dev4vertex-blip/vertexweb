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

  // Create Form State
  const [createForm, setCreateForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    city_name: 'Delhi NCR',
    service_category: 'AC Service & Repair',
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

  useEffect(() => {
    fetchLeads();
    fetchSalesUsers();
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        !searchTerm.trim() ||
        lead.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.customer_phone?.includes(searchTerm) ||
        lead.lead_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.service_requirement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    setIsActionSubmitting(true);
    try {
      const payload = {
        customer_name: createForm.customer_name.trim(),
        customer_phone: cleanPhone,
        customer_email: createForm.customer_email.trim() || undefined,
        city_name: createForm.city_name,
        service_category: createForm.service_category,
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
        service_category: 'AC Service & Repair',
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
      const payload = {
        customer_name: editForm.customer_name.trim(),
        customer_phone: editForm.customer_phone.replace(/\D/g, ''),
        customer_email: editForm.customer_email.trim() || undefined,
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
      {/* Top Header & Prominent "+ Generate Lead" Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Sales CRM & Lead Pipeline</h1>
              <p className="text-xs font-semibold text-slate-600">
                Generate, qualify, assign, follow up, and convert enterprise & residential leads.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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

          {/* Prominent Lead Generation Trigger */}
          {canCreate ? (
            <button
              type="button"
              id="btn-generate-lead"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4.5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Generate Lead</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Generate Lead (Locked for {user?.role})</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4.5 border-slate-200 shadow-xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Total Pipeline</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.total} Leads</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">
            Total Value: <span className="font-bold text-slate-900">₹{stats.pipelineValue.toLocaleString('en-IN')}</span>
          </div>
        </Card>

        <Card className="p-4.5 border-slate-200 shadow-xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Active Deals</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{stats.inProgressCount} Open</div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">Under negotiation & proposals</div>
        </Card>

        <Card className="p-4.5 border-slate-200 shadow-xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Converted & Won</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">{stats.wonCount} Deals</div>
          <div className="text-xs font-bold text-emerald-700 mt-0.5">
            ₹{stats.wonValue.toLocaleString('en-IN')} Realized Revenue
          </div>
        </Card>

        <Card className="p-4.5 border-slate-200 shadow-xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Win Rate</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-900 mt-2">
            {stats.total > 0 ? `${Math.round((stats.wonCount / stats.total) * 100)}%` : '0%'}
          </div>
          <div className="text-xs font-semibold text-slate-600 mt-0.5">Conversion from qualified leads</div>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by prospect name, phone number, lead #, or requirement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm font-semibold text-slate-900 bg-white placeholder:text-slate-500 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-600" />
              <span>Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'ALL', label: 'All Leads' },
            { key: 'NEW', label: 'New Inbound' },
            { key: 'CONTACTED', label: 'Contacted' },
            { key: 'IN_PROGRESS', label: 'In Progress' },
            { key: 'QUALIFIED', label: 'Qualified' },
            { key: 'PROPOSAL_SENT', label: 'Proposal Sent' },
            { key: 'WON', label: 'Won / Converted' },
            { key: 'LOST', label: 'Lost' },
          ].map((statusTab) => {
            const count =
              statusTab.key === 'ALL'
                ? leads.length
                : leads.filter((l) => l.status === statusTab.key).length;
            const isSelected = selectedStatus === statusTab.key;
            return (
              <button
                key={statusTab.key}
                type="button"
                onClick={() => setSelectedStatus(statusTab.key)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{statusTab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-800'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="font-extrabold text-slate-900">Lead Info</TableHead>
                <TableHead className="font-extrabold text-slate-900">Prospect & Contact</TableHead>
                <TableHead className="font-extrabold text-slate-900">Service Requirement</TableHead>
                <TableHead className="font-extrabold text-slate-900">Deal Value</TableHead>
                <TableHead className="font-extrabold text-slate-900">Sales Owner</TableHead>
                <TableHead className="font-extrabold text-slate-900">Status</TableHead>
                <TableHead className="font-extrabold text-slate-900 text-right">Workflow Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const isWon = lead.status === 'WON';
                const isLost = lead.status === 'LOST';

                return (
                  <TableRow key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell>
                      <div className="font-mono font-bold text-xs text-indigo-700">
                        {lead.lead_number}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{lead.city_name || 'National'}</span>
                      </div>
                      <div className="mt-1">
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
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-slate-900 text-sm">{lead.customer_name}</div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span className="font-mono">{lead.customer_phone}</span>
                      </div>
                      {lead.customer_email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{lead.customer_email}</span>
                        </div>
                      )}
                      <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                        Source: {lead.source || 'Website'}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <div className="font-bold text-slate-900 text-xs">
                        {lead.service_category || 'General Service'}
                      </div>
                      <div className="text-xs text-slate-700 line-clamp-2 mt-0.5 font-medium">
                        {lead.service_requirement || lead.notes || 'No specific requirement specified.'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-black text-slate-900 text-sm">
                        ₹{(Number(lead.estimated_value) || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Estimated</div>
                    </TableCell>

                    <TableCell>
                      {canAssign ? (
                        <select
                          value={lead.assigned_to_user_id || ''}
                          onChange={(e) => handleQuickAssign(lead.id, e.target.value)}
                          className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded px-2 py-1 max-w-[140px] focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                        >
                          <option value="">Unassigned</option>
                          {salesUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs font-bold text-slate-800">
                          {lead.assigned_to_name || 'Unassigned'}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <select
                        value={lead.status}
                        disabled={!canEdit}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className={`text-xs font-black rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none ${
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
                    </TableCell>

                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

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
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-900 mb-1">
                Service Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={createForm.service_category}
                onChange={(e) => setCreateForm({ ...createForm, service_category: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="AC Service & Repair">AC Service & Repair (HVAC)</option>
                <option value="Commercial AMC">Commercial AMC & Facility Contract</option>
                <option value="Electrician Services">Full Home Electrician Audit</option>
                <option value="Plumbing Solutions">Plumbing & Concealed Leakages</option>
                <option value="Water Purifier (RO)">Water Purifier (RO) Contract</option>
                <option value="Carpentry & Assembly">Carpentry & Office Assembly</option>
              </select>
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
