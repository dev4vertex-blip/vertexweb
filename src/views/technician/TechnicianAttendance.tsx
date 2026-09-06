import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_ATTENDANCE } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { Clock, CheckCircle2, Calendar, MapPin, Power } from 'lucide-react';

export const TechnicianAttendance: React.FC = () => {
  const { currentTechnician, addToast } = useApp();
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [punchTime, setPunchTime] = useState('08:45 AM');

  const handleTogglePunch = () => {
    if (isCheckedIn) {
      setIsCheckedIn(false);
      addToast('Check-out Recorded', 'Punched out for today at 06:45 PM. Great work today!', 'info');
    } else {
      setIsCheckedIn(true);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setPunchTime(timeStr);
      addToast('Check-in Recorded', `Punched in at ${timeStr}. Active for today's dispatches.`, 'success');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Partner Attendance</h1>
        <p className="text-xs text-slate-500 mt-1">
          Daily biometric punch records, working hours & duty schedule
        </p>
      </div>

      {/* Punch Action Card */}
      <Card className="p-6 bg-slate-900 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Today's Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-white">
                {isCheckedIn ? 'Checked In' : 'Checked Out'}
              </span>
              <Badge variant={isCheckedIn ? 'success' : 'neutral'} size="sm">
                {isCheckedIn ? 'On Duty' : 'Off Duty'}
              </Badge>
            </div>
            {isCheckedIn && (
              <span className="text-xs text-slate-400 mt-0.5 block">
                Punched in at <strong className="text-white">{punchTime}</strong> • {currentTechnician.city} Hub
              </span>
            )}
          </div>

          <Button
            size="md"
            variant={isCheckedIn ? 'danger' : 'primary'}
            onClick={handleTogglePunch}
            leftIcon={<Power className="w-4 h-4" />}
            className="font-bold text-xs"
          >
            {isCheckedIn ? 'Punch Out' : 'Punch In'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
          <div>
            <span className="text-slate-400 block">Weekly Total:</span>
            <span className="text-base font-extrabold text-white">46.7 Hours</span>
          </div>
          <div>
            <span className="text-slate-400 block">Attendance Score:</span>
            <span className="text-base font-extrabold text-emerald-400">98% Punctual</span>
          </div>
        </div>
      </Card>

      {/* Recent 7-Day Log */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-700" />
          <span>Recent Duty Logs</span>
        </h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Day</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEMO_ATTENDANCE.map((att, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <span className="font-bold text-slate-900 block">{att.date}</span>
                  <span className="text-[10px] text-slate-400">{att.day}</span>
                </TableCell>
                <TableCell className="font-mono">{att.checkIn}</TableCell>
                <TableCell className="font-mono">{att.checkOut || '—'}</TableCell>
                <TableCell className="font-semibold">{att.hoursWorked} hrs</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      att.status === 'Present'
                        ? 'success'
                        : att.status === 'On Leave'
                        ? 'warning'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {att.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
