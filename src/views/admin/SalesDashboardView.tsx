import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import {
  Target,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Phone,
  Mail,
  Shield,
  Briefcase,
  Layers,
  ChevronRight,
  FileCheck,
} from 'lucide-react';

interface SalesDashboardProps {
  onNavigateToLeads?: () => void;
}

export const SalesDashboardView: React.FC<SalesDashboardProps> = ({ onNavigateToLeads }) => {
  const { user } = useAuth();
  const { addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [targetData, setTargetData] = useState<any>(null);
  const [perfData, setPerfData] = useState<any>(null);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [myLeads, setMyLeads] = useState<any[]>([]);

  useEffect(() => {
    loadPersonalSalesData();
  }, [user?.id]);

  const loadPersonalSalesData = async () => {
    setLoading(true);
    try {
      const [tRes, pRes, pipeRes, leadsRes] = await Promise.all([
        api.getSalesTargets().catch(() => null),
        api.getSalesPerformance().catch(() => null),
        api.getSalesPipeline().catch(() => null),
        api.getLeads().catch(() => []),
      ]);

      if (tRes && tRes.success) setTargetData(tRes.data);
      if (pRes && pRes.success) setPerfData(pRes.data);
      if (pipeRes && pipeRes.success) setPipelineData(pipeRes.data);
      if (Array.isArray(leadsRes)) {
        setMyLeads(leadsRes);
      } else if (leadsRes && Array.isArray((leadsRes as any).data)) {
        setMyLeads((leadsRes as any).data);
      }
    } catch (err: any) {
      console.error('Failed to load personal sales metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const monthlyTarget = targetData?.monthly_target || 500000;
  const achievedVolume = targetData?.achieved_volume || 0;
  const achievementRate = targetData?.achievement_percentage ?? Math.min(100, Math.round((achievedVolume / monthlyTarget) * 1000) / 10);
  const wonDealsCount = targetData?.won_deals || perfData?.won_deals_count || myLeads.filter((l) => l.stage === 'WON' || l.status === 'WON').length;
  const activeLeads = myLeads.filter((l) => !['WON', 'LOST'].includes(l.stage || l.status));
  const activePipelineValue = activeLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
  const winRate = myLeads.length > 0 ? Math.round((wonDealsCount / myLeads.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner with Personal Data Scope Guarantee */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Sales Quota & Performance Console
              </h1>
              <Badge variant="neutral" size="sm">
                Personal Scope
              </Badge>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Assigned Representative: <strong className="text-slate-800">{user?.name}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Jurisdiction: <strong className="text-slate-800">{targetData?.territory || 'Delhi NCR'}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ArrowUpRight className="w-4 h-4" />}
              onClick={onNavigateToLeads || (() => {
                if (typeof window !== 'undefined') window.location.href = '/crm/leads';
              })}
            >
              Open Lead Pipeline
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Primary 4 Personal KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Monthly Target */}
        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Monthly Target
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            ₹{monthlyTarget.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Achievement</span>
              <span className="font-bold text-blue-600">{achievementRate}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, achievementRate))}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Card 2: Achieved Revenue */}
        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Achieved Volume
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2 tracking-tight">
            ₹{achievedVolume.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Closed & verified deals</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {wonDealsCount} Won
            </span>
          </div>
        </Card>

        {/* Card 3: Active Assigned Leads */}
        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              My Active Leads
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {activeLeads.length}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Active pipeline value</span>
            <span className="font-bold text-slate-800">
              ₹{activePipelineValue.toLocaleString('en-IN')}
            </span>
          </div>
        </Card>

        {/* Card 4: Conversion Win Rate */}
        <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Deal Win Rate
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-600 mt-2 tracking-tight">
            {winRate}%
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total allocated leads</span>
            <span className="font-bold text-slate-800">{myLeads.length} leads</span>
          </div>
        </Card>
      </div>

      {/* 3. Personal Pipeline Stages Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              My Sales Pipeline Funnel
            </h2>
            <p className="text-xs text-slate-500">Breakdown of opportunities currently assigned to your account</p>
          </div>
          <Badge variant="neutral" size="sm">
            {myLeads.length} Total Records
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'NEW', label: 'New Inquiries', color: 'border-blue-200 bg-blue-50/50 text-blue-700' },
            { key: 'CONTACTED', label: 'Contacted', color: 'border-sky-200 bg-sky-50/50 text-sky-700' },
            { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-200 bg-amber-50/50 text-amber-700' },
            { key: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'border-purple-200 bg-purple-50/50 text-purple-700' },
            { key: 'WON', label: 'Closed Won', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' },
            { key: 'LOST', label: 'Closed Lost', color: 'border-rose-200 bg-rose-50/50 text-rose-700' },
          ].map((st) => {
            const count = myLeads.filter((l) => (l.stage === st.key) || (l.status === st.key)).length;
            const val = myLeads
              .filter((l) => (l.stage === st.key) || (l.status === st.key))
              .reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);

            return (
              <div
                key={st.key}
                className={`p-3 rounded-lg border ${st.color} flex flex-col justify-between`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider">{st.label}</span>
                <div className="mt-2">
                  <div className="text-xl font-extrabold text-slate-900">{count}</div>
                  <div className="text-[10px] text-slate-500 font-medium">₹{val.toLocaleString('en-IN')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. My Assigned Leads Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              My Assigned Leads Queue
            </h2>
            <p className="text-xs text-slate-500">Live opportunities allocated strictly to your profile</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToLeads || (() => {
              if (typeof window !== 'undefined') window.location.href = '/crm/leads';
            })}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Manage All Leads ({myLeads.length})
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead ID & Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Requirement</TableHead>
                <TableHead>Estimated Value</TableHead>
                <TableHead>Status / Stage</TableHead>
                <TableHead>Next Follow-up</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                    No leads currently assigned. New inbound leads will appear here.
                  </TableCell>
                </TableRow>
              ) : (
                myLeads.slice(0, 6).map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-bold text-slate-900">{lead.customer_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{lead.public_id || lead.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {lead.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-900">{lead.service_interest}</div>
                      <div className="text-[11px] text-slate-500">{lead.service_category}</div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      ₹{Number(lead.estimated_value || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lead.stage === 'WON' || lead.status === 'WON'
                            ? 'success'
                            : lead.stage === 'LOST' || lead.status === 'LOST'
                            ? 'error'
                            : 'primary'
                        }
                        size="sm"
                      >
                        {lead.stage || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {lead.expected_followup_date ? (
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{lead.expected_followup_date}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No task set</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
