import React from 'react';
import { ServiceItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import {
  ArrowLeft,
  Star,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Shield,
  Award,
  Calendar,
} from 'lucide-react';

interface CustomerServiceDetailsProps {
  service: ServiceItem;
  onBack: () => void;
  onBookNow: (service: ServiceItem) => void;
}

export const CustomerServiceDetails: React.FC<CustomerServiceDetailsProps> = ({
  service,
  onBack,
  onBookNow,
}) => {
  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Services</span>
      </button>

      {/* Main Service Card */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="accent" size="sm" className="mb-2">
              {service.category}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {service.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-bold text-slate-800">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                {service.rating} ({service.reviewsCount} reviews)
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {service.durationMinutes} minutes duration
              </span>
            </div>
          </div>

          <div className="text-right shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Inclusive of GST
            </span>
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-2xl font-black text-slate-900">₹{service.price}</span>
              {service.originalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{service.originalPrice}
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 block mt-1">
              Save ₹{(service.originalPrice || service.price) - service.price}
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          {service.description}
        </p>

        {/* Warranty banner */}
        <div className="mt-6 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="text-xs font-bold text-emerald-900 block">
              Vertex Peace of Mind Guarantee
            </span>
            <span className="text-[11px] text-emerald-700">{service.warranty}</span>
          </div>
        </div>

        {/* Inclusions & Exclusions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>What's Included</span>
            </h3>
            <ul className="space-y-2.5">
              {service.inclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>What's Not Included</span>
            </h3>
            <ul className="space-y-2.5">
              {service.exclusions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Service Execution Steps */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            How VERTEX Service Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs font-bold text-slate-800 block">1. Book Slot</span>
              <span className="text-[11px] text-slate-500">Pick preferred time & address</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs font-bold text-slate-800 block">2. Tech Arrival</span>
              <span className="text-[11px] text-slate-500">Verified pro with tool kit</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs font-bold text-slate-800 block">3. Inspection</span>
              <span className="text-[11px] text-slate-500">Free upfront price confirm</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <span className="text-xs font-bold text-slate-800 block">4. 30-Day Cover</span>
              <span className="text-[11px] text-slate-500">Digital invoice & warranty</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500">Total payable</span>
            <div className="text-xl font-extrabold text-slate-900">₹{service.price}</div>
          </div>

          <Button
            size="lg"
            variant="primary"
            onClick={() => onBookNow(service)}
            className="px-8 font-bold"
          >
            Proceed to Book Service
          </Button>
        </div>
      </Card>
    </div>
  );
};
