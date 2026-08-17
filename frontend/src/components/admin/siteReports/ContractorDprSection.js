'use client';

import React, { useRef } from 'react';
import { FileText, Printer, Share2 } from 'lucide-react';
import { getAppState } from '../../../lib/dbState';
import { downloadDprPdf, shareDprWhatsAppAndPdf } from '../../../lib/pdfGenerator';

export const ContractorDprSection = ({
  selectedDate,
  onSelectDate,
  userNarration,
  onUserNarrationChange,
}) => {
  const state = getAppState();
  const flats = state.flats || [];
  const flatTasks = state.flatTasks || [];

  const totalFlats = flats.length;
  const totalSiteTasks = flatTasks.length;
  const approvedSiteTasks = flatTasks.filter(t => t.status === 'APPROVED').length;
  const inProgressSiteTasks = flatTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'INSPECTION_REQUESTED').length;
  const reworkSiteTasks = flatTasks.filter(t => t.status === 'REWORK' || !!t.blockerReason).length;
  const overallSitePct = totalSiteTasks > 0 ? Math.round((approvedSiteTasks / totalSiteTasks) * 100) : 0;

  const logsForDate = (state.logs || []).filter(l => l.dateLogged === selectedDate);
  const totalWorkDoneTodaySqft = logsForDate.reduce((sum, l) => sum + (l.quantityDelta || 0), 0);
  const totalLaborCountToday = logsForDate.reduce((sum, l) => sum + (l.laborCount || 0), 0);

  const contractorDprSummary = (state.contractors || []).map(contractor => {
    const cLogs = logsForDate.filter(l => {
      const task = flatTasks.find(t => t.id === l.flatTaskId);
      return task?.assignedContractorId === contractor.id;
    });
    const workDoneSqft = cLogs.reduce((s, l) => s + (l.quantityDelta || 0), 0);
    const laborUsed = cLogs.reduce((s, l) => s + (l.laborCount || 0), 0);

    const cPendingTasks = flatTasks.filter(t => {
      if (t.status === 'APPROVED') return false;
      return t.assignedContractorId === contractor.id;
    });

    const cApprovedTasks = flatTasks.filter(t => {
      return t.status === 'APPROVED' && t.assignedContractorId === contractor.id;
    });

    const totalAssigned = cPendingTasks.length + cApprovedTasks.length;
    const cCompletionPct = totalAssigned > 0 ? Math.round((cApprovedTasks.length / totalAssigned) * 100) : 0;

    return {
      contractor,
      workDoneSqft,
      laborUsed,
      logsCount: cLogs.length,
      pendingCount: cPendingTasks.length,
      approvedCount: cApprovedTasks.length,
      completionPct: cCompletionPct,
      logs: cLogs,
    };
  });

  const reportContainerRef = useRef(null);

  const handleGeneratePdfReport = () => {
    if (!reportContainerRef.current) return;
    downloadDprPdf(reportContainerRef.current, `DPR_Report_${selectedDate}.pdf`);
  };

  const handleShareWhatsAppReport = () => {
    if (!reportContainerRef.current) return;
    const summaryText = `🏗️ ConstructTrack Daily Progress Report (${selectedDate})\n• Overall Site Progress: ${overallSitePct}%\n• Approved Micro-Tasks: ${approvedSiteTasks}/${totalSiteTasks}\n• Active Laborers Today: ${totalLaborCountToday}\n• Work Done Today: ${totalWorkDoneTodaySqft} sq.ft\n\nRemarks: ${userNarration}`;
    shareDprWhatsAppAndPdf(reportContainerRef.current, summaryText, `DPR_Report_${selectedDate}.pdf`);
  };

  return (
    <div ref={reportContainerRef} className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <span>Daily Progress Report (DPR) Executive Statement</span>
          </h3>
          <p className="text-xs text-slate-400">Generate, print, or share official site progress statement</p>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-sky-500"
          />

          <button
            onClick={handleGeneratePdfReport}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-600/30 flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleShareWhatsAppReport}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp DPR</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
        <label className="text-xs font-extrabold text-sky-400 uppercase tracking-wider block">
          Site Supervisor Executive Remarks for {selectedDate}:
        </label>
        <textarea
          rows={2}
          value={userNarration}
          onChange={(e) => onUserNarrationChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Overall Site Progress</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">{overallSitePct}%</div>
          <span className="text-[10px] text-slate-500">{approvedSiteTasks} / {totalSiteTasks} Micro-Tasks</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Flats Scope</span>
          <div className="text-2xl font-black text-sky-400 font-mono">{totalFlats} Flats</div>
          <span className="text-[10px] text-slate-500">Wing B1 (35) + Wing B2 (35)</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Work Quantity</span>
          <div className="text-2xl font-black text-amber-400 font-mono">{totalWorkDoneTodaySqft} sq.ft</div>
          <span className="text-[10px] text-slate-500">Logged for {selectedDate}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Trade Laborers</span>
          <div className="text-2xl font-black text-purple-400 font-mono">{totalLaborCountToday} On Site</div>
          <span className="text-[10px] text-slate-500">Across {contractorDprSummary.length} Contractors</span>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Trade Contractor Daily Performance Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractorDprSummary.map(({ contractor, workDoneSqft, laborUsed, pendingCount, approvedCount, completionPct }) => (
            <div key={contractor.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h5 className="font-extrabold text-white text-sm">{contractor.companyName}</h5>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded uppercase">
                    {contractor.tradeType}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400 font-mono">{completionPct}%</span>
                  <span className="text-[10px] text-slate-500 block">Completed</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Work Done ({selectedDate})</span>
                  <span className="font-bold text-amber-400 font-mono">{workDoneSqft} sq.ft</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Labor Count</span>
                  <span className="font-bold text-purple-400 font-mono">{laborUsed} Masons/Helpers</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                <span>Approved: <strong className="text-emerald-400">{approvedCount}</strong></span>
                <span>Pending: <strong className="text-amber-400">{pendingCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
