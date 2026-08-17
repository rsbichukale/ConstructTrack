'use client';

import React from 'react';
import { Filter, Sparkles } from 'lucide-react';

export const RoomHeaderBar = ({
  flat,
  roomZone,
  tasks,
  filteredTasks,
  taskFilter,
  onSetTaskFilter,
  onOpenAddCustomModal,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sky-400 font-bold text-xs uppercase tracking-wider">
            {flat.wing}-{flat.flatNumber} • Floor {flat.floorNumber}
          </div>
          <h2 className="text-xl font-extrabold text-white mt-0.5">
            {roomZone.zoneLabel} Micro-Tasks ({filteredTasks.length}/{tasks.length})
          </h2>
          <p className="text-xs text-slate-400">Contractors auto-assigned by trade type (Click task to change or inspect)</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddCustomModal}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/25 flex items-center space-x-1.5 transition transform hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Add Extra Task to {roomZone.zoneLabel}</span>
          </button>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-amber-400 ml-1" />
            <button
              onClick={() => onSetTaskFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition ${
                taskFilter === 'ALL' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => onSetTaskFilter('ASSIGNED')}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition ${
                taskFilter === 'ASSIGNED' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Assigned ({tasks.filter(t => !!t.assignedContractorId).length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
