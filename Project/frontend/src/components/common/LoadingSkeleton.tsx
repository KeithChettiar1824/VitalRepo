import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="h-6 bg-slate-200 rounded-md w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-100 rounded-md w-2/3 mb-2"></div>
        <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 h-36">
            <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 h-80">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-6"></div>
          <div className="h-56 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 h-80">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-6"></div>
          <div className="h-56 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};
