import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TechnicianUser, Booking } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { BookingStatusBadge } from './BookingStatusBadge';
import {
  Wrench,
  Star,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  ShieldCheck,
} from 'lucide-react';

interface AdminTechnicianDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician: TechnicianUser;
  onSelectBooking?: (booking: Booking) => void;
}

export const AdminTechnicianDetailsModal: React.FC<AdminTechnicianDetailsModalProps> = ({
  isOpen,
  onClose,
  technician,
  onSelectBooking,
}) => {
  const { bookings, updateTechnicianStatus } = useApp();
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'>(
    technician.status || 'ACTIVE'
  );
  const [isConfirmChangeOpen, setIsConfirmChangeOpen] = useState(false);

  const techBookings = bookings.filter((b) => b.technicianId === technician.id);
  const activeBookings = techBookings.filter(
    (b) =>
      b.status === 'assigned' ||
      b.status === 'technician_assigned' ||
      b.status === 'accepted' ||
      b.status === 'in_progress'
  );
  const completedBookings = techBookings.filter((b) => b.status === 'completed');

  const handleApplyStatus = () => {
    updateTechnicianStatus(technician.id, selectedStatus);
    setIsConfirmChangeOpen(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Partner Fleet Profile"
        description={`Audit credentials, service load & active jobs for ${technician.name}`}
        maxWidth="lg"
      >
        <div className="space-y-5 text-xs text-slate-700 max-h-[80vh] overflow-y-auto pr-1">
          {/* Header Identity Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                {technician.avatar || technician.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base">{technician.name}</h3>
                  <Badge
                    variant={
                      technician.status === 'ON_LEAVE'
                        ? 'danger'
                        : technician.status === 'INACTIVE'
                        ? 'neutral'
                        : 'success'
                    }
                    size="sm"
                  >
                    {(technician.status || 'ACTIVE').replace('_', ' ')}
                  </Badge>
                  {technician.isOnDuty && (
                    <Badge variant="accent" size="sm">Online</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-500 mt-1 flex-wrap">
                  <span className="font-mono text-[11px]">ID: {technician.id}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {technician.rating} Rating
                  </span>
                  <span>•</span>
                  <span>Joined: {technician.joinedDate || 'Jan 2024'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                KYC {technician.kycStatus}
              </Badge>
            </div>
          </div>

          {/* Contact & City Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Phone</span>
              <span className="font-bold text-slate-900">{technician.phone}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">City Hub</span>
              <span className="font-bold text-slate-900">{technician.city}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Experience</span>
              <span className="font-bold text-slate-900">{technician.experience || '5+ Years'}</span>
            </div>
          </div>

          {/* Specializations */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
              Service Specializations
            </span>
            <div className="flex flex-wrap gap-1.5">
              {technician.specialization.map((spec, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-200"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Jobs Done</span>
              <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">{technician.totalJobs}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-amber-600 uppercase font-semibold block">Active Jobs Today</span>
              <span className="text-lg font-extrabold text-amber-600 mt-0.5 block">{activeBookings.length}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Completed In Demo</span>
              <span className="text-lg font-extrabold text-emerald-600 mt-0.5 block">{completedBookings.length}</span>
            </div>
          </div>

          {/* Manage Status Section */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Change Operational Status
            </h4>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE (Receives Assignments)</option>
                <option value="ON_LEAVE">ON LEAVE (Unavailable)</option>
                <option value="INACTIVE">INACTIVE (Deactivated)</option>
              </select>
              <Button
                size="sm"
                variant="primary"
                disabled={selectedStatus === (technician.status || 'ACTIVE')}
                onClick={() => setIsConfirmChangeOpen(true)}
              >
                Update Status
              </Button>
            </div>
          </div>

          {/* Current Active Jobs */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Active Job Allocations ({activeBookings.length})
            </h4>

            {activeBookings.length === 0 ? (
              <p className="text-slate-500 text-center py-3">No active jobs assigned at present.</p>
            ) : (
              <div className="space-y-2">
                {activeBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">#{b.id}</span>
                        <BookingStatusBadge status={b.status} size="sm" />
                      </div>
                      <span className="font-semibold text-slate-800 block mt-0.5">{b.serviceName}</span>
                      <span className="text-[11px] text-slate-500">
                        {b.customerName} • {b.scheduledDate} ({b.scheduledSlot})
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

          {/* Past Completed Jobs */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Completed History ({completedBookings.length})
            </h4>

            {completedBookings.length === 0 ? (
              <p className="text-slate-500 text-center py-3">No completed jobs in current session.</p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {completedBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">#{b.id}</span>
                        <BookingStatusBadge status={b.status} size="sm" />
                      </div>
                      <span className="font-semibold text-slate-800 block mt-0.5">{b.serviceName}</span>
                      <span className="text-[11px] text-slate-400">
                        {b.customerName} • ₹{b.amount}
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

      {isConfirmChangeOpen && (
        <ConfirmDialog
          isOpen={isConfirmChangeOpen}
          onClose={() => setIsConfirmChangeOpen(false)}
          onConfirm={handleApplyStatus}
          title="Update Technician Fleet Status"
          description={
            activeBookings.length > 0 && selectedStatus !== 'ACTIVE'
              ? `Warning: ${technician.name} currently has ${activeBookings.length} active job(s). Changing status to ${selectedStatus.replace('_', ' ')} will not reassign their current active jobs.`
              : `Confirm changing ${technician.name}'s status to ${selectedStatus.replace('_', ' ')}?`
          }
          confirmText="Yes, Update Status"
          variant={selectedStatus === 'ACTIVE' ? 'primary' : 'warning'}
        />
      )}
    </>
  );
};
