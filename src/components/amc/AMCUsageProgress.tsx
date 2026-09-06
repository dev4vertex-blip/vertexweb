import React from 'react';

interface AMCUsageProgressProps {
  used: number;
  total: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AMCUsageProgress: React.FC<AMCUsageProgressProps> = ({
  used,
  total,
  showLabels = true,
  size = 'md',
  className = '',
}) => {
  const safeTotal = Math.max(1, total);
  const safeUsed = Math.min(safeTotal, Math.max(0, used));
  const remaining = Math.max(0, total - used);
  const percentage = Math.min(100, Math.round((safeUsed / safeTotal) * 100));

  const heightMap = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const getBarColor = () => {
    if (percentage >= 100) return 'bg-amber-500';
    if (percentage >= 75) return 'bg-blue-600';
    return 'bg-emerald-600';
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-800">
            {used} / {total} Visits Used
          </span>
          <span className={`font-medium ${remaining === 0 ? 'text-amber-600' : 'text-slate-500'}`}>
            {remaining} {remaining === 1 ? 'Visit' : 'Visits'} Remaining
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightMap[size]}`}>
        <div
          className={`${heightMap[size]} ${getBarColor()} transition-all duration-300 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
