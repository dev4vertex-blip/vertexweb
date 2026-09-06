import React from 'react';
import { AMCStatus, AMCVisitStatus } from '../../types';
import { Badge } from '../ui/Badge';
import { CheckCircle2, Clock, AlertTriangle, XCircle, PauseCircle, Calendar } from 'lucide-react';

interface AMCStatusBadgeProps {
  status: AMCStatus | AMCVisitStatus | string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const AMCStatusBadge: React.FC<AMCStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'ACTIVE':
      return (
        <Badge variant="success" size={size} className="gap-1 font-medium">
          {showIcon && <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Active</span>
        </Badge>
      );
    case 'EXPIRING_SOON':
      return (
        <Badge variant="warning" size={size} className="gap-1 font-medium bg-amber-50 text-amber-800 border-amber-300">
          {showIcon && <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Expiring Soon</span>
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="warning" size={size} className="gap-1 font-medium">
          {showIcon && <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Pending</span>
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge variant="danger" size={size} className="gap-1 font-medium">
          {showIcon && <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Expired</span>
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="neutral" size={size} className="gap-1 font-medium">
          {showIcon && <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Cancelled</span>
        </Badge>
      );
    case 'SUSPENDED':
      return (
        <Badge variant="neutral" size={size} className="gap-1 font-medium bg-slate-100 text-slate-700">
          {showIcon && <PauseCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Suspended</span>
        </Badge>
      );
    case 'SCHEDULED':
      return (
        <Badge variant="info" size={size} className="gap-1 font-medium">
          {showIcon && <Calendar className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Scheduled</span>
        </Badge>
      );
    case 'ASSIGNED':
      return (
        <Badge variant="accent" size={size} className="gap-1 font-medium">
          {showIcon && <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Assigned</span>
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge variant="warning" size={size} className="gap-1 font-medium">
          {showIcon && <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>In Progress</span>
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="success" size={size} className="gap-1 font-medium">
          {showIcon && <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          <span>Completed</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size={size}>
          {status}
        </Badge>
      );
  }
};
