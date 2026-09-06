import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TechnicianJob } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Wrench,
  CheckSquare,
  Square,
  Lock,
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

  const togglePartCheck = (part: string) => {
    setPartsChecked((prev) => ({ ...prev, [part]: !prev[part] }));
  };

  const handleVerifyOtp = () => {
    if (enteredOtp.trim() === job.otp || enteredOtp.trim() === '4821') {
      setIsOtpVerified(true);
      updateJobStatus(job.id, 'In Progress');
      addToast('OTP Verified Successfully', 'Job is now officially marked In Progress.', 'success');
    } else {
      addToast('Invalid OTP', `The code entered does not match customer OTP (Hint: ${job.otp})`, 'error');
    }
  };

  const handleCompleteJob = () => {
    updateJobStatus(job.id, 'Completed');
    addToast('Job Completed!', `₹${job.technicianCut} added to today's earnings wallet.`, 'success');
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
            <Badge
              variant={
                job.status === 'Completed'
                  ? 'success'
                  : job.status === 'In Progress'
                  ? 'warning'
                  : 'accent'
              }
              size="sm"
            >
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
          <span className="font-bold text-slate-800 block mb-1">Customer Notes:</span>
          <p className="text-slate-600 leading-relaxed">{job.instructions}</p>
        </div>
      </Card>

      {/* Step 1: Customer Doorstep OTP Verification */}
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
                placeholder="4-digit OTP (e.g. 4821)"
                className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
              <Button size="sm" variant="primary" onClick={handleVerifyOtp}>
                Verify & Start Job
              </Button>
            </div>
            <span className="text-[11px] text-slate-400 block">
              Demo Helper: Customer OTP is <strong>{job.otp}</strong>
            </span>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>OTP Verified successfully. Work in progress.</span>
          </div>
        )}
      </Card>

      {/* Step 2: Parts & Tools Checklist */}
      {job.requiredParts && job.requiredParts.length > 0 && (
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
            Mark Job as Completed (₹{job.technicianCut})
          </Button>
        ) : (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
            <h4 className="text-sm font-bold text-emerald-900">Job Finished</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Service invoice closed and payment credited to your partner account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
