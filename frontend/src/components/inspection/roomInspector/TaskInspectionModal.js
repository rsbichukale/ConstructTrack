'use client';

import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Camera,
  Send,
  X,
  User,
  PhoneCall,
  Loader2,
} from 'lucide-react';
import { getAppState } from '../../../lib/dbState';
import { VoiceDictationButton } from '../../common/VoiceDictationButton';
import { processAndWatermarkPhoto } from '../../../lib/cameraHelper';
import { triggerHaptic } from '../../../lib/haptics';

export const TaskInspectionModal = ({
  isOpen,
  flat,
  roomZone,
  activeTask,
  activeCatalogItem,
  status,
  completionPct,
  laborCount,
  assignedContractorId,
  notes,
  photoUrl,
  blockerReason,
  fileInputRef,
  onClose,
  onStatusChange,
  onCompletionPctChange,
  onLaborCountChange,
  onAssignedContractorIdChange,
  onNotesChange,
  onPhotoUrlChange,
  onBlockerReasonChange,
  onFileUpload,
  onSaveReport,
}) => {
  const state = getAppState();
  const [isWatermarking, setIsWatermarking] = useState(false);
  const internalCameraInputRef = useRef(null);

  if (!isOpen || !activeTask || !activeCatalogItem) return null;

  const matchingContractors = (state.contractors || []).filter(
    c => (c.tradeType === activeCatalogItem.tradeType || (c.tradeTypes || []).includes(activeCatalogItem.tradeType)) &&
         (c.wingScope === flat.wing || c.wingScope === 'ALL' || !c.wingScope) &&
         c.status !== 'SUSPENDED'
  );

  const selectedContractorObj = (state.contractors || []).find(c => c.id === assignedContractorId) || matchingContractors[0];

  // Camera capture with automatic site watermark
  const handleCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsWatermarking(true);
    triggerHaptic('light');

    try {
      const watermarkedDataUrl = await processAndWatermarkPhoto(file, {
        siteName: state.site?.name || 'Apex Horizon High-Rise',
        wing: flat.wing,
        flatNumber: flat.flatNumber,
        roomZoneLabel: roomZone.zoneLabel,
        taskName: activeCatalogItem.taskName,
      });

      onPhotoUrlChange(watermarkedDataUrl);
      triggerHaptic('success');
    } catch (err) {
      console.error('[Watermark Error]:', err);
      if (onFileUpload) onFileUpload(e);
    } finally {
      setIsWatermarking(false);
    }
  };

  const handleSave = () => {
    triggerHaptic(status === 'COMPLETED' ? 'success' : 'medium');
    onSaveReport();
  };

  return (
    <div className="modal-overlay !items-end sm:!items-center !p-0 sm:!p-4 overflow-hidden" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Modal / Bottom Sheet Container */}
      <div className="bg-slate-900 border-t sm:border border-slate-700 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up sm:animate-none">
        {/* Mobile Swipe / Drag Handle Indicator */}
        <div className="sm:hidden w-full flex items-center justify-center pt-2 pb-1 bg-slate-950">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-md uppercase">
              {activeCatalogItem.tradeType}
            </span>
            <h3 className="text-base sm:text-lg font-black text-white mt-1">
              {activeCatalogItem.taskName}
            </h3>
            <p className="text-xs text-slate-400">
              Flat {flat.wing}-{flat.flatNumber} • {roomZone.zoneLabel}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 min-h-0">
          {/* Contractor Assignment Card */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold text-white">Trade Contractor</span>
              </div>
              {selectedContractorObj && selectedContractorObj.phone && (
                <a
                  href={`tel:${selectedContractorObj.phone}`}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center space-x-1 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {selectedContractorObj.contactPerson || 'Contractor'}</span>
                </a>
              )}
            </div>

            <select
              value={assignedContractorId || ''}
              onChange={(e) => onAssignedContractorIdChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Select Trade Contractor --</option>
              {(state.contractors || []).map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.tradeType}) • ₹{c.ratePerUnit}/unit
                </option>
              ))}
            </select>
          </div>

          {/* Quick Thumb Progress Percentage Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Work Progress Completion</span>
              <span className="text-amber-400 font-mono font-black text-sm">{completionPct}%</span>
            </label>

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={completionPct}
              onChange={(e) => onCompletionPctChange(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            {/* Thumb-Zone Quick Presets */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { pct: 0, label: '0%' },
                { pct: 25, label: '25%' },
                { pct: 50, label: '50%' },
                { pct: 75, label: '75%' },
                { pct: 100, label: '100% ✓' },
              ].map(item => (
                <button
                  key={item.pct}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onCompletionPctChange(item.pct);
                    if (item.pct === 100) onStatusChange('COMPLETED');
                    else if (item.pct > 0) onStatusChange('IN_PROGRESS');
                    else onStatusChange('NOT_STARTED');
                  }}
                  className={`py-2 text-xs font-mono font-extrabold rounded-xl border transition-all ${
                    completionPct === item.pct
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">Task Status</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onStatusChange('NOT_STARTED');
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  status === 'NOT_STARTED'
                    ? 'bg-slate-800 border-slate-600 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Not Started</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onStatusChange('IN_PROGRESS');
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  status === 'IN_PROGRESS'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>In Progress</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('success');
                  onStatusChange('COMPLETED');
                  onCompletionPctChange(100);
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  status === 'COMPLETED'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Completed</span>
              </button>
            </div>
          </div>

          {/* Site Camera & Watermarked Photo Capture */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Field Inspection Photo (Auto-Watermarked)</span>
              </div>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => onPhotoUrlChange('')}
                  className="text-[11px] text-rose-400 hover:underline font-bold"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {/* Hidden Direct Rear Camera Input */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={internalCameraInputRef}
              onChange={handleCameraCapture}
              className="hidden"
            />

            {photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 group">
                <img src={photoUrl} alt="Inspection Proof" className="w-full h-44 object-cover" />
                <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-1 rounded-lg text-[10px] font-mono text-amber-400 border border-slate-800">
                  Watermark Attached ✓
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isWatermarking}
                onClick={() => internalCameraInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-2xl flex flex-col items-center justify-center space-y-2 text-slate-400 hover:text-white transition group bg-slate-900/40"
              >
                {isWatermarking ? (
                  <>
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    <span className="text-xs font-bold text-amber-400">Embedding Site & Date Watermark...</span>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-slate-800 rounded-full group-hover:bg-amber-500/20 group-hover:text-amber-400 transition">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold">Tap to Open Field Camera</span>
                    <span className="text-[10px] text-slate-500">Auto-stamps date, time, flat # & room zone</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Remarks & Voice Dictation Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Inspector Notes / Blocker Remarks</label>
              <span className="text-[10px] text-slate-500">Tap mic to speak notes</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={notes || blockerReason || ''}
                onChange={(e) => {
                  onNotesChange(e.target.value);
                  onBlockerReasonChange(e.target.value);
                }}
                placeholder="e.g. Line dori checked, 100% true to plumb..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />

              {/* Voice Dictation Button */}
              <VoiceDictationButton
                onTranscript={(transcript) => {
                  const existing = notes || blockerReason || '';
                  const updated = existing ? `${existing} ${transcript}` : transcript;
                  onNotesChange(updated);
                  onBlockerReasonChange(updated);
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Thumb Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 pb-safe shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-2xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-2 w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition"
          >
            <Send className="w-4 h-4" />
            <span>Save Inspection Entry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
