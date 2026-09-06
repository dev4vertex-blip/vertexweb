import React from 'react';
import { BookingStatus } from '../../../types';
import { Badge } from '../../../components/ui/Badge';

interface BookingStatusBadgeProps {
  status: BookingStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normalized = (status || '').toLowerCase().replace('-', '_');

  switch (normalized) {
    case 'pending':
      return <Badge variant="warning" size={size}>Pending Dispatch</Badge>;
    case 'confirmed':
      return <Badge variant="info" size={size}>Confirmed</Badge>;
    case 'assigned':
    case 'technician_assigned':
      return <Badge variant="accent" size={size}>Tech Assigned</Badge>;
    case 'accepted':
      return <Badge variant="accent" size={size}>Accepted</Badge>;
    case 'in_progress':
      return <Badge variant="warning" size={size}>In Progress</Badge>;
    case 'completed':
      return <Badge variant="success" size={size}>Completed</Badge>;
    case 'cancelled':
      return <Badge variant="danger" size={size}>Cancelled</Badge>;
    case 'rescheduled':
      return <Badge variant="neutral" size={size}>Rescheduled</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{status}</Badge>;
  }
};
