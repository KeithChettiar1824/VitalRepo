import React, { type ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  badge?: {
    text: string;
    type: 'good' | 'warning' | 'critical' | 'neutral';
  };
  onClick?: () => void;
  clickable?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  onClick,
  clickable = false
}) => {
  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'good':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-xs transition-all ${
        clickable ? 'cursor-pointer hover:border-[#4169F1]/40 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-[#172033] tracking-tight">{value}</span>
        {badge && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getBadgeClass(
              badge.type
            )}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-2 text-xs text-slate-500 leading-relaxed">{subtitle}</p>}
    </div>
  );
};
