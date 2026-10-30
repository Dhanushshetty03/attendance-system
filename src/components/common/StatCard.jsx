import React from 'react';

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'blue',
  trend,
  className = '',
}) {
  const colorStyles = {
    blue: {
      border: 'border-blue-100 dark:border-blue-900/30',
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    },
    green: {
      border: 'border-emerald-100 dark:border-emerald-900/30',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    },
    amber: {
      border: 'border-amber-100 dark:border-amber-900/30',
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    },
    rose: {
      border: 'border-rose-100 dark:border-rose-900/30',
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
    },
    purple: {
      border: 'border-purple-100 dark:border-purple-900/30',
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    },
  };

  const currentStyle = colorStyles[variant] || colorStyles.blue;

  return (
    <div
      className={`bg-white dark:bg-slate-900 p-5 rounded-xl border ${currentStyle.border} shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </h3>
            {trend && (
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.text}
              </span>
            )}
          </div>
          {subtext && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtext}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${currentStyle.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
