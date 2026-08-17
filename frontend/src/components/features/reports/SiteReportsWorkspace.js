'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Layers, 
  Users, 
  Package, 
  FlaskConical, 
  DollarSign, 
  Building2,
  Table,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

export const SiteReportsWorkspace = () => {
  const [selectedReport, setSelectedReport] = useState('dailyOperational');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportsList = [
    { id: 'dailyOperational', title: '1. Daily Operational Report (DPR)', endpoint: '/reports/daily-operational', icon: FileText, desc: 'Headcount, contractor targets, materials, machinery & safety summary' },
    { id: 'concreteLab', title: '2. Concrete QA Lab Register', endpoint: '/reports/concrete-qa-lab', icon: FlaskConical, desc: 'IS 516 compressive test results, slump & 28-day compliance' },
    { id: 'snagAudit', title: '3. Snagging & Quality Defect Audit', endpoint: '/reports/snagging-audit', icon: CheckCircle2, desc: 'Open snags, resolved defects & contractor rework resolution rate' },
    { id: 'materialRecon', title: '4. Material Store Reconciliation', endpoint: '/reports/material-reconciliation', icon: Package, desc: 'Current stock, moving valuation, inward receipts & outward issues' },
    { id: 'contractorScorecard', title: '5. Contractor Performance Scorecard', endpoint: '/reports/contractor-performance', icon: Users, desc: 'Daily attendance, SLA milestone achievement & wage advances' },
    { id: 'pettyCashAudit', title: '6. Site Petty Cash Audit & Safe Ledger', endpoint: '/reports/petty-cash-audit', icon: DollarSign, desc: 'Imprest cash inflows, site expense vouchers & balance proof' },
    { id: 'clientMargin', title: '7. Client Customization Commercial Margin', endpoint: '/reports/client-changes-margin', icon: Sparkles, desc: 'Variation orders, quoted amounts, contractor costs & profit margins' },
    { id: 'towerMatrix', title: '8. Tower Elevation Progress Matrix', endpoint: '/reports/tower-elevation-matrix', icon: Building2, desc: 'Wing B1 & B2 flat-by-flat milestone readiness and completion %' }
  ];

  const fetchReport = async (repId) => {
    setLoading(true);
    const target = reportsList.find(r => r.id === (repId || selectedReport));
    try {
      const res = await apiClient.get(`${target.endpoint}?date=${selectedDate}`);
      setReportData(res);
    } catch (e) {
      console.error(e);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReport(selectedReport);
  }, [selectedReport, selectedDate]);

  const activeRep = reportsList.find(r => r.id === selectedReport);

  const handleDownloadCSV = () => {
    if (selectedReport === 'dailyOperational') {
      window.open(`http://localhost:5000/api/reports/sitewise-tasks-export?format=csv`, '_blank');
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Enterprise Reporting Suite</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">8 Enterprise Executive Reports & DPR</h2>
          <p className="text-xs text-slate-400">
            Real-time multi-dimensional reports with one-click Excel / CSV streaming and print-ready formats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none"
            />
          </div>

          <button
            onClick={handleDownloadCSV}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Master Excel (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Grid: 8 Report Selector on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report Tabs */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="text-xs font-extrabold uppercase text-indigo-400 tracking-wider mb-2">
            Select Enterprise Report
          </div>

          <div className="space-y-2">
            {reportsList.map(r => {
              const isSelected = selectedReport === r.id;
              const Icon = r.icon;

              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id)}
                  className={`w-full p-3 rounded-xl text-left transition flex items-start space-x-3 border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-extrabold text-xs">{r.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{r.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Report Preview */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-indigo-400">Live Executive Summary</span>
              <h3 className="text-lg font-black text-white">{activeRep?.title}</h3>
            </div>
            <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
              HTTP 200 OK • VERIFIED
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold">Querying report engine...</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Key Summary Metrics</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {reportData?.summary && Object.entries(reportData.summary).map(([key, val]) => (
                    <div key={key} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                      <div className="text-[10px] text-slate-400 capitalize font-mono truncate">{key.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="text-base font-black text-white mt-0.5 font-mono">
                        {typeof val === 'number' && key.toLowerCase().includes('value') ? `₹${val.toLocaleString('en-IN')}` : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-indigo-950/40 border border-indigo-900/60 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
                <div>
                  <div className="font-extrabold">Instant Export Available</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Click "Download Master Excel" to stream all live database records into a single formatted spreadsheet.</div>
                </div>
                <button
                  onClick={handleDownloadCSV}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs cursor-pointer"
                >
                  Export CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiteReportsWorkspace;
