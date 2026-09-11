import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { auditService } from '../../auth/audit';
import { api } from '../../services/api';
import { LocationItem, LocationFormData } from '../../types/auth';
import { AdminLeadsView } from './leads/AdminLeadsView';
import { AdminPromotionsView } from './promotions/AdminPromotionsView';
import {
  Search,
  Plus,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  Layers,
  MapPin,
  FileText,
  DollarSign,
  Users,
  UserCheck,
  UserX,
  History,
  Lock,
  Edit2,
  Trash2,
  Power,
  Tag,
  Wrench,
  Settings as SettingsIcon,
  RefreshCw,
  Navigation,
  Building,
  Globe,
} from 'lucide-react';

interface AdminGenericSectionViewProps {
  sectionKey: string;
  title: string;
  subtitle: string;
}

interface SalesTeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  territory: string;
  amcTarget: string;
  amcAchieved: string;
  status: 'Active' | 'Inactive';
}

const INITIAL_SALES_MEMBERS: SalesTeamMember[] = [
  {
    id: 'SLS-101',
    name: 'Karan Mehra',
    email: 'sales@vertex.demo',
    phone: '+91 99000 00003',
    territory: 'Gurgaon DLF & Golf Course Road',
    amcTarget: '₹5,00,000',
    amcAchieved: '₹4,85,000',
    status: 'Active',
  },
  {
    id: 'SLS-102',
    name: 'Ankita Sen',
    email: 'ankita.sales@vertexservices.in',
    phone: '+91 98112 44332',
    territory: 'South Delhi & Noida Corporate',
    amcTarget: '₹4,00,000',
    amcAchieved: '₹3,75,000',
    status: 'Active',
  },
  {
    id: 'SLS-103',
    name: 'Rohan Deshmukh',
    email: 'rohan.sales@vertexservices.in',
    phone: '+91 98201 55443',
    territory: 'Mumbai BKC & Western Suburbs',
    amcTarget: '₹6,00,000',
    amcAchieved: '₹5,40,000',
    status: 'Active',
  },
  {
    id: 'SLS-104',
    name: 'Vivek Nair',
    email: 'vivek.sales@vertexservices.in',
    phone: '+91 97412 88990',
    territory: 'Bangalore Whitefield & Koramangala',
    amcTarget: '₹4,50,000',
    amcAchieved: '₹2,10,000',
    status: 'Inactive',
  },
];

export const AdminGenericSectionView: React.FC<AdminGenericSectionViewProps> = ({
  sectionKey,
  title,
  subtitle,
}) => {
  const { user, hasPermission, canPerformAction } = useAuth();
  const { addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Service Master RBAC Permissions precisely synchronized with server-side authorization
  const canCreateService = hasPermission('SERVICE_CREATE');
  const canEditService = hasPermission('SERVICE_EDIT');
  const canDeleteService = hasPermission('SERVICE_DELETE');
  const canActivateService = hasPermission('SERVICE_ACTIVATE');
  const canDeactivateService = hasPermission('SERVICE_DEACTIVATE');
  const canToggleServiceStatus = canActivateService || canDeactivateService;
  const canEditServicePrice = hasPermission('SERVICE_PRICE_EDIT');

  // Category Master RBAC Permissions precisely synchronized with server-side authorization
  const canManageCategories = hasPermission('SERVICE_CATEGORY_MANAGE') || hasPermission('CATEGORY_MANAGE');

  // Location Master RBAC Permissions precisely synchronized with server-side authorization
  const canViewLocations = hasPermission('LOCATION_VIEW');
  const canManageLocations = hasPermission('LOCATION_MANAGE');
  const canCreateLocation = hasPermission('LOCATION_CREATE') || canManageLocations;
  const canEditLocation = hasPermission('LOCATION_EDIT') || canManageLocations;
  const canDeleteLocation = hasPermission('LOCATION_DELETE') || canManageLocations;
  const canActivateLocation = hasPermission('LOCATION_ACTIVATE') || canManageLocations;
  const canDeactivateLocation = hasPermission('LOCATION_DEACTIVATE') || canManageLocations;
  const canToggleLocationStatus = canActivateLocation || canDeactivateLocation;

  // Live data fetched from RBAC endpoints
  const [liveServices, setLiveServices] = useState<any[]>([]);
  const [liveCategories, setLiveCategories] = useState<any[]>([]);
  const [liveAmcPlans, setLiveAmcPlans] = useState<any[]>([]);
  const [livePartners, setLivePartners] = useState<any[]>([]);
  const [liveCommissions, setLiveCommissions] = useState<any[]>([]);
  const [liveEmployees, setLiveEmployees] = useState<any[]>([]);
  const [livePayrollRuns, setLivePayrollRuns] = useState<any[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);

  // Location Live State
  const [liveLocations, setLiveLocations] = useState<LocationItem[]>([]);
  const [availableStates, setAvailableStates] = useState<any[]>([]);
  const [locationFilterStatus, setLocationFilterStatus] = useState<string>('ALL');
  const [locationFilterState, setLocationFilterState] = useState<string>('');
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);

  // Location Modals & Form State
  const [isCreateLocationModalOpen, setIsCreateLocationModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);
  const [isDeleteLocationConfirmOpen, setIsDeleteLocationConfirmOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);
  const [locationFormError, setLocationFormError] = useState<string | null>(null);

  const initialLocationForm: LocationFormData = {
    name: '',
    code: '',
    country: 'India',
    state_id: 1,
    city: '',
    area: '',
    pincode: '',
    address: '',
    latitude: null,
    longitude: null,
    description: '',
    tier: 1,
    status: 'ACTIVE',
  };
  const [locationForm, setLocationForm] = useState<LocationFormData>(initialLocationForm);

  // Service modal & form state
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category_id: 1,
    category_name: 'AC Service & Repair',
    base_price: 499,
    strike_price: 699,
    duration_minutes: 45,
    warranty_days: 30,
    description: '',
  });

  // Category modal & form state
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    code: '',
    icon: '🛠️',
    description: '',
    active: true,
  });

  useEffect(() => {
    let isCurrent = true;
    setIsLoadingLive(true);

    const fetchData = async () => {
      try {
        if (sectionKey === 'services' || sectionKey === 'service-catalog') {
          const [sRes, cRes] = await Promise.all([
            api.getServices().catch(() => []),
            api.getServiceCategories().catch(() => []),
          ]);
          if (isCurrent) {
            if (Array.isArray(sRes)) setLiveServices(sRes);
            if (Array.isArray(cRes)) setLiveCategories(cRes);
          }
        } else if (sectionKey === 'categories') {
          const cRes = await api.getServiceCategories().catch(() => []);
          if (isCurrent && Array.isArray(cRes)) setLiveCategories(cRes);
        } else if (sectionKey === 'amc') {
          const res = await api.getAmcPlans();
          if (isCurrent && Array.isArray(res)) setLiveAmcPlans(res);
        } else if (sectionKey === 'partners') {
          const [p, c] = await Promise.all([
            api.getPartners().catch(() => []),
            api.getPartnerCommissions().catch(() => []),
          ]);
          if (isCurrent) {
            if (Array.isArray(p)) setLivePartners(p);
            if (Array.isArray(c)) setLiveCommissions(c);
          }
        } else if (sectionKey === 'hr') {
          const res = await api.getHrEmployees();
          if (isCurrent && Array.isArray(res)) setLiveEmployees(res);
        } else if (sectionKey === 'payroll') {
          const res = await api.getPayrollRuns();
          if (isCurrent && Array.isArray(res)) setLivePayrollRuns(res);
        } else if (sectionKey === 'locations') {
          const res = await api.getLocations({
            search: searchTerm,
            status: locationFilterStatus,
            state: locationFilterState,
          }).catch(() => null);
          if (isCurrent && res && res.success) {
            setLiveLocations(res.data);
            if (res.available_states) setAvailableStates(res.available_states);
          }
        }
      } catch (e) {
        console.warn(`[AdminGenericSectionView] Failed to fetch data for ${sectionKey}:`, e);
      } finally {
        if (isCurrent) setIsLoadingLive(false);
      }
    };

    fetchData();
    return () => {
      isCurrent = false;
    };
  }, [sectionKey]);

  // Dedicated Location fetcher responsive to search and filter updates
  const fetchLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const res = await api.getLocations({
        search: searchTerm,
        status: locationFilterStatus,
        state: locationFilterState,
      });
      if (res && res.success) {
        setLiveLocations(res.data);
        if (res.available_states) setAvailableStates(res.available_states);
      }
    } catch (err: any) {
      console.error('Failed to fetch locations:', err);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  useEffect(() => {
    if (sectionKey === 'locations') {
      fetchLocations();
    }
  }, [sectionKey, searchTerm, locationFilterStatus, locationFilterState]);

  // Location Management Handlers
  const handleOpenCreateLocationModal = () => {
    setLocationForm({
      ...initialLocationForm,
      state_id: availableStates.length > 0 ? availableStates[0].id : 1,
    });
    setLocationFormError(null);
    setIsCreateLocationModalOpen(true);
  };

  const handleOpenEditLocationModal = (loc: LocationItem) => {
    setSelectedLocation(loc);
    setLocationForm({
      name: loc.name,
      code: loc.code || '',
      country: loc.country || 'India',
      state_id: loc.state_id,
      city: loc.city || loc.name,
      area: loc.area || '',
      pincode: loc.pincode || '',
      address: loc.address || '',
      latitude: loc.latitude ?? null,
      longitude: loc.longitude ?? null,
      description: loc.description || '',
      tier: loc.tier || 1,
      status: loc.status || (loc.active ? 'ACTIVE' : 'INACTIVE'),
    });
    setLocationFormError(null);
    setIsEditLocationModalOpen(true);
  };

  const handleOpenDeleteLocationModal = (loc: LocationItem) => {
    setSelectedLocation(loc);
    setIsDeleteLocationConfirmOpen(true);
  };

  const handleSaveCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name.trim()) {
      setLocationFormError('Location name is required.');
      return;
    }
    if (!locationForm.code.trim()) {
      setLocationFormError('Location code is required (e.g., DEL-CENTRAL).');
      return;
    }
    setIsSubmittingLocation(true);
    setLocationFormError(null);
    try {
      const res = await api.createLocation(locationForm);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Location Commissioned',
          message: res.message || `Location '${res.data.name}' has been created successfully.`,
        });
        setIsCreateLocationModalOpen(false);
        fetchLocations();
      } else {
        setLocationFormError(res.message || 'Failed to create location.');
      }
    } catch (err: any) {
      setLocationFormError(err.message || 'An error occurred while creating the location.');
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Failed to create location.',
      });
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const handleSaveEditLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;
    if (!locationForm.name.trim()) {
      setLocationFormError('Location name is required.');
      return;
    }
    if (!locationForm.code.trim()) {
      setLocationFormError('Location code is required.');
      return;
    }
    setIsSubmittingLocation(true);
    setLocationFormError(null);
    try {
      const res = await api.updateLocation(selectedLocation.id, locationForm);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Location Updated',
          message: res.message || `Location '${res.data.name}' updated successfully.`,
        });
        setIsEditLocationModalOpen(false);
        fetchLocations();
      } else {
        setLocationFormError(res.message || 'Failed to update location.');
      }
    } catch (err: any) {
      setLocationFormError(err.message || 'An error occurred while updating the location.');
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Failed to update location.',
      });
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const handleToggleLocationStatus = async (loc: LocationItem) => {
    try {
      const isActive = loc.status === 'ACTIVE' || loc.active;
      let res;
      if (isActive) {
        res = await api.deactivateLocation(loc.id);
        addToast({
          type: 'info',
          title: 'Location Deactivated',
          message: res.message || `Location '${loc.name}' deactivated.`,
        });
      } else {
        res = await api.activateLocation(loc.id);
        addToast({
          type: 'success',
          title: 'Location Activated',
          message: res.message || `Location '${loc.name}' is now active.`,
        });
      }
      fetchLocations();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Status Change Failed',
        message: err.message || 'Could not alter location status.',
      });
    }
  };

  const handleConfirmDeleteLocation = async () => {
    if (!selectedLocation) return;
    setIsSubmittingLocation(true);
    try {
      const res = await api.deleteLocation(selectedLocation.id);
      if (res.action === 'ARCHIVED') {
        addToast({
          type: 'info',
          title: 'Location Safely Archived',
          message: res.message,
        });
      } else {
        addToast({
          type: 'success',
          title: 'Location Deleted',
          message: res.message || `Location '${selectedLocation.name}' permanently deleted.`,
        });
      }
      setIsDeleteLocationConfirmOpen(false);
      setSelectedLocation(null);
      fetchLocations();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Could not delete location.',
      });
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  // Service Management Handlers
  const handleToggleServiceStatus = async (id: string, currentStatusLive: boolean) => {
    try {
      const nextActive = !currentStatusLive;
      await api.toggleServiceActive(id, nextActive);
      setLiveServices((prev) =>
        prev.map((srv) => (srv.id === id ? { ...srv, is_active: nextActive, status: nextActive ? 'ACTIVE' : 'INACTIVE' } : srv))
      );
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Service status changed to ${nextActive ? 'Active' : 'Inactive'}.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Failed to update service status',
      });
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete service "${name}"?`)) return;
    try {
      await api.deleteService(id);
      setLiveServices((prev) => prev.filter((s) => s.id !== id));
      addToast({
        type: 'success',
        title: 'Service Deleted',
        message: `"${name}" removed from catalog.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Failed to delete service',
      });
    }
  };

  const handleSaveNewService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createService({
        name: serviceForm.name,
        category_id: Number(serviceForm.category_id),
        category_name: serviceForm.category_name,
        base_price: Number(serviceForm.base_price),
        strike_price: Number(serviceForm.strike_price),
        duration_minutes: Number(serviceForm.duration_minutes),
        warranty_days: Number(serviceForm.warranty_days),
        description: serviceForm.description,
        is_active: true,
      });
      const newService = created.data || created;
      setLiveServices((prev) => [newService, ...prev]);
      setIsCreateServiceModalOpen(false);
      addToast({
        type: 'success',
        title: 'Service Created',
        message: `"${serviceForm.name}" created successfully.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Failed to create service',
      });
    }
  };

  const handleSaveEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      await api.updateService(selectedService.id, {
        name: serviceForm.name,
        category_id: Number(serviceForm.category_id),
        category_name: serviceForm.category_name,
        base_price: Number(serviceForm.base_price),
        strike_price: Number(serviceForm.strike_price),
        duration_minutes: Number(serviceForm.duration_minutes),
        warranty_days: Number(serviceForm.warranty_days),
        description: serviceForm.description,
      });
      if (canEditServicePrice) {
        await api.updateServicePrice(selectedService.id, Number(serviceForm.base_price), Number(serviceForm.strike_price)).catch(() => {});
      }
      setLiveServices((prev) =>
        prev.map((s) =>
          s.id === selectedService.id
            ? {
                ...s,
                name: serviceForm.name,
                category_name: serviceForm.category_name,
                category_id: serviceForm.category_id,
                base_price: Number(serviceForm.base_price),
                strike_price: Number(serviceForm.strike_price),
                duration_minutes: Number(serviceForm.duration_minutes),
                warranty_days: Number(serviceForm.warranty_days),
                description: serviceForm.description,
              }
            : s
        )
      );
      setIsEditServiceModalOpen(false);
      addToast({
        type: 'success',
        title: 'Service Updated',
        message: `Changes to "${serviceForm.name}" saved.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Failed to update service',
      });
    }
  };

  // Category Management Handlers
  const handleSaveNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createServiceCategory({
        name: categoryForm.name,
        code: categoryForm.code || categoryForm.name.toUpperCase().replace(/\s+/g, '_'),
        icon: categoryForm.icon,
        description: categoryForm.description,
      });
      const newCat = created.data || created;
      setLiveCategories((prev) => [...prev, newCat]);
      setIsCreateCategoryModalOpen(false);
      addToast({
        type: 'success',
        title: 'Category Created',
        message: `Category "${categoryForm.name}" created successfully.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Failed to create category',
      });
    }
  };

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    try {
      await api.updateServiceCategory(selectedCategory.id, {
        name: categoryForm.name,
        code: categoryForm.code,
        icon: categoryForm.icon,
        description: categoryForm.description,
        active: categoryForm.active,
      });
      setLiveCategories((prev) =>
        prev.map((c) =>
          c.id === selectedCategory.id
            ? { ...c, name: categoryForm.name, code: categoryForm.code, icon: categoryForm.icon, description: categoryForm.description, active: categoryForm.active }
            : c
        )
      );
      setIsEditCategoryModalOpen(false);
      addToast({
        type: 'success',
        title: 'Category Updated',
        message: `Category "${categoryForm.name}" updated.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Failed to update category',
      });
    }
  };

  const handleDeleteCategory = async (id: number | string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await api.deleteServiceCategory(id);
      setLiveCategories((prev) => prev.filter((c) => c.id !== id));
      addToast({
        type: 'success',
        title: 'Category Deleted',
        message: `"${name}" removed from categories.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Failed to delete category',
      });
    }
  };

  // Sales team state
  const [salesMembers, setSalesMembers] = useState<SalesTeamMember[]>(INITIAL_SALES_MEMBERS);
  const [isAddSalesModalOpen, setIsAddSalesModalOpen] = useState(false);
  const [newSalesName, setNewSalesName] = useState('');
  const [newSalesEmail, setNewSalesEmail] = useState('');
  const [newSalesPhone, setNewSalesPhone] = useState('');
  const [newSalesTerritory, setNewSalesTerritory] = useState('Delhi NCR Corporate');

  // Permission check for managing sales team
  const canManageSales = canPerformAction('SALES_TEAM_MANAGE');

  const handleToggleSalesStatus = (id: string) => {
    if (!canManageSales) {
      addToast('Permission Denied', 'Only Managers and Super Admins can alter sales staff status.', 'error');
      return;
    }

    setSalesMembers((prev) =>
      prev.map((member) => {
        if (member.id === id) {
          const nextStatus = member.status === 'Active' ? 'Inactive' : 'Active';
          auditService.record(
            nextStatus === 'Active' ? 'USER_UPDATED' : 'USER_DEACTIVATED',
            user?.id || 'admin',
            user?.name || 'Administrator',
            user?.role || 'MANAGER',
            `${user?.role} ${user?.name} changed Sales Representative ${member.name} status to ${nextStatus}`,
            'SUCCESS'
          );
          addToast('Sales Member Updated', `${member.name} marked as ${nextStatus}`, 'success');
          return { ...member, status: nextStatus };
        }
        return member;
      })
    );
  };

  const handleCreateSalesMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSales) {
      addToast('Permission Denied', 'Insufficient privileges to create sales personnel.', 'error');
      return;
    }

    const newMember: SalesTeamMember = {
      id: `SLS-${100 + salesMembers.length + 1}`,
      name: newSalesName,
      email: newSalesEmail,
      phone: newSalesPhone,
      territory: newSalesTerritory,
      amcTarget: '₹4,00,000',
      amcAchieved: '₹0',
      status: 'Active',
    };

    setSalesMembers([newMember, ...salesMembers]);
    auditService.record(
      'USER_CREATED',
      user?.id || 'admin',
      user?.name || 'Administrator',
      user?.role || 'MANAGER',
      `Onboarded new Sales Representative: ${newMember.name} (${newMember.territory})`,
      'SUCCESS'
    );
    addToast('Sales Representative Created', `${newMember.name} has been enrolled.`, 'success');
    setIsAddSalesModalOpen(false);
    setNewSalesName('');
    setNewSalesEmail('');
    setNewSalesPhone('');
  };

  // Generate specialized content based on the section
  const renderSectionContent = () => {
    switch (sectionKey) {
      case 'sales-team':
      case 'sales':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Input
                placeholder="Filter sales representatives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="max-w-xs"
              />

              <div className="flex items-center gap-2">
                {canManageSales ? (
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setIsAddSalesModalOpen(true)}
                  >
                    Add Sales Member
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-500 border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Read-Only View ({user?.role})</span>
                  </div>
                )}
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Territory Jurisdiction</TableHead>
                  <TableHead>Monthly Target</TableHead>
                  <TableHead>Achieved Volume</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Admin Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesMembers
                  .filter(
                    (m) =>
                      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      m.territory.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{member.email}</div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">{member.territory}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{member.amcTarget}</TableCell>
                      <TableCell className="font-bold text-emerald-600">{member.amcAchieved}</TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'Active' ? 'success' : 'neutral'} size="sm">
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageSales ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant={member.status === 'Active' ? 'outline' : 'primary'}
                              onClick={() => handleToggleSalesStatus(member.id)}
                              className="text-xs py-1 h-7"
                            >
                              {member.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No manage clearance</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {/* Modal for adding sales member */}
            <Modal
              isOpen={isAddSalesModalOpen}
              onClose={() => setIsAddSalesModalOpen(false)}
              title="Add Sales Team Representative"
              size="md"
            >
              <form onSubmit={handleCreateSalesMember} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Enrolled sales representatives gain access to CRM leads, AMC packages, and booking creation.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newSalesName}
                    onChange={(e) => setNewSalesName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g. Tarun Verma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newSalesEmail}
                    onChange={(e) => setNewSalesEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="e.g. tarun.sales@vertexservices.in"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={newSalesPhone}
                    onChange={(e) => setNewSalesPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="+91 98110 00000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Territory Jurisdiction
                  </label>
                  <select
                    value={newSalesTerritory}
                    onChange={(e) => setNewSalesTerritory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Delhi NCR Corporate">Delhi NCR Corporate</option>
                    <option value="Gurgaon Cyber Hub & Sohna Road">Gurgaon Cyber Hub & Sohna Road</option>
                    <option value="Noida & Greater Noida Expressway">Noida & Greater Noida Expressway</option>
                    <option value="Mumbai BKC & Western Suburbs">Mumbai BKC & Western Suburbs</option>
                    <option value="Bangalore IT Corridors">Bangalore IT Corridors</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddSalesModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Confirm & Enroll Member
                  </Button>
                </div>
              </form>
            </Modal>
          </div>
        );

      case 'audit-logs':
      case 'audit logs':
      case 'audit': {
        const liveLogs = auditService.getLogs();
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Displaying {liveLogs.length} immutable system security logs
              </span>
              <Badge variant="neutral" size="sm">
                Real-Time Security Feed
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">
                      {log.timestamp}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">{log.userName}</TableCell>
                    <TableCell>
                      <Badge variant={log.userRole === 'SUPER_ADMIN' ? 'danger' : 'neutral'} size="sm">
                        {log.userRole}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-[11px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                        {log.action}
                      </code>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 max-w-xs">{log.details}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-400">{log.ipAddress || '127.0.0.1'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === 'SUCCESS'
                            ? 'success'
                            : log.status === 'WARNING'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      }

      case 'services': {
        const canAnyServiceAction = canEditService || canDeleteService || canActivateService || canDeactivateService;
        const displayCategoriesList = liveCategories.length > 0 ? liveCategories : [
          { id: 1, name: 'AC Service & Repair' },
          { id: 2, name: 'Electrician Services' },
          { id: 3, name: 'Plumbing Solutions' },
          { id: 4, name: 'Water Purifier (RO)' },
          { id: 5, name: 'Carpentry & Furniture Assembly' },
          { id: 6, name: 'Facility & Office Maintenance' },
        ];

        const displayServicesList = (liveServices.length > 0
          ? liveServices.map((s) => ({
              id: s.id,
              raw: s,
              name: s.name,
              cat: s.category_name || (s.category && s.category.name) || 'General Catalog',
              price: s.base_price !== undefined ? `₹${s.base_price}` : (s.price !== undefined ? `₹${s.price}` : '₹499'),
              dur: s.duration_minutes ? `${s.duration_minutes} mins` : '45 mins',
              war: s.warranty_days ? `${s.warranty_days} Days` : '30 Days',
              status: s.is_active !== false && s.status !== 'INACTIVE' ? 'Live' : 'Inactive',
            }))
          : [
              { id: 'srv-1', raw: null, name: 'AC Deep Power Jet Cleaning', cat: 'AC Service & Repair', price: '₹499', dur: '45 mins', war: '30 Days', status: 'Live' },
              { id: 'srv-2', raw: null, name: 'Split AC Gas Charging (R32/R410)', cat: 'AC Service & Repair', price: '₹1,499', dur: '60 mins', war: '60 Days', status: 'Live' },
              { id: 'srv-3', raw: null, name: 'Full Home Electrical Audit', cat: 'Electrician Services', price: '₹799', dur: '90 mins', war: '30 Days', status: 'Live' },
              { id: 'srv-4', raw: null, name: 'Bathroom Concealed Leakage Detection', cat: 'Plumbing Solutions', price: '₹599', dur: '60 mins', war: '30 Days', status: 'Live' },
              { id: 'srv-5', raw: null, name: 'Copper Filter RO Service & Membrane', cat: 'Water Purifier (RO)', price: '₹899', dur: '45 mins', war: '90 Days', status: 'Live' },
            ]
        ).filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.cat.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <Input
                placeholder="Filter services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="max-w-xs"
              />
              {/* Conditional RBAC: Only authorized roles (e.g. SUPER_ADMIN) see Create Service button */}
              {canCreateService && (
                <Button
                  id="btn-create-service"
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setServiceForm({
                      name: '',
                      category_id: displayCategoriesList[0]?.id || 1,
                      category_name: displayCategoriesList[0]?.name || 'AC Service & Repair',
                      base_price: 499,
                      strike_price: 699,
                      duration_minutes: 45,
                      warranty_days: 30,
                      description: '',
                    });
                    setIsCreateServiceModalOpen(true);
                  }}
                >
                  Create Service Catalog Item
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Starting Price</TableHead>
                    <TableHead>Avg Duration</TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead>Status</TableHead>
                    {canAnyServiceAction && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayServicesList.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold text-slate-900">{s.name}</TableCell>
                      <TableCell>{s.cat}</TableCell>
                      <TableCell className="font-extrabold text-slate-900">{s.price}</TableCell>
                      <TableCell>{s.dur}</TableCell>
                      <TableCell>{s.war}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'Live' ? 'success' : 'neutral'} size="sm">
                          {s.status}
                        </Badge>
                      </TableCell>
                      {/* Conditional RBAC: Only authorized roles (SUPER_ADMIN) see action buttons */}
                      {canAnyServiceAction && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {((s.status === 'Live' && canDeactivateService) || (s.status !== 'Live' && canActivateService)) && (
                              <Button
                                id={`btn-toggle-status-${s.id}`}
                                size="xs"
                                variant="ghost"
                                title={s.status === 'Live' ? 'Deactivate Service' : 'Activate Service'}
                                onClick={() => handleToggleServiceStatus(s.id, s.status === 'Live')}
                                className={s.status === 'Live' ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {canEditService && (
                              <Button
                                id={`btn-edit-service-${s.id}`}
                                size="xs"
                                variant="ghost"
                                title="Edit Service"
                                onClick={() => {
                                  setSelectedService(s.raw || s);
                                  setServiceForm({
                                    name: s.name,
                                    category_id: s.raw?.category_id || 1,
                                    category_name: s.cat,
                                    base_price: Number(String(s.price).replace(/[^\d]/g, '')) || 499,
                                    strike_price: s.raw?.strike_price || 699,
                                    duration_minutes: Number(String(s.dur).replace(/[^\d]/g, '')) || 45,
                                    warranty_days: Number(String(s.war).replace(/[^\d]/g, '')) || 30,
                                    description: s.raw?.description || '',
                                  });
                                  setIsEditServiceModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {canDeleteService && (
                              <Button
                                id={`btn-delete-service-${s.id}`}
                                size="xs"
                                variant="ghost"
                                title="Delete Service"
                                onClick={() => handleDeleteService(s.id, s.name)}
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      }

      case 'categories': {
        const displayCategories = liveCategories.length > 0 ? liveCategories : [
          { id: 1, name: 'AC Service & Repair', code: 'AC_COOLING', services: 14, icon: '❄️', active: true },
          { id: 2, name: 'Electrician Services', code: 'ELECTRICAL', services: 22, icon: '⚡', active: true },
          { id: 3, name: 'Plumbing Solutions', code: 'PLUMBING', services: 18, icon: '🚰', active: true },
          { id: 4, name: 'Water Purifier (RO)', code: 'WATER_PURIFIER', services: 9, icon: '💧', active: true },
          { id: 5, name: 'Carpentry & Furniture Assembly', code: 'CARPENTRY', services: 16, icon: '🪚', active: true },
          { id: 6, name: 'Facility & Office Maintenance', code: 'FACILITY', services: 12, icon: '🏢', active: true },
        ];

        const filteredCategories = displayCategories.filter((c: any) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <Input
                placeholder="Filter categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="max-w-xs"
              />
              {/* Conditional RBAC: Only users with category management permissions (e.g. SUPER_ADMIN) see Create Category button */}
              {canManageCategories && (
                <Button
                  id="btn-create-category"
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setCategoryForm({
                      name: '',
                      code: '',
                      icon: '🛠️',
                      description: '',
                      active: true,
                    });
                    setIsCreateCategoryModalOpen(true);
                  }}
                >
                  Create Category
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat: any, i: number) => (
                <Card key={cat.id || i} className="p-5">
                  <div className="text-2xl mb-2">{cat.icon || '📦'}</div>
                  <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {cat.services !== undefined ? `${cat.services} active catalog offerings` : (cat.description || 'Verified service vertical')}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Badge variant={cat.active !== false ? 'success' : 'neutral'} size="sm">
                      {cat.active !== false ? 'Active' : 'Inactive'}
                    </Badge>

                    {/* Conditional RBAC: Only users with category management permissions (e.g. SUPER_ADMIN) see Edit and Delete buttons */}
                    {canManageCategories && (
                      <div className="flex items-center gap-1">
                        <Button
                          id={`btn-edit-category-${cat.id || i}`}
                          size="sm"
                          variant="ghost"
                          className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setCategoryForm({
                              name: cat.name,
                              code: cat.code || '',
                              icon: cat.icon || '🛠️',
                              description: cat.description || '',
                              active: cat.active !== false,
                            });
                            setIsEditCategoryModalOpen(true);
                          }}
                        >
                          Edit Category
                        </Button>
                        <Button
                          id={`btn-delete-category-${cat.id || i}`}
                          size="sm"
                          variant="ghost"
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5"
                          title="Delete Category"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      }

      case 'locations': {
        const totalHubs = liveLocations.length;
        const activeHubs = liveLocations.filter((l) => l.status === 'ACTIVE' || l.active).length;
        const statesCovered = new Set(liveLocations.map((l) => l.state_name || l.state_id)).size;
        const totalReferences = liveLocations.reduce((sum, l) => sum + (l.usage_count || 0), 0);

        return (
          <div className="space-y-4">
            {/* Top Operational Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <span className="text-xs text-slate-400 font-semibold uppercase">Total Regional Hubs</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{totalHubs} Hubs</div>
                <div className="text-xs text-slate-500 mt-1">Configured Service Centers</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs text-slate-400 font-semibold uppercase">Active Coverage Hubs</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{activeHubs} Live</div>
                <div className="text-xs text-slate-500 mt-1">Accepting customer bookings</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs text-slate-400 font-semibold uppercase">States & UTs Covered</span>
                <div className="text-2xl font-black text-blue-600 mt-1">{statesCovered} Territories</div>
                <div className="text-xs text-slate-500 mt-1">Pan-India operational presence</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs text-slate-400 font-semibold uppercase">Linked Platform Records</span>
                <div className="text-2xl font-black text-indigo-600 mt-1">{totalReferences} Records</div>
                <div className="text-xs text-slate-500 mt-1">Protected by archival governance</div>
              </Card>
            </div>

            {/* Filter and Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="search-locations"
                    placeholder="Search by hub name, code, city, pincode..."
                    className="pl-9 text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    id="filter-location-state"
                    value={locationFilterState}
                    onChange={(e) => setLocationFilterState(e.target.value)}
                    className="h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">All States ({availableStates.length})</option>
                    {availableStates.map((st: any) => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>

                  <select
                    id="filter-location-status"
                    value={locationFilterStatus}
                    onChange={(e) => setLocationFilterStatus(e.target.value)}
                    className="h-9 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="INACTIVE">Inactive Only</option>
                    <option value="ARCHIVED">Archived Only</option>
                  </select>

                  <Button
                    id="btn-refresh-locations"
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-900 px-2"
                    title="Refresh Location Hubs"
                    onClick={fetchLocations}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingLocations ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {canCreateLocation ? (
                  <Button
                    id="btn-add-location"
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={handleOpenCreateLocationModal}
                  >
                    Add Location
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs text-slate-500 border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Read-Only View ({user?.role})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Locations Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hub Name & Identifier</TableHead>
                    <TableHead>State & Jurisdiction</TableHead>
                    <TableHead>City / Region</TableHead>
                    <TableHead>Pincode & Address</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>References</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Governance Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLocations && liveLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Loading regional operational hubs...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : liveLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                        <div className="max-w-sm mx-auto space-y-3">
                          <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="font-semibold text-slate-900">No matching locations found</div>
                          <p className="text-xs text-slate-500">
                            No operational hubs match your current search and filter criteria.
                          </p>
                          {canCreateLocation && (
                            <Button
                              id="btn-empty-add-location"
                              size="sm"
                              variant="primary"
                              leftIcon={<Plus className="w-4 h-4" />}
                              onClick={handleOpenCreateLocationModal}
                            >
                              Add First Location
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    liveLocations.map((loc) => {
                      const isActive = loc.status === 'ACTIVE' || loc.active;
                      const isArchived = loc.status === 'ARCHIVED';

                      return (
                        <TableRow key={loc.id} className={isArchived ? 'opacity-70 bg-slate-50/50' : ''}>
                          {/* Hub Name & Code */}
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                                <Building className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{loc.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-semibold">
                                    {loc.code || `LOC-${loc.id}`}
                                  </span>
                                  {loc.description && (
                                    <span className="text-[11px] text-slate-400 truncate max-w-[160px]" title={loc.description}>
                                      {loc.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* State & Jurisdiction */}
                          <TableCell>
                            <div className="font-medium text-slate-900">{loc.state_name || 'N/A'}</div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <span>{loc.country || 'India'}</span>
                              {loc.state_code && <span className="font-mono text-slate-500">({loc.state_code})</span>}
                            </div>
                          </TableCell>

                          {/* City / Region */}
                          <TableCell>
                            <div className="font-medium text-slate-800">{loc.city || loc.name}</div>
                            {loc.area && <div className="text-[11px] text-slate-500">{loc.area}</div>}
                          </TableCell>

                          {/* Pincode & Address */}
                          <TableCell>
                            <div className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-700">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{loc.pincode || 'All Hub Zones'}</span>
                            </div>
                            {loc.address && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={loc.address}>
                                {loc.address}
                              </div>
                            )}
                          </TableCell>

                          {/* Classification / Tier */}
                          <TableCell>
                            <Badge
                              variant={loc.tier === 1 ? 'info' : loc.tier === 2 ? 'neutral' : 'warning'}
                              size="sm"
                            >
                              {loc.tier === 1 ? 'Tier 1 Metro' : loc.tier === 2 ? 'Tier 2 Hub' : 'Regional'}
                            </Badge>
                          </TableCell>

                          {/* Dependencies & Safety */}
                          <TableCell>
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                              title={`${loc.usage_count || 0} active foreign key links across bookings, users, and tech scopes`}
                            >
                              <Shield className="w-3 h-3 text-slate-400" />
                              <span>{loc.usage_count || 0} Records</span>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant={isArchived ? 'neutral' : isActive ? 'success' : 'warning'}
                              size="sm"
                            >
                              {isArchived ? 'ARCHIVED' : isActive ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit Location */}
                              {canEditLocation && (
                                <Button
                                  id={`btn-edit-location-${loc.id}`}
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 h-8 w-8"
                                  title="Edit Location Hub"
                                  onClick={() => handleOpenEditLocationModal(loc)}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              {/* Toggle Active / Inactive Status */}
                              {canToggleLocationStatus && !isArchived && (
                                <Button
                                  id={`btn-toggle-location-${loc.id}`}
                                  size="sm"
                                  variant="ghost"
                                  className={`text-xs p-1.5 h-8 w-8 ${
                                    isActive
                                      ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                      : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                  title={isActive ? 'Deactivate Location' : 'Activate Location'}
                                  onClick={() => handleToggleLocationStatus(loc)}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </Button>
                              )}

                              {/* Delete or Archive Location */}
                              {canDeleteLocation && (
                                <Button
                                  id={`btn-delete-location-${loc.id}`}
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 h-8 w-8"
                                  title={
                                    (loc.usage_count || 0) > 0
                                      ? 'Archive Location (Preserves dependent records)'
                                      : 'Delete Location'
                                  }
                                  onClick={() => handleOpenDeleteLocationModal(loc)}
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
          </div>
        );
      }

      case 'finance':
      case 'payments':
      case 'invoices':
      case 'commission':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Net Collections</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">₹42,80,450</div>
              </Card>
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Settled to Partners</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">₹35,13,950</div>
              </Card>
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Platform Retained (15%)</span>
                <div className="text-xl font-extrabold text-emerald-600 mt-1">₹6,42,000</div>
              </Card>
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">GST Payable (18%)</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">₹1,24,500</div>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Partner Payout</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Settlement Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: 'INV-2026-901', cust: 'Rahul Sharma', gross: '₹1,250', pay: '₹1,050', comm: '₹200', st: 'Settled' },
                  { id: 'INV-2026-900', cust: 'Amit Verma', gross: '₹4,999', pay: '₹4,200', comm: '₹799', st: 'Settled' },
                  { id: 'INV-2026-899', cust: 'Neha Gupta', gross: '₹650', pay: '₹550', comm: '₹100', st: 'Pending Payout' },
                  { id: 'INV-2026-898', cust: 'DLF CyberParks Ltd', gross: '₹14,999', pay: '₹12,750', comm: '₹2,249', st: 'Settled' },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono font-bold text-xs text-slate-900">{row.id}</TableCell>
                    <TableCell className="font-semibold">{row.cust}</TableCell>
                    <TableCell className="font-extrabold text-slate-900">{row.gross}</TableCell>
                    <TableCell>{row.pay}</TableCell>
                    <TableCell className="text-emerald-600 font-bold">{row.comm}</TableCell>
                    <TableCell>
                      <Badge variant={row.st === 'Settled' ? 'success' : 'warning'} size="sm">
                        {row.st}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'amc':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Active AMC Contracts</span>
                <div className="text-2xl font-black text-slate-900 mt-1">428 Properties</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Total AMC ARR</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">₹18,40,000</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Preventive Audits Due</span>
                <div className="text-2xl font-black text-amber-600 mt-1">34 Next 7 Days</div>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract ID</TableHead>
                  <TableHead>Client / Entity</TableHead>
                  <TableHead>Tier Plan</TableHead>
                  <TableHead>Annual Fee</TableHead>
                  <TableHead>Visits Done</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(liveAmcPlans.length > 0
                  ? liveAmcPlans.map((c) => ({
                      id: c.public_id || c.id,
                      name: c.title || c.name,
                      plan: c.target_tier || 'PRO',
                      fee: `₹${c.base_price}/yr`,
                      vis: `${c.annual_preventive_visits || 4} Visits/Yr`,
                      exp: c.is_active ? 'Active Plan' : 'Draft',
                      st: c.is_active ? 'Active' : 'Inactive',
                    }))
                  : [
                      { id: 'AMC-2026-08', name: 'Rahul Sharma (Villa 14B)', plan: 'Residential Shield Pro', fee: '₹8,499', vis: '2 of 6', exp: '14 May 2027', st: 'Active' },
                      { id: 'AMC-2026-07', name: 'CoWork Central Space', plan: 'Corporate Facility Plus', fee: '₹14,999', vis: '5 of 12', exp: '28 Feb 2027', st: 'Active' },
                      { id: 'AMC-2026-06', name: 'Hamilton Towers Society', plan: 'Commercial Enterprise', fee: '₹34,500', vis: '8 of 18', exp: '30 Nov 2026', st: 'Active' },
                    ]
                )
                  .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.plan.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono font-bold text-xs text-slate-900">{c.id}</TableCell>
                      <TableCell className="font-bold text-slate-900">{c.name}</TableCell>
                      <TableCell>{c.plan}</TableCell>
                      <TableCell className="font-extrabold text-slate-900">{c.fee}</TableCell>
                      <TableCell className="font-medium text-slate-700">{c.vis}</TableCell>
                      <TableCell>{c.exp}</TableCell>
                      <TableCell>
                        <Badge variant={c.st === 'Active' ? 'success' : 'neutral'} size="sm">{c.st}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'crm':
      case 'leads':
        return <AdminLeadsView />;

      case 'promotions':
        return <AdminPromotionsView />;

      case 'partners':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Channel Partners</span>
                <div className="text-2xl font-black text-slate-900 mt-1">4 Active</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Total Referrals</span>
                <div className="text-2xl font-black text-blue-600 mt-1">104 Bookings</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Commissions Paid</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">₹42,300</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Pending Approvals</span>
                <div className="text-2xl font-black text-amber-600 mt-1">₹1,050 (1 Dues)</div>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Partner Commission Management & Versioned Rules</h3>
                  <p className="text-xs text-slate-500">Tier-based percentage and fixed referral commissions with approval workflows</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Create Commission Rule</Button>
                  <Button size="sm" variant="primary">Onboard Channel Partner</Button>
                </div>
              </div>

              <div className="border-b border-slate-200">
                <div className="flex gap-4 text-xs font-bold text-slate-600">
                  <span className="border-b-2 border-slate-900 pb-2 text-slate-900 cursor-pointer">Channel Partners</span>
                  <span className="pb-2 text-slate-500 hover:text-slate-800 cursor-pointer">Commission Rules (v1/v2)</span>
                  <span className="pb-2 text-slate-500 hover:text-slate-800 cursor-pointer">Approval Queue (1 Pending)</span>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner Entity</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Earned</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(livePartners.length > 0
                    ? livePartners.map((ptnr) => ({
                        id: ptnr.public_id || ptnr.id,
                        name: ptnr.company_name || ptnr.name,
                        contact: ptnr.contact_person || 'Managing Director',
                        tier: ptnr.tier || 'STANDARD',
                        refs: ptnr.total_referrals ?? 0,
                        earned: `₹${(ptnr.total_commission_earned ?? 0).toLocaleString()}`,
                        paid: `₹${(ptnr.total_commission_paid ?? 0).toLocaleString()}`,
                        st: ptnr.status || 'ACTIVE',
                      }))
                    : [
                        { id: 'VXPTN-0001', name: 'Urban Facility Solutions LLP', contact: 'Vikas Agarwal', tier: 'ENTERPRISE', refs: 48, earned: '₹24,500', paid: '₹22,000', st: 'ACTIVE' },
                        { id: 'VXPTN-0002', name: 'Metro Cooling Hub Associates', contact: 'Rajesh Nair', tier: 'PREMIUM', refs: 32, earned: '₹14,200', paid: '₹14,200', st: 'ACTIVE' },
                        { id: 'VXPTN-0003', name: 'Apex Living Residential Care', contact: 'Pooja Verma', tier: 'STANDARD', refs: 18, earned: '₹6,800', paid: '₹6,100', st: 'ACTIVE' },
                        { id: 'VXPTN-0004', name: 'Smart Spaces Commercial PM', contact: 'Sunil Rao', tier: 'ENTERPRISE', refs: 6, earned: '₹2,400', paid: '₹0', st: 'ACTIVE' },
                      ]
                  )
                    .filter((ptnr) => ptnr.name.toLowerCase().includes(searchTerm.toLowerCase()) || ptnr.contact.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((ptnr) => (
                      <TableRow key={ptnr.id}>
                        <TableCell>
                          <div className="font-bold text-slate-900">{ptnr.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{ptnr.id}</div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{ptnr.contact}</TableCell>
                        <TableCell>
                          <Badge variant="neutral" size="sm">{ptnr.tier}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900">{ptnr.refs}</TableCell>
                        <TableCell className="font-bold text-emerald-600">{ptnr.earned}</TableCell>
                        <TableCell className="text-slate-700">{ptnr.paid}</TableCell>
                        <TableCell>
                          <Badge variant={ptnr.st === 'ACTIVE' ? 'success' : 'neutral'} size="sm">{ptnr.st}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-xs">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'hr':
        return (
          <div className="space-y-6">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center justify-between">
              <span><strong>Staff Personnel Module:</strong> Strictly covers internal on-roll employees, dispatchers, technicians, and hub supervisors.</span>
              <Badge variant="primary" size="sm">Internal Personnel</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Total Staff</span>
                <div className="text-2xl font-black text-slate-900 mt-1">3 On-Roll</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Today Attendance</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">100% Present</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Pending Leave Requests</span>
                <div className="text-2xl font-black text-amber-600 mt-1">1 Pending</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Active Departments</span>
                <div className="text-2xl font-black text-purple-600 mt-1">3 Departments</div>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">On-Roll Employees & Lifecycle Management</h3>
                  <p className="text-xs text-slate-500">Shifts, attendance regularization, leave approval workflows, and exit tracking</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Regularize Attendance</Button>
                  <Button size="sm" variant="primary">Onboard Employee</Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Code & Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(liveEmployees.length > 0
                    ? liveEmployees.map((emp) => ({
                        code: emp.employee_code || emp.id,
                        name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name,
                        dept: emp.department_name || emp.department_id || 'Operations',
                        title: emp.designation_title || emp.designation_id || 'Staff Specialist',
                        doj: emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString() : 'Active',
                        type: emp.employment_type || 'FULL_TIME',
                        st: emp.status || 'ACTIVE',
                      }))
                    : [
                        { code: 'VXEMP-0001', name: 'Vikram Malhotra', dept: 'Field Operations', title: 'Senior HVAC Lead Technician', doj: '15 Jan 2024', type: 'FULL_TIME', st: 'ACTIVE' },
                        { code: 'VXEMP-0002', name: 'Priya Sharma', dept: 'Human Resources', title: 'HR Generalist & Talent Lead', doj: '01 Mar 2024', type: 'FULL_TIME', st: 'ACTIVE' },
                        { code: 'VXEMP-0003', name: 'Rohan Saxena', dept: 'Finance & Accounts', title: 'Payroll & Compliance Specialist', doj: '10 Feb 2024', type: 'FULL_TIME', st: 'ACTIVE' },
                      ]
                  )
                    .filter((emp) => emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.dept.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((emp) => (
                      <TableRow key={emp.code}>
                        <TableCell>
                          <div className="font-bold text-slate-900">{emp.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{emp.code}</div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{emp.dept}</TableCell>
                        <TableCell>{emp.title}</TableCell>
                        <TableCell className="text-xs text-slate-600">{emp.doj}</TableCell>
                        <TableCell>
                          <Badge variant="neutral" size="sm">{emp.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={emp.st === 'ACTIVE' ? 'success' : 'neutral'} size="sm">{emp.st}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-xs">Profile</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'payroll':
        return (
          <div className="space-y-6">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
              <span><strong>Statutory Advisory:</strong> Salary computation calculations (PF 12%, PT, TDS) are advisory internal baselines. Review with qualified payroll compliance officers before tax remittances.</span>
              <Badge variant="warning" size="sm">Advisory Only</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Current Payroll Run</span>
                <div className="text-2xl font-black text-slate-900 mt-1">Feb 2026</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Total Net Disbursed</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">₹1,36,500</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Total PF/PT Deductions</span>
                <div className="text-2xl font-black text-slate-900 mt-1">₹18,500</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Cycle Status</span>
                <div className="text-2xl font-black text-blue-600 mt-1">FINALIZED</div>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Monthly Payroll Processing & Salary Structures</h3>
                  <p className="text-xs text-slate-500">Attendance-based computations, approval lifecycle, and locked payslips generation</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Configure Structures</Button>
                  <Button size="sm" variant="primary">Initiate March Run</Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle Title</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Gross Total</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Payout</TableHead>
                    <TableHead>Cycle Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(livePayrollRuns.length > 0
                    ? livePayrollRuns.map((run) => ({
                        id: run.id,
                        title: run.title || `${run.month}/${run.year} Staff Payroll`,
                        emps: run.total_employees ?? 3,
                        gross: `₹${(run.total_gross || 0).toLocaleString()}`,
                        ded: `₹${(run.total_deductions || 0).toLocaleString()}`,
                        net: `₹${(run.total_net || 0).toLocaleString()}`,
                        st: run.status || 'DRAFT',
                      }))
                    : [
                        { id: 'prun-2026-02', title: 'February 2026 Staff Payroll', emps: 3, gross: '₹1,55,000', ded: '₹18,500', net: '₹1,36,500', st: 'FINALIZED' },
                        { id: 'prun-2026-01', title: 'January 2026 Staff Payroll', emps: 3, gross: '₹1,55,000', ded: '₹18,500', net: '₹1,36,500', st: 'FINALIZED' },
                      ]
                  )
                    .filter((run) => run.title.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-bold text-slate-900">{run.title}</TableCell>
                        <TableCell className="font-semibold">{run.emps} Staff</TableCell>
                        <TableCell className="font-bold text-slate-900">{run.gross}</TableCell>
                        <TableCell className="text-rose-600 font-medium">{run.ded}</TableCell>
                        <TableCell className="font-black text-emerald-600">{run.net}</TableCell>
                        <TableCell>
                          <Badge variant={run.st === 'FINALIZED' ? 'success' : run.st === 'APPROVED' ? 'primary' : 'neutral'} size="sm">{run.st}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-xs">View Slips</Button>
                            <Button size="sm" variant="outline" className="text-xs">Export</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      default:
        // Default generic SaaS view for other views
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Entries</span>
                <div className="text-2xl font-black text-slate-900 mt-1">128 Records</div>
              </Card>
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">Synchronized</div>
              </Card>
              <Card className="p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400">SLA Health</span>
                <div className="text-2xl font-black text-blue-600 mt-1">99.4%</div>
              </Card>
            </div>

            <Card className="p-6 text-center bg-slate-50 border-dashed">
              <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900">{title} Workspace</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Full operational control and configuration parameters for {title.toLowerCase()}. Filter, search, and edit live records seamlessly.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button size="sm" variant="primary">
                  Export {title} Report
                </Button>
                <Button size="sm" variant="outline">
                  Configure Settings
                </Button>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
            Filter
          </Button>
          <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="p-6 bg-white border border-slate-200 shadow-xs">
        {renderSectionContent()}
      </Card>

      {/* Create Service Modal */}
      <Modal
        isOpen={isCreateServiceModalOpen}
        onClose={() => setIsCreateServiceModalOpen(false)}
        title="Create Service Catalog Item"
        description="Add a new verified service to the on-demand customer catalog."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveNewService} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Title</label>
            <Input
              id="new-service-name"
              required
              placeholder="e.g. Inverter Split AC Complete Overhaul"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Category</label>
              <select
                id="new-service-category"
                className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={serviceForm.category_id}
                onChange={(e) => {
                  const catId = Number(e.target.value);
                  const selectedCat = (liveCategories.length > 0 ? liveCategories : [
                    { id: 1, name: 'AC Service & Repair' },
                    { id: 2, name: 'Electrician Services' },
                    { id: 3, name: 'Plumbing Solutions' },
                    { id: 4, name: 'Water Purifier (RO)' },
                    { id: 5, name: 'Carpentry & Furniture Assembly' },
                    { id: 6, name: 'Facility & Office Maintenance' },
                  ]).find((c) => c.id === catId);
                  setServiceForm({
                    ...serviceForm,
                    category_id: catId,
                    category_name: selectedCat?.name || serviceForm.category_name,
                  });
                }}
              >
                {(liveCategories.length > 0 ? liveCategories : [
                  { id: 1, name: 'AC Service & Repair' },
                  { id: 2, name: 'Electrician Services' },
                  { id: 3, name: 'Plumbing Solutions' },
                  { id: 4, name: 'Water Purifier (RO)' },
                  { id: 5, name: 'Carpentry & Furniture Assembly' },
                  { id: 6, name: 'Facility & Office Maintenance' },
                ]).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Duration (Mins)</label>
              <Input
                id="new-service-duration"
                type="number"
                min={15}
                step={5}
                required
                value={serviceForm.duration_minutes}
                onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Starting Price (₹)</label>
              <Input
                id="new-service-base-price"
                type="number"
                min={0}
                required
                value={serviceForm.base_price}
                onChange={(e) => setServiceForm({ ...serviceForm, base_price: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Strike-through Price (₹)</label>
              <Input
                id="new-service-strike-price"
                type="number"
                min={0}
                value={serviceForm.strike_price}
                onChange={(e) => setServiceForm({ ...serviceForm, strike_price: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Period (Days)</label>
            <Input
              id="new-service-warranty"
              type="number"
              min={0}
              value={serviceForm.warranty_days}
              onChange={(e) => setServiceForm({ ...serviceForm, warranty_days: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Scope</label>
            <textarea
              id="new-service-description"
              rows={3}
              className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of labor, spare parts policy, and inspection protocols..."
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateServiceModalOpen(false)}>
              Cancel
            </Button>
            <Button id="btn-submit-create-service" type="submit" variant="primary" size="sm">
              Save Service
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={isEditServiceModalOpen}
        onClose={() => setIsEditServiceModalOpen(false)}
        title="Edit Service Catalog Item"
        description="Update pricing, warranty, category, and scope details."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEditService} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Service Title</label>
            <Input
              id="edit-service-name"
              required
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Category</label>
              <select
                id="edit-service-category"
                className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={serviceForm.category_id}
                onChange={(e) => {
                  const catId = Number(e.target.value);
                  const selectedCat = (liveCategories.length > 0 ? liveCategories : [
                    { id: 1, name: 'AC Service & Repair' },
                    { id: 2, name: 'Electrician Services' },
                    { id: 3, name: 'Plumbing Solutions' },
                    { id: 4, name: 'Water Purifier (RO)' },
                    { id: 5, name: 'Carpentry & Furniture Assembly' },
                    { id: 6, name: 'Facility & Office Maintenance' },
                  ]).find((c) => c.id === catId);
                  setServiceForm({
                    ...serviceForm,
                    category_id: catId,
                    category_name: selectedCat?.name || serviceForm.category_name,
                  });
                }}
              >
                {(liveCategories.length > 0 ? liveCategories : [
                  { id: 1, name: 'AC Service & Repair' },
                  { id: 2, name: 'Electrician Services' },
                  { id: 3, name: 'Plumbing Solutions' },
                  { id: 4, name: 'Water Purifier (RO)' },
                  { id: 5, name: 'Carpentry & Furniture Assembly' },
                  { id: 6, name: 'Facility & Office Maintenance' },
                ]).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Duration (Mins)</label>
              <Input
                id="edit-service-duration"
                type="number"
                min={15}
                step={5}
                required
                value={serviceForm.duration_minutes}
                onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Starting Price (₹) {!canEditServicePrice && <span className="text-amber-600 font-normal ml-1">(Read-only)</span>}
              </label>
              <Input
                id="edit-service-base-price"
                type="number"
                min={0}
                required
                disabled={!canEditServicePrice}
                value={serviceForm.base_price}
                onChange={(e) => setServiceForm({ ...serviceForm, base_price: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Strike-through Price (₹) {!canEditServicePrice && <span className="text-amber-600 font-normal ml-1">(Read-only)</span>}
              </label>
              <Input
                id="edit-service-strike-price"
                type="number"
                min={0}
                disabled={!canEditServicePrice}
                value={serviceForm.strike_price}
                onChange={(e) => setServiceForm({ ...serviceForm, strike_price: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Period (Days)</label>
            <Input
              id="edit-service-warranty"
              type="number"
              min={0}
              value={serviceForm.warranty_days}
              onChange={(e) => setServiceForm({ ...serviceForm, warranty_days: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Scope</label>
            <textarea
              id="edit-service-description"
              rows={3}
              className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditServiceModalOpen(false)}>
              Cancel
            </Button>
            <Button id="btn-submit-edit-service" type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        title="Create Service Category"
        description="Add a top-level category vertical to group service offerings."
        maxWidth="md"
      >
        <form onSubmit={handleSaveNewCategory} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
            <Input
              id="new-category-name"
              required
              placeholder="e.g. Smart Home & Automation"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category Code</label>
              <Input
                id="new-category-code"
                placeholder="SMART_HOME"
                value={categoryForm.code}
                onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Icon / Emoji</label>
              <Input
                id="new-category-icon"
                placeholder="🏠"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              id="new-category-desc"
              rows={2}
              className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Summary of services under this category..."
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button id="btn-submit-create-category" type="submit" variant="primary" size="sm">
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditCategoryModalOpen}
        onClose={() => setIsEditCategoryModalOpen(false)}
        title="Edit Service Category"
        description="Update category name, icon, code, or active status."
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditCategory} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
            <Input
              id="edit-category-name"
              required
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category Code</label>
              <Input
                id="edit-category-code"
                value={categoryForm.code}
                onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Icon / Emoji</label>
              <Input
                id="edit-category-icon"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              id="edit-category-desc"
              rows={2}
              className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-category-active"
              checked={categoryForm.active}
              onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="edit-category-active" className="text-xs font-medium text-slate-700">
              Active in catalog and customer booking flow
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button id="btn-submit-edit-category" type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Regional Location Modal */}
      <Modal
        isOpen={isCreateLocationModalOpen}
        onClose={() => setIsCreateLocationModalOpen(false)}
        title="Commission New Regional Location Hub"
        description="Configure a new service territory with full RBAC governance and territory tracking."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCreateLocation} className="space-y-4 pt-2">
          {locationFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{locationFormError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hub / Location Name <span className="text-rose-500">*</span>
              </label>
              <Input
                id="create-location-name"
                required
                placeholder="e.g., Delhi NCR Super Hub"
                value={locationForm.name}
                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location Code <span className="text-rose-500">*</span>
              </label>
              <Input
                id="create-location-code"
                required
                placeholder="e.g., DEL-CENTRAL"
                value={locationForm.code}
                onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State / Territory <span className="text-rose-500">*</span>
              </label>
              <select
                id="create-location-state"
                required
                value={locationForm.state_id}
                onChange={(e) => setLocationForm({ ...locationForm, state_id: parseInt(e.target.value, 10) })}
                className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableStates.map((st: any) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <Input
                id="create-location-city"
                placeholder="e.g., New Delhi"
                value={locationForm.city || ''}
                onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Locality</label>
              <Input
                id="create-location-area"
                placeholder="e.g., Connaught Place"
                value={locationForm.area || ''}
                onChange={(e) => setLocationForm({ ...locationForm, area: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Pincode</label>
              <Input
                id="create-location-pincode"
                placeholder="e.g., 110001"
                value={locationForm.pincode || ''}
                onChange={(e) => setLocationForm({ ...locationForm, pincode: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Market Tier</label>
              <select
                id="create-location-tier"
                value={locationForm.tier || 1}
                onChange={(e) => setLocationForm({ ...locationForm, tier: parseInt(e.target.value, 10) })}
                className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Tier 1 (Metro / High Volume)</option>
                <option value={2}>Tier 2 (Emerging Hub)</option>
                <option value={3}>Tier 3 (Regional Expansion)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
              <select
                id="create-location-status"
                value={locationForm.status || 'ACTIVE'}
                onChange={(e) =>
                  setLocationForm({
                    ...locationForm,
                    status: e.target.value as 'ACTIVE' | 'INACTIVE',
                  })
                }
                className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Active (Live in Booking Engine)</option>
                <option value="INACTIVE">Inactive (Draft / Setup)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address / Operations Facility</label>
            <Input
              id="create-location-address"
              placeholder="e.g., Hub 4B, Sector 18, Commercial Center"
              value={locationForm.address || ''}
              onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude (Optional)</label>
              <Input
                id="create-location-lat"
                type="number"
                step="any"
                placeholder="e.g., 28.6139"
                value={locationForm.latitude ?? ''}
                onChange={(e) =>
                  setLocationForm({
                    ...locationForm,
                    latitude: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude (Optional)</label>
              <Input
                id="create-location-lng"
                type="number"
                step="any"
                placeholder="e.g., 77.2090"
                value={locationForm.longitude ?? ''}
                onChange={(e) =>
                  setLocationForm({
                    ...locationForm,
                    longitude: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Hub Operations Notes</label>
            <textarea
              id="create-location-desc"
              rows={2}
              className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Primary Central NCR logistics & fulfillment node with 35 certified technicians."
              value={locationForm.description || ''}
              onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateLocationModalOpen(false)}
              disabled={isSubmittingLocation}
            >
              Cancel
            </Button>
            <Button
              id="btn-submit-create-location"
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingLocation}
            >
              {isSubmittingLocation ? 'Commissioning...' : 'Commission Hub'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Regional Location Modal */}
      <Modal
        isOpen={isEditLocationModalOpen}
        onClose={() => setIsEditLocationModalOpen(false)}
        title="Edit Regional Location Hub"
        description="Update operational parameters, address, code, or tier for this territory."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEditLocation} className="space-y-4 pt-2">
          {locationFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{locationFormError}</span>
            </div>
          )}

          {selectedLocation && (selectedLocation.usage_count || 0) > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Active Records Protected:</span> This location hub is referenced by{' '}
                <span className="font-bold">{selectedLocation.usage_count}</span> active bookings, customer addresses,
                or technician assignments. Updates will automatically synchronize across all dependent services.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hub / Location Name <span className="text-rose-500">*</span>
              </label>
              <Input
                id="edit-location-name"
                required
                value={locationForm.name}
                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location Code <span className="text-rose-500">*</span>
              </label>
              <Input
                id="edit-location-code"
                required
                value={locationForm.code}
                onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State / Territory <span className="text-rose-500">*</span>
              </label>
              <select
                id="edit-location-state"
                required
                value={locationForm.state_id}
                onChange={(e) => setLocationForm({ ...locationForm, state_id: parseInt(e.target.value, 10) })}
                className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableStates.map((st: any) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <Input
                id="edit-location-city"
                value={locationForm.city || ''}
                onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Locality</label>
              <Input
                id="edit-location-area"
                value={locationForm.area || ''}
                onChange={(e) => setLocationForm({ ...locationForm, area: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Pincode</label>
              <Input
                id="edit-location-pincode"
                value={locationForm.pincode || ''}
                onChange={(e) => setLocationForm({ ...locationForm, pincode: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Market Tier</label>
              <select
                id="edit-location-tier"
                value={locationForm.tier || 1}
                onChange={(e) => setLocationForm({ ...locationForm, tier: parseInt(e.target.value, 10) })}
                className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Tier 1 (Metro / High Volume)</option>
                <option value={2}>Tier 2 (Emerging Hub)</option>
                <option value={3}>Tier 3 (Regional Expansion)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Status</label>
              <select
                id="edit-location-status"
                value={locationForm.status || 'ACTIVE'}
                onChange={(e) =>
                  setLocationForm({
                    ...locationForm,
                    status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
                  })
                }
                className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Active (Live in Booking Engine)</option>
                <option value="INACTIVE">Inactive (Suspended)</option>
                <option value="ARCHIVED">Archived (Decommissioned)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address / Operations Facility</label>
            <Input
              id="edit-location-address"
              value={locationForm.address || ''}
              onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude (Optional)</label>
              <Input
                id="edit-location-lat"
                type="number"
                step="any"
                value={locationForm.latitude ?? ''}
                onChange={(e) =>
                  setLocationForm({
                    ...locationForm,
                    latitude: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude (Optional)</label>
              <Input
                id="edit-location-lng"
                type="number"
                step="any"
                value={locationForm.longitude ?? ''}
                onChange={(e) =>
                  setLocationForm({
                    ...locationForm,
                    longitude: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Hub Operations Notes</label>
            <textarea
              id="edit-location-desc"
              rows={2}
              className="w-full text-xs font-medium rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={locationForm.description || ''}
              onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditLocationModalOpen(false)}
              disabled={isSubmittingLocation}
            >
              Cancel
            </Button>
            <Button
              id="btn-submit-edit-location"
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingLocation}
            >
              {isSubmittingLocation ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Safe Deletion / Archival Confirmation Modal */}
      <Modal
        isOpen={isDeleteLocationConfirmOpen}
        onClose={() => setIsDeleteLocationConfirmOpen(false)}
        title={
          selectedLocation && (selectedLocation.usage_count || 0) > 0
            ? 'Archive Location Hub (Protected Records)'
            : 'Confirm Location Hub Deletion'
        }
        description="Verify decommission action in accordance with enterprise data protection policy."
        maxWidth="md"
      >
        {selectedLocation && (
          <div className="space-y-4 pt-2">
            {(selectedLocation.usage_count || 0) > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">
                      Cannot Hard-Delete: Referenced by {selectedLocation.usage_count} Records
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Hub <span className="font-bold font-mono">{selectedLocation.name} ({selectedLocation.code})</span> is
                      presently linked to active customer bookings, assigned technicians, or billing records.
                    </p>
                    <p className="text-slate-600 leading-relaxed font-semibold">
                      To preserve financial audits, legal compliance, and booking histories, this hub will be safely{' '}
                      <span className="text-amber-700 underline">ARCHIVED and DEACTIVATED</span>. It will be removed from customer
                      booking forms while keeping existing records fully intact.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteLocationConfirmOpen(false)}
                    disabled={isSubmittingLocation}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="btn-confirm-archive-location"
                    type="button"
                    variant="primary"
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleConfirmDeleteLocation}
                    disabled={isSubmittingLocation}
                  >
                    {isSubmittingLocation ? 'Archiving...' : 'Safely Archive & Deactivate Hub'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">
                      Permanently Delete Hub
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Are you sure you want to delete <span className="font-bold">{selectedLocation.name}</span> ({selectedLocation.code})?
                      This location has 0 active dependencies and will be permanently removed from the master registry.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteLocationConfirmOpen(false)}
                    disabled={isSubmittingLocation}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="btn-confirm-delete-location"
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                    onClick={handleConfirmDeleteLocation}
                    disabled={isSubmittingLocation}
                  >
                    {isSubmittingLocation ? 'Deleting...' : 'Permanently Delete Hub'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
