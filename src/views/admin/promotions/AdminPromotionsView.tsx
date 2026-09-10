import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import {
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  Power,
  Copy,
  Check,
  Percent,
  DollarSign,
  Calendar,
  Layers,
  Users,
  Shield,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';

export interface Promotion {
  id: string;
  name: string;
  code: string;
  description: string | null;
  promotion_type: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_order_value: number;
  max_discount?: number | null;
  start_date?: string | null;
  start_time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  applicable_categories?: string[] | string | null;
  applicable_services?: string[] | string | null;
  customer_segment?: string;
  usage_limit: number;
  usage_count: number;
  per_customer_limit: number;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'ARCHIVED';
  terms_and_conditions?: string | null;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

const CATEGORY_OPTIONS = [
  'All',
  'AC & Cooling',
  'Electrical',
  'Plumbing',
  'AMC',
  'Repairs',
  'Home Appliance',
  'Cleaning',
];

const SEGMENT_OPTIONS = [
  { value: 'ALL', label: 'All Customers' },
  { value: 'NEW', label: 'First-time / New Customers Only' },
  { value: 'RETURNING', label: 'Returning Customers' },
  { value: 'VIP', label: 'VIP / High Value Accounts' },
];

export const AdminPromotionsView: React.FC = () => {
  const { user, canPerformAction, hasPermission } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Permissions calculation with SUPER_ADMIN full override
  const canView = isSuperAdmin || hasPermission('PROMOTION_VIEW') || hasPermission('OFFER_VIEW');
  const canCreate =
    isSuperAdmin ||
    canPerformAction('PROMOTION_CREATE') ||
    hasPermission('PROMOTION_CREATE') ||
    hasPermission('PROMOTION_MANAGE') ||
    hasPermission('OFFER_CREATE');
  const canEdit =
    isSuperAdmin ||
    canPerformAction('PROMOTION_EDIT') ||
    hasPermission('PROMOTION_EDIT') ||
    hasPermission('PROMOTION_MANAGE') ||
    hasPermission('OFFER_EDIT');
  const canDelete =
    isSuperAdmin ||
    canPerformAction('PROMOTION_DELETE') ||
    hasPermission('PROMOTION_DELETE') ||
    hasPermission('PROMOTION_MANAGE') ||
    hasPermission('OFFER_DELETE');
  const canActivate =
    isSuperAdmin ||
    canPerformAction('PROMOTION_ACTIVATE') ||
    hasPermission('PROMOTION_ACTIVATE') ||
    canEdit;
  const canDeactivate =
    isSuperAdmin ||
    canPerformAction('PROMOTION_DEACTIVATE') ||
    hasPermission('PROMOTION_DEACTIVATE') ||
    canEdit;

  // Component states
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPromotionType, setFormPromotionType] = useState('PERCENTAGE');
  const [formDiscountType, setFormDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [formDiscountValue, setFormDiscountValue] = useState<number | ''>(20);
  const [formMinOrderValue, setFormMinOrderValue] = useState<number | ''>(499);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | ''>(300);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [formCategories, setFormCategories] = useState<string[]>(['All']);
  const [formCustomerSegment, setFormCustomerSegment] = useState('ALL');
  const [formUsageLimit, setFormUsageLimit] = useState<number | ''>(500);
  const [formPerCustomerLimit, setFormPerCustomerLimit] = useState<number | ''>(1);
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE' | 'DRAFT'>('ACTIVE');
  const [formTerms, setFormTerms] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Auto-dismiss toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Fetch promotions list from API
  const fetchPromotions = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.getPromotions({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        search: searchTerm.trim() || undefined,
      });

      if (res && res.data) {
        setPromotions(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load promotions and offers.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [statusFilter, typeFilter]);

  // Handle Copy Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Open Create Form
  const handleOpenCreateModal = () => {
    setEditingPromotion(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormPromotionType('PERCENTAGE');
    setFormDiscountType('PERCENTAGE');
    setFormDiscountValue(20);
    setFormMinOrderValue(499);
    setFormMaxDiscount(300);
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
    setFormCategories(['All']);
    setFormCustomerSegment('ALL');
    setFormUsageLimit(500);
    setFormPerCustomerLimit(1);
    setFormStatus('ACTIVE');
    setFormTerms('Standard terms and conditions apply. Not combinable with other voucher codes.');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditModal = (promo: Promotion) => {
    setEditingPromotion(promo);
    setFormName(promo.name);
    setFormCode(promo.code);
    setFormDescription(promo.description || '');
    setFormPromotionType(promo.promotion_type || 'PERCENTAGE');
    setFormDiscountType(promo.discount_type || 'PERCENTAGE');
    setFormDiscountValue(promo.discount_value || 0);
    setFormMinOrderValue(promo.min_order_value || 0);
    setFormMaxDiscount(promo.max_discount || '');
    setFormStartDate(promo.start_date || new Date().toISOString().split('T')[0]);
    setFormEndDate(
      promo.end_date || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    );
    const cats = Array.isArray(promo.applicable_categories)
      ? promo.applicable_categories
      : typeof promo.applicable_categories === 'string'
      ? [promo.applicable_categories]
      : ['All'];
    setFormCategories(cats);
    setFormCustomerSegment(promo.customer_segment || 'ALL');
    setFormUsageLimit(promo.usage_limit || 1000);
    setFormPerCustomerLimit(promo.per_customer_limit || 1);
    setFormStatus(
      promo.status === 'ACTIVE' || promo.status === 'INACTIVE' || promo.status === 'DRAFT'
        ? promo.status
        : 'ACTIVE'
    );
    setFormTerms(promo.terms_and_conditions || '');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Generate a random voucher code
  const handleGenerateCode = () => {
    const prefixes = ['VERTEX', 'DEAL', 'SAVE', 'FLASH', 'CARE', 'COOL'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    const val = typeof formDiscountValue === 'number' && formDiscountValue > 0 ? formDiscountValue : randomNum;
    setFormCode(`${randomPrefix}${val}`);
  };

  // Toggle category pill in form
  const toggleCategory = (cat: string) => {
    if (cat === 'All') {
      setFormCategories(['All']);
      return;
    }
    const filtered = formCategories.filter((c) => c !== 'All');
    if (filtered.includes(cat)) {
      const next = filtered.filter((c) => c !== cat);
      setFormCategories(next.length > 0 ? next : ['All']);
    } else {
      setFormCategories([...filtered, cat]);
    }
  };

  // Submit Form (Create or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formName.trim()) {
      errors.name = 'Promotion name is required';
    }
    if (!formCode.trim()) {
      errors.code = 'Coupon code is required';
    } else if (formCode.trim().length < 3) {
      errors.code = 'Code must be at least 3 characters';
    }

    if (formDiscountValue === '' || Number(formDiscountValue) <= 0) {
      errors.discountValue = 'Discount value must be greater than 0';
    } else if (formDiscountType === 'PERCENTAGE' && (Number(formDiscountValue) < 1 || Number(formDiscountValue) > 100)) {
      errors.discountValue = 'Percentage discount must be between 1% and 100%';
    }

    if (formStartDate && formEndDate && new Date(formEndDate) < new Date(formStartDate)) {
      errors.endDate = 'End date cannot be earlier than start date';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        name: formName.trim(),
        code: formCode.toUpperCase().trim(),
        description: formDescription.trim() || null,
        promotion_type: formPromotionType,
        discount_type: formDiscountType,
        discount_value: Number(formDiscountValue),
        min_order_value: formMinOrderValue === '' ? 0 : Number(formMinOrderValue),
        max_discount: formMaxDiscount === '' ? null : Number(formMaxDiscount),
        start_date: formStartDate,
        end_date: formEndDate,
        applicable_categories: formCategories,
        applicable_services: ['All Services'],
        customer_segment: formCustomerSegment,
        usage_limit: formUsageLimit === '' ? 1000 : Number(formUsageLimit),
        per_customer_limit: formPerCustomerLimit === '' ? 1 : Number(formPerCustomerLimit),
        status: formStatus,
        terms_and_conditions: formTerms.trim() || null,
      };

      if (editingPromotion) {
        const res = await api.updatePromotion(editingPromotion.id, payload);
        setSuccessToast(`Promotion "${res.data.name}" (${res.data.code}) updated successfully`);
      } else {
        const res = await api.createPromotion(payload);
        setSuccessToast(`Promotion "${res.data.name}" (${res.data.code}) created successfully`);
      }

      setIsFormModalOpen(false);
      fetchPromotions(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed. Please verify inputs.';
      setFormErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (promo: Promotion) => {
    const nextStatus = promo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updatePromotionStatus(promo.id, nextStatus);
      setSuccessToast(`Promotion "${promo.code}" is now ${nextStatus}`);
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, status: nextStatus, updated_at: new Date().toISOString() } : p))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update promotion status.';
      setError(msg);
    }
  };

  // Confirm Delete
  const handleDelete = async () => {
    if (!promotionToDelete) return;
    setIsDeleting(true);
    try {
      await api.deletePromotion(promotionToDelete.id);
      setSuccessToast(`Promotion "${promotionToDelete.code}" deleted successfully`);
      setPromotions((prev) => prev.filter((p) => p.id !== promotionToDelete.id));
      setPromotionToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete promotion.';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered promotions in memory
  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const matchesSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || p.status.toUpperCase() === statusFilter.toUpperCase();

      const matchesType =
        typeFilter === 'ALL' || p.promotion_type.toUpperCase() === typeFilter.toUpperCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [promotions, searchTerm, statusFilter, typeFilter]);

  // Aggregate KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = promotions.length;
    const activeCount = promotions.filter((p) => p.status === 'ACTIVE').length;
    const totalRedemptions = promotions.reduce((acc, p) => acc + (p.usage_count || 0), 0);
    const totalDiscountsDistributed = promotions.reduce((acc, p) => {
      const avg = p.discount_type === 'FIXED' ? p.discount_value : (p.max_discount || 250);
      return acc + (p.usage_count || 0) * avg;
    }, 0);

    return { totalCount, activeCount, totalRedemptions, totalDiscountsDistributed };
  }, [promotions]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow-lg border border-emerald-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Promotions & Marketing Offers
            </h1>
            <Badge variant={isSuperAdmin ? 'danger' : 'neutral'} size="sm">
              {user?.role} Clearance
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, schedule, and manage platform discount coupons, AMC vouchers, and seasonal customer campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchPromotions(true)}
            disabled={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          {canCreate ? (
            <Button
              size="sm"
              variant="primary"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Promotion
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-500 border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Read-Only ({user?.role})</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Campaigns</span>
            <Tag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{metrics.totalCount} Codes</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all service categories</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Active Live Offers</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{metrics.activeCount} Active</div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for customer booking checkout</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Redemptions</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">{metrics.totalRedemptions.toLocaleString()} Uses</div>
          <div className="text-[11px] text-slate-500 mt-1">Total consumer bookings availed</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Discounts Distributed</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            ₹{metrics.totalDiscountsDistributed.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Customer savings generated</div>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by promo code (e.g. VERTEXFIRST), campaign name, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive / Paused</option>
            <option value="DRAFT">Draft</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">All Promotion Types</option>
            <option value="PERCENTAGE">Percentage Discount</option>
            <option value="FIXED_AMOUNT">Fixed Flat Discount</option>
            <option value="CATEGORY_SPECIFIC">Category Specific</option>
            <option value="AMC">AMC Special</option>
            <option value="SEASONAL">Seasonal Offer</option>
            <option value="CAMPAIGN">Campaign Flash Deal</option>
          </select>
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => fetchPromotions()} className="text-xs h-7">
            Retry
          </Button>
        </div>
      )}

      {/* Promotions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="font-bold text-slate-700">Coupon Code</TableHead>
              <TableHead className="font-bold text-slate-700">Campaign & Description</TableHead>
              <TableHead className="font-bold text-slate-700">Discount Value</TableHead>
              <TableHead className="font-bold text-slate-700">Min Order Value</TableHead>
              <TableHead className="font-bold text-slate-700">Usage / Cap</TableHead>
              <TableHead className="font-bold text-slate-700">Validity Period</TableHead>
              <TableHead className="font-bold text-slate-700">Status</TableHead>
              <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                  Loading marketing promotions...
                </TableCell>
              </TableRow>
            ) : filteredPromotions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <div className="font-bold text-slate-700 text-sm">No promotions found</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                      ? 'Try clearing search keywords or status filters.'
                      : 'Create your first promotional discount voucher above.'}
                  </div>
                  {canCreate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleOpenCreateModal}
                      className="mt-3 text-xs"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Create Promotion
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredPromotions.map((promo) => {
                const isCopied = copiedCode === promo.code;
                const isPercentage = promo.discount_type === 'PERCENTAGE';
                const usagePercent =
                  promo.usage_limit > 0
                    ? Math.min(100, Math.round((promo.usage_count / promo.usage_limit) * 100))
                    : 0;

                return (
                  <TableRow key={promo.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Coupon Code Column */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md select-all">
                          {promo.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(promo.code)}
                          title="Copy promo code"
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* Campaign Name & Details */}
                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs">{promo.name}</div>
                      {promo.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {promo.description}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {Array.isArray(promo.applicable_categories) ? (
                          promo.applicable_categories.slice(0, 2).map((c, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {promo.applicable_categories || 'All Categories'}
                          </span>
                        )}
                        {promo.customer_segment && promo.customer_segment !== 'ALL' && (
                          <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                            {promo.customer_segment}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Discount Value */}
                    <TableCell>
                      <div className="font-black text-emerald-600 text-xs flex items-center gap-1">
                        {isPercentage ? (
                          <>
                            <span>{promo.discount_value}% OFF</span>
                            {promo.max_discount && (
                              <span className="text-[10px] text-slate-500 font-normal">
                                (Max ₹{promo.max_discount})
                              </span>
                            )}
                          </>
                        ) : (
                          <span>Flat ₹{promo.discount_value} OFF</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {promo.discount_type.toLowerCase()} discount
                      </div>
                    </TableCell>

                    {/* Min Order Value */}
                    <TableCell>
                      <span className="font-semibold text-slate-800 text-xs">
                        {promo.min_order_value > 0 ? `₹${promo.min_order_value}` : 'No Min Order'}
                      </span>
                    </TableCell>

                    {/* Usage / Progress */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-700">
                          {promo.usage_count} / {promo.usage_limit}
                        </span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all ${
                            usagePercent >= 90
                              ? 'bg-rose-500'
                              : usagePercent >= 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </TableCell>

                    {/* Validity Period */}
                    <TableCell>
                      <div className="text-xs text-slate-700 font-medium">
                        {promo.end_date ? new Date(promo.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ongoing'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {promo.start_date ? `From ${new Date(promo.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : 'Immediate'}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant={
                          promo.status === 'ACTIVE'
                            ? 'success'
                            : promo.status === 'INACTIVE'
                            ? 'neutral'
                            : promo.status === 'EXPIRED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {promo.status}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Activate / Deactivate Toggle Button */}
                        {(canActivate || canDeactivate) && (
                          <Button
                            size="sm"
                            variant={promo.status === 'ACTIVE' ? 'outline' : 'primary'}
                            onClick={() => handleToggleStatus(promo)}
                            className="text-xs h-7 px-2.5"
                            title={promo.status === 'ACTIVE' ? 'Deactivate campaign' : 'Activate campaign'}
                          >
                            <Power className="w-3 h-3 mr-1" />
                            {promo.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                          </Button>
                        )}

                        {/* Edit Button */}
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditModal(promo)}
                            className="text-xs h-7 w-7 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            title="Edit promotion details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Delete Button */}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPromotionToDelete(promo)}
                            className="text-xs h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete promotion"
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

      {/* CREATE / EDIT PROMOTION MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingPromotion ? `Edit Promotion: ${editingPromotion.code}` : 'Create New Promotion & Offer'}
        description="Configure discount rules, coupon code, minimum order values, and customer eligibility."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {formErrors.submit && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formErrors.submit}</span>
            </div>
          )}

          {/* Row 1: Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Campaign Name <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. Summer AC Power Jet Festival"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-xs"
              />
              {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Coupon Code <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Generate
                </button>
              </div>
              <Input
                placeholder="e.g. SUMMERCOOL20"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                className="text-xs font-mono uppercase tracking-wider font-bold"
              />
              {formErrors.code && <p className="text-[11px] text-rose-500 mt-1">{formErrors.code}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Short Description / Subtitle
            </label>
            <Input
              placeholder="e.g. 20% OFF on all AC foam jet cleaning and repairs above ₹799"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Row 2: Discount Type & Value & Max Discount */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white border border-slate-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setFormDiscountType('PERCENTAGE');
                      setFormPromotionType('PERCENTAGE');
                    }}
                    className={`py-1 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      formDiscountType === 'PERCENTAGE'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Percent className="w-3 h-3" /> Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormDiscountType('FIXED');
                      setFormPromotionType('FIXED_AMOUNT');
                    }}
                    className={`py-1 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      formDiscountType === 'FIXED'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="w-3 h-3" /> Flat ₹
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discount Value ({formDiscountType === 'PERCENTAGE' ? '%' : '₹'}) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max={formDiscountType === 'PERCENTAGE' ? '100' : undefined}
                  value={formDiscountValue}
                  onChange={(e) => setFormDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={formDiscountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 250'}
                  className="text-xs font-bold"
                />
                {formErrors.discountValue && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.discountValue}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Min Booking Value (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formMinOrderValue}
                  onChange={(e) => setFormMinOrderValue(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 499"
                  className="text-xs"
                />
              </div>
            </div>

            {formDiscountType === 'PERCENTAGE' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maximum Discount Cap (₹)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formMaxDiscount}
                  onChange={(e) => setFormMaxDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 300 (leave empty for unlimited percentage discount)"
                  className="text-xs"
                />
                <span className="text-[10px] text-slate-400">
                  Caps percentage discount so high-value bookings don't exceed margin threshold.
                </span>
              </div>
            )}
          </div>

          {/* Row 3: Validity Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <Input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
              <Input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="text-xs"
              />
              {formErrors.endDate && <p className="text-[11px] text-rose-500 mt-1">{formErrors.endDate}</p>}
            </div>
          </div>

          {/* Row 4: Applicable Categories */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Applicable Service Categories
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = formCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 5: Customer Segment & Usage Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Segment</label>
              <select
                value={formCustomerSegment}
                onChange={(e) => setFormCustomerSegment(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              >
                {SEGMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Usage Limit</label>
              <Input
                type="number"
                min="1"
                value={formUsageLimit}
                onChange={(e) => setFormUsageLimit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 500"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Per-Customer Limit</label>
              <Input
                type="number"
                min="1"
                value={formPerCustomerLimit}
                onChange={(e) => setFormPerCustomerLimit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 1"
                className="text-xs"
              />
            </div>
          </div>

          {/* Status radio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={formStatus === 'ACTIVE'}
                  onChange={() => setFormStatus('ACTIVE')}
                  className="text-slate-900"
                />
                <span>Active (Live immediately)</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={formStatus === 'INACTIVE'}
                  onChange={() => setFormStatus('INACTIVE')}
                  className="text-slate-900"
                />
                <span>Inactive (Paused)</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={formStatus === 'DRAFT'}
                  onChange={() => setFormStatus('DRAFT')}
                  className="text-slate-900"
                />
                <span>Draft</span>
              </label>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Terms & Conditions</label>
            <textarea
              rows={2}
              value={formTerms}
              onChange={(e) => setFormTerms(e.target.value)}
              placeholder="e.g. Valid only once per household. Not applicable on emergency spare parts."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-normal focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              leftIcon={isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
            >
              {isSubmitting
                ? 'Saving...'
                : editingPromotion
                ? 'Save Changes'
                : 'Publish Promotion'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={Boolean(promotionToDelete)}
        onClose={() => setPromotionToDelete(null)}
        title="Delete Promotion & Offer"
        description="Are you sure you want to delete this promotional offer?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Promotion: {promotionToDelete?.code} ({promotionToDelete?.name})
            </div>
            <p className="text-[11px] text-amber-700">
              Deleting this coupon will immediately prevent new customers from applying it. Historical booking logs and audit trails will remain safely preserved.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPromotionToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              leftIcon={isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            >
              {isDeleting ? 'Deleting...' : 'Delete Promotion'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
