import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ServiceItem, Booking } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface CustomerBookServiceProps {
  service: ServiceItem;
  onBack: () => void;
  onBookingComplete: (booking: Booking) => void;
  onAddNewAddress: () => void;
}

export const CustomerBookService: React.FC<CustomerBookServiceProps> = ({
  service,
  onBack,
  onBookingComplete,
  onAddNewAddress,
}) => {
  const { currentCustomer, createBooking } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>('2026-09-08');
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00 AM - 12:00 PM');
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    currentCustomer.activeAddresses[0]?.id || ''
  );
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash After Service' | 'Paid Online'>(
    'Cash After Service'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dates = [
    { label: 'Today', sub: '7 Sep', value: '2026-09-07' },
    { label: 'Tomorrow', sub: '8 Sep', value: '2026-09-08' },
    { label: 'Wed', sub: '9 Sep', value: '2026-09-09' },
    { label: 'Thu', sub: '10 Sep', value: '2026-09-10' },
  ];

  const slots = [
    { time: '09:00 AM - 11:00 AM', tag: 'Morning' },
    { time: '11:00 AM - 01:00 PM', tag: 'Midday' },
    { time: '02:00 PM - 04:00 PM', tag: 'Afternoon' },
    { time: '04:00 PM - 06:00 PM', tag: 'Evening' },
  ];

  const selectedAddress =
    currentCustomer.activeAddresses.find((a) => a.id === selectedAddressId) ||
    currentCustomer.activeAddresses[0];

  const handleConfirmBooking = () => {
    if (!selectedAddress) return;
    setIsSubmitting(true);

    setTimeout(() => {
      const created = createBooking({
        serviceId: service.id,
        serviceName: service.name,
        category: service.category,
        customerId: currentCustomer.id,
        customerName: currentCustomer.name,
        customerPhone: currentCustomer.phone,
        address: selectedAddress,
        scheduledDate: selectedDate,
        scheduledSlot: selectedSlot,
        amount: service.price,
        paymentStatus: paymentMethod,
        notes: notes.trim() || undefined,
      });
      setIsSubmitting(false);
      onBookingComplete(created);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to {service.name}</span>
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Schedule Service</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select date, convenient time slot, and service address
        </p>
      </div>

      {/* Selected service summary pill */}
      <Card className="p-4 bg-slate-50/70 flex items-center justify-between border-slate-200">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Selected Service
          </span>
          <h3 className="text-sm font-bold text-slate-900">{service.name}</h3>
          <span className="text-xs text-slate-500">{service.category} • ~{service.durationMinutes} mins</span>
        </div>
        <div className="text-right">
          <span className="text-base font-extrabold text-slate-900">₹{service.price}</span>
          <span className="text-[10px] text-slate-400 block">Flat upfront rate</span>
        </div>
      </Card>

      {/* 1. Date Selection */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>1. Select Service Date</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {dates.map((d) => {
            const isSelected = selectedDate === d.value;
            return (
              <button
                key={d.value}
                onClick={() => setSelectedDate(d.value)}
                className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                }`}
              >
                <span className="text-xs font-bold block">{d.label}</span>
                <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {d.sub}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. Slot Selection */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>2. Select Time Window</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {slots.map((s) => {
            const isSelected = selectedSlot === s.time;
            return (
              <button
                key={s.time}
                onClick={() => setSelectedSlot(s.time)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{s.time}</span>
                  <span className="text-[11px] text-slate-500">{s.tag} Slot</span>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 3. Address Selection */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>3. Service Location</span>
          </h3>
          <button
            onClick={onAddNewAddress}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Address</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {currentCustomer.activeAddresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <button
                key={addr.id}
                onClick={() => setSelectedAddressId(addr.id)}
                className={`w-full p-3.5 rounded-lg border text-left transition-all cursor-pointer flex items-start justify-between ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" size="sm">
                      {addr.type}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900">{addr.tag}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {addr.flat}, {addr.area}, {addr.city} - {addr.pincode}
                  </p>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-slate-900 mt-0.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 4. Notes and Instructions */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-700" />
          <span>Special Instructions / Problem Details (Optional)</span>
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Master bedroom split AC dripping water on right side, please bring 1/2 inch drainage pipe..."
          rows={3}
          className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 placeholder:text-slate-400 text-slate-800"
        />
      </Card>

      {/* 5. Payment Mode Selection */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Payment Preference
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('Cash After Service')}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              paymentMethod === 'Cash After Service'
                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                : 'border-slate-200 bg-white'
            }`}
          >
            <span className="text-xs font-bold text-slate-900 block">
              Pay After Service (Recommended)
            </span>
            <span className="text-[11px] text-slate-500">
              Pay cash or UPI directly to technician once satisfied
            </span>
          </button>

          <button
            onClick={() => setPaymentMethod('Paid Online')}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              paymentMethod === 'Paid Online'
                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                : 'border-slate-200 bg-white'
            }`}
          >
            <span className="text-xs font-bold text-slate-900 block">
              Prepay Online (Demo)
            </span>
            <span className="text-[11px] text-slate-500">
              Instant digital invoice & contactless completion
            </span>
          </button>
        </div>
      </Card>

      {/* Bill Details & Confirm */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Service Base Cost:</span>
          <span>₹{service.price}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Visiting & Safety Protocol Fee:</span>
          <span className="text-emerald-600 font-bold">FREE</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Applicable GST (18% included):</span>
          <span>₹{Math.round(service.price * 0.18)}</span>
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 block">Total Amount</span>
            <span className="text-[11px] text-slate-400">Guaranteed 30-day warranty included</span>
          </div>
          <span className="text-2xl font-black text-slate-900">₹{service.price}</span>
        </div>

        <Button
          onClick={handleConfirmBooking}
          isLoading={isSubmitting}
          className="w-full h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white mt-2"
        >
          Confirm & Schedule Booking
        </Button>
      </div>
    </div>
  );
};
