import React from 'react';
import { AMCContract } from '../../types';
import { AMCStatusBadge } from './AMCStatusBadge';
import { AMCUsageProgress } from './AMCUsageProgress';
import { Button } from '../ui/Button';
import { Calendar, User, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { computeContractStatus } from '../../data/amcContracts';

interface AMCContractCardProps {
  contract: AMCContract;
  onViewDetails?: (contract: AMCContract) => void;
  onRequestService?: (contract: AMCContract) => void;
  showAdminActions?: boolean;
}

export const AMCContractCard: React.FC<AMCContractCardProps> = ({
  contract,
  onViewDetails,
  onRequestService,
  showAdminActions = false,
}) => {
  const dynamicStatus = computeContractStatus(contract);
  const isActionable = dynamicStatus === 'ACTIVE' || dynamicStatus === 'EXPIRING_SOON';
  const addressText = typeof contract.address === 'string' ? contract.address : `${contract.address.flat}, ${contract.address.city}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-500">{contract.contractNumber}</span>
            <AMCStatusBadge status={dynamicStatus} size="sm" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 mt-1">{contract.planName}</h4>
          <span className="text-xs font-medium text-slate-500">{contract.serviceCategory}</span>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-slate-900">₹{contract.price.toLocaleString()}</div>
          <div className="text-xs text-slate-500">
            Valid until {new Date(contract.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Usage Progress Bar */}
      <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <AMCUsageProgress
          used={contract.visitsUsed}
          total={contract.visitsIncluded}
          size="sm"
        />
      </div>

      {/* Metadata items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
        {contract.nextServiceDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Next Service: <strong className="text-slate-800">{contract.nextServiceDate}</strong>
            </span>
          </div>
        )}
        {contract.assignedTechnicianName && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Technician: <strong className="text-slate-800">{contract.assignedTechnicianName}</strong>
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 sm:col-span-2 text-slate-500 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{addressText}</span>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Created on {new Date(contract.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-2">
          {onRequestService && isActionable && contract.visitsRemaining > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold"
              onClick={() => onRequestService(contract)}
            >
              Request Service
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="primary"
              size="sm"
              className="text-xs font-semibold"
              onClick={() => onViewDetails(contract)}
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
