'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Layers, CheckCircle2, Clock, RefreshCw, Key } from 'lucide-react';
import { getAppState } from '../../lib/dbState';
import { apiClient } from '../../lib/apiClient';

export const TowerExecutionMatrixSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWing, setSelectedWing] = useState('ALL');

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reports/tower-matrix');
      if (res && res.success) {
        setData(res);
      } else {
        fallbackFromLocal();
      }
    } catch (e) {
      fallbackFromLocal();
    } finally {
      setLoading(false);
    }
  };

  const fallbackFromLocal = () => {
    const s = getAppState();
    const flats = s.flats || [];
    const tasks = s.flatTasks || [];
    const matrix = flats.map(f => {
      const fTasks = tasks.filter(t => t.flatId === f.id);
      const approved = fTasks.filter(t => t.status === 'APPROVED').length;
      const pct = fTasks.length > 0 ? Math.round((approved / fTasks.length) * 100) : 0;
      return {
        id: f.id,
        wing: f.wing || 'B1',
        floorNumber: f.floorNumber || 1,
        flatNumber: f.flatNumber || '101',
        flatType: f.flatType || '2BHK',
        totalTasks: fTasks.length,
        approvedTasks: approved,
        completionPct: pct,
        isPossessionReady: pct === 100
      };
    });

    setData({
      success: true,
      summary: {
        totalFlats: matrix.length,
        readyFlats: matrix.filter(f => f.isPossessionReady).length,
        overallProgressPct: matrix.length > 0 ? Math.round(matrix.reduce((acc, f) => acc + f.completionPct, 0) / matrix.length) : 0,
        totalPhases: 10
      },
      data: matrix
    });
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const summary = data?.summary || {};
  const allFlats = data?.data || [];
  const wingsList = Array.from(new Set(allFlats.map(f => f.wing))).filter(Boolean);
  const flats = allFlats.filter(f => selectedWing === 'ALL' || f.wing === selectedWing);

  // Group flats by floor
  const floorMap = {};
  flats.forEach(f => {
    if (!floorMap[f.floorNumber]) floorMap[f.floorNumber] = [];
    floorMap[f.floorNumber].push(f);
  });
  const sortedFloors = Object.keys(floorMap).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>3,472 Unit Micro-Task Civil Execution</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Tower & Floor Unit Execution Progress Matrix</h2>
          <p className="text-xs text-slate-400">2D visual elevation heatmap tracking unit-by-unit progress percentage and customer possession readiness</p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedWing}
            onChange={(e) => setSelectedWing(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2"
          >
            <option value="ALL">All Wings (B1 & B2)</option>
            {wingsList.map(w => (
              <option key={w} value={w}>Wing {w}</option>
            ))}
          </select>

          <button
            onClick={fetchMatrix}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh Matrix"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-400">Overall Site Completion</div>
          <div className="text-2xl font-black text-sky-400 mt-1">{summary.overallProgressPct || 0}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Weighted Unit Average</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-400">Total Residential Units</div>
          <div className="text-2xl font-black text-white mt-1">{summary.totalFlats || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">2BHK & 3BHK Flats</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-400">Ready for Possession</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{summary.readyFlats || 0}</div>
          <div className="text-[11px] text-emerald-400 font-bold mt-1">100% Tasks Approved</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="text-xs font-bold text-slate-400">Execution Phases</div>
          <div className="text-xl font-black text-purple-400 mt-1">10 Critical Phases</div>
          <div className="text-[11px] text-slate-400 mt-1">CPM Sequence Driven</div>
        </div>
      </div>

      {/* Floor Elevation Heatmap Grid */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>2D Elevation Unit Heatmap Grid</span>
          </h3>
          <div className="flex items-center space-x-3 text-[10px] font-bold">
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span><span>100% Ready</span></span>
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block"></span><span>70-99%</span></span>
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span><span>30-69%</span></span>
            <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-slate-700 inline-block"></span><span>&lt;30%</span></span>
          </div>
        </div>

        <div className="space-y-3">
          {sortedFloors.map(floorNum => {
            const floorFlats = floorMap[floorNum] || [];
            return (
              <div key={floorNum} className="flex items-center space-x-3">
                <div className="w-20 shrink-0 font-extrabold text-xs text-slate-400 font-mono">
                  Floor {floorNum}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 flex-1">
                  {floorFlats.map(f => {
                    const pct = f.completionPct || 0;
                    const colorClass = pct === 100
                      ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                      : pct >= 70
                      ? 'bg-sky-950/80 border-sky-700 text-sky-300'
                      : pct >= 30
                      ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400';

                    return (
                      <div
                        key={f.id}
                        className={`p-2 rounded-xl border text-center transition hover:scale-105 cursor-pointer ${colorClass}`}
                      >
                        <div className="font-extrabold text-xs">{f.wing}-{f.flatNumber}</div>
                        <div className="text-[10px] font-mono mt-0.5">{pct}%</div>
                        {f.isPossessionReady && (
                          <div className="text-[9px] font-black text-emerald-400 flex items-center justify-center space-x-0.5 mt-0.5">
                            <Key className="w-2.5 h-2.5" />
                            <span>READY</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
