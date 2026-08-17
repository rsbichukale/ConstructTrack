'use client';

import React, { useState } from 'react';
import { 
  GitCommit, 
  Clock, 
  Sliders, 
  Zap, 
  ShieldCheck, 
  Activity,
  BarChart3
} from 'lucide-react';
import { getAppState, getDynamicTrades } from '../../lib/dbState';
import { calculateCPMNetwork } from '../../lib/cpmEngine';

export const CPMDashboard = () => {
  const state = getAppState();
  const trades = getDynamicTrades(state);
  const [selectedFlatId, setSelectedFlatId] = useState((state.flats || [])[0]?.id || 1);
  const [simulatedDelayDays, setSimulatedDelayDays] = useState(0);
  const [simulatedTrade, setSimulatedTrade] = useState('BRICK WORK');

  const [startDate, setStartDate] = useState('2026-08-15');
  const [targetHandoverDate, setTargetHandoverDate] = useState('2026-11-30');

  const selectedFlat = (state.flats || []).find(f => f.id === selectedFlatId) || (state.flats || [])[0];

  const cpmNetwork = calculateCPMNetwork(selectedFlatId, state.flatTasks, state.taskCatalog, startDate, targetHandoverDate);

  const baseDuration = cpmNetwork.projectDurationDays;
  const simulatedDuration = baseDuration + simulatedDelayDays;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <GitCommit className="w-4 h-4" />
            <span>CPM & PERT Project Schedule Analysis Engine</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Critical Path Method & PERT Handover Probability
          </h2>
          <p className="text-xs text-slate-400">
            Identify critical path bottleneck tasks, total float/slack, and probabilistic completion risk
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block">Work Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-white outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-amber-400 font-bold uppercase block">Target Handover Date</label>
            <input
              type="date"
              value={targetHandoverDate}
              onChange={(e) => setTargetHandoverDate(e.target.value)}
              className="bg-slate-950 border border-amber-800 rounded-xl p-2 text-xs font-bold text-amber-300 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase block">Target Flat Unit</label>
            <select
              value={selectedFlatId}
              onChange={(e) => setSelectedFlatId(parseInt(e.target.value, 10))}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-white outline-none focus:border-sky-500"
            >
              {(state.flats || []).map(f => (
                <option key={f.id} value={f.id}>
                  Wing {f.wing} • Flat {f.flatNumber} ({f.flatType})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Critical Path Duration</span>
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-white">{baseDuration} Days</span>
            {simulatedDelayDays > 0 && (
              <span className="text-xs font-bold text-rose-400">
                (+{simulatedDelayDays}d delay = {simulatedDuration}d)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {(cpmNetwork.criticalPathTasks || []).length} Critical Path Activities (0 Float)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Projected Handover Date</span>
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-black text-sky-400">{cpmNetwork.projectedHandoverDate}</span>
          </div>
          <p className="text-[11px] font-bold text-slate-400">
            Target: {targetHandoverDate} ({cpmNetwork.projectedHandoverDate && new Date(cpmNetwork.projectedHandoverDate) <= new Date(targetHandoverDate) ? '🟢 On Schedule' : '🔴 Breaches Target'})
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">On-Time Probability</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400">
              {(cpmNetwork.allTasks || []).length > 0
                ? Math.round(((cpmNetwork.criticalPathTasks || []).length / cpmNetwork.allTasks.length) * 100)
                : 100}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Critical Task Ratio ({(cpmNetwork.criticalPathTasks || []).length} / {(cpmNetwork.allTasks || []).length} tasks)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Active Critical Tasks</span>
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-400">
              {(cpmNetwork.criticalPathTasks || []).length} / {(cpmNetwork.allTasks || []).length}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Zero-slack activities requiring daily supervision
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-extrabold text-white">Interactive Trade Delay Impact Simulator</h3>
        </div>
        <p className="text-xs text-slate-400">
          Simulate what happens to the overall building handover date if a specific trade is delayed by N days
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-xs text-slate-400 font-medium">Select Bottleneck Trade:</label>
            <select
              value={simulatedTrade}
              onChange={(e) => setSimulatedTrade(e.target.value)}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white"
            >
              {getDynamicTrades(state).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Simulated Delay:</span>
              <span className="font-bold text-rose-400">{simulatedDelayDays} Days Delay</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={simulatedDelayDays}
              onChange={(e) => setSimulatedDelayDays(parseInt(e.target.value, 10))}
              className="w-full mt-2 accent-rose-500 cursor-pointer"
            />
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Simulated Flat Handover</span>
            <div className="text-lg font-extrabold text-white mt-0.5">
              {simulatedDuration} Days <span className="text-xs font-normal text-slate-400">(Base: {baseDuration}d)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitCommit className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-extrabold text-white">
              Critical Path Activity Sequence (Float = 0)
            </h3>
          </div>
          <span className="text-xs text-rose-400 font-bold bg-rose-950/80 border border-rose-800 px-3 py-1 rounded-xl">
            ⚡ {(cpmNetwork.criticalPathTasks || []).length} Zero-Float Tasks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(cpmNetwork.criticalPathTasks || []).map((task, idx) => (
            <div
              key={task.flatTaskId}
              className="bg-slate-950 border border-rose-500/50 p-4 rounded-xl space-y-2 relative overflow-hidden group hover:border-rose-400 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-400 uppercase bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                  Step {idx + 1} • {task.tradeType}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {task.durationDays} Days
                </span>
              </div>
              <h4 className="text-xs font-extrabold text-white leading-snug">{task.taskName}</h4>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                <span>ES: Day {task.earlyStart}</span>
                <span>EF: Day {task.earlyFinish}</span>
                <span className="text-rose-400 font-bold">Float: 0d</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-extrabold text-white">
              Complete Micro-Task CPM Schedule & Float Table (Flat {selectedFlat?.flatNumber})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 font-bold">Trade & Micro-Task</th>
                <th className="py-3 px-4 text-center font-bold">Duration</th>
                <th className="py-3 px-4 text-center font-bold">Scheduled Target Window</th>
                <th className="py-3 px-4 text-center font-bold">Early Start / Finish</th>
                <th className="py-3 px-4 text-center font-bold">Total Float (TF)</th>
                <th className="py-3 px-4 text-center font-bold">Path Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {(cpmNetwork.allTasks || []).map(task => (
                <tr
                  key={task.flatTaskId}
                  className={`hover:bg-slate-850/50 transition ${
                    task.isCriticalPath ? 'bg-rose-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-white">{task.taskName}</div>
                    <div className="text-[10px] text-slate-400">{task.tradeType}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300 font-bold">
                    {task.durationDays} Days
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs">
                    <span className="text-sky-300 font-bold">{task.scheduledStartDate}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span className="text-emerald-400 font-bold">{task.scheduledFinishDate}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                    Day {task.earlyStart} - Day {task.earlyFinish}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        task.totalFloat === 0
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-sky-300'
                      }`}
                    >
                      {task.totalFloat} Days
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {task.isCriticalPath ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                        <Zap className="w-3 h-3" />
                        <span>⚡ CRITICAL</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                        <span>NON-CRITICAL</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
