'use client';

import React, { useState } from 'react';
import { 
  Key, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building, 
  Home, 
  Filter, 
  Download, 
  Sparkles,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { getAppState, calculateFlatProgress } from '../../lib/dbState';

export const SalesHandoverHub = () => {
  const state = getAppState();

  const availableWings = (state.wings && state.wings.length > 0)
    ? state.wings.map(w => w.wing_code || w.wingCode || w.name || w)
    : Array.from(new Set((state.flats || []).map(f => f.wing))).filter(Boolean);
  const wingsList = availableWings.length > 0 ? availableWings : ['B1'];

  const [selectedWing, setSelectedWing] = useState(wingsList[0] || 'B1');
  const [filterStage, setFilterStage] = useState('ALL'); // 'ALL', 'READY', 'FINISHING', 'CIVIL'

  const wingFlats = (state.flats || []).filter(f => f.wing === selectedWing);
  const snagItems = state.snaggingItems || [];

  const flatReadinessData = wingFlats.map(flat => {
    const progress = calculateFlatProgress(flat.id);
    const flatSnags = snagItems.filter(s => s.flatId === flat.id && s.status !== 'RESOLVED');

    let stage = 'CIVIL';
    if (progress === 100 && flatSnags.length === 0) stage = 'READY';
    else if (progress >= 75) stage = 'FINISHING';

    return {
      ...flat,
      progress,
      openSnags: flatSnags.length,
      stage,
      estimatedHandover: progress === 100 
        ? 'Immediate (Ready)' 
        : progress >= 75 
          ? 'Next 15-30 Days' 
          : 'Next 60-90 Days'
    };
  }).filter(f => filterStage === 'ALL' || f.stage === filterStage);

  const readyCount = flatReadinessData.filter(f => f.stage === 'READY').length;
  const finishingCount = flatReadinessData.filter(f => f.stage === 'FINISHING').length;
  const inProgressCount = flatReadinessData.filter(f => f.stage === 'CIVIL').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Key className="w-4 h-4" />
            <span>Sales & Customer Relationship Hub</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Customer Possession Readiness & Handover Tracker
          </h2>
          <p className="text-xs text-slate-400">
            Real-time unit possession velocity, snag-free flat certification & customer handover schedules
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Wing Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Building className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {wingsList.map(w => <option key={w} value={w}>Wing {w}</option>)}
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Stages ({wingFlats.length})</option>
              <option value="READY">✨ Ready for Possession ({readyCount})</option>
              <option value="FINISHING">🎨 Finishing Stage ({finishingCount})</option>
              <option value="CIVIL">🏗️ Civil / In Progress ({inProgressCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-emerald-800/80 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
            <span>Possession Ready Units</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            {readyCount} <span className="text-sm font-normal text-slate-400">Flats</span>
          </div>
          <p className="text-[11px] text-slate-400">100% finished with 0 open defects</p>
        </div>

        <div className="bg-slate-900 border border-amber-800/80 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
            <span>Finishing & Touch-up</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">
            {finishingCount} <span className="text-sm font-normal text-slate-400">Flats</span>
          </div>
          <p className="text-[11px] text-slate-400">Estimated delivery in 15-30 days</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Structure & Civil Works</span>
            <Building className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {inProgressCount} <span className="text-sm font-normal text-slate-400">Flats</span>
          </div>
          <p className="text-[11px] text-slate-400">Civil brickwork, plaster & waterproofing</p>
        </div>
      </div>

      {/* Flats Possession Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
          <Home className="w-4 h-4 text-sky-400" />
          <span>Wing {selectedWing} Unit Inventory & Possession Matrix</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {flatReadinessData.map(flat => {
            const isReady = flat.stage === 'READY';
            const isFinishing = flat.stage === 'FINISHING';

            return (
              <div
                key={flat.id}
                className={`p-4 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                  isReady
                    ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
                    : isFinishing
                      ? 'bg-amber-950/30 border-amber-500/60'
                      : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-extrabold text-white text-base">
                      {flat.wing}-{flat.flatNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {flat.flatType}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Completion</span>
                      <span className={`font-mono font-bold ${isReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {flat.progress}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${isReady ? 'bg-emerald-400' : isFinishing ? 'bg-amber-400' : 'bg-sky-500'}`}
                        style={{ width: `${flat.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{flat.estimatedHandover}</span>
                  </span>

                  {flat.openSnags > 0 ? (
                    <span className="text-rose-400 font-bold text-[10px] bg-rose-950/80 border border-rose-800 px-1.5 py-0.5 rounded">
                      {flat.openSnags} Snags
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">
                      Snag Free ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
