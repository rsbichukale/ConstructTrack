'use client';

import React from 'react';
import { Key, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getAppState } from '../../../lib/dbState';

export const HandoverReadinessSection = () => {
  const state = getAppState();

  const flatReadinessList = (state.flats || []).map(flat => {
    const flatTasks = (state.flatTasks || []).filter(t => t.flatId === flat.id);
    const total = flatTasks.length;
    const approved = flatTasks.filter(t => t.status === 'APPROVED').length;
    const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
    const isReady = pct === 100;

    return {
      flat,
      total,
      approved,
      pct,
      isReady,
    };
  });

  const readyFlats = flatReadinessList.filter(f => f.isReady);
  const nearReadyFlats = flatReadinessList.filter(f => f.pct >= 80 && !f.isReady);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <span>RERA Possession & Flat Customer Handover Readiness Matrix</span>
          </h3>
          <p className="text-xs text-slate-400">100% Approved flats ready for client key handover and possession certificate</p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold">
          <div className="bg-emerald-950/80 text-emerald-400 px-3.5 py-2 rounded-xl border border-emerald-800 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{readyFlats.length} / 70 Flats 100% Ready</span>
          </div>

          <div className="bg-amber-950/80 text-amber-400 px-3.5 py-2 rounded-xl border border-amber-800 flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>{nearReadyFlats.length} Flats Near Handover (80%+)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {flatReadinessList.map(({ flat, pct, isReady, approved, total }) => (
          <div
            key={flat.id}
            className={`p-3.5 rounded-2xl border text-center space-y-2 transition ${
              isReady
                ? 'bg-emerald-950/40 border-emerald-600/80 text-emerald-300 shadow-lg shadow-emerald-600/10'
                : pct >= 80
                ? 'bg-amber-950/30 border-amber-700/60 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span>Wing {flat.wing}</span>
              <span className="font-mono">{flat.flatType}</span>
            </div>

            <div className="text-base font-black text-white">Flat {flat.flatNumber}</div>

            <div className="space-y-1">
              <div className="text-xs font-extrabold font-mono text-sky-400">{pct}%</div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-500 block">{approved}/{total} Approved</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
