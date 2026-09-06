import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { CustomerUser, Booking } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { BookingStatusBadge } from './BookingStatusBadge';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Power,
} from 'lucide-react';

interface AdminCustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerUser;
  onSelectBooking?: (booking: Booking) => void;
}

export const AdminCustomerDetailsModal: React.FC<AdminCustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSelectBooking,
}) => {
  const { bookings, updateCustomerStatus } = useApp();
  const [isConfirmToggleOpen, setIsConfirmToggleOpen] = useState(false);

  const customerBookings = bookings.filter((b) => b.customerId === customer.id);
  const totalBookings = customerBookings.length;
  const activeBookings = customerBookings.filter(
    (b) =>
      b.status === 'pending' ||
      b.status === 'confirmed' ||
      b.status === 'assigned' ||
      b.status === 'technician_assigned' ||
      b.status === 'accepted' ||
      b.status === 'in_progress'
  ).length;
  const completedBookings = customerBookings.filter((b) => b.status === 'completed').length;
  const cancelledBookings = customerBookings.filter((b) => b.status === 'cancelled').length;

  const handleToggleStatus = () => {
    const nextStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateCustomerStatus(customer.id, nextStatus);
    setIsConfirmToggleOpen(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Customer Profile & Operations"
        description={`Manage accounts, inspect addresses & booking audit for ${customer.name}`}
        maxWidth="lg"
      >
        <div className="space-y-5 text-xs text-slate-700 max-h-[80vh] overflow-y-auto pr-1">
          {/* Header Identity Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                {customer.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base">{customer.name}</h3>
                  <Badge
                    variant={customer.status === 'INACTIVE' ? 'danger' : 'success'}
                    size="sm"
                  >
                    {customer.status || 'ACTIVE'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-slate-500 mt-1">
                  <span className="font-mono text-[11px]">ID: {customer.id}</span>
                  <span>•</span>
                  <span>Joined: {customer.customerSince || 'Jan 2025'}</span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant={customer.status === 'INACTIVE' ? 'primary' : 'outline'}
              onClick={() => setIsConfirmToggleOpen(true)}
              leftIcon={<Power className="w-3.5 h-3.5" />}
            >
              {customer.status === 'INACTIVE' ? 'Activate Account' : 'Deactivate Account'}
            </Button>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Phone</span>
                <span className="font-bold text-slate-900">{customer.phone}</span>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Email</span>
                <span className="font-bold text-slate-900">{customer.email}</span>
              </div>
            </div>
          </div>

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
              <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">{totalBookings}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-amber-600 uppercase font-semibold block">Active</span>
              <span className="text-lg font-extrabold text-amber-600 mt-0.5 block">{activeBookings}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Completed</span>
              <span className="text-lg font-extrabold text-emerald-600 mt-0.5 block">{completedBookings}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-rose-600 uppercase font-semibold block">Cancelled</span>
              <span className="text-lg font-extrabold text-rose-600 mt-0.5 block">{cancelledBookings}</span>
            </div>
          </div>

          {/* Saved Addresses List */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Saved Addresses ({customer.activeAddresses.length})
            </h4>

            <div className="space-y-2">
              {customer.activeAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{addr.tag}</span>
                      <Badge variant="neutral" size="sm">{addr.type}</Badge>
                      {addr.isDefault && <Badge variant="accent" size="sm">Default</Badge>}
                    </div>
                    <p className="text-slate-600 mt-1 font-medium">
                      {addr.flat}, {addr.area}, {addr.city} - {addr.pincode}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking History List */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Customer Service Requests ({customerBookings.length})
            </h4>

            {customerBookings.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No bookings found for this customer.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {customerBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">#{b.id}</span>
                        <BookingStatusBadge status={b.status} size="sm" />
                      </div>
                      <span className="font-semibold text-slate-800 block mt-0.5">{b.serviceName}</span>
                      <span className="text-[11px] text-slate-400">
                        {b.scheduledDate} • ₹{b.amount}
                      </span>
                    </div>

                    {onSelectBooking && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onClose();
                          onSelectBooking(b);
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {isConfirmToggleOpen && (
        <ConfirmDialog
          isOpen={isConfirmToggleOpen}
          onClose={() => setIsConfirmToggleOpen(false)}
          onConfirm={handleToggleStatus}
          title={customer.status === 'ACTIVE' ? 'Deactivate Customer Account?' : 'Activate Customer Account?'}
          description={
            customer.status === 'ACTIVE'
              ? `Are you sure you want to deactivate ${customer.name}? They will not be able to place new bookings.`
              : `Are you sure you want to re-activate ${customer.name}?`
          }
          confirmText={customer.status === 'ACTIVE' ? 'Yes, Deactivate' : 'Yes, Activate'}
          variant={customer.status === 'ACTIVE' ? 'danger' : 'primary'}
        />
      )}
    </>
  );
};
