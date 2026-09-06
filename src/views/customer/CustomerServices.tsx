import React, { useState } from 'react';
import { DEMO_SERVICES, CATEGORIES } from '../../data/mockData';
import { ServiceItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Star, Clock, ShieldCheck, Search, Check } from 'lucide-react';

interface CustomerServicesProps {
  initialCategoryId?: string;
  onSelectService: (service: ServiceItem) => void;
  onQuickBook: (service: ServiceItem) => void;
}

export const CustomerServices: React.FC<CustomerServicesProps> = ({
  initialCategoryId,
  onSelectService,
  onQuickBook,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategoryId || 'all'
  );
  const [search, setSearch] = useState('');

  const filteredServices = DEMO_SERVICES.filter((srv) => {
    const matchesCat =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'ac'
        ? srv.category === 'AC & Cooling'
        : selectedCategory === 'electrical'
        ? srv.category === 'Electrician'
        : selectedCategory === 'plumbing'
        ? srv.category === 'Plumber'
        : selectedCategory === 'carpentry'
        ? srv.category === 'Carpenter'
        : selectedCategory === 'water'
        ? srv.category === 'RO & Water Purifier'
        : selectedCategory === 'appliance'
        ? srv.category === 'Appliance Repair'
        : selectedCategory === 'office'
        ? srv.category === 'Office Maintenance'
        : true;

    const matchesSearch =
      srv.name.toLowerCase().includes(search.toLowerCase()) ||
      srv.description.toLowerCase().includes(search.toLowerCase());

    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Services Catalog</h1>
        <p className="text-xs text-slate-500 mt-1">
          Browse verified home, appliance & workplace maintenance solutions
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service, spare part, problem..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({DEMO_SERVICES.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => (
          <Card key={service.id} className="p-5 flex flex-col justify-between hover:border-slate-300">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="neutral" size="sm" className="mb-2">
                    {service.category}
                  </Badge>
                  <h3 className="text-base font-bold text-slate-900">{service.name}</h3>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-extrabold text-slate-900">₹{service.price}</div>
                  {service.originalPrice && (
                    <div className="text-xs text-slate-400 line-through">₹{service.originalPrice}</div>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {service.description}
              </p>

              {/* Key inclusions */}
              <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-100">
                {service.inclusions.slice(0, 2).map((inc, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {service.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {service.durationMinutes} min
                </span>
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
                  onClick={() => onQuickBook(service)}
                >
                  Book Service
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
