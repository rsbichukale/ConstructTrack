'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  Building2, 
  Zap, 
  SlidersHorizontal,
  ChevronRight,
  Filter,
  CheckCheck
} from 'lucide-react';
import { getAppState, subscribeState, updateFlatTaskProgress } from '../../lib/dbState';
import { apiClient } from '../../lib/apiClient';

export const FloorRoomMatrix = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();

  const availableWings = (state.wings && state.wings.length > 0)
    ? state.wings.map(w => (typeof w === 'object' ? (w.wing_code || w.wingCode || w.name) : w)).filter(Boolean)
    : Array.from(new Set((state.flats || []).map(f => f.wing || f.wing_code))).filter(Boolean);
  const wingsList = availableWings;

  const [selectedWing, setSelectedWing] = useState(wingsList[0] || '');

  const availableFloors = Array.from(
    new Set((state.flats || [])
      .filter(f => String(f.wing || f.wing_code || '').toUpperCase() === String(selectedWing || '').toUpperCase())
      .map(f => Number(f.floorNumber || f.floor_number))
    )
  ).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
  const floorsList = availableFloors;

  const [selectedFloor, setSelectedFloor] = useState(floorsList[0] || null);

  // Room Zones
  const allZones = state.roomZones || [];
  const firstZone = allZones[0];
  const [selectedZoneId, setSelectedZoneId] = useState(firstZone?.id ?? '1');
  const [selectedTradeFilter, setSelectedTradeFilter] = useState('ALL');
  const [matrixMessage, setMatrixMessage] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Keep selectedZoneId valid
  useEffect(() => {
    if (allZones.length > 0) {
      const exists = allZones.some(z => String(z.id) === String(selectedZoneId) || String(z.zone_code) === String(selectedZoneId));
      if (!exists) setSelectedZoneId(allZones[0].id ?? allZones[0].zone_code);
    }
  }, [allZones.length, selectedZoneId]);

  const selectedZone = allZones.find(z => String(z.id) === String(selectedZoneId) || String(z.zone_code) === String(selectedZoneId)) || allZones[0];

  const floorFlats = (state.flats || []).filter(f => {
    const fWing = String(f.wing || f.wing_code || '').toUpperCase();
    const sWing = String(selectedWing || '').toUpperCase();
    const fFloor = Number(f.floorNumber || f.floor_number);
    const sFloor = Number(selectedFloor);
    return fWing === sWing && fFloor === sFloor;
  });

  const rawRoomTasks = (state.taskCatalog || []).filter(c => {
    const cZoneId = String(c.roomZoneId ?? c.room_zone_id ?? '');
    const selId = String(selectedZone?.id ?? selectedZoneId ?? '');
    const cZoneCode = String(c.zoneCode ?? c.zone_code ?? c.roomZoneCode ?? '').toUpperCase();
    const selCode = String(selectedZone?.zoneCode ?? selectedZone?.zone_code ?? '').toUpperCase();
    return (cZoneId && cZoneId === selId) || (cZoneCode && selCode && cZoneCode === selCode);
  });

  const tradesList = Array.from(new Set(rawRoomTasks.map(t => t.tradeType || t.trade_type))).filter(Boolean);

  const roomTasks = rawRoomTasks.filter(t => {
    if (selectedTradeFilter === 'ALL') return true;
    return (t.tradeType || t.trade_type) === selectedTradeFilter;
  });

  const handleQuickApproveTask = (flatId, taskCatalogId) => {
    const task = (state.flatTasks || []).find(t => {
      const tFlatId = String(t.flatId ?? t.flat_id ?? '');
      const curFlatId = String(flatId ?? '');
      const tCatId = String(t.taskCatalogId ?? t.task_catalog_id ?? '');
      const curCatId = String(taskCatalogId ?? '');
      return tFlatId === curFlatId && tCatId === curCatId;
    });
    if (!task) return;

    try {
      updateFlatTaskProgress(
        task.id,
        'APPROVED',
        100,
        'Verified in Floor Matrix inspection',
        task.photoUrl || task.photo_url,
        '',
        task.assignedContractorId || task.assigned_contractor_id
      );
    } catch (error) {
      setMatrixMessage(error instanceof Error ? error.message : 'Unable to approve this task.');
      return;
    }

    const flat = (state.flats || []).find(f => String(f.id) === String(flatId));
    const catalog = (state.taskCatalog || []).find(c => String(c.id) === String(taskCatalogId));
    setMatrixMessage(`Approved "${catalog?.taskName || catalog?.task_name}" in Flat ${flat?.wing || flat?.wing_code}-${flat?.flatNumber || flat?.flat_number}!`);
    setTimeout(() => setMatrixMessage(null), 3000);
  };

  // Batch Floor Approval: Approve all flats on this floor for a micro-task
  const handleBatchApproveTaskAcrossFloor = async (catalogItem) => {
    setIsBulkProcessing(true);
    let count = 0;
    try {
      floorFlats.forEach(flat => {
        const task = (state.flatTasks || []).find(t => {
          const tFlatId = String(t.flatId ?? t.flat_id ?? '');
          const curFlatId = String(flat.id ?? '');
          const tCatId = String(t.taskCatalogId ?? t.task_catalog_id ?? '');
          const curCatId = String(catalogItem.id ?? '');
          return tFlatId === curFlatId && tCatId === curCatId;
        });

        if (task && task.status !== 'APPROVED') {
          updateFlatTaskProgress(task.id, 'APPROVED', 100, `Batch approved for Floor ${selectedFloor}`);
          count++;
        }
      });
      setMatrixMessage(`⚡ Batch Approved: "${catalogItem.taskName || catalogItem.task_name}" across ${count} flats on Floor ${selectedFloor}!`);
      setTimeout(() => setMatrixMessage(null), 3500);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Floor Stats
  const totalFloorFlats = floorFlats.length;
  let totalFloorTasks = 0;
  let approvedFloorTasks = 0;

  floorFlats.forEach(flat => {
    const fTasks = (state.flatTasks || []).filter(t => String(t.flatId || t.flat_id) === String(flat.id));
    totalFloorTasks += fTasks.length;
    approvedFloorTasks += fTasks.filter(t => t.status === 'APPROVED' || t.completionPct === 100).length;
  });

  const floorCompletionPct = totalFloorTasks > 0 ? Math.round((approvedFloorTasks / totalFloorTasks) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Floor Matrix Multi-Flat Inspector</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Floor {selectedFloor} Side-by-Side Matrix ({floorFlats.length > 0 ? `Flats ${floorFlats[0]?.flatNumber || floorFlats[0]?.flat_number} - ${floorFlats[floorFlats.length - 1]?.flatNumber || floorFlats[floorFlats.length - 1]?.flat_number}` : 'No Flats'})
          </h2>
          <p className="text-xs text-slate-400">
            Inspect, compare, and batch-approve micro-tasks across all {floorFlats.length} flats on Floor {selectedFloor} in 1 single widescreen dashboard.
          </p>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Wing</label>
            <select
              value={selectedWing}
              onChange={(e) => {
                const newWing = e.target.value;
                setSelectedWing(newWing);
                const nextFloors = Array.from(new Set((state.flats || []).filter(f => String(f.wing || f.wing_code || '').toUpperCase() === String(newWing || '').toUpperCase()).map(f => Number(f.floorNumber || f.floor_number)))).filter(Boolean).sort((a, b) => a - b);
                if (nextFloors.length > 0 && !nextFloors.includes(selectedFloor)) {
                  setSelectedFloor(nextFloors[0]);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-white outline-none"
            >
              {wingsList.map((w, idx) => (
                <option key={`wing-opt-${w}-${idx}`} value={w}>🏢 Wing {w}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Floor Level</label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(parseInt(e.target.value, 10))}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-white outline-none"
            >
              {floorsList.map((f, idx) => (
                <option key={`floor-opt-${f}-${idx}`} value={f}>Floor {f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Floor Overview KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Floor Flats</span>
            <div className="text-xl font-black text-white mt-0.5">{totalFloorFlats} Residential Units</div>
          </div>
          <Building2 className="w-6 h-6 text-sky-400" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Floor Stage Completion</span>
            <div className="text-xl font-black text-amber-400 mt-0.5">{floorCompletionPct}% Complete</div>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 flex items-center justify-center font-bold text-xs text-amber-400">
            {floorCompletionPct}%
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Micro-Tasks Verified</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{approvedFloorTasks} / {totalFloorTasks}</div>
          </div>
          <CheckCheck className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Room Zones Ribbon Switcher with Badges */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
            Select Architectural Room Zone:
          </span>
          <span className="text-[10px] font-bold text-amber-400">{allZones.length} Zones Available</span>
        </div>

        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {allZones.map((z) => {
            const isSelected = String(z.id) === String(selectedZone?.id) || String(z.zone_code) === String(selectedZone?.zone_code);
            
            // Calculate zone progress across floor
            let zTasksCount = 0;
            let zApprCount = 0;
            floorFlats.forEach(f => {
              const fTasks = (state.flatTasks || []).filter(t => {
                const isFlatMatch = String(t.flatId || t.flat_id) === String(f.id);
                const catalog = (state.taskCatalog || []).find(c => String(c.id) === String(t.taskCatalogId || t.task_catalog_id));
                const zoneMatch = String(catalog?.roomZoneId || catalog?.room_zone_id) === String(z.id) ||
                  String(catalog?.zoneCode || catalog?.zone_code) === String(z.zone_code);
                return isFlatMatch && zoneMatch;
              });
              zTasksCount += fTasks.length;
              zApprCount += fTasks.filter(t => t.status === 'APPROVED' || t.completionPct === 100).length;
            });
            const zPct = zTasksCount > 0 ? Math.round((zApprCount / zTasksCount) * 100) : 0;

            return (
              <button
                key={`zone-tab-${z.id}`}
                onClick={() => setSelectedZoneId(z.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{z.zoneLabel || z.zone_label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {zPct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trade Filter Pills */}
      {tradesList.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Trade Filter:
          </span>
          <button
            onClick={() => setSelectedTradeFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
              selectedTradeFilter === 'ALL' ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            All Trades ({rawRoomTasks.length})
          </button>
          {tradesList.map(tr => (
            <button
              key={`tr-btn-${tr}`}
              onClick={() => setSelectedTradeFilter(tr)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                selectedTradeFilter === tr ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      )}

      {matrixMessage && (
        <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{matrixMessage}</span>
        </div>
      )}

      {/* Side-by-Side Matrix Table */}
      {roomTasks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
          <p className="text-slate-400 text-sm font-semibold">
            No micro-tasks found for {selectedZone?.zoneLabel || selectedZone?.zone_label} zone under current filters.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3.5 px-4 font-bold sticky left-0 bg-slate-950 min-w-[260px]">
                    {selectedZone?.zoneLabel || selectedZone?.zone_label} Micro-Task
                  </th>
                  <th className="py-3.5 px-3 text-center font-bold text-amber-400 min-w-[120px]">
                    ⚡ Batch Floor Action
                  </th>
                  {floorFlats.map((flat, fIdx) => (
                    <th key={`th-flat-${flat.id || fIdx}`} className="py-3.5 px-4 text-center font-extrabold text-white min-w-[130px]">
                      Flat {flat.flatNumber || flat.flat_number}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {roomTasks.map((catalogItem, idx) => (
                  <tr key={`tr-cat-${catalogItem.id || idx}`} className="hover:bg-slate-850/50 transition">
                    {/* Task Title & Trade */}
                    <td className="py-3 px-4 sticky left-0 bg-slate-900 font-extrabold text-white">
                      <span className="text-[10px] text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded block w-fit mb-0.5">
                        {catalogItem.tradeType || catalogItem.trade_type}
                      </span>
                      {catalogItem.taskName || catalogItem.task_name}
                    </td>

                    {/* Batch Approve Button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleBatchApproveTaskAcrossFloor(catalogItem)}
                        disabled={isBulkProcessing}
                        className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-bold transition flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                        title="Approve across all flats on this floor"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Floor All</span>
                      </button>
                    </td>

                    {/* Flat Inspection Buttons */}
                    {floorFlats.map((flat, fIdx) => {
                      const task = (state.flatTasks || []).find(t => {
                        const tFlatId = String(t.flatId ?? t.flat_id ?? '');
                        const curFlatId = String(flat.id ?? '');
                        const tCatId = String(t.taskCatalogId ?? t.task_catalog_id ?? '');
                        const curCatId = String(catalogItem.id ?? '');
                        return tFlatId === curFlatId && tCatId === curCatId;
                      });

                      const isApproved = task?.status === 'APPROVED' || task?.status === 'VERIFIED';
                      const isInspected = task?.status === 'INSPECTED' || task?.status === 'INSPECTION_PENDING';
                      const isInProgress = task?.status === 'IN_PROGRESS' || task?.status === 'WORK_STARTED';
                      const isAssigned = task?.status === 'ASSIGNED';
                      const isRework = task?.status === 'REWORK' || !!task?.blockerReason;

                      return (
                        <td key={`td-cell-${flat.id || fIdx}-${catalogItem.id || idx}`} className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleQuickApproveTask(flat.id, catalogItem.id)}
                            className={`w-full py-2 px-2 rounded-xl text-[11px] font-black transition flex items-center justify-center space-x-1 border cursor-pointer ${
                              isApproved
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : isRework
                                ? 'bg-rose-950 text-rose-400 border-rose-800'
                                : isInspected
                                ? 'bg-purple-950 text-purple-400 border-purple-800'
                                : isInProgress
                                ? 'bg-amber-950 text-amber-400 border-amber-800'
                                : isAssigned
                                ? 'bg-sky-950 text-sky-400 border-sky-800'
                                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {isApproved ? 'Approved' :
                               isRework ? 'Rework' :
                               isInspected ? 'Inspected' :
                               isInProgress ? `${task?.completionPct ?? task?.completion_pct}%` :
                               isAssigned ? 'Assigned' : 'Approve'}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorRoomMatrix;
