import React from 'react';
import { useApp } from '../../context/AppContext';
import { TechnicianJob } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Wrench,
  Star,
  Clock,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Calendar,
  AlertCircle,
  Phone,
  Power,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface TechnicianDashboardProps {
  onSelectJob: (job: TechnicianJob) => void;
  onNavigateToJobs: () => void;
  onNavigateToEarnings: () => void;
  onNavigateToAttendance: () => void;
}

export const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
  onSelectJob,
  onNavigateToJobs,
  onNavigateToEarnings,
  onNavigateToAttendance,
}) => {
  const { currentTechnician, toggleTechnicianDuty, technicianJobs } = useApp();

  const activeJob = technicianJobs.find((j) => j.status === 'In Progress' || j.status === 'Assigned');
  const todayJobs = technicianJobs.filter((j) => j.date.includes('7 Sep') || j.date.includes('Today'));

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Duty Status & Profile Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center border border-slate-700 text-lg">
              {currentTechnician.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white">
                  {currentTechnician.name}
                </h1>
                <Badge variant="success" size="sm">
                  KYC Verified
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentTechnician.specialization.join(' • ')}
              </p>
            </div>
          </div>

          {/* Duty toggle button */}
          <button
            onClick={toggleTechnicianDuty}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
              currentTechnician.isOnDuty
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{currentTechnician.isOnDuty ? 'ON DUTY' : 'OFFLINE'}</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Rating</span>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-extrabold text-white">{currentTechnician.rating}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Jobs Done
            </span>
            <span className="text-sm font-extrabold text-white mt-0.5 block">
              {currentTechnician.totalJobs}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              On-Time SLA
            </span>
            <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">97.4%</span>
          </div>
        </div>
      </div>

      {/* Today's Earnings Snapshot */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="p-4 bg-white border-slate-200 cursor-pointer hover:border-slate-300"
          onClick={onNavigateToEarnings}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Today's Payout
          </span>
          <div className="text-xl font-black text-slate-900 mt-0.5">₹1,050</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            2 completed jobs
          </span>
        </Card>

        <Card
          className="p-4 bg-white border-slate-200 cursor-pointer hover:border-slate-300"
          onClick={onNavigateToAttendance}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Today's Punch
          </span>
          <div className="text-xl font-black text-slate-900 mt-0.5">08:45 AM</div>
          <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            Check-out at 06:30 PM
          </span>
        </Card>
      </div>

      {/* Active Ongoing Job Card */}
      {activeJob ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Current Assigned Task</span>
            </h2>
            <button
              onClick={onNavigateToJobs}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View All Jobs ({technicianJobs.length})
            </button>
          </div>

          <Card className="p-5 border-blue-200 bg-white shadow-xs">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    #{activeJob.id}
                  </span>
                  <Badge variant={activeJob.status === 'In Progress' ? 'warning' : 'accent'} size="sm">
                    {activeJob.status}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {activeJob.serviceName}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-base font-extrabold text-slate-900">
                  ₹{activeJob.technicianCut}
                </span>
                <span className="text-[10px] text-slate-400 block">Your Cut</span>
              </div>
            </div>

            <div className="py-3 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeJob.scheduledTime}</span>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{activeJob.address}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 mt-2 text-slate-600">
                <strong className="text-slate-800">Issue Note: </strong>
                {activeJob.instructions}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <a
                href={`tel:${activeJob.customerPhone}`}
                className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Customer</span>
              </a>

              <Button
                size="sm"
                variant="primary"
                onClick={() => onSelectJob(activeJob)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Open Job Workpad
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-6 text-center bg-slate-50 border-dashed">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-900">No Pending Tasks</h4>
          <p className="text-xs text-slate-500 mt-1">
            You have completed all assigned tasks for this slot. Keep duty online to receive new dispatches.
          </p>
        </Card>
      )}

      {/* Safety & Protocol Banner */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
        <div className="text-xs">
          <span className="font-bold text-slate-900 block">Vertex Safety Standard 4.0</span>
          <span className="text-slate-500">
            Always wear insulated gloves & safety shoes. Ask customer for OTP before initiating repair.
          </span>
        </div>
      </div>
    </div>
  );
};
