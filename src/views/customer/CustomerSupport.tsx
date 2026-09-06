import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  PhoneCall,
  Mail,
  HelpCircle,
  ChevronDown,
  Send,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const CustomerSupport: React.FC = () => {
  const { addToast } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const faqs = [
    {
      q: 'How are VERTEX technicians selected and verified?',
      a: 'All technicians undergo rigorous skill evaluations, technical trade tests, background checks and police verification before onboarding. They carry verified VERTEX digital ID cards.',
    },
    {
      q: 'What is covered under the 30-Day Service Guarantee?',
      a: 'If any repair, installation, or electrical issue serviced by VERTEX reoccurs within 30 days, a technician will revisit and resolve it completely free of charge.',
    },
    {
      q: 'How does an AMC (Annual Maintenance Contract) work?',
      a: 'A single annual subscription entitles your premises to scheduled preventive maintenance inspections (up to 4-12 visits), zero visiting fee for emergency breakdown calls, and 15%-25% discounts on all genuine spare parts.',
    },
    {
      q: 'What should I do with the Start-of-Service OTP?',
      a: 'Keep the 4-digit OTP confidential until the technician is physically at your doorstep. Once shared, your job officially begins on the VERTEX platform.',
    },
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      addToast('Missing Info', 'Please enter a subject and inquiry details', 'warning');
      return;
    }
    addToast('Support Ticket Raised', 'Ticket #TCK-9402 logged. An agent will respond shortly.', 'success');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
        <p className="text-xs text-slate-500 mt-1">
          24x7 customer care, maintenance inquiries, and ticket resolution
        </p>
      </div>

      {/* Emergency Helpline Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
            Immediate Assistance
          </span>
          <h3 className="text-base font-bold text-white mt-0.5">
            24x7 Customer Care Helpline
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Priority response for water leaks, power failures, or urgent technician queries
          </p>
        </div>

        <a
          href="tel:18001238378"
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shrink-0 shadow-sm"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call 1800-VERTEX</span>
        </a>
      </div>

      {/* FAQs */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-700" />
          <span>Frequently Asked Questions</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-3">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-slate-950 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-1">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Submit Support Request Form */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-700" />
          <span>Raise a Support Ticket</span>
        </h3>

        <form onSubmit={handleSubmitTicket} className="space-y-3">
          <Input
            label="Inquiry Subject / Booking ID"
            placeholder="e.g. Question regarding AC Repair booking VTX-84920"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Describe your issue or query
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what happened so we can assign the right care specialist..."
              className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <Button
            type="submit"
            size="md"
            variant="primary"
            className="w-full font-bold text-xs"
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            Submit Support Request
          </Button>
        </form>
      </Card>
    </div>
  );
};
