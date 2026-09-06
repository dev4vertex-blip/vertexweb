import React from 'react';
import { Booking } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Home,
  FileCheck,
} from 'lucide-react';

interface CustomerBookingConfirmationProps {
  booking: Booking;
  onGoToBookings: () => void;
  onGoHome: () => void;
  onViewBookingDetails: (booking: Booking) => void;
}

export const CustomerBookingConfirmation: React.FC<CustomerBookingConfirmationProps> = ({
  booking,
  onGoToBookings,
  onGoHome,
  onViewBookingDetails,
}) => {
  return (
    <div className="max-w-xl mx-auto py-6 space-y-6 text-center">
      {/* Success Badge */}
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 animate-in zoom-in-50" />
        </div>
        <Badge variant="success" size="md" className="mb-2">
          BOOKING CONFIRMED
        </Badge>
        <h1 className="text-2xl font-extrabold text-slate-900">Service Scheduled!</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Your request has been dispatched to our nearest certified technician in{' '}
          {booking.address.city}.
        </p>
      </div>

      {/* Confirmation Card */}
      <Card className="p-6 text-left space-y-4 border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Booking Reference
            </span>
            <span className="text-sm font-black text-slate-900">{booking.id}</span>
          </div>
          <Badge variant="accent" size="sm">
            {booking.paymentStatus}
          </Badge>
        </div>

        {/* OTP Verification callout */}
        <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-950 block">Start-of-Service OTP</span>
            <span className="text-[11px] text-blue-700">
              Share only with the technician upon arrival
            </span>
          </div>
          <div className="px-3 py-1.5 bg-white rounded-lg border border-blue-300 font-mono text-base font-black text-blue-900 tracking-widest">
            {booking.otp || '4821'}
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 pt-2 text-xs">
          <div className="flex items-start gap-3 text-slate-700">
            <FileCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-900">{booking.serviceName}</span>
              <span className="text-slate-500 block">{booking.category}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">{booking.scheduledDate}</span>
              <span className="text-slate-500 block">{booking.scheduledSlot}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 text-slate-700">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">{booking.address.tag}</span>
              <span className="text-slate-500 block">
                {booking.address.flat}, {booking.address.area}, {booking.address.city}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-600">Total Amount:</span>
          <span className="text-base font-extrabold text-slate-900">₹{booking.amount}</span>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
        <Button
          size="md"
          variant="outline"
          onClick={onGoHome}
          className="w-full sm:w-auto"
          leftIcon={<Home className="w-4 h-4" />}
        >
          Return to Home
        </Button>

        <Button
          size="md"
          variant="primary"
          onClick={() => onViewBookingDetails(booking)}
          className="w-full sm:w-auto"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Track Booking Details
        </Button>
      </div>
    </div>
  );
};
