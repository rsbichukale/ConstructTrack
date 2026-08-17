'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  X,
  Target,
  RefreshCw
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const DailyTargetsWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form states
  const [contractorId, setContractorId] = useState('');
  const [targetScope, setTargetScope] = useState('');
  const [targetQty, setTargetQty] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('sq.ft');

  const contractors = state.contractors || [];

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/contractors/targets?date=${selectedDate}`);
      setTargets(res?.targets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [selectedDate]);

  const handleCreateTarget = async (e) => {
    e.preventDefault();
    if (!contractorId || !targetScope) return;

    try {
      await apiClient.post('/contractors/targets', {
        contractorId: Number(contractorId),
        dateLogged: selectedDate,
        targetScope,
        targetQuantity: Number(targetQty) || 0,
        unitOfMeasure
      });
      setIsCreateModalOpen(false);
      setTargetScope('');
      setTargetQty('');
      setStatusMessage('Target successfully assigned and logged!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchTargets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateAchieved = async (targetId, achievedQty) => {
    try {
      await apiClient.patch(`/contractors/targets/${targetId}`, {
        achievedQuantity: Number(achievedQty)
      });
      fetchTargets();
    } catch (e) {
      console.error(e);
    }
  };

  const totalAssigned = targets.length;
  const totalCompleted = targets.filter(t => Number(t.achieved_quantity) >= Number(t.target_quantity) && Number(t.target_quantity) > 0).length;
  const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Operational Milestone SLAs</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Daily Work Targets & SLA Tracker</h2>
          <p className="text-xs text-slate-400">
            Assign and verify daily production targets per trade subcontractor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-amber-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Assign Daily Target</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Targets Logged</div>
          <div className="text-3xl font-black text-white mt-1">{totalAssigned}</div>
          <div className="text-[10px] text-amber-400 font-bold mt-1">Active Site Production Tasks</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-emerald-400">Achieved Targets</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">{totalCompleted}</div>
          <div className="text-[10px] text-slate-400 mt-1">100% Completed Today</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-sky-400">SLA Achievement %</div>
          <div className="text-3xl font-black text-sky-400 mt-1">{completionRate}%</div>
          <div className="text-[10px] text-slate-400 mt-1">On-Time Completion Gauge</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-rose-400">Pending / In-Progress</div>
          <div className="text-3xl font-black text-rose-400 mt-1">{totalAssigned - totalCompleted}</div>
          <div className="text-[10px] text-slate-400 mt-1">Under Evening Verification</div>
        </div>
      </div>

      {/* Target List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-white text-sm">Targets Assigned for {selectedDate}</h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">{targets.length} Records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading targets from database...</div>
        ) : targets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="font-bold text-sm">No targets logged for {selectedDate}</div>
            <div className="text-xs mt-1 text-slate-400">Click "Assign Daily Target" above to log morning milestones.</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {targets.map(t => {
              const pct = Number(t.target_quantity) > 0 
                ? Math.min(100, Math.round((Number(t.achieved_quantity) / Number(t.target_quantity)) * 100))
                : 0;

              return (
                <div key={`target-${t.id}`} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-850/50 transition">
                  <div>
                    <div className="font-black text-white text-sm">{t.target_scope}</div>
                    <div className="text-xs text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
                      <span className="text-amber-400 font-bold">{t.company_name || 'Contractor'}</span>
                      <span>•</span>
                      <span>Target: {t.target_quantity} {t.unit_of_measure}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-40 text-right">
                      <div className="text-xs font-bold text-white">{t.achieved_quantity || 0} / {t.target_quantity} {t.unit_of_measure}</div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 mt-1 overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        defaultValue={t.achieved_quantity || 0}
                        onBlur={(e) => handleUpdateAchieved(t.id, e.target.value)}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-1 text-center font-bold text-xs text-white"
                      />
                      <span className="text-xs text-slate-400 font-bold">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsCreateModalOpen(false)}>
          <div className="modal-panel max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Assign Daily Target Scope</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTarget} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contractor Agency</label>
                <select
                  value={contractorId}
                  onChange={(e) => setContractorId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="">Select Contractor...</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name || c.companyName} ({c.trade_type || c.tradeType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Scope & Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wing B1 Floor 4 Flat 401 & 402 AAC Blockwork Line Dori"
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={targetQty}
                    onChange={(e) => setTargetQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Unit of Measure</label>
                  <select
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="sq.ft">sq.ft</option>
                    <option value="r.ft">r.ft</option>
                    <option value="Cu.m">Cu.m</option>
                    <option value="Flats">Flats</option>
                    <option value="Rooms">Rooms</option>
                    <option value="No.">No.</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Create Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTargetsWorkspace;
