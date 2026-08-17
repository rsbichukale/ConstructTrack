'use client';

import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-amber-400',
  valueColor = 'text-white',
  trend,
  trendPositive = true,
  className = ''
}) => {
  return (
    <div className={`glass-panel hover:border-slate-700/80 p-5 rounded-3xl space-y-2 transition-all duration-200 shadow-xl ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
        <span>{title}</span>
        {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
      </div>
      <div className={`text-3xl font-black font-mono tracking-tight ${valueColor}`}>
        {value}
      </div>
      {(subtitle || trend) && (
        <div className="flex items-center justify-between text-[11px] pt-1">
          {subtitle && <span className="text-slate-400 font-medium">{subtitle}</span>}
          {trend && (
            <span className={`font-bold font-mono ${trendPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
