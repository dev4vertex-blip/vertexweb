import React from 'react';
import { AMCPlan } from '../../types';
import { Button } from '../ui/Button';
import { Check, Shield, Clock, Wrench, Sparkles, ArrowRight } from 'lucide-react';

interface AMCPlanCardProps {
  plan: AMCPlan;
  isSelected?: boolean;
  onSelect?: (plan: AMCPlan) => void;
  onViewDetails?: (plan: AMCPlan) => void;
  compact?: boolean;
}

export const AMCPlanCard: React.FC<AMCPlanCardProps> = ({
  plan,
  isSelected = false,
  onSelect,
  onViewDetails,
  compact = false,
}) => {
  const planName = plan.name || plan.title;
  const price = plan.price || plan.priceAnnual;
  const visits = plan.visitsIncluded || plan.visitsPerYear;
  const features = plan.features || plan.benefits || [];

  return (
    <div
      className={`relative flex flex-col justify-between rounded-xl border bg-white transition-all duration-200 ${
        plan.popular
          ? 'border-blue-500 shadow-sm ring-1 ring-blue-500/20'
          : isSelected
          ? 'border-slate-800 shadow-sm ring-1 ring-slate-800'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      } ${compact ? 'p-4' : 'p-6'}`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
          <Sparkles className="w-3 h-3" />
          <span>Most Popular</span>
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {plan.category || plan.target || 'Maintenance'}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{planName}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">₹{price.toLocaleString()}</div>
            <div className="text-xs text-slate-500">/ {plan.durationMonths || plan.validityMonths || 12} Months</div>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-5 leading-relaxed line-clamp-2">
          {plan.description || plan.tagline}
        </p>

        {/* Highlight metrics */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">{visits} Visits/Yr</div>
              <div className="text-[11px] text-slate-500">Preventive checkups</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="font-semibold text-slate-800">{plan.responseTime || `${plan.emergencyResponseHours || 4}h SLA`}</div>
              <div className="text-[11px] text-slate-500">Response time</div>
            </div>
          </div>
        </div>

        {/* Feature list */}
        <div className="space-y-2 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Package Inclusions
          </div>
          {features.slice(0, compact ? 3 : 5).map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
              <div className="mt-0.5 rounded-full bg-emerald-50 p-0.5 text-emerald-600 shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span className="leading-snug">{feature}</span>
            </div>
          ))}
          {features.length > (compact ? 3 : 5) && (
            <div className="text-[11px] font-medium text-blue-600 pt-1">
              +{features.length - (compact ? 3 : 5)} more covered benefits
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
        {onSelect && (
          <Button
            variant={plan.popular ? 'primary' : 'outline'}
            className="w-full flex-1 text-sm font-semibold justify-center"
            onClick={() => onSelect(plan)}
          >
            <span>{isSelected ? 'Selected' : 'Choose This Plan'}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}
        {onViewDetails && (
          <Button
            variant="ghost"
            className="w-full sm:w-auto text-sm justify-center text-slate-700"
            onClick={() => onViewDetails(plan)}
          >
            Details
          </Button>
        )}
      </div>
    </div>
  );
};
