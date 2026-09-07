import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Tag,
  Copy,
  Check,
  Percent,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface PromoOffer {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  minBookingAmount: number;
  validUntil: string;
  category: string;
  terms: string[];
}

const OFFERS_LIST: PromoOffer[] = [
  {
    id: 'off-1',
    code: 'VERTEXNEW',
    title: 'Flat ₹100 Off on First Service',
    description: 'Special welcome bonus valid across all certified home repair & appliance categories.',
    discountType: 'FLAT',
    discountValue: 100,
    minBookingAmount: 299,
    validUntil: '31 Dec 2026',
    category: 'All',
    terms: ['Valid once per customer', 'Minimum order value ₹299', 'Cannot be clubbed with AMC contracts'],
  },
  {
    id: 'off-2',
    code: 'SUMMERCOOL',
    title: '15% Off AC Power Jet Cleaning',
    description: 'High pressure antimicrobial foam wash with deep cooling coil descaling and gas check.',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minBookingAmount: 499,
    validUntil: '31 Oct 2026',
    category: 'AC & Cooling',
    terms: ['Valid on AC Service & AC Repair', 'Max discount ₹250', 'Applicable on both Split & Window ACs'],
  },
  {
    id: 'off-3',
    code: 'AMCPROTECT',
    title: 'Flat ₹500 Off AMC Annual Plans',
    description: 'Comprehensive 365-day protection covering emergency visits, routine tune-ups & priority dispatch.',
    discountType: 'FLAT',
    discountValue: 500,
    minBookingAmount: 2499,
    validUntil: '31 Dec 2026',
    category: 'AMC',
    terms: ['Valid on Residential & Commercial AMC plans', 'Instant discount deducted at subscription checkout'],
  },
  {
    id: 'off-4',
    code: 'FESTIVE20',
    title: '20% Off Electrical & Plumbing Overhaul',
    description: 'Precision repairs for MCB trips, wiring audits, faucet replacements and pressure blockages.',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minBookingAmount: 399,
    validUntil: '15 Nov 2026',
    category: 'Repairs',
    terms: ['Max discount ₹300', 'Valid in Delhi, Gurgaon, Noida, Mumbai & Bangalore'],
  },
];

interface CustomerOffersProps {
  onBack?: () => void;
  onBookService?: (category?: string) => void;
  onSelectAMC?: () => void;
}

export const CustomerOffers: React.FC<CustomerOffersProps> = ({
  onBack,
  onBookService,
  onSelectAMC,
}) => {
  const { addToast } = useApp();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'AC & Cooling' | 'Repairs' | 'AMC'>('All');

  const filteredOffers = OFFERS_LIST.filter(
    (o) => activeTab === 'All' || o.category === activeTab || o.category === 'All'
  );

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    addToast('Coupon Copied', `Promo code "${code}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleApplyAction = (offer: PromoOffer) => {
    handleCopyCode(offer.code);
    if (offer.category === 'AMC') {
      onSelectAMC?.();
    } else {
      onBookService?.(offer.category === 'All' ? undefined : offer.category);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Offers & Coupons</h1>
              <span className="p-1 rounded-md bg-amber-100 text-amber-700">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified promo codes and instant discounts for your home repairs
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
        {(['All', 'AC & Cooling', 'Repairs', 'AMC'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer whitespace-nowrap min-h-[44px] flex items-center ${
              activeTab === tab
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Offers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOffers.map((offer) => {
          const isCopied = copiedCode === offer.code;

          return (
            <Card
              key={offer.id}
              className="p-5 flex flex-col justify-between border-dashed border-2 hover:border-blue-400 transition-all relative overflow-hidden"
            >
              {/* Corner Badge */}
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  {offer.discountType === 'FLAT'
                    ? `Save ₹${offer.discountValue}`
                    : `${offer.discountValue}% OFF`}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                    <Tag className="w-4 h-4" />
                  </span>
                  <Badge variant="neutral" size="sm">
                    {offer.category}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{offer.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{offer.description}</p>

                {/* Terms list */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {offer.terms.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <div className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupon Box & CTA */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-slate-800 tracking-wider">
                  <span>{offer.code}</span>
                  <button
                    onClick={() => handleCopyCode(offer.code)}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1 cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                    title="Copy code"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApplyAction(offer)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="whitespace-nowrap"
                >
                  Apply & Book
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Assurance banner */}
      <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>
          <strong>VERTEX Best Price Guarantee:</strong> Discounts are applied transparently before payment. No hidden service convenience fees.
        </span>
      </div>
    </div>
  );
};
