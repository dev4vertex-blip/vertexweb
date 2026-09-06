import React from 'react';

interface VertexLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  light?: boolean;
}

export const VertexLogo: React.FC<VertexLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  light = false,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base font-extrabold tracking-tight',
    md: 'text-xl font-extrabold tracking-tight',
    lg: 'text-2xl font-extrabold tracking-tight',
    xl: 'text-3xl font-extrabold tracking-tight',
  };

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`${iconSizes[size]} bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold relative overflow-hidden shadow-xs shrink-0 border border-slate-700/50`}
      >
        {/* Subtle geometric vertex mark */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/30 to-transparent" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4/5 h-4/5 text-white"
        >
          <path d="M4 4l8 16 8-16" />
          <path d="M12 12l4-8" className="opacity-60" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`${textSizes[size]} font-sans ${
              light ? 'text-white' : 'text-slate-900'
            }`}
          >
            VERTEX
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] font-medium tracking-wide uppercase ${
              light ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Home & Office Services
          </span>
        )}
      </div>
    </div>
  );
};
