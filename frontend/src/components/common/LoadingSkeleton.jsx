import React from 'react';

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm animate-pulse ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
    </div>
    <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-slate-100 rounded w-2/3"></div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm overflow-hidden animate-pulse ${className}`}>
    <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={`h-4 bg-slate-100 rounded ${
                j === 0 ? 'w-1/3' : j === 1 ? 'w-1/4' : 'w-1/6'
              }`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart = ({ height = 'h-64', className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm animate-pulse ${className}`}>
    <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
    <div className={`w-full ${height} bg-slate-100 rounded-xl flex items-end gap-3 p-4`}>
      <div className="w-1/12 bg-slate-200 rounded-t h-2/3"></div>
      <div className="w-1/12 bg-slate-200 rounded-t h-1/2"></div>
      <div className="w-1/12 bg-slate-200 rounded-t h-4/5"></div>
      <div className="w-1/12 bg-slate-200 rounded-t h-1/3"></div>
      <div className="w-1/12 bg-slate-200 rounded-t h-3/4"></div>
      <div className="w-1/12 bg-slate-200 rounded-t h-2/4"></div>
      <div className="w-1/12 bg-slate-200 rounded-t h-5/6"></div>
    </div>
  </div>
);

export default { SkeletonCard, SkeletonTable, SkeletonChart };
