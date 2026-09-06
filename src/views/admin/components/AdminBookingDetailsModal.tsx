import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Booking, BookingStatus } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { BookingStatusBadge } from './BookingStatusBadge';
import { TechnicianSelector } from './TechnicianSelector';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Wrench,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  UserCheck,
  FileText,
  KeyRound,
} from 'lucide-react';

interface AdminBookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
}

export const AdminBookingDetailsModal: React.FC<AdminBookingDetailsModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const { updateBookingStatus, cancelBooking, allTechnicians } = useApp();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Status Change State
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>(booking.status);
  const [statusNote, setStatusNote] = useState('');
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);

  const assignedTech = allTechnicians.find((t) => t.id === booking.technicianId);

  const handleApplyStatusChange = () => {
    if (selectedStatus === booking.status) return;
    const success = updateBookingStatus(booking.id, selectedStatus, statusNote);
    if (success) {
      setIsStatusConfirmOpen(false);
      setStatusNote('');
    }
  };

  const handleConfirmCancel = () => {
    cancelBooking(booking.id);
    setIsCancelConfirmOpen(false);
  };

  // Construct status timeline
  const statusSteps: { key: BookingStatus; label: string; desc: string }[] = [
    { key: 'pending', label: 'Booking Created', desc: 'Customer placed service request' },
    { key: 'confirmed', label: 'Confirmed', desc: 'Slot & address verified by ops' },
    { key: 'assigned', label: 'Technician Assigned', desc: 'Partner dispatched to booking' },
    { key: 'accepted', label: 'Accepted / En Route', desc: 'Partner en route to customer premise' },
    { key: 'in_progress', label: 'In Progress', desc: 'Job started with OTP verification' },
    { key: 'completed', label: 'Completed', desc: 'Service finished & closed' },
  ];

  const getStepStatus = (stepKey: BookingStatus) => {
    const order: BookingStatus[] = [
      'pending',
      'confirmed',
      'assigned',
      'accepted',
      'in_progress',
      'completed',
    ];

    const currentNormalized =
      booking.status === 'technician_assigned' ? 'assigned' : booking.status;
    const currentIndex = order.indexOf(currentNormalized);
    const stepIndex = order.indexOf(stepKey);

    if (booking.status === 'cancelled') {
      return { isDone: stepIndex === 0, isCurrent: false, isCancelled: true };
    }

    return {
      isDone: currentIndex >= stepIndex && currentIndex !== -1,
      isCurrent: currentIndex === stepIndex,
      isCancelled: false,
    };
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Booking #${booking.id}`}
        description={`Created ${booking.createdAt} • ${booking.serviceName}`}
        maxWidth="xl"
      >
        <div className="space-y-5 text-xs text-slate-700 max-h-[80vh] overflow-y-auto pr-1">
          {/* Top Status & Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-slate-500 font-semibold">Current State:</span>
              <BookingStatusBadge status={booking.status} size="md" />
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Amount</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  ₹{booking.amount}{' '}
                  <span className="text-[11px] font-normal text-slate-500">
                    ({booking.paymentStatus})
                  </span>
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-slate-400 block text-[10px]">Security OTP</span>
                <span className="font-mono font-bold text-slate-900 text-sm tracking-wider">
                  {booking.otp || '4821'}
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Grid: Customer & Booking Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Customer Information
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">ID: {booking.customerId}</span>
              </div>

              <div>
                <span className="font-bold text-slate-900 text-sm block">{booking.customerName}</span>
                <div className="flex items-center gap-3 mt-1 text-slate-600">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {booking.customerPhone}
                  </span>
                  {booking.customerEmail && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {booking.customerEmail}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                  Service Address ({booking.address.tag})
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {booking.address.flat}, {booking.address.area}, {booking.address.city} -{' '}
                  {booking.address.pincode}
                </p>
              </div>
            </div>

            {/* Service & Schedule */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Service & Schedule
                </h4>
                <Badge variant="neutral" size="sm">{booking.category}</Badge>
              </div>

              <div>
                <span className="font-bold text-slate-900 text-sm block">{booking.serviceName}</span>
                <div className="flex items-center gap-3 mt-1 text-slate-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {booking.scheduledDate}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {booking.scheduledSlot}
                  </span>
                </div>
              </div>

              {booking.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                    Customer Problem Notes
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                    "{booking.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Technician Section */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                Technician Assignment
              </h4>
              <Button
                size="sm"
                variant={booking.technicianName ? 'outline' : 'primary'}
                onClick={() => setIsAssignModalOpen(true)}
              >
                {booking.technicianName ? 'Reassign Partner' : 'Assign Technician'}
              </Button>
            </div>

            {booking.technicianName ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {booking.technicianName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      {booking.technicianName}
                    </span>
                    <div className="flex items-center gap-3 text-slate-500 mt-0.5">
                      <span>{booking.technicianPhone}</span>
                      {booking.technicianRating && (
                        <span className="font-bold text-amber-600">
                          ★ {booking.technicianRating}
                        </span>
                      )}
                      {assignedTech && (
                        <span className="text-slate-400 font-mono">
                          ({assignedTech.city} Hub)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">Partner Connected</Badge>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-800 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No technician assigned yet. Immediate dispatch recommended.</span>
                </div>
                <Button size="sm" variant="primary" onClick={() => setIsAssignModalOpen(true)}>
                  Assign Now
                </Button>
              </div>
            )}
          </div>

          {/* Operational Workflow Status Transition */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              Manage Operational Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-1">
                <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                  Change Status To
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as BookingStatus)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="assigned">Assigned</option>
                  <option value="accepted">Accepted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                  Internal Audit Note (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Verified with technician, parts dispatched..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={selectedStatus === booking.status}
                    onClick={() => setIsStatusConfirmOpen(true)}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Status Timeline */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Service Status Lifecycle
            </h4>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {statusSteps.map((step) => {
                const { isDone, isCurrent, isCancelled } = getStepStatus(step.key);
                const matchingHistory = booking.statusHistory?.find(
                  (h) => h.status.toLowerCase() === step.key.toLowerCase()
                );

                return (
                  <div key={step.key} className="flex items-start gap-3 relative z-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isCancelled
                          ? 'bg-rose-100 text-rose-600 border border-rose-300'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : '•'}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold text-xs ${
                            isCurrent ? 'text-blue-700 font-bold' : isDone ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                        {matchingHistory && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {matchingHistory.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {matchingHistory?.note || step.desc}
                      </p>
                      {matchingHistory?.updatedBy && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          By: {matchingHistory.updatedBy}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {booking.status !== 'cancelled' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsCancelConfirmOpen(true)}
              >
                Cancel Booking
              </Button>
            )}
            <Button variant="primary" size="sm" className="ml-auto" onClick={onClose}>
              Close Details
            </Button>
          </div>
        </div>
      </Modal>

      {/* Technician Assignment Selector Modal */}
      {isAssignModalOpen && (
        <TechnicianSelector
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          booking={booking}
        />
      )}

      {/* Confirm Status Change Dialog */}
      {isStatusConfirmOpen && (
        <ConfirmDialog
          isOpen={isStatusConfirmOpen}
          onClose={() => setIsStatusConfirmOpen(false)}
          onConfirm={handleApplyStatusChange}
          title="Confirm Booking Status Update"
          description={`Change Booking #${booking.id} status from "${booking.status.replace('_', ' ')}" to "${selectedStatus.replace('_', ' ')}"?`}
          confirmText="Yes, Update Status"
          variant="primary"
        />
      )}

      {/* Confirm Force Cancellation Dialog */}
      {isCancelConfirmOpen && (
        <ConfirmDialog
          isOpen={isCancelConfirmOpen}
          onClose={() => setIsCancelConfirmOpen(false)}
          onConfirm={handleConfirmCancel}
          title="Cancel Booking"
          description={`Are you sure you want to cancel Booking #${booking.id}? This will notify both customer and assigned technician.`}
          confirmText="Yes, Cancel Booking"
          variant="danger"
        />
      )}
    </>
  );
};
