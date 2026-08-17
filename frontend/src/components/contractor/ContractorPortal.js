'use client';

import React, { useState } from 'react';
import { Users, AlertTriangle, CheckCircle2, Filter, Camera, Send, Building, PhoneCall, Share2, Clock, CheckSquare, ShieldAlert } from 'lucide-react';
import { getAppState, updateFlatTaskProgress, saveAppState } from '../../lib/dbState';
import { syncContractorAttendanceToBackend } from '../../lib/backendSync';

export const ContractorPortal = ({ contractorId, canSwitchContractor = false }) => {
  const state = getAppState();
  const firstContractorId = state.contractors[0]?.id;
  const [selectedContractorId, setSelectedContractorId] = useState(contractorId || firstContractorId || 0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  
  const [masonsCount, setMasonsCount] = useState(6);
  const [helpersCount, setHelpersCount] = useState(4);
  const [musterSavedMessage, setMusterSavedMessage] = useState(null);

  const [signOffTaskId, setSignOffTaskId] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [signOffError, setSignOffError] = useState(null);
  const [signOffNotes, setSignOffNotes] = useState('');

  const [blockerTaskId, setBlockerTaskId] = useState(null);
  const [blockerText, setBlockerText] = useState('');

  const activeContractor = (state.contractors || []).find(c => c.id === selectedContractorId);

  const assignedTasks = (state.flatTasks || []).filter(
    t => t.assignedContractorId === selectedContractorId
  );

  const inProgressCount = assignedTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const pendingInspectionCount = assignedTasks.filter(t => t.status === 'INSPECTION_REQUESTED').length;
  const approvedCount = assignedTasks.filter(t => t.status === 'APPROVED').length;
  const blockedCount = assignedTasks.filter(t => t.status === 'REWORK').length;

  const filteredTasks = assignedTasks.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  const handleSaveMusterRoll = () => {
    const newAttendance = {
      id: Date.now(),
      contractorId: selectedContractorId,
      siteId: 1,
      dateLogged: new Date().toISOString().split('T')[0],
      isPresent: true,
      masonsCount,
      helpersCount,
    };

    saveAppState({
      ...state,
      attendance: [newAttendance, ...(state.attendance || [])],
    });

    syncContractorAttendanceToBackend(newAttendance);

    setMusterSavedMessage(`Daily Muster Roll saved: ${masonsCount} Masons + ${helpersCount} Helpers logged for today.`);
    setTimeout(() => setMusterSavedMessage(null), 3000);
  };

  const handleRequestSignOff = () => {
    if (!signOffTaskId) return;
    try {
      updateFlatTaskProgress(
        signOffTaskId,
        'INSPECTION_REQUESTED',
        100,
        signOffNotes || 'Contractor requested 100% inspection sign-off',
        photoUrl || undefined
      );
      setSignOffTaskId(null);
      setPhotoUrl('');
      setSignOffNotes('');
      setSignOffError(null);
    } catch (error) {
      setSignOffError(error instanceof Error ? error.message : 'Unable to submit this task for inspection.');
    }
  };

  const handleEvidenceUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(file.type) || file.size > 2 * 1024 * 1024) {
      setSignOffError('Upload a JPEG, PNG, or WebP image no larger than 2 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(String(reader.result || ''));
      setSignOffError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFlagBlocker = (taskId) => {
    if (!blockerText.trim()) return;
    const task = (state.flatTasks || []).find(t => t.id === taskId);
    if (!task) return;

    updateFlatTaskProgress(
      taskId,
      'REWORK',
      task.completionPct,
      `Contractor Blocker: ${blockerText}`,
      undefined,
      blockerText
    );

    setBlockerTaskId(null);
    setBlockerText('');
  };

  const handleShareContractorWhatsApp = () => {
    if (!activeContractor) return;

    let text = `*🏗️ CONSTRUCTTRACK - CONTRACTOR DAILY SUMMARY*\n`;
    text += `*Contractor:* ${activeContractor.companyName} (${activeContractor.tradeType})\n`;
    text += `*Date:* ${new Date().toLocaleDateString()}\n`;
    text += `-----------------------------------\n`;
    text += `*👷 Muster Roll:* ${masonsCount} Masons + ${helpersCount} Helpers Deployed\n`;
    text += `*📊 Tasks Overview:* ${assignedTasks.length} Total (${approvedCount} Approved, ${pendingInspectionCount} Pending Inspection, ${blockedCount} Blocked)\n\n`;

    if (pendingInspectionCount > 0) {
      text += `*📋 READY FOR SITE INSPECTION (${pendingInspectionCount}):*\n`;
      assignedTasks.filter(t => t.status === 'INSPECTION_REQUESTED').forEach(t => {
        const flat = (state.flats || []).find(f => f.id === t.flatId);
        const cat = (state.taskCatalog || []).find(c => c.id === t.taskCatalogId);
        text += `• Flat ${flat?.wing}-${flat?.flatNumber}: ${cat?.taskName}\n`;
      });
      text += `\n`;
    }

    if (blockedCount > 0) {
      text += `*🔴 WORK BLOCKERS FLAGGED (${blockedCount}):*\n`;
      assignedTasks.filter(t => t.status === 'REWORK').forEach(t => {
        const flat = (state.flats || []).find(f => f.id === t.flatId);
        const cat = (state.taskCatalog || []).find(c => c.id === t.taskCatalogId);
        text += `• Flat ${flat?.wing}-${flat?.flatNumber}: ${cat?.taskName} (${t.blockerReason || 'Blocked'})\n`;
      });
      text += `\n`;
    }

    text += `*Contact:* ${activeContractor.contactPerson} (${activeContractor.phone})`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <Building className="w-4 h-4" />
              <span>Select Trade Contractor</span>
            </div>

            {activeContractor?.phone && (
              <a
                href={`tel:${activeContractor.phone}`}
                className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold transition"
                title="Call Contractor"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call</span>
              </a>
            )}
          </div>

          <select
            value={selectedContractorId}
            onChange={(e) => setSelectedContractorId(parseInt(e.target.value, 10))}
            disabled={!canSwitchContractor}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs font-bold focus:outline-none focus:border-sky-500"
          >
            {(state.contractors || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName} ({c.tradeType})
              </option>
            ))}
          </select>
          {!canSwitchContractor && (
            <p className="text-[10px] text-slate-500">Contractor identity is assigned by your administrator.</p>
          )}

          {activeContractor && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{activeContractor.contactPerson}</span>
                <span className="text-[10px] font-extrabold bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded">
                  {activeContractor.tradeType}
                </span>
              </div>
              <div className="text-slate-400">Phone: {activeContractor.phone}</div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Agreed Rate:</span>
                <span className="text-emerald-400 font-mono font-bold">₹{activeContractor.ratePerUnit || 0} / sqft</span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Users className="w-4 h-4" />
              <span>Daily Labor Muster Roll Entry</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShareContractorWhatsApp}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp Summary</span>
              </button>
              <span className="text-xs text-slate-500">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {musterSavedMessage && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{musterSavedMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs text-slate-400 font-medium">Masons Count</label>
              <input
                type="number"
                min="0"
                value={masonsCount}
                onChange={(e) => setMasonsCount(parseInt(e.target.value, 10) || 0)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Helpers Count</label>
              <input
                type="number"
                min="0"
                value={helpersCount}
                onChange={(e) => setHelpersCount(parseInt(e.target.value, 10) || 0)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold text-sm"
              />
            </div>
            <button
              onClick={handleSaveMusterRoll}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center justify-center space-x-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Save Muster Roll Log</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-slate-400 text-[11px] font-semibold">Total Assigned</div>
          <div className="text-xl font-extrabold text-white mt-1 font-mono">{assignedTasks.length}</div>
        </div>
        <div className="bg-slate-900 border border-sky-800/60 p-3.5 rounded-2xl">
          <div className="text-sky-400 text-[11px] font-semibold flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>In Progress</span>
          </div>
          <div className="text-xl font-extrabold text-sky-400 mt-1 font-mono">{inProgressCount}</div>
        </div>
        <div className="bg-slate-900 border border-amber-800/60 p-3.5 rounded-2xl">
          <div className="text-amber-400 text-[11px] font-semibold flex items-center space-x-1">
            <CheckSquare className="w-3 h-3" />
            <span>Inspection Requested</span>
          </div>
          <div className="text-xl font-extrabold text-amber-400 mt-1 font-mono">{pendingInspectionCount}</div>
        </div>
        <div className="bg-slate-900 border border-emerald-800/60 p-3.5 rounded-2xl">
          <div className="text-emerald-400 text-[11px] font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved & Verified</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">{approvedCount}</div>
        </div>
        <div className="bg-slate-900 border border-rose-800/60 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
          <div className="text-rose-400 text-[11px] font-semibold flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Blocked Tasks</span>
          </div>
          <div className="text-xl font-extrabold text-rose-400 mt-1 font-mono">{blockedCount}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h3 className="font-extrabold text-white text-base">Contractor Priority Task Queue</h3>
          <p className="text-xs text-slate-400">Execution tasks for {activeContractor?.companyName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['ALL', 'IN_PROGRESS', 'INSPECTION_REQUESTED', 'APPROVED', 'REWORK'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  statusFilter === s ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'All Status' : s === 'INSPECTION_REQUESTED' ? 'Pending Sign-off' : s === 'REWORK' ? 'Blocked' : s}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1 text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  priorityFilter === p ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTasks.length === 0 ? (
          <div className="col-span-2 p-10 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
            No tasks match the selected filter criteria.
          </div>
        ) : (
          filteredTasks.slice(0, 16).map((task) => {
            const flat = (state.flats || []).find(f => f.id === task.flatId);
            const catalogItem = (state.taskCatalog || []).find(c => c.id === task.taskCatalogId);
            const isBlocking = blockerTaskId === task.id;

            const isPendingSignOff = task.status === 'INSPECTION_REQUESTED';
            const isApproved = task.status === 'APPROVED';
            const isBlocked = task.status === 'REWORK';

            return (
              <div
                key={task.id}
                className={`bg-slate-900 border p-4 rounded-xl space-y-3 transition ${
                  isBlocked
                    ? 'border-rose-800/80 bg-rose-950/20'
                    : isPendingSignOff
                    ? 'border-amber-800/80 bg-amber-950/20'
                    : isApproved
                    ? 'border-emerald-800/60'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-white text-sm">
                        Flat {flat?.wing}-{flat?.flatNumber} ({flat?.flatType})
                      </span>
                      <span className="text-xs text-slate-400">(Floor {flat?.floorNumber})</span>
                    </div>
                    <div className="text-xs text-sky-400 font-semibold mt-0.5">
                      {catalogItem?.taskName}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isBlocked
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : isPendingSignOff
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : isApproved
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : task.priority === 'HIGH'
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : 'bg-sky-950 text-sky-400 border-sky-800'
                    }`}>
                      {task.status === 'INSPECTION_REQUESTED' ? 'PENDING SIGN-OFF' : task.status}
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-300 mt-1">
                      {task.completionPct}% Complete
                    </div>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isApproved ? 'bg-emerald-500' : isPendingSignOff ? 'bg-amber-500' : isBlocked ? 'bg-rose-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${task.completionPct}%` }}
                  />
                </div>

                {isBlocked && task.blockerReason && (
                  <div className="p-2 bg-rose-950/80 border border-rose-800 rounded-lg text-xs text-rose-300 font-medium">
                    ⚠️ <span className="font-bold">Blocker Note:</span> {task.blockerReason}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  {isApproved ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified & Approved by Site Engineer</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSignOffError(null);
                        setPhotoUrl('');
                        setSignOffNotes('');
                        setSignOffTaskId(task.id);
                      }}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-bold transition border border-emerald-500/30 flex items-center space-x-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Request Sign-off (100%)</span>
                    </button>
                  )}

                  {!isApproved && (
                    <button
                      onClick={() => setBlockerTaskId(isBlocking ? null : task.id)}
                      className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Flag Delay Blocker</span>
                    </button>
                  )}
                </div>

                {isBlocking && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-rose-800/80 space-y-2 animate-in fade-in">
                    <label className="text-xs font-bold text-rose-400">Describe Delay Blocker Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Waiting on plumber piping or raw material delivery..."
                      value={blockerText}
                      onChange={(e) => setBlockerText(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setBlockerTaskId(null)}
                        className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleFlagBlocker(task.id)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
                      >
                        Notify Site Manager
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {signOffTaskId && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && (() => { setSignOffTaskId(null); setSignOffError(null); })()}>
          <div className="modal-panel max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <span>Submit Task for Site Engineer Verification</span>
              </h3>
              <button onClick={() => { setSignOffTaskId(null); setSignOffError(null); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {signOffError && (
              <div className="rounded-xl border border-rose-800 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">{signOffError}</div>
            )}

            <div>
              <label className="text-xs text-slate-400 font-medium">Completed Work Site Photo</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handleEvidenceUpload}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
              <p className="mt-1 text-[10px] text-slate-500">JPEG, PNG, or WebP; maximum 2 MB.</p>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Contractor Sign-off Remarks</label>
              <textarea
                rows={2}
                placeholder="e.g. Completed 100% brickwork as per IS 2212 code. Ready for site engineer inspection."
                value={signOffNotes}
                onChange={(e) => setSignOffNotes(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button onClick={() => { setSignOffTaskId(null); setSignOffError(null); }} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={handleRequestSignOff} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl font-extrabold shadow-lg shadow-emerald-600/20">
                Submit Sign-Off Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
