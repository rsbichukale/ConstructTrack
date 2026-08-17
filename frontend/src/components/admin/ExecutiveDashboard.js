'use client';

import React from 'react';
import { Building2, CheckCircle2, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { getAppState, calculateSiteProgress, calculateWingProgress, calculateFloorProgress } from '../../lib/dbState';

export const ExecutiveDashboard = () => {
  const state = getAppState();

  const overallSiteProgress = calculateSiteProgress(1);

  const availableWings = (state.wings && state.wings.length > 0)
    ? state.wings.map(w => w.wing_code || w.wingCode || w.name || w)
    : Array.from(new Set((state.flats || []).map(f => f.wing))).filter(Boolean);
  const wingsList = availableWings.length > 0 ? availableWings : ['B1'];

  const flatTasks = state.flatTasks || [];
  const totalTasks = flatTasks.length;
  const approvedTasksCount = flatTasks.filter(t => t.status === 'APPROVED').length;
  const inProgressCount = flatTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'INSPECTION_REQUESTED').length;
  const blockedCount = flatTasks.filter(t => t.status === 'REWORK' || !!t.blockerReason).length;

  const blockedTasks = flatTasks.filter(t => t.status === 'REWORK' || !!t.blockerReason);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Overall Site Completion</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-white">{overallSiteProgress}%</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Real-time
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div className="bg-sky-500 h-full transition-all" style={{ width: `${overallSiteProgress}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Tasks Approved / Matrix Scale</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-white">{approvedTasksCount}</span>
            <span className="text-xs text-slate-400 font-mono">/ {totalTasks} Tasks</span>
          </div>
          <div className="text-xs text-slate-400">
            <span className="text-amber-400 font-bold">{inProgressCount}</span> in progress
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Active Trade Delay Blockers</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-rose-400">{blockedCount}</span>
            <span className="text-xs text-rose-400 font-bold">Action Needed</span>
          </div>
          <div className="text-xs text-slate-400">Requires supervisor intervention</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Active Trade Contractors</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">{(state.contractors || []).filter(c => c.status === 'ACTIVE').length}</span>
          </div>
          <div className="text-xs text-slate-400">{(state.contractors || []).length} total registered</div>
        </div>
      </div>

      {/* Dynamic Wings Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wingsList.map((wingName) => {
          const wingProg = calculateWingProgress(wingName);
          const wingFloors = Array.from(
            new Set((state.flats || []).filter(f => f.wing === wingName).map(f => f.floorNumber))
          ).sort((a, b) => a - b);

          return (
            <div key={wingName} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-base">Wing {wingName} Progress Overview</h4>
                <span className="font-mono text-sky-400 font-extrabold text-lg">{wingProg}%</span>
              </div>
              <div className="space-y-2">
                {wingFloors.length > 0 ? (
                  wingFloors.map((flr) => {
                    const flrProg = calculateFloorProgress(wingName, flr);
                    return (
                      <div key={flr} className="flex items-center space-x-3 text-xs">
                        <span className="w-16 text-slate-400 font-mono">Floor {flr}</span>
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-sky-500 h-full transition-all" style={{ width: `${flrProg}%` }} />
                        </div>
                        <span className="w-10 text-right font-mono font-bold text-slate-300">{flrProg}%</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">No floors initialized for Wing {wingName}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {blockedTasks.length > 0 && (
        <div className="bg-slate-900 border border-rose-800/80 p-5 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Active Contractor Delay & Blocker Notifications</span>
          </div>

          <div className="space-y-2">
            {blockedTasks.slice(0, 5).map((t) => {
              const flat = (state.flats || []).find(f => f.id === t.flatId);
              const cat = (state.taskCatalog || []).find(c => c.id === t.taskCatalogId);
              const contractor = (state.contractors || []).find(c => c.id === t.assignedContractorId);

              return (
                <div key={t.id} className="p-3 bg-slate-950 border border-rose-900/40 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">
                      Flat {flat?.wing}-{flat?.flatNumber}: {cat?.taskName}
                    </div>
                    <div className="text-[11px] text-rose-300 font-medium mt-0.5">
                      ⚠️ Reason: {t.blockerReason || 'Rework flag'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-300">{contractor?.companyName || 'Unassigned'}</span>
                    <div className="text-[10px] text-slate-500">{contractor?.phone || ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
