import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TechnicianJob } from '../../types';
import { Tabs } from '../../components/ui/Tabs';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Clock, MapPin, ChevronRight, Phone } from 'lucide-react';

interface TechnicianJobsProps {
  onSelectJob: (job: TechnicianJob) => void;
}

export const TechnicianJobs: React.FC<TechnicianJobsProps> = ({ onSelectJob }) => {
  const { technicianJobs } = useApp();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const activeJobs = technicianJobs.filter(
    (j) => j.status === 'Assigned' || j.status === 'En Route' || j.status === 'In Progress'
  );
  const completedJobs = technicianJobs.filter((j) => j.status === 'Completed');

  const displayedJobs = activeTab === 'active' ? activeJobs : completedJobs;

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assigned Jobs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review service requests, verify customer addresses & start work
        </p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'active', label: 'Active / New', count: activeJobs.length },
          { id: 'completed', label: 'Completed History', count: completedJobs.length },
        ]}
      />

      {displayedJobs.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} jobs`}
          description={`You do not have any ${activeTab} assignments currently.`}
        />
      ) : (
        <div className="space-y-3">
          {displayedJobs.map((job) => (
            <Card
              key={job.id}
              className="p-4 sm:p-5 hover:border-slate-300 transition-all cursor-pointer"
              onClick={() => onSelectJob(job)}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">
                      #{job.id}
                    </span>
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
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {job.serviceName}
                  </h3>
                  <span className="text-xs text-slate-500">Customer: {job.customerName}</span>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-slate-900">
                    ₹{job.technicianCut}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Payout Cut</span>
                </div>
              </div>

              <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {job.date} • {job.scheduledTime}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{job.address}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] font-mono">Ref: {job.bookingId}</span>
                <span className="font-semibold text-blue-600 flex items-center gap-1">
                  <span>Open Details</span>
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
