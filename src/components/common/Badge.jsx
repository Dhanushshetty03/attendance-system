import React from 'react';

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    present: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    absent: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    leave: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    low: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    critical: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
    info: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    student: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    faculty: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  };

  const selectedVariant = variants[variant.toLowerCase()] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${selectedVariant} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, text }) {
  const s = (status || '').toUpperCase();
  let variant = 'default';
  let label = text || s;

  if (s === 'PRESENT') {
    variant = 'present';
    label = text || 'Present';
  } else if (s === 'ABSENT') {
    variant = 'absent';
    label = text || 'Absent';
  } else if (s === 'LEAVE') {
    variant = 'leave';
    label = text || 'Leave';
  } else if (s === 'GOOD' || s === 'ELIGIBLE' || s === 'APPROVED' || s === 'ON_TRACK') {
    variant = 'good';
  } else if (s === 'LOW' || s === 'PENDING' || s === 'BELOW_TARGET') {
    variant = 'low';
  } else if (s === 'CRITICAL' || s === 'SHORTAGE' || s === 'REJECTED' || s === 'UNACHIEVABLE') {
    variant = 'critical';
  }

  return <Badge variant={variant}>{label}</Badge>;
}
