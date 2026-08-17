'use client';

import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Truck, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  Search, 
  X,
  RefreshCw
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const MachineryFuelWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [machineryId, setMachineryId] = useState('');
  const [runningHours, setRunningHours] = useState('');
  const [dieselIssued, setDieselIssued] = useState('');
  const [operatorNotes, setOperatorNotes] = useState('Pouring slab & material lifting');

  const fleet = state.machinery || [];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/machinery/logs');
      setLogs(res?.logs || []);
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (!machineryId || !runningHours || !dieselIssued) return;

    try {
      await apiClient.post('/machinery/logs', {
        machineryId: Number(machineryId),
        runningHours: Number(runningHours),
        dieselIssuedLitres: Number(dieselIssued),
        operatorNotes
      });
      setIsModalOpen(false);
      setRunningHours('');
      setDieselIssued('');
      setStatusMessage('Machinery runtime & diesel issuance log recorded!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchLogs();
    } catch (e) {
      console.error(e);
    }
  };

  const totalRunningHours = logs.reduce((acc, l) => acc + Number(l.running_hours || 0), 0);
  const totalDieselIssued = logs.reduce((acc, l) => acc + Number(l.diesel_issued_litres || 0), 0);
  const avgEfficiency = totalRunningHours > 0 ? (totalDieselIssued / totalRunningHours).toFixed(2) : 0;
  const excessBurnCount = logs.filter(l => (Number(l.diesel_issued_litres || 0) / Math.max(1, Number(l.running_hours || 1))) > 10).length;

  const filteredLogs = logs.filter(l => 
    (l.machine_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.registration_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Fuel className="w-4 h-4" />
            <span>Heavy Machinery Fuel Management</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Hourly Fuel & Running Hours Tracker</h2>
          <p className="text-xs text-slate-400">
            Log machine running hours, diesel dispensation, fuel burn rates (L/hr) and excess consumption flags.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-purple-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Log Diesel & Runtime</span>
        </button>
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
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Running Hours</div>
          <div className="text-3xl font-black text-white mt-1">{totalRunningHours} hrs</div>
          <div className="text-[10px] text-purple-400 font-bold mt-1">Site Plant Utilization</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-amber-400">Diesel Issued</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{totalDieselIssued} L</div>
          <div className="text-[10px] text-slate-400 mt-1">Dispensed from Bowser</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-emerald-400">Fleet Fuel Efficiency</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">{avgEfficiency} L/hr</div>
          <div className="text-[10px] text-slate-400 mt-1">Standard: 6 - 9 L/hr</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-rose-400">Excess Burn Alerts</div>
          <div className="text-3xl font-black text-rose-400 mt-1">{excessBurnCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Logs &gt; 10 L/hr Flagged</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Fuel className="w-4 h-4 text-purple-400" />
            <h3 className="font-extrabold text-white text-sm">Machinery Daily Fuel & Runtime Ledger</h3>
          </div>
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search machinery or reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading machinery logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="font-bold text-sm">No machinery runtime logs recorded.</div>
            <div className="text-xs mt-1 text-slate-400">Click "Log Diesel & Runtime" to record hours and diesel issuance.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Date & Machine</th>
                  <th className="p-3.5">Reg Number</th>
                  <th className="p-3.5 text-right">Running Hours</th>
                  <th className="p-3.5 text-right">Diesel Issued (L)</th>
                  <th className="p-3.5 text-right">Efficiency (L/hr)</th>
                  <th className="p-3.5">Operator Notes</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map(l => {
                  const hrs = Number(l.running_hours || 0);
                  const fuel = Number(l.diesel_issued_litres || 0);
                  const eff = hrs > 0 ? (fuel / hrs).toFixed(2) : 0;
                  const isHigh = eff > 10;

                  return (
                    <tr key={`log-${l.id}`} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5">
                        <div className="font-extrabold text-white">{l.machine_name || 'Plant Equipment'}</div>
                        <div className="text-[10px] text-slate-400">{new Date(l.date_logged || l.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-3.5 font-mono text-purple-400 font-bold">{l.registration_number || 'REG-001'}</td>
                      <td className="p-3.5 text-right font-black text-white text-sm">{hrs} hrs</td>
                      <td className="p-3.5 text-right font-black text-amber-400 text-sm">{fuel} L</td>
                      <td className="p-3.5 text-right font-bold text-sm">
                        <span className={isHigh ? 'text-rose-400' : 'text-emerald-400'}>{eff} L/hr</span>
                      </td>
                      <td className="p-3.5 text-slate-300">{l.operator_notes || 'Operational'}</td>
                      <td className="p-3.5">
                        {isHigh ? (
                          <span className="px-2 py-0.5 bg-rose-950 border border-rose-800 text-rose-400 rounded-full font-bold text-[10px]">
                            HIGH CONSUMPTION
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
                            OPTIMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Log Machine Runtime & Fuel</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Machinery Asset</label>
                <select
                  value={machineryId}
                  onChange={(e) => setMachineryId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="">Select Asset...</option>
                  {fleet.map(m => (
                    <option key={m.id} value={m.id}>{m.machine_name || m.name} ({m.registration_number || m.regNo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Running Hours (hrs)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 6.5"
                    value={runningHours}
                    onChange={(e) => setRunningHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Diesel Issued (Litres)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50"
                    value={dieselIssued}
                    onChange={(e) => setDieselIssued(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Operator Remarks / Activity</label>
                <input
                  type="text"
                  required
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Save Runtime Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineryFuelWorkspace;
