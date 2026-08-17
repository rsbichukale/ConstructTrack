'use client';

import React, { useState, useEffect } from 'react';
import { 
  Ruler, 
  Layers, 
  Building2, 
  CheckCircle2, 
  Zap, 
  Edit3, 
  Save, 
  Sparkles, 
  SlidersHorizontal,
  ChevronRight,
  FileCheck2,
  Users,
  DollarSign,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
  Lock,
  Unlock,
  ArrowRight,
  ShieldAlert,
  X
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const FloorPlanTemplateWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();

  const [selectedTypology, setSelectedTypology] = useState('3BHK');
  const [templates, setTemplates] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingDim, setIsEditingDim] = useState(false);
  const [isPropagating, setIsPropagating] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // New Task Form
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTrade, setNewTaskTrade] = useState('BRICK WORK');
  const [newTaskSeq, setNewTaskSeq] = useState(1);

  // Form states for room dimensions
  const [dimLength, setDimLength] = useState(16);
  const [dimWidth, setDimWidth] = useState(12);
  const [dimHeight, setDimHeight] = useState(10);
  const [dimDeduction, setDimDeduction] = useState(40);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/execution/typologies?flatType=${selectedTypology}`);
      if (res?.templates && res.templates.length > 0) {
        setTemplates(res.templates);
        if (!selectedZoneId || !res.templates.some(t => String(t.room_zone_id) === String(selectedZoneId))) {
          setSelectedZoneId(res.templates[0].room_zone_id);
        }
      } else {
        const fallback = (state.roomZones || []).map(rz => ({
          room_zone_id: rz.id,
          zone_label: rz.zoneLabel || rz.zone_label,
          zone_code: rz.zoneCode || rz.zone_code,
          length_ft: 14,
          width_ft: 12,
          height_ft: 10,
          door_window_deduction_sqft: 25,
          tasks_count: 10
        }));
        setTemplates(fallback);
        if (fallback.length > 0 && !selectedZoneId) {
          setSelectedZoneId(fallback[0].room_zone_id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedTypology]);

  const selectedTemplate = templates.find(t => String(t.room_zone_id) === String(selectedZoneId)) || templates[0];

  useEffect(() => {
    if (selectedTemplate) {
      setDimLength(Number(selectedTemplate.length_ft || 14));
      setDimWidth(Number(selectedTemplate.width_ft || 12));
      setDimHeight(Number(selectedTemplate.height_ft || 10));
      setDimDeduction(Number(selectedTemplate.door_window_deduction_sqft || 25));
    }
  }, [selectedTemplate?.room_zone_id, selectedTypology]);

  // Tasks in Task Catalog for this Room Zone, sorted by sequence_order
  const roomCatalogTasks = (state.taskCatalog || [])
    .filter(c => String(c.roomZoneId || c.room_zone_id) === String(selectedTemplate?.room_zone_id))
    .sort((a, b) => (Number(a.sequenceOrder || a.sequence_order || 1) - Number(b.sequenceOrder || b.sequence_order || 1)));

  // Target flats count
  const targetFlats = (state.flats || []).filter(f => f.flat_type === selectedTypology || f.unit_type === selectedTypology);

  // Save template dimensions
  const handleSaveTemplate = async () => {
    try {
      await apiClient.post(`/execution/typologies/${selectedTypology}/zones/${selectedTemplate.room_zone_id}`, {
        lengthFt: dimLength,
        widthFt: dimWidth,
        heightFt: dimHeight,
        doorWindowDeductionSqft: dimDeduction
      });
      setIsEditingDim(false);
      setStatusMessage(`Saved standard dimensions for ${selectedTemplate.zone_label} in ${selectedTypology} plan!`);
      setTimeout(() => setStatusMessage(null), 3000);
      fetchTemplates();
    } catch (e) {
      console.error(e);
    }
  };

  // Add New Task to Room Zone Catalog
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim() || !selectedTemplate) return;

    try {
      const res = await apiClient.post('/execution/tasks/catalog', {
        taskName: newTaskName.trim(),
        tradeType: newTaskTrade,
        roomZoneId: selectedTemplate.room_zone_id,
        sequenceOrder: Number(newTaskSeq) || 1,
        executionPhaseId: 1
      });

      if (res?.item) {
        const updatedCatalog = [...(state.taskCatalog || []), {
          id: res.item.id,
          taskName: res.item.task_name,
          tradeType: res.item.trade_type,
          roomZoneId: res.item.room_zone_id,
          sequenceOrder: res.item.sequence_order,
          priority: res.item.priority
        }];
        state.taskCatalog = updatedCatalog;
      }

      setNewTaskName('');
      setIsAddTaskModalOpen(false);
      setStatusMessage(`Added task "${newTaskName.trim()}" at Step ${newTaskSeq}!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Update Task Sequence Order inline
  const handleUpdateSequence = async (taskId, sequenceOrder) => {
    const seqNum = Number(sequenceOrder) || 1;
    try {
      await apiClient.patch(`/execution/tasks/catalog/${taskId}`, { sequenceOrder: seqNum });
      if (state.taskCatalog) {
        state.taskCatalog = state.taskCatalog.map(t => t.id === taskId ? { ...t, sequenceOrder: seqNum, sequence_order: seqNum } : t);
      }
      setStatusMessage(`Step Sequence updated to Step ${seqNum}!`);
      setTimeout(() => setStatusMessage(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Task from Catalog
  const handleDeleteTask = async (taskId, taskName) => {
    if (!window.confirm(`Are you sure you want to remove "${taskName}" from standard ${selectedTemplate?.zone_label} plan?`)) return;

    try {
      await apiClient.delete(`/execution/tasks/catalog/${taskId}`);
      if (state.taskCatalog) {
        state.taskCatalog = state.taskCatalog.filter(t => t.id !== taskId);
      }
      setStatusMessage(`Removed "${taskName}" from template.`);
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // 1-Click Batch Propagation
  const handlePropagate = async () => {
    setIsPropagating(true);
    try {
      const res = await apiClient.post(`/execution/typologies/${selectedTypology}/propagate`, {});
      setStatusMessage(`⚡ Master Plan Synchronized: Applied standard sequence precedence & tasks to all ${res.targetFlatsCount || targetFlats.length} ${selectedTypology} flats!`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPropagating(false);
    }
  };

  // Calculations
  const computedFlooring = Math.round(dimLength * dimWidth * 100) / 100;
  const computedWall = Math.round(Math.max(0, (2 * (dimLength + dimWidth) * dimHeight) - dimDeduction) * 100) / 100;
  const computedSkirting = Math.round(Math.max(0, 2 * (dimLength + dimWidth) - 3.0) * 100) / 100;

  const tradesOptions = [
    'BRICK WORK', 'PLASTER WORK', 'POP', 'TILES', 'ELECTRICAL', 'PLUMBING', 
    'CARPENTRY', 'PAINTING', 'WATERPROOFING', 'FABRICATION', 'CLEANING', 'GENERAL'
  ];

  // Group tasks by sequence step
  const sequenceGroups = {};
  roomCatalogTasks.forEach(task => {
    const seq = Number(task.sequenceOrder || task.sequence_order || 1);
    if (!sequenceGroups[seq]) sequenceGroups[seq] = [];
    sequenceGroups[seq].push(task);
  });

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Ruler className="w-4 h-4" />
            <span>Floor Plan & Step Precedence Lock Engine</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Standard Floor Plans, Room Dimensions & Construction Step Sequences ({selectedTypology})
          </h2>
          <p className="text-xs text-slate-400">
            Set execution sequence numbers (1, 2, 3...). Tasks with the same number run in parallel. Lower steps lock higher steps until approved.
          </p>
        </div>

        {/* Typology Switcher & Batch Propagate Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['3BHK', '2BHK'].map(type => (
              <button
                key={type}
                onClick={() => {
                  setSelectedTypology(type);
                  setSelectedZoneId(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  selectedTypology === type ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {type} Master Plan
              </button>
            ))}
          </div>

          <button
            onClick={handlePropagate}
            disabled={isPropagating}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            {isPropagating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-slate-950" />}
            <span>{isPropagating ? 'Applying to Site...' : `Apply & Lock Sequence across ${targetFlats.length || 35} Flats`}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Precedence Lock Info Banner */}
      <div className="bg-slate-950 border border-sky-800/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-700 flex items-center justify-center text-sky-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-white">Automated Step-by-Step Construction Precedence Lock</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Tasks in Step 1 (Brickwork) must be completed before Step 2 (Plumbing & Electrical) unlocks. Multiple tasks with the same Step Number can proceed in parallel.
            </div>
          </div>
        </div>

        {/* Roadmap Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold font-mono">
          <span className="px-2 py-1 bg-amber-950 border border-amber-800 text-amber-300 rounded-lg">Step 1: Brickwork</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 bg-sky-950 border border-sky-800 text-sky-300 rounded-lg">Step 2: MEP Chipping (Parallel)</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 bg-purple-950 border border-purple-800 text-purple-300 rounded-lg">Step 3: Plaster</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-lg">Step 4: POP</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 bg-teal-950 border border-teal-800 text-teal-300 rounded-lg">Step 5: Tiles</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 bg-indigo-950 border border-indigo-800 text-indigo-300 rounded-lg">Step 6: Paint</span>
        </div>
      </div>

      {/* Main Grid: Room Plans on Left, Details & Micro-Tasks on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Room Zones in Selected Typology */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-extrabold uppercase text-sky-400 tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Rooms in Standard {selectedTypology} Plan</span>
            </span>
            <span className="text-xs font-bold text-slate-400">{templates.length} Rooms</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading rooms...</div>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-[550px] overflow-y-auto pr-1">
              {templates.map(t => {
                const isSelected = String(t.room_zone_id) === String(selectedTemplate?.room_zone_id);
                const area = Math.round(Number(t.length_ft) * Number(t.width_ft));
                const zoneTasks = (state.taskCatalog || []).filter(c => String(c.roomZoneId || c.room_zone_id) === String(t.room_zone_id));

                return (
                  <button
                    key={`template-zone-${t.room_zone_id}`}
                    onClick={() => setSelectedZoneId(t.room_zone_id)}
                    className={`p-3.5 rounded-xl text-left transition flex items-center justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-sky-950 border-sky-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-sm flex items-center space-x-2">
                        <span>{t.zone_label}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {t.length_ft}' × {t.width_ft}' • {zoneTasks.length} Micro-Tasks
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-amber-400">{area} sq.ft</span>
                      <ChevronRight className="w-4 h-4 text-slate-500 ml-auto mt-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Room Dimensions & Standard Micro-Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dimensions Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <Ruler className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">
                  Standard Dimensions: {selectedTemplate?.zone_label} ({selectedTypology} Plan)
                </h3>
              </div>

              <button
                onClick={() => {
                  if (isEditingDim) handleSaveTemplate();
                  else setIsEditingDim(true);
                }}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                {isEditingDim ? <Save className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5 text-sky-400" />}
                <span>{isEditingDim ? 'Save Template Dimensions' : 'Edit Dimensions'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Length (L)</span>
                {isEditingDim ? (
                  <input
                    type="number"
                    value={dimLength}
                    onChange={(e) => setDimLength(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm font-black text-white outline-none mt-1"
                  />
                ) : (
                  <span className="text-lg font-black text-white mt-1 block">{dimLength} ft</span>
                )}
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Width (W)</span>
                {isEditingDim ? (
                  <input
                    type="number"
                    value={dimWidth}
                    onChange={(e) => setDimWidth(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm font-black text-white outline-none mt-1"
                  />
                ) : (
                  <span className="text-lg font-black text-white mt-1 block">{dimWidth} ft</span>
                )}
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Height (H)</span>
                {isEditingDim ? (
                  <input
                    type="number"
                    value={dimHeight}
                    onChange={(e) => setDimHeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm font-black text-white outline-none mt-1"
                  />
                ) : (
                  <span className="text-lg font-black text-white mt-1 block">{dimHeight} ft</span>
                )}
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Deduction</span>
                {isEditingDim ? (
                  <input
                    type="number"
                    value={dimDeduction}
                    onChange={(e) => setDimDeduction(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm font-black text-white outline-none mt-1"
                  />
                ) : (
                  <span className="text-lg font-black text-amber-400 mt-1 block">-{dimDeduction} sq.ft</span>
                )}
              </div>
            </div>

            {/* Standard Auto-Calculated BOQ Quantities */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">Standard Flooring</span>
                <span className="text-base font-black text-white mt-0.5 block">{computedFlooring} sq.ft</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold text-sky-400 uppercase block">Standard Wall Plaster</span>
                <span className="text-base font-black text-white mt-0.5 block">{computedWall} sq.ft</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Standard Skirting</span>
                <span className="text-base font-black text-white mt-0.5 block">{computedSkirting} r.ft</span>
              </div>
            </div>
          </div>

          {/* Sequence Precedence Tasks for this Room */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm">
                  <FileCheck2 className="w-4 h-4" />
                  <span>Construction Step Sequence: {selectedTemplate?.zone_label} ({roomCatalogTasks.length} Tasks)</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set Step Numbers (1, 2, 3...). Step 1 locks Step 2; identical Step numbers run in parallel.
                </p>
              </div>

              <button
                onClick={() => setIsAddTaskModalOpen(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Task to {selectedTemplate?.zone_label}</span>
              </button>
            </div>

            {/* Task List Grouped by Step */}
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {Object.keys(sequenceGroups).length === 0 ? (
                <div className="py-8 text-center text-slate-500 font-bold">
                  No micro-tasks configured for this room. Click "Add Task" to create one!
                </div>
              ) : (
                Object.keys(sequenceGroups).sort((a,b) => Number(a) - Number(b)).map((stepNum) => {
                  const tasksInStep = sequenceGroups[stepNum];
                  const isParallel = tasksInStep.length > 1;

                  return (
                    <div key={`step-group-${stepNum}`} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs">
                            STEP {stepNum}
                          </span>
                          {isParallel ? (
                            <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <Zap className="w-3 h-3 text-sky-400" />
                              <span>{tasksInStep.length} Tasks Run in Parallel</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Sequential Execution</span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono">
                          {stepNum > 1 ? `🔒 Locked until Step ${Number(stepNum) - 1} Approved` : '🔓 Initial Starting Step'}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-800/40">
                        {tasksInStep.map((task) => (
                          <div key={`cat-task-${task.id}`} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="font-extrabold text-white text-xs">{task.taskName || task.task_name}</div>
                              <span className="text-[10px] text-sky-400 font-bold bg-sky-950/60 border border-sky-800 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                {task.tradeType || task.trade_type}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Step Number Changer */}
                              <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded-xl text-xs">
                                <span className="text-[10px] font-bold text-slate-400">Step:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="15"
                                  defaultValue={stepNum}
                                  onBlur={(e) => handleUpdateSequence(task.id, e.target.value)}
                                  className="w-8 bg-transparent text-center font-black text-amber-400 outline-none"
                                />
                              </div>

                              {/* Delete Task */}
                              <button
                                onClick={() => handleDeleteTask(task.id, task.taskName || task.task_name)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                                title="Remove task from template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddTaskModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsAddTaskModalOpen(false)}>
          <div className="modal-panel max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Micro-Task to {selectedTemplate?.zone_label}</span>
              </h3>
              <button 
                onClick={() => setIsAddTaskModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Micro-Task Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toilet Concealed Plumbing Core Cutting & Pipe Laying..."
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Trade Type
                  </label>
                  <select
                    value={newTaskTrade}
                    onChange={(e) => setNewTaskTrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none"
                  >
                    {tradesOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Step Priority Sequence (1, 2, 3...)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={newTaskSeq}
                    onChange={(e) => setNewTaskSeq(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none"
                  />
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    Set same step number for tasks running in parallel.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanTemplateWorkspace;
