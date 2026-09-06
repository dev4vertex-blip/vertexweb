import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Wrench,
  Star,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  LogOut,
} from 'lucide-react';

export const TechnicianProfile: React.FC = () => {
  const { currentTechnician, setAppRole, addToast } = useApp();
  const { logout } = useAuth();

  const toolAudits = [
    { name: 'Insulated Screwdriver & Pliers Kit (1000V)', status: 'Approved' },
    { name: 'Digital Manifold Refrigerant Pressure Gauge', status: 'Approved' },
    { name: 'High-Pressure Coil Jet Cleaning Machine', status: 'Approved' },
    { name: 'Safety Boots & High-Visibility Vest', status: 'Approved' },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Partner Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          KYC badge, trade certifications & safety equipment audits
        </p>
      </div>

      {/* ID Badge Card */}
      <Card className="p-6 bg-white border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl">
              {currentTechnician.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{currentTechnician.name}</h3>
                <Badge variant="success" size="sm">
                  {currentTechnician.kycStatus}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Badge ID: <strong>VTX-TECH-089</strong> • {currentTechnician.city} Hub
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-bold text-slate-900">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {currentTechnician.rating}
                </span>
                <span>•</span>
                <span>{currentTechnician.totalJobs} Lifetime Jobs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTechnician.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTechnician.email}</span>
          </div>
        </div>
      </Card>

      {/* Specialization Trades */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Certified Trade Specializations
        </h3>
        <div className="flex flex-wrap gap-2">
          {currentTechnician.specialization.map((spec, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-100 flex items-center gap-1.5"
            >
              <Wrench className="w-3 h-3 text-blue-600" />
              <span>{spec}</span>
            </span>
          ))}
        </div>
      </Card>

      {/* Safety & Tool Equipment Audit */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Safety & Tool Audit Checklist (Weekly Verified)</span>
        </h3>

        <div className="space-y-2 text-xs">
          {toolAudits.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="flex items-center gap-2 text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{item.name}</span>
              </div>
              <Badge variant="success" size="sm">
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-300"
        leftIcon={<LogOut className="w-4 h-4" />}
        onClick={async () => {
          await logout();
          setAppRole('login');
          addToast('Logged out', 'Returned to role selection', 'info');
        }}
      >
        Sign Out of Technician Portal
      </Button>
    </div>
  );
};
