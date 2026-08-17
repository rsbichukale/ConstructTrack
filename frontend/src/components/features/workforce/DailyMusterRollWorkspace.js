'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  UserCheck, 
  UserX, 
  ChevronRight,
  RefreshCw,
  HardHat,
  Search
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const DailyMusterRollWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [musterRows, setMusterRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const contractors = state.contractors || [];

  const fetchMusterData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/contractors/muster?date=${selectedDate}`);
      const logs = res?.logs || [];
      const logMap = {};
      logs.forEach(l => {
        logMap[l.contractor_id || l.contractorId] = l;
      });

      const rows = contractors.map(c => {
        const existing = logMap[c.id];
        return {
          contractorId: c.id,
          companyName: c.company_name || c.companyName,
          tradeType: c.trade_type || c.tradeType,
          supervisorName: c.supervisor_name || c.supervisorName,
          supervisorPhone: c.phone_number || c.phoneNumber,
          masons: existing ? Number(existing.masons_count || 0) : 0,
          helpers: existing ? Number(existing.helpers_count || 0) : 0,
          barBenders: existing ? Number(existing.bar_benders_count || 0) : 0,
          carpenters: existing ? Number(existing.carpenters_count || 0) : 0,
          mep: existing ? Number(existing.mep_count || 0) : 0,
          notes: existing ? existing.notes || '' : ''
        };
      });
      setMusterRows(rows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusterData();
  }, [selectedDate, contractors.length]);

  const updateCount = (contractorId, field, delta) => {
    setMusterRows(prev => prev.map(r => {
      if (r.contractorId === contractorId) {
        const nextVal = Math.max(0, (r[field] || 0) + delta);
        return { ...r, [field]: nextVal };
      }
      return r;
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const r of musterRows) {
        const total = r.masons + r.helpers + r.barBenders + r.carpenters + r.mep;
        if (total > 0) {
          await apiClient.post('/contractors/muster', {
            contractorId: r.contractorId,
            dateLogged: selectedDate,
            masonsCount: r.masons,
            helpersCount: r.helpers,
            barBendersCount: r.barBenders,
            carpentersCount: r.carpenters,
            mepCount: r.mep,
            notes: r.notes
          });
        }
      }
      setStatusMessage(`✅ Muster roll for ${selectedDate} saved to PostgreSQL successfully!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const filteredRows = musterRows.filter(r => 
    r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.tradeType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMasons = musterRows.reduce((acc, r) => acc + r.masons, 0);
  const totalHelpers = musterRows.reduce((acc, r) => acc + r.helpers, 0);
  const totalSpecialists = musterRows.reduce((acc, r) => acc + r.barBenders + r.carpenters + r.mep, 0);
  const totalSiteHeadcount = totalMasons + totalHelpers + totalSpecialists;
  const activeGangsCount = musterRows.filter(r => (r.masons + r.helpers + r.barBenders + r.carpenters + r.mep) > 0).length;

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header & KPI Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Multi-Skill Manpower Operations</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Daily Labor Muster Roll Matrix</h2>
          <p className="text-xs text-slate-400">
            Log contractor attendance by skill classification (Masons, Helpers, Bar-Benders, Carpenters, MEP).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-sky-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none"
            />
          </div>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-sky-500/20 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Muster Roll'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Site Headcount</div>
          <div className="text-3xl font-black text-white mt-1">{totalSiteHeadcount}</div>
          <div className="text-[10px] text-sky-400 font-bold mt-1">{activeGangsCount} / {contractors.length} Gangs Present</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-amber-400">Skilled Masons</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{totalMasons}</div>
          <div className="text-[10px] text-slate-400 mt-1">Brickwork & Plastering</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-emerald-400">General Helpers</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">{totalHelpers}</div>
          <div className="text-[10px] text-slate-400 mt-1">Material Shifting & Mixing</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-purple-400">Specialist Craftsmen</div>
          <div className="text-3xl font-black text-purple-400 mt-1">{totalSpecialists}</div>
          <div className="text-[10px] text-slate-400 mt-1">Rebar, Shuttering, MEP</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <HardHat className="w-4 h-4 text-sky-400" />
            <h3 className="font-extrabold text-white text-sm">Contractor Roster Muster Sheet</h3>
          </div>
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search trade or contractor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading muster records from database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Contractor / Trade</th>
                  <th className="p-3.5 text-center">Masons</th>
                  <th className="p-3.5 text-center">Helpers</th>
                  <th className="p-3.5 text-center">Bar-Benders</th>
                  <th className="p-3.5 text-center">Carpenters</th>
                  <th className="p-3.5 text-center">MEP / Plumbers</th>
                  <th className="p-3.5 text-center">Total Strength</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRows.map((r) => {
                  const gangTotal = r.masons + r.helpers + r.barBenders + r.carpenters + r.mep;
                  const isPresent = gangTotal > 0;

                  return (
                    <tr key={`muster-row-${r.contractorId}`} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5">
                        <div className="font-extrabold text-white">{r.companyName}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1.5 mt-0.5">
                          <span className="text-sky-400 font-bold uppercase">{r.tradeType}</span>
                          <span>•</span>
                          <span>{r.supervisorName} ({r.supervisorPhone})</span>
                        </div>
                      </td>

                      {/* Skill Counters */}
                      {['masons', 'helpers', 'barBenders', 'carpenters', 'mep'].map((skill) => (
                        <td key={skill} className="p-3.5 text-center">
                          <div className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                            <button
                              onClick={() => updateCount(r.contractorId, skill, -1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-black text-white text-xs">{r[skill]}</span>
                            <button
                              onClick={() => updateCount(r.contractorId, skill, 1)}
                              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-slate-800 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      ))}

                      <td className="p-3.5 text-center font-black text-sm">
                        <span className={isPresent ? 'text-emerald-400' : 'text-slate-600'}>{gangTotal}</span>
                      </td>

                      <td className="p-3.5">
                        {isPresent ? (
                          <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
                            PRESENT ({gangTotal})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-500 rounded-full font-bold text-[10px]">
                            ABSENT
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
    </div>
  );
};

export default DailyMusterRollWorkspace;
