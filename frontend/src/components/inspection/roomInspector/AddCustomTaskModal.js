'use client';

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { getAppState, getDynamicTrades, addCustomRoomTaskToAllFlats } from '../../../lib/dbState';

export const AddCustomTaskModal = ({
  roomZone,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const state = getAppState();
  const [customTaskName, setCustomTaskName] = useState('');
  const [customTradeType, setCustomTradeType] = useState('PLUMBER');
  const [autoApprovePreviousFlats, setAutoApprovePreviousFlats] = useState(true);

  if (!isOpen) return null;

  const handleCreateCustomTask = (e) => {
    e.preventDefault();
    if (!customTaskName.trim()) return;

    addCustomRoomTaskToAllFlats(roomZone.id, customTaskName.trim(), customTradeType, autoApprovePreviousFlats);

    onSuccess(`Added "${customTaskName.trim()}" to ${roomZone.zoneLabel}! Auto-marked approved for completed flats.`);
    onClose();
    setCustomTaskName('');
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-lg !p-0 overflow-hidden space-y-0">
        <div className="p-5 bg-gradient-to-r from-emerald-950/80 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-white text-base">Add Extra Task to {roomZone.zoneLabel}</h3>
              <p className="text-xs text-slate-400">Cascades new micro-task across all 70 flats</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateCustomTask} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Micro-Task Name & Details
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AC Copper Piping Conduit Sleeve, Granite Niche Pocket..."
              value={customTaskName}
              onChange={(e) => setCustomTaskName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Responsible Trade
            </label>
            <select
              value={customTradeType}
              onChange={(e) => setCustomTradeType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
            >
              {getDynamicTrades(state).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950 border border-emerald-800/60 p-3.5 rounded-2xl space-y-2">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprovePreviousFlats}
                onChange={(e) => setAutoApprovePreviousFlats(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-black text-emerald-400 block">
                  Auto-Mark APPROVED (100%) for previously completed flats
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  For flats where {roomZone.zoneLabel} was already 100% approved (e.g. Flats 101, 102, 103), this new task will be automatically marked as Approved. For uninspected flats, it will remain Pending (0%).
                </p>
              </div>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Add Task to All 70 Flats</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
