'use client';

import React, { useState } from 'react';
import { 
  Building, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Search, 
  X, 
  UserCheck, 
  Eye,
  Camera,
  ShieldAlert
} from 'lucide-react';
import { Flat, FlatTask, TaskCatalogItem, Contractor } from '@/lib/types';

interface FloorHeatmapGridProps {
  flats: Flat[];
  flatTasks: FlatTask[];
  taskCatalog: TaskCatalogItem[];
  contractors: Contractor[];
}

export const FloorHeatmapGrid: React.FC<FloorHeatmapGridProps> = ({
  flats,
  flatTasks,
  taskCatalog,
  contractors,
}) => {
  const [selectedWing, setSelectedWing] = useState<'ALL' | 'B1' | 'B2'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);

  const dbFloors = Array.from(new Set((flats || []).map(f => f.floorNumber))).sort((a, b) => b - a);
  const floors = dbFloors.length > 0 ? dbFloors : [7, 6, 5, 4, 3, 2, 1];

  // Helper to compute overall flat completion % and primary status badge
  const getFlatInfo = (flatId: number) => {
    const tasks = flatTasks.filter(t => t.flatId === flatId);
    if (tasks.length === 0) return { pct: 0, status: 'NOT_STARTED', hasBlocker: false };

    const total = tasks.length;
    const approved = tasks.filter(t => t.status === 'APPROVED').length;
    const pct = Math.round((approved / total) * 100);

    const hasRework = tasks.some(t => t.status === 'REWORK' || !!t.blockerReason);
    const hasInspection = tasks.some(t => t.status === 'INSPECTION_REQUESTED');
    const hasInProgress = tasks.some(t => t.status === 'IN_PROGRESS');

    let status = 'NOT_STARTED';
    if (pct === 100) status = 'APPROVED';
    else if (hasRework) status = 'REWORK';
    else if (hasInspection) status = 'INSPECTION_REQUESTED';
    else if (hasInProgress || pct > 0) status = 'IN_PROGRESS';

    return { pct, status, hasBlocker: hasRework, tasks };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30';
      case 'INSPECTION_REQUESTED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30';
      case 'IN_PROGRESS':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/50 hover:bg-sky-500/30';
      case 'REWORK':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/50 hover:bg-rose-500/30';
      default:
        return 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800';
    }
  };

  // Filter flats by wing
  const filteredFlats = flats.filter(f => selectedWing === 'ALL' || f.wing === selectedWing);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white tracking-wide">2D Site Floor Heatmap Matrix</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status overview of all 70 flats across Wings B1 & B2 (Floors 1 to 7)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Wing Selector */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            {(['ALL', 'B1', 'B2'] as const).map(w => (
              <button
                key={w}
                onClick={() => setSelectedWing(w)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedWing === w 
                    ? 'bg-emerald-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {w === 'ALL' ? 'Both Wings' : `Wing ${w}`}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Ready / Handover (100%)</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="INSPECTION_REQUESTED">Inspection Requested</option>
            <option value="REWORK">Rework / Blocker Alert</option>
            <option value="NOT_STARTED">Not Started</option>
          </select>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <span className="text-slate-400 font-semibold uppercase text-[10px]">Status Legend:</span>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Approved (100%)</span>
        </div>
        <div className="flex items-center gap-1.5 text-sky-400">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
          <span>Inspection Pending</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span>Rework / Blocker</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span>
          <span>Not Started</span>
        </div>
      </div>

      {/* Floor Matrix Grid */}
      <div className="space-y-4">
        {floors.map(floorNum => {
          const floorFlats = filteredFlats.filter(f => f.floorNumber === floorNum);
          if (floorFlats.length === 0) return null;

          return (
            <div key={floorNum} className="flex items-center gap-3">
              {/* Floor Label */}
              <div className="w-24 shrink-0 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-center">
                <div className="text-xs font-bold text-white">Floor {floorNum}</div>
                <div className="text-[10px] text-slate-400">{floorFlats.length} Flats</div>
              </div>

              {/* Flat Cards Grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                {floorFlats.map(flat => {
                  const { pct, status, hasBlocker } = getFlatInfo(flat.id);

                  if (selectedStatusFilter !== 'ALL' && status !== selectedStatusFilter) {
                    return null;
                  }

                  return (
                    <button
                      key={flat.id}
                      onClick={() => setSelectedFlat(flat)}
                      className={`relative flex flex-col items-center justify-between p-2.5 rounded-xl border transition-all duration-200 text-left ${getStatusColor(status)}`}
                    >
                      {hasBlocker && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                        </span>
                      )}
                      
                      <div className="flex items-center justify-between w-full text-[11px] font-bold">
                        <span>{flat.wing}-{flat.flatNumber}</span>
                      </div>

                      <div className="my-1 text-center">
                        <div className="text-sm font-extrabold">{pct}%</div>
                        <div className="text-[9px] uppercase tracking-tighter opacity-80">{flat.flatType}</div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full bg-slate-950/40 rounded-full h-1 mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-current rounded-full" 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flat Inspection Detail Modal */}
      {selectedFlat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-400" />
                  Flat {selectedFlat.wing}-{selectedFlat.flatNumber} Execution Detail
                </h4>
                <p className="text-xs text-slate-400">Wing {selectedFlat.wing} • Floor {selectedFlat.floorNumber} • {selectedFlat.flatType}</p>
              </div>
              <button 
                onClick={() => setSelectedFlat(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Matrix List for Selected Flat */}
            <div className="space-y-3">
              {flatTasks.filter(t => t.flatId === selectedFlat.id).map(task => {
                const catalog = taskCatalog.find(c => c.id === task.taskCatalogId);
                const contractor = contractors.find(c => c.id === task.assignedContractorId);

                return (
                  <div key={task.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        {catalog?.taskName || `Task #${task.taskCatalogId}`}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Trade: <span className="text-cyan-400">{catalog?.tradeType}</span> • Contractor: <span className="text-slate-300">{contractor?.companyName || 'Unassigned'}</span>
                      </div>
                      {task.blockerReason && (
                        <div className="text-[10px] text-rose-400 flex items-center gap-1 mt-1 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Blocker: {task.blockerReason}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                        task.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                        task.status === 'IN_PROGRESS' ? 'bg-sky-500/20 text-sky-300' :
                        task.status === 'REWORK' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {task.status.replace('_', ' ')} ({task.completionPct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedFlat(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
