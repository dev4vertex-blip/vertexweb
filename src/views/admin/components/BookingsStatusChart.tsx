import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { Booking } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { BarChart3, PieChart as PieChartIcon, Filter, Layers } from 'lucide-react';

interface BookingsStatusChartProps {
  bookings: Booking[];
  onSelectStatusFilter?: (statusKey: 'today' | 'pending' | 'active' | 'recent' | 'completed') => void;
}

interface StatusDatum {
  key: string;
  status: string;
  count: number;
  percentage: number;
  color: string;
  mappedQueueTab?: 'today' | 'pending' | 'active' | 'recent' | 'completed';
}

const STATUS_METRICS = [
  { key: 'pending', label: 'Pending', color: '#f59e0b', tab: 'pending' as const },
  { key: 'confirmed', label: 'Confirmed', color: '#3b82f6', tab: 'pending' as const },
  { key: 'assigned', label: 'Assigned', color: '#6366f1', tab: 'active' as const },
  { key: 'in_progress', label: 'In Progress', color: '#0ea5e9', tab: 'active' as const },
  { key: 'completed', label: 'Completed', color: '#10b981', tab: 'completed' as const },
  { key: 'cancelled', label: 'Cancelled', color: '#f43f5e', tab: 'recent' as const },
];

export const BookingsStatusChart: React.FC<BookingsStatusChartProps> = ({
  bookings,
  onSelectStatusFilter,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const { chartData, totalCount, activeCount, completedCount, cancelledCount } = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    bookings.forEach((b) => {
      if (b.status === 'technician_assigned' || b.status === 'accepted') {
        counts.assigned = (counts.assigned || 0) + 1;
      } else if (counts[b.status] !== undefined) {
        counts[b.status] = (counts[b.status] || 0) + 1;
      } else {
        counts[b.status] = (counts[b.status] || 0) + 1;
      }
    });

    const total = bookings.length;
    const active =
      (counts.pending || 0) +
      (counts.confirmed || 0) +
      (counts.assigned || 0) +
      (counts.in_progress || 0);

    const data: StatusDatum[] = STATUS_METRICS.map((cfg) => {
      const c = counts[cfg.key] || 0;
      const pct = total > 0 ? Math.round((c / total) * 100) : 0;
      return {
        key: cfg.key,
        status: cfg.label,
        count: c,
        percentage: pct,
        color: cfg.color,
        mappedQueueTab: cfg.tab,
      };
    });

    return {
      chartData: data,
      totalCount: total,
      activeCount: active,
      completedCount: counts.completed || 0,
      cancelledCount: counts.cancelled || 0,
    };
  }, [bookings]);

  // Custom tooltip renderer for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as StatusDatum;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 min-w-[140px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-slate-100">{data.status}</span>
          </div>
          <div className="text-slate-300 flex justify-between gap-4">
            <span>Bookings:</span>
            <span className="font-extrabold text-white">{data.count}</span>
          </div>
          <div className="text-slate-400 flex justify-between gap-4 mt-0.5">
            <span>Share:</span>
            <span className="font-semibold text-slate-200">{data.percentage}%</span>
          </div>
          {onSelectStatusFilter && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-blue-400 font-medium flex items-center gap-1">
              <span>Click to view in queue</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-5 bg-white border border-slate-200 shadow-xs" id="bookings-by-status-chart">
      {/* Header with Title & Chart Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Bookings by Status</h3>
            <Badge variant="neutral" size="sm">
              {totalCount} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline distribution across all operational lifecycles
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              chartType === 'bar'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Bar Chart View"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bar</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('pie')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              chartType === 'pie'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Donut / Pie View"
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Donut</span>
          </button>
        </div>
      </div>

      {/* Main Chart Visualization using Recharts */}
      <div className="w-full h-64 min-w-0">
        {totalCount === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <Layers className="w-8 h-8 mb-2 stroke-1" />
            <p className="text-xs font-semibold text-slate-600">No booking records found</p>
          </div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length && onSelectStatusFilter) {
                  const datum = state.activePayload[0].payload as StatusDatum;
                  if (datum.mappedQueueTab) {
                    onSelectStatusFilter(datum.mappedQueueTab);
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="status"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.8 }} />
              <Bar
                dataKey="count"
                radius={[5, 5, 0, 0]}
                className="cursor-pointer transition-opacity hover:opacity-85"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.filter((d) => d.count > 0)}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="count"
                nameKey="status"
                onClick={(entry: any) => {
                  if (onSelectStatusFilter && entry && entry.mappedQueueTab) {
                    onSelectStatusFilter(entry.mappedQueueTab);
                  }
                }}
                className="cursor-pointer"
              >
                {chartData
                  .filter((d) => d.count > 0)
                  .map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) => {
                  const item = chartData.find((d) => d.status === value);
                  return (
                    <span className="text-xs text-slate-700 font-medium">
                      {value} <span className="font-bold text-slate-900">({item?.count || 0})</span>
                    </span>
                  );
                }}
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ paddingTop: 8, fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Interactive Status Breakdown Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-4 mt-4 border-t border-slate-100">
        {chartData.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              if (onSelectStatusFilter && item.mappedQueueTab) {
                onSelectStatusFilter(item.mappedQueueTab);
              }
            }}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-all cursor-pointer border border-slate-100 group"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[11px] font-semibold text-slate-600 truncate group-hover:text-slate-900">
                {item.status}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-extrabold text-slate-900">
                {item.count}
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
