import React from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  TrendingUp,
  Wallet,
  Calendar,
  Award,
  ArrowUpRight,
  Download,
  Building,
} from 'lucide-react';

export const TechnicianEarnings: React.FC = () => {
  const earningsList = [
    {
      id: 'TXN-401',
      jobId: 'JOB-899',
      service: 'Appliance Repair',
      customer: 'Siddharth Rao',
      date: '6 Sep 2026',
      amount: '₹280',
      status: 'Settled',
    },
    {
      id: 'TXN-398',
      jobId: 'JOB-892',
      service: 'AC Jet Cleaning',
      customer: 'Gaurav Singhal',
      date: '5 Sep 2026',
      amount: '₹420',
      status: 'Settled',
    },
    {
      id: 'TXN-394',
      jobId: 'JOB-884',
      service: 'AC Copper Pipe Brazing',
      customer: 'Priyanka Sen',
      date: '4 Sep 2026',
      amount: '₹650',
      status: 'Settled',
    },
    {
      id: 'TXN-389',
      jobId: 'JOB-879',
      service: 'Split AC Installation',
      customer: 'Alok Kapur',
      date: '3 Sep 2026',
      amount: '₹850',
      status: 'Settled',
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Partner Earnings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Daily cuts, incentive tiers & weekly bank payouts
        </p>
      </div>

      {/* Main Balance Card */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
              Total This Month (Sep 2026)
            </span>
            <div className="text-3xl font-black mt-1">₹38,400</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-blue-400 flex items-center justify-center border border-slate-700">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Next Bank Payout:</span>
            <span className="text-sm font-bold text-emerald-400">Wednesday, 9 Sep</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">₹4,200 pending transfer</span>
          </div>

          <div>
            <span className="text-slate-400 block">Bank Account:</span>
            <span className="text-sm font-bold text-white">HDFC Bank •• 4912</span>
            <span className="text-[11px] text-emerald-400 block mt-0.5">Auto-transfer enabled</span>
          </div>
        </div>
      </div>

      {/* Bonus Tier Progress */}
      <Card className="p-5 border-amber-200 bg-amber-50/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Weekly 5-Star Rating Incentive
            </h3>
          </div>
          <Badge variant="warning" size="sm">
            Tier 2 Active
          </Badge>
        </div>

        <p className="text-xs text-slate-600">
          Complete <strong>3 more 5-star jobs</strong> before Sunday to unlock a{' '}
          <strong>₹1,500 bonus reward</strong>!
        </p>

        <div className="mt-3 w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
          <div className="bg-amber-500 h-full rounded-full w-3/4" />
        </div>
        <span className="text-[10px] text-slate-500 mt-1 block text-right font-semibold">
          9 of 12 jobs completed
        </span>
      </Card>

      {/* Payout History */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Recent Completed Job Credits
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {earningsList.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">{item.service}</span>
                <span className="text-slate-500">
                  {item.customer} • {item.date}
                </span>
              </div>

              <div className="text-right">
                <span className="font-black text-emerald-600 text-sm block">{item.amount}</span>
                <span className="text-[10px] text-slate-400 font-semibold">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
