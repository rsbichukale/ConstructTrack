'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  Camera, 
  Layers, 
  Key, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building, 
  Calendar,
  MessageSquareText,
  Zap,
  Check,
  Activity,
  Award,
  TrendingUp,
  BarChart3,
  Download
} from 'lucide-react';
import { getAppState } from '@/lib/dbState';
import { TradeType } from '@/lib/types';
import { SCurveChart } from './SCurveChart';
import { FloorHeatmapGrid } from './FloorHeatmapGrid';
import { downloadDprPdf, shareDprWhatsAppAndPdf } from '@/lib/pdfGenerator';

export const SiteReportsCenter: React.FC = () => {
  const state = getAppState();
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeReportTab, setActiveReportTab] = useState<
    'contractorDpr' | 'scurve' | 'heatmap' | 'dailyProgress' | 'attendance' | 'pendingFloors' | 'contractorSla' | 'possessionReady' | 'snaggingList'
  >('contractorDpr');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  
  // Custom User Supervisor Narration / Daily Remarks
  const [userNarration, setUserNarration] = useState<string>('All trades worked on target schedule today across Wings B1 & B2.');

  // Combine ALL flats across BOTH Wing B1 and Wing B2 (70 flats total)
  const flats = state.flats; 
  const flatIds = flats.map(f => f.id);

  // Combine ALL flat tasks across the entire site
  const flatTasks = state.flatTasks;

  // --- REPORT DATA CALCULATIONS (ALL WINGS COMBINED) ---

  // 1. Labor Attendance Report Data
  const attendanceForDate = state.attendance.filter(a => a.dateLogged === selectedDate);

  // Calculate totals from attendance records or fallback to defaults
  const totalMasons = attendanceForDate.length > 0 
    ? attendanceForDate.reduce((sum, a) => sum + a.masonsCount, 0)
    : state.contractors.length * 4;

  const totalHelpers = attendanceForDate.length > 0
    ? attendanceForDate.reduce((sum, a) => sum + a.helpersCount, 0)
    : state.contractors.length * 3;

  const totalLaborers = totalMasons + totalHelpers;

  // 2. Daily Progress Report Data (with pictures across all wings)
  const logsForDate = state.logs.filter(l => l.dateLogged.startsWith(selectedDate));

  // 3. Pending Work Report For All Floors Data (Floors 1 to 7 - Wings B1 & B2 Combined)
  const floors = [7, 6, 5, 4, 3, 2, 1];
  const floorPendingData = floors.map(floorNum => {
    const floorFlats = flats.filter(f => f.floorNumber === floorNum); // 10 flats total per floor (5 B1 + 5 B2)
    const floorFlatIds = floorFlats.map(f => f.id);
    const floorTasks = flatTasks.filter(t => floorFlatIds.includes(t.flatId));

    const totalTasks = floorTasks.length;
    const approvedTasks = floorTasks.filter(t => t.status === 'APPROVED').length;
    const inProgressTasks = floorTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'INSPECTION_REQUESTED').length;
    const reworkTasks = floorTasks.filter(t => t.status === 'REWORK' || !!t.blockerReason).length;
    const notStartedTasks = floorTasks.filter(t => t.status === 'NOT_STARTED').length;

    const completionPct = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;
    const pendingCount = totalTasks - approvedTasks;

    return {
      floorNum,
      flatCount: floorFlats.length,
      totalTasks,
      approvedTasks,
      inProgressTasks,
      reworkTasks,
      notStartedTasks,
      pendingCount,
      completionPct,
    };
  });

  // 4. Ready to Possession Report Data (Combined All Wings & All 70 Flats)
  const possessionFlats = flats.map(flat => {
    const fTasks = state.flatTasks.filter(t => t.flatId === flat.id);
    const total = fTasks.length;
    const approved = fTasks.filter(t => t.status === 'APPROVED').length;
    const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
    const pendingTasks = fTasks.filter(t => t.status !== 'APPROVED');

    return {
      flat,
      pct,
      total,
      approved,
      pendingCount: pendingTasks.length,
      pendingTasks,
      is100Ready: pct === 100,
      isNearReady: pct >= 90 && pct < 100,
    };
  });

  const ready100Flats = possessionFlats.filter(f => f.is100Ready);
  const readyNearFlats = possessionFlats.filter(f => f.isNearReady);

  // Printable Handler
  const handlePrint = () => {
    window.print();
  };

  // Helper to generate formatted WhatsApp text for active report
  const generateWhatsAppReportText = () => {
    let text = '';

    if (activeReportTab === 'contractorDpr' || activeReportTab === 'attendance') {
      text = `*🏗️ CONSTRUCTTRACK - MASTER CONTRACTOR DAILY WORK & ATTENDANCE REPORT (DPR)*\n`;
      text += `*Date:* ${selectedDate} • *Scope:* Entire Site (Wings B1 & B2 - 70 Flats)\n`;
      text += `-------------------------------------------\n`;
      text += `*👷 Total Manpower Deployed:* ${totalLaborers} Workers (${totalMasons} Masons, ${totalHelpers} Helpers)\n\n`;

      state.contractors.forEach((c, idx) => {
        const att = attendanceForDate.find(a => a.contractorId === c.id);
        const isAbs = att && att.isPresent === false;

        text += `${idx + 1}. *${c.companyName}* (${c.tradeType})\n`;
        if (isAbs) {
          text += `   • *Attendance:* 🔴 ABSENT — *Reason:* ${att.absenceReason || 'Not Reported'}\n\n`;
          return;
        }

        const masons = att ? att.masonsCount : 4;
        const helpers = att ? att.helpersCount : 3;
        text += `   • *Attendance:* 🟢 PRESENT (${masons + helpers} Workers: ${masons} Masons, ${helpers} Helpers)\n`;

        const contractorTargets = (state.dailyWorkTargets || []).filter(
          t => t.contractorId === c.id && t.dateAssigned === selectedDate
        );
        if (contractorTargets.length > 0) {
          text += `   • *Work Assigned:* ${contractorTargets.map(t => `${t.targetDescription} [Wing ${t.wing} F${t.floorNumber}]`).join('; ')}\n`;
          text += `   • *Target Audit:* ${contractorTargets.map(t => `${t.status}${t.delayReason ? ` (Reason: ${t.delayReason})` : ''}`).join('; ')}\n`;
        }

        const contractorLogs = logsForDate.filter(l => {
          const ft = state.flatTasks.find(t => t.id === l.flatTaskId);
          return ft && ft.assignedContractorId === c.id;
        });

        if (contractorLogs.length > 0) {
          text += `   • *Work Done Today:* ${contractorLogs.map(l => {
            const ft = state.flatTasks.find(t => t.id === l.flatTaskId);
            const flat = ft ? state.flats.find(f => f.id === ft.flatId) : null;
            const cat = ft ? state.taskCatalog.find(tc => tc.id === ft.taskCatalogId) : null;
            return `Flat ${flat?.wing}-${flat?.flatNumber} ${cat?.taskName} (${ft?.status}, +${l.completionDelta}%)${ft?.blockerReason ? ` [Blocker: ${ft.blockerReason}]` : ''}`;
          }).join('; ')}\n`;
        }
        text += `\n`;
      });

      if (userNarration.trim()) {
        text += `-------------------------------------------\n`;
        text += `*📝 SUPERVISOR DAILY REMARKS:*\n"${userNarration.trim()}"\n`;
      }
    } else if (activeReportTab === 'dailyProgress') {
      text = `*CONSTRUCTTRACK - MASTER DAILY PROGRESS REPORT (ALL WINGS)*\n*Date:* ${selectedDate}\n\n`;
      text += `*Field Logs Submitted:* ${logsForDate.length} Inspection Entries\n\n`;
      logsForDate.forEach((log, idx) => {
        const ft = state.flatTasks.find(t => t.id === log.flatTaskId);
        const flat = ft ? state.flats.find(f => f.id === ft.flatId) : null;
        const cat = ft ? state.taskCatalog.find(c => c.id === ft.taskCatalogId) : null;
        text += `${idx + 1}. *${cat?.taskName || 'Micro-Task'}* in Flat ${flat?.wing}-${flat?.flatNumber} (${ft?.completionPct}%)\n`;
        if (log.notes) text += `   Notes: ${log.notes}\n`;
      });
      if (userNarration.trim()) text += `\n*Supervisor Remarks:* ${userNarration.trim()}\n`;
    } else if (activeReportTab === 'pendingFloors') {
      text = `*CONSTRUCTTRACK - COMBINED PENDING WORK REPORT (FLOORS 1 - 7)*\n\n`;
      floorPendingData.forEach(f => {
        text += `*Floor ${f.floorNum} (Wings B1 & B2)*: ${f.completionPct}% Complete (${f.pendingCount} Tasks Pending out of ${f.totalTasks})\n`;
        text += `   [Approved: ${f.approvedTasks} | In Progress: ${f.inProgressTasks} | Rework: ${f.reworkTasks} | Not Started: ${f.notStartedTasks}]\n\n`;
      });
      if (userNarration.trim()) text += `\n*Supervisor Remarks:* ${userNarration.trim()}\n`;
    } else if (activeReportTab === 'possessionReady') {
      text = `*CONSTRUCTTRACK - ALL WINGS HANDOVER READINESS REPORT*\n\n`;
      text += `*🎉 100% Possession Ready Flats (${ready100Flats.length}):*\n`;
      ready100Flats.forEach(f => {
        text += `• Flat ${f.flat.wing}-${f.flat.flatNumber} (Floor ${f.flat.floorNumber}) - 100% READY KEY HANDOVER\n`;
      });
      text += `\n*⏳ Near Completion (90%+ Ready) (${readyNearFlats.length}):*\n`;
      readyNearFlats.forEach(f => {
        text += `• Flat ${f.flat.wing}-${f.flat.flatNumber} (${f.pct}% Complete - ${f.pendingCount} minor tasks pending)\n`;
      });
      if (userNarration.trim()) text += `\n*Supervisor Remarks:* ${userNarration.trim()}\n`;
    } else if (activeReportTab === 'snaggingList') {
      const snags = state.snaggingItems || [];
      text = `*CONSTRUCTTRACK - ALL WINGS SNAGGING & DEFECT PUNCH-LIST REPORT*\n\n`;
      text += `*Total Snags Tracked:* ${snags.length}\n`;
      text += `*Open / In Repair:* ${snags.filter(s => s.status === 'OPEN' || s.status === 'IN_REPAIR').length}\n\n`;
      snags.forEach((snag, idx) => {
        const flat = state.flats.find(f => f.id === snag.flatId);
        const zone = state.roomZones.find(z => z.id === snag.roomZoneId);
        text += `${idx + 1}. [${snag.status}] Flat ${flat?.wing}-${flat?.flatNumber} (${zone?.zoneLabel}): ${snag.description} [Category: ${snag.category}]\n`;
      });
      if (userNarration.trim()) text += `\n*Supervisor Remarks:* ${userNarration.trim()}\n`;
    }

    text += `\n📄 *Attached PDF Report File:* ConstructTrack_DPR_${selectedDate}.pdf\n`;
    return text;
  };

  const handleDownloadPdf = async () => {
    const el = document.getElementById('dpr-printable-report');
    if (!el) return;
    const filename = `ConstructTrack_DPR_${selectedDate}.pdf`;
    await downloadDprPdf(el, filename);
  };

  const handleShareWhatsApp = async () => {
    const el = document.getElementById('dpr-printable-report');
    const text = generateWhatsAppReportText();
    const filename = `ConstructTrack_DPR_${selectedDate}.pdf`;

    if (el) {
      await shareDprWhatsAppAndPdf(el, text, filename);
    } else {
      const encoded = encodeURIComponent(text);
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Master Executive Site Reports & Analytics Center</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Combined Project Progress & Handover Reports</h2>
          <p className="text-xs text-slate-400">Master reports combining all Wings (B1 & B2) and all 70 flats into a single project view</p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl p-2.5 shadow focus:outline-none focus:border-sky-500"
          />

          <button
            onClick={handleDownloadPdf}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 transition"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Print</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Share WhatsApp + PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 text-xs print:hidden">
        <button
          onClick={() => setActiveReportTab('contractorDpr')}
          className={`p-3 rounded-2xl font-extrabold transition border flex flex-col items-center space-y-1.5 text-center ${
            activeReportTab === 'contractorDpr'
              ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-300" />
          <span>1. Contractor Daily DPR</span>
        </button>

        <button
          onClick={() => setActiveReportTab('scurve')}
          className={`p-3 rounded-2xl font-extrabold transition border flex flex-col items-center space-y-1.5 text-center ${
            activeReportTab === 'scurve'
              ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-300" />
          <span>2. S-Curve & EVM</span>
        </button>

        <button
          onClick={() => setActiveReportTab('heatmap')}
          className={`p-3 rounded-2xl font-extrabold transition border flex flex-col items-center space-y-1.5 text-center ${
            activeReportTab === 'heatmap'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          <Building className="w-4 h-4 text-emerald-300" />
          <span>2. 2D Floor Matrix</span>
        </button>

        <button
          onClick={() => setActiveReportTab('contractorSla')}
          className={`p-3 rounded-2xl font-extrabold transition border flex flex-col items-center space-y-1.5 text-center ${
            activeReportTab === 'contractorSla'
              ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          <Award className="w-4 h-4 text-purple-300" />
          <span>3. Contractor SLA</span>
        </button>

        <button
          onClick={() => setActiveReportTab('dailyProgress')}
          className={`p-3 rounded-2xl font-extrabold transition border flex flex-col items-center space-y-1.5 text-center ${
            activeReportTab === 'dailyProgress'
              ? 'bg-sky-600 text-white border-sky-500 shadow-lg shadow-sky-600/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>4. Daily Progress</span>
        </button>

        <button
          onClick={() => setActiveReportTab('attendance')}
          className={`p-3 rounded-2xl font-extrabold transition border flex flex-col items-center space-y-1.5 text-center ${
            activeReportTab === 'attendance'
              ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>5. Attendance</span>
        </button>

        <button
          onClick={() => setActiveReportTab('pendingFloors')}
          className={`p-3 rounded-2xl font-extrabold transition border flex flex-col items-center space-y-1.5 text-center ${
            activeReportTab === 'pendingFloors'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>6. Floor Pending</span>
        </button>

        <button
          onClick={() => setActiveReportTab('possessionReady')}
          className={`p-3 rounded-2xl font-extrabold transition border flex flex-col items-center space-y-1.5 text-center ${
            activeReportTab === 'possessionReady'
              ? 'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-600/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>7. Possession Ready</span>
        </button>

        <button
          onClick={() => setActiveReportTab('snaggingList')}
          className={`p-3 rounded-2xl font-extrabold transition border flex flex-col items-center space-y-1.5 text-center ${
            activeReportTab === 'snaggingList'
              ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>8. Snagging Defects</span>
        </button>
      </div>

      {/* EDITABLE SUPERVISOR NARRATION / REMARKS INPUT BOX */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 print:hidden">
        <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
          <MessageSquareText className="w-4 h-4" />
          <span>Supervisor Daily Remarks & Custom User Narration (Appends to WhatsApp & PDF Reports)</span>
        </label>
        <textarea
          rows={2}
          placeholder="Type any specific observations, overtime remarks, or material delivery notes e.g. Masons worked overtime till 8 PM on Floor 3 brickwork..."
          value={userNarration}
          onChange={(e) => setUserNarration(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* REPORT CONTENT AREA */}
      <div id="dpr-printable-report" className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 print:bg-white print:text-black print:p-0 print:border-none">
        
        {/* REPORT 1: MASTER CONTRACTOR DAILY WORK & ATTENDANCE REPORT (DPR) */}
        {activeReportTab === 'contractorDpr' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider">Daily Execution & Labor Audit</span>
                <h3 className="text-2xl font-black text-white mt-1">Master Contractor Daily Work & Attendance Report</h3>
                <p className="text-xs text-slate-400">Headcount, Work Assigned, Work Done with Status, Blocker Reasons & Progress Delta per Contractor on {selectedDate}</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition"
                >
                  <MessageSquareText className="w-4 h-4" />
                  <span>Share Full WhatsApp DPR</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {state.contractors.map((c) => {
                const att = attendanceForDate.find(a => a.contractorId === c.id);
                const isAbsent = att && att.isPresent === false;
                const masons = att ? att.masonsCount : 4;
                const helpers = att ? att.helpersCount : 3;
                const totalManpower = isAbsent ? 0 : masons + helpers;

                // Work Assigned
                const assignedTargets = (state.dailyWorkTargets || []).filter(
                  t => t.contractorId === c.id && t.dateAssigned === selectedDate
                );

                // Work Done Today
                const contractorLogs = logsForDate.filter(l => {
                  const ft = state.flatTasks.find(t => t.id === l.flatTaskId);
                  return ft && ft.assignedContractorId === c.id;
                });

                return (
                  <div key={c.id} className={`p-6 rounded-3xl border transition shadow-xl ${
                    isAbsent 
                      ? 'bg-rose-950/20 border-rose-900/40' 
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                          isAbsent ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {c.tradeType.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-black text-white">{c.companyName}</h4>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                              {c.tradeType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">Contact: {c.contactPerson} ({c.phone})</p>
                        </div>
                      </div>

                      {/* Headcount Badge */}
                      <div>
                        {isAbsent ? (
                          <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black text-xs flex items-center space-x-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                            <span>ABSENT ({att?.absenceReason || 'No Manpower Deployed'})</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-xs flex items-center space-x-1.5">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span>{totalManpower} Workers ({masons} Masons, {helpers} Helpers)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {/* Left: Work Assigned Today */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Work Assigned Today</span>
                        </span>

                        {assignedTargets.length > 0 ? (
                          <div className="space-y-2">
                            {assignedTargets.map(target => (
                              <div key={target.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-white">{target.targetDescription}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                    target.status === 'ACHIEVED'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : target.status === 'MISSED'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                  }`}>
                                    {target.status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                  <span>Location: Wing {target.wing} • Floor {target.floorNumber}</span>
                                  <span>Target: {target.targetQuantitySqft} SQFT</span>
                                </div>
                                {target.delayReason && (
                                  <div className="text-[11px] text-rose-400 font-medium bg-rose-950/30 p-1.5 rounded border border-rose-900/30 flex items-start space-x-1">
                                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                    <span>Reason: {target.delayReason}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 italic">
                            No specific target assigned for {selectedDate}. General floor execution in progress.
                          </div>
                        )}
                      </div>

                      {/* Right: Work Done & Status */}
                      <div className="space-y-3">
                        <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Work Done & Execution Status</span>
                        </span>

                        {contractorLogs.length > 0 ? (
                          <div className="space-y-2">
                            {contractorLogs.map(log => {
                              const ft = state.flatTasks.find(t => t.id === log.flatTaskId);
                              const flat = ft ? state.flats.find(f => f.id === ft.flatId) : null;
                              const cat = ft ? state.taskCatalog.find(tc => tc.id === ft.taskCatalogId) : null;

                              return (
                                <div key={log.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-white">
                                      Flat {flat?.wing}-{flat?.flatNumber}: {cat?.taskName}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      +{log.completionDelta}% Delta
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                    <span>Status: <strong className="text-slate-200">{ft?.status}</strong> (Total {ft?.completionPct}%)</span>
                                    <span>Manpower: {log.laborCount} Workers</span>
                                  </div>
                                  {ft?.blockerReason && (
                                    <div className="text-[11px] text-amber-400 font-medium bg-amber-950/30 p-1.5 rounded border border-amber-900/30 flex items-start space-x-1">
                                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                      <span>Blocker: {ft.blockerReason}</span>
                                    </div>
                                  )}
                                  {log.notes && (
                                    <p className="text-[11px] text-slate-300 italic bg-slate-950/50 p-1.5 rounded">
                                      "{log.notes}"
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 italic">
                            {isAbsent ? 'Contractor absent — zero output logged.' : 'No task completion logs submitted yet for this date.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REPORT 2: S-CURVE & EVM ANALYTICS */}
        {activeReportTab === 'scurve' && (
          <SCurveChart
            flatTasks={state.flatTasks}
            logs={state.logs}
            flats={state.flats}
            taskCatalog={state.taskCatalog}
          />
        )}

        {/* REPORT 2: 2D FLOOR HEATMAP MATRIX */}
        {activeReportTab === 'heatmap' && (
          <FloorHeatmapGrid
            flats={state.flats}
            flatTasks={state.flatTasks}
            taskCatalog={state.taskCatalog}
            contractors={state.contractors}
          />
        )}

        {/* REPORT 3: CONTRACTOR SLA & EXECUTION PERFORMANCE LEADERBOARD */}
        {activeReportTab === 'contractorSla' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-purple-400 font-extrabold text-xs uppercase tracking-wider">Contractor Audit Matrix</span>
              <h3 className="text-2xl font-black text-white mt-1">Contractor SLA & Execution Leaderboard</h3>
              <p className="text-xs text-slate-400">Target Completion Rates, Open Quality Defects & SLA Performance Ratings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.contractors.map((c, idx) => {
                const assignedTasks = state.flatTasks.filter(t => t.assignedContractorId === c.id);
                const approvedCount = assignedTasks.filter(t => t.status === 'APPROVED').length;
                const reworkCount = assignedTasks.filter(t => t.status === 'REWORK' || !!t.blockerReason).length;
                const completionPct = assignedTasks.length > 0 
                  ? Math.round((approvedCount / assignedTasks.length) * 100) 
                  : 0;

                const openSnags = (state.snaggingItems || []).filter(s => s.assignedContractorId === c.id && s.status === 'OPEN');

                let ratingLabel = 'SATISFACTORY';
                let ratingBadgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                if (completionPct >= 75 && openSnags.length === 0) {
                  ratingLabel = 'EXCELLENT';
                  ratingBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                } else if (completionPct < 40 || openSnags.length > 3) {
                  ratingLabel = 'NEEDS ATTENTION';
                  ratingBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                }

                return (
                  <div key={c.id} className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                          <h4 className="text-base font-bold text-white">{c.companyName}</h4>
                        </div>
                        <p className="text-xs text-cyan-400 font-semibold">{c.tradeType} • Wing Scope: {c.wingScope || 'ALL'}</p>
                      </div>

                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border uppercase tracking-wider ${ratingBadgeClass}`}>
                        {ratingLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400">Total Tasks</div>
                        <div className="text-base font-extrabold text-white">{assignedTasks.length}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Completion %</div>
                        <div className="text-base font-extrabold text-emerald-400">{completionPct}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Open Snags</div>
                        <div className="text-base font-extrabold text-amber-400">{openSnags.length}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                        <span>Approved Work Progress</span>
                        <span>{approvedCount} / {assignedTasks.length} Tasks Approved</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full" style={{ width: `${completionPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REPORT 4: COMBINED DAILY PROGRESS REPORT WITH PICTURES */}
        {activeReportTab === 'dailyProgress' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 print:border-black">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sky-400 font-extrabold text-xs uppercase tracking-wider print:text-blue-600">Master Daily Progress Summary (Wings B1 & B2 Combined)</span>
                  <h3 className="text-2xl font-black text-white mt-1 print:text-black">Combined Daily Work Progress Report</h3>
                  <p className="text-xs text-slate-400 print:text-gray-600">Date: {selectedDate} • Scope: Wings B1 & B2 Combined (70 Flats)</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 print:text-gray-600">Field Logs Logged</div>
                  <div className="text-2xl font-mono font-black text-sky-400 print:text-blue-600">{logsForDate.length} Entries</div>
                </div>
              </div>
            </div>

            {/* Field Progress Logs Grid (with pictures) */}
            {logsForDate.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm print:text-gray-600">
                No progress photo logs registered for {selectedDate}. Inspect tasks in Step 5 to attach photos.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {logsForDate.map(log => {
                  const flatTask = state.flatTasks.find(t => t.id === log.flatTaskId);
                  const flat = flatTask ? state.flats.find(f => f.id === flatTask.flatId) : null;
                  const cat = flatTask ? state.taskCatalog.find(c => c.id === flatTask.taskCatalogId) : null;
                  const contractor = flatTask ? state.contractors.find(c => c.id === flatTask.assignedContractorId) : null;

                  return (
                    <div key={log.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 print:bg-white print:border-gray-300">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-md print:bg-gray-100 print:text-black">
                            {cat?.tradeType || 'Civil Work'}
                          </span>
                          <h4 className="font-extrabold text-white text-base mt-1 print:text-black">{cat?.taskName}</h4>
                          <p className="text-xs text-slate-400 print:text-gray-600">
                            Unit: Flat {flat?.wing}-{flat?.flatNumber} (Floor {flat?.floorNumber}) • Contractor: {contractor?.companyName || 'Unassigned'}
                          </p>
                        </div>
                        <span className="font-mono font-black text-emerald-400 text-sm">{log.completionDelta}% Progress</span>
                      </div>

                      {/* Photo Attachment Thumbnail */}
                      {log.photoUrl ? (
                        <div className="rounded-xl overflow-hidden border border-slate-800 h-40">
                          <img src={log.photoUrl} alt="Field Proof" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center text-xs text-slate-500 print:bg-gray-50 print:text-gray-500">
                          No photo proof attached for this entry
                        </div>
                      )}

                      {log.notes && (
                        <div className="text-xs bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-slate-300 print:bg-gray-50 print:text-black">
                          <span className="font-bold text-sky-400 print:text-black">Inspector Remarks:</span> {log.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* REPORT 2: ALL LABOURS ATTENDANCE & WORK DONE REPORT */}
        {activeReportTab === 'attendance' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 print:border-black">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider print:text-amber-600">Master Daily Muster Roll & Work Details</span>
                  <h3 className="text-2xl font-black text-white mt-1 print:text-black">All Labours Attendance & Work Execution Report</h3>
                  <p className="text-xs text-slate-400 print:text-gray-600">Date: {selectedDate} • Scope: Wings B1 & B2 Combined • Total Active Contractors: {state.contractors.length}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 print:text-gray-600">Total Workers</div>
                    <div className="text-2xl font-mono font-black text-amber-400 print:text-amber-600">{totalLaborers}</div>
                  </div>
                  <div className="text-center border-l border-slate-800 pl-4 print:border-gray-300">
                    <div className="text-xs text-slate-400 print:text-gray-600">Masons / Helpers</div>
                    <div className="text-2xl font-mono font-black text-white print:text-black">{totalMasons}M / {totalHelpers}H</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contractor Attendance & Specific Work Executed Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 print:bg-gray-100 print:text-black print:border-gray-300">
                    <th className="p-3 font-bold">Contractor Company & Trade</th>
                    <th className="p-3 font-bold text-center">Masons (Karigar)</th>
                    <th className="p-3 font-bold text-center">Helpers (Mazdoor)</th>
                    <th className="p-3 font-bold text-center">Total Workers</th>
                    <th className="p-3 font-bold">Specific Work Executed / Targets Today (All Wings)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 print:divide-gray-200">
                  {state.contractors.map(c => {
                    const att = attendanceForDate.find(a => a.contractorId === c.id);
                    const masons = att ? att.masonsCount : 4;
                    const helpers = att ? att.helpersCount : 3;
                    const total = masons + helpers;

                    // Work executed / targets
                    const contractorTargets = (state.dailyWorkTargets || []).filter(
                      t => t.contractorId === c.id && t.dateAssigned === selectedDate
                    );

                    const contractorTasks = state.flatTasks.filter(
                      t => t.assignedContractorId === c.id && t.status !== 'NOT_STARTED'
                    ).slice(0, 4);

                    return (
                      <tr key={c.id} className="hover:bg-slate-950/50 print:hover:bg-transparent">
                        <td className="p-3 font-extrabold text-white print:text-black">
                          <div>{c.companyName}</div>
                          <div className="text-[11px] text-sky-400 font-semibold print:text-black">{c.tradeType}</div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-400 print:text-black">{masons}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-400 print:text-black">{helpers}</td>
                        <td className="p-3 text-center font-mono font-black text-white text-sm print:text-black">{total}</td>
                        <td className="p-3 text-slate-300 print:text-black">
                          {contractorTargets.length > 0 ? (
                            <div className="space-y-1">
                              {contractorTargets.map(t => (
                                <div key={t.id} className="text-xs bg-slate-950 p-1.5 rounded border border-slate-800 print:bg-gray-50 print:border-gray-200">
                                  <span className="font-bold text-amber-400">Target:</span> {t.targetDescription} <span className="text-[10px] text-sky-400">(Wing {t.wing} F{t.floorNumber} - {t.status})</span>
                                </div>
                              ))}
                            </div>
                          ) : contractorTasks.length > 0 ? (
                            <div className="space-y-1">
                              {contractorTasks.map(t => {
                                const cat = state.taskCatalog.find(cat => cat.id === t.taskCatalogId);
                                const flat = state.flats.find(f => f.id === t.flatId);
                                return (
                                  <div key={t.id} className="text-xs bg-slate-950 p-1.5 rounded border border-slate-800 print:bg-gray-50 print:border-gray-200">
                                    <span className="font-bold text-sky-400">{cat?.taskName}</span> in Flat {flat?.wing}-{flat?.flatNumber} ({t.completionPct}%)
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">General {c.tradeType} work across active floors in Wings B1 & B2</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Custom User Narration Display */}
            {userNarration && (
              <div className="bg-amber-950/40 border border-amber-800/80 p-4 rounded-2xl space-y-1 print:bg-gray-50 print:border-gray-300">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider print:text-black flex items-center space-x-1.5">
                  <MessageSquareText className="w-4 h-4" />
                  <span>Supervisor Daily Remarks & Site Narration</span>
                </div>
                <p className="text-xs text-amber-200 italic print:text-black">"{userNarration}"</p>
              </div>
            )}
          </div>
        )}

        {/* REPORT 3: PENDING WORK REPORT FOR ALL FLOORS (WINGS B1 & B2 COMBINED) */}
        {activeReportTab === 'pendingFloors' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 print:border-black">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-indigo-400 font-extrabold text-xs uppercase tracking-wider print:text-indigo-600">Combined Building Construction Velocity</span>
                  <h3 className="text-2xl font-black text-white mt-1 print:text-black">Pending Work Audit Report For All Floors</h3>
                  <p className="text-xs text-slate-400 print:text-gray-600">Floor Matrix Audit across Floors 1 to 7 (Wings B1 & B2 Combined - 10 Flats Per Floor)</p>
                </div>
              </div>
            </div>

            {/* Floors Pending Table */}
            <div className="space-y-4">
              {floorPendingData.map(f => (
                <div key={f.floorNum} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3 print:bg-white print:border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center font-black text-sm print:bg-gray-100 print:text-black">
                        F{f.floorNum}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-base print:text-black">Floor {f.floorNum} Audit (Wings B1 & B2 Combined)</h4>
                        <p className="text-xs text-slate-400 print:text-gray-600">10 Flat Units (B1-{f.floorNum}01..05 & B2-{f.floorNum}01..05) • Total Tasks: {f.totalTasks}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400 print:text-gray-600 font-medium">Completion Velocity</div>
                      <div className="text-xl font-mono font-black text-sky-400 print:text-black">{f.completionPct}%</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800 print:bg-gray-200">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${f.completionPct}%` }}
                    />
                  </div>

                  {/* Status Breakdown Pills */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-200">
                      <div className="text-[10px] text-slate-400 print:text-gray-600">Approved</div>
                      <div className="font-extrabold text-emerald-400 font-mono print:text-black">{f.approvedTasks}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-200">
                      <div className="text-[10px] text-slate-400 print:text-gray-600">In Progress</div>
                      <div className="font-extrabold text-amber-400 font-mono print:text-black">{f.inProgressTasks}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-200">
                      <div className="text-[10px] text-slate-400 print:text-gray-600">Rework / Blocked</div>
                      <div className="font-extrabold text-rose-400 font-mono print:text-black">{f.reworkTasks}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 print:bg-gray-50 print:border-gray-200">
                      <div className="text-[10px] text-slate-400 print:text-gray-600">Not Started</div>
                      <div className="font-extrabold text-slate-400 font-mono print:text-black">{f.notStartedTasks}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORT 4: READY TO POSSESSION HANDOVER REPORT (ALL WINGS COMBINED) */}
        {activeReportTab === 'possessionReady' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4 print:border-black">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-wider print:text-emerald-600">Master Client Key Handover Audit</span>
                  <h3 className="text-2xl font-black text-white mt-1 print:text-black">Ready To Possession & Handover Report</h3>
                  <p className="text-xs text-slate-400 print:text-gray-600">All 70 Flats across Wings B1 & B2 certified for client possession</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 print:text-gray-600">100% Ready Units</div>
                    <div className="text-2xl font-mono font-black text-emerald-400 print:text-emerald-600">{ready100Flats.length}</div>
                  </div>
                  <div className="text-center border-l border-slate-800 pl-4 print:border-gray-300">
                    <div className="text-xs text-slate-400 print:text-gray-600">Near Ready (90%+)</div>
                    <div className="text-2xl font-mono font-black text-amber-400 print:text-amber-600">{readyNearFlats.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION A: 100% POSSESSION READY FLATS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider print:text-black flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>🎉 100% Possession Ready Flats (Key Handover Certificate Issued)</span>
              </h4>

              {ready100Flats.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center text-xs text-slate-500 print:bg-white print:border-gray-300">
                  No flats have reached 100% completion yet. Complete all room tasks in Step 5 to certify possession readiness.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {ready100Flats.map(item => (
                    <div key={item.flat.id} className="bg-emerald-950/40 border border-emerald-800 p-4 rounded-2xl space-y-2 print:bg-white print:border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white text-base print:text-black">Flat {item.flat.wing}-{item.flat.flatNumber}</span>
                        <span className="text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-md">100% READY</span>
                      </div>
                      <p className="text-xs text-slate-400 print:text-gray-600">Floor {item.flat.floorNumber} • {item.flat.flatType} Unit</p>
                      <div className="text-xs text-emerald-300 font-bold flex items-center space-x-1 pt-1 border-t border-emerald-800/80">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All 51 Micro-Tasks Certified Approved</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION B: NEAR READY FLATS (90%+ COMPLETE) */}
            <div className="space-y-3 pt-4 border-t border-slate-800 print:border-gray-300">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider print:text-black flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>⏳ Near Completion (90%+ Ready - Minor Finishing Pending)</span>
              </h4>

              {readyNearFlats.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center text-xs text-slate-500 print:bg-white print:border-gray-300">
                  No flats in 90%-99% range currently.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {readyNearFlats.map(item => (
                    <div key={item.flat.id} className="bg-amber-950/20 border border-amber-800/80 p-4 rounded-2xl space-y-2 print:bg-white print:border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-white text-base print:text-black">Flat {item.flat.wing}-{item.flat.flatNumber}</span>
                        <span className="text-[10px] font-extrabold bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-md">{item.pct}%</span>
                      </div>
                      <p className="text-xs text-slate-400 print:text-gray-600">Floor {item.flat.floorNumber} • {item.pendingCount} tasks remaining</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SNAGGING & DEFECT PUNCH-LIST REPORT */}
        {activeReportTab === 'snaggingList' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-rose-800/60 p-6 rounded-2xl print:bg-white print:border-gray-300">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-rose-400 font-extrabold text-xs uppercase tracking-wider print:text-rose-600">Pre-Handover Quality Inspection</span>
                  <h3 className="text-2xl font-black text-white mt-1 print:text-black">Snagging & Defect Punch-List Report</h3>
                  <p className="text-xs text-slate-400 print:text-gray-600">All defects, cracks, leaks & finish issues logged across Wings B1 & B2</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 print:text-gray-600">Total Tracked</div>
                    <div className="text-2xl font-mono font-black text-white print:text-black">{(state.snaggingItems || []).length}</div>
                  </div>
                  <div className="text-center border-l border-slate-800 pl-4 print:border-gray-300">
                    <div className="text-xs text-slate-400 print:text-gray-600">Open / In Repair</div>
                    <div className="text-2xl font-mono font-black text-rose-400 print:text-rose-600">
                      {(state.snaggingItems || []).filter(s => s.status === 'OPEN' || s.status === 'IN_REPAIR').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {(state.snaggingItems || []).length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-xs text-slate-500 print:bg-white print:border-gray-300">
                  No snagging defects logged yet. Quality inspections are clear across all units!
                </div>
              ) : (
                <div className="space-y-2">
                  {(state.snaggingItems || []).map(snag => {
                    const flat = state.flats.find(f => f.id === snag.flatId);
                    const zone = state.roomZones.find(z => z.id === snag.roomZoneId);
                    const contractor = state.contractors.find(c => c.id === snag.assignedContractorId);
                    const isOpen = snag.status === 'OPEN' || snag.status === 'IN_REPAIR';

                    return (
                      <div key={snag.id} className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                        isOpen ? 'bg-rose-950/20 border-rose-800/80' : 'bg-slate-900 border-slate-800'
                      }`}>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-white text-sm">
                              Flat {flat?.wing}-{flat?.flatNumber} • {zone?.zoneLabel}
                            </span>
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded-md">
                              {snag.category}
                            </span>
                          </div>
                          <p className="text-slate-300 font-medium">{snag.description}</p>
                          <p className="text-[10px] text-slate-500">Assigned Trade: {contractor?.companyName || 'Trade Contractor'}</p>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                            snag.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-rose-950 text-rose-400 border-rose-800'
                          }`}>
                            {snag.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
