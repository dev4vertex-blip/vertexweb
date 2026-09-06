import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_AMC_PLANS } from '../../data/mockData';
import { AMCPlan } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Building,
  Home,
  Check,
  PhoneCall,
  CalendarCheck,
} from 'lucide-react';

export const CustomerAMC: React.FC = () => {
  const { currentCustomer, addToast } = useApp();
  const [selectedTarget, setSelectedTarget] = useState<'All' | 'Residential' | 'Commercial'>('All');
  const [enquirePlan, setEnquirePlan] = useState<AMCPlan | null>(null);

  const filteredPlans = DEMO_AMC_PLANS.filter((p) => {
    if (selectedTarget === 'All') return true;
    return p.target === selectedTarget;
  });

  const handleSubscribePlan = (plan: AMCPlan) => {
    setEnquirePlan(null);
    addToast('AMC Subscription Request Registered', `Our corporate manager will contact you within 2 business hours for ${plan.title}.`, 'success');
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="max-w-xl relative z-10">
          <Badge variant="accent" size="sm" className="mb-2 bg-blue-600 text-white border-blue-500">
            VERTEX PROTECT AMC
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Annual Maintenance Contracts
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Zero-hassle yearly maintenance for Homes, Villas, Corporate Offices, and Co-working Spaces. Fixed yearly fee, scheduled preventive audits, and guaranteed emergency SLA.
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Up to 4-12 Free Visits/Year
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              15%-25% Off Spares
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              2-4 Hr Emergency SLA
            </span>
          </div>
        </div>
      </div>

      {/* Target Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['All', 'Residential', 'Commercial'] as const).map((tgt) => (
          <button
            key={tgt}
            onClick={() => setSelectedTarget(tgt)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedTarget === tgt
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tgt} Plans
          </button>
        ))}
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredPlans.map((plan) => {
          const isUserActive = currentCustomer.activeAmcId === plan.id;
          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col justify-between relative ${
                plan.popular
                  ? 'border-blue-500 shadow-md ring-1 ring-blue-500/50'
                  : 'hover:border-slate-300'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                  Most Popular
                </span>
              )}

              {isUserActive && (
                <span className="absolute -top-2.5 left-6 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-xs">
                  Your Active Plan
                </span>
              )}

              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="neutral" size="sm">
                    {plan.target}
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {plan.validityMonths} Months
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-2">{plan.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.tagline}</p>

                <div className="mt-4 pb-4 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{plan.priceAnnual.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ year</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                    Includes {plan.visitsPerYear} scheduled health audits
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide block">
                    Key Coverage & Benefits:
                  </span>
                  {plan.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                    Coverage Scope:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {plan.coverageList.map((cov, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                      >
                        {cov}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Button
                  size="md"
                  variant={isUserActive ? 'secondary' : plan.popular ? 'primary' : 'outline'}
                  className="w-full font-bold text-xs"
                  onClick={() => setEnquirePlan(plan)}
                >
                  {isUserActive ? 'Renew / View Contract' : 'Select AMC Package'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Enquire Modal */}
      {enquirePlan && (
        <Modal
          isOpen={!!enquirePlan}
          onClose={() => setEnquirePlan(null)}
          title={`Subscribe to ${enquirePlan.title}`}
          description="Confirm your annual facility care contract request"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">{enquirePlan.title}</span>
                <span className="font-extrabold text-slate-900">
                  ₹{enquirePlan.priceAnnual.toLocaleString()}/yr
                </span>
              </div>
              <p className="text-slate-500">{enquirePlan.tagline}</p>
            </div>

            <div className="space-y-2 text-slate-600">
              <p>• Coverage starts within 24 hours after verification</p>
              <p>• Assigned Dedicated Relationship Manager</p>
              <p>• Free GST invoice for commercial corporate deduction</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEnquirePlan(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSubscribePlan(enquirePlan)}
              >
                Confirm AMC Registration
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
