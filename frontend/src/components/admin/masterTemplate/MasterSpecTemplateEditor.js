'use client';

import React, { useState } from 'react';
import { Layers, Plus, Sparkles, Edit, Trash2, Save, X, GitCommit, Link2, Globe } from 'lucide-react';
import { getAppState, saveAppState, getDynamicTrades, updateTaskCatalogItem, deleteTaskCatalogItem } from '../../../lib/dbState';
import { syncTaskCatalogItemToBackend } from '../../../lib/backendSync';

export const MasterSpecTemplateEditor = ({
  phasesToUse,
  onShowMessage,
}) => {
  const state = getAppState();
  const [selectedFlatType, setSelectedFlatType] = useState('2BHK');
  const [selectedZoneId, setSelectedZoneId] = useState(4);

  const [newTaskName, setNewTaskName] = useState('');
  const [newTradeType, setNewTradeType] = useState('BRICK WORK');
  const [newExecutionPhaseId, setNewExecutionPhaseId] = useState(1);
  const [newMostLikelyDays, setNewMostLikelyDays] = useState(3);
  const [newPrereqIds, setNewPrereqIds] = useState([]);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [editingTask, setEditingTask] = useState(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editTradeType, setEditTradeType] = useState('BRICK WORK');
  const [editPhaseId, setEditPhaseId] = useState(1);
  const [editDays, setEditDays] = useState(3);
  const [editPrereqIds, setEditPrereqIds] = useState([]);

  const [showCrossZonePrereqs, setShowCrossZonePrereqs] = useState(false);

  const trades = getDynamicTrades(state);
  const selectedZone = (state.roomZones || []).find(z => z.id === selectedZoneId) || (state.roomZones || [])[0];
  const roomMicroTasks = (state.taskCatalog || []).filter(c => c.roomZoneId === selectedZoneId);

  const handleToggleNewPrereq = (taskId) => {
    if (newPrereqIds.includes(taskId)) {
      setNewPrereqIds(newPrereqIds.filter(id => id !== taskId));
    } else {
      setNewPrereqIds([...newPrereqIds, taskId]);
    }
  };

  const handleToggleEditPrereq = (taskId) => {
    if (editPrereqIds.includes(taskId)) {
      setEditPrereqIds(editPrereqIds.filter(id => id !== taskId));
    } else {
      setEditPrereqIds([...editPrereqIds, taskId]);
    }
  };

  const handleAddMasterTask = (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newCatalogItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      tradeType: newTradeType,
      taskName: newTaskName.trim(),
      roomZoneId: selectedZoneId,
      executionPhaseId: newExecutionPhaseId,
      prerequisiteTaskIds: newPrereqIds,
      isBuildingCommon: false,
      mostLikelyDays: newMostLikelyDays,
    };

    saveAppState({
      ...state,
      taskCatalog: [...(state.taskCatalog || []), newCatalogItem],
    });

    syncTaskCatalogItemToBackend(newCatalogItem);

    setNewTaskName('');
    setNewPrereqIds([]);
    setIsAddingTask(false);
    onShowMessage(`Added "${newTaskName}" to Master ${selectedZone?.zoneLabel} Specification (Phase ${newExecutionPhaseId})!`);
  };

  const handleStartEditTask = (task) => {
    setEditingTask(task);
    setEditTaskName(task.taskName);
    setEditTradeType(task.tradeType);
    setEditPhaseId(task.executionPhaseId || 1);
    setEditDays(task.mostLikelyDays || 3);
    setEditPrereqIds(task.prerequisiteTaskIds || []);
    setShowCrossZonePrereqs(false);
  };

  const handleSaveEditedTask = (e) => {
    e.preventDefault();
    if (!editingTask || !editTaskName.trim()) return;

    const updated = {
      taskName: editTaskName.trim(),
      tradeType: editTradeType,
      executionPhaseId: editPhaseId,
      mostLikelyDays: editDays,
      prerequisiteTaskIds: editPrereqIds,
    };

    updateTaskCatalogItem(editingTask.id, updated);

    setEditingTask(null);
    onShowMessage(`Updated "${editTaskName}" master specification & prerequisites!`);
  };

  const handleDeleteTask = (task) => {
    if (confirm(`Are you sure you want to remove "${task.taskName}" from the master template?`)) {
      deleteTaskCatalogItem(task.id);
      onShowMessage(`Removed "${task.taskName}" from master template.`);
    }
  };

  const renderPrerequisitePicker = (
    currentTaskId,
    selectedPrereqs,
    onToggle
  ) => {
    const sameZoneTasks = (state.taskCatalog || []).filter(c => c.roomZoneId === selectedZoneId && c.id !== currentTaskId);
    const otherZoneTasks = (state.taskCatalog || []).filter(c => c.roomZoneId !== selectedZoneId && c.id !== currentTaskId);

    return (
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Link2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Prerequisite Tasks (Required Prior Completions):</span>
          </label>

          <button
            type="button"
            onClick={() => setShowCrossZonePrereqs(!showCrossZonePrereqs)}
            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1"
          >
            <Globe className="w-3 h-3" />
            <span>{showCrossZonePrereqs ? 'Show Same Room Only' : '+ Include Other Rooms'}</span>
          </button>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">
            Same Room ({selectedZone?.zoneLabel}) Micro-Tasks:
          </span>
          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-40 overflow-y-auto">
            {sameZoneTasks.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No other tasks in this room zone yet.</span>
            ) : (
              sameZoneTasks.map(t => {
                const isSelected = selectedPrereqs.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onToggle(t.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-1 border ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{t.taskName} ({t.tradeType})</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {showCrossZonePrereqs && (
          <div className="space-y-1 pt-2">
            <span className="text-[10px] font-bold text-sky-400 uppercase block flex items-center space-x-1">
              <Globe className="w-3 h-3 text-sky-400" />
              <span>Cross-Zone Tasks from Other Rooms in Flat:</span>
            </span>
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-44 overflow-y-auto">
              {otherZoneTasks.map(t => {
                const isSelected = selectedPrereqs.includes(t.id);
                const zone = (state.roomZones || []).find(z => z.id === t.roomZoneId);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onToggle(t.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 border ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-400 shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>[{zone?.zoneLabel || 'Room'}] {t.taskName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Master Specification & Sequence Configurator</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">Master Micro-Task Specifications & Trade Dependencies</h2>
            <p className="text-xs text-slate-400">Define trades, sequence phases, and prerequisite dependencies for room micro-tasks</p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedFlatType('2BHK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedFlatType === '2BHK' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🏢 2BHK Master Template
            </button>
            <button
              onClick={() => setSelectedFlatType('3BHK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedFlatType === '3BHK' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🏢 3BHK Master Template
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {(state.roomZones || [])
            .filter(z => (selectedFlatType === '2BHK' ? z.id <= 9 : true))
            .map(z => {
              const count = (state.taskCatalog || []).filter(c => c.roomZoneId === z.id).length;
              const isSelected = z.id === selectedZoneId;
              return (
                <button
                  key={z.id}
                  onClick={() => setSelectedZoneId(z.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 border ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                  }`}
                >
                  <span>{z.zoneLabel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-sky-950 text-sky-200' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">
              Master {selectedZone?.zoneLabel} Specification ({selectedFlatType}) • {roomMicroTasks.length} Micro-Tasks
            </h3>
          </div>

          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Master Micro-Task</span>
          </button>
        </div>

        {isAddingTask && (
          <form onSubmit={handleAddMasterTask} className="bg-slate-950 border border-emerald-500/50 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Add New Micro-Task to Master {selectedZone?.zoneLabel} Specification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Micro-Task Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Kitchen Exhaust Chimney Hole Cutout"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Trade Category</label>
                <select
                  value={newTradeType}
                  onChange={(e) => setNewTradeType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                >
                  {trades.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-purple-400 uppercase block mb-1 flex items-center space-x-1">
                  <GitCommit className="w-3 h-3 text-purple-400" />
                  <span>Execution Phase (Priority)</span>
                </label>
                <select
                  value={newExecutionPhaseId}
                  onChange={(e) => setNewExecutionPhaseId(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-purple-800/80 rounded-xl p-2.5 text-xs text-purple-200 font-bold"
                >
                  {phasesToUse.map(p => (
                    <option key={p.id} value={p.id}>
                      Phase {p.phaseNumber}: {p.phaseName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {renderPrerequisitePicker(null, newPrereqIds, handleToggleNewPrereq)}

            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setIsAddingTask(false)} className="px-3.5 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow">Save Master Task</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roomMicroTasks.map((task, idx) => {
            const phase = phasesToUse.find(p => p.id === task.executionPhaseId);
            const prereqTasks = (state.taskCatalog || []).filter(c => (task.prerequisiteTaskIds || []).includes(c.id));

            return (
              <div
                key={task.id}
                className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-start justify-between hover:border-slate-700 transition space-x-3"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded uppercase">
                      {idx + 1}. {task.tradeType}
                    </span>
                    {phase && (
                      <span className="text-[9px] font-bold text-purple-400 bg-purple-950 border border-purple-800 px-2 py-0.5 rounded flex items-center space-x-1">
                        <GitCommit className="w-3 h-3 text-purple-400" />
                        <span>Phase {phase.phaseNumber}: {phase.phaseName}</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-extrabold text-white leading-snug">{task.taskName}</h4>

                  {prereqTasks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-amber-400 pt-0.5">
                      <Link2 className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="font-bold">Prerequisites:</span>
                      {prereqTasks.map(pr => (
                        <span key={pr.id} className="bg-amber-950/80 text-amber-300 border border-amber-800/80 px-1.5 py-0.2 rounded font-mono">
                          {pr.taskName}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400">
                    Duration: <span className="text-slate-300 font-mono font-bold">{task.mostLikelyDays || 3} Days</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => handleStartEditTask(task)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 rounded-lg transition border border-slate-800"
                    title="Edit Master Task Specification & Prerequisites"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-rose-400 rounded-lg transition border border-slate-800"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Master Micro-Task Specification & Prerequisites</h3>
              <button onClick={() => setEditingTask(null)} className="p-1.5 bg-slate-800 text-slate-400 rounded-xl"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveEditedTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Micro-Task Name</label>
                <input
                  type="text"
                  required
                  value={editTaskName}
                  onChange={(e) => setEditTaskName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-purple-400 uppercase block mb-1 flex items-center space-x-1">
                  <GitCommit className="w-3.5 h-3.5 text-purple-400" />
                  <span>Execution Phase (Sequence Priority)</span>
                </label>
                <select
                  value={editPhaseId}
                  onChange={(e) => setEditPhaseId(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-purple-800 rounded-xl p-3 text-xs text-purple-200 font-bold focus:outline-none focus:border-purple-500"
                >
                  {phasesToUse.map(p => (
                    <option key={p.id} value={p.id}>
                      Phase {p.phaseNumber}: {p.phaseName}
                    </option>
                  ))}
                </select>
              </div>

              {renderPrerequisitePicker(editingTask.id, editPrereqIds, handleToggleEditPrereq)}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Trade Category</label>
                  <select
                    value={editTradeType}
                    onChange={(e) => setEditTradeType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    {trades.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Estimated Days</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={editDays}
                    onChange={(e) => setEditDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow"><Save className="w-4 h-4" /><span>Save Specification</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
