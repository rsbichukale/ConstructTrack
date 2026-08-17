'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Fuel, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Wrench, 
  AlertTriangle, 
  Calendar, 
  User, 
  Building 
} from 'lucide-react';
import { fetchMachineryLogs, recordMachineryLog } from '../../lib/backendSync';

export const MachineryDieselHub = () => {
  const [machineryData, setMachineryData] = useState({ logs: [], totalOperatingHours: 0, totalDieselLiters: 0, activeMachinesCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [machineName, setMachineName] = useState('JCB 3DX Excavator');
  const [machineCode, setMachineCode] = useState('JCB-01');
  const [operatorName, setOperatorName] = useState('');
  const [startReading, setStartReading] = useState('');
  const [endReading, setEndReading] = useState('');
  const [dieselIssued, setDieselIssued] = useState('30');
  const [workLocation, setWorkLocation] = useState('Wing B1');
  const [workDescription, setWorkDescription] = useState('');
  const [breakdownHours, setBreakdownHours] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchMachineryLogs();
    setMachineryData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!machineName || !startReading || !endReading) return;
    setIsSubmitting(true);
    try {
      await recordMachineryLog({
        machineName,
        machineCode,
        operatorName: operatorName.trim() || 'Assigned Operator',
        startReadingHours: Number(startReading),
        endReadingHours: Number(endReading),
        dieselIssuedLiters: Number(dieselIssued || 0),
        workLocation: workLocation.trim() || 'General Site Area',
        workDescription: workDescription.trim() || 'Daily equipment operation',
        breakdownHours: Number(breakdownHours || 0)
      });
      setFeedbackMsg(`Machinery log recorded for ${machineName}. Total: ${(Number(endReading) - Number(startReading)).toFixed(1)} hrs.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
      setIsModalOpen(false);
      setStartReading('');
      setEndReading('');
      setWorkDescription('');
      await loadData();
    } catch (err) {
      alert('Error recording log: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            <span>SiteOps Heavy Equipment & Fleet</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Heavy Machinery, Diesel & Equipment Running Log
          </h2>
          <p className="text-xs text-slate-400">
            Track daily operating hours, diesel fuel disbursements, breakdown downtime, and operator logs for JCB, cranes & mixers
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-sky-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Machinery Hours & Diesel</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Operating Hours</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {(machineryData.totalOperatingHours || 0).toFixed(1)} <span className="text-xs text-slate-400 font-normal">hrs</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Recorded machine run time</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Diesel Consumed</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">
            {machineryData.totalDieselLiters || 0} <span className="text-xs text-slate-400 font-normal">Liters</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Fuel disbursed to equipment</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Active Machines Logged</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black font-mono text-purple-400">
            {machineryData.activeMachinesCount || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Fleet units on site</p>
        </div>
      </div>

      {/* Machinery Logs Grid */}
      <div className="space-y-3">
        {(machineryData.logs || []).map((log) => (
          <div
            key={log.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl transition shadow-lg space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs text-sky-400 bg-sky-950 px-2.5 py-0.5 rounded-lg border border-sky-800">
                    {log.machineCode || log.machine_code}
                  </span>
                  <h3 className="font-black text-white text-sm">{log.machineName || log.machine_name}</h3>
                </div>
                <p className="text-xs text-slate-300 pt-1">{log.workDescription || log.work_description}</p>
              </div>

              <div className="flex items-center space-x-4 font-mono text-right">
                <div>
                  <div className="text-[10px] text-slate-500 font-sans font-bold">Hours Run</div>
                  <div className="text-sm font-black text-sky-400">{(log.totalHours || log.total_hours || 0).toFixed(1)} hrs</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-sans font-bold">Diesel</div>
                  <div className="text-sm font-black text-amber-400">{log.dieselIssuedLiters || log.diesel_issued_liters || 0} L</div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <span>Operator: <strong className="text-slate-200">{log.operatorName || log.operator_name}</strong></span>
              <span>Location: <strong className="text-slate-200">{log.workLocation || log.work_location}</strong></span>
              <span>Date: {log.logDate || log.log_date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-md space-y-4">
            <h3 className="font-black text-white text-base">Record Machinery & Fuel Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Equipment Type *</label>
                <select
                  value={machineName}
                  onChange={(e) => {
                    setMachineName(e.target.value);
                    if (e.target.value.includes('JCB')) setMachineCode('JCB-01');
                    else if (e.target.value.includes('Crane')) setMachineCode('TC-01');
                    else if (e.target.value.includes('Mixer')) setMachineCode('TM-04');
                    else setMachineCode('GEN-01');
                  }}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                >
                  <option value="JCB 3DX Heavy Excavator">JCB 3DX Heavy Excavator</option>
                  <option value="Potain Tower Crane (5 Ton)">Potain Tower Crane (5 Ton)</option>
                  <option value="Schwing Stetter Transit Mixer">Schwing Stetter Transit Mixer</option>
                  <option value="Kirloskar 125kVA Diesel Generator">Kirloskar 125kVA Diesel Generator</option>
                  <option value="Concrete Boom Placer Pump">Concrete Boom Placer Pump</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Start Reading (Hrs) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="1420.0"
                    value={startReading}
                    onChange={(e) => setStartReading(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">End Reading (Hrs) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="1428.5"
                    value={endReading}
                    onChange={(e) => setEndReading(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-amber-400">Diesel Issued (Liters)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="40"
                    value={dieselIssued}
                    onChange={(e) => setDieselIssued(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Operator Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunil Rathod"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Work Location</label>
                <input
                  type="text"
                  placeholder="e.g. Wing B1 Footing / 4th Floor Slab"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Work Description</label>
                <textarea
                  rows={2}
                  placeholder="Details of task performed by machine..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-sky-500/20"
                >
                  {isSubmitting ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
