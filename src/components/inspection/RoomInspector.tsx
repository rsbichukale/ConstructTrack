'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertOctagon, Camera, Lock, ArrowLeft, Send, X, ShieldAlert, Sparkles, User, Filter, Building, Zap, Check, PhoneCall } from 'lucide-react';
import { Flat, RoomZone, FlatTask, FlatTaskStatus, Contractor } from '@/lib/types';
import { getAppState, updateFlatTaskProgress, checkTradeDependency, saveAppState } from '@/lib/dbState';
import { INITIAL_TASK_CATALOG } from '@/lib/seedData';
import { contractorHasTrade, getContractorTradeLabel } from '@/lib/contractorTrades';

interface RoomInspectorProps {
  flat: Flat;
  roomZone: RoomZone;
  onCompleteReport?: () => void;
  onBackToZones?: () => void;
}

export const RoomInspector: React.FC<RoomInspectorProps> = ({
  flat,
  roomZone,
  onCompleteReport,
  onBackToZones,
}) => {
  const state = getAppState();

  // Find catalog tasks for this room zone with resilient fallback
  const loadedCatalog = (state.taskCatalog && state.taskCatalog.length > 0) ? state.taskCatalog : INITIAL_TASK_CATALOG;
  let catalogItems = loadedCatalog.filter(c => c.roomZoneId === roomZone.id);
  if (catalogItems.length === 0) {
    catalogItems = INITIAL_TASK_CATALOG.filter(c => c.roomZoneId === roomZone.id);
  }
  const catalogIds = catalogItems.map(c => c.id);

  // Find flat tasks corresponding to these catalog items (or auto-generate view tasks)
  const existingFlatTasks = state.flatTasks.filter(
    t => t.flatId === flat.id && catalogIds.includes(t.taskCatalogId)
  );

  const tasks: FlatTask[] = catalogItems.map(cItem => {
    const found = existingFlatTasks.find(t => t.taskCatalogId === cItem.id);
    if (found) return found;

    const matchedContractor = state.contractors.find(c => contractorHasTrade(c, cItem.tradeType));

    return {
      id: flat.id * 1000 + cItem.id,
      flatId: flat.id,
      taskCatalogId: cItem.id,
      assignedContractorId: matchedContractor?.id || 1,
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      completionPct: 0,
      unitOfMeasure: 'SQFT',
      totalQuantity: 1000,
      completedQuantity: 0,
      updatedAt: new Date().toISOString(),
    };
  });

  // Room Task Filter State
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'ASSIGNED' | number>('ALL');

  // Modal Form State
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeTask = state.flatTasks.find(t => t.id === selectedTaskId);
  const activeCatalogItem = activeTask
    ? state.taskCatalog.find(c => c.id === activeTask.taskCatalogId)
    : null;

  const [status, setStatus] = useState<FlatTaskStatus>('NOT_STARTED');
  const [completionPct, setCompletionPct] = useState<number>(0);
  const [assignedContractorId, setAssignedContractorId] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [blockerReason, setBlockerReason] = useState<string>('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // When task is selected, load its values into modal form & auto-select contractor by trade
  const handleOpenTaskModal = (task: FlatTask) => {
    const catalogItem = state.taskCatalog.find(c => c.id === task.taskCatalogId);
    setSelectedTaskId(task.id);
    setStatus(task.status);
    setCompletionPct(task.completionPct);
    setPhotoUrl(task.photoUrl || '');
    setNotes('');
    setBlockerReason(task.blockerReason || '');

    // Smart Auto-Selection Logic
    if (task.assignedContractorId) {
      setAssignedContractorId(task.assignedContractorId);
    } else if (catalogItem) {
      // Find matching contractors by Trade & Wing Scope
      const matchingContractors = state.contractors.filter(
        c => contractorHasTrade(c, catalogItem.tradeType) &&
             (c.wingScope === flat.wing || c.wingScope === 'ALL' || !c.wingScope) &&
             c.status !== 'SUSPENDED'
      );

      if (matchingContractors.length > 0) {
        // Auto-select contractor matching this trade & wing!
        setAssignedContractorId(matchingContractors[0].id);
      } else {
        // Fallback trade contractor
        const fallback = state.contractors.find(c => contractorHasTrade(c, catalogItem.tradeType));
        setAssignedContractorId(fallback ? fallback.id : undefined);
      }
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const dependencyCheck = activeTask ? checkTradeDependency(activeTask.id) : { isLocked: false };

  const handleSaveReport = () => {
    if (!activeTask || !activeCatalogItem) return;

    if (dependencyCheck.isLocked && status === 'APPROVED') {
      if (dependencyCheck.holdWarning) {
        alert(`Cannot Approve! ${dependencyCheck.holdWarning}`);
      } else {
        alert(`Cannot Approve! Prerequisite trade task(s) "${dependencyCheck.prerequisiteTaskNames?.join(', ')}" must be APPROVED first.`);
      }
      return;
    }

    // 1. Update task progress & assigned contractor in DB
    const updatedFlatTasks = state.flatTasks.map(t => {
      if (t.id === activeTask.id) {
        return {
          ...t,
          status,
          completionPct,
          assignedContractorId: assignedContractorId,
          photoUrl: photoUrl || t.photoUrl,
          blockerReason: blockerReason || t.blockerReason,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    saveAppState({
      ...state,
      flatTasks: updatedFlatTasks,
    });

    // Also update progress log
    updateFlatTaskProgress(activeTask.id, status, completionPct, notes, photoUrl, blockerReason);

    // 2. Set success toast
    const contractor = state.contractors.find(c => c.id === assignedContractorId);
    setSubmittedMessage(
      `Inspection for "${activeCatalogItem.taskName}" saved! (${status}, ${completionPct}%) ${contractor ? `[Assigned: ${contractor.companyName}]` : ''}`
    );
    setTimeout(() => setSubmittedMessage(null), 3500);

    // 3. Auto-close modal popup!
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleNativeCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateCanvasSnapshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 600, 400);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 400);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for (let i = 0; i < 600; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 400); ctx.stroke();
      }
      for (let j = 0; j < 400; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(600, j); ctx.stroke();
      }

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(20, 20, 560, 60);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`CONSTRUCTTRACK FIELD INSPECTION PROOF`, 40, 56);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Flat Unit: ${flat.wing}-${flat.flatNumber} (Floor ${flat.floorNumber})`, 40, 130);
      ctx.fillText(`Room Zone: ${roomZone.zoneLabel}`, 40, 160);
      ctx.fillText(`Micro-Task: ${activeCatalogItem?.taskName || 'Site Inspection'}`, 40, 190);
      ctx.fillText(`Trade: ${activeCatalogItem?.tradeType || 'Civil Work'}`, 40, 220);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px monospace';
      const now = new Date().toLocaleString();
      ctx.fillText(`STAMP: ${now} | LAT: 18.5204° N, LONG: 73.8567° E`, 40, 340);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoUrl(dataUrl);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
        <AlertOctagon className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-white font-bold">No Micro-Tasks Configured</h3>
        <p className="text-xs text-slate-400">There are no catalog tasks assigned to {roomZone.zoneLabel} zone.</p>
      </div>
    );
  }

  // Filter tasks based on taskFilter
  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'ALL') return true;
    if (taskFilter === 'ASSIGNED') return !!t.assignedContractorId;
    if (typeof taskFilter === 'number') return t.assignedContractorId === taskFilter;
    return true;
  });

  // Calculate matching contractors for active catalog item
  const matchingContractors = activeCatalogItem
    ? state.contractors.filter(
        c => contractorHasTrade(c, activeCatalogItem.tradeType) &&
             (c.wingScope === flat.wing || c.wingScope === 'ALL' || !c.wingScope) &&
             c.status !== 'SUSPENDED'
      )
    : [];

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {submittedMessage && (
        <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{submittedMessage}</span>
        </div>
      )}

      {/* Room Overview Header & Contractor Task Filter */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sky-400 font-bold text-xs uppercase tracking-wider">
            {flat.wing}-{flat.flatNumber} • Floor {flat.floorNumber}
          </div>
          <h2 className="text-xl font-extrabold text-white mt-0.5">
            {roomZone.zoneLabel} Micro-Tasks ({filteredTasks.length}/{tasks.length})
          </h2>
          <p className="text-xs text-slate-400">Contractors auto-assigned by trade type (Click task to change or inspect)</p>
        </div>

        {/* Task Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <Filter className="w-3.5 h-3.5 text-amber-400 ml-1" />
          <button
            onClick={() => setTaskFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition ${
              taskFilter === 'ALL' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setTaskFilter('ASSIGNED')}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition ${
              taskFilter === 'ASSIGNED' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Assigned Work Only ({tasks.filter(t => !!t.assignedContractorId).length})
          </button>
        </div>
      </div>

      {/* Room Micro-Tasks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTasks.map((task) => {
          const catalogItem = state.taskCatalog.find(c => c.id === task.taskCatalogId);
          if (!catalogItem) return null;

          // Auto-resolution contractor display
          let assignedContractor = state.contractors.find(c => c.id === task.assignedContractorId);
          if (!assignedContractor) {
            const matches = state.contractors.filter(
              c => contractorHasTrade(c, catalogItem.tradeType) &&
                   (c.wingScope === flat.wing || c.wingScope === 'ALL' || !c.wingScope) &&
                   c.status !== 'SUSPENDED'
            );
            if (matches.length > 0) assignedContractor = matches[0];
          }

          const dep = checkTradeDependency(task.id);
          const isApproved = task.status === 'APPROVED';
          const isInProgress = task.status === 'IN_PROGRESS' || task.status === 'INSPECTION_REQUESTED';
          const isRework = task.status === 'REWORK' || !!task.blockerReason;

          let cardBorder = 'border-slate-800 bg-slate-900 hover:border-slate-700';
          let statusBadge = 'bg-slate-800 text-slate-400 border-slate-700';
          let statusLabel = 'Not Started';

          if (isApproved) {
            cardBorder = 'border-emerald-800/80 bg-emerald-950/30 hover:border-emerald-600';
            statusBadge = 'bg-emerald-950 text-emerald-400 border-emerald-800';
            statusLabel = 'Approved';
          } else if (isRework) {
            cardBorder = 'border-rose-800/80 bg-rose-950/30 hover:border-rose-600';
            statusBadge = 'bg-rose-950 text-rose-400 border-rose-800';
            statusLabel = 'Blocked / Rework';
          } else if (isInProgress) {
            cardBorder = 'border-amber-800/80 bg-amber-950/30 hover:border-amber-600';
            statusBadge = 'bg-amber-950 text-amber-400 border-amber-800';
            statusLabel = task.status.replace('_', ' ');
          }

          return (
            <button
              key={task.id}
              onClick={() => handleOpenTaskModal(task)}
              className={`p-4 rounded-2xl border text-left space-y-3 transition transform active:scale-95 shadow-md flex flex-col justify-between ${cardBorder}`}
            >
              <div className="flex items-start justify-between w-full">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-md uppercase">
                    {catalogItem.tradeType}
                  </span>
                  <h3 className="font-extrabold text-white text-sm mt-1.5 leading-snug">
                    {catalogItem.taskName}
                  </h3>
                </div>

                {dep.isLocked && (
                  <div 
                    className="p-1 bg-rose-950 text-rose-400 rounded-lg border border-rose-800" 
                    title={dep.holdWarning || `Locked by: ${dep.prerequisiteTaskNames?.join(', ')}`}
                  >
                    <Lock className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Auto Assigned Contractor Badge */}
              <div className="flex items-center space-x-1.5 text-xs text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2.5 py-1 rounded-lg">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold truncate">
                  {assignedContractor ? assignedContractor.companyName : 'Unassigned Trade Contractor'}
                </span>
              </div>

              {/* Status & Progress Bar */}
              <div className="space-y-1.5 w-full pt-1 border-t border-slate-800/60">
                <div className="flex justify-between items-center text-xs">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                    {statusLabel}
                  </span>
                  <span className="font-mono font-extrabold text-sky-400 text-xs">
                    {task.completionPct}%
                  </span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isApproved ? 'bg-emerald-500' : isRework ? 'bg-rose-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${task.completionPct}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] font-bold text-sky-400 flex items-center justify-end space-x-1 pt-0.5">
                <span>Inspect Task</span>
                <span>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* TASK INSPECTION & CONTRACTOR AUTO-SELECTION MODAL POPUP */}
      {isModalOpen && activeTask && activeCatalogItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-md uppercase">
                  {activeCatalogItem.tradeType}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {activeCatalogItem.taskName}
                </h3>
                <p className="text-xs text-slate-400">
                  Flat {flat.wing}-{flat.flatNumber} • {roomZone.zoneLabel}
                </p>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Dependency / Curing Hold Warning */}
              {dependencyCheck.isLocked && (
                <div className="bg-rose-950/90 border border-rose-800 text-rose-300 p-3.5 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>{dependencyCheck.holdWarning ? 'Curing / Hold Period Active!' : 'Trade Sequence Locked!'}</span>
                  </div>
                  {dependencyCheck.holdWarning ? (
                    <p className="text-[11px] text-amber-200 font-medium">
                      {dependencyCheck.holdWarning}
                    </p>
                  ) : (
                    <p className="text-[11px] text-rose-200">
                      Prerequisite task(s) <span className="font-bold underline">{dependencyCheck.prerequisiteTaskNames?.join(', ')}</span> must pass inspection and be marked <span className="font-bold underline">APPROVED</span> before this task can be approved.
                    </p>
                  )}
                </div>
              )}

              {/* SMART CONTRACTOR AUTO-SELECTION UI WITH DIRECT CALL */}
              {(() => {
                const activeContractorObj = state.contractors.find(c => c.id === assignedContractorId) || matchingContractors[0];
                return (
                  <div className="bg-slate-950 border border-amber-800/80 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Contractor Assignment for {activeCatalogItem.tradeType}</span>
                      </label>

                      {matchingContractors.length === 1 && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-md flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Auto-Assigned</span>
                        </span>
                      )}
                    </div>

                    {matchingContractors.length > 1 ? (
                      /* Multiple Contractors Found -> User Selects */
                      <div className="space-y-2">
                        <p className="text-[11px] text-amber-200">
                          Found <span className="font-bold text-white">{matchingContractors.length} Contractors</span> registered for <span className="font-bold">{activeCatalogItem.tradeType}</span> in Wing {flat.wing}. Please select contractor:
                        </p>
                        <div className="flex items-center space-x-2">
                          <select
                            value={assignedContractorId || ''}
                            onChange={(e) => setAssignedContractorId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="flex-1 bg-slate-900 border border-amber-700/80 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                          >
                            {matchingContractors.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.companyName} ({c.contactPerson} - {c.phone})
                              </option>
                            ))}
                          </select>

                          {activeContractorObj?.phone && (
                            <a
                              href={`tel:${activeContractorObj.phone}`}
                              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/30 transition shrink-0"
                              title={`Call ${activeContractorObj.companyName}`}
                            >
                              <PhoneCall className="w-4 h-4" />
                              <span>Call Contractor</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : matchingContractors.length === 1 ? (
                      /* Single Contractor Found -> Auto Selected */
                      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-white text-xs">{matchingContractors[0].companyName}</div>
                          <div className="text-[11px] text-slate-400">
                            {matchingContractors[0].contactPerson} • Phone: {matchingContractors[0].phone}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {matchingContractors[0].phone && (
                            <a
                              href={`tel:${matchingContractors[0].phone}`}
                              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/30 transition"
                              title={`Call ${matchingContractors[0].companyName}`}
                            >
                              <PhoneCall className="w-4 h-4 text-emerald-100" />
                              <span>Call Contractor</span>
                            </a>
                          )}
                          <span className="text-xs font-mono font-bold text-emerald-400 hidden sm:inline">Selected</span>
                        </div>
                      </div>
                    ) : (
                      /* Fallback Select from all Contractors */
                      <div className="flex items-center space-x-2">
                        <select
                          value={assignedContractorId || ''}
                          onChange={(e) => setAssignedContractorId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                        >
                          <option value="">-- Select Trade Contractor --</option>
                          {state.contractors.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.companyName} ({getContractorTradeLabel(c)}) - {c.phone}
                            </option>
                          ))}
                        </select>

                        {activeContractorObj?.phone && (
                          <a
                            href={`tel:${activeContractorObj.phone}`}
                            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/30 transition shrink-0"
                            title={`Call ${activeContractorObj.companyName}`}
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Work Status State
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['NOT_STARTED', 'IN_PROGRESS', 'INSPECTION_REQUESTED', 'APPROVED', 'REWORK'] as FlatTaskStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatus(s);
                        if (s === 'APPROVED') setCompletionPct(100);
                        if (s === 'NOT_STARTED') setCompletionPct(0);
                      }}
                      className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-extrabold transition border text-center flex items-center justify-center ${
                        status === s
                          ? s === 'APPROVED'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                            : s === 'REWORK'
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/20'
                            : 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-500/20'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Completion Slider & Quick Buttons */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-300 uppercase tracking-wider">Completion Percentage</label>
                  <span className="font-mono font-extrabold text-sky-400 text-sm">{completionPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={completionPct}
                  onChange={(e) => setCompletionPct(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between space-x-2 pt-1">
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setCompletionPct(pct)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border ${
                        completionPct === pct
                          ? 'bg-sky-600 text-white border-sky-500'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Photo Attachment */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Smartphone Photo Proof
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNativeCameraClick}
                    className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-extrabold shadow-lg shadow-sky-600/20 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{photoUrl ? 'Retake Device Photo' : 'Take / Upload Camera Photo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateCanvasSnapshot}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-400 px-3.5 py-2.5 rounded-xl border border-slate-700 text-xs font-extrabold transition"
                  >
                    <span>Generate Site Stamp Snapshot</span>
                  </button>

                  {photoUrl && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Photo Attached</span>
                    </span>
                  )}
                </div>

                {photoUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-700 max-h-48 shadow-lg">
                    <img src={photoUrl} alt="Inspection Proof" className="w-full object-cover h-44" />
                  </div>
                )}
              </div>

              {/* Inspector Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Inspector Notes & Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter field observation notes, quality issues, or trade instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveReport}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-500/25 flex items-center space-x-2 transition"
              >
                <Send className="w-4 h-4" />
                <span>Submit & Save Task Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
