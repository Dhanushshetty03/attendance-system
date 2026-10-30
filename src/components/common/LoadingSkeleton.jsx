import React from 'react';

export function LoadingSkeleton({ lines = 4, className = '' }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-slate-200 dark:bg-slate-800 rounded"
            style={{ width: `${85 - (i % 3) * 15}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse w-full">
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-t-lg mb-2"></div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3 border-b border-slate-100 dark:border-slate-800">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 bg-slate-200 dark:bg-slate-800 rounded flex-1"
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}
