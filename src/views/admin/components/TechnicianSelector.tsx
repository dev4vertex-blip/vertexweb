import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Booking, TechnicianUser } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import {
  Search,
  Star,
  Wrench,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
} from 'lucide-react';

interface TechnicianSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onAssigned?: (tech: TechnicianUser) => void;
}

export const TechnicianSelector: React.FC<TechnicianSelectorProps> = ({
  isOpen,
  onClose,
  booking,
  onAssigned,
}) => {
  const { allTechnicians, bookings, assignTechnicianToBooking } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmTech, setConfirmTech] = useState<TechnicianUser | null>(null);

  // Compute active jobs for each technician
  const getTechActiveJobsCount = (techId: string) => {
    return bookings.filter(
      (b) =>
        b.technicianId === techId &&
        (b.status === 'assigned' ||
          b.status === 'technician_assigned' ||
          b.status === 'accepted' ||
          b.status === 'in_progress')
    ).length;
  };

  const filteredTechs = allTechnicians.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.specialization.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleSelectTechnician = (tech: TechnicianUser) => {
    if (tech.status === 'ON_LEAVE' || tech.status === 'INACTIVE' || !tech.isOnDuty) {
      // Prompt confirmation for offline or inactive tech
      setConfirmTech(tech);
    } else {
      executeAssignment(tech);
    }
  };

  const executeAssignment = (tech: TechnicianUser) => {
    assignTechnicianToBooking(booking.id, tech.id);
    if (onAssigned) onAssigned(tech);
    setConfirmTech(null);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Assign Field Technician"
        description={`Allocate verified partner to Booking #${booking.id} (${booking.serviceName})`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Booking Context Banner */}
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-blue-900 block">{booking.serviceName}</span>
              <span className="text-blue-700">
                {booking.address.city} • {booking.scheduledDate} ({booking.scheduledSlot})
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Customer</span>
              <span className="font-bold text-slate-800">{booking.customerName}</span>
            </div>
          </div>

          {/* Search bar */}
          <Input
            placeholder="Search technician by name, skill, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />

          {/* Technician Cards List */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredTechs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No technicians match the search query.
              </div>
            ) : (
              filteredTechs.map((tech) => {
                const isCurrentlyAssigned = booking.technicianId === tech.id;
                const activeJobs = getTechActiveJobsCount(tech.id);
                const isUnavailable = tech.status === 'ON_LEAVE' || tech.status === 'INACTIVE';

                return (
                  <div
                    key={tech.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrentlyAssigned
                        ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Tech Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {tech.avatar || tech.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{tech.name}</span>
                            {isCurrentlyAssigned && (
                              <Badge variant="accent" size="sm">Currently Assigned</Badge>
                            )}
                            {tech.status === 'ACTIVE' && tech.isOnDuty && (
                              <Badge variant="success" size="sm">On Duty</Badge>
                            )}
                            {tech.status === 'ON_LEAVE' && (
                              <Badge variant="danger" size="sm">On Leave</Badge>
                            )}
                            {tech.status === 'INACTIVE' && (
                              <Badge variant="neutral" size="sm">Inactive</Badge>
                            )}
                            {tech.status === 'ACTIVE' && !tech.isOnDuty && (
                              <Badge variant="warning" size="sm">Offline</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {tech.city}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-slate-700">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              {tech.rating}
                            </span>
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              {tech.totalJobs} jobs ({activeJobs} active today)
                            </span>
                            {tech.experience && (
                              <span className="text-slate-500">Exp: {tech.experience}</span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {tech.specialization.map((spec, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-end sm:shrink-0">
                        <Button
                          size="sm"
                          variant={isCurrentlyAssigned ? 'outline' : 'primary'}
                          disabled={isCurrentlyAssigned}
                          onClick={() => handleSelectTechnician(tech)}
                        >
                          {isCurrentlyAssigned ? 'Assigned' : 'Assign Partner'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Inactive or On-Leave Technician */}
      {confirmTech && (
        <ConfirmDialog
          isOpen={!!confirmTech}
          onClose={() => setConfirmTech(null)}
          onConfirm={() => executeAssignment(confirmTech)}
          title="Assign Unavailable Partner?"
          description={`${confirmTech.name} is currently marked as ${
            confirmTech.status === 'ON_LEAVE'
              ? 'ON LEAVE'
              : !confirmTech.isOnDuty
              ? 'OFFLINE'
              : 'INACTIVE'
          }. Are you sure you want to override and dispatch this job to them?`}
          confirmText="Yes, Override & Assign"
          variant="warning"
        />
      )}
    </>
  );
};
