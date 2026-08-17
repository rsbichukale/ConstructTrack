'use client';

import React from 'react';
import { Award } from 'lucide-react';
import { getAppState } from '../../../lib/dbState';

export const ContractorSlaSection = () => {
  const state = getAppState();

  const contractorSlaData = (state.contractors || []).map(c => {
    const assignedTasks = (state.flatTasks || []).filter(t => t.assignedContractorId === c.id);
    const approvedTasks = assignedTasks.filter(t => t.status === 'APPROVED');
    const reworkTasks = assignedTasks.filter(t => t.status === 'REWORK' || !!t.blockerReason);
    const inProgressTasks = assignedTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'INSPECTION_REQUESTED');

    const slaPct = assignedTasks.length > 0 ? Math.round((approvedTasks.length / assignedTasks.length) * 100) : 100;
    const reworkPct = assignedTasks.length > 0 ? Math.round((reworkTasks.length / assignedTasks.length) * 100) : 0;

    let grade = 'A+';
    let gradeBadge = 'bg-emerald-950 text-emerald-400 border-emerald-800';
    if (slaPct < 50) {
      grade = 'D';
      gradeBadge = 'bg-rose-950 text-rose-400 border-rose-800';
    } else if (slaPct < 70) {
      grade = 'C';
      gradeBadge = 'bg-amber-950 text-amber-400 border-amber-800';
    } else if (slaPct < 85) {
      grade = 'B';
      gradeBadge = 'bg-sky-950 text-sky-400 border-sky-800';
    }

    return {
      contractor: c,
      totalAssigned: assignedTasks.length,
      approvedTasks: approvedTasks.length,
      reworkTasks: reworkTasks.length,
      inProgressTasks: inProgressTasks.length,
      slaPct,
      reworkPct,
      grade,
      gradeBadge,
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Trade Contractor SLA & Quality Performance Rating</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">Automated scoring based on approved task completion and rework rates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contractorSlaData.map(({ contractor, totalAssigned, approvedTasks, reworkTasks, inProgressTasks, slaPct, reworkPct, grade, gradeBadge }) => (
          <div key={contractor.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-extrabold text-white text-sm">{contractor.companyName}</h4>
                <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded uppercase">
                  {contractor.tradeType}
                </span>
              </div>
              <div className={`h-10 w-10 rounded-xl font-black text-sm flex items-center justify-center border ${gradeBadge}`}>
                {grade}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Completion Rating (SLA):</span>
                <span className="font-bold text-emerald-400 font-mono">{slaPct}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${slaPct}%` }} />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Rework / Defect Rate:</span>
                <span className="font-bold text-rose-400 font-mono">{reworkPct}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] text-center pt-1">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[9px]">Scope</span>
                <span className="font-bold text-white">{totalAssigned}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[9px]">Approved</span>
                <span className="font-bold text-emerald-400">{approvedTasks}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[9px]">Rework</span>
                <span className="font-bold text-rose-400">{reworkTasks}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
