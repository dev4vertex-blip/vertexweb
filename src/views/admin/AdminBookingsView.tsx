import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, BookingStatus } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { BookingStatusBadge } from './components/BookingStatusBadge';
import { AdminBookingDetailsModal } from './components/AdminBookingDetailsModal';
import { TechnicianSelector } from './components/TechnicianSelector';
import {
  Search,
  Filter,
  Eye,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Wrench,
  RotateCcw,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';

export const AdminBookingsView: React.FC = () => {
  const { bookings, allTechnicians } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');

  // Modals state
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<Booking | null>(null);

  // Extract unique cities
  const uniqueCities = Array.from(new Set(bookings.map((b) => b.address.city))).filter(Boolean);

  const filteredBookings = bookings.filter((b) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      b.id.toLowerCase().includes(searchLower) ||
      b.customerName.toLowerCase().includes(searchLower) ||
      (b.customerPhone && b.customerPhone.toLowerCase().includes(searchLower)) ||
      b.serviceName.toLowerCase().includes(searchLower) ||
      (b.technicianName && b.technicianName.toLowerCase().includes(searchLower)) ||
      b.address.city.toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === 'All' ||
      b.status.toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter.toLowerCase() === 'assigned' &&
        (b.status === 'assigned' || b.status === 'technician_assigned'));

    const matchesCity = cityFilter === 'All' || b.address.city === cityFilter;

    let matchesDate = true;
    if (dateFilter === 'Today') {
      matchesDate = b.scheduledDate.toLowerCase().includes('today') || b.scheduledDate.includes('2025-05-18');
    } else if (dateFilter === 'Tomorrow') {
      matchesDate = b.scheduledDate.toLowerCase().includes('tomorrow');
    }

    return matchesSearch && matchesStatus && matchesCity && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCityFilter('All');
    setDateFilter('All');
  };

  const hasActiveFilters =
    searchTerm !== '' || statusFilter !== 'All' || cityFilter !== 'All' || dateFilter !== 'All';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Bookings Dispatch & Management</h2>
          <p className="text-xs text-slate-500">
            Monitor incoming requests, assign field partners, and control the operational lifecycle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-600 font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
            Showing <strong className="text-slate-900">{filteredBookings.length}</strong> of{' '}
            <strong className="text-slate-900">{bookings.length}</strong> bookings
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3 border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <Input
              placeholder="Search booking ID, customer, technician, service, phone, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* City dropdown */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All City Hubs</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Date filter dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Dates</option>
              <option value="Today">Scheduled Today</option>
              <option value="Tomorrow">Tomorrow</option>
            </select>

            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
            Status:
          </span>
          {[
            { key: 'All', label: 'All' },
            { key: 'pending', label: 'Pending Dispatch' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'assigned', label: 'Assigned' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter.toLowerCase() === tab.key.toLowerCase()
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Bookings Table View (Desktop) / Cards (Mobile) */}
      <Card className="overflow-hidden border-slate-200">
        {filteredBookings.length === 0 ? (
          <EmptyState
            title="No Bookings Found"
            description="No service requests match the current search keywords or status filter."
            actionLabel="Reset Filters"
            onAction={clearFilters}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service & Category</TableHead>
                  <TableHead>Scheduled Slot</TableHead>
                  <TableHead>Assigned Partner</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const hasTech = Boolean(booking.technicianName);
                  return (
                    <TableRow key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono font-bold text-slate-900 text-xs">
                        #{booking.id}
                        <span className="block text-[10px] text-slate-400 font-sans font-normal">
                          {booking.createdAt}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{booking.customerName}</div>
                        <div className="text-[11px] text-slate-500">{booking.customerPhone}</div>
                        <div className="text-[10px] text-slate-400">
                          {booking.address.city} ({booking.address.tag})
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-slate-800 text-xs">
                          {booking.serviceName}
                        </div>
                        <div className="text-[10px] text-slate-500">{booking.category}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800">
                          {booking.scheduledDate}
                        </div>
                        <div className="text-[11px] text-slate-500">{booking.scheduledSlot}</div>
                      </TableCell>

                      <TableCell>
                        {hasTech ? (
                          <div>
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                              <Wrench className="w-3 h-3 text-blue-600" />
                              {booking.technicianName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {booking.technicianPhone}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-amber-600">Unassigned</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[11px] px-2 py-0 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                              onClick={() => setSelectedBookingForAssign(booking)}
                            >
                              Assign
                            </Button>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="font-extrabold text-slate-900 text-xs">
                        ₹{booking.amount}
                        <span className="block text-[10px] font-normal text-slate-400">
                          {booking.paymentStatus}
                        </span>
                      </TableCell>

                      <TableCell>
                        <BookingStatusBadge status={booking.status} size="sm" />
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBookingForDetails(booking)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Inspect
                          </Button>
                          {hasTech ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedBookingForAssign(booking)}
                            >
                              Reassign
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setSelectedBookingForAssign(booking)}
                            >
                              Assign
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Booking Details Modal */}
      {selectedBookingForDetails && (
        <AdminBookingDetailsModal
          isOpen={!!selectedBookingForDetails}
          onClose={() => setSelectedBookingForDetails(null)}
          booking={
            bookings.find((b) => b.id === selectedBookingForDetails.id) || selectedBookingForDetails
          }
        />
      )}

      {/* Technician Selector Modal */}
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
