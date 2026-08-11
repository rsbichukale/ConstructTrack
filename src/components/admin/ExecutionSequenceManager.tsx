'use client';

import React, { useState } from 'react';
import {
  ListOrdered,
  ArrowUp,
  ArrowDown,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  AlertTriangle,
  Building2,
  Zap,
} from 'lucide-react';
import { getAppState, addExecutionPhase, updateExecutionPhase, reorderExecutionPhases, deleteExecutionPhase, saveAppState, getDynamicTrades } from '@/lib/dbState';
import { TradeType, ExecutionPhase } from '@/lib/types';

export const ExecutionSequenceManager: React.FC = () => {
  const state = getAppState();
  const phases = [...(state.executionPhases || [])].sort((a, b) => a.phaseNumber - b.phaseNumber);

  const [expandedPhaseId, setExpandedPhaseId] = useState<number | null>(null);
  const [isAddingPhase, setIsAddingPhase] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for Add / Edit
  const [formPhaseName, setFormPhaseName] = useState('');
  const [formPhaseDescription, setFormPhaseDescription] = useState('');
  const [formTradeType, setFormTradeType] = useState<TradeType>('BRICK WORK');
  const [formEstimatedDays, setFormEstimatedDays] = useState<number>(3);
  const [formIsMandatory, setFormIsMandatory] = useState(true);

  // Dynamic Trades List from Database
  const trades = getDynamicTrades(state);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Phase color scheme
  const phaseColorBorder: Record<number, string> = {
    1: 'border-l-orange-500',
    2: 'border-l-blue-500',
    3: 'border-l-slate-400',
    4: 'border-l-cyan-500',
    5: 'border-l-purple-500',
    6: 'border-l-amber-500',
    7: 'border-l-emerald-500',
    8: 'border-l-rose-500',
  };

  const phaseColorBg: Record<number, string> = {
    1: 'from-orange-950/40',
    2: 'from-blue-950/40',
    3: 'from-slate-800/40',
    4: 'from-cyan-950/40',
    5: 'from-purple-950/40',
    6: 'from-amber-950/40',
    7: 'from-emerald-950/40',
    8: 'from-rose-950/40',
  };

  const phaseNumberColor: Record<number, string> = {
    1: 'bg-orange-950 text-orange-400 border-orange-800',
    2: 'bg-blue-950 text-blue-400 border-blue-800',
    3: 'bg-slate-800 text-slate-300 border-slate-600',
    4: 'bg-cyan-950 text-cyan-400 border-cyan-800',
    5: 'bg-purple-950 text-purple-400 border-purple-800',
    6: 'bg-amber-950 text-amber-400 border-amber-800',
    7: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    8: 'bg-rose-950 text-rose-400 border-rose-800',
  };

  // Move phase up in order
  const handleMoveUp = (phase: ExecutionPhase) => {
    const currentIdx = phases.findIndex(p => p.id === phase.id);
    if (currentIdx <= 0) return;
    const newOrder = [...phases];
    [newOrder[currentIdx - 1], newOrder[currentIdx]] = [newOrder[currentIdx], newOrder[currentIdx - 1]];
    reorderExecutionPhases(newOrder.map(p => p.id));
    showToast(`Moved "${phase.phaseName}" up to Phase ${currentIdx}`);
  };

  // Move phase down in order
  const handleMoveDown = (phase: ExecutionPhase) => {
    const currentIdx = phases.findIndex(p => p.id === phase.id);
    if (currentIdx >= phases.length - 1) return;
    const newOrder = [...phases];
    [newOrder[currentIdx], newOrder[currentIdx + 1]] = [newOrder[currentIdx + 1], newOrder[currentIdx]];
    reorderExecutionPhases(newOrder.map(p => p.id));
    showToast(`Moved "${phase.phaseName}" down to Phase ${currentIdx + 2}`);
  };

  // Add phase
  const handleAddPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPhaseName.trim()) return;

    addExecutionPhase({
      phaseNumber: phases.length + 1,
      phaseName: formPhaseName,
      phaseDescription: formPhaseDescription,
      tradeType: formTradeType,
      estimatedDays: formEstimatedDays,
      isMandatory: formIsMandatory,
    });

    setIsAddingPhase(false);
    resetForm();
    showToast(`Added new phase: "${formPhaseName}" at position ${phases.length + 1}`);
  };

  // Edit phase
  const handleStartEdit = (phase: ExecutionPhase) => {
    setEditingPhaseId(phase.id);
    setFormPhaseName(phase.phaseName);
    setFormPhaseDescription(phase.phaseDescription);
    setFormTradeType(phase.tradeType);
    setFormEstimatedDays(phase.estimatedDays || 3);
    setFormIsMandatory(phase.isMandatory);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhaseId || !formPhaseName.trim()) return;

    updateExecutionPhase(editingPhaseId, {
      phaseName: formPhaseName,
      phaseDescription: formPhaseDescription,
      tradeType: formTradeType,
      estimatedDays: formEstimatedDays,
      isMandatory: formIsMandatory,
    });

    setEditingPhaseId(null);
    resetForm();
    showToast(`Updated phase: "${formPhaseName}"`);
  };

  // Delete phase
  const handleDeletePhase = (phase: ExecutionPhase) => {
    const tasksInPhase = state.taskCatalog.filter(t => t.executionPhaseId === phase.id);
    const confirm = window.confirm(
      `Delete "${phase.phaseName}"?\n\n${tasksInPhase.length} catalogue tasks are linked to this phase and will be unlinked.`
    );
    if (!confirm) return;

    deleteExecutionPhase(phase.id);
    showToast(`Deleted phase: "${phase.phaseName}". ${tasksInPhase.length} tasks unlinked.`);
  };

  // Reassign task to different phase
  const handleReassignTask = (taskId: number, newPhaseId: number | undefined) => {
    const updatedCatalog = state.taskCatalog.map(t => {
      if (t.id === taskId) {
        return { ...t, executionPhaseId: newPhaseId };
      }
      return t;
    });
    saveAppState({ ...state, taskCatalog: updatedCatalog });
    showToast('Task reassigned to new phase');
  };

  const resetForm = () => {
    setFormPhaseName('');
    setFormPhaseDescription('');
    setFormTradeType('BRICK WORK');
    setFormEstimatedDays(3);
    setFormIsMandatory(true);
  };

  // Calculate phase progress across all flats
  const getPhaseProgress = (phase: ExecutionPhase) => {
    const phaseCatalogIds = state.taskCatalog
      .filter(t => t.executionPhaseId === phase.id)
      .map(t => t.id);

    if (phaseCatalogIds.length === 0) return { total: 0, approved: 0, inProgress: 0, pct: 0 };

    const phaseFlatTasks = state.flatTasks.filter(t => phaseCatalogIds.includes(t.taskCatalogId));
    const total = phaseFlatTasks.length;
    const approved = phaseFlatTasks.filter(t => t.status === 'APPROVED').length;
    const inProgress = phaseFlatTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'INSPECTION_REQUESTED').length;
    const pct = total > 0 ? Math.round((approved / total) * 100) : 0;

    return { total, approved, inProgress, pct };
  };

  // Unlinked tasks (tasks without a phase)
  const unlinkedTasks = state.taskCatalog.filter(t => !t.executionPhaseId);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-300 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ListOrdered className="w-4 h-4" />
            <span>Construction Execution Sequence</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Execution Priority Sequence Manager</h2>
          <p className="text-xs text-slate-400">
            Define and reorder construction phases. Each phase groups related trade tasks in the order they must be executed on site.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Summary Stats */}
          <div className="flex items-center space-x-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <div className="text-center">
              <div className="font-mono font-extrabold text-emerald-400 text-lg">{phases.length}</div>
              <div className="text-[10px] text-slate-400 uppercase">Phases</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <div className="font-mono font-extrabold text-sky-400 text-lg">{state.taskCatalog.length}</div>
              <div className="text-[10px] text-slate-400 uppercase">Tasks</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <div className="font-mono font-extrabold text-amber-400 text-lg">
                {phases.reduce((sum, p) => sum + (p.estimatedDays || 0), 0)}
              </div>
              <div className="text-[10px] text-slate-400 uppercase">Est. Days</div>
            </div>
          </div>

          <button
            onClick={() => { setIsAddingPhase(true); setEditingPhaseId(null); resetForm(); }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Phase</span>
          </button>
        </div>
      </div>

      {/* Add Phase Form */}
      {isAddingPhase && (
        <form onSubmit={handleAddPhase} className="bg-slate-900 border border-emerald-800 p-5 rounded-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Add New Construction Phase</h4>
            <button type="button" onClick={() => setIsAddingPhase(false)} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400">Phase Name</label>
              <input
                required type="text" placeholder="e.g. Electrical Wiring & Conduit"
                value={formPhaseName} onChange={(e) => setFormPhaseName(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Description</label>
              <input
                type="text" placeholder="Brief description of this phase"
                value={formPhaseDescription} onChange={(e) => setFormPhaseDescription(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Primary Trade</label>
              <select
                value={formTradeType} onChange={(e) => setFormTradeType(e.target.value as TradeType)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {trades.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Estimated Days Per Flat</label>
              <input
                type="number" min={1} value={formEstimatedDays}
                onChange={(e) => setFormEstimatedDays(parseInt(e.target.value, 10) || 1)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox" checked={formIsMandatory}
                  onChange={(e) => setFormIsMandatory(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-emerald-500"
                />
                <span className="text-xs text-slate-300 font-bold">Mandatory Phase</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => setIsAddingPhase(false)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs hover:text-white transition">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition">Add Phase at Position {phases.length + 1}</button>
          </div>
        </form>
      )}

      {/* Phase Timeline */}
      <div className="space-y-3">
        {phases.map((phase, idx) => {
          const progress = getPhaseProgress(phase);
          const phaseTasks = state.taskCatalog.filter(t => t.executionPhaseId === phase.id);
          const isExpanded = expandedPhaseId === phase.id;
          const isEditing = editingPhaseId === phase.id;
          const borderColor = phaseColorBorder[phase.phaseNumber] || 'border-l-slate-500';
          const bgGrad = phaseColorBg[phase.phaseNumber] || 'from-slate-800/40';
          const numColor = phaseNumberColor[phase.phaseNumber] || 'bg-slate-800 text-slate-300 border-slate-600';

          return (
            <div key={phase.id} className={`border-l-4 ${borderColor} rounded-2xl overflow-hidden shadow-lg`}>
              {/* Phase Header Row */}
              <div
                className={`bg-gradient-to-r ${bgGrad} to-slate-900 border border-slate-800 border-l-0 p-4 rounded-r-2xl cursor-pointer hover:bg-slate-800/60 transition`}
                onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Phase Number Badge */}
                    <div className={`h-11 w-11 rounded-xl ${numColor} border font-extrabold text-lg flex items-center justify-center shadow-md`}>
                      {phase.phaseNumber}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-white text-sm leading-snug">{phase.phaseName}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{phase.phaseDescription}</p>
                      <div className="flex items-center space-x-3 mt-1.5">
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-md">
                          {phase.tradeType}
                        </span>
                        {phase.estimatedDays && (
                          <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{phase.estimatedDays} days/flat</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <Layers className="w-3 h-3" />
                          <span>{phaseTasks.length} tasks</span>
                        </span>
                        {phase.isMandatory && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950 border border-rose-800 px-1.5 py-0.5 rounded-md">
                            MANDATORY
                          </span>
                        )}
                        {phase.minHoldDaysAfterPrereq && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950 border border-amber-800 px-1.5 py-0.5 rounded-md flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Hold: {phase.minHoldDaysAfterPrereq}d Curing</span>
                          </span>
                        )}
                        {phase.canRunParallelWith && phase.canRunParallelWith.length > 0 && (
                          <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950 border border-cyan-800 px-1.5 py-0.5 rounded-md">
                            Parallel with P{phase.canRunParallelWith.join(', P')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Phase Progress Mini */}
                    <div className="text-right hidden sm:block">
                      <div className="font-mono font-extrabold text-sm text-white">{progress.pct}%</div>
                      <div className="text-[10px] text-slate-400">
                        {progress.approved}/{progress.total} tasks approved
                      </div>
                      <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${progress.pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Reorder & Actions */}
                    <div className="flex flex-col space-y-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveUp(phase)}
                        disabled={idx === 0}
                        className={`p-1.5 rounded-lg border transition ${
                          idx === 0
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(phase)}
                        disabled={idx === phases.length - 1}
                        className={`p-1.5 rounded-lg border transition ${
                          idx === phases.length - 1
                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Edit/Delete */}
                    <div className="flex flex-col space-y-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleStartEdit(phase)}
                        className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 hover:bg-slate-700 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePhase(phase)}
                        className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-rose-400 hover:bg-rose-950 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Expand Chevron */}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Phase Detail Panel */}
              {isExpanded && (
                <div className="bg-slate-950 border border-slate-800 border-l-0 border-t-0 p-5 space-y-4 animate-in fade-in">
                  {/* Edit Form */}
                  {isEditing && (
                    <form onSubmit={handleSaveEdit} className="bg-slate-900 border border-amber-800/70 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Edit Phase Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-slate-400">Phase Name</label>
                          <input
                            required type="text" value={formPhaseName}
                            onChange={(e) => setFormPhaseName(e.target.value)}
                            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Description</label>
                          <input
                            type="text" value={formPhaseDescription}
                            onChange={(e) => setFormPhaseDescription(e.target.value)}
                            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Primary Trade</label>
                          <select
                            value={formTradeType} onChange={(e) => setFormTradeType(e.target.value as TradeType)}
                            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          >
                            {trades.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400">Estimated Days</label>
                          <input
                            type="number" min={1} value={formEstimatedDays}
                            onChange={(e) => setFormEstimatedDays(parseInt(e.target.value, 10) || 1)}
                            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox" checked={formIsMandatory}
                              onChange={(e) => setFormIsMandatory(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-amber-500"
                            />
                            <span className="text-xs text-slate-300 font-bold">Mandatory Phase</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setEditingPhaseId(null)} className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs">Cancel</button>
                        <button type="submit" className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold">Save Changes</button>
                      </div>
                    </form>
                  )}

                  {/* Progress Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                      <div className="font-mono font-extrabold text-xl text-white">{progress.total}</div>
                      <div className="text-[10px] text-slate-400 uppercase mt-0.5">Total Task Instances</div>
                    </div>
                    <div className="bg-slate-900 border border-emerald-800/50 p-3 rounded-xl text-center">
                      <div className="font-mono font-extrabold text-xl text-emerald-400">{progress.approved}</div>
                      <div className="text-[10px] text-slate-400 uppercase mt-0.5">Approved</div>
                    </div>
                    <div className="bg-slate-900 border border-amber-800/50 p-3 rounded-xl text-center">
                      <div className="font-mono font-extrabold text-xl text-amber-400">{progress.inProgress}</div>
                      <div className="text-[10px] text-slate-400 uppercase mt-0.5">In Progress</div>
                    </div>
                    <div className="bg-slate-900 border border-sky-800/50 p-3 rounded-xl text-center">
                      <div className="font-mono font-extrabold text-xl text-sky-400">{progress.pct}%</div>
                      <div className="text-[10px] text-slate-400 uppercase mt-0.5">Phase Complete</div>
                    </div>
                  </div>

                  {/* Tasks in This Phase */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Catalogue Tasks in Phase {phase.phaseNumber} ({phaseTasks.length})
                    </h4>

                    {phaseTasks.length === 0 ? (
                      <div className="py-4 text-center text-slate-500 text-xs bg-slate-900 rounded-xl border border-slate-800">
                        No tasks linked to this phase. Assign tasks from the Task Catalogue.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {phaseTasks.map(task => {
                          const zone = state.roomZones.find(z => z.id === task.roomZoneId);
                          const prereqIds = task.prerequisiteTaskIds || [];

                          // Per-task progress (across all 70 flats)
                          const taskFlatInstances = state.flatTasks.filter(ft => ft.taskCatalogId === task.id);
                          const taskApproved = taskFlatInstances.filter(ft => ft.status === 'APPROVED').length;
                          const taskTotal = taskFlatInstances.length;

                          return (
                            <div key={task.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center justify-between group hover:border-slate-700 transition">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="font-bold text-white truncate">{task.taskName}</div>
                                <div className="flex items-center space-x-2 text-[10px]">
                                  <span className="text-slate-400">{zone?.zoneLabel}</span>
                                  {prereqIds.length > 0 && (
                                    <span className="text-rose-400 flex items-center space-x-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                                      <span>Needs {prereqIds.length} prereq(s)</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 ml-2 shrink-0">
                                <span className="font-mono font-bold text-emerald-400 text-[11px]">
                                  {taskApproved}/{taskTotal}
                                </span>

                                {/* Reassign dropdown */}
                                <select
                                  value={task.executionPhaseId || ''}
                                  onChange={(e) => handleReassignTask(task.id, e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-1 text-[10px] text-slate-300 w-20 opacity-0 group-hover:opacity-100 transition focus:opacity-100 focus:outline-none focus:border-sky-500"
                                >
                                  <option value="">Unlink</option>
                                  {phases.map(p => (
                                    <option key={p.id} value={p.id}>P{p.phaseNumber}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Unlinked Tasks Section */}
      {unlinkedTasks.length > 0 && (
        <div className="bg-slate-900 border border-amber-800/60 p-5 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Unlinked Tasks ({unlinkedTasks.length})
            </h4>
          </div>
          <p className="text-[11px] text-slate-400">These catalogue tasks are not assigned to any execution phase. Assign them to include in the construction sequence.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {unlinkedTasks.map(task => {
              const zone = state.roomZones.find(z => z.id === task.roomZoneId);
              return (
                <div key={task.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{task.taskName}</div>
                    <div className="text-[10px] text-slate-400">{task.tradeType} · {zone?.zoneLabel}</div>
                  </div>
                  <select
                    value=""
                    onChange={(e) => handleReassignTask(task.id, e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="bg-slate-900 border border-amber-700/60 rounded-lg px-2 py-1 text-[10px] text-amber-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Assign →</option>
                    {phases.map(p => (
                      <option key={p.id} value={p.id}>Phase {p.phaseNumber}: {p.phaseName}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dependency Flow Visualization */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-sky-400" />
          <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Construction Flow Overview</h4>
        </div>

        <div className="flex items-center overflow-x-auto py-3 space-x-2 scrollbar-thin scrollbar-thumb-slate-800">
          {phases.map((phase, idx) => {
            const progress = getPhaseProgress(phase);
            const numColor = phaseNumberColor[phase.phaseNumber] || 'bg-slate-800 text-slate-300 border-slate-600';

            return (
              <React.Fragment key={phase.id}>
                <div className="flex flex-col items-center shrink-0 min-w-[110px]">
                  <div className={`h-10 w-10 rounded-full ${numColor} border font-extrabold text-sm flex items-center justify-center shadow-md`}>
                    {phase.phaseNumber}
                  </div>
                  <div className="text-[10px] font-bold text-white text-center mt-1.5 leading-tight max-w-[100px]">
                    {phase.phaseName}
                  </div>
                  <div className="font-mono text-[10px] text-emerald-400 mt-1">{progress.pct}%</div>
                  <div className="w-16 bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-emerald-500 h-full" style={{ width: `${progress.pct}%` }} />
                  </div>
                </div>

                {idx < phases.length - 1 && (
                  <div className="flex items-center shrink-0 text-slate-600 pt-0">
                    <div className="w-6 h-0.5 bg-slate-700" />
                    <ChevronRight className="w-4 h-4 -ml-1" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
