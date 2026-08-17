'use client';

import React, { useState, useEffect } from 'react';
import { 
  HardHat, 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Search, 
  X,
  RefreshCw,
  Award
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const SafetyHSEWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form states
  const [topic, setTopic] = useState('Working at Heights & Safety Harness Protocol');
  const [conductedBy, setConductedBy] = useState('Safety Officer Suresh');
  const [attendeeCount, setAttendeeCount] = useState(45);
  const [notes, setNotes] = useState('Full body harness mandatory for 5th floor staging and outer scaffolding.');

  const fetchBriefings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/qa-safety/briefings');
      setBriefings(res?.briefings || []);
    } catch (e) {
      console.error(e);
      setBriefings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefings();
  }, []);

  const handleCreateBriefing = async (e) => {
    e.preventDefault();
    if (!topic || !attendeeCount) return;

    try {
      await apiClient.post('/qa-safety/briefings', {
        topic,
        conductedBy,
        attendeeCount: Number(attendeeCount),
        notes
      });
      setIsModalOpen(false);
      setStatusMessage('Morning Toolbox Talk & Safety Briefing recorded!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchBriefings();
    } catch (e) {
      console.error(e);
    }
  };

  const totalBriefings = briefings.length;
  const totalTrained = briefings.reduce((acc, b) => acc + Number(b.attendee_count || 0), 0);

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <HardHat className="w-4 h-4" />
            <span>Health, Safety & Environment (HSE)</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Daily Toolbox Talks & HSE Incident Register</h2>
          <p className="text-xs text-slate-400">
            Morning safety briefings, PPE compliance inspections, high-risk work permits, and zero-accident audits.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-teal-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Log Toolbox Talk</span>
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
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Safe Man-Hours Worked</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">124,800 hrs</div>
          <div className="text-[10px] text-slate-400 mt-1">Zero Lost Time Injury (LTI)</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-sky-400">Toolbox Briefings</div>
          <div className="text-3xl font-black text-white mt-1">{totalBriefings} Talks</div>
          <div className="text-[10px] text-slate-400 mt-1">100% Daily Morning Coverage</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-amber-400">Workers Briefed</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{totalTrained} Man-Days</div>
          <div className="text-[10px] text-slate-400 mt-1">PPE & Fall Protection Trained</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-purple-400">HSE Site Compliance</div>
          <div className="text-3xl font-black text-purple-400 mt-1">100%</div>
          <div className="text-[10px] text-slate-400 mt-1">Safety Helmets & Shoes Validated</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardHat className="w-4 h-4 text-teal-400" />
            <h3 className="font-extrabold text-white text-sm">Toolbox Talk & Safety Induction Register</h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">{briefings.length} Sessions</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading safety records...</div>
        ) : briefings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="font-bold text-sm">No safety briefings logged yet.</div>
            <div className="text-xs mt-1 text-slate-400">Click "Log Toolbox Talk" to register morning safety inductions.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Safety Topic Covered</th>
                  <th className="p-3.5">Conducted By</th>
                  <th className="p-3.5 text-center">Workers Attended</th>
                  <th className="p-3.5">Key Instructions & Action Items</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {briefings.map(b => (
                  <tr key={`brief-${b.id}`} className="hover:bg-slate-850/50 transition">
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(b.date_conducted || b.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-bold text-white">{b.topic}</td>
                    <td className="p-3.5 text-slate-300">{b.conducted_by || 'Safety Officer'}</td>
                    <td className="p-3.5 text-center font-black text-teal-400 text-sm">
                      {b.attendee_count} Workers
                    </td>
                    <td className="p-3.5 text-slate-400">{b.notes}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
                        COMPLIANT
                      </span>
                    </td>
                  </tr>
                ))}
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
                <Plus className="w-4 h-4 text-teal-400" />
                <span>Log Morning Safety Toolbox Talk</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBriefing} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Safety Topic</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Conducted By</label>
                  <input
                    type="text"
                    required
                    value={conductedBy}
                    onChange={(e) => setConductedBy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Workers Attended</label>
                  <input
                    type="number"
                    required
                    value={attendeeCount}
                    onChange={(e) => setAttendeeCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Key Instructions / PPE Checks</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Record Toolbox Talk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyHSEWorkspace;
