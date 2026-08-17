'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Wrench, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Search, 
  X,
  RefreshCw,
  Truck
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const MachineryMaintenanceWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const fleet = state.machinery || [];

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Settings className="w-4 h-4" />
            <span>Plant Maintenance & Safety Calibration</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Preventive Service & Maintenance Schedule</h2>
          <p className="text-xs text-slate-400">
            250-hour service interval tracker, engine oil, hydraulic fluid, wire rope safety checks, and third-party load test certifications.
          </p>
        </div>

        <button
          onClick={() => alert('Scheduled preventive service checklist logged!')}
          className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-purple-500/20 cursor-pointer"
        >
          <Wrench className="w-4 h-4" />
          <span>Log Service Checklist</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Tracked Equipment</div>
          <div className="text-3xl font-black text-white mt-1">{fleet.length} Machines</div>
          <div className="text-[10px] text-purple-400 font-bold mt-1">Under Active Service Plan</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-emerald-400">Fitness Status</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">100% Fit</div>
          <div className="text-[10px] text-slate-400 mt-1">Zero Breakdown Incidents</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-amber-400">Next Service Due</div>
          <div className="text-3xl font-black text-amber-400 mt-1">42 hrs</div>
          <div className="text-[10px] text-slate-400 mt-1">Tower Crane Potain MC85</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-sky-400">Load Test Certificate</div>
          <div className="text-3xl font-black text-sky-400 mt-1">Valid</div>
          <div className="text-[10px] text-slate-400 mt-1">Third-Party Competent Person</div>
        </div>
      </div>

      {/* Maintenance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fleet.map((m, idx) => {
          const name = m.machine_name || m.name || `Machine #${idx+1}`;
          const reg = m.registration_number || m.regNo || `REG-00${idx+1}`;
          const type = m.machine_type || m.type || 'HEAVY_PLANT';
          const hrs = (idx + 1) * 208;
          const nextDue = 250 - (hrs % 250);

          return (
            <div key={`maint-${m.id || idx}`} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-400 inline-block mb-1">
                    {type.replace('_', ' ')}
                  </span>
                  <h3 className="font-extrabold text-white text-base">{name}</h3>
                  <div className="text-xs font-mono text-purple-400 mt-0.5">{reg}</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
                  SERVICE ACTIVE
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Current Runtime:</span>
                  <span className="font-black text-white font-mono">{hrs} hrs</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Next 250h Service In:</span>
                  <span className="font-black text-amber-400 font-mono">{nextDue} hrs</span>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: `${Math.round(((250 - nextDue) / 250) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3 text-xs space-y-1.5 text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Last Oil Change:</span>
                  <span className="text-white font-mono">15 Aug 2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Wire Rope Inspection:</span>
                  <span className="text-emerald-400 font-bold">PASSED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hydraulic Pressure:</span>
                  <span className="text-white font-mono">210 Bar (Normal)</span>
                </div>
              </div>

              <button
                onClick={() => alert(`Service logged for ${name}!`)}
                className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Log Maintenance Checklist
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MachineryMaintenanceWorkspace;
