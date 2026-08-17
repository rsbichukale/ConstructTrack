import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  const normalized = (status || 'PENDING').toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['PASSED', 'APPROVED', 'VERIFIED', 'PAID', 'RESOLVED'].includes(normalized)) {
    styles = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  } else if (['COMPLETED'].includes(normalized)) {
    styles = 'bg-teal-500/15 text-teal-300 border-teal-500/30';
  } else if (['INSPECTED', 'INSPECTION_PENDING', 'INSPECTION_REQUESTED'].includes(normalized)) {
    styles = 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  } else if (['IN_PROGRESS', 'IN PROGRESS'].includes(normalized)) {
    styles = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  } else if (['WORK_STARTED', 'STARTED'].includes(normalized)) {
    styles = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  } else if (['ASSIGNED'].includes(normalized)) {
    styles = 'bg-sky-500/15 text-sky-300 border-sky-500/30';
  } else if (['FAILED', 'REJECTED', 'CRITICAL', 'HIGH', 'OVERDUE', 'REWORK'].includes(normalized)) {
    styles = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  } else if (['MEDIUM', 'INFO'].includes(normalized)) {
    styles = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
