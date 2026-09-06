import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../types';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react';

interface CustomerMyBookingsProps {
  onSelectBooking: (booking: Booking) => void;
  onExploreServices: () => void;
}

export const CustomerMyBookings: React.FC<CustomerMyBookingsProps> = ({
  onSelectBooking,
  onExploreServices,
}) => {
  const { bookings, currentCustomer } = useApp();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');

  const customerBookings = bookings.filter((b) => b.customerId === currentCustomer.id);

  const activeBookings = customerBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'technician_assigned' || b.status === 'in_progress' || b.status === 'pending'
  );
  const completedBookings = customerBookings.filter((b) => b.status === 'completed');
  const cancelledBookings = customerBookings.filter((b) => b.status === 'cancelled');

  const displayedBookings =
    activeTab === 'active'
      ? activeBookings
      : activeTab === 'completed'
      ? completedBookings
      : cancelledBookings;

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="info" size="sm">Confirmed</Badge>;
      case 'technician_assigned':
        return <Badge variant="accent" size="sm">Technician Assigned</Badge>;
      case 'in_progress':
        return <Badge variant="warning" size="sm">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Track active service requests, inspect warranty, and access past invoices
        </p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'active', label: 'Active', count: activeBookings.length },
          { id: 'completed', label: 'Completed', count: completedBookings.length },
          { id: 'cancelled', label: 'Cancelled', count: cancelledBookings.length },
        ]}
      />

      {displayedBookings.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} bookings`}
          description={`You do not have any ${activeTab} service bookings at the moment.`}
          actionLabel="Book a Service"
          onAction={onExploreServices}
        />
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((b) => (
            <Card
              key={b.id}
              className="p-5 hover:border-slate-300 transition-all cursor-pointer"
              onClick={() => onSelectBooking(b)}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      #{b.id}
                    </span>
                    {getStatusBadge(b.status)}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{b.serviceName}</h3>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-slate-900">₹{b.amount}</span>
                  <span className="text-[10px] text-slate-400 block">{b.paymentStatus}</span>
                </div>
              </div>

              <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {b.scheduledDate} • {b.scheduledSlot}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">
                    {b.address.tag} ({b.address.city})
                  </span>
                </div>
              </div>

              {b.technicianName && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-medium text-slate-700">
                      Assigned: <strong className="text-slate-900">{b.technicianName}</strong>
                    </span>
                  </div>
                  {b.otp && (
                    <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                      OTP: {b.otp}
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Booked {b.createdAt}</span>
                <span className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
