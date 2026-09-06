import React, { useState } from 'react';
import { AMCContract } from '../../types';
import { Button } from '../ui/Button';
import { X, Calendar, Clock, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface AMCServiceRequestModalProps {
  contract: AMCContract;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: {
    serviceName: string;
    scheduledDate: string;
    timeSlot: string;
    problemDescription: string;
  }) => void;
}

const TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
];

export const AMCServiceRequestModal: React.FC<AMCServiceRequestModalProps> = ({
  contract,
  isOpen,
  onClose,
  onSubmit,
}) => {
  // Default scheduled date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [scheduledDate, setScheduledDate] = useState(defaultDateStr);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [serviceType, setServiceType] = useState('Routine AMC Maintenance Checkup');
  const [problemDescription, setProblemDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      onSubmit({
        serviceName: `${contract.planName} - ${serviceType}`,
        scheduledDate,
        timeSlot,
        problemDescription: problemDescription.trim() || 'Routine preventive inspection and performance tuning.',
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Covered under AMC
              </span>
              <span className="font-mono text-xs text-slate-500">{contract.contractNumber}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Request AMC Service</h3>
            <p className="text-xs text-slate-500">
              {contract.visitsRemaining} of {contract.visitsIncluded} service visits remaining
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Service Nature */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Service Type
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="Routine AMC Maintenance Checkup">Routine Preventive Maintenance Checkup</option>
              <option value="Deep Performance Diagnostic">Deep Diagnostic & Performance Tune-up</option>
              <option value="Filter Cleaning & Sanitation">Filter Cleaning & Chemical Washing</option>
              <option value="Breakdown Repair Support">Breakdown / Emergency Inspection</option>
            </select>
          </div>

          {/* Date and Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={defaultDateStr}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Time Slot
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issue notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Specific Instructions / Observed Issue (Optional)
            </label>
            <textarea
              rows={3}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="e.g. AC cooling feels slightly weak, please clean the outdoor condenser coil."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Zero Cost Guarantee notice */}
          <div className="rounded-lg bg-emerald-50/80 border border-emerald-100 p-3 flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">100% Free Under Contract: </span>
              This visit is included in your active AMC contract. No inspection charge or visit fee applies.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
