import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerAddress } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { MapPin, Plus, CheckCircle2, Trash2, Home, Building2, Briefcase } from 'lucide-react';

export const CustomerAddresses: React.FC = () => {
  const { currentCustomer, setCurrentCustomer, addToast } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New address state
  const [type, setType] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [tag, setTag] = useState('');
  const [flat, setFlat] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Gurgaon');
  const [pincode, setPincode] = useState('122002');

  const handleSetDefault = (id: string) => {
    const updated = currentCustomer.activeAddresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setCurrentCustomer({ ...currentCustomer, activeAddresses: updated });
    addToast('Default Address Changed', 'Preferred service location updated', 'success');
  };

  const handleDelete = (id: string) => {
    if (currentCustomer.activeAddresses.length <= 1) {
      addToast('Cannot Delete', 'You must maintain at least one address on file', 'warning');
      return;
    }
    const updated = currentCustomer.activeAddresses.filter((a) => a.id !== id);
    setCurrentCustomer({ ...currentCustomer, activeAddresses: updated });
    addToast('Address Removed', 'Address successfully deleted', 'info');
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag.trim() || !flat.trim() || !area.trim()) {
      addToast('Missing Fields', 'Please complete the address lines', 'warning');
      return;
    }

    const newAddr: CustomerAddress = {
      id: `addr-${Date.now()}`,
      type,
      tag: tag.trim(),
      flat: flat.trim(),
      area: area.trim(),
      city,
      pincode: pincode.trim(),
      isDefault: currentCustomer.activeAddresses.length === 0,
    };

    setCurrentCustomer({
      ...currentCustomer,
      activeAddresses: [...currentCustomer.activeAddresses, newAddr],
    });

    addToast('Address Added', `${tag} saved to your account`, 'success');
    setIsAddModalOpen(false);
    setTag('');
    setFlat('');
    setArea('');
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saved Addresses</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage service delivery locations for homes and workplaces
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Address
        </Button>
      </div>

      <div className="space-y-3">
        {currentCustomer.activeAddresses.map((addr) => (
          <Card key={addr.id} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 mt-0.5 shrink-0">
                  {addr.type === 'Home' ? (
                    <Home className="w-5 h-5" />
                  ) : (
                    <Building2 className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{addr.tag}</h3>
                    <Badge variant="neutral" size="sm">
                      {addr.type}
                    </Badge>
                    {addr.isDefault && (
                      <Badge variant="accent" size="sm">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {addr.flat}, {addr.area}, {addr.city} - {addr.pincode}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  aria-label="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Address"
        description="Enter residence or workplace location details"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(['Home', 'Office', 'Other'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 text-xs font-bold rounded-lg border text-center transition-colors cursor-pointer ${
                  type === t
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <Input
            label="Address Tag / Label"
            placeholder="e.g. DLF Phase 4 Villa or BKC Office"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            required
          />

          <Input
            label="Flat / Villa / Floor & Building"
            placeholder="e.g. Villa 14B, Hamilton Court"
            value={flat}
            onChange={(e) => setFlat(e.target.value)}
            required
          />

          <Input
            label="Locality / Sector / Street"
            placeholder="e.g. Sector 28, Golf Course Road"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              options={[
                { label: 'Gurgaon', value: 'Gurgaon' },
                { label: 'Delhi', value: 'Delhi' },
                { label: 'Noida', value: 'Noida' },
                { label: 'Mumbai', value: 'Mumbai' },
                { label: 'Bangalore', value: 'Bangalore' },
              ]}
            />

            <Input
              label="Pincode"
              placeholder="122002"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
