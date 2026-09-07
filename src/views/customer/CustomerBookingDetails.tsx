import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  FileText,
  UserCheck,
  XCircle,
  HelpCircle,
  Star,
} from 'lucide-react';

interface CustomerBookingDetailsProps {
  booking: Booking;
  onBack: () => void;
  onSupportClick: () => void;
  onViewInvoice?: () => void;
  onRateService?: () => void;
}

export const CustomerBookingDetails: React.FC<CustomerBookingDetailsProps> = ({
  booking,
  onBack,
  onSupportClick,
  onViewInvoice,
  onRateService,
}) => {
  const { cancelBooking } = useApp();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const steps = [
    { label: 'Booking Placed', done: true, sub: booking.createdAt },
    {
      label: 'Technician Assigned',
      done:
        booking.status === 'technician_assigned' ||
        booking.status === 'in_progress' ||
        booking.status === 'completed',
      sub: booking.technicianName || 'Assigning partner...',
    },
    {
      label: 'In Progress',
      done: booking.status === 'in_progress' || booking.status === 'completed',
      sub: 'Verification & Diagnosis',
    },
    {
      label: 'Completed',
      done: booking.status === 'completed',
      sub: '30-Day Warranty Active',
    },
  ];

  const handleConfirmCancel = () => {
    cancelBooking(booking.id);
    setShowCancelDialog(false);
    onBack();
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Bookings</span>
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Booking {booking.id}
            </h1>
            <Badge variant="accent" size="sm">
              {booking.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">{booking.serviceName} • {booking.category}</p>
        </div>

        <div className="text-right">
          <span className="text-xl font-extrabold text-slate-900">₹{booking.amount}</span>
          <span className="text-[11px] text-slate-500 block">{booking.paymentStatus}</span>
        </div>
      </div>

      {/* Progress Timeline */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
          Service Status Pipeline
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-colors ${
                  step.done
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {step.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">{step.sub}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* OTP Callout Box */}
      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
        <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-950 block">Start-of-Service OTP</span>
            <span className="text-[11px] text-blue-700">
              Share this 4-digit code with the technician upon doorstep arrival
            </span>
          </div>
          <div className="px-3.5 py-1.5 bg-white rounded-lg border border-blue-300 font-mono text-lg font-black text-blue-950 tracking-widest">
            {booking.otp || '4821'}
          </div>
        </div>
      )}

      {/* Technician Card (if assigned) */}
      {booking.technicianName && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Assigned Technician
                </span>
                <h4 className="text-sm font-bold text-slate-900">{booking.technicianName}</h4>
                <p className="text-xs text-slate-500">
                  Police-verified • 4.9★ Rating • {booking.technicianPhone || '+91 99112 33445'}
                </p>
              </div>
            </div>

            <a
              href={`tel:${booking.technicianPhone || '+919911233445'}`}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Tech</span>
            </a>
          </div>
        </Card>
      )}

      {/* Schedule & Address Details */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Appointment Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block mb-1">Time & Date</span>
            <div className="flex items-center gap-2 text-slate-800">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{booking.scheduledDate}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800 mt-1">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{booking.scheduledSlot}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block mb-1">Service Address</span>
            <div className="flex items-start gap-2 text-slate-800">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                {booking.address.tag} - {booking.address.flat}, {booking.address.area},{' '}
                {booking.address.city} - {booking.address.pincode}
              </span>
            </div>
          </div>
        </div>

        {booking.notes && (
          <div className="pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-semibold block mb-1">Customer Problem Notes:</span>
            <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {booking.notes}
            </p>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSupportClick}
            leftIcon={<HelpCircle className="w-4 h-4" />}
          >
            Need Help?
          </Button>

          {onViewInvoice && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewInvoice}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Tax Invoice
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {booking.status === 'completed' && onRateService && (
            <Button
              variant="primary"
              size="sm"
              onClick={onRateService}
              leftIcon={<Star className="w-4 h-4" />}
            >
              Rate Service
            </Button>
          )}

          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Cancel Booking
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel this booking?"
        description={`Are you sure you want to cancel booking ${booking.id}? A technician may have already been dispatched.`}
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Booking"
        variant="danger"
      />
    </div>
  );
};
