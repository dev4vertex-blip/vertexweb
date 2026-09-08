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
  Settings as SettingsIcon,
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
  const { user, canPerformAction } = useAuth();
  const { addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Live data fetched from RBAC endpoints
  const [liveServices, setLiveServices] = useState<any[]>([]);
  const [liveAmcPlans, setLiveAmcPlans] = useState<any[]>([]);
  const [livePartners, setLivePartners] = useState<any[]>([]);
  const [liveCommissions, setLiveCommissions] = useState<any[]>([]);
  const [liveEmployees, setLiveEmployees] = useState<any[]>([]);
  const [livePayrollRuns, setLivePayrollRuns] = useState<any[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);

  useEffect(() => {
    let isCurrent = true;
    setIsLoadingLive(true);

    const fetchData = async () => {
      try {
        if (sectionKey === 'services' || sectionKey === 'service-catalog') {
          const res = await api.getServices();
          if (isCurrent && Array.isArray(res)) setLiveServices(res);
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

      case 'services':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Filter services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="max-w-xs"
              />
              <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Create Service Catalog Item
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Starting Price</TableHead>
                  <TableHead>Avg Duration</TableHead>
                  <TableHead>Warranty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(liveServices.length > 0
                  ? liveServices.map((s) => ({
                      id: s.id,
                      name: s.name,
                      cat: s.category_name || s.category_id || 'General Catalog',
                      price: `₹${s.base_price}`,
                      dur: s.duration_minutes ? `${s.duration_minutes} mins` : '45 mins',
                      war: s.warranty_days ? `${s.warranty_days} Days` : '30 Days',
                      status: s.is_active ? 'Live' : 'Inactive',
                    }))
                  : [
                      { name: 'AC Deep Power Jet Cleaning', cat: 'AC Service & Repair', price: '₹499', dur: '45 mins', war: '30 Days', status: 'Live' },
                      { name: 'Split AC Gas Charging (R32/R410)', cat: 'AC Service & Repair', price: '₹1,499', dur: '60 mins', war: '60 Days', status: 'Live' },
                      { name: 'Full Home Electrical Audit', cat: 'Electrician Services', price: '₹799', dur: '90 mins', war: '30 Days', status: 'Live' },
                      { name: 'Bathroom Concealed Leakage Detection', cat: 'Plumbing Solutions', price: '₹599', dur: '60 mins', war: '30 Days', status: 'Live' },
                      { name: 'Copper Filter RO Service & Membrane', cat: 'Water Purifier (RO)', price: '₹899', dur: '45 mins', war: '90 Days', status: 'Live' },
                    ]
                )
                  .filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.cat.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((s, idx) => (
                    <TableRow key={idx}>
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
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'categories':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'AC Service & Repair', services: 14, icon: '❄️', active: true },
              { name: 'Electrician Services', services: 22, icon: '⚡', active: true },
              { name: 'Plumbing Solutions', services: 18, icon: '🚰', active: true },
              { name: 'Water Purifier (RO)', services: 9, icon: '💧', active: true },
              { name: 'Carpentry & Furniture Assembly', services: 16, icon: '🪚', active: true },
              { name: 'Facility & Office Maintenance', services: 12, icon: '🏢', active: true },
            ].map((cat, i) => (
              <Card key={i} className="p-5">
                <div className="text-2xl mb-2">{cat.icon}</div>
                <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{cat.services} active catalog offerings</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Badge variant="success" size="sm">Active</Badge>
                  <Button size="sm" variant="ghost" className="text-xs">Edit Category</Button>
                </div>
              </Card>
            ))}
          </div>
        );

      case 'locations':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <span className="text-xs text-slate-400 font-semibold uppercase">Operational Hubs</span>
                <div className="text-2xl font-black text-slate-900 mt-1">5 Metros</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs text-slate-400 font-semibold uppercase">Coverage Pincodes</span>
                <div className="text-2xl font-black text-slate-900 mt-1">142 Pincodes</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs text-slate-400 font-semibold uppercase">Avg Response Time</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">42 Minutes</div>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hub Name</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Hub Manager</TableHead>
                  <TableHead>Fleet Size</TableHead>
                  <TableHead>Pincode Clusters</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { hub: 'Delhi NCR (Central & South)', st: 'Delhi', mgr: 'Rajesh K.', fleet: 34, pins: '110001 - 110092', status: 'Optimal' },
                  { hub: 'Gurgaon Cyber City Hub', st: 'Haryana', mgr: 'Vikram A.', fleet: 28, pins: '122001 - 122018', status: 'Optimal' },
                  { hub: 'Noida Expressway Hub', st: 'Uttar Pradesh', mgr: 'Sunil V.', fleet: 18, pins: '201301 - 201309', status: 'Optimal' },
                  { hub: 'Mumbai Western Suburbs', st: 'Maharashtra', mgr: 'Deepak P.', fleet: 24, pins: '400050 - 400099', status: 'Expanding' },
                  { hub: 'Bangalore Tech Corridor', st: 'Karnataka', mgr: 'Anand R.', fleet: 22, pins: '560001 - 560103', status: 'Optimal' },
                ].map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-bold text-slate-900">{l.hub}</TableCell>
                    <TableCell>{l.st}</TableCell>
                    <TableCell>{l.mgr}</TableCell>
                    <TableCell className="font-semibold">{l.fleet} Techs</TableCell>
                    <TableCell className="font-mono text-xs">{l.pins}</TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm">{l.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

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
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Total Leads in Pipeline</span>
                <div className="text-2xl font-black text-slate-900 mt-1">84 Leads</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Pipeline Value</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">₹34,50,000</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Converted This Month</span>
                <div className="text-2xl font-black text-blue-600 mt-1">28 Accounts</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Lead-to-AMC Win Rate</span>
                <div className="text-2xl font-black text-purple-600 mt-1">36.8%</div>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead ID</TableHead>
                  <TableHead>Prospect / Client</TableHead>
                  <TableHead>Service Required</TableHead>
                  <TableHead>Deal Size</TableHead>
                  <TableHead>Sales Owner</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: 'LEAD-901', name: 'DLF CyberParks Phase 3', req: 'Annual HVAC & Electrical AMC', val: '₹4,50,000', owner: 'Karan Mehra', stage: 'Contract Proposal', status: 'In Negotiation' },
                  { id: 'LEAD-902', name: 'Prestige Ozone Society', req: 'Water Purifier & Plumbing AMC', val: '₹2,80,000', owner: 'Vivek Nair', stage: 'Site Inspection', status: 'Hot' },
                  { id: 'LEAD-903', name: 'Tech Mahindra SEZ Hub', req: 'Complete Appliance Maintenance', val: '₹6,20,000', owner: 'Rohan Deshmukh', stage: 'Quote Submitted', status: 'Warm' },
                  { id: 'LEAD-904', name: 'Oberoi Sky City Residencies', req: 'Residential AMC (140 Flats)', val: '₹8,90,000', owner: 'Ankita Sen', stage: 'Initial Meeting', status: 'New' },
                ].map((lead, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono font-bold text-xs text-slate-900">{lead.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{lead.name}</TableCell>
                    <TableCell>{lead.req}</TableCell>
                    <TableCell className="font-extrabold text-emerald-600">{lead.val}</TableCell>
                    <TableCell className="font-medium text-slate-700">{lead.owner}</TableCell>
                    <TableCell>{lead.stage}</TableCell>
                    <TableCell>
                      <Badge variant={lead.status === 'Hot' ? 'danger' : lead.status === 'In Negotiation' ? 'warning' : 'primary'} size="sm">
                        {lead.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'promotions':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Active Coupons</span>
                <div className="text-2xl font-black text-slate-900 mt-1">6 Codes</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Total Redemptions</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">1,420 Uses</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Discounts Distributed</span>
                <div className="text-2xl font-black text-blue-600 mt-1">₹2,84,000</div>
              </Card>
              <Card className="p-4">
                <span className="text-xs uppercase font-bold text-slate-400">Avg Basket Lift</span>
                <div className="text-2xl font-black text-purple-600 mt-1">+24.5%</div>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coupon Code</TableHead>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Discount Value</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Usage Count</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { code: 'VERTEXFIRST', campaign: 'New Customer Welcome', val: '₹150 OFF', min: '₹499', uses: '840 / 1000', exp: '31 Dec 2026', st: 'Active' },
                  { code: 'ACCHILL20', campaign: 'Summer AC Festival', val: '20% OFF (Max ₹300)', min: '₹799', uses: '412 / 500', exp: '30 Oct 2026', st: 'Active' },
                  { code: 'AMCSHIELD500', campaign: 'Annual Contract Special', val: '₹500 Flat OFF', min: '₹3,999', uses: '128 / 200', exp: '15 Nov 2026', st: 'Active' },
                  { code: 'HOMESAFE10', campaign: 'Electrical Safety Drive', val: '10% OFF', min: '₹350', uses: '40 / 100', exp: '20 Sep 2026', st: 'Expiring Soon' },
                ].map((promo, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono font-bold text-xs text-blue-600 bg-blue-50/50 px-2 py-1 rounded w-fit">{promo.code}</TableCell>
                    <TableCell className="font-bold text-slate-900">{promo.campaign}</TableCell>
                    <TableCell className="font-extrabold text-emerald-600">{promo.val}</TableCell>
                    <TableCell>{promo.min}</TableCell>
                    <TableCell className="font-medium text-slate-700">{promo.uses}</TableCell>
                    <TableCell>{promo.exp}</TableCell>
                    <TableCell>
                      <Badge variant={promo.st === 'Active' ? 'success' : 'warning'} size="sm">
                        {promo.st}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

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
    </div>
  );
};
