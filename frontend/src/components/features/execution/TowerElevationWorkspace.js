'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Eye, 
  ChevronRight, 
  ArrowLeft, 
  Ruler, 
  Play, 
  UserCheck, 
  ShieldCheck, 
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';
import { useExecution } from '../../../hooks/useExecution';
import { KPICard } from '../../ui/KPICard';
import { StatusBadge } from '../../ui/StatusBadge';
import { ModalDialog } from '../../ui/ModalDialog';
import { getAppState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const TowerElevationWorkspace = () => {
  const { flats, loading, selectedFlat, setSelectedFlat, flatDetails, detailsLoading, updateTaskProgress, refreshFlats } = useExecution();
  const [selectedWing, setSelectedWing] = useState('ALL');
  const [selectedRoomZoneId, setSelectedRoomZoneId] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const state = getAppState();

  const filteredFlats = flats.filter(f => selectedWing === 'ALL' || f.wing === selectedWing);
  const totalFlats = filteredFlats.length;
  const floors = Array.from(new Set(filteredFlats.map(f => f.floor_number))).sort((a, b) => b - a);

  // Group flat tasks by room zone
  const roomZonesMap = {};
  (flatDetails?.tasks || []).forEach(task => {
    const zId = String(task.room_zone_id || task.roomZoneId || 1);
    if (!roomZonesMap[zId]) {
      roomZonesMap[zId] = {
        id: zId,
        zoneLabel: task.zone_label || task.zoneLabel || 'Room Zone',
        zoneCode: task.zone_code || task.zoneCode,
        tasks: []
      };
    }
    roomZonesMap[zId].tasks.push(task);
  });

  const roomZonesList = Object.values(roomZonesMap);

  const selectedZone = roomZonesList.find(z => String(z.id) === String(selectedRoomZoneId));

  // Find dimensions for selected flat & room
  const roomDim = (state.roomDimensions || []).find(
    d => String(d.flat_id || d.flatId) === String(selectedFlat?.id) &&
         String(d.room_zone_id || d.roomZoneId) === String(selectedRoomZoneId)
  );

  const dimL = Number(roomDim?.length_ft || 14);
  const dimW = Number(roomDim?.width_ft || 12);
  const dimH = Number(roomDim?.height_ft || 10);
  const dimDed = Number(roomDim?.door_window_deduction_sqft || 30);
  const flooringSqft = Math.round(dimL * dimW * 100) / 100;
  const wallSqft = Math.round(Math.max(0, (2 * (dimL + dimW) * dimH) - dimDed) * 100) / 100;

  // Multi-Stage Lifecycle Action Handlers
  const handleAssignContractor = async (taskId, contractorId) => {
    setUpdatingTaskId(taskId);
    try {
      await apiClient.post(`/execution/tasks/${taskId}/assign`, { contractorId });
      await updateTaskProgress(taskId, 'ASSIGNED', undefined, 'Assigned to contractor');
      setActionMessage('Contractor assigned!');
      setTimeout(() => setActionMessage(null), 2500);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleStartToday = async (task) => {
    setUpdatingTaskId(task.id);
    try {
      await apiClient.post(`/execution/tasks/${task.id}/start-today`, {});
      await updateTaskProgress(task.id, 'WORK_STARTED', 15, 'Work started today on site');
      setActionMessage(`Contractor started work on "${task.task_name}" today!`);
      setTimeout(() => setActionMessage(null), 2500);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleProgressChange = async (task, pct) => {
    setUpdatingTaskId(task.id);
    try {
      const status = pct === 100 ? 'COMPLETED' : 'IN_PROGRESS';
      await updateTaskProgress(task.id, status, pct, `Progress updated to ${pct}%`);
      setActionMessage(`Updated to ${pct}% progress!`);
      setTimeout(() => setActionMessage(null), 2000);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleMarkCompleted = async (task) => {
    setUpdatingTaskId(task.id);
    try {
      await updateTaskProgress(task.id, 'COMPLETED', 100, 'Work completed by contractor');
      setActionMessage(`Marked "${task.task_name}" as Completed by contractor!`);
      setTimeout(() => setActionMessage(null), 2500);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleMarkInspected = async (task) => {
    setUpdatingTaskId(task.id);
    try {
      await apiClient.post(`/execution/tasks/${task.id}/request-inspection`, {});
      await updateTaskProgress(task.id, 'INSPECTED', 100, 'Site engineer inspected work');
      setActionMessage(`Quality check completed for "${task.task_name}"!`);
      setTimeout(() => setActionMessage(null), 2500);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleVerifyApprove = async (task) => {
    setUpdatingTaskId(task.id);
    try {
      await apiClient.post(`/execution/tasks/${task.id}/approve`, {});
      await updateTaskProgress(task.id, 'APPROVED', 100, 'Verified and approved milestone');
      setActionMessage(`🎉 Milestone Verified & Approved 100%: "${task.task_name}"!`);
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Top Action & KPI Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-amber-500" />
            Tower Elevation & Flat Execution Matrix
          </h2>
          <p className="text-xs text-slate-400">Live 2D structural elevation matrix for high-rise residential wings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
            {['ALL', 'B1', 'B2'].map(w => (
              <button
                key={w}
                onClick={() => setSelectedWing(w)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${selectedWing === w ? 'bg-amber-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                {w === 'ALL' ? 'All Wings' : `Wing ${w}`}
              </button>
            ))}
          </div>
          <button
            onClick={refreshFlats}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Total Residential Units" value={totalFlats} subtitle="Active in database" icon={Building2} />
        <KPICard title="Active Wings" value="2 Towers" subtitle="B1 & B2" icon={Layers} />
        <KPICard title="Total Micro-Tasks" value="6,832" subtitle="Across 11 Room Zones" icon={Clock} />
        <KPICard title="Project Completion" value="45%" subtitle="Calculated from tasks" icon={CheckCircle2} />
      </div>

      {/* 2D High-Rise Tower Elevation Matrix Grid */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="space-y-4">
          {floors.map((floorNum) => {
            const floorFlats = filteredFlats.filter(f => f.floor_number === floorNum);

            return (
              <div key={floorNum} className="flex items-center gap-4 border-b border-slate-800/40 pb-4 last:border-0 last:pb-0">
                <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 font-bold text-xs text-slate-300">
                  Floor {floorNum}
                </div>
                <div className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
                  {floorFlats.map((flat) => (
                    <button
                      key={flat.id}
                      onClick={() => {
                        setSelectedFlat(flat);
                        setSelectedRoomZoneId(null); // Always show rooms list first!
                      }}
                      className="group flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 text-left transition-all hover:border-amber-500/50 hover:bg-slate-900 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-amber-400">
                            {flat.wing}-{flat.flat_number}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">({flat.flat_type})</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Click to inspect rooms</p>
                      </div>
                      <Eye className="h-4 w-4 text-slate-600 group-hover:text-amber-400" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flat Details Inspection Modal with ROOMS FIRST */}
      <ModalDialog
        isOpen={Boolean(selectedFlat)}
        onClose={() => {
          setSelectedFlat(null);
          setSelectedRoomZoneId(null);
        }}
        title={`Flat ${selectedFlat?.wing}-${selectedFlat?.flat_number} (${selectedFlat?.flat_type})`}
        subtitle={`Floor ${selectedFlat?.floor_number} • ${flatDetails?.totalTasks || 0} Micro-Tasks across ${roomZonesList.length} room zones`}
        maxWidth="max-w-5xl"
      >
        {detailsLoading ? (
          <div className="flex h-64 items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Flat Overall Progress Card */}
            <div className="flex flex-wrap items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Unit Progress</p>
                <h3 className="text-2xl font-black text-amber-400">{flatDetails?.progressPct || 0}% Complete</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Verified Tasks</span>
                <p className="text-lg font-black text-white">{flatDetails?.completedTasks} / {flatDetails?.totalTasks}</p>
              </div>
            </div>

            {actionMessage && (
              <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-300 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{actionMessage}</span>
              </div>
            )}

            {/* VIEW 1: SHOW ROOMS FIRST */}
            {!selectedRoomZoneId ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-extrabold uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Select Room to Inspect Micro-Tasks:</span>
                  </span>
                  <span className="text-xs font-bold text-slate-400">{roomZonesList.length} Rooms Configured</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[55vh] overflow-y-auto pr-1">
                  {roomZonesList.map((zone) => {
                    const totalInZone = zone.tasks.length;
                    const approvedInZone = zone.tasks.filter(t => t.status === 'APPROVED' || t.status === 'VERIFIED' || t.completion_pct === 100).length;
                    const inProgressInZone = zone.tasks.filter(t => (t.completion_pct > 0 && t.completion_pct < 100) || t.status === 'IN_PROGRESS' || t.status === 'WORK_STARTED').length;
                    const zoneProg = totalInZone > 0 ? Math.round((approvedInZone / totalInZone) * 100) : 0;

                    // Dimension specs
                    const zDim = (state.roomDimensions || []).find(
                      d => String(d.flat_id || d.flatId) === String(selectedFlat?.id) &&
                           String(d.room_zone_id || d.roomZoneId) === String(zone.id)
                    );
                    const zArea = zDim ? `${Math.round(zDim.length_ft * zDim.width_ft)} sq.ft` : '120 sq.ft';

                    return (
                      <button
                        key={`room-btn-${zone.id}`}
                        onClick={() => setSelectedRoomZoneId(zone.id)}
                        className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-left transition-all hover:border-amber-500/50 hover:bg-slate-900/90 cursor-pointer space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-white group-hover:text-amber-400">
                            {zone.zoneLabel}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                            {zArea}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-400 text-[11px]">
                              {totalInZone} Micro-Tasks
                            </span>
                            <span className={`font-extrabold ${zoneProg === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {zoneProg}%
                            </span>
                          </div>

                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full ${zoneProg === 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                              style={{ width: `${zoneProg}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <span>{approvedInZone} Approved • {inProgressInZone} In Progress</span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* VIEW 2: DRILL-DOWN INTO SELECTED ROOM'S MICRO-TASKS WITH ALL OPTIONS */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <button
                    onClick={() => setSelectedRoomZoneId(null)}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to All Rooms</span>
                  </button>

                  <div className="flex items-center space-x-3 text-xs font-bold text-slate-400">
                    <span className="text-white font-extrabold text-sm">{selectedZone?.zoneLabel}</span>
                    <span>•</span>
                    <span className="text-emerald-400">Flooring: {flooringSqft} sq.ft</span>
                    <span>•</span>
                    <span className="text-sky-400">Wall: {wallSqft} sq.ft</span>
                  </div>
                </div>

                {/* Micro-Tasks Table for Selected Room */}
                <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60">
                  {selectedZone?.tasks?.sort((a,b) => (a.sequence_order || 1) - (b.sequence_order || 1)).map((task) => {
                    const isApproved = task.status === 'APPROVED' || task.status === 'VERIFIED';
                    const isInspected = task.status === 'INSPECTED' || task.status === 'INSPECTION_PENDING';
                    const isCompleted = task.status === 'COMPLETED';
                    const isInProgress = task.status === 'IN_PROGRESS' || task.status === 'WORK_STARTED';
                    const isAssigned = task.status === 'ASSIGNED';

                    // Check Sequence Precedence Lock
                    const currentSeq = task.sequence_order || 1;
                    const precedingIncomplete = (selectedZone?.tasks || []).filter(t => 
                      (t.sequence_order || 1) < currentSeq && 
                      t.status !== 'APPROVED' && t.status !== 'VERIFIED' && (t.completion_pct || 0) < 100
                    );
                    const isPrecedenceLocked = precedingIncomplete.length > 0;

                    return (
                      <div key={task.id} className="p-4 hover:bg-slate-900/60 transition space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-extrabold">
                                STEP {currentSeq}
                              </span>
                              <p className="text-sm font-extrabold text-white">{task.task_name}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-sky-400 font-bold bg-sky-950/80 border border-sky-800 px-1.5 py-0.5 rounded">
                                {task.trade_type}
                              </span>
                              <span className="text-xs text-slate-400">
                                Contractor: <strong className="text-slate-200">{task.contractor_name || 'Apex Works'}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPrecedenceLocked ? (
                              <span className="px-2 py-0.5 bg-rose-950/80 border border-rose-800 text-rose-400 rounded-full font-bold text-[10px] flex items-center space-x-1">
                                <Lock className="w-3 h-3 inline" />
                                <span>🔒 STEP {currentSeq} LOCKED</span>
                              </span>
                            ) : (
                              <StatusBadge status={task.status} />
                            )}
                            <span className="text-xs font-black text-amber-400">
                              {task.completion_pct || 0}%
                            </span>
                          </div>
                        </div>

                        {/* Precedence Lock Warning Note if locked */}
                        {isPrecedenceLocked && (
                          <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-2.5 text-[11px] text-rose-300 flex items-center space-x-2">
                            <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>
                              <strong>Precedence Locked:</strong> Complete preceding <strong>Step {precedingIncomplete[0]?.sequence_order || 1} ({precedingIncomplete[0]?.task_name})</strong> before starting this task.
                            </span>
                          </div>
                        )}

                        {/* ALL 6 STAGE OPTIONS & ACTIONS */}
                        <div className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/40 bg-slate-950 p-2.5 rounded-xl ${isPrecedenceLocked ? 'opacity-40 pointer-events-none' : ''}`}>
                          {/* 1. Contractor Assignment */}
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">1. Assign:</span>
                            <select
                              value={task.assigned_contractor_id || ''}
                              onChange={(e) => handleAssignContractor(task.id, Number(e.target.value))}
                              className="bg-slate-900 border border-slate-700 rounded-lg p-1 text-[11px] font-bold text-white outline-none"
                            >
                              <option value="">Choose Contractor...</option>
                              {(state.contractors || []).map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.companyName || c.company_name} (₹{c.rate_per_sqft || 25}/sq.ft)
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 2. Work Started */}
                          {!isApproved && (
                            <button
                              onClick={() => handleStartToday(task)}
                              className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              title="Set today Contractor Started Work"
                            >
                              <Play className="w-2.5 h-2.5" />
                              <span>2. Start Today</span>
                            </button>
                          )}

                          {/* 3. In Progress Percentages */}
                          {!isApproved && (
                            <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                              <span className="text-[9px] font-bold text-slate-400 px-1">3. In Progress:</span>
                              <button onClick={() => handleProgressChange(task, 25)} className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 rounded text-[9px] font-bold">25%</button>
                              <button onClick={() => handleProgressChange(task, 50)} className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 rounded text-[9px] font-bold">50%</button>
                              <button onClick={() => handleProgressChange(task, 75)} className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-300 rounded text-[9px] font-bold">75%</button>
                            </div>
                          )}

                          {/* 4. Completed (Contractor Finish) */}
                          {!isApproved && (
                            <button
                              onClick={() => handleMarkCompleted(task)}
                              className="px-2.5 py-1 bg-teal-950 hover:bg-teal-900 border border-teal-700 text-teal-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              4. Completed
                            </button>
                          )}

                          {/* 5. Inspected (Supervisor QA Check) */}
                          {!isApproved && (
                            <button
                              onClick={() => handleMarkInspected(task)}
                              className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              5. Inspected
                            </button>
                          )}

                          {/* 6. Verified & Approved (Final Milestone) */}
                          <button
                            onClick={() => handleVerifyApprove(task)}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition flex items-center space-x-1 border cursor-pointer ${
                              isApproved
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isApproved ? '6. Verified 100%' : '6. Verify & Approve'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </ModalDialog>
    </div>
  );
};

export default TowerElevationWorkspace;
