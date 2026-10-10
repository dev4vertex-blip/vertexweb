import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../components/ui/Table';
import {
  OperationsPageHeader,
  OperationsKpiGrid,
  OperationsKpiCard,
  OperationsToolbar,
  OperationsCard,
} from '../components/OperationsDeskLayout';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import {
  Tag,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Power,
  Copy,
  Check,
  Percent,
  DollarSign,
  Users,
  RefreshCw,
  Sparkles,
  Lock,
  Layers,
  Wrench,
  Calendar,
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

interface ServiceCategoryItem {
  id: number;
  name: string;
  slug: string;
  status?: string;
}

interface ServiceItem {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  is_active?: boolean;
  status?: string;
}

const SEGMENT_OPTIONS = [
  { value: 'ALL', label: 'All Customers' },
  { value: 'NEW', label: 'First-time / New Customers Only' },
  { value: 'RETURNING', label: 'Returning Customers' },
  { value: 'VIP', label: 'VIP / High Value Accounts' },
];

const PROMOTION_TYPE_OPTIONS = [
  { value: 'PERCENTAGE', label: 'Percentage Discount' },
  { value: 'FIXED_AMOUNT', label: 'Fixed Flat Discount' },
  { value: 'CATEGORY_SPECIFIC', label: 'Category Specific Offer' },
  { value: 'SERVICE_SPECIFIC', label: 'Service Specific Deal' },
  { value: 'AMC', label: 'AMC Special Voucher' },
  { value: 'SEASONAL', label: 'Seasonal / Flash Campaign' },
];

// Timezone-safe date formatting helper to prevent off-by-one UTC conversion defects
const formatDateDisplay = (dateStr?: string | null, includeYear = true): string => {
  if (!dateStr) return '';
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: includeYear ? 'numeric' : undefined,
    });
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const localDate = new Date(year, month, day);
  return localDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: includeYear ? 'numeric' : undefined,
  });
};

const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AdminPromotionsView: React.FC = () => {
  const { user, canPerformAction, hasPermission } = useAuth();
  const { addToast } = useApp();
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

  // Promotions State
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Categories & Services from Backend (No Hardcoding)
  const [categories, setCategories] = useState<ServiceCategoryItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingDependencies, setLoadingDependencies] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

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
  const [formStartDate, setFormStartDate] = useState(getLocalDateString());
  const [formEndDate, setFormEndDate] = useState(
    getLocalDateString(new Date(Date.now() + 90 * 86400000))
  );
  const [formSelectedCategory, setFormSelectedCategory] = useState<string>('All');
  const [formSelectedService, setFormSelectedService] = useState<string>('All');
  const [formCustomerSegment, setFormCustomerSegment] = useState('ALL');
  const [formUsageLimit, setFormUsageLimit] = useState<number | ''>(500);
  const [formPerCustomerLimit, setFormPerCustomerLimit] = useState<number | ''>(1);
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE' | 'DRAFT'>('ACTIVE');
  const [formTerms, setFormTerms] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch live active categories & services from backend
  const fetchLiveDependencies = useCallback(async () => {
    setLoadingDependencies(true);
    try {
      const [catRes, srvList] = await Promise.all([
        api.getServiceCategories({ status: 'ACTIVE' }).catch(() => ({ success: false, data: [] })),
        api.getServices({ active: true }).catch(() => []),
      ]);

      if (catRes && catRes.data && Array.isArray(catRes.data)) {
        setCategories(catRes.data.filter((c: ServiceCategoryItem) => !c.status || c.status === 'ACTIVE'));
      }
      if (Array.isArray(srvList)) {
        setServices(srvList.filter((s: ServiceItem) => s.is_active !== false && s.status !== 'INACTIVE'));
      }
    } catch {
      // Non-blocking for promotion viewing, handles gracefully
    } finally {
      setLoadingDependencies(false);
    }
  }, []);

  // Fetch promotions list from API
  const fetchPromotions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.getPromotions({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: searchTerm.trim() || undefined,
      });

      if (res && res.data && Array.isArray(res.data)) {
        setPromotions(res.data);
      } else {
        setPromotions([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load promotions and marketing offers.';
      setError(msg);
      setPromotions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, typeFilter, categoryFilter, searchTerm]);

  // Load initial data
  useEffect(() => {
    fetchLiveDependencies();
    fetchPromotions();
  }, [fetchLiveDependencies, fetchPromotions]);

  // Event listener for category or promotion state updates across views
  useEffect(() => {
    const handleCategoryUpdate = () => {
      fetchLiveDependencies();
    };
    const handlePromoUpdate = () => {
      fetchPromotions(true);
    };

    window.addEventListener('vertex:categories-updated', handleCategoryUpdate);
    window.addEventListener('vertex:promotions-updated', handlePromoUpdate);

    return () => {
      window.removeEventListener('vertex:categories-updated', handleCategoryUpdate);
      window.removeEventListener('vertex:promotions-updated', handlePromoUpdate);
    };
  }, [fetchLiveDependencies, fetchPromotions]);

  // Filtered services based on currently selected category in modal
  const selectableServices = useMemo(() => {
    if (formSelectedCategory === 'All') {
      return services;
    }
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === formSelectedCategory.toLowerCase() || String(c.id) === formSelectedCategory
    );
    if (!matchedCategory) return services;
    return services.filter((s) => s.category_id === matchedCategory.id);
  }, [formSelectedCategory, categories, services]);

  // Handle Copy Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast('Coupon Copied', `Code ${code} copied to clipboard`, 'info');
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
    setFormStartDate(getLocalDateString());
    setFormEndDate(getLocalDateString(new Date(Date.now() + 90 * 86400000)));
    setFormSelectedCategory('All');
    setFormSelectedService('All');
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
    setFormName(promo.name || '');
    setFormCode(promo.code || '');
    setFormDescription(promo.description || '');
    setFormPromotionType(promo.promotion_type || 'PERCENTAGE');
    setFormDiscountType(promo.discount_type || 'PERCENTAGE');
    setFormDiscountValue(promo.discount_value !== undefined ? promo.discount_value : 0);
    setFormMinOrderValue(promo.min_order_value !== undefined ? promo.min_order_value : 0);
    setFormMaxDiscount(promo.max_discount !== undefined && promo.max_discount !== null ? promo.max_discount : '');
    setFormStartDate(promo.start_date ? promo.start_date.split('T')[0] : getLocalDateString());
    setFormEndDate(
      promo.end_date ? promo.end_date.split('T')[0] : getLocalDateString(new Date(Date.now() + 90 * 86400000))
    );

    // Categories
    const promoCat = Array.isArray(promo.applicable_categories)
      ? promo.applicable_categories[0] || 'All'
      : promo.applicable_categories || 'All';
    setFormSelectedCategory(promoCat);

    // Services
    const promoSrv = Array.isArray(promo.applicable_services)
      ? promo.applicable_services[0] || 'All'
      : promo.applicable_services || 'All';
    setFormSelectedService(promoSrv);

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

  // Generate random voucher code
  const handleGenerateCode = () => {
    const prefixes = ['VERTEX', 'DEAL', 'SAVE', 'FLASH', 'CARE', 'COOL', 'OFFER'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const val = typeof formDiscountValue === 'number' && formDiscountValue > 0 ? formDiscountValue : 25;
    const randomCode = `${randomPrefix}${val}`;
    setFormCode(randomCode);
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.code;
      return next;
    });
  };

  // Handle Category Change in Form
  const handleCategoryChange = (newCategoryName: string) => {
    setFormSelectedCategory(newCategoryName);
    // Reset service if current service does not belong to new category
    if (newCategoryName !== 'All' && formSelectedService !== 'All') {
      const activeCat = categories.find((c) => c.name.toLowerCase() === newCategoryName.toLowerCase());
      if (activeCat) {
        const srv = services.find((s) => s.name.toLowerCase() === formSelectedService.toLowerCase());
        if (srv && srv.category_id !== activeCat.id) {
          setFormSelectedService('All');
        }
      }
    }
  };

  // Handle Service Change in Form
  const handleServiceChange = (newServiceName: string) => {
    setFormSelectedService(newServiceName);
    if (newServiceName !== 'All') {
      const srv = services.find((s) => s.name.toLowerCase() === newServiceName.toLowerCase());
      if (srv) {
        const cat = categories.find((c) => c.id === srv.category_id);
        if (cat) {
          setFormSelectedCategory(cat.name);
        }
      }
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

    const numVal = Number(formDiscountValue);
    if (formDiscountValue === '' || isNaN(numVal) || numVal <= 0) {
      errors.discountValue = 'Discount value must be greater than 0';
    } else if (formDiscountType === 'PERCENTAGE' && (numVal < 1 || numVal > 100)) {
      errors.discountValue = 'Percentage discount must be between 1% and 100%';
    }

    if (formStartDate && formEndDate && formEndDate < formStartDate) {
      errors.endDate = 'End date cannot be earlier than start date';
    }

    // Relationship check
    if (formSelectedCategory !== 'All' && formSelectedService !== 'All') {
      const cat = categories.find((c) => c.name.toLowerCase() === formSelectedCategory.toLowerCase());
      const srv = services.find((s) => s.name.toLowerCase() === formSelectedService.toLowerCase());
      if (cat && srv && srv.category_id !== cat.id) {
        errors.service = `Service "${srv.name}" does not belong to category "${cat.name}".`;
      }
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
        max_discount: formDiscountType === 'PERCENTAGE' && formMaxDiscount !== '' ? Number(formMaxDiscount) : null,
        start_date: formStartDate || null,
        end_date: formEndDate || null,
        applicable_categories: formSelectedCategory === 'All' ? ['All'] : [formSelectedCategory],
        applicable_services: formSelectedService === 'All' ? ['All Services'] : [formSelectedService],
        customer_segment: formCustomerSegment,
        usage_limit: formUsageLimit === '' ? 1000 : Number(formUsageLimit),
        per_customer_limit: formPerCustomerLimit === '' ? 1 : Number(formPerCustomerLimit),
        status: formStatus,
        terms_and_conditions: formTerms.trim() || null,
      };

      if (editingPromotion) {
        const res = await api.updatePromotion(editingPromotion.id, payload);
        addToast(
          'Promotion Updated',
          `Promotion "${res.data?.name || payload.name}" (${payload.code}) saved successfully.`,
          'success'
        );
      } else {
        const res = await api.createPromotion(payload);
        addToast(
          'Promotion Created',
          `Promotion "${res.data?.name || payload.name}" (${payload.code}) published successfully.`,
          'success'
        );
      }

      setIsFormModalOpen(false);
      window.dispatchEvent(new CustomEvent('vertex:promotions-updated'));
      fetchPromotions(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed. Please verify inputs.';
      if (msg.includes('already exists') || msg.includes('unique') || msg.includes('409')) {
        setFormErrors({ code: 'This coupon code already exists. Please choose a unique code.' });
        addToast('Duplicate Code Conflict', 'This coupon code already exists. Please choose a unique code.', 'error');
      } else {
        setFormErrors({ submit: msg });
        addToast('Validation Error', msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (promo: Promotion) => {
    const nextStatus = promo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    // Optimistic UI update
    setPromotions((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, status: nextStatus, updated_at: new Date().toISOString() } : p))
    );

    try {
      await api.updatePromotionStatus(promo.id, nextStatus);
      addToast(
        'Status Updated',
        `Promotion "${promo.code}" is now ${nextStatus === 'ACTIVE' ? 'Active & Live' : 'Paused / Inactive'}.`,
        'success'
      );
      window.dispatchEvent(new CustomEvent('vertex:promotions-updated'));
    } catch (err: unknown) {
      // Rollback on error
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, status: promo.status } : p))
      );
      const msg = err instanceof Error ? err.message : 'Failed to update promotion status.';
      addToast('Status Update Failed', msg, 'error');
      setError(msg);
    }
  };

  // Confirm Delete
  const handleDelete = async () => {
    if (!promotionToDelete) return;
    setIsDeleting(true);
    try {
      await api.deletePromotion(promotionToDelete.id);
      addToast(
        'Promotion Deleted',
        `Promotion "${promotionToDelete.code}" deleted successfully. Historical records preserved.`,
        'success'
      );
      setPromotions((prev) => prev.filter((p) => p.id !== promotionToDelete.id));
      setPromotionToDelete(null);
      window.dispatchEvent(new CustomEvent('vertex:promotions-updated'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete promotion.';
      addToast('Deletion Failed', msg, 'error');
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // In-memory filtered list
  const filteredPromotions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const today = getLocalDateString();

    return promotions.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term));

      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'EXPIRED') {
          matchesStatus = p.status === 'EXPIRED' || (Boolean(p.end_date) && Boolean(p.end_date!.split('T')[0] < today));
        } else {
          matchesStatus = p.status.toUpperCase() === statusFilter.toUpperCase();
        }
      }

      const matchesType =
        typeFilter === 'ALL' || p.promotion_type.toUpperCase() === typeFilter.toUpperCase();

      let matchesCategory = true;
      if (categoryFilter !== 'ALL') {
        const catStr = categoryFilter.toLowerCase();
        if (Array.isArray(p.applicable_categories)) {
          matchesCategory = p.applicable_categories.some(
            (c) => c.toLowerCase() === 'all' || c.toLowerCase().includes(catStr)
          );
        } else if (p.applicable_categories) {
          matchesCategory =
            String(p.applicable_categories).toLowerCase().includes('all') ||
            String(p.applicable_categories).toLowerCase().includes(catStr);
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });
  }, [promotions, searchTerm, statusFilter, typeFilter, categoryFilter]);

  // Aggregate KPI Metrics
  const metrics = useMemo(() => {
    const today = getLocalDateString();
    const totalCount = promotions.length;
    const activeCount = promotions.filter((p) => {
      if (p.status !== 'ACTIVE') return false;
      if (p.start_date && p.start_date.split('T')[0] > today) return false;
      if (p.end_date && p.end_date.split('T')[0] < today) return false;
      return true;
    }).length;
    const totalRedemptions = promotions.reduce((acc, p) => acc + (p.usage_count || 0), 0);
    const totalDiscountsDistributed = promotions.reduce((acc, p) => {
      const avg = p.discount_type === 'FIXED' ? p.discount_value : (p.max_discount || 250);
      return acc + (p.usage_count || 0) * avg;
    }, 0);

    return { totalCount, activeCount, totalRedemptions, totalDiscountsDistributed };
  }, [promotions]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <OperationsPageHeader
        title="Promotions & Marketing Offers"
        subtitle="Manage platform discount coupons, service category vouchers, and seasonal customer campaigns."
        icon={<Tag className="w-5 h-5 text-white" />}
        badge={
          <Badge variant={isSuperAdmin ? 'danger' : 'neutral'} size="sm">
            {user?.role} Clearance
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              id="promotions-refresh-btn"
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
                id="promotions-create-btn"
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
        }
      />

      {/* KPI Metrics Dashboard */}
      <OperationsKpiGrid columns={4}>
        <OperationsKpiCard
          label="Total Campaigns"
          value={`${metrics.totalCount} Codes`}
          subtext="Across all service categories"
          icon={<Tag className="w-4 h-4 text-blue-500" />}
          variant="blue"
        />
        <OperationsKpiCard
          label="Active Live Offers"
          value={
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {metrics.activeCount} Active
            </span>
          }
          subtext="Currently valid for checkout"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          variant="emerald"
        />
        <OperationsKpiCard
          label="Total Redemptions"
          value={`${metrics.totalRedemptions.toLocaleString()} Uses`}
          subtext="Total consumer bookings availed"
          icon={<Users className="w-4 h-4 text-purple-500" />}
          variant="purple"
        />
        <OperationsKpiCard
          label="Discounts Distributed"
          value={`₹${metrics.totalDiscountsDistributed.toLocaleString()}`}
          subtext="Customer savings generated"
          icon={<DollarSign className="w-4 h-4 text-amber-500" />}
          variant="amber"
        />
      </OperationsKpiGrid>

      {/* Search & Filter Toolbar */}
      <OperationsToolbar
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Search by promo code (e.g. VERTEXFIRST), campaign name, or description...',
        }}
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              id="promotions-status-filter"
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

            {/* Type Filter */}
            <select
              id="promotions-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Promotion Types</option>
              {PROMOTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Live Category Filter (No hardcoding) */}
            <select
              id="promotions-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Error alert banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchPromotions()}
            className="text-xs h-7"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Promotions Table Card */}
      <OperationsCard noPadding>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="font-bold text-slate-700">Coupon Code</TableHead>
                <TableHead className="font-bold text-slate-700">Campaign & Targeting</TableHead>
                <TableHead className="font-bold text-slate-700">Discount Value</TableHead>
                <TableHead className="font-bold text-slate-700">Min Order</TableHead>
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
                      {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' || categoryFilter !== 'ALL'
                        ? 'Try clearing search keywords or active filters.'
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

                  const today = getLocalDateString();
                  const isPastEnd = Boolean(promo.end_date && promo.end_date.split('T')[0] < today);
                  const isFutureStart = Boolean(promo.start_date && promo.start_date.split('T')[0] > today);

                  let statusVariant: 'success' | 'neutral' | 'danger' | 'warning' = 'neutral';
                  let statusLabel = promo.status;

                  if (promo.status === 'ACTIVE') {
                    if (isPastEnd) {
                      statusVariant = 'danger';
                      statusLabel = 'EXPIRED';
                    } else if (isFutureStart) {
                      statusVariant = 'warning';
                      statusLabel = 'SCHEDULED';
                    } else {
                      statusVariant = 'success';
                      statusLabel = 'ACTIVE';
                    }
                  } else if (promo.status === 'INACTIVE') {
                    statusVariant = 'neutral';
                    statusLabel = 'INACTIVE';
                  } else if (promo.status === 'DRAFT') {
                    statusVariant = 'warning';
                    statusLabel = 'DRAFT';
                  } else if (promo.status === 'EXPIRED') {
                    statusVariant = 'danger';
                    statusLabel = 'EXPIRED';
                  }

                  const categoryLabel = Array.isArray(promo.applicable_categories)
                    ? promo.applicable_categories.join(', ')
                    : promo.applicable_categories || 'All Categories';

                  const serviceLabel = Array.isArray(promo.applicable_services)
                    ? promo.applicable_services.join(', ')
                    : promo.applicable_services || 'All Services';

                  return (
                    <TableRow key={promo.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md select-all">
                            {promo.code}
                          </span>
                          <button
                            type="button"
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

                      {/* Campaign Name & Targeting */}
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{promo.name}</div>
                        {promo.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {promo.description}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1"
                            title={`Category: ${categoryLabel}`}
                          >
                            <Layers className="w-2.5 h-2.5 text-slate-400" />
                            {categoryLabel}
                          </span>
                          {serviceLabel !== 'All Services' && (
                            <span
                              className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1"
                              title={`Service: ${serviceLabel}`}
                            >
                              <Wrench className="w-2.5 h-2.5 text-blue-400" />
                              {serviceLabel}
                            </span>
                          )}
                          {promo.customer_segment && promo.customer_segment !== 'ALL' && (
                            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
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
                        <div className="text-xs text-slate-700 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {promo.end_date ? formatDateDisplay(promo.end_date) : 'Ongoing'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {promo.start_date ? `From ${formatDateDisplay(promo.start_date)}` : 'Immediate start'}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant={statusVariant} size="sm">
                          {statusLabel}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Activate / Pause Toggle */}
                          {(canActivate || canDeactivate) && (
                            <Button
                              size="sm"
                              variant={promo.status === 'ACTIVE' ? 'outline' : 'primary'}
                              onClick={() => handleToggleStatus(promo)}
                              className="text-xs h-7 px-2.5"
                              title={promo.status === 'ACTIVE' ? 'Pause campaign' : 'Activate campaign'}
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
      </OperationsCard>

      {/* CREATE / EDIT PROMOTION MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingPromotion ? `Edit Promotion: ${editingPromotion.code}` : 'Create New Promotion & Offer'}
        description="Configure discount rules, coupon code, minimum order values, and live category/service targeting."
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
                id="promo-form-name"
                placeholder="e.g. Summer AC Power Jet Festival"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (formErrors.name) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.name;
                      return next;
                    });
                  }
                }}
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
                id="promo-form-code"
                placeholder="e.g. SUMMERCOOL20"
                value={formCode}
                onChange={(e) => {
                  setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                  if (formErrors.code) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.code;
                      return next;
                    });
                  }
                }}
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
              id="promo-form-desc"
              placeholder="e.g. 20% OFF on all AC foam jet cleaning and repairs above ₹499"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Row 2: Discount Type & Value & Min Order */}
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
                  id="promo-form-discount-val"
                  type="number"
                  min="1"
                  max={formDiscountType === 'PERCENTAGE' ? '100' : undefined}
                  value={formDiscountValue}
                  onChange={(e) => {
                    setFormDiscountValue(e.target.value === '' ? '' : Number(e.target.value));
                    if (formErrors.discountValue) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.discountValue;
                        return next;
                      });
                    }
                  }}
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
                  id="promo-form-min-order"
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
                  id="promo-form-max-cap"
                  type="number"
                  min="1"
                  value={formMaxDiscount}
                  onChange={(e) => setFormMaxDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 300 (leave empty for uncapped percentage)"
                  className="text-xs"
                />
                <span className="text-[10px] text-slate-400">
                  Caps total discount amount so high-ticket bookings remain profitable.
                </span>
              </div>
            )}
          </div>

          {/* Row 3: Live Service & Category Targeting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Service Category (Live API)
              </label>
              <select
                id="promo-form-category"
                value={formSelectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={loadingDependencies}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value="All">All Service Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Target all categories or restrict to a single active category.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Specific Service (Live API)
              </label>
              <select
                id="promo-form-service"
                value={formSelectedService}
                onChange={(e) => handleServiceChange(e.target.value)}
                disabled={loadingDependencies}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value="All">
                  {formSelectedCategory === 'All' ? 'All Services' : `All Services in ${formSelectedCategory}`}
                </option>
                {selectableServices.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              {formErrors.service && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.service}</p>
              )}
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Filtered automatically based on the selected category above.
              </span>
            </div>
          </div>

          {/* Row 4: Validity Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <Input
                id="promo-form-start-date"
                type="date"
                value={formStartDate}
                onChange={(e) => {
                  setFormStartDate(e.target.value);
                  if (formErrors.endDate) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.endDate;
                      return next;
                    });
                  }
                }}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
              <Input
                id="promo-form-end-date"
                type="date"
                value={formEndDate}
                onChange={(e) => {
                  setFormEndDate(e.target.value);
                  if (formErrors.endDate) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.endDate;
                      return next;
                    });
                  }
                }}
                className="text-xs"
              />
              {formErrors.endDate && <p className="text-[11px] text-rose-500 mt-1">{formErrors.endDate}</p>}
            </div>
          </div>

          {/* Row 5: Customer Segment & Usage Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Segment</label>
              <select
                id="promo-form-segment"
                value={formCustomerSegment}
                onChange={(e) => setFormCustomerSegment(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                {SEGMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Campaign Limit</label>
              <Input
                id="promo-form-usage-limit"
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
                id="promo-form-per-user-limit"
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
              id="promo-form-terms"
              rows={2}
              value={formTerms}
              onChange={(e) => setFormTerms(e.target.value)}
              placeholder="e.g. Valid only once per household. Not combinable with emergency spare parts."
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
              id="promo-form-submit-btn"
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
        title="Delete Promotion?"
        description="Are you sure you want to delete this promotional offer?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Promotion: {promotionToDelete?.code} ({promotionToDelete?.name})
            </div>
            <p className="text-[11px] text-amber-700">
              Deleting this coupon will immediately prevent new customers from applying it. Historical booking logs and redemption audit trails will remain safely preserved.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              id="delete-promo-cancel-btn"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPromotionToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              id="delete-promo-confirm-btn"
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
