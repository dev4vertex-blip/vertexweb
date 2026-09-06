import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Bell, Wrench, Award, CheckCircle2, DollarSign } from 'lucide-react';

export const TechnicianNotifications: React.FC = () => {
  const notifs = [
    {
      id: 'tn-1',
      title: 'New Service Job Assigned',
      desc: 'AC Repair at Villa 14B, DLF Phase 4 (JOB-901). Scheduled window: 10:00 AM - 12:00 PM.',
      time: '25 mins ago',
      type: 'job',
    },
    {
      id: 'tn-2',
      title: '5-Star Review Received!',
      desc: 'Customer Siddharth Rao rated your service 5★ with comment: "Quick diagnosis and genuine spare part."',
      time: 'Yesterday',
      type: 'rating',
    },
    {
      id: 'tn-3',
      title: 'Weekly Payout Processed',
      desc: '₹6,480 credited to your registered HDFC bank account.',
      time: '3 days ago',
      type: 'payout',
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Partner Alerts</h1>
        <p className="text-xs text-slate-500 mt-1">
          Job dispatches, payout settlements & rating updates
        </p>
      </div>

      <div className="space-y-3">
        {notifs.map((n) => (
          <Card key={n.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                {n.type === 'job' && <Wrench className="w-5 h-5 text-blue-600" />}
                {n.type === 'rating' && <Award className="w-5 h-5 text-amber-600" />}
                {n.type === 'payout' && <DollarSign className="w-5 h-5 text-emerald-600" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.desc}</p>
                <span className="text-[10px] text-slate-400 mt-1.5 block">{n.time}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
