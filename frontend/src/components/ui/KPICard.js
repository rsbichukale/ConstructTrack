import React from 'react';

export const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'neutral', // 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  color = 'amber', // 'amber' | 'emerald' | 'blue' | 'rose' | 'indigo' | 'purple' | 'slate'
  className = ''
}) => {
  const colorMap = {
    amber: 'border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-slate-950 text-amber-400',
    emerald: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/40 to-slate-950 text-emerald-400',
    blue: 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900/40 to-slate-950 text-blue-400',
    rose: 'border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-slate-900/40 to-slate-950 text-rose-400',
    indigo: 'border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-slate-900/40 to-slate-950 text-indigo-400',
    purple: 'border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-slate-900/40 to-slate-950 text-purple-400',
    slate: 'border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950 text-slate-300'
  };

  const badgeMap = {
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    info: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700'
  };

  const selectedTheme = colorMap[color] || colorMap.amber;

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-slate-700 hover:shadow-xl ${selectedTheme} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h4 className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</h4>
        </div>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 shadow-inner">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {(subtitle || badge) && (
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {badge && (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeMap[badgeType] || badgeMap.neutral}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;
