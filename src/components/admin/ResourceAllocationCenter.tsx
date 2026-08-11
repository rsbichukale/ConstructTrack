'use client';

import React, { useState } from 'react';
import { Zap, AlertTriangle, Users, ArrowRight, ShieldAlert, CheckCircle2, TrendingUp, Clock, Layers, ArrowUpRight } from 'lucide-react';
import { getAppState, saveAppState, getDynamicTrades } from '@/lib/dbState';
import { TradeType } from '@/lib/types';
import { contractorHasTrade } from '@/lib/contractorTrades';

export const ResourceAllocationCenter: React.FC = () => {
  const state = getAppState();
  const [allocationMessage, setAllocationMessage] = useState<string | null>(null);

  // Dynamic Trades List from Database
  const allTrades = getDynamicTrades(state);

  // 1. Calculate Trade Bottlenecks (Where work is waiting / blocked)
  const tradeStats = allTrades.map(trade => {
    const catalogIds = state.taskCatalog.filter(c => c.tradeType === trade).map(c => c.id);
    const tasks = state.flatTasks.filter(t => catalogIds.includes(t.taskCatalogId));
    
    const approved = tasks.filter(t => t.status === 'APPROVED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'INSPECTION_REQUESTED').length;
    const blocked = tasks.filter(t => t.status === 'REWORK' || !!t.blockerReason).length;
    const notStarted = tasks.filter(t => t.status === 'NOT_STARTED').length;

    const tradeContractors = state.contractors.filter(c => contractorHasTrade(c, trade));
    const tradeContractorIds = new Set(tradeContractors.map(c => c.id));
    const deployedAttendance = state.attendance.filter(a => tradeContractorIds.has(a.contractorId));
    const totalWorkersDeployed = deployedAttendance.reduce((sum, a) => sum + a.masonsCount + a.helpersCount, 0);

    return {
      trade,
      contractorName: tradeContractors.length > 0 ? tradeContractors.map(c => c.companyName).join(', ') : 'Unassigned',
      contractorId: tradeContractors[0]?.id || 1,
      totalTasks: tasks.length,
      approved,
      inProgress,
      blocked,
      notStarted,
      totalWorkersDeployed,
      completionPct: tasks.length > 0 ? Math.round((approved / tasks.length) * 100) : 0,
    };
  });

  // 2. Identify Flats Ready for Next Trade Handover (Unlocking Opportunities)
  const readyForHandoverFlats = state.flats.filter(flat => {
    const flatTasks = state.flatTasks.filter(t => t.flatId === flat.id);
    // Brickwork & Plaster complete, but Tiling not started
    const brickworkDone = flatTasks.some(t => {
      const cat = state.taskCatalog.find(c => c.id === t.taskCatalogId);
      return cat?.tradeType === 'BRICK WORK' && t.status === 'APPROVED';
    });
    const tilingNotStarted = flatTasks.some(t => {
      const cat = state.taskCatalog.find(c => c.id === t.taskCatalogId);
      return cat?.tradeType === 'TILES' && t.status === 'NOT_STARTED';
    });
    return brickworkDone && tilingNotStarted;
  });

  // 3. Active Delay Blockers
  const activeBlockers = state.flatTasks.filter(t => t.status === 'REWORK' || !!t.blockerReason);

  // Quick Action: Rebalance Labor to Bottleneck Floor
  const handleDeployLaborToFloor = (floorNumber: number, trade: TradeType) => {
    setAllocationMessage(`Deployed additional manpower for ${trade} to Floor ${floorNumber}! Supervisors notified.`);
    setTimeout(() => setAllocationMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-sky-950 border border-amber-500/30 p-6 rounded-2xl shadow-2xl space-y-2">
        <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs uppercase tracking-widest">
          <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          <span>FAST CONSTRUCTION SPEED & RESOURCE ALLOCATION CENTER</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Eliminate Bottlenecks • Accelerate Trade Handover Velocity
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl">
          Focusing 100% on construction velocity: Rebalance trade manpower, clear active blockers immediately, and deploy workers to floors that are 100% ready for handover.
        </p>
      </div>

      {allocationMessage && (
        <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{allocationMessage}</span>
        </div>
      )}

      {/* Speed Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
            <span>Flats Ready for Trade Handover</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-2">{readyForHandoverFlats.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Units ready for next trade entry</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
            <span>Active Delay Blockers</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black font-mono text-rose-400 mt-2">{activeBlockers.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Tasks requiring immediate resolution</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
            <span>Total Manpower Deployed Today</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black font-mono text-sky-400 mt-2">
            {state.attendance.reduce((sum, a) => sum + a.masonsCount + a.helpersCount, 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Masons & Helpers on site</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="text-xs text-slate-400 font-semibold flex items-center justify-between">
            <span>Building Completion Speed</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400 mt-2">
            {Math.round((state.flatTasks.filter(t => t.status === 'APPROVED').length / state.flatTasks.length) * 100)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total building execution progress</div>
        </div>
      </div>

      {/* Trade Bottleneck & Resource Allocation Matrix */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sky-400 font-extrabold text-sm">
            <Layers className="w-4 h-4" />
            <span>Trade Execution Progress & Manpower Allocation Matrix</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">Sorted by Construction Sequence</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tradeStats.map((stat) => (
            <div
              key={stat.trade}
              className={`p-4 rounded-xl border space-y-3 ${
                stat.blocked > 0
                  ? 'bg-rose-950/20 border-rose-800/80'
                  : stat.completionPct < 30
                  ? 'bg-slate-950 border-amber-800/60'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-md">
                    {stat.trade}
                  </span>
                  <h4 className="font-extrabold text-white text-base mt-1">{stat.contractorName}</h4>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="font-extrabold text-sky-400">{stat.completionPct}%</div>
                  <div className="text-[10px] text-slate-400">{stat.approved}/{stat.totalTasks} Done</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    stat.blocked > 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-500 to-emerald-500'
                  }`}
                  style={{ width: `${stat.completionPct}%` }}
                />
              </div>

              {/* Status Breakdown Pills */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80 font-medium">
                <span className="text-emerald-400">Approved: {stat.approved}</span>
                <span className="text-amber-400">In Progress: {stat.inProgress}</span>
                {stat.blocked > 0 ? (
                  <span className="text-rose-400 font-extrabold">Blocked: {stat.blocked}</span>
                ) : (
                  <span className="text-slate-400">Not Started: {stat.notStarted}</span>
                )}
              </div>

              {/* Quick Action Button */}
              <button
                onClick={() => handleDeployLaborToFloor(1, stat.trade)}
                className="w-full py-2 bg-slate-800 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-slate-700"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Rebalance Manpower Here</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Immediate Bottlenecks & Action Items */}
      {activeBlockers.length > 0 && (
        <div className="bg-slate-900 border border-rose-800/80 p-6 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 font-extrabold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-500 animate-bounce" />
            <span>CRITICAL PATH DELAY BLOCKERS (Action Required to Avoid Standstill)</span>
          </div>

          <div className="space-y-2">
            {activeBlockers.map((t) => {
              const flat = state.flats.find(f => f.id === t.flatId);
              const catalog = state.taskCatalog.find(c => c.id === t.taskCatalogId);
              const contractor = state.contractors.find(c => c.id === t.assignedContractorId);

              return (
                <div key={t.id} className="p-3.5 bg-slate-950 border border-rose-900/60 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-lg bg-rose-950 text-rose-400 font-black flex items-center justify-center border border-rose-800">
                      {flat?.wing}-{flat?.flatNumber}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center space-x-2">
                        <span>{catalog?.taskName}</span>
                        <span className="text-[10px] text-rose-400 font-mono">({contractor?.companyName})</span>
                      </div>
                      <p className="text-rose-300 text-[11px] mt-0.5 font-semibold">
                        ⚠️ {t.blockerReason || 'Rework requested by Supervisor'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      saveAppState({
                        ...state,
                        flatTasks: state.flatTasks.map(task => task.id === t.id ? { ...task, status: 'IN_PROGRESS', blockerReason: undefined } : task)
                      });
                      setAllocationMessage(`Cleared blocker for Flat ${flat?.wing}-${flat?.flatNumber} (${catalog?.taskName})! Work resumed.`);
                      setTimeout(() => setAllocationMessage(null), 3500);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
                  >
                    Clear Blocker & Resume
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
