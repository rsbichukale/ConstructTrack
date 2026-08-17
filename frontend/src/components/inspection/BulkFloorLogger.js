'use client';

import React, { useState } from 'react';
import { Zap, X, CheckCircle2 } from 'lucide-react';
import { getAppState, updateFlatTaskProgress, getDynamicTrades } from '../../lib/dbState';

export const BulkFloorLogger = ({
  isOpen,
  onClose,
  wing,
  floorNumber,
}) => {
  const state = getAppState();
  const [selectedTrade, setSelectedTrade] = useState('BRICK WORK');
  const [targetStatus, setTargetStatus] = useState('APPROVED');
  const [targetPct, setTargetPct] = useState(100);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const floorFlats = (state.flats || []).filter(f => f.wing === wing && f.floorNumber === floorNumber);

  const handleApplyBulk = () => {
    floorFlats.forEach(flat => {
      const catalogItems = (state.taskCatalog || []).filter(c => c.tradeType === selectedTrade);
      const catalogIds = catalogItems.map(c => c.id);
      const tasksToUpdate = (state.flatTasks || []).filter(
        t => t.flatId === flat.id && catalogIds.includes(t.taskCatalogId)
      );

      tasksToUpdate.forEach(t => {
        updateFlatTaskProgress(t.id, targetStatus, targetPct, `Bulk floor EOD entry for Floor ${floorNumber}`);
      });
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1500);
  };

  const trades = getDynamicTrades(state);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-lg !p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Bulk EOD Floor Logger</h3>
              <p className="text-xs text-slate-400">Wing {wing} • Floor {floorNumber} ({floorFlats.length} Flats)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-white font-extrabold text-base">Bulk Progress Applied!</h4>
              <p className="text-xs text-slate-400">Updated {selectedTrade} tasks across all 5 flats on Floor {floorNumber}.</p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Trade</label>
                <div className="grid grid-cols-2 gap-2">
                  {trades.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTrade(t)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                        selectedTrade === t
                          ? 'bg-sky-600 text-white border-sky-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Target Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['IN_PROGRESS', 'INSPECTION_REQUESTED', 'APPROVED'].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setTargetStatus(s);
                        if (s === 'APPROVED') setTargetPct(100);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                        targetStatus === s
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleApplyBulk}
                className="w-full py-3 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition"
              >
                <Zap className="w-4 h-4" />
                <span>Apply to All 5 Flats ({floorFlats.map(f=>f.flatNumber).join(', ')})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
