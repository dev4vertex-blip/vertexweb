import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerUser, Booking } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { AdminCustomerDetailsModal } from './components/AdminCustomerDetailsModal';
import { AdminBookingDetailsModal } from './components/AdminBookingDetailsModal';
import {
  Search,
  MapPin,
  ShieldCheck,
  Mail,
  Phone,
  UserPlus,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  Power,
} from 'lucide-react';

export const AdminCustomersView: React.FC = () => {
  const { allCustomers, bookings, updateCustomerStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUser | null>(null);
  const [selectedBookingForInspect, setSelectedBookingForInspect] = useState<Booking | null>(null);

  const filtered = allCustomers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'ACTIVE' && (c.status === 'ACTIVE' || !c.status)) ||
      (statusFilter === 'INACTIVE' && c.status === 'INACTIVE');

    return matchesSearch && matchesStatus;
  });

  const getCustomerMetrics = (customerId: string) => {
    const custBookings = bookings.filter((b) => b.customerId === customerId);
    const totalSpend = custBookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.amount, 0);
    const activeCount = custBookings.filter(
      (b) =>
        b.status === 'pending' ||
        b.status === 'confirmed' ||
        b.status === 'assigned' ||
        b.status === 'technician_assigned' ||
        b.status === 'accepted' ||
        b.status === 'in_progress'
    ).length;

    return {
      totalBookings: custBookings.length,
      activeCount,
      totalSpend,
    };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Customer Directory & Operations</h2>
          <p className="text-xs text-slate-500">
            Audit customer accounts, registered addresses, and historical service requests
          </p>
        </div>
        <div className="text-xs text-slate-600 font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
          Registered Accounts: <strong className="text-slate-900">{allCustomers.length}</strong>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 space-y-3 border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <Input
              placeholder="Search customer name, email, phone number, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['All', 'ACTIVE', 'INACTIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'All' ? 'All Accounts' : status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="overflow-hidden border-slate-200">
        {filtered.length === 0 ? (
          <EmptyState
            title="No Customers Found"
            description="No customer accounts match the entered query."
            actionLabel="Reset Search"
            onAction={() => {
              setSearchTerm('');
              setStatusFilter('All');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead>Saved Addresses</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Total GMV</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const metrics = getCustomerMetrics(c.id);
                  const isInactive = c.status === 'INACTIVE';

                  return (
                    <TableRow key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {c.id} • Since {c.customerSince || '2024'}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-semibold text-slate-800 block">{c.phone}</span>
                        <span className="text-[11px] text-slate-400">{c.email}</span>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-slate-800 text-xs">
                          {c.activeAddresses.length} saved
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {c.activeAddresses[0]?.city || 'Gurgaon'} (
                          {c.activeAddresses[0]?.tag || 'Home'})
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800">
                          {metrics.totalBookings} Total
                        </div>
                        {metrics.activeCount > 0 ? (
                          <span className="text-[10px] text-amber-600 font-bold">
                            {metrics.activeCount} Active Now
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">0 Active</span>
                        )}
                      </TableCell>

                      <TableCell className="font-extrabold text-slate-900 text-xs">
                        ₹{metrics.totalSpend.toLocaleString()}
                      </TableCell>

                      <TableCell>
                        <Badge variant={isInactive ? 'danger' : 'success'} size="sm">
                          {c.status || 'ACTIVE'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCustomer(c)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Profile
                          </Button>
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

      {/* Customer Profile & Operations Modal */}
      {selectedCustomer && (
        <AdminCustomerDetailsModal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          customer={
            allCustomers.find((c) => c.id === selectedCustomer.id) || selectedCustomer
          }
          onSelectBooking={(booking) => {
            setSelectedBookingForInspect(booking);
          }}
        />
      )}

      {/* Booking Details Modal when opened from customer history */}
      {selectedBookingForInspect && (
        <AdminBookingDetailsModal
          isOpen={!!selectedBookingForInspect}
          onClose={() => setSelectedBookingForInspect(null)}
          booking={
            bookings.find((b) => b.id === selectedBookingForInspect.id) || selectedBookingForInspect
          }
        />
      )}
    </div>
  );
};
