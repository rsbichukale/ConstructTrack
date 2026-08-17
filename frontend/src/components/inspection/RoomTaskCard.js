'use client';

import React from 'react';
import { Lock, Zap, CheckCircle2, Clock, AlertOctagon, UserCheck, Camera } from 'lucide-react';
import { getTaskPhaseNumber } from './RoomInspector';

export const RoomTaskCard = ({
  task,
  catalogItem,
  assignedContractor,
  isCritical,
  isLocked,
  lockWarning,
  onClick,
  onQuickStatusChange,
}) => {
  const isApproved = task.status === 'APPROVED';
  const isInProgress = task.status === 'IN_PROGRESS' || task.status === 'INSPECTION_REQUESTED';
  const isAssigned = task.status === 'ASSIGNED';
  const isDelayed = task.status === 'DELAYED';
  const isRework = task.status === 'REWORK' || !!task.blockerReason;

  let cardBorder = 'border-slate-800 bg-slate-900 hover:border-slate-700';

  if (isApproved) {
    cardBorder = 'border-emerald-800/80 bg-emerald-950/30 hover:border-emerald-600';
  } else if (isRework) {
    cardBorder = 'border-rose-800/80 bg-rose-950/30 hover:border-rose-600';
  } else if (isDelayed) {
    cardBorder = 'border-orange-800/80 bg-orange-950/30 hover:border-orange-600';
  } else if (isInProgress) {
    cardBorder = 'border-amber-800/80 bg-amber-950/30 hover:border-amber-600';
  } else if (isAssigned) {
    cardBorder = 'border-sky-800/80 bg-sky-950/30 hover:border-sky-600';
  }

  const handleQuickTap = (e, status, pct) => {
    e.stopPropagation();
    if (onQuickStatusChange) {
      onQuickStatusChange(status, pct);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border text-left space-y-3 transition transform active:scale-[0.99] shadow-md flex flex-col justify-between cursor-pointer ${cardBorder}`}
    >
      <div className="flex items-start justify-between w-full">
        <div>
          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
            <span className="text-[10px] font-black text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-md uppercase">
              PHASE {getTaskPhaseNumber(catalogItem)}
            </span>
            <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-md uppercase">
              {catalogItem.tradeType}
            </span>
            {isCritical && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded-md uppercase flex items-center space-x-1">
                <Zap className="w-3 h-3 text-rose-400" />
                <span>CRITICAL</span>
              </span>
            )}
          </div>
          <h3 className="font-extrabold text-white text-sm mt-1.5 leading-snug">
            {catalogItem.taskName}
          </h3>
        </div>

        {isLocked && (
          <div 
            className="p-1 bg-amber-950 text-amber-400 rounded-lg border border-amber-800 shrink-0" 
            title={lockWarning || 'Sequence warning: Prior trade in progress'}
          >
            <Lock className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2.5 py-1 rounded-lg">
        <div className="flex items-center space-x-1.5 min-w-0">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-bold truncate">
            {assignedContractor ? assignedContractor.companyName : 'Unassigned Contractor'}
          </span>
        </div>
      </div>

      <div className="w-full space-y-1">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 font-bold">
            {task.status === 'ASSIGNED' ? 'Work Assigned' :
             task.status === 'IN_PROGRESS' ? 'Work Started' :
             task.status === 'DELAYED' ? 'Work Delayed' :
             task.status === 'REWORK' ? 'Rework Required' :
             task.status === 'APPROVED' ? 'Completed & Approved' : 'Status'}
          </span>
          <span className="font-black text-white">{task.completionPct}%</span>
        </div>
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              isApproved ? 'bg-emerald-500' : isRework ? 'bg-rose-500' : isDelayed ? 'bg-orange-500' : isAssigned ? 'bg-sky-500' : 'bg-amber-500'
            }`}
            style={{ width: `${task.completionPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-800/60" onClick={e => e.stopPropagation()}>
        <button
          onClick={(e) => handleQuickTap(e, 'ASSIGNED', 10)}
          className={`py-2 px-1 rounded-xl text-[10px] font-black flex items-center justify-center space-x-1 transition min-h-[40px] ${
            isAssigned
              ? 'bg-sky-600 text-white border border-sky-400 shadow-lg'
              : 'bg-sky-950/60 hover:bg-sky-900 text-sky-400 border border-sky-800/80'
          }`}
          title="Mark Work Assigned"
        >
          <UserCheck className="w-3 h-3" />
          <span>Assigned</span>
        </button>

        <button
          onClick={(e) => handleQuickTap(e, 'IN_PROGRESS', 50)}
          className={`py-2 px-1 rounded-xl text-[10px] font-black flex items-center justify-center space-x-1 transition min-h-[40px] ${
            isInProgress && !isApproved
              ? 'bg-amber-600 text-white border border-amber-400 shadow-lg'
              : 'bg-amber-950/60 hover:bg-amber-900 text-amber-400 border border-amber-800/80'
          }`}
          title="Mark Work Started / In Progress"
        >
          <Clock className="w-3 h-3" />
          <span>Started</span>
        </button>

        <button
          onClick={(e) => handleQuickTap(e, 'REWORK', 0)}
          className={`py-2 px-1 rounded-xl text-[10px] font-black flex items-center justify-center space-x-1 transition min-h-[40px] ${
            isRework
              ? 'bg-rose-600 text-white border border-rose-400 shadow-lg'
              : 'bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/80'
          }`}
          title="Mark Rework Required"
        >
          <AlertOctagon className="w-3 h-3" />
          <span>Rework</span>
        </button>

        <button
          onClick={(e) => handleQuickTap(e, 'APPROVED', 100)}
          className={`py-2 px-1 rounded-xl text-[10px] font-black flex items-center justify-center space-x-1 transition min-h-[40px] ${
            isApproved
              ? 'bg-emerald-600 text-white border border-emerald-400 shadow-lg'
              : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/80'
          }`}
          title="Mark Completed & Approved"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Approved</span>
        </button>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 text-sky-400 font-extrabold text-xs rounded-xl border border-slate-800 hover:border-sky-500/50 flex items-center justify-between transition mt-1"
      >
        <span className="flex items-center space-x-1.5">
          <Camera className="w-3.5 h-3.5 text-sky-400" />
          <span>Inspect Task & Upload Photos</span>
        </span>
        <span className="text-[11px] font-black text-sky-400">Inspect Task →</span>
      </button>
    </div>
  );
};
