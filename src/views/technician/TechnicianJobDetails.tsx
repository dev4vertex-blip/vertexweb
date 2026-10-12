import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TechnicianJob } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  CheckSquare,
  Square,
  Lock,
  Navigation,
  FileText,
  UserCheck,
  XCircle,
  Check,
} from 'lucide-react';

interface TechnicianJobDetailsProps {
  job: TechnicianJob;
  onBack: () => void;
}

export const TechnicianJobDetails: React.FC<TechnicianJobDetailsProps> = ({ job, onBack }) => {
  const { updateJobStatus, addToast } = useApp();

  const [enteredOtp, setEnteredOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(
    job.status === 'In Progress' || job.status === 'Completed'
  );
  const [partsChecked, setPartsChecked] = useState<Record<string, boolean>>({});

  // Service report inputs
  const [workPerformed, setWorkPerformed] = useState(
    job.workPerformed || 'Deep coil cleaning, filter descaling, gas pressure check (125 PSI).'
  );
  const [partsUsed, setPartsUsed] = useState(job.partsUsed || 'Capacitor 45uF, Copper flare nut');
  const [serviceNotes, setServiceNotes] = useState(
    job.serviceNotes || 'Indoor airflow restored to optimal CFM. Running current steady at 5.2A.'
  );
  const [customerRemarks, setCustomerRemarks] = useState(
    job.customerRemarks || 'Customer tested cooling and confirmed satisfactory performance.'
  );

  const togglePartCheck = (part: string) => {
    setPartsChecked((prev) => ({ ...prev, [part]: !prev[part] }));
  };

  const handleAcceptJob = () => {
    updateJobStatus(job.id, 'Accepted');
    addToast('Job Accepted', 'You have accepted the service dispatch.', 'success');
  };

  const handleRejectJob = () => {
    updateJobStatus(job.id, 'Assigned');
    addToast('Job Declined', 'Dispatch ticket has been released back to the operations hub.', 'warning');
    onBack();
  };

  const handleEnRoute = () => {
    updateJobStatus(job.id, 'En Route');
    addToast('En Route', 'Customer notified that technician is travelling to service location.', 'info');
  };

  const handleArrived = () => {
    updateJobStatus(job.id, 'Arrived');
    addToast('Arrived at Location', 'Please greet the customer and request doorstep OTP.', 'info');
  };

  const handleVerifyOtp = () => {
    const isMatch = !!job.otp && enteredOtp.trim() === job.otp.trim();
    if (isMatch) {
      setIsOtpVerified(true);
      updateJobStatus(job.id, 'In Progress');
      addToast('OTP Verified Successfully', 'Job is now officially marked In Progress.', 'success');
    } else {
      addToast('Invalid OTP', 'The code entered does not match customer OTP. Please check with customer.', 'error');
    }
  };

  const handleCompleteJob = () => {
    job.workPerformed = workPerformed;
    job.partsUsed = partsUsed;
    job.serviceNotes = serviceNotes;
    job.customerRemarks = customerRemarks;

    updateJobStatus(job.id, 'Completed');
    addToast('Job Completed!', `₹${job.technicianCut} added to today's earnings wallet.`, 'success');
  };

  const getStatusVariant = (status: TechnicianJob['status']): 'default' | 'success' | 'warning' | 'accent' | 'error' => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Arrived':
      case 'En Route':
      case 'Accepted':
        return 'accent';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Jobs</span>
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Job #{job.id}
            </h1>
            <Badge variant={getStatusVariant(job.status)} size="sm">
              {job.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {job.serviceName} • Booking ref: {job.bookingId}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xl font-black text-slate-900">₹{job.technicianCut}</span>
          <span className="text-[10px] text-slate-400 block">Earnings Share</span>
        </div>
      </div>

      {/* Customer & Location Card */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
            <h3 className="text-sm font-bold text-slate-900">{job.customerName}</h3>
            <span className="text-xs text-slate-500">{job.customerPhone}</span>
          </div>

          <a
            href={`tel:${job.customerPhone}`}
            className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Customer</span>
          </a>
        </div>

        <div className="space-y-2 text-xs text-slate-700">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Service Location:</span>
              <span className="text-slate-600">{job.address}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="font-semibold">Schedule: </span>
              <span className="text-slate-600">{job.date} ({job.scheduledTime})</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
          <span className="font-bold text-slate-800 block mb-1">Customer / Dispatch Notes:</span>
          <p className="text-slate-600 leading-relaxed">{job.instructions}</p>
        </div>
      </Card>

      {/* Dispatch Lifecycle Actions */}
      {job.status === 'Assigned' && (
        <Card className="p-5 border-amber-200 bg-amber-50/40">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>New Dispatch Assignment</span>
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            Please review job timing and location before accepting. Accepting will confirm your commitment to the service appointment.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="md"
              variant="outline"
              onClick={handleRejectJob}
              className="text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Decline</span>
            </Button>
            <Button
              size="md"
              variant="primary"
              onClick={handleAcceptJob}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Accept Job</span>
            </Button>
          </div>
        </Card>
      )}

      {job.status === 'Accepted' && (
        <Card className="p-5 border-blue-200 bg-blue-50/40">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Job Accepted & Scheduled</span>
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            When you are departing for the customer location, click below to update tracking status.
          </p>
          <Button
            size="md"
            variant="primary"
            onClick={handleEnRoute}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            <span>Start Travel (Mark En Route)</span>
          </Button>
        </Card>
      )}

      {job.status === 'En Route' && (
        <Card className="p-5 border-blue-200 bg-blue-50/40">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>You Are En Route</span>
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            Customer tracking is active. Once you arrive at the doorstep, update your arrival status.
          </p>
          <Button
            size="md"
            variant="primary"
            onClick={handleArrived}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>I Have Arrived at Location</span>
          </Button>
        </Card>
      )}

      {/* Step 1: Customer Doorstep OTP Verification */}
      {(job.status === 'Arrived' || job.status === 'In Progress' || job.status === 'Completed') && (
        <Card className="p-5 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>1. Doorstep OTP Verification</span>
            </h3>
            {isOtpVerified && (
              <Badge variant="success" size="sm">
                Verified ✓
              </Badge>
            )}
          </div>

          {!isOtpVerified ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Ask the customer for their 4-digit service verification code before opening tools.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter 4-digit customer OTP"
                  className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
                <Button size="sm" variant="primary" onClick={handleVerifyOtp}>
                  Verify & Start Job
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>OTP Verified successfully. Work in progress.</span>
            </div>
          )}
        </Card>
      )}

      {/* Step 2: Parts & Tools Checklist */}
      {job.requiredParts && job.requiredParts.length > 0 && isOtpVerified && (
        <Card className="p-5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-slate-700" />
            <span>2. Spares & Consumables Inspection</span>
          </h3>

          <div className="space-y-2">
            {job.requiredParts.map((part) => {
              const isChecked = !!partsChecked[part];
              return (
                <button
                  key={part}
                  type="button"
                  onClick={() => togglePartCheck(part)}
                  className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                    isChecked
                      ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>{part}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {isChecked ? 'Inspected' : 'Check'}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Step 3: Service Completion Report */}
      {isOtpVerified && (
        <Card className="p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>3. Service Completion Report</span>
          </h3>

          {job.status !== 'Completed' ? (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Work Performed Summary
                </label>
                <textarea
                  rows={2}
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Parts & Consumables Replaced
                </label>
                <input
                  type="text"
                  value={partsUsed}
                  onChange={(e) => setPartsUsed(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Technician Observations & Notes
                </label>
                <textarea
                  rows={2}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Customer Sign-off Remarks
                </label>
                <input
                  type="text"
                  value={customerRemarks}
                  onChange={(e) => setCustomerRemarks(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p><strong>Work Done:</strong> {job.workPerformed || workPerformed}</p>
              <p><strong>Parts Used:</strong> {job.partsUsed || partsUsed}</p>
              <p><strong>Notes:</strong> {job.serviceNotes || serviceNotes}</p>
              <p><strong>Customer Sign-off:</strong> {job.customerRemarks || customerRemarks}</p>
            </div>
          )}
        </Card>
      )}

      {/* Complete Job CTA */}
      <div className="pt-2">
        {job.status !== 'Completed' ? (
          <Button
            size="lg"
            variant="primary"
            disabled={!isOtpVerified}
            onClick={handleCompleteJob}
            className="w-full h-12 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Submit Service Report & Complete Job (₹{job.technicianCut})
          </Button>
        ) : (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
            <h4 className="text-sm font-bold text-emerald-900">Job Finished</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Service invoice closed and ₹{job.technicianCut} credited to your partner wallet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
