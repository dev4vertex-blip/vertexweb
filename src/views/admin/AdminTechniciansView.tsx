import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TechnicianUser, Booking } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { EmptyState } from '../../components/ui/EmptyState';
import { AdminTechnicianDetailsModal } from './components/AdminTechnicianDetailsModal';
import { AdminBookingDetailsModal } from './components/AdminBookingDetailsModal';
import {
  Search,
  Star,
  Wrench,
  ShieldCheck,
  MapPin,
  Power,
  Eye,
  CheckCircle2,
  Briefcase,
  Clock,
  Filter,
} from 'lucide-react';

export const AdminTechniciansView: React.FC = () => {
  const { allTechnicians, bookings, updateTechnicianStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianUser | null>(null);
  const [selectedBookingForInspect, setSelectedBookingForInspect] = useState<Booking | null>(null);

  const filtered = allTechnicians.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(term) ||
      t.city.toLowerCase().includes(term) ||
      t.phone.includes(term) ||
      t.specialization.some((s) => s.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'ACTIVE' && t.status === 'ACTIVE') ||
      (statusFilter === 'ON_LEAVE' && t.status === 'ON_LEAVE') ||
      (statusFilter === 'INACTIVE' && t.status === 'INACTIVE');

    return matchesSearch && matchesStatus;
  });

  const getTechActiveJobs = (techId: string) => {
    return bookings.filter(
      (b) =>
        b.technicianId === techId &&
        (b.status === 'assigned' ||
          b.status === 'technician_assigned' ||
          b.status === 'accepted' ||
          b.status === 'in_progress')
    ).length;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Partner Technicians Fleet</h2>
          <p className="text-xs text-slate-500">
            Verified field partners, skill specializations, duty status & service ratings
          </p>
        </div>
        <div className="text-xs text-slate-600 font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
          Fleet Capacity: <strong className="text-slate-900">{allTechnicians.length} Partners</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3 border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <Input
              placeholder="Search partner name, skill, phone number, or city hub..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['All', 'ACTIVE', 'ON_LEAVE', 'INACTIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'All' ? 'All Fleet' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Technicians Table */}
      <Card className="overflow-hidden border-slate-200">
        {filtered.length === 0 ? (
          <EmptyState
            title="No Technicians Found"
            description="No partner technicians match the search keyword or fleet filter."
            actionLabel="Reset Search"
            onAction={() => {
              setSearchTerm('');
              setStatusFilter('All');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner Name</TableHead>
                  <TableHead>City Hub</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Active Jobs</TableHead>
                  <TableHead>Total Jobs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const activeJobsCount = getTechActiveJobs(t.id);

                  return (
                    <TableRow key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            {t.avatar || t.name[0]}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{t.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {t.id} • {t.phone}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          {t.city}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {t.specialization.map((spec, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 font-bold text-slate-900 text-xs">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{t.rating}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {activeJobsCount > 0 ? (
                          <span className="font-bold text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {activeJobsCount} Active
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0 Active</span>
                        )}
                      </TableCell>

                      <TableCell className="font-bold text-slate-900 text-xs">{t.totalJobs}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={
                              t.status === 'ON_LEAVE'
                                ? 'danger'
                                : t.status === 'INACTIVE'
                                ? 'neutral'
                                : 'success'
                            }
                            size="sm"
                          >
                            {(t.status || 'ACTIVE').replace('_', ' ')}
                          </Badge>
                          {t.status === 'ACTIVE' && t.isOnDuty && (
                            <Badge variant="accent" size="sm">Online</Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTechnician(t)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Profile
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Technician Profile & Management Modal */}
      {selectedTechnician && (
        <AdminTechnicianDetailsModal
          isOpen={!!selectedTechnician}
          onClose={() => setSelectedTechnician(null)}
          technician={
            allTechnicians.find((t) => t.id === selectedTechnician.id) || selectedTechnician
          }
          onSelectBooking={(booking) => {
            setSelectedBookingForInspect(booking);
          }}
        />
      )}

      {/* Booking Details Modal when opened from technician jobs list */}
      {selectedBookingForInspect && (
        <AdminBookingDetailsModal
          isOpen={!!selectedBookingForInspect}
          onClose={() => setSelectedBookingForInspect(null)}
          booking={
            bookings.find((b) => b.id === selectedBookingForInspect.id) || selectedBookingForInspect
          }
        />
      )}
    </div>
  );
};
