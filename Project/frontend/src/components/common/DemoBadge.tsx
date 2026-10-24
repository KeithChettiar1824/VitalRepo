import React from 'react';
import { Database } from 'lucide-react';

interface DemoBadgeProps {
  size?: 'sm' | 'md';
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({ size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <div
      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider rounded-md border ${
        isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } bg-amber-50 text-amber-800 border-amber-300 shadow-xs`}
      title="This analysis uses a curated static demo dataset and does not consume live GitHub API quota."
    >
      <Database className={isSm ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
      <span>DEMO DATA</span>
    </div>
  );
};
