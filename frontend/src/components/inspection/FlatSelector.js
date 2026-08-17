'use client';

import React, { useState, useEffect } from 'react';
import { Home, ArrowRight, Circle } from 'lucide-react';
import { calculateFlatProgress, getAppState, subscribeState } from '../../lib/dbState';

export const FlatSelector = ({
  wing,
  floorNumber,
  selectedFlatId,
  onSelectFlat,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  // BUG-04: Subscribe to global state so progress bars re-render when tasks update
  const [, setRerender] = useState(0);
  useEffect(() => {
    setIsMounted(true);
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const floorFlats = (state.flats || []).filter(
    f => f.wing === wing && f.floorNumber === floorNumber
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Home className="w-5 h-5 text-sky-400" />
            <span>Select Flat (Wing {wing} - Floor {floorNumber})</span>
          </h2>
          <p className="text-xs text-slate-400">Choose a unit to inspect flat room zones and micro-tasks</p>
        </div>

        <div className="hidden sm:flex items-center space-x-3 text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="flex items-center space-x-1"><Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" /> <span>Approved</span></span>
          <span className="flex items-center space-x-1"><Circle className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> <span>In Progress</span></span>
          <span className="flex items-center space-x-1"><Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> <span>Blocked</span></span>
          <span className="flex items-center space-x-1"><Circle className="w-2.5 h-2.5 fill-slate-500 text-slate-500" /> <span>Not Started</span></span>
        </div>
      </div>

      {isMounted && state.pinnedFlatIds && state.pinnedFlatIds.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-2">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
            <span>📌 Pinned Inspection Shortcuts (Quick Jump)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.pinnedFlatIds.map(pinnedId => {
              const pinnedFlat = (state.flats || []).find(f => f.id === pinnedId);
              if (!pinnedFlat) return null;
              const p = calculateFlatProgress(pinnedFlat.id);
              return (
                <button
                  key={pinnedId}
                  onClick={() => onSelectFlat(pinnedFlat)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition flex items-center space-x-2 border border-slate-700"
                >
                  <span>Flat {pinnedFlat.wing}-{pinnedFlat.flatNumber}</span>
                  <span className="text-sky-400 font-mono text-[10px]">{p}%</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {floorFlats.map((flat) => {
          const progress = isMounted ? calculateFlatProgress(flat.id) : 0;
          const isSelected = selectedFlatId === flat.id;

          const flatTasks = (state.flatTasks || []).filter(t => t.flatId === flat.id);
          const hasBlocked = flatTasks.some(t => t.status === 'REWORK' || !!t.blockerReason);
          const isApproved = progress === 100;
          const isInProgress = progress > 0 && progress < 100;

          let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
          let statusText = 'Not Started';

          if (isApproved) {
            badgeColor = 'bg-emerald-950 text-emerald-400 border-emerald-800';
            statusText = 'Approved';
          } else if (hasBlocked) {
            badgeColor = 'bg-rose-950 text-rose-400 border-rose-800';
            statusText = 'Blocked';
          } else if (isInProgress) {
            badgeColor = 'bg-amber-950 text-amber-400 border-amber-800';
            statusText = 'In Progress';
          }

          return (
            <button
              key={flat.id}
              onClick={() => onSelectFlat(flat)}
              className={`p-4 rounded-xl border text-left transition relative overflow-hidden group flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-sky-900/80 to-slate-900 border-sky-500 ring-2 ring-sky-500/50 shadow-lg shadow-sky-500/20'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-white text-lg">Unit {flat.flatNumber}</span>
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                      {flat.flatType}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                    {statusText}
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-medium">Wing {flat.wing} • Floor {flat.floorNumber}</div>
              </div>

              <div className="space-y-1.5 mt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Completion</span>
                  <span className="font-mono font-bold text-sky-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isApproved
                        ? 'bg-emerald-500'
                        : hasBlocked
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-sky-500 to-amber-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-sky-400 font-semibold group-hover:translate-x-1 transition-transform pt-2 border-t border-slate-800/80">
                <span>Inspect Room Plan</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
