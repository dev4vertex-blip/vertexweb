import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  FileText,
  Download,
  Printer,
  ChevronRight,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  X,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { Booking } from '../../types';

interface CustomerInvoicesProps {
  onBack?: () => void;
  onSelectBooking?: (booking: Booking) => void;
}

export const CustomerInvoices: React.FC<CustomerInvoicesProps> = ({ onBack, onSelectBooking }) => {
  const { bookings, currentCustomer, addToast } = useApp();
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Customer bookings that have invoices (completed or confirmed with payment)
  const invoiceBookings = bookings.filter((b) => {
    // Only customer's bookings
    const isCustomerMatch = !b.customerId || b.customerId === currentCustomer.id;
    if (!isCustomerMatch) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handlePrint = () => {
    addToast('Printing Receipt', 'Preparing invoice format for print...', 'info');
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadPdf = (bookingId: string) => {
    addToast('Downloading Invoice', `Tax Invoice for ${bookingId} saved.`, 'success');
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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Invoices & Receipts</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official GST invoices for your completed and active service bookings
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by invoice #, service name, or booking ID..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-xs"
        />
      </div>

      {/* Invoices List */}
      {invoiceBookings.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No invoices found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Invoices are automatically generated and made available here as soon as you book a service.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoiceBookings.map((b) => {
            const invoiceNum = `INV-${b.id.replace('VTX-', '2026-')}`;
            const subtotal = Math.round((b.amount / 1.18) * 100) / 100;
            const gst = Math.round((b.amount - subtotal) * 100) / 100;

            return (
              <Card
                key={b.id}
                className="p-4 hover:border-slate-300 transition-all cursor-pointer group"
                onClick={() => setSelectedInvoiceBooking(b)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {invoiceNum}
                        </span>
                        <Badge
                          variant={b.paymentStatus === 'Paid Online' ? 'success' : 'neutral'}
                          size="sm"
                        >
                          {b.paymentStatus}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">
                        {b.serviceName}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {b.scheduledDate}
                        </span>
                        <span>•</span>
                        <span>Booking: {b.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-slate-900 block">
                      ₹{b.amount}
                    </span>
                    <span className="text-[10px] text-slate-400">Incl. 18% GST</span>
                    <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoiceBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                    TAX INVOICE
                  </span>
                  <Badge variant="success" size="sm">
                    {selectedInvoiceBooking.paymentStatus}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1.5">
                  INV-{selectedInvoiceBooking.id.replace('VTX-', '2026-')}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInvoiceBooking(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close invoice"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Billed From & Billed To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Service Provider
                </span>
                <div className="font-bold text-slate-900">VERTEX Home & Facility Services LLP</div>
                <div className="text-slate-600 mt-0.5">Cyber City, DLF Phase 2, Gurgaon, HR - 122002</div>
                <div className="text-slate-500 mt-1">GSTIN: 06AAACV1234F1Z8</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Billed To (Customer)
                </span>
                <div className="font-bold text-slate-900">{currentCustomer.name}</div>
                <div className="text-slate-600 mt-0.5">
                  {selectedInvoiceBooking.address.flat}, {selectedInvoiceBooking.address.area}
                </div>
                <div className="text-slate-500 mt-1">
                  {selectedInvoiceBooking.address.city} - {selectedInvoiceBooking.address.pincode}
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-50 p-2.5 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">SAC Code</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              <div className="grid grid-cols-12 p-3 text-xs text-slate-800 border-b border-slate-100 items-center">
                <div className="col-span-6">
                  <span className="font-bold block">{selectedInvoiceBooking.serviceName}</span>
                  <span className="text-[11px] text-slate-500">
                    Category: {selectedInvoiceBooking.category}
                  </span>
                </div>
                <div className="col-span-2 text-center text-slate-500 font-mono text-[11px]">
                  998719
                </div>
                <div className="col-span-2 text-right font-medium">
                  ₹{(Math.round((selectedInvoiceBooking.amount / 1.18) * 100) / 100).toFixed(2)}
                </div>
                <div className="col-span-2 text-right font-bold text-slate-900">
                  ₹{(Math.round((selectedInvoiceBooking.amount / 1.18) * 100) / 100).toFixed(2)}
                </div>
              </div>

              {/* Tax Calculations */}
              <div className="p-3 bg-slate-50/50 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal (Taxable Value)</span>
                  <span>
                    ₹{(Math.round((selectedInvoiceBooking.amount / 1.18) * 100) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (9%)</span>
                  <span>
                    ₹
                    {(
                      Math.round(
                        ((selectedInvoiceBooking.amount -
                          selectedInvoiceBooking.amount / 1.18) /
                          2) *
                          100
                      ) / 100
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST (9%)</span>
                  <span>
                    ₹
                    {(
                      Math.round(
                        ((selectedInvoiceBooking.amount -
                          selectedInvoiceBooking.amount / 1.18) /
                          2) *
                          100
                      ) / 100
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Amount Paid</span>
                  <span>₹{selectedInvoiceBooking.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Meta */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Mode: {selectedInvoiceBooking.paymentStatus}</span>
              </span>
              <span>Authorized Signature: VERTEX Accounts</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadPdf(selectedInvoiceBooking.id)}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
