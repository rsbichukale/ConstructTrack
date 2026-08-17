'use client';

import React, { useState } from 'react';
import { Calendar, Users, CheckCircle2, Share2, Sun, Moon, Plus, ShieldCheck, Target, FileText } from 'lucide-react';
import { getAppState, saveAppState, getDynamicTrades, addDailyWorkTarget, verifyDailyWorkTarget, saveDepartmentLaborAttendance } from '../../lib/dbState';
import { syncContractorAttendanceToBackend } from '../../lib/backendSync';
import { DailyOperationalHub } from '../reports/DailyOperationalHub';

export const DailyReportHub = () => {
  const state = getAppState();
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const availableWings = (state.wings && state.wings.length > 0)
    ? state.wings.map(w => w.wing_code || w.wingCode || w.name || w)
    : Array.from(new Set((state.flats || []).map(f => f.wing))).filter(Boolean);
  const wingsList = availableWings.length > 0 ? availableWings : ['B1'];

  const [activeSubTab, setActiveSubTab] = useState('dossier');

  const [targetContractorId, setTargetContractorId] = useState(1);
  const [targetWing, setTargetWing] = useState(wingsList[0] || 'B1');

  const targetFloorsList = Array.from(new Set((state.flats || []).filter(f => f.wing === targetWing).map(f => f.floorNumber))).sort((a, b) => a - b);
  const floorsList = targetFloorsList.length > 0 ? targetFloorsList : [1];

  const [targetFloor, setTargetFloor] = useState(floorsList[0] || 1);
  const [targetTrade, setTargetTrade] = useState('BRICK WORK');
  const [targetDescription, setTargetDescription] = useState('');
  const [targetSqft, setTargetSqft] = useState(1000);
  const [plannedLabor, setPlannedLabor] = useState(6);
  const [targetMessage, setTargetMessage] = useState(null);

  const [verifyingTargetId, setVerifyingTargetId] = useState(null);
  const [auditStatus, setAuditStatus] = useState('ACHIEVED');
  const [auditPct, setAuditPct] = useState(100);
  const [auditLabor, setAuditLabor] = useState(6);
  const [auditDelayReason, setAuditDelayReason] = useState('');

  const [selectedContractorId, setSelectedContractorId] = useState(1);
  const [contractorIsPresent, setContractorIsPresent] = useState(true);
  const [masonsCount, setMasonsCount] = useState(6);
  const [helpersCount, setHelpersCount] = useState(4);
  const [absenceReason, setAbsenceReason] = useState('Festival / Holiday');
  const [contractorWorkAssigned, setContractorWorkAssigned] = useState('');
  const [attendanceMessage, setAttendanceMessage] = useState(null);

  const [selectedDeptLaborerId, setSelectedDeptLaborerId] = useState(8);
  const [deptLaborStatus, setDeptLaborStatus] = useState('PRESENT');
  const [deptWorkDescription, setDeptWorkDescription] = useState('');
  const [deptNarration, setDeptNarration] = useState('');

  const trades = getDynamicTrades(state);

  const selectedTargets = (state.dailyWorkTargets || []).filter(t => t.dateAssigned === selectedDate);
  const selectedLogs = (state.logs || []).filter(log => log.dateLogged && log.dateLogged.startsWith(selectedDate));
  const selectedAttendance = (state.attendance || []).filter(att => att.dateLogged === selectedDate);

  const handleCreateTarget = (e) => {
    e.preventDefault();
    if (!targetDescription.trim()) return;

    addDailyWorkTarget({
      dateAssigned: selectedDate,
      contractorId: targetContractorId,
      wing: targetWing,
      floorNumber: targetFloor,
      tradeType: targetTrade,
      targetDescription,
      targetQuantitySqft: targetSqft,
      plannedLaborCount: plannedLabor,
    });

    setTargetDescription('');
    setTargetMessage('Daily work target assigned successfully!');
    setTimeout(() => setTargetMessage(null), 3000);
  };

  const handleOpenAuditModal = (t) => {
    setVerifyingTargetId(t.id);
    setAuditStatus(t.status === 'ASSIGNED' ? 'ACHIEVED' : t.status);
    setAuditPct(t.actualCompletionPct || 100);
    setAuditLabor(t.actualLaborCount || t.plannedLaborCount);
    setAuditDelayReason(t.delayReason || '');
  };

  const handleSaveAudit = () => {
    if (!verifyingTargetId) return;

    verifyDailyWorkTarget(
      verifyingTargetId,
      auditStatus,
      auditPct,
      auditLabor,
      auditDelayReason,
      'Site Engineer'
    );

    setVerifyingTargetId(null);
    setTargetMessage('End-of-Day audit sign-off saved successfully!');
    setTimeout(() => setTargetMessage(null), 3000);
  };

  const handleSaveAttendance = () => {
    const attendanceList = state.attendance || [];
    const existingIndex = attendanceList.findIndex(
      a => a.contractorId === selectedContractorId && a.dateLogged === selectedDate
    );

    const newEntry = {
      id: existingIndex > -1 ? attendanceList[existingIndex].id : Date.now(),
      contractorId: selectedContractorId,
      siteId: 1,
      dateLogged: selectedDate,
      isPresent: contractorIsPresent,
      masonsCount: contractorIsPresent ? masonsCount : 0,
      helpersCount: contractorIsPresent ? helpersCount : 0,
      absenceReason: !contractorIsPresent ? absenceReason : undefined,
      workAssigned: contractorIsPresent ? contractorWorkAssigned : undefined,
    };

    let updatedAttendance = [...attendanceList];
    if (existingIndex > -1) {
      updatedAttendance[existingIndex] = newEntry;
    } else {
      updatedAttendance = [newEntry, ...updatedAttendance];
    }

    saveAppState({
      ...state,
      attendance: updatedAttendance,
    });

    syncContractorAttendanceToBackend(newEntry);
    setTargetMessage(`Contractor attendance & labor count saved!`);
    setTimeout(() => setTargetMessage(null), 3000);
  };

  const handleUpdateInlineContractorLabor = (contractorId, masons, helpers) => {
    const attendanceList = state.attendance || [];
    const existingIndex = attendanceList.findIndex(a => a.contractorId === contractorId && a.dateLogged === selectedDate);
    let updatedAttendanceList;

    const newAtt = {
      id: existingIndex >= 0 ? attendanceList[existingIndex].id : Date.now(),
      contractorId,
      siteId: 1,
      dateLogged: selectedDate,
      isPresent: masons > 0 || helpers > 0,
      masonsCount: masons,
      helpersCount: helpers,
      absenceReason: (masons === 0 && helpers === 0) ? 'Absent' : undefined,
    };

    if (existingIndex >= 0) {
      updatedAttendanceList = attendanceList.map((a, idx) => idx === existingIndex ? newAtt : a);
    } else {
      updatedAttendanceList = [...attendanceList, newAtt];
    }

    saveAppState({
      ...state,
      attendance: updatedAttendanceList,
    });

    syncContractorAttendanceToBackend(newAtt);
    setTargetMessage(`Updated labor headcount for contractor!`);
    setTimeout(() => setTargetMessage(null), 2500);
  };

  const handleSaveDepartmentAttendance = () => {
    saveDepartmentLaborAttendance(
      selectedDeptLaborerId,
      selectedDate,
      deptLaborStatus,
      deptWorkDescription,
      deptNarration
    );

    setAttendanceMessage('Department helper attendance saved!');
    setTimeout(() => setAttendanceMessage(null), 3000);
  };

  const generateWhatsAppReport = () => {
    const achievedCount = selectedTargets.filter(t => t.status === 'ACHIEVED').length;
    const presentAttendance = selectedAttendance.filter(a => a.isPresent !== false);
    
    const totalMasons = presentAttendance.reduce((sum, a) => sum + (a.masonsCount || 0), 0);
    const totalHelpers = presentAttendance.reduce((sum, a) => sum + (a.helpersCount || 0), 0);

    const deptAttendanceForDate = (state.departmentAttendance || []).filter(a => a.dateLogged === selectedDate);
    const presentDeptCount = deptAttendanceForDate.filter(a => a.status !== 'ABSENT').length;

    let text = `*🏗️ CONSTRUCTTRACK - END-OF-DAY DAILY REPORT*\n`;
    text += `*Date:* ${selectedDate}\n`;
    text += `-------------------------------\n`;
    text += `*👷 Total Manpower Deployed:* ${totalMasons + totalHelpers + presentDeptCount} Workers\n`;
    text += `   • Contractor Labor: ${totalMasons + totalHelpers} (${totalMasons} Masons, ${totalHelpers} Helpers)\n`;
    text += `   • Department Helpers: ${presentDeptCount} Present\n`;
    text += `*🎯 Daily Targets Achieved:* ${achievedCount}/${selectedTargets.length}\n\n`;

    if (deptAttendanceForDate.length > 0) {
      text += `*🛠️ IN-HOUSE DEPARTMENT HELPERS ATTENDANCE:*\n`;
      deptAttendanceForDate.forEach(da => {
        const worker = (state.laborers || []).find(l => l.id === da.laborerId);
        text += `• *${worker?.name || 'Helper'}* (${da.status})`;
        if (da.workDescription) text += ` — Work: ${da.workDescription}`;
        text += `\n`;
      });
      text += `\n`;
    }

    text += `*👥 CONTRACTOR ATTENDANCE & ABSENCE BREAKDOWN:*\n`;
    (state.contractors || []).forEach(c => {
      const att = selectedAttendance.find(a => a.contractorId === c.id);
      if (att && att.isPresent === false) {
        text += `🔴 *${c.companyName}* (${c.tradeType}): ABSENT — Reason: ${att.absenceReason || 'Not Reported'}\n`;
      } else if (att) {
        text += `🟢 *${c.companyName}* (${c.tradeType}): ${att.masonsCount + att.helpersCount} Present (${att.masonsCount} Masons, ${att.helpersCount} Helpers)\n`;
      } else {
        text += `⚪ *${c.companyName}* (${c.tradeType}): Attendance Not Logged\n`;
      }
    });

    text += `\n*Signed off by Site Engineer*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Daily Reporting & End-of-Day Audit Hub</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Daily Work Target Assignment & Audit</h2>
          <p className="text-xs text-slate-400">Assign daily work targets in the morning and perform end-of-day audit sign-offs</p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl p-2.5 shadow focus:outline-none focus:border-sky-500"
          />

          <button
            onClick={generateWhatsAppReport}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Share WhatsApp Report</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs flex-wrap gap-1">
        <button
          onClick={() => setActiveSubTab('dossier')}
          className={`flex-1 min-w-[200px] py-2.5 rounded-xl font-extrabold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'dossier'
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📋 Daily Operational Reports Suite</span>
        </button>

        <button
          onClick={() => setActiveSubTab('targets')}
          className={`flex-1 min-w-[200px] py-2.5 rounded-xl font-extrabold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'targets'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>🎯 Targets & Audit ({selectedTargets.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex-1 min-w-[200px] py-2.5 rounded-xl font-extrabold transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👷 Labor Muster Roll ({selectedAttendance.length})</span>
        </button>
      </div>

      {activeSubTab === 'dossier' && <DailyOperationalHub />}

      {activeSubTab === 'targets' && (
        <div className="space-y-6">
          {targetMessage && (
            <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{targetMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateTarget} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Assign Morning Daily Work Target</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">Select Contractor</label>
                <select
                  value={targetContractorId}
                  onChange={(e) => setTargetContractorId(parseInt(e.target.value, 10))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                >
                  {(state.contractors || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.tradeType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Wing & Floor</label>
                <div className="flex space-x-2 mt-1">
                  <select
                    value={targetWing}
                    onChange={(e) => {
                      const newW = e.target.value;
                      setTargetWing(newW);
                      const nextF = Array.from(new Set((state.flats || []).filter(f => f.wing === newW).map(f => f.floorNumber))).sort((a, b) => a - b);
                      if (nextF.length > 0 && !nextF.includes(targetFloor)) {
                        setTargetFloor(nextF[0]);
                      }
                    }}
                    className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    {wingsList.map(w => (
                      <option key={w} value={w}>Wing {w}</option>
                    ))}
                  </select>
                  <select
                    value={targetFloor}
                    onChange={(e) => setTargetFloor(parseInt(e.target.value, 10))}
                    className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    {floorsList.map(f => (
                      <option key={f} value={f}>Floor {f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Trade Category</label>
                <select
                  value={targetTrade}
                  onChange={(e) => setTargetTrade(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                >
                  {trades.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Committed Labor (Masons+Helpers)</label>
                <input
                  type="number"
                  value={plannedLabor}
                  onChange={(e) => setPlannedLabor(parseInt(e.target.value, 10) || 0)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Daily Work Target Description</label>
              <input
                required
                type="text"
                placeholder="e.g. Complete Brickwork across Flat 101, 102 & 103 before 6:00 PM"
                value={targetDescription}
                onChange={(e) => setTargetDescription(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-sky-600/20 flex items-center space-x-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Daily Target</span>
              </button>
            </div>
          </form>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>End-of-Day Verification Audit Checklist ({selectedDate})</span>
                </h3>
                <p className="text-xs text-slate-400">Audit each contractor's daily work target at the end of today's work shift</p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <span className="bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-800">
                  {selectedTargets.filter(t => t.status === 'ACHIEVED').length} Achieved
                </span>
                <span className="bg-rose-950 text-rose-400 px-2.5 py-1 rounded-lg border border-rose-800">
                  {selectedTargets.filter(t => t.status === 'MISSED' || t.status === 'PARTIAL').length} Pending/Missed
                </span>
              </div>
            </div>

            {selectedTargets.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No work targets assigned for {selectedDate}. Use the form above to assign morning work targets.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTargets.map((t) => {
                  const contractor = (state.contractors || []).find(c => c.id === t.contractorId);
                  const isAchieved = t.status === 'ACHIEVED';
                  const isPartial = t.status === 'PARTIAL';
                  const isMissed = t.status === 'MISSED';

                  let statusBadge = 'bg-slate-800 text-slate-400 border-slate-700';
                  let statusText = 'Assigned (Pending Audit)';

                  if (isAchieved) {
                    statusBadge = 'bg-emerald-950 text-emerald-400 border-emerald-800';
                    statusText = '🟢 Target Achieved (100%)';
                  } else if (isPartial) {
                    statusBadge = 'bg-amber-950 text-amber-400 border-amber-800';
                    statusText = `🟡 Partial (${t.actualCompletionPct}%)`;
                  } else if (isMissed) {
                    statusBadge = 'bg-rose-950 text-rose-400 border-rose-800';
                    statusText = '🔴 Target Missed / Shortfall';
                  }

                  return (
                    <div key={t.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-md">
                              {t.tradeType}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                              Wing {t.wing} • Floor {t.floorNumber}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-white text-base mt-1.5">{contractor?.companyName}</h4>
                          <p className="text-xs text-slate-300 font-medium mt-1">{t.targetDescription}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${statusBadge}`}>
                          {statusText}
                        </span>

                        <span className="text-slate-400 text-xs">
                          Workers: <span className="font-mono font-bold text-amber-400">{t.actualLaborCount || t.plannedLaborCount}</span> deployed
                        </span>
                      </div>

                      {t.delayReason && (
                        <div className="bg-rose-950/60 border border-rose-800/80 p-2.5 rounded-xl text-xs text-rose-300">
                          <span className="font-bold">Shortfall Reason:</span> {t.delayReason}
                        </div>
                      )}

                      <button
                        onClick={() => handleOpenAuditModal(t)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-extrabold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center space-x-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                        <span>Perform End-of-Day Audit Sign-Off</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          {attendanceMessage && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{attendanceMessage}</span>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-4 h-4" />
                <span>1. Contractor-Wise Attendance & Absence Tracking</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-xs text-slate-400">Trade Contractor</label>
                <select
                  value={selectedContractorId}
                  onChange={(e) => setSelectedContractorId(parseInt(e.target.value, 10))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                >
                  {(state.contractors || []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.tradeType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Contractor Attendance Status</label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => setContractorIsPresent(true)}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition ${
                      contractorIsPresent ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    🟢 PRESENT
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractorIsPresent(false)}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition ${
                      !contractorIsPresent ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    🔴 ABSENT
                  </button>
                </div>
              </div>

              {contractorIsPresent ? (
                <>
                  <div>
                    <label className="text-xs text-slate-400">Masons Deployed</label>
                    <input
                      type="number" min={0}
                      value={masonsCount}
                      onChange={(e) => setMasonsCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Helpers Deployed</label>
                    <input
                      type="number" min={0}
                      value={helpersCount}
                      onChange={(e) => setHelpersCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <label className="text-xs text-rose-400 font-bold">Reason for Absence</label>
                  <select
                    value={absenceReason}
                    onChange={(e) => setAbsenceReason(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-rose-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    <option value="Festival / Local Holiday">Festival / Local Holiday</option>
                    <option value="Payment / Accounting Dispute">Payment / Accounting Dispute</option>
                    <option value="Material Delayed on Site">Material Delayed on Site</option>
                    <option value="No Work Planned Today">No Work Planned Today</option>
                    <option value="Contractor Sickness / Absent">Contractor Sickness / Absent</option>
                    <option value="Contractor Dispute / Terminated">Contractor Dispute / Terminated</option>
                    <option value="Other Reason">Other Reason</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveAttendance}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/20 transition"
              >
                Save Contractor Attendance
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Edit Contractor Labor Headcounts for {selectedDate}</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">
                  Total Deployed Today: <strong className="text-amber-300">{selectedAttendance.reduce((sum, a) => sum + (a.masonsCount || 0) + (a.helpersCount || 0), 0)} Workers</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(state.contractors || []).map(c => {
                  const att = selectedAttendance.find(a => a.contractorId === c.id);
                  const isPresent = att ? att.isPresent !== false : false;
                  const masons = att ? (att.masonsCount || 0) : 0;
                  const helpers = att ? (att.helpersCount || 0) : 0;

                  return (
                    <div key={c.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2 hover:border-slate-700 transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-extrabold text-white text-xs">{c.companyName}</h5>
                          <span className="text-[10px] text-sky-400 font-bold uppercase">{c.tradeType}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                          isPresent && (masons + helpers > 0)
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border-rose-800'
                        }`}>
                          {isPresent && (masons + helpers > 0) ? `${masons + helpers} Deployed` : 'Absent / 0 Workers'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Masons / Skilled</label>
                          <input
                            type="number"
                            min={0}
                            value={masons}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              handleUpdateInlineContractorLabor(c.id, val, helpers);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-2 text-xs font-mono font-black text-amber-300 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Helpers / Laborers</label>
                          <input
                            type="number"
                            min={0}
                            value={helpers}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              handleUpdateInlineContractorLabor(c.id, masons, val);
                            }}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-2 text-xs font-mono font-black text-amber-300 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-amber-800/60 p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>2. In-House Department Helpers Attendance & Work Logs</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Department Helper</label>
                <select
                  value={selectedDeptLaborerId}
                  onChange={(e) => setSelectedDeptLaborerId(parseInt(e.target.value, 10))}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                >
                  {(state.laborers || []).filter(l => l.isDepartmentLabor).map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.skillLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Attendance Status</label>
                <select
                  value={deptLaborStatus}
                  onChange={(e) => setDeptLaborStatus(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                >
                  <option value="PRESENT">🟢 PRESENT (Full Day)</option>
                  <option value="HALF_DAY">🟡 HALF DAY</option>
                  <option value="ABSENT">🔴 ABSENT</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Work Executed Today</label>
                <input
                  type="text"
                  placeholder="e.g. Assisted Masonry work in Flat 101"
                  value={deptWorkDescription}
                  onChange={(e) => setDeptWorkDescription(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveDepartmentAttendance}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                Save Department Helper Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {verifyingTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Moon className="w-5 h-5 text-indigo-400" />
                <span>Perform End-of-Day Audit Sign-Off</span>
              </h3>
              <button
                onClick={() => setVerifyingTargetId(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                End-of-Day Achievement Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setAuditStatus('ACHIEVED'); setAuditPct(100); }}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    auditStatus === 'ACHIEVED' ? 'bg-emerald-600 text-white border-emerald-500 shadow' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  🟢 Achieved
                </button>
                <button
                  onClick={() => { setAuditStatus('PARTIAL'); setAuditPct(50); }}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    auditStatus === 'PARTIAL' ? 'bg-amber-600 text-white border-amber-500 shadow' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  🟡 Partial
                </button>
                <button
                  onClick={() => { setAuditStatus('MISSED'); setAuditPct(0); }}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    auditStatus === 'MISSED' ? 'bg-rose-600 text-white border-rose-500 shadow' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  🔴 Missed
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Achievement Percentage</span>
                <span className="font-mono text-sky-400">{auditPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={auditPct}
                onChange={(e) => setAuditPct(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Actual Labor Deployed Today
              </label>
              <input
                type="number"
                value={auditLabor}
                onChange={(e) => setAuditLabor(parseInt(e.target.value, 10) || 0)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono font-bold"
              />
            </div>

            {(auditStatus === 'PARTIAL' || auditStatus === 'MISSED') && (
              <div>
                <label className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Reason for Target Shortfall / Delay
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter shortfall reason e.g. Waiting on tile adhesive delivery from store..."
                  value={auditDelayReason}
                  onChange={(e) => setAuditDelayReason(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setVerifyingTargetId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAudit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl font-extrabold shadow-lg shadow-emerald-600/20"
              >
                Save Audit Sign-Off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
