import React from 'react';
import { AMCServiceVisit } from '../../types';
import { AMCStatusBadge } from './AMCStatusBadge';
import { Calendar, Clock, User, Wrench, FileText, CheckCircle2, MessageSquare } from 'lucide-react';

interface AMCVisitTimelineProps {
  visits: AMCServiceVisit[];
  emptyMessage?: string;
  onCompleteVisit?: (visit: AMCServiceVisit) => void;
  showAdminControls?: boolean;
}

export const AMCVisitTimeline: React.FC<AMCVisitTimelineProps> = ({
  visits,
  emptyMessage = 'No service visits recorded yet.',
  onCompleteVisit,
  showAdminControls = false,
}) => {
  if (visits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
        <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4 before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
      {visits.map((visit, index) => {
        const isCompleted = visit.status === 'COMPLETED';

        return (
          <div key={visit.id} className="relative flex items-start gap-4">
            {/* Dot on timeline */}
            <div
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                isCompleted
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-blue-500 text-blue-600'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Content card */}
            <div className="flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Visit {visit.visitNumber} of {visit.totalVisits}
                    </span>
                    <AMCStatusBadge status={visit.status} size="sm" />
                  </div>
                  <h5 className="text-base font-bold text-slate-900 mt-0.5">{visit.serviceName}</h5>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <div className="font-semibold text-slate-800 flex items-center justify-end gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{visit.scheduledDate}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{visit.timeSlot}</span>
                  </div>
                </div>
              </div>

              {/* Technician info */}
              {visit.technicianName && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3 bg-slate-50 px-2.5 py-1.5 rounded-md w-fit">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Technician: <strong>{visit.technicianName}</strong>
                    {visit.technicianPhone ? ` (${visit.technicianPhone})` : ''}
                  </span>
                </div>
              )}

              {/* Work details if completed */}
              {isCompleted && (
                <div className="mt-3 space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-700">
                  {visit.workPerformed && (
                    <div>
                      <span className="font-semibold text-slate-900 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-slate-500" /> Work Performed:
                      </span>
                      <p className="mt-0.5 text-slate-600 pl-4">{visit.workPerformed}</p>
                    </div>
                  )}

                  {visit.partsUsed && visit.partsUsed !== 'None' && (
                    <div>
                      <span className="font-semibold text-slate-900 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500" /> Parts Used:
                      </span>
                      <p className="mt-0.5 text-slate-600 pl-4">{visit.partsUsed}</p>
                    </div>
                  )}

                  {visit.serviceNotes && (
                    <div>
                      <span className="font-semibold text-slate-900 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500" /> Technician Notes:
                      </span>
                      <p className="mt-0.5 text-slate-600 pl-4">{visit.serviceNotes}</p>
                    </div>
                  )}

                  {visit.customerRemarks && (
                    <div>
                      <span className="font-semibold text-slate-900 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> Customer Remarks:
                      </span>
                      <p className="mt-0.5 text-slate-600 pl-4 italic">"{visit.customerRemarks}"</p>
                    </div>
                  )}

                  {visit.completedAt && (
                    <div className="text-[11px] text-slate-400 pl-4 pt-1">
                      Completed at {visit.completedAt}
                    </div>
                  )}
                </div>
              )}

              {/* Action button if pending/scheduled & admin controls allowed */}
              {!isCompleted && showAdminControls && onCompleteVisit && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onCompleteVisit(visit)}
                    className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Visit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
