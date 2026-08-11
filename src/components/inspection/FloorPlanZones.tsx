'use client';

import React from 'react';
import { Grid, Sofa, BedDouble, Bed, Utensils, Bath, Droplets, Wind, Sun, Building, ArrowRight } from 'lucide-react';
import { RoomZone, Flat } from '@/lib/types';
import { getAppState } from '@/lib/dbState';

interface FloorPlanZonesProps {
  flat: Flat;
  selectedZoneId: number | null;
  onSelectZone: (zone: RoomZone) => void;
}

const ICON_MAP: Record<string, any> = {
  Sofa,
  BedDouble,
  Bed,
  Utensils,
  Bath,
  Droplets,
  Wind,
  Sun,
  Building,
};

export const FloorPlanZones: React.FC<FloorPlanZonesProps> = ({
  flat,
  selectedZoneId,
  onSelectZone,
}) => {
  const state = getAppState();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Grid className="w-5 h-5 text-sky-400" />
            <span>Flat {flat.flatNumber} Floor Plan Zones</span>
          </h2>
          <p className="text-xs text-slate-400">Select a room zone on the floor plan to inspect its room-specific micro-tasks</p>
        </div>
      </div>

      {/* Visual Architectural Floor Plan Grid */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl space-y-4">
        <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider flex items-center justify-between">
          <span>2BHK Architectural Layout Map (Flat {flat.flatNumber})</span>
          <span className="text-slate-500 font-mono text-[11px]">9 Room Zones</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.roomZones.map((zone) => {
            const IconComponent = ICON_MAP[zone.iconName || 'Building'] || Building;
            const isSelected = selectedZoneId === zone.id;

            // Calculate zone task progress inside this flat
            const catalogItemIds = state.taskCatalog.filter(c => c.roomZoneId === zone.id).map(c => c.id);
            const zoneTasks = state.flatTasks.filter(t => t.flatId === flat.id && catalogItemIds.includes(t.taskCatalogId));
            
            const totalTasks = zoneTasks.length;
            const approvedTasks = zoneTasks.filter(t => t.status === 'APPROVED').length;
            const avgProgress = totalTasks > 0
              ? Math.round(zoneTasks.reduce((s, t) => s + t.completionPct, 0) / totalTasks)
              : 0;

            return (
              <button
                key={zone.id}
                onClick={() => onSelectZone(zone)}
                className={`p-4 rounded-xl border text-left transition relative group ${
                  isSelected
                    ? 'bg-gradient-to-br from-sky-900/90 via-slate-900 to-slate-900 border-sky-500 ring-2 ring-sky-500/50 shadow-lg shadow-sky-500/20'
                    : 'bg-slate-950/80 border-slate-800 hover:border-sky-500/60 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${
                      isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-sky-400 group-hover:bg-sky-600 group-hover:text-white'
                    } transition`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{zone.zoneLabel}</h3>
                      <p className="text-xs text-slate-400">{totalTasks} Micro-Tasks</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition transform group-hover:translate-x-1" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-400">{approvedTasks}/{totalTasks} Approved</span>
                    <span className="text-sky-400 font-mono">{avgProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        avgProgress === 100 ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
