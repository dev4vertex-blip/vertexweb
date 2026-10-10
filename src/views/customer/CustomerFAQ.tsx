import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  HelpCircle,
  Search,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  Shield,
  ChevronDown,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  X,
  FileText,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type FAQCategory = 'all' | 'bookings' | 'payments' | 'technicians' | 'amc';

export interface FAQItem {
  id: string;
  category: 'bookings' | 'payments' | 'technicians' | 'amc';
  categoryLabel: string;
  question: string;
  answer: string;
  keyPoints?: string[];
  callout?: {
    type: 'info' | 'tip' | 'warning';
    text: string;
  };
  tags: string[];
}

export const FAQ_DATA: FAQItem[] = [
  // ================= SERVICE BOOKINGS =================
  {
    id: 'faq-book-1',
    category: 'bookings',
    categoryLabel: 'Service Bookings',
    question: 'How do I book a repair or maintenance service on VERTEX?',
    answer:
      'Booking a service is fast and seamless. Simply choose your desired category (e.g. AC Repair, Electrical, Plumbing, Appliances), select the specific service package or diagnostic inspection, pick your preferred date and time slot, and confirm your service address. You will receive immediate booking confirmation along with an assigned job reference number and tracking dashboard.',
    keyPoints: [
      'Select category & service package with upfront transparent pricing',
      'Choose flexible 2-hour arrival slots 7 days a week (8:00 AM – 8:00 PM)',
      'Add specific notes or photos of the problem to guide the technician',
      'Real-time job tracking available right from your Customer Portal',
    ],
    callout: {
      type: 'tip',
      text: 'Need same-day emergency assistance? Look for the "Express 2-Hr Dispatch" badge on urgent electrical and plumbing services.',
    },
    tags: ['book', 'schedule', 'appointment', 'how to book', 'timing', 'slots'],
  },
  {
    id: 'faq-book-2',
    category: 'bookings',
    categoryLabel: 'Service Bookings',
    question: 'What is the Start-of-Service OTP and why is it mandatory?',
    answer:
      'The Start-of-Service OTP is a confidential 4-digit code generated for your security. It ensures that no technician can begin or record a job until they are physically present at your premises in uniform with their VERTEX digital badge verified.',
    keyPoints: [
      'Never share the OTP over phone calls, chat, or WhatsApp before arrival',
      'Share the OTP only once the technician is at your door and verified',
      'Sharing the OTP officially initiates the job clock and triggers insurance cover',
    ],
    callout: {
      type: 'warning',
      text: 'Do not disclose your Start-of-Service OTP to anyone over the phone. VERTEX support agents will never ask for your Start-of-Service OTP.',
    },
    tags: ['otp', 'start code', 'pin', 'security', 'verification', 'technician arrival'],
  },
  {
    id: 'faq-book-3',
    category: 'bookings',
    categoryLabel: 'Service Bookings',
    question: 'Can I reschedule or cancel my booking? Is there a cancellation fee?',
    answer:
      'Yes, you can reschedule or cancel any scheduled service without any charges up to 2 hours before your selected arrival slot directly from the "My Bookings" screen. For cancellations made less than 2 hours prior when the technician is already dispatched, a nominal conveyance charge of ₹99 may apply to compensate the technician for fuel and travel time.',
    keyPoints: [
      '100% Free cancellation and rescheduling up to 2 hours before the slot',
      'Instant reschedule to any date/time within the next 14 days',
      'Easy 1-tap cancellation in "My Bookings" with no questions asked',
    ],
    tags: ['cancel', 'reschedule', 'penalty', 'charges', 'delay', 'change time'],
  },
  {
    id: 'faq-book-4',
    category: 'bookings',
    categoryLabel: 'Service Bookings',
    question: 'How do I track my assigned technician and estimated arrival time?',
    answer:
      'Once an operations manager assigns a technician to your booking, you receive an automated SMS and in-app notification. You can view the technician’s full name, verified photo, star rating, verified skills, and live journey ETA in the "My Bookings -> Booking Details" section.',
    keyPoints: [
      'Technician assignment updates delivered via SMS and app notification',
      'View technician profile, rating, and total completed VERTEX jobs',
      'Direct in-app masked calling button to coordinate arrival without sharing personal phone numbers',
    ],
    tags: ['track', 'eta', 'arrival', 'map', 'technician contact', 'live tracking'],
  },
  {
    id: 'faq-book-5',
    category: 'bookings',
    categoryLabel: 'Service Bookings',
    question: 'What happens if replacement spare parts are needed during the service?',
    answer:
      'VERTEX technicians carry common consumables and standard parts. If specific replacement components (e.g. copper pipe, thermostat, capacitor, MCB, drain valve) are required, the technician will present the standard digital VERTEX Spare Parts Rate Card. No parts are installed without your verbal and digital authorization.',
    keyPoints: [
      'Standardized transparent digital rate card for all genuine OEM spares',
      'In-app estimate approval before parts purchase or installation',
      'All genuine parts provided by VERTEX include a 90-day parts warranty',
      'AMC members receive a 15% to 25% discount on all spare parts',
    ],
    callout: {
      type: 'info',
      text: 'You have full liberty to supply your own spare parts if you prefer; the technician will only charge for labor/installation.',
    },
    tags: ['spare parts', 'materials', 'components', 'replacement', 'rate card', 'warranty'],
  },

  // ================= PAYMENTS & BILLING =================
  {
    id: 'faq-pay-1',
    category: 'payments',
    categoryLabel: 'Payments & Billing',
    question: 'What payment methods are supported on VERTEX?',
    answer:
      'We accept all modern secure payment options across India. You can choose your preferred mode during booking or pay upon service completion directly through the app or to the technician via digital scan.',
    keyPoints: [
      'UPI: Google Pay, PhonePe, Paytm, BHIM, and any UPI QR code',
      'Credit & Debit Cards: Visa, MasterCard, RuPay, and American Express',
      'Net Banking: 50+ Indian banks supported',
      'Cash on Delivery (COD) / Pay After Service to the technician',
      'VERTEX AMC Wallet Credits: Automatically deducted for AMC members',
    ],
    tags: ['payment methods', 'upi', 'google pay', 'phonepe', 'card', 'cash', 'cod'],
  },
  {
    id: 'faq-pay-2',
    category: 'payments',
    categoryLabel: 'Payments & Billing',
    question: 'When do I have to pay? Do you require an advance deposit?',
    answer:
      'VERTEX operates on a "Pay After Service Satisfaction" policy for standard home and office repairs. You do not need to make any advance deposit. You only pay after the technician completes the requested service, cleans the work area, and you inspect the workmanship.',
    keyPoints: [
      'Zero advance deposit needed for standard repairs and visits',
      'Inspect the completed work before authorizing final payment',
      'Verify the itemized digital invoice on your phone before paying',
    ],
    callout: {
      type: 'tip',
      text: 'Only heavy enterprise commercial installations (above ₹25,000) or customized material procurement may require a structured partial procurement deposit.',
    },
    tags: ['advance', 'when to pay', 'deposit', 'post payment', 'completion'],
  },
  {
    id: 'faq-pay-3',
    category: 'payments',
    categoryLabel: 'Payments & Billing',
    question: 'Are there hidden visiting charges or inspection fees?',
    answer:
      'No. VERTEX practices 100% upfront pricing transparency. If you proceed with the suggested service, the diagnostic inspection charge (typically ₹149–₹199) is fully waived and adjusted against your final service bill. If you choose not to proceed with the repair after technician diagnosis, only the minimal visiting fee applies.',
    keyPoints: [
      'Diagnostic visit fee is waived when repair service is availed',
      'Fixed rate card for all standard service catalog items',
      'No surprise charges for weekend visits or surge times',
    ],
    tags: ['visiting fee', 'inspection charge', 'hidden fee', 'transparent pricing'],
  },
  {
    id: 'faq-pay-4',
    category: 'payments',
    categoryLabel: 'Payments & Billing',
    question: 'How and when do I get my official GST tax invoice?',
    answer:
      'As soon as your service is marked complete and payment is recorded, an official GST-compliant tax invoice is automatically generated. It is sent to your registered email address and saved permanently in your "Invoices & Receipts" tab in the Customer Portal for instant PDF download.',
    keyPoints: [
      'Automated digital GST tax invoice with full HSN/SAC codes',
      'Eligible for corporate business expense claims and GST input tax credit',
      'Downloadable anytime in PDF format from "Profile -> Invoices & Receipts"',
    ],
    tags: ['invoice', 'gst', 'tax receipt', 'bill', 'download invoice', 'reimbursement'],
  },
  {
    id: 'faq-pay-5',
    category: 'payments',
    categoryLabel: 'Payments & Billing',
    question: 'What is the refund policy if I cancel or if service is unsatisfactory?',
    answer:
      'If you cancel an advance-paid booking under the free cancellation window, a 100% refund is initiated immediately to your original payment method. If a service does not meet quality standards, our quality audit team will either send a senior technician for a free rework under the 30-Day Guarantee or process a full or partial refund within 3–5 working days.',
    keyPoints: [
      'Instant refund initiation for eligible cancellations',
      'UPI and Net Banking refunds credit within 24–48 hours; Cards within 3–5 days',
      'Dedicated resolution manager assigned if you raise a payment dispute',
    ],
    tags: ['refund', 'money back', 'dispute', 'cancellation refund', 'return'],
  },

  // ================= TECHNICIAN POLICIES & SAFETY =================
  {
    id: 'faq-tech-1',
    category: 'technicians',
    categoryLabel: 'Technician Policies',
    question: 'How are VERTEX technicians vetted, verified, and trained?',
    answer:
      'Every technician deployed by VERTEX goes through a stringent 4-stage onboarding process before taking their first job. Only the top 15% of applicants are approved to represent the VERTEX brand.',
    keyPoints: [
      'Identity & Police Verification: Government photo ID (Aadhaar, PAN) and criminal record check',
      'Trade Skill Testing: Practical bench testing on electrical safety, refrigeration, and plumbing standards',
      'Customer Courtesy & Safety Protocol: Training on hygiene, shoe-covers, dust-cloth cleanup, and respectful conduct',
      'Continuous Rating Benchmark: Technicians maintaining below 4.5 stars are paused for retraining',
    ],
    callout: {
      type: 'info',
      text: 'Every technician carries an active VERTEX Digital Identity Badge with a verified badge ID and scannable QR code.',
    },
    tags: ['vetting', 'police verification', 'background check', 'training', 'safety'],
  },
  {
    id: 'faq-tech-2',
    category: 'technicians',
    categoryLabel: 'Technician Policies',
    question: 'How do I verify the technician’s identity at my doorstep?',
    answer:
      'All authentic VERTEX service professionals wear the official VERTEX branded uniform, carry a physical or digital VERTEX identity badge, and will state your booking reference number and the 4-digit OTP request upon arrival.',
    keyPoints: [
      'Check technician name and photo on your booking screen',
      'Ask to view their official VERTEX digital ID card',
      'Do not allow entry to anyone unable to state your booking ID or verify their badge',
      'Contact 24x7 Helpline immediately if you notice any discrepancy',
    ],
    tags: ['doorstep verification', 'id card', 'uniform', 'safety check', 'badge'],
  },
  {
    id: 'faq-tech-3',
    category: 'technicians',
    categoryLabel: 'Technician Policies',
    question: 'What is covered under the VERTEX 30-Day Service Guarantee?',
    answer:
      'We stand firmly behind our craft. Every repair, installation, or servicing job executed through VERTEX includes an unconditional 30-Day Service Guarantee. If the same issue reoccurs or the repaired component fails within 30 days, a technician will revisit and rectify it completely free of charge.',
    keyPoints: [
      'Covers labor, workmanship, and repair integrity for 30 calendar days',
      'Easy 1-tap warranty claim directly from "My Bookings -> Past Bookings"',
      'No visiting fees or inspection charges for warranty re-visits',
    ],
    callout: {
      type: 'tip',
      text: 'Genuine replacement spare parts installed by VERTEX carry an additional manufacturer warranty of 90 to 180 days.',
    },
    tags: ['warranty', 'guarantee', '30-day warranty', 'free rework', 'repeat issue'],
  },
  {
    id: 'faq-tech-4',
    category: 'technicians',
    categoryLabel: 'Technician Policies',
    question: 'What happens if accidental property damage occurs during service?',
    answer:
      'VERTEX covers verified accidental damage during authorized service operations up to ₹10,000 under our Customer Protection Shield. In the rare event of an accident, our operations audit team inspects the site within 24 hours to organize prompt repair or financial reimbursement.',
    keyPoints: [
      'Comprehensive in-service property protection cover up to ₹10,000',
      'Report incident within 24 hours via in-app support or helpline',
      'Photo documentation and prompt supervisor site inspection',
    ],
    tags: ['damage', 'insurance', 'protection', 'compensation', 'accident'],
  },
  {
    id: 'faq-tech-5',
    category: 'technicians',
    categoryLabel: 'Technician Policies',
    question: 'What is the policy if a technician offers offline direct cash deals?',
    answer:
      'VERTEX maintains a strict Zero-Tolerance Policy for off-platform dealings. Transacting directly with a technician offline forfeits your 30-Day Service Guarantee, customer insurance protection, and official GST tax bill.',
    keyPoints: [
      'Offline transactions void all warranties and insurance coverage',
      'Always request an in-app booking or digital bill addition',
      'Report any offline solicitation to VERTEX customer care for an instant ₹500 wallet credit reward',
    ],
    callout: {
      type: 'warning',
      text: 'Technicians caught soliciting offline work are permanently de-platformed. Please keep all bookings and payments recorded inside the VERTEX platform for your safety.',
    },
    tags: ['offline deals', 'cash deal', 'direct work', 'policy', 'safety violation'],
  },
  {
    id: 'faq-tech-6',
    category: 'technicians',
    categoryLabel: 'Technician Policies',
    question: 'Do I need to provide tools, ladders, or cleaning equipment?',
    answer:
      'No. VERTEX technicians arrive fully equipped with professional-grade electrical meters, manifold gauges, drill machines, specialized hand tools, and protective floor drop-cloths. If your repair requires an extended ladder (e.g. high-ceiling light fixtures or exterior AC units), please mention it in the booking notes so the hub can dispatch suitable height equipment.',
    keyPoints: [
      'Technicians carry standard diagnostic and repair toolkits',
      'Surface drop-cloths and cleaning gear included to leave your premises spotless',
      'Special equipment (tall ladders, heavy drain snakes) dispatched on request',
    ],
    tags: ['tools', 'ladder', 'equipment', 'cleaning', 'preparations'],
  },

  // ================= AMC & WARRANTIES =================
  {
    id: 'faq-amc-1',
    category: 'amc',
    categoryLabel: 'AMC & Warranties',
    question: 'What is the VERTEX Protect Annual Maintenance Contract (AMC)?',
    answer:
      'VERTEX Protect AMC is an all-inclusive annual subscription designed to eliminate maintenance headaches for homes and commercial offices. A single annual fee provides scheduled preventive tune-ups, unlimited zero-visiting-fee emergency visits, and flat discounts on all spare parts.',
    keyPoints: [
      '4 Scheduled Preventive Maintenance inspections per year (AC tune-up, electrical health audit, plumbing leak-check)',
      'Zero visiting and inspection charges on all breakdown emergency calls',
      'Guaranteed priority technician dispatch within 2 to 4 hours',
      '15% to 25% flat discount on all genuine spare parts',
    ],
    tags: ['amc', 'annual contract', 'maintenance plan', 'subscription', 'benefits'],
  },
  {
    id: 'faq-amc-2',
    category: 'amc',
    categoryLabel: 'AMC & Warranties',
    question: 'Can I transfer my AMC contract if I move to a new home or office?',
    answer:
      'Yes! VERTEX AMC contracts are easily transferable to any other residential or commercial address within our operational cities (Delhi NCR, Mumbai, Bengaluru, Pune, Hyderabad, Chennai) with zero transfer fees. Just update your registered premises address in the Customer Portal.',
    keyPoints: [
      '100% Free address transfer across covered cities',
      'Existing service history and unused preventive visits carry forward seamlessly',
      'Instant address transfer via Customer Portal or customer support hotline',
    ],
    tags: ['transfer amc', 'relocation', 'move house', 'amc address change'],
  },
];

export interface CustomerFAQProps {
  onBack?: () => void;
  onNavigateToSupport?: () => void;
  onNavigateToBookService?: () => void;
  onNavigateToInvoices?: () => void;
  initialCategory?: FAQCategory;
  compact?: boolean;
}

export const CustomerFAQ: React.FC<CustomerFAQProps> = ({
  onBack,
  onNavigateToSupport,
  onNavigateToBookService,
  onNavigateToInvoices,
  initialCategory = 'all',
  compact = false,
}) => {
  const { addToast } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['faq-book-1', 'faq-pay-2', 'faq-tech-3']));
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, boolean>>({});

  const categories: { id: FAQCategory; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: 'all',
      label: 'All Topics',
      icon: <HelpCircle className="w-4 h-4" />,
      count: FAQ_DATA.length,
    },
    {
      id: 'bookings',
      label: 'Service Bookings',
      icon: <CalendarCheck className="w-4 h-4" />,
      count: FAQ_DATA.filter((item) => item.category === 'bookings').length,
    },
    {
      id: 'payments',
      label: 'Payments & Billing',
      icon: <CreditCard className="w-4 h-4" />,
      count: FAQ_DATA.filter((item) => item.category === 'payments').length,
    },
    {
      id: 'technicians',
      label: 'Technician Policies',
      icon: <ShieldCheck className="w-4 h-4" />,
      count: FAQ_DATA.filter((item) => item.category === 'technicians').length,
    },
    {
      id: 'amc',
      label: 'AMC & Warranties',
      icon: <Shield className="w-4 h-4" />,
      count: FAQ_DATA.filter((item) => item.category === 'amc').length,
    },
  ];

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inQuestion = item.question.toLowerCase().includes(q);
      const inAnswer = item.answer.toLowerCase().includes(q);
      const inCategory = item.categoryLabel.toLowerCase().includes(q);
      const inTags = item.tags.some((tag) => tag.toLowerCase().includes(q));
      const inKeyPoints = item.keyPoints?.some((kp) => kp.toLowerCase().includes(q)) ?? false;

      return inQuestion || inAnswer || inCategory || inTags || inKeyPoints;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(filteredFaqs.map((f) => f.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleFeedback = (faqId: string, helpful: boolean) => {
    setHelpfulFeedback((prev) => ({ ...prev, [faqId]: helpful }));
    addToast(
      'Thank You!',
      helpful ? 'Glad this answer was helpful to you!' : 'Thanks for your feedback. We will refine this answer.',
      'success'
    );
  };

  return (
    <div className={`space-y-6 max-w-4xl mx-auto ${compact ? '' : 'pb-16'}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Customer Knowledge Base
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Frequently Asked Questions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Clear guidelines on service bookings, transparent payments, and technician safety policies
            </p>
          </div>
        </div>

        {onNavigateToSupport && (
          <Button
            size="sm"
            variant="outline"
            onClick={onNavigateToSupport}
            leftIcon={<PhoneCall className="w-4 h-4 text-blue-600" />}
            className="shrink-0 self-start sm:self-auto text-xs"
          >
            24x7 Customer Care
          </Button>
        )}
      </div>

      {/* Trust & Guarantee Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">30-Day Service Guarantee</h4>
            <p className="text-[11px] text-slate-500 leading-tight">Free rework on any repeat problem</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">100% Police Verified</h4>
            <p className="text-[11px] text-slate-500 leading-tight">Strict background-checked experts</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Pay After Satisfaction</h4>
            <p className="text-[11px] text-slate-500 leading-tight">Zero advance deposit required</p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by keyword, topic (e.g. OTP, refund, spare parts, cancellation, police verification)..."
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={isSelected ? 'text-blue-400' : 'text-slate-500'}>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Header with Expand / Collapse All */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <span className="font-bold text-slate-900">{filteredFaqs.length}</span> question
          {filteredFaqs.length === 1 ? '' : 's'}
          {searchQuery && (
            <span>
              {' '}
              matching &quot;<span className="text-blue-600 font-medium">{searchQuery}</span>&quot;
            </span>
          )}
        </div>

        {filteredFaqs.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={expandAll}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Expand all
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={collapseAll}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 hover:underline cursor-pointer"
            >
              Collapse all
            </button>
          </div>
        )}
      </div>

      {/* FAQs List Accordion */}
      {filteredFaqs.length === 0 ? (
        <Card className="p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No matching questions found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn’t find an answer matching &ldquo;{searchQuery}&rdquo;. Try another term or speak directly with our 24x7 helpdesk.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setSearchQuery('')}>
              Reset Search
            </Button>
            {onNavigateToSupport && (
              <Button size="sm" variant="accent" onClick={onNavigateToSupport}>
                Ask Customer Support
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedIds.has(faq.id);
            const feedback = helpfulFeedback[faq.id];

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-white border-blue-300/80 shadow-xs'
                    : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => toggleExpand(faq.id)}
                  aria-expanded={isExpanded}
                  className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left cursor-pointer focus:outline-none"
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          faq.category === 'bookings'
                            ? 'accent'
                            : faq.category === 'payments'
                            ? 'success'
                            : faq.category === 'technicians'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      >
                        {faq.categoryLabel}
                      </Badge>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {faq.question}
                    </h3>
                  </div>

                  <div
                    className={`p-1.5 rounded-lg text-slate-400 bg-slate-50 transition-transform duration-200 shrink-0 ${
                      isExpanded ? 'rotate-180 text-blue-600 bg-blue-50' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Accordion Content Body */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-slate-100 space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
                    <div className="pt-3">{faq.answer}</div>

                    {/* Key takeaways bullet points */}
                    {faq.keyPoints && faq.keyPoints.length > 0 && (
                      <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                          Key Policy Points
                        </span>
                        <ul className="space-y-1.5">
                          {faq.keyPoints.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Callout notice / tip */}
                    {faq.callout && (
                      <div
                        className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                          faq.callout.type === 'warning'
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : faq.callout.type === 'tip'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold mr-1">
                            {faq.callout.type === 'warning'
                              ? 'Important Policy Notice:'
                              : faq.callout.type === 'tip'
                              ? 'Pro Tip:'
                              : 'Good to Know:'}
                          </span>
                          <span>{faq.callout.text}</span>
                        </div>
                      </div>
                    )}

                    {/* Footer bar with tags & helpful rating */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Topics:</span>
                        {faq.tags.slice(0, 4).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-500">Was this helpful?</span>
                        {feedback !== undefined ? (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Response recorded
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleFeedback(faq.id, true)}
                              className="px-2 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Yes</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(faq.id, false)}
                              className="px-2 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>No</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions & Escalation Box */}
      <div className="rounded-2xl bg-linear-to-br from-slate-900 via-slate-850 to-blue-950 p-6 sm:p-7 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                Still have questions?
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
              Speak with a VERTEX Service Specialist
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Our 24x7 operations helpline is available round-the-clock for real-time dispatch status,
              emergency leaks, power outages, and warranty claims.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <a
              href="tel:18001238378"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 1800-VERTEX</span>
            </a>

            {onNavigateToSupport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToSupport}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
              >
                Raise Support Ticket
              </Button>
            )}
          </div>
        </div>

        {/* Quick links footer */}
        <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-slate-300">
          {onNavigateToBookService && (
            <button
              onClick={onNavigateToBookService}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              <span>Book a Service Now</span>
            </button>
          )}

          {onNavigateToInvoices && (
            <button
              onClick={onNavigateToInvoices}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Download Past Invoices</span>
            </button>
          )}

          <div className="text-slate-400 text-[11px] ml-auto">
            VERTEX Customer Assurance Standard v4.2 • Updated October 2026
          </div>
        </div>
      </div>
    </div>
  );
};
