'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  FileText, 
  Calendar, 
  UserCheck, 
  Shield, 
  HardHat 
} from 'lucide-react';
import { fetchSafetyLogs, recordSafetyLog } from '../../lib/backendSync';

export const SafetyToolboxHub = () => {
  const [safetyData, setSafetyData] = useState({ logs: [], toolboxCount: 0, incidentsCount: 0, totalSafetyEvents: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logType, setLogType] = useState('TOOLBOX_TALK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('LOW');
  const [attendeesCount, setAttendeesCount] = useState('25');
  const [topic, setTopic] = useState('PPE & Fall Protection');
  const [actionTaken, setActionTaken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchSafetyLogs();
    setSafetyData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await recordSafetyLog({
        logType,
        title: title.trim(),
        description: description.trim(),
        severity,
        attendeesCount: Number(attendeesCount || 0),
        topic: topic.trim() || 'General HSE',
        actionTaken: actionTaken.trim() || 'Precautionary Measures Enforced'
      });
      setFeedbackMsg(`Safety ${logType === 'TOOLBOX_TALK' ? 'Toolbox Talk' : 'Incident'} logged successfully.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setActionTaken('');
      await loadData();
    } catch (err) {
      alert('Error recording safety log: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>SiteOps Health, Safety & Environment (HSE)</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Safety Incidents, PPE Compliance & Daily Toolbox Talks
          </h2>
          <p className="text-xs text-slate-400">
            Enforce mandatory morning safety briefings, log near-misses & hazard observations, and ensure Zero-Accident compliance
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-rose-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Safety Briefing / Incident</span>
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
            <span>Morning Toolbox Talks</span>
            <HardHat className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            {safetyData.toolboxCount || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Safety briefings conducted</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Near-Miss & Hazard Logs</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">
            {safetyData.incidentsCount || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Proactively mitigated hazards</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Lost Time Injury (LTI) Rate</span>
            <Shield className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            0.0 <span className="text-xs text-emerald-400 font-bold">(Zero Harm)</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">100% incident-free days</p>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {(safetyData.logs || []).map((log) => {
          const isToolbox = (log.log_type || log.logType) === 'TOOLBOX_TALK';

          return (
            <div
              key={log.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-3xl transition shadow-lg space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-md border ${
                      isToolbox
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}>
                      {isToolbox ? 'TOOLBOX BRIEFING' : `${log.severity || log.severity} SEVERITY INCIDENT`}
                    </span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      {log.topic}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm pt-1">{log.title}</h3>
                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">{log.description}</p>
                </div>

                {isToolbox && (
                  <div className="text-right font-mono">
                    <div className="text-xs text-slate-400">Attendees</div>
                    <div className="text-base font-black text-emerald-400">{log.attendeesCount || log.attendees_count || 0} Workers</div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span>Action Taken: <strong className="text-slate-200">{log.actionTaken || log.action_taken}</strong></span>
                <span>Reported by: <strong className="text-slate-200">{log.reportedBy || log.reported_by}</strong></span>
                <span>Date: {log.logDate || log.log_date}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-md space-y-4">
            <h3 className="font-black text-white text-base">Record Safety Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLogType('TOOLBOX_TALK')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    logType === 'TOOLBOX_TALK'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🟢 Toolbox Talk
                </button>

                <button
                  type="button"
                  onClick={() => setLogType('NEAR_MISS')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    logType !== 'TOOLBOX_TALK'
                      ? 'bg-rose-950 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🔴 Incident / Near-Miss
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Briefing / Incident Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Working at Heights Safety Harness Briefing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Topic / Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Scaffolding & Fall Protection"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Attendees Count</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="25"
                    value={attendeesCount}
                    onChange={(e) => setAttendeesCount(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Detailed Description & Points Covered *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Key safety instructions communicated to laborers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Action Taken / Resolution</label>
                <input
                  type="text"
                  placeholder="e.g. All 25 workers verified with ISI safety belts"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
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
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-rose-500/20"
                >
                  {isSubmitting ? 'Saving...' : 'Save Safety Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
