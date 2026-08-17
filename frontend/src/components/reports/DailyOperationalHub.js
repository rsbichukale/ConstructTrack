'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  Share2,
  Printer,
  FileSpreadsheet,
  Package,
  Truck,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sun,
  CloudRain,
  Wind,
  Flame,
  Clock,
  MapPin,
  TrendingUp,
  Award,
  Layers,
  ArrowUpRight,
  Phone,
  Camera,
  RefreshCw,
  DoorOpen,
  FileText
} from 'lucide-react';
import { getAppState } from '../../lib/dbState';
import { apiClient } from '../../lib/apiClient';
import { buildDailyWhatsAppSummary, exportDailyReportToExcel } from '../../lib/dailyReportExporter';

export const DailyOperationalHub = () => {
  const localState = getAppState();
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState('dpr');
  const [weatherCondition, setWeatherCondition] = useState('Sunny & Clear');
  const [shiftType, setShiftType] = useState('Day Shift (8:00 AM - 6:00 PM)');
  const [siteEngineerRemarks, setSiteEngineerRemarks] = useState(
    'All planned trades mobilized on site. Work progressing smoothly across Wings B1 & B2 with standard safety measures in place.'
  );
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const printAreaRef = useRef(null);

  // Fetch consolidated operational report from backend
  const fetchOperationalReport = async (date) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/reports/daily-operational?date=${date}`);
      if (res && res.success) {
        setReportData(res);
      } else {
        fallbackToLocalState(date);
      }
    } catch (err) {
      console.warn('Backend daily operational API unavailable, falling back to local DB state:', err);
      fallbackToLocalState(date);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback builder using local client dbState
  const fallbackToLocalState = (date) => {
    const s = getAppState();
    const targets = (s.dailyWorkTargets || []).filter(t => t.dateAssigned === date);
    const contractorAtt = (s.attendance || []).filter(a => a.dateLogged === date).map(att => {
      const contractor = (s.contractors || []).find(c => c.id === att.contractorId) || {};
      return {
        id: att.id,
        contractorId: att.contractorId,
        companyName: contractor.companyName || 'Contractor',
        tradeType: contractor.tradeType || 'General',
        phone: contractor.phone || '',
        contactPerson: contractor.contactPerson || '',
        dateLogged: att.dateLogged,
        isPresent: att.isPresent !== false,
        masonsCount: Number(att.masonsCount || 0),
        helpersCount: Number(att.helpersCount || 0),
        totalWorkers: Number(att.masonsCount || 0) + Number(att.helpersCount || 0),
        absenceReason: att.absenceReason || null,
        workAssigned: att.workAssigned || null
      };
    });

    const deptAtt = (s.departmentAttendance || []).filter(a => a.dateLogged === date).map(att => {
      const laborer = (s.laborers || []).find(l => l.id === att.laborerId) || {};
      return {
        id: att.id,
        laborerId: att.laborerId,
        laborerName: laborer.name || 'In-House Helper',
        skillLevel: laborer.skillLevel || 'Helper',
        dailyWageRate: Number(laborer.dailyWageRate || 650),
        dateLogged: att.dateLogged,
        status: att.status || 'PRESENT',
        workDescription: att.workDescription || null,
        narration: att.narration || null
      };
    });

    const inward = (s.materialInwardRecords || []).filter(m => m.receivedDate === date);
    const outward = (s.materialOutwardRecords || []).filter(m => m.issuedDate === date);
    const machinery = (s.machineryLogs || []).filter(m => m.logDate === date);
    const safety = (s.safetyBriefings || []).filter(sb => sb.briefingDate === date);
    const visitors = (s.visitorGatePasses || []).filter(v => v.entryTime && v.entryTime.startsWith(date));

    let totalMasons = 0;
    let totalHelpers = 0;
    contractorAtt.forEach(c => {
      if (c.isPresent) {
        totalMasons += c.masonsCount;
        totalHelpers += c.helpersCount;
      }
    });
    const totalDept = deptAtt.filter(d => d.status === 'PRESENT' || d.status === 'HALF_DAY').length;
    const totalHeadcount = totalMasons + totalHelpers + totalDept;

    const achievedTargets = targets.filter(t => t.status === 'ACHIEVED' || t.status === 'VERIFIED').length;
    const achievementPct = targets.length > 0 ? Math.round((achievedTargets / targets.length) * 100) : 0;
    const totalInwardValue = inward.reduce((acc, row) => acc + Number(row.totalAmount || 0), 0);
    const machineryRunningHours = machinery.reduce((acc, row) => acc + Number(row.totalHours || 0), 0);
    const dieselIssuedLitres = machinery.reduce((acc, row) => acc + Number(row.dieselIssuedLitres || 0), 0);

    setReportData({
      success: true,
      date,
      site: { id: 1, name: 'Main Residential Complex' },
      summary: {
        totalHeadcount,
        totalMasons,
        totalHelpers,
        totalDeptLabor: totalDept,
        contractorPresentCount: contractorAtt.filter(c => c.isPresent).length,
        contractorAbsentCount: contractorAtt.filter(c => !c.isPresent).length,
        targetsAssigned: targets.length,
        targetsAchieved: achievedTargets,
        achievementPct,
        inwardCount: inward.length,
        totalInwardValue,
        outwardCount: outward.length,
        machineryRunningHours,
        dieselIssuedLitres,
        safetyBriefingsCount: safety.length,
        incidentCount: safety.filter(s => s.incidentType && s.incidentType !== 'NONE').length,
        visitorCount: visitors.length
      },
      data: {
        progressLogs: (s.logs || []).filter(l => l.dateLogged && l.dateLogged.startsWith(date)),
        dailyTargets: targets,
        contractorAttendance: contractorAtt,
        departmentAttendance: deptAtt,
        materialInward: inward,
        materialOutward: outward,
        machineryLogs: machinery,
        safetyBriefings: safety,
        visitorPasses: visitors
      }
    });
  };

  useEffect(() => {
    fetchOperationalReport(selectedDate);
  }, [selectedDate]);

  const handleDateShift = (deltaDays) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const notifyUser = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleExportExcel = async () => {
    if (!reportData) return;
    try {
      await exportDailyReportToExcel({
        date: selectedDate,
        siteName: reportData.site?.name || 'ConstructTrack Site',
        summary: reportData.summary || {},
        contractorAtt: reportData.data?.contractorAttendance || [],
        deptAtt: reportData.data?.departmentAttendance || [],
        targets: reportData.data?.dailyTargets || [],
        materialInward: reportData.data?.materialInward || [],
        materialOutward: reportData.data?.materialOutward || [],
        machinery: reportData.data?.machineryLogs || [],
        safety: reportData.data?.safetyBriefings || [],
        visitorPasses: reportData.data?.visitorPasses || []
      });
      notifyUser('✅ Excel workbook downloaded successfully!');
    } catch (err) {
      console.error(err);
      notifyUser('❌ Failed to export Excel');
    }
  };

  const handleWhatsAppShare = () => {
    if (!reportData) return;
    const text = buildDailyWhatsAppSummary({
      date: selectedDate,
      siteName: reportData.site?.name || 'ConstructTrack Site',
      weather: weatherCondition,
      shift: shiftType,
      summary: reportData.summary || {},
      contractorAtt: reportData.data?.contractorAttendance || [],
      deptAtt: reportData.data?.departmentAttendance || [],
      targets: reportData.data?.dailyTargets || [],
      materialInward: reportData.data?.materialInward || [],
      machinery: reportData.data?.machineryLogs || [],
      safety: reportData.data?.safetyBriefings || [],
      narration: siteEngineerRemarks
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    notifyUser('📲 WhatsApp digest opened & copied to clipboard!');
  };

  const handlePrintDossier = () => {
    window.print();
  };

  const summary = reportData?.summary || {};
  const data = reportData?.data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 px-5 py-3 rounded-xl font-extrabold text-xs shadow-2xl shadow-amber-500/40 animate-bounce flex items-center space-x-2">
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TOP HEADER & CONTROL BAR */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <span className="p-1 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                <FileText className="w-4 h-4 text-sky-400" />
              </span>
              <span>Daily Operational Field Reports Suite</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                100% DB-DRIVEN
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Site Operations Heartbeat
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Consolidated DPR, Manpower Muster Roll, Store GRN Ledger, Plant Machinery & HSE Records
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
              title="Download 5-Sheet Excel Operational Workbook"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-700/30 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
              title="Send Structured WhatsApp Summary to Developer & Project Manager"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Digest</span>
            </button>

            <button
              onClick={handlePrintDossier}
              className="px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-600/30 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
              title="Print Formal Daily Field Dossier"
            >
              <Printer className="w-4 h-4" />
              <span>Print Dossier</span>
            </button>
          </div>
        </div>

        {/* DATE, SHIFT & WEATHER CONTROLS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          {/* Date Selector with Next/Prev */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => handleDateShift(-1)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 bg-transparent text-white font-black text-xs px-2 py-1 focus:outline-none cursor-pointer"
            />

            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition ${
                selectedDate === todayStr
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              TODAY
            </button>

            <button
              onClick={() => handleDateShift(1)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Shift Selector */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800 text-xs">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
              className="bg-transparent text-slate-200 font-bold w-full focus:outline-none cursor-pointer"
            >
              <option value="Day Shift (8:00 AM - 6:00 PM)" className="bg-slate-900 text-white">Day Shift (8:00 AM - 6:00 PM)</option>
              <option value="Morning Shift (6:00 AM - 2:00 PM)" className="bg-slate-900 text-white">Morning Shift (6:00 AM - 2:00 PM)</option>
              <option value="Evening Shift (2:00 PM - 10:00 PM)" className="bg-slate-900 text-white">Evening Shift (2:00 PM - 10:00 PM)</option>
              <option value="Overtime / Night Concrete Pour" className="bg-slate-900 text-white">Overtime / Night Pour</option>
            </select>
          </div>

          {/* Weather Selector */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800 text-xs">
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value)}
              className="bg-transparent text-slate-200 font-bold w-full focus:outline-none cursor-pointer"
            >
              <option value="Sunny & Clear" className="bg-slate-900 text-white">☀️ Sunny & Clear (32°C)</option>
              <option value="Cloudy / Overcast" className="bg-slate-900 text-white">⛅ Cloudy / Overcast (28°C)</option>
              <option value="Light Showers" className="bg-slate-900 text-white">🌦️ Light Showers (Work Ongoing)</option>
              <option value="Monsoon Heavy Rain" className="bg-slate-900 text-white">🌧️ Monsoon Rain (External Stoppage)</option>
              <option value="High Heatwave" className="bg-slate-900 text-white">🌡️ High Heatwave (&gt;40°C Hydration Advisory)</option>
              <option value="High Winds" className="bg-slate-900 text-white">💨 High Winds (Crane Restricted)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5 EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Manpower */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Manpower</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
            {summary.totalHeadcount || 0}
            <span className="text-xs font-bold text-slate-400 ml-1.5">workers</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{summary.totalMasons || 0} Masons • {summary.totalHelpers || 0} Helpers</span>
            <span className="text-amber-400 font-bold">{summary.totalDeptLabor || 0} In-House</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500/40"></div>
        </div>

        {/* Card 2: Physical Targets */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-sky-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Target Execution</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
            {summary.achievementPct || 0}%
            <span className="text-xs font-bold text-sky-400 ml-1.5">
              ({summary.targetsAchieved || 0}/{summary.targetsAssigned || 0})
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>{summary.targetsAssigned > 0 ? `${summary.targetsAssigned - (summary.targetsAchieved || 0)} pending review` : 'No targets set'}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500/40"></div>
        </div>

        {/* Card 3: Material Inward */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Store Inward (GRN)</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">
            ₹{((summary.totalInwardValue || 0) / 1000).toFixed(1)}k
            <span className="text-xs font-bold text-slate-400 ml-1.5">
              ({summary.inwardCount || 0} GRN)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>{summary.outwardCount || 0} issues to contractors</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/40"></div>
        </div>

        {/* Card 4: Machinery */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Plant & Machinery</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
            {summary.machineryRunningHours || 0}
            <span className="text-xs font-bold text-slate-400 ml-1.5">hrs run</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{summary.dieselIssuedLitres || 0} L Diesel issued</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500/40"></div>
        </div>

        {/* Card 5: Safety */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Safety & Gate</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
            {summary.incidentCount === 0 ? (
              <span className="text-emerald-400">0 Incidents</span>
            ) : (
              <span className="text-rose-400">{summary.incidentCount} Alert</span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{summary.safetyBriefingsCount || 0} TBT • {summary.visitorCount || 0} Visitors</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500/40"></div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-extrabold flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab('dpr')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition cursor-pointer ${
            activeTab === 'dpr'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Daily Progress (DPR)</span>
        </button>

        <button
          onClick={() => setActiveTab('manpower')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition cursor-pointer ${
            activeTab === 'manpower'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Labour & Muster Roll</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition cursor-pointer ${
            activeTab === 'materials'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>3. Material Inward (GRN) & Issues</span>
        </button>

        <button
          onClick={() => setActiveTab('machinery')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition cursor-pointer ${
            activeTab === 'machinery'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>4. Plant, Machinery & Fuel</span>
        </button>

        <button
          onClick={() => setActiveTab('safety_visitors')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition cursor-pointer ${
            activeTab === 'safety_visitors'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>5. Safety (TBT) & Visitors</span>
        </button>
      </div>

      {/* TAB CONTENT CONTAINER */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl min-h-[400px]">
        {/* ========================================================================= */}
        {/* TAB 1: DPR MASTER SUMMARY */}
        {/* ========================================================================= */}
        {activeTab === 'dpr' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Site Engineer Remarks Box */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="flex items-center space-x-1.5 text-sky-400">
                  <Award className="w-4 h-4" />
                  <span>Site Engineer Official Shift Remarks & Handover Notes</span>
                </span>
                <span className="text-[10px] text-slate-500">Auto-included in formal PDF / WhatsApp</span>
              </div>
              <textarea
                value={siteEngineerRemarks}
                onChange={(e) => setSiteEngineerRemarks(e.target.value)}
                rows={2}
                className="w-full bg-slate-900/90 border border-slate-700/80 text-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
                placeholder="Enter daily progress highlights, major milestones achieved, or site engineer sign-off remarks..."
              />
            </div>

            {/* Daily Physical Work Targets Execution Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Assigned Work Targets & Execution Progress</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {(data.dailyTargets || []).length} Targets Logged
                </span>
              </div>

              {(data.dailyTargets || []).length === 0 ? (
                <div className="bg-slate-950/50 border border-slate-800/80 p-8 rounded-2xl text-center text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs font-bold text-slate-300">No specific daily work targets logged for {selectedDate}</p>
                  <p className="text-[11px] text-slate-500">Assign morning work targets in the Daily Audit Hub to track micro-commitments.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Trade</th>
                        <th className="py-3 px-4">Target Description</th>
                        <th className="py-3 px-4">Qty (Sq.Ft)</th>
                        <th className="py-3 px-4">Manpower</th>
                        <th className="py-3 px-4">Status & Completion</th>
                        <th className="py-3 px-4">Blockers / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {(data.dailyTargets || []).map((target, idx) => (
                        <tr key={target.id || idx} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-white">Wing {target.wing}</span>
                            <span className="text-slate-400 text-[11px] block">Floor {target.floorNumber}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-amber-400">
                            {target.tradeType}
                          </td>
                          <td className="py-3 px-4 text-slate-200 font-medium max-w-xs">
                            {target.targetDescription}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                            {target.targetQuantitySqft || 1000} sq.ft
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                            {target.actualLaborCount || target.plannedLaborCount || 6} workers
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  target.status === 'ACHIEVED' || target.status === 'VERIFIED'
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                    : target.status === 'PARTIALLY_ACHIEVED'
                                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {target.status || 'ASSIGNED'}
                              </span>
                              <span className="font-bold text-white font-mono">
                                {target.actualCompletionPct !== undefined ? `${target.actualCompletionPct}%` : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs">
                            {target.delayReason ? (
                              <span className="text-rose-400 flex items-center space-x-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{target.delayReason}</span>
                              </span>
                            ) : (
                              <span className="text-slate-500">Smooth execution</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Daily Execution Logs / Photo Proof Stream */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Site Progress Logs & Execution Updates</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {(data.progressLogs || []).length} Logs Recorded
                </span>
              </div>

              {(data.progressLogs || []).length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-800/80 p-6 rounded-2xl text-center text-slate-400">
                  <p className="text-xs">No micro-level checklist progress logs recorded for {selectedDate}.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(data.progressLogs || []).map((log, idx) => (
                    <div key={log.id || idx} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">Task #{log.flat_task_id || log.flatTaskId}</span>
                        <span className="text-emerald-400 font-extrabold">+{log.completion_delta || log.quantityDelta || 10}% Delta</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {log.notes || 'Routine checklist update logged by field inspector.'}
                      </div>
                      {log.photo_url && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-800 max-h-32">
                          <img src={log.photo_url} alt="Progress proof" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LABOUR & MUSTER ROLL */}
        {/* ========================================================================= */}
        {activeTab === 'manpower' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Contractor Manpower Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Contractor Manpower Muster Roll</span>
                  </h3>
                  <p className="text-xs text-slate-400">Trade-wise contractor headcount, mason/helper ratio & attendance record</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-400">
                    {(data.contractorAttendance || []).reduce((acc, c) => acc + (c.totalWorkers || 0), 0)} Contractor Workers
                  </span>
                </div>
              </div>

              {(data.contractorAttendance || []).length === 0 ? (
                <div className="bg-slate-950/50 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-300">No contractor attendance logged for {selectedDate}</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Contractor Company</th>
                        <th className="py-3 px-4">Trade Scope</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Masons</th>
                        <th className="py-3 px-4 text-center">Helpers</th>
                        <th className="py-3 px-4 text-center">Total Deployed</th>
                        <th className="py-3 px-4">Contact Person / Absence Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {(data.contractorAttendance || []).map((c, idx) => (
                        <tr key={c.id || idx} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                            {c.companyName}
                          </td>
                          <td className="py-3 px-4 text-amber-400 font-semibold whitespace-nowrap">
                            {c.tradeType}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${
                                c.isPresent
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : 'bg-rose-950 text-rose-300 border-rose-800'
                              }`}
                            >
                              {c.isPresent ? 'PRESENT' : 'ABSENT'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                            {c.isPresent ? c.masonsCount : 0}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                            {c.isPresent ? c.helpersCount : 0}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-800 font-mono font-extrabold text-amber-400 rounded-md border border-slate-700">
                              {c.isPresent ? (c.masonsCount + c.helpersCount) : 0} workers
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {c.isPresent ? (
                              <span>{c.contactPerson ? `${c.contactPerson} (${c.phone})` : c.workAssigned || 'Active on floor'}</span>
                            ) : (
                              <span className="text-rose-400 font-bold">Reason: {c.absenceReason || 'Not Reported'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* In-House Departmental Laborers */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>In-House Departmental Laborers & General Helpers</span>
                  </h3>
                  <p className="text-xs text-slate-400">Directly employed site helpers, curing boys, and housekeeping personnel</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-sky-400">
                    {(data.departmentAttendance || []).filter(d => d.status !== 'ABSENT').length} In-House Helpers Present
                  </span>
                </div>
              </div>

              {(data.departmentAttendance || []).length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl text-center text-slate-400 text-xs">
                  No department helpers attendance logged for {selectedDate}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(data.departmentAttendance || []).map((d, idx) => (
                    <div key={d.id || idx} className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{d.laborerName}</div>
                          <div className="text-[10px] text-slate-400">{d.skillLevel} • ₹{d.dailyWageRate || 650}/day</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            d.status === 'PRESENT'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : d.status === 'HALF_DAY'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      {d.workDescription && (
                        <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                          <span className="text-slate-500 font-bold block text-[10px]">Work Assignment:</span>
                          {d.workDescription}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MATERIAL INWARD (GRN) & STORE ISSUES */}
        {/* ========================================================================= */}
        {activeTab === 'materials' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Inward Deliveries Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Package className="w-4 h-4 text-emerald-400" />
                    <span>Material Inward Register (Goods Receipt Note - GRN)</span>
                  </h3>
                  <p className="text-xs text-slate-400">Materials unloaded at site store with challan and vehicle verification</p>
                </div>
                <div className="text-right font-mono font-bold text-xs text-emerald-400">
                  Total Value: ₹{Number(summary.totalInwardValue || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {(data.materialInward || []).length === 0 ? (
                <div className="bg-slate-950/50 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
                  <Package className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-300">No material inward recorded for {selectedDate}</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Item & Category</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4">Challan / Vehicle</th>
                        <th className="py-3 px-4 text-right">Quantity Received</th>
                        <th className="py-3 px-4 text-right">Rate (₹)</th>
                        <th className="py-3 px-4 text-right">Total Amount</th>
                        <th className="py-3 px-4">Received By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {(data.materialInward || []).map((m, idx) => (
                        <tr key={m.id || idx} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-white block">{m.itemName}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{m.category}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                            {m.supplierName || 'Direct Vendor'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            <div>CH: {m.challanNumber || 'N/A'}</div>
                            <div className="text-slate-500">{m.vehicleNumber || '—'}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                            {m.quantityReceived} {m.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                            ₹{m.ratePerUnit || 0}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-400 whitespace-nowrap">
                            ₹{Number(m.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-[11px] whitespace-nowrap">
                            {m.receivedBy || 'Storekeeper'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Outward Issues Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                    <span>Material Store Issues (Issued to Work Fronts)</span>
                  </h3>
                  <p className="text-xs text-slate-400">Stock issued to trade contractors for daily consumption</p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {(data.materialOutward || []).length} Issue Slips
                </div>
              </div>

              {(data.materialOutward || []).length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl text-center text-slate-400 text-xs">
                  No material issue slips logged for {selectedDate}.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Item</th>
                        <th className="py-3 px-4">Issued To Contractor</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Quantity Issued</th>
                        <th className="py-3 px-4">Purpose / Activity</th>
                        <th className="py-3 px-4">Issued By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {(data.materialOutward || []).map((o, idx) => (
                        <tr key={o.id || idx} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{o.itemName}</td>
                          <td className="py-3 px-4 text-amber-400 font-medium whitespace-nowrap">{o.contractorName || 'Site Team'}</td>
                          <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                            Wing {o.wing || 'B1'}, Fl {o.floorNumber || 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                            {o.quantityIssued} {o.unit}
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-[11px]">{o.purpose || 'Civil Execution'}</td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">{o.issuedBy || 'Store In-Charge'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PLANT, MACHINERY & FUEL */}
        {/* ========================================================================= */}
        {activeTab === 'machinery' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <span>Plant, Heavy Equipment & Fuel (HSD) Log</span>
                </h3>
                <p className="text-xs text-slate-400">JCB, Tower Crane, Concrete Pump, Generator & Transit Mixer operational hours</p>
              </div>
              <div className="text-right font-mono text-xs">
                <span className="text-purple-400 font-bold mr-3">{summary.machineryRunningHours || 0} Total Hours</span>
                <span className="text-amber-400 font-bold">{summary.dieselIssuedLitres || 0} L Diesel</span>
              </div>
            </div>

            {(data.machineryLogs || []).length === 0 ? (
              <div className="bg-slate-950/50 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
                <Truck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-300">No machinery logs recorded for {selectedDate}</p>
                <p className="text-[11px] text-slate-500">Log equipment start/end meter hours in the Safety & Machinery tool.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Equipment Name</th>
                      <th className="py-3 px-4">Type / Reg No</th>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4 text-center">Start Hr</th>
                      <th className="py-3 px-4 text-center">End Hr</th>
                      <th className="py-3 px-4 text-center">Total Hours</th>
                      <th className="py-3 px-4 text-center">Diesel Issued</th>
                      <th className="py-3 px-4">Work Description & Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {(data.machineryLogs || []).map((eq, idx) => (
                      <tr key={eq.id || idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{eq.equipmentName}</td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                          {eq.equipmentType} {eq.registrationNo ? `(${eq.registrationNo})` : ''}
                        </td>
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{eq.operatorName || 'Site Operator'}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{eq.startHours || 0}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{eq.endHours || 0}</td>
                        <td className="py-3 px-4 text-center font-mono font-black text-purple-400 whitespace-nowrap">
                          {eq.totalHours || 0} hrs
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-amber-400 whitespace-nowrap">
                          {eq.dieselIssuedLitres || 0} L
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-[11px]">
                          <div>{eq.workDone || 'Operational'}</div>
                          {eq.location && <div className="text-slate-500 font-mono text-[10px]">Loc: {eq.location}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SAFETY BRIEFINGS & VISITORS */}
        {/* ========================================================================= */}
        {activeTab === 'safety_visitors' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Safety Briefings (TBT) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Toolbox Talks (TBT), Safety Briefings & Incident Register</span>
                  </h3>
                  <p className="text-xs text-slate-400">Daily HSE morning briefing topics, PPE compliance audits, and incident tracking</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-rose-400">
                    {(data.safetyBriefings || []).length} Briefings Logged
                  </span>
                </div>
              </div>

              {(data.safetyBriefings || []).length === 0 ? (
                <div className="bg-slate-950/50 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
                  <ShieldCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-300">No safety briefings recorded for {selectedDate}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(data.safetyBriefings || []).map((s, idx) => (
                    <div key={s.id || idx} className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-xs">{s.topic}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            s.incidentType && s.incidentType !== 'NONE'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {s.incidentType && s.incidentType !== 'NONE' ? s.incidentType : 'NO INCIDENTS'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Speaker: {s.speakerName || 'Safety Officer'}</span>
                        <span>Attendees: {s.attendeeCount || 0} Workers</span>
                        <span className="text-emerald-400 font-bold">PPE: {s.ppeCompliancePct || 100}%</span>
                      </div>
                      {s.hazardsIdentified && (
                        <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2.5 rounded-xl border border-amber-900/50">
                          <span className="font-bold block text-[10px] text-amber-400">Hazards / Preventive Measures:</span>
                          {s.hazardsIdentified}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visitor Gate Passes */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <DoorOpen className="w-4 h-4 text-amber-400" />
                    <span>Site Visitor & Consultant Gate Pass Register</span>
                  </h3>
                  <p className="text-xs text-slate-400">Authorized external visitors, structural consultants, VIP clients, and suppliers</p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {(data.visitorPasses || []).length} Visitors Logged
                </div>
              </div>

              {(data.visitorPasses || []).length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl text-center text-slate-400 text-xs">
                  No visitors or outside consultants registered on site for {selectedDate}.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Visitor Name</th>
                        <th className="py-3 px-4">Company / Organization</th>
                        <th className="py-3 px-4">Purpose</th>
                        <th className="py-3 px-4">Person To Meet</th>
                        <th className="py-3 px-4">Gate Pass No</th>
                        <th className="py-3 px-4">Vehicle No</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {(data.visitorPasses || []).map((v, idx) => (
                        <tr key={v.id || idx} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                            {v.visitorName}
                            {v.visitorPhone && <span className="text-[10px] text-slate-400 block font-normal">{v.visitorPhone}</span>}
                          </td>
                          <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{v.visitorCompany || 'Independent'}</td>
                          <td className="py-3 px-4 text-slate-200 text-[11px]">{v.purpose || 'Site Inspection'}</td>
                          <td className="py-3 px-4 text-amber-400 font-medium whitespace-nowrap">{v.personToMeet || 'Site In-Charge'}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-300 whitespace-nowrap">{v.gatePassNumber || 'GP-AUTO'}</td>
                          <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{v.vehicleNumber || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FORMAL PRINTABLE DOSSIER (Rendered on standard Window Print Ctrl+P) */}
      {/* ========================================================================= */}
      <div className="hidden print:block text-black bg-white p-8 space-y-6">
        <div className="border-b-2 border-black pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">ConstructTrack ERP</h1>
            <h2 className="text-base font-bold text-gray-700">Official Daily Operational Field Report (DPR)</h2>
          </div>
          <div className="text-right text-xs font-mono">
            <div><strong>Date:</strong> {selectedDate}</div>
            <div><strong>Shift:</strong> {shiftType}</div>
            <div><strong>Weather:</strong> {weatherCondition}</div>
          </div>
        </div>

        {/* Executive Abstract */}
        <div className="grid grid-cols-4 gap-4 border border-gray-400 p-3 text-xs">
          <div><strong>Total Manpower:</strong> {summary.totalHeadcount} workers</div>
          <div><strong>Masons / Helpers:</strong> {summary.totalMasons}M / {summary.totalHelpers}H</div>
          <div><strong>Work Targets:</strong> {summary.targetsAchieved}/{summary.targetsAssigned} ({summary.achievementPct}%)</div>
          <div><strong>HSE Safety:</strong> {summary.incidentCount === 0 ? 'Zero Incidents' : `${summary.incidentCount} Alert`}</div>
        </div>

        {/* Site Engineer Remarks */}
        <div className="text-xs border-l-4 border-gray-600 pl-3 italic">
          <strong>Site Engineer Observations:</strong> {siteEngineerRemarks}
        </div>

        {/* Work Targets */}
        <div>
          <h3 className="text-xs font-bold uppercase border-b border-black mb-2">1. Work Targets & Physical Progress</h3>
          <table className="w-full text-[10px] text-left border border-gray-400">
            <thead className="bg-gray-100 border-b border-gray-400 font-bold">
              <tr>
                <th className="p-1.5">Wing / Floor</th>
                <th className="p-1.5">Trade</th>
                <th className="p-1.5">Description</th>
                <th className="p-1.5">Target SqFt</th>
                <th className="p-1.5">Status</th>
                <th className="p-1.5">Blockers</th>
              </tr>
            </thead>
            <tbody>
              {(data.dailyTargets || []).map((t, idx) => (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="p-1.5">Wing {t.wing}-Fl{t.floorNumber}</td>
                  <td className="p-1.5 font-bold">{t.tradeType}</td>
                  <td className="p-1.5">{t.targetDescription}</td>
                  <td className="p-1.5">{t.targetQuantitySqft}</td>
                  <td className="p-1.5 font-bold">{t.status} ({t.actualCompletionPct || 0}%)</td>
                  <td className="p-1.5">{t.delayReason || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Manpower Roll */}
        <div>
          <h3 className="text-xs font-bold uppercase border-b border-black mb-2">2. Trade Contractor Manpower Roll</h3>
          <table className="w-full text-[10px] text-left border border-gray-400">
            <thead className="bg-gray-100 border-b border-gray-400 font-bold">
              <tr>
                <th className="p-1.5">Contractor Company</th>
                <th className="p-1.5">Trade Scope</th>
                <th className="p-1.5">Attendance</th>
                <th className="p-1.5">Masons</th>
                <th className="p-1.5">Helpers</th>
                <th className="p-1.5">Total</th>
              </tr>
            </thead>
            <tbody>
              {(data.contractorAttendance || []).map((c, idx) => (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="p-1.5 font-bold">{c.companyName}</td>
                  <td className="p-1.5">{c.tradeType}</td>
                  <td className="p-1.5">{c.isPresent ? 'PRESENT' : 'ABSENT'}</td>
                  <td className="p-1.5">{c.masonsCount}</td>
                  <td className="p-1.5">{c.helpersCount}</td>
                  <td className="p-1.5 font-bold">{c.totalWorkers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs font-bold border-t border-gray-300 mt-8">
          <div>
            <div className="border-t border-black pt-1">Site Engineer</div>
            <div className="text-[9px] text-gray-500 font-normal">Execution & Measurements</div>
          </div>
          <div>
            <div className="border-t border-black pt-1">QA / Safety In-Charge</div>
            <div className="text-[9px] text-gray-500 font-normal">HSE & Quality Clearance</div>
          </div>
          <div>
            <div className="border-t border-black pt-1">Project Manager / Developer</div>
            <div className="text-[9px] text-gray-500 font-normal">Approval & Commercial Sign-off</div>
          </div>
        </div>
      </div>
    </div>
  );
};
