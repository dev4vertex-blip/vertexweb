import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEMO_SERVICES, DEMO_AMC_PLANS, CATEGORIES } from '../../data/mockData';
import { ServiceItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import {
  Search,
  MapPin,
  ShieldCheck,
  Star,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Shield,
  CheckCircle2,
  Calendar,
  Wrench,
  Snowflake,
  Zap,
  Droplets,
  Hammer,
  Tv,
  Building2,
  Wind,
  HelpCircle,
} from 'lucide-react';

interface CustomerHomeProps {
  onNavigateToServices: (categoryId?: string) => void;
  onSelectService: (service: ServiceItem) => void;
  onNavigateToAMC: () => void;
  onNavigateToBookings: () => void;
  onNavigateToOffers?: () => void;
  onNavigateToFAQ?: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onNavigateToServices,
  onSelectService,
  onNavigateToAMC,
  onNavigateToBookings,
  onNavigateToOffers,
  onNavigateToFAQ,
}) => {
  const { currentCustomer, selectedCity, setSelectedCity, bookings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const activeBooking = bookings.find(
    (b) => b.customerId === currentCustomer.id && (b.status === 'confirmed' || b.status === 'technician_assigned' || b.status === 'in_progress')
  );

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'ac':
        return <Snowflake className="w-5 h-5 text-sky-600" />;
      case 'electrical':
        return <Zap className="w-5 h-5 text-amber-600" />;
      case 'plumbing':
        return <Wrench className="w-5 h-5 text-blue-600" />;
      case 'carpentry':
        return <Hammer className="w-5 h-5 text-orange-600" />;
      case 'water':
        return <Droplets className="w-5 h-5 text-cyan-600" />;
      case 'appliance':
        return <Tv className="w-5 h-5 text-indigo-600" />;
      case 'office':
        return <Building2 className="w-5 h-5 text-slate-700" />;
      default:
        return <Wrench className="w-5 h-5 text-slate-700" />;
    }
  };

  const filteredServices = searchQuery.trim()
    ? DEMO_SERVICES.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DEMO_SERVICES;

  return (
    <div className="space-y-6 pb-12">
      {/* Search & Hero Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Certified Indian Technicians • 30-Day Guarantee</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
            Expert Repairs & Maintenance for your Home & Office
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-slate-300">
            Welcome back, {currentCustomer.name}. Instant technician dispatch across {selectedCity}.
          </p>

          {/* Search bar */}
          <div className="mt-5 relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AC repair, electrician, plumber, AMC..."
              className="w-full pl-10 pr-24 py-3 bg-white text-slate-900 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Decorative subtle background angle */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-blue-600/10 to-transparent pointer-events-none hidden sm:block" />
      </div>

      {/* Promotional Offers Strip */}
      {onNavigateToOffers && (
        <button
          onClick={onNavigateToOffers}
          className="w-full p-3.5 bg-gradient-to-r from-amber-50 via-blue-50 to-indigo-50 border border-amber-200/80 rounded-2xl flex items-center justify-between text-left hover:border-amber-300 transition-all cursor-pointer shadow-xs min-h-[44px]"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                <span>Save up to ₹500 on home repairs with code</span>
                <span className="bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-md font-mono text-[11px] font-extrabold tracking-wide">
                  VERTEXNEW
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                View 4 verified seasonal coupons & AMC warranty discounts
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        </button>
      )}

      {/* Ongoing Booking Alert (if any active) */}
      {activeBooking && (
        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {activeBooking.serviceName}
                </span>
                <Badge variant="accent" size="sm">
                  {activeBooking.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Scheduled for {activeBooking.scheduledDate} ({activeBooking.scheduledSlot})
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onNavigateToBookings}
            className="shrink-0 bg-white"
          >
            Track Status
          </Button>
        </div>
      )}

      {/* Service Categories Quick Nav */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Popular Categories</h2>
            <p className="text-xs text-slate-500">Choose a service vertical to view options</p>
          </div>
          <button
            onClick={() => onNavigateToServices()}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigateToServices(cat.id)}
              className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all text-left flex flex-col items-center text-center justify-between group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors mb-2">
                {getCategoryIcon(cat.id)}
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {cat.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {searchQuery ? `Search Results (${filteredServices.length})` : 'Featured Services'}
            </h2>
            <p className="text-xs text-slate-500">
              Verified upfront pricing, 30-day warranty & background-checked experts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-sm"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="neutral" size="sm">
                    {service.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{service.rating}</span>
                    <span className="text-slate-400 font-normal text-[10px]">
                      ({service.reviewsCount})
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-1">{service.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>

                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{service.durationMinutes} mins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Warranty</span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Starting from
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{service.price}
                    </span>
                    {service.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{service.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectService(service)}
                  >
                    Details
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onSelectService(service)}
                  >
                    Book
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* AMC Annual Maintenance Contracts Banner */}
      <div className="rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="max-w-xl">
          <Badge variant="accent" size="sm" className="mb-2 bg-blue-600 text-white border-blue-500">
            VERTEX PROTECT AMC
          </Badge>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Annual Maintenance Contracts for Zero Headache
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Get 4 preventive checkups, 2-4 hr emergency breakdown visits, and 15-25% off spare
            parts for your Residence or Office.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Free AC Power Jet Wash
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Priority Technician Dispatch
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Zero Visiting Charges
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Button
            size="md"
            variant="accent"
            onClick={onNavigateToAMC}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
          >
            Explore AMC Plans
          </Button>
        </div>
      </div>

      {/* Trust & Guarantee Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Police-Verified Experts</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Every technician is KYC verified, skill tested and background checked.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">30-Day Service Warranty</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Free rework if the problem reoccurs within 30 days of service.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">On-Time Or ₹100 Off</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              We respect your schedule. Guaranteed technician arrival in chosen slot.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Strip */}
      {onNavigateToFAQ && (
        <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-2xs border border-slate-200">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Questions about Bookings, OTPs or Payments?</h4>
              <p className="text-[11px] text-slate-500">
                Browse our verified Customer FAQs for transparent pricing, cancellation policies, and safety rules.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToFAQ}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer shrink-0 py-1.5 px-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span>Explore FAQs & Policies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
