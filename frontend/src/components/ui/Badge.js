'use client';

import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral', // 'amber', 'emerald', 'sky', 'rose', 'purple', 'indigo', 'teal', 'neutral'
  size = 'sm', // 'xs', 'sm', 'md'
  icon: Icon,
  className = ''
}) => {
  const variantStyles = {
    amber: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
    emerald: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
    sky: 'bg-sky-950/80 text-sky-300 border-sky-800/80',
    rose: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
    purple: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
    indigo: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80',
    teal: 'bg-teal-950/80 text-teal-300 border-teal-800/80',
    neutral: 'bg-slate-900 text-slate-300 border-slate-800'
  };

  const sizeStyles = {
    xs: 'text-[9px] px-1.5 py-0.5 rounded',
    sm: 'text-[10px] px-2 py-0.5 rounded-md',
    md: 'text-xs px-2.5 py-1 rounded-lg'
  };

  return (
    <span className={`inline-flex items-center space-x-1 font-bold border ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size] || sizeStyles.sm} ${className}`}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};
