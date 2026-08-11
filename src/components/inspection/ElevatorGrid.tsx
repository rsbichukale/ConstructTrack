'use client';

import React, { useState } from 'react';
import { Building2, Circle, Filter } from 'lucide-react';
import { Flat, TradeType } from '@/lib/types';
import { getAppState, calculateFlatProgress } from '@/lib/dbState';

interface ElevatorGridProps {
  wing: 'B1' | 'B2';
  onSelectFlat: (flat: Flat) => void;
}

export const ElevatorGrid: React.FC<ElevatorGridProps> = ({
  wing,
  onSelectFlat,
}) => {
  const state = getAppState();
  const floors = [7, 6, 5, 4, 3, 2, 1]; // Top-down building elevation
  const flatIndices = [1, 2, 3, 4, 5];

  const [selectedTrade, setSelectedTrade] = useState<TradeType | 'ALL'>('ALL');

  const trades: TradeType[] = [
    'BRICK WORK',
    'PLASTER WORK',
    'POP',
    'TILES',
    'PLUMBER',
    'FABRICATION',
    'WATERPROOFING',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <span>2D Elevation Grid Matrix (Wing {wing})</span>
          </h3>
          <p className="text-xs text-slate-400">Building visual matrix across all 35 flats (Filter trade completion velocity)</p>
        </div>

        {/* Trade Filter Dropdown */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <Filter className="w-4 h-4 text-amber-400 ml-1" />
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value as TradeType | 'ALL')}
            className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-2"
          >
            <option value="ALL">All Trades (Overall %)</option>
            {trades.map((t) => (
              <option key={t} value={t}>
                {t} Trade Velocity
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
        <div className="text-[11px] text-slate-400 font-semibold">
          Showing: <span className="text-amber-400 font-bold">{selectedTrade === 'ALL' ? 'Overall Completion' : `${selectedTrade} Progress`}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1"><Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" /> <span>100% Approved</span></span>
          <span className="flex items-center space-x-1"><Circle className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> <span>In Progress</span></span>
          <span className="flex items-center space-x-1"><Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> <span>Rework</span></span>
          <span className="flex items-center space-x-1"><Circle className="w-2.5 h-2.5 fill-slate-600 text-slate-600" /> <span>0%</span></span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="space-y-2">
        {floors.map((floorNum) => (
          <div key={floorNum} className="flex items-center space-x-2">
            {/* Floor Label */}
            <div className="w-16 flex-shrink-0 text-right pr-2 font-extrabold text-xs text-slate-400 font-mono">
              Floor {floorNum}
            </div>

            {/* Flats Row */}
            <div className="grid grid-cols-5 gap-2 flex-1">
              {flatIndices.map((flatIdx) => {
                const flatNumber = `${floorNum}0${flatIdx}`;
                const flat = state.flats.find(f => f.wing === wing && f.flatNumber === flatNumber);
                if (!flat) return <div key={flatIdx} />;

                let progress = 0;
                let hasBlocked = false;

                const flatTasks = state.flatTasks.filter(t => t.flatId === flat.id);

                if (selectedTrade === 'ALL') {
                  progress = calculateFlatProgress(flat.id);
                  hasBlocked = flatTasks.some(t => t.status === 'REWORK' || !!t.blockerReason);
                } else {
                  // Specific trade progress calculation
                  const tradeCatalogIds = state.taskCatalog
                    .filter(c => c.tradeType === selectedTrade)
                    .map(c => c.id);
                  const tradeTasks = flatTasks.filter(t => tradeCatalogIds.includes(t.taskCatalogId));

                  if (tradeTasks.length > 0) {
                    const approvedCount = tradeTasks.filter(t => t.status === 'APPROVED').length;
                    const sumPct = tradeTasks.reduce((acc, t) => acc + t.completionPct, 0);
                    progress = Math.round(sumPct / tradeTasks.length);
                    hasBlocked = tradeTasks.some(t => t.status === 'REWORK' || !!t.blockerReason);
                  }
                }

                let bgColor = 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700';
                let indicatorColor = 'bg-slate-600';

                if (progress === 100) {
                  bgColor = 'bg-emerald-950/70 border-emerald-800 text-emerald-300 hover:border-emerald-500 shadow-md shadow-emerald-950/30';
                  indicatorColor = 'bg-emerald-500';
                } else if (hasBlocked) {
                  bgColor = 'bg-rose-950/70 border-rose-800 text-rose-300 hover:border-rose-500 shadow-md shadow-rose-950/30';
                  indicatorColor = 'bg-rose-500';
                } else if (progress > 0) {
                  bgColor = 'bg-amber-950/70 border-amber-800 text-amber-300 hover:border-amber-500 shadow-md shadow-amber-950/30';
                  indicatorColor = 'bg-amber-500';
                }

                return (
                  <button
                    key={flat.id}
                    onClick={() => onSelectFlat(flat)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between hover:scale-[1.03] ${bgColor}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-extrabold text-xs text-white">{flat.flatNumber}</span>
                      <span className={`w-2 h-2 rounded-full ${indicatorColor}`} />
                    </div>
                    <div className="text-[11px] font-mono font-bold mt-1 text-sky-400">
                      {progress}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
