'use client';

import React, { useState } from 'react';
import { Layers, Plus, CheckCircle2, Sparkles, Filter, Hash, X } from 'lucide-react';
import { getAppState, saveAppState, getDynamicTrades } from '@/lib/dbState';
import { TaskCatalogItem, TradeType, FlatTaskPriority, FlatTask } from '@/lib/types';

export const MicroTaskManager: React.FC = () => {
  const state = getAppState();
  const phases = state.executionPhases || [];
  const [activeTab, setActiveTab] = useState<'catalog' | 'customization'>('catalog');

  // Master Task Catalog Form State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [tradeType, setTradeType] = useState<TradeType>('BRICK WORK');
  const [roomZoneId, setRoomZoneId] = useState<number>(1);
  const [executionPhaseId, setExecutionPhaseId] = useState<number | undefined>(phases[0]?.id);
  const [isBuildingCommon, setIsBuildingCommon] = useState<boolean>(true);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);

  // Client Customization Form State
  const [selectedFlatId, setSelectedFlatId] = useState<number>(1);
  const [customTaskName, setCustomTaskName] = useState('');
  const [customTradeType, setCustomTradeType] = useState<TradeType>('TILES');
  const [customRoomZoneId, setCustomRoomZoneId] = useState<number>(2);
  const [clientNotes, setClientNotes] = useState('');
  const [customPriority, setCustomPriority] = useState<FlatTaskPriority>('HIGH');
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  // Filter Catalog
  const [catalogTradeFilter, setCatalogTradeFilter] = useState<TradeType | 'ALL'>('ALL');
  const [catalogPhaseFilter, setCatalogPhaseFilter] = useState<number | 'ALL'>('ALL');

  // Add Master Task to Catalog & Propagate to All 70 Flats
  const handleAddMasterTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const newCatalogId = Date.now();
    const newCatalogItem: TaskCatalogItem = {
      id: newCatalogId,
      tradeType,
      taskName,
      roomZoneId,
      executionPhaseId,
      isBuildingCommon,
    };

    // Propagate to all 70 flats
    const newFlatTaskInstances: FlatTask[] = state.flats.map((flat, idx) => {
      const contractor = state.contractors.find(c => c.tradeType === tradeType);
      return {
        id: Date.now() + idx + Math.floor(Math.random() * 10000),
        flatId: flat.id,
        taskCatalogId: newCatalogId,
        assignedContractorId: contractor ? contractor.id : 1,
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        completionPct: 0,
        updatedAt: new Date().toISOString(),
      };
    });

    saveAppState({
      ...state,
      taskCatalog: [...state.taskCatalog, newCatalogItem],
      flatTasks: [...state.flatTasks, ...newFlatTaskInstances],
    });

    setIsAddingTask(false);
    setTaskName('');
    setCatalogMessage(`Added "${taskName}" to Master Catalog and propagated to all 70 flats!`);
    setTimeout(() => setCatalogMessage(null), 3500);
  };

  // Add Client Customization Task for a Specific Flat
  const handleAddClientCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTaskName.trim()) return;

    const customCatalogId = Date.now();
    const customCatalogItem: TaskCatalogItem = {
      id: customCatalogId,
      tradeType: customTradeType,
      taskName: `[Client Custom] ${customTaskName}`,
      roomZoneId: customRoomZoneId,
    };

    const contractor = state.contractors.find(c => c.tradeType === customTradeType);
    const customFlatTask: FlatTask = {
      id: Date.now() + 999,
      flatId: selectedFlatId,
      taskCatalogId: customCatalogId,
      assignedContractorId: contractor ? contractor.id : 1,
      status: 'IN_PROGRESS',
      priority: customPriority,
      completionPct: 0,
      updatedAt: new Date().toISOString(),
      isCustomClientTask: true,
      clientNotes,
    };

    saveAppState({
      ...state,
      taskCatalog: [...state.taskCatalog, customCatalogItem],
      flatTasks: [customFlatTask, ...state.flatTasks],
    });

    const flat = state.flats.find(f => f.id === selectedFlatId);
    setCustomMessage(`Added Client Custom Task for Flat ${flat?.wing}-${flat?.flatNumber}: "${customTaskName}"`);
    setCustomTaskName('');
    setClientNotes('');
    setTimeout(() => setCustomMessage(null), 3500);
  };

  const filteredCatalog = state.taskCatalog.filter(c => {
    if (catalogTradeFilter !== 'ALL' && c.tradeType !== catalogTradeFilter) return false;
    if (catalogPhaseFilter !== 'ALL' && c.executionPhaseId !== catalogPhaseFilter) return false;
    return true;
  });

  // Dynamic Trades List from Database + Custom User-Created Trades
  const trades = getDynamicTrades(state);

  const customTasksList = state.flatTasks.filter(t => t.isCustomClientTask);

  // Helper: Get phase name by id
  const getPhaseBadge = (phaseId?: number) => {
    if (!phaseId) return null;
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return null;
    return phase;
  };

  // Phase color map
  const phaseColors: Record<number, string> = {
    1: 'bg-orange-950 text-orange-400 border-orange-800',
    2: 'bg-blue-950 text-blue-400 border-blue-800',
    3: 'bg-slate-800 text-slate-300 border-slate-700',
    4: 'bg-cyan-950 text-cyan-400 border-cyan-800',
    5: 'bg-purple-950 text-purple-400 border-purple-800',
    6: 'bg-amber-950 text-amber-400 border-amber-800',
    7: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    8: 'bg-rose-950 text-rose-400 border-rose-800',
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Master Micro-Tasks Catalogue</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Task Catalogue & Client Customizations</h2>
          <p className="text-xs text-slate-400">Configure building common tasks, assign to execution phases, and log client custom requirements</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'catalog' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Task Catalogue ({state.taskCatalog.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('customization')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'customization' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Client Customizations ({customTasksList.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER TASK CATALOGUE */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {catalogMessage && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{catalogMessage}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Trade Filter */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Trade</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['ALL', ...trades] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setCatalogTradeFilter(t as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        catalogTradeFilter === t ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phase Filter */}
              <div className="flex items-center space-x-2 text-xs">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Phase</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCatalogPhaseFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      catalogPhaseFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ALL
                  </button>
                  {phases.sort((a, b) => a.phaseNumber - b.phaseNumber).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setCatalogPhaseFilter(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        catalogPhaseFilter === p.id ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Phase {p.phaseNumber}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Common Micro-Task</span>
            </button>
          </div>

          {/* Add Master Task Form */}
          {isAddingTask && (
            <form onSubmit={handleAddMasterTask} className="bg-slate-900 border border-sky-800 p-5 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Add Common Micro-Task to Master Catalogue</h4>
                <button type="button" onClick={() => setIsAddingTask(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Micro-Task Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Electrical Distribution Box Wiring"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Trade Category</label>
                  <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value as TradeType)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {trades.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Room Zone</label>
                  <select
                    value={roomZoneId}
                    onChange={(e) => setRoomZoneId(parseInt(e.target.value, 10))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {state.roomZones.map(z => <option key={z.id} value={z.id}>{z.zoneLabel}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Execution Phase</label>
                  <select
                    value={executionPhaseId || ''}
                    onChange={(e) => setExecutionPhaseId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- No Phase --</option>
                    {phases.sort((a, b) => a.phaseNumber - b.phaseNumber).map(p => (
                      <option key={p.id} value={p.id}>Phase {p.phaseNumber}: {p.phaseName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddingTask(false)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs hover:text-white transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition">Add & Propagate to All 70 Flats</button>
              </div>
            </form>
          )}

          {/* Master Catalogue Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Task Name</th>
                    <th className="py-3 px-4">Trade Category</th>
                    <th className="py-3 px-4">Room Zone</th>
                    <th className="py-3 px-4">Execution Phase</th>
                    <th className="py-3 px-4 text-center">Prerequisite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredCatalog.map((item) => {
                    const zone = state.roomZones.find(z => z.id === item.roomZoneId);
                    const phase = getPhaseBadge(item.executionPhaseId);
                    const phaseNum = phase?.phaseNumber || 0;
                    const colorClass = phaseColors[phaseNum] || 'bg-slate-800 text-slate-400 border-slate-700';

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-bold text-white">{item.taskName}</td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-md">
                            {item.tradeType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{zone?.zoneLabel}</td>
                        <td className="py-3 px-4">
                          {phase ? (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${colorClass}`}>
                              Phase {phase.phaseNumber} · {phase.phaseName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Unlinked</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.prerequisiteTaskIds && item.prerequisiteTaskIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {item.prerequisiteTaskIds.map(prereqId => {
                                const prereq = state.taskCatalog.find(c => c.id === prereqId);
                                return prereq ? (
                                  <span key={prereqId} className="text-[10px] font-bold text-rose-400 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded-md">
                                    {prereq.taskName}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Stats */}
            <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Showing {filteredCatalog.length} of {state.taskCatalog.length} catalogue items</span>
              <span className="font-mono font-bold text-sky-400">{phases.length} Execution Phases</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENT CUSTOMIZATIONS */}
      {activeTab === 'customization' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client-Specific Additional Task Requirements</h3>
          </div>

          {customMessage && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{customMessage}</span>
            </div>
          )}

          {/* Form to Add Client Custom Task */}
          <form onSubmit={handleAddClientCustomTask} className="bg-slate-900 border border-amber-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Add Custom Flat Requirement / Client Modification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Select Flat Unit</label>
                <select
                  value={selectedFlatId}
                  onChange={(e) => setSelectedFlatId(parseInt(e.target.value, 10))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  {state.flats.map(f => (
                    <option key={f.id} value={f.id}>
                      Flat {f.wing}-{f.flatNumber} (Floor {f.floorNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Custom Task Description</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Italian Marble Flooring in Master Bed"
                  value={customTaskName}
                  onChange={(e) => setCustomTaskName(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Trade Category</label>
                <select
                  value={customTradeType}
                  onChange={(e) => setCustomTradeType(e.target.value as TradeType)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  {trades.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Target Room Zone</label>
                <select
                  value={customRoomZoneId}
                  onChange={(e) => setCustomRoomZoneId(parseInt(e.target.value, 10))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  {state.roomZones.map(z => <option key={z.id} value={z.id}>{z.zoneLabel}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Execution Priority</label>
                <select
                  value={customPriority}
                  onChange={(e) => setCustomPriority(e.target.value as FlatTaskPriority)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="HIGH">HIGH Priority</option>
                  <option value="MEDIUM">MEDIUM Priority</option>
                  <option value="LOW">LOW Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400">Client Specification Notes & Contract Reference</label>
              <textarea
                rows={2}
                placeholder="e.g. Owner requested upgrade to Bottochino Italian Marble with brass inlay strips..."
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Attach Client Customization Task</span>
            </button>
          </form>

          {/* List of Custom Tasks */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Logged Client Customizations & Additions ({customTasksList.length})</h4>

            <div className="space-y-2">
              {customTasksList.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No client custom requirements logged. Use form above to add flat-specific upgrades or client changes.
                </div>
              ) : (
                customTasksList.map((t) => {
                  const flat = state.flats.find(f => f.id === t.flatId);
                  const catalog = state.taskCatalog.find(c => c.id === t.taskCatalogId);

                  return (
                    <div key={t.id} className="p-3 bg-slate-950 border border-amber-800/60 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center space-x-2">
                          <span className="text-amber-400">Flat {flat?.wing}-{flat?.flatNumber}:</span>
                          <span>{catalog?.taskName}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{t.clientNotes || 'Client requested customization'}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-800 font-semibold mt-1 inline-block">
                          {t.priority} Priority
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
