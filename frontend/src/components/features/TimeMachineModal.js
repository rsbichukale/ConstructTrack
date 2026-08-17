'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  History,
  User,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../lib/apiClient';

export const TimeMachineModal = ({ isOpen, onClose, entityType = 'FLAT_TASK', entityId, title = 'Audit History' }) => {
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (!isOpen || !entityType || !entityId) return;

    const fetchTimeline = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/audit/timeline/${entityType}/${entityId}`);
        if (res.success) {
          setTimeline(res.timeline || []);
          if (res.timeline && res.timeline.length > 0) {
            setSelectedLog(res.timeline[res.timeline.length - 1]);
          }
        }
      } catch (err) {
        console.warn('[TimeMachine] Failed to load timeline:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTimeline();
  }, [isOpen, entityType, entityId]);

  if (!isOpen) return null;

  const parseState = (stateObj) => {
    if (!stateObj) return null;
    if (typeof stateObj === 'object') return stateObj;
    try {
      return JSON.parse(stateObj);
    } catch {
      return stateObj;
    }
  };

  const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
      case 'INITIALIZE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'UPDATE':
      case 'PROGRESS_UPDATED':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'REWORK':
      case 'SNAG_FLAGGED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'RESOLVED':
      case 'CERTIFIED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-purple-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <span>Time-Machine Historical Audit Trail</span>
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full font-mono">
                  {entityType}: {entityId}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{title} • Chronological immutable ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Left: Chronological Event Timeline */}
          <div className="md:col-span-5 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Event Progression ({timeline.length})
            </span>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading timeline events...</div>
            ) : timeline.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                No audit events recorded yet for this entity.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {timeline.map((log, idx) => {
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <div
                      key={log.id || idx}
                      onClick={() => setSelectedLog(log)}
                      className={`relative p-3 rounded-2xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Timeline Dot */}
                      <span className={`absolute -left-6 top-4 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                        isSelected ? 'bg-purple-400 scale-125 ring-2 ring-purple-500/30' : 'bg-slate-600'
                      }`} />

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${getActionColor(log.action_type)}`}>
                            {log.action_type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-white font-medium line-clamp-2">{log.summary}</p>

                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-0.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{log.actor_name} ({log.actor_role})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: State Diff Inspection */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-4 bg-slate-900">
            {selectedLog ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold border ${getActionColor(selectedLog.action_type)}`}>
                      Action: {selectedLog.action_type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(selectedLog.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-white">{selectedLog.summary}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-slate-400 border-t border-slate-900 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">ACTOR:</span>
                      <span className="text-white font-bold">{selectedLog.actor_name} ({selectedLog.actor_role})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">IP / NODE:</span>
                      <span className="text-white font-bold">{selectedLog.ip_address || 'LAN_HOST'}</span>
                    </div>
                  </div>
                </div>

                {/* State Diff (Before vs After) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    State Mutation Inspection
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Previous State */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                      <span className="text-[11px] font-bold text-rose-400 flex items-center space-x-1">
                        <span>◀ Previous State</span>
                      </span>
                      <pre className="text-[10px] font-mono text-slate-400 bg-slate-900/90 p-2.5 rounded-xl overflow-x-auto max-h-48">
                        {JSON.stringify(parseState(selectedLog.previous_state), null, 2) || '(None / Initial Creation)'}
                      </pre>
                    </div>

                    {/* New State */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                        <span>▶ Mutated State</span>
                      </span>
                      <pre className="text-[10px] font-mono text-slate-300 bg-slate-900/90 p-2.5 rounded-xl overflow-x-auto max-h-48">
                        {JSON.stringify(parseState(selectedLog.new_state), null, 2) || '(State Updated)'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-500">
                Select an audit event from the timeline to inspect state diffs.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>Immutable Append-Only Audit Ledger</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
