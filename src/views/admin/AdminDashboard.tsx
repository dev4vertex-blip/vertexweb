import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, TechnicianUser } from '../../types';
import {
  ADMIN_DASHBOARD_METRICS,
  REVENUE_CHART_DATA,
  BOOKINGS_TREND_DATA,
  SERVICE_PERFORMANCE_DATA,
  CITY_PERFORMANCE_DATA,
  TECHNICIAN_PERFORMANCE_DATA,
} from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { BookingStatusBadge } from './components/BookingStatusBadge';
import { AdminBookingDetailsModal } from './components/AdminBookingDetailsModal';
import { TechnicianSelector } from './components/TechnicianSelector';
import { BookingsStatusChart } from './components/BookingsStatusChart';
import {
  TrendingUp,
  DollarSign,
  CalendarCheck,
  Clock,
  CheckCircle2,
  Users,
  ShieldCheck,
  CreditCard,
  Percent,
  Star,
  MapPin,
  ArrowUpRight,
  AlertTriangle,
  Wrench,
  Eye,
  Activity,
  UserCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { bookings, allCustomers, allTechnicians } = useApp();

  // Selected Booking for Details / Assignment Modals
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<Booking | null>(null);

  // Operational Queue Active Tab
  const [activeQueueTab, setActiveQueueTab] = useState<
    'today' | 'pending' | 'active' | 'recent' | 'completed'
  >('pending');

  const maxRevenue = Math.max(...REVENUE_CHART_DATA.map((d) => d.onDemand + d.amc));
  const maxBookings = Math.max(...BOOKINGS_TREND_DATA.map((d) => d.bookings));

  // Today's date calculations for robust matching
  const todayIso = new Date().toISOString().split('T')[0];
  const now = new Date();
  const dayOfMonth = now.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[now.getMonth()];
  const todayFormatted = `${dayOfMonth} ${monthName}`.toLowerCase();

  // 1. Total Bookings: All bookings in the local state
  const totalBookingsCount = bookings.length;

  // 2. Today's Bookings: Scheduled for today or registered today
  const todaysBookings = bookings.filter((b) => {
    const sched = (b.scheduledDate || '').toLowerCase();
    const created = (b.createdAt || '').toLowerCase();
    return (
      sched.includes('today') ||
      sched.includes(todayIso) ||
      sched.includes(todayFormatted) ||
      created.includes('just now') ||
      created.includes(todayIso)
    );
  });
  const todaysBookingsCount = todaysBookings.length;

  // 3. Pending Assignments: Bookings requiring technician assignment
  const pendingAssignments = bookings.filter((b) => {
    if (b.status === 'cancelled' || b.status === 'completed') return false;
    return (
      b.status === 'pending' ||
      b.status === 'confirmed' ||
      !b.technicianId ||
      !b.technicianName
    );
  });
  const pendingAssignmentsCount = pendingAssignments.length;

  // 4. Active Jobs: Dispatched, accepted, en route, or active in-progress field jobs
  const activeJobs = bookings.filter(
    (b) =>
      b.status === 'assigned' ||
      b.status === 'technician_assigned' ||
      b.status === 'accepted' ||
      b.status === 'in_progress'
  );
  const activeJobsCount = activeJobs.length;

  // Operational breakdown & supporting counts
  const inProgressCount = bookings.filter((b) => b.status === 'in_progress').length;
  const assignedCount = bookings.filter(
    (b) =>
      b.status === 'assigned' ||
      b.status === 'technician_assigned' ||
      b.status === 'accepted'
  ).length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
  const activeTechniciansCount = allTechnicians.filter(
    (t) => t.status === 'ACTIVE' && t.isOnDuty
  ).length;
  const totalCustomersCount = allCustomers.length;

  const pendingCodAmount = bookings
    .filter((b) => b.paymentStatus === 'Pending' && b.status !== 'cancelled')
    .reduce((acc, b) => acc + b.amount, 0);

  const grossGmvAmount =
    bookings.reduce((sum, b) => (b.status !== 'cancelled' ? sum + b.amount : sum), 0) +
    1284500;

  // Filtered operational datasets
  const pendingBookings = pendingAssignments;
  const activeOperationalJobs = activeJobs;
  const recentBookingsFeed = bookings.slice(0, 8);
  const completedServicesFeed = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="space-y-6">
      {/* 1. Live Operational KPI Cards Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Real-Time Operations & Service KPIs
            </h2>
            <p className="text-xs text-slate-500">Live operational feed synchronized with mobile apps</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              Live State Synchronized
            </Badge>
          </div>
        </div>

        {/* Primary 4 Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* 1. Total Bookings */}
          <Card
            id="kpi-total-bookings"
            onClick={() => {
              setActiveQueueTab('recent');
              document.getElementById('operational-queue-desk')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-blue-600 transition-colors">
                Total Bookings
              </span>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              {totalBookingsCount}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>{completedCount} completed • {cancelledCount} cancelled</span>
              <span className="font-semibold text-blue-600 flex items-center gap-0.5">
                All logs <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </Card>

          {/* 2. Today's Bookings */}
          <Card
            id="kpi-todays-bookings"
            onClick={() => {
              setActiveQueueTab('today');
              document.getElementById('operational-queue-desk')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-4 bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-indigo-600 transition-colors">
                  Today's Bookings
                </span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              {todaysBookingsCount}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>
                {todaysBookings.filter((b) => b.status === 'in_progress' || b.status === 'assigned' || b.status === 'accepted').length} active • {todaysBookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length} unassigned
              </span>
              <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
                Today's queue <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </Card>

          {/* 3. Pending Assignments */}
          <Card
            id="kpi-pending-assignments"
            onClick={() => {
              setActiveQueueTab('pending');
              document.getElementById('operational-queue-desk')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-4 bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Pending Assignments
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-600 mt-3 tracking-tight">
              {pendingAssignmentsCount}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-amber-700">
              <span className="font-medium">
                {pendingAssignmentsCount > 0 ? 'Needs partner dispatch' : 'All partners assigned'}
              </span>
              <span className="font-semibold flex items-center gap-0.5">
                Dispatch desk <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </Card>

          {/* 4. Active Jobs */}
          <Card
            id="kpi-active-jobs"
            onClick={() => {
              setActiveQueueTab('active');
              document.getElementById('operational-queue-desk')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-4 bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Active Jobs
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              {activeJobsCount}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>{inProgressCount} on premise • {assignedCount} en route</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
                Live field ops <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </Card>
        </div>

        {/* Secondary Operational Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Completed Jobs */}
          <Card className="p-3 bg-slate-50/70 border-slate-200">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Completed Delivered
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{completedCount}</div>
            <div className="text-[10px] text-emerald-600 font-semibold">Delivered successfully</div>
          </Card>

          {/* Active Technicians Online */}
          <Card className="p-3 bg-slate-50/70 border-slate-200">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Active Partners
              </span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {activeTechniciansCount}{' '}
              <span className="text-xs font-normal text-slate-400">/ {allTechnicians.length}</span>
            </div>
            <div className="text-[10px] text-teal-600 font-semibold">On duty in hubs</div>
          </Card>

          {/* Outstanding Dues */}
          <Card className="p-3 bg-slate-50/70 border-slate-200">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Pending COD
              </span>
              <CreditCard className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              ₹{pendingCodAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">Cash on service</div>
          </Card>

          {/* Vertex Platform Revenue */}
          <Card className="p-3 bg-slate-50/70 border-slate-200">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Gross GMV
              </span>
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              ₹{grossGmvAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">+18.4% this month</div>
          </Card>
        </div>
      </div>

      {/* 2. Operations Workflows Queue & Dispatch Panel */}
      <Card className="p-5 border-slate-200" id="operational-queue-desk">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              Operations Desk & Dispatch Streams
            </h3>
            <p className="text-xs text-slate-500">Manage field dispatches, assignments, and service executions</p>
          </div>

          {/* Queue Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveQueueTab('today')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeQueueTab === 'today'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Today's Bookings</span>
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-full text-[10px]">
                {todaysBookingsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveQueueTab('pending')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeQueueTab === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending Assignments</span>
              {pendingAssignmentsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                  {pendingAssignmentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveQueueTab('active')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeQueueTab === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Active Jobs</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
                {activeJobsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveQueueTab('recent')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeQueueTab === 'recent'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total Feed ({recentBookingsFeed.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('completed')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeQueueTab === 'completed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedServicesFeed.length})
            </button>
          </div>
        </div>

        {/* Tab 0: Today's Bookings Queue */}
        {activeQueueTab === 'today' && (
          <div>
            {todaysBookings.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">No Bookings Scheduled For Today</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  There are no service appointments scheduled or registered for today.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service & City</TableHead>
                      <TableHead>Scheduled Slot</TableHead>
                      <TableHead>Technician Partner</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaysBookings.map((b) => (
                      <TableRow key={b.id} className="hover:bg-indigo-50/30 transition-colors">
                        <TableCell className="font-mono font-bold text-slate-900 text-xs">
                          #{b.id}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs">{b.customerName}</div>
                          <div className="text-[11px] text-slate-500">{b.customerPhone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-800 text-xs">{b.serviceName}</div>
                          <div className="text-[11px] text-slate-500">
                            {b.address.city} • {b.address.tag}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-800">{b.scheduledDate}</div>
                          <div className="text-[11px] text-slate-500">{b.scheduledSlot}</div>
                        </TableCell>
                        <TableCell>
                          {b.technicianName ? (
                            <div className="font-medium text-xs text-slate-900 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-blue-600" />
                              {b.technicianName}
                            </div>
                          ) : (
                            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-extrabold text-slate-900 text-xs">
                          ₹{b.amount}
                        </TableCell>
                        <TableCell>
                          <BookingStatusBadge status={b.status} size="sm" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedBookingForDetails(b)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Details
                            </Button>
                            {!b.technicianId || b.status === 'pending' || b.status === 'confirmed' ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => setSelectedBookingForAssign(b)}
                              >
                                Assign
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedBookingForAssign(b)}
                              >
                                Reassign
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Pending Assignment Queue */}
        {activeQueueTab === 'pending' && (
          <div>
            {pendingBookings.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">All Bookings Dispatched</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  There are no unassigned customer bookings awaiting technician dispatch.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service & City</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBookings.map((b) => (
                      <TableRow key={b.id} className="hover:bg-amber-50/40 transition-colors">
                        <TableCell className="font-mono font-bold text-slate-900 text-xs">
                          #{b.id}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs">{b.customerName}</div>
                          <div className="text-[11px] text-slate-500">{b.customerPhone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-800 text-xs">{b.serviceName}</div>
                          <div className="text-[11px] text-slate-500">
                            {b.address.city} • {b.address.tag}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-800">{b.scheduledDate}</div>
                          <div className="text-[11px] text-slate-500">{b.scheduledSlot}</div>
                        </TableCell>
                        <TableCell className="font-extrabold text-slate-900 text-xs">
                          ₹{b.amount}
                        </TableCell>
                        <TableCell>
                          <BookingStatusBadge status={b.status} size="sm" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedBookingForDetails(b)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setSelectedBookingForAssign(b)}
                            >
                              Assign Partner
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Active Field Operations */}
        {activeQueueTab === 'active' && (
          <div>
            {activeOperationalJobs.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">No Jobs Active in Field</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  No technicians are currently assigned or en route to jobs.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Assigned Technician</TableHead>
                      <TableHead>Scheduled Slot</TableHead>
                      <TableHead>Start OTP</TableHead>
                      <TableHead>Current Stage</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOperationalJobs.map((b) => (
                      <TableRow key={b.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-mono font-bold text-slate-900 text-xs">
                          #{b.id}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs">{b.customerName}</div>
                          <div className="text-[11px] text-slate-500">{b.serviceName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-blue-600" />
                            {b.technicianName || 'Partner'}
                          </div>
                          <div className="text-[11px] text-slate-500">{b.technicianPhone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-medium text-slate-800">{b.scheduledDate}</div>
                          <div className="text-[11px] text-slate-500">{b.scheduledSlot}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {b.otp || '4821'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <BookingStatusBadge status={b.status} size="sm" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedBookingForDetails(b)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              Manage
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedBookingForAssign(b)}
                            >
                              Reassign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Recent Bookings Feed */}
        {activeQueueTab === 'recent' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Inspect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookingsFeed.map((b) => (
                  <TableRow key={b.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-mono font-bold text-slate-900 text-xs">
                      #{b.id}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 text-xs">{b.customerName}</TableCell>
                    <TableCell className="font-medium text-slate-800 text-xs">{b.serviceName}</TableCell>
                    <TableCell className="text-[11px] text-slate-600">
                      {b.scheduledDate} ({b.scheduledSlot})
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {b.technicianName ? (
                        <span className="font-semibold text-slate-900">{b.technicianName}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 text-xs">₹{b.amount}</TableCell>
                    <TableCell>
                      <BookingStatusBadge status={b.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBookingForDetails(b)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 4: Completed Services */}
        {activeQueueTab === 'completed' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Technician Partner</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Inspect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedServicesFeed.map((b) => (
                  <TableRow key={b.id} className="hover:bg-emerald-50/30 transition-colors">
                    <TableCell className="font-mono font-bold text-slate-900 text-xs">
                      #{b.id}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 text-xs">{b.customerName}</TableCell>
                    <TableCell className="font-medium text-slate-800 text-xs">{b.serviceName}</TableCell>
                    <TableCell className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {b.technicianName || 'Verified Tech'}
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-600">{b.scheduledDate}</TableCell>
                    <TableCell className="font-extrabold text-slate-900 text-xs">₹{b.amount}</TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm">{b.paymentStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBookingForDetails(b)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Audit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
 
      {/* 3. Bookings by Status Recharts Analytics */}
      <BookingsStatusChart
        bookings={bookings}
        onSelectStatusFilter={(tab) => {
          setActiveQueueTab(tab);
          const el = document.getElementById('operational-queue-desk');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* 4. Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue (Monthly Trend On-Demand vs AMC) */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Growth Trend</h3>
              <p className="text-xs text-slate-500">Monthly breakdown: On-Demand vs AMC Contracts</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-900" />
                <span className="text-slate-600">On-Demand</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
                <span className="text-slate-600">AMC</span>
              </div>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-4 border-b border-slate-100">
            {REVENUE_CHART_DATA.map((item, idx) => {
              const total = item.onDemand + item.amc;
              const onDemandHeightPercent = (item.onDemand / maxRevenue) * 100;
              const amcHeightPercent = (item.amc / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{(total / 100000).toFixed(1)}L
                  </div>
                  <div className="w-full max-w-[32px] flex flex-col items-center justify-end rounded-t-sm overflow-hidden gap-0.5">
                    <div
                      style={{ height: `${amcHeightPercent * 1.5}px` }}
                      className="w-full bg-blue-600 transition-all hover:bg-blue-500"
                      title={`AMC: ₹${item.amc.toLocaleString()}`}
                    />
                    <div
                      style={{ height: `${onDemandHeightPercent * 1.5}px` }}
                      className="w-full bg-slate-900 transition-all hover:bg-slate-700"
                      title={`On-Demand: ₹${item.onDemand.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Chart 2: Bookings Trend (6 Months) */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Booking Volume Trajectory</h3>
              <p className="text-xs text-slate-500">Gross completed job tickets over time</p>
            </div>
            <Badge variant="success" size="sm">
              +38% vs H1
            </Badge>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-4 border-b border-slate-100">
            {BOOKINGS_TREND_DATA.map((item, idx) => {
              const heightPercent = (item.bookings / maxBookings) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.bookings}
                  </div>
                  <div className="w-full max-w-[32px] flex flex-col items-center justify-end rounded-t-sm overflow-hidden">
                    <div
                      style={{ height: `${heightPercent * 1.5}px` }}
                      className="w-full bg-blue-500 hover:bg-blue-600 transition-all rounded-t-sm"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 mt-2">{item.day}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 4. Category & City Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Category Performance */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Service Category Split</h3>
              <p className="text-xs text-slate-500">Share of bookings and total revenue contribution</p>
            </div>
            <Badge variant="neutral" size="sm">
              7 Active Lines
            </Badge>
          </div>

          <div className="space-y-3">
            {SERVICE_PERFORMANCE_DATA.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{cat.service}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono text-[11px]">{cat.count} jobs</span>
                    <span className="font-bold text-slate-900">{cat.revenue}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all"
                    style={{ width: `${cat.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* City Breakdown Table */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Geographic Hub Performance</h3>
              <p className="text-xs text-slate-500">Tier-1 city penetration, dispatch count & active fleet</p>
            </div>
            <Badge variant="accent" size="sm">
              National Footprint
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City Hub</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Active Techs</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CITY_PERFORMANCE_DATA.map((city, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{city.city}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{city.bookings.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      Active Hub
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {city.revenue}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-emerald-600 text-xs flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      {city.growth}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* 5. Technician Performance Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Rated Partner Technicians</h3>
            <p className="text-xs text-slate-500">Service quality leaders & on-time rating metrics</p>
          </div>
          <Badge variant="neutral" size="sm">
            Top 5 Performers
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Technician</TableHead>
              <TableHead>City Hub</TableHead>
              <TableHead>Jobs Completed</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>On-Time SLA</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TECHNICIAN_PERFORMANCE_DATA.map((tech, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-bold text-slate-900">{tech.name}</TableCell>
                <TableCell>{tech.city}</TableCell>
                <TableCell className="font-semibold">{tech.jobs}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{tech.rating}</span>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-emerald-600">{tech.onTime}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      tech.status === 'Available'
                        ? 'success'
                        : tech.status === 'On Job'
                        ? 'accent'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {tech.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modals for Booking Details & Assignment */}
      {selectedBookingForDetails && (
        <AdminBookingDetailsModal
          isOpen={!!selectedBookingForDetails}
          onClose={() => setSelectedBookingForDetails(null)}
          booking={
            bookings.find((b) => b.id === selectedBookingForDetails.id) || selectedBookingForDetails
          }
        />
      )}

      {selectedBookingForAssign && (
        <TechnicianSelector
          isOpen={!!selectedBookingForAssign}
          onClose={() => setSelectedBookingForAssign(null)}
          booking={
            bookings.find((b) => b.id === selectedBookingForAssign.id) || selectedBookingForAssign
          }
        />
      )}
    </div>
  );
};
