'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Key, 
  Award, 
  Building,
  Camera,
  FileSpreadsheet,
  Download,
  Printer
} from 'lucide-react';
import { getAppState } from '../../lib/dbState';
import { DailyOperationalHub } from '../reports/DailyOperationalHub';
import { ConcreteQAReportSection } from '../reports/ConcreteQAReportSection';
import { SnaggingDefectAuditSection } from '../reports/SnaggingDefectAuditSection';
import { MaterialReconciliationSection } from '../reports/MaterialReconciliationSection';
import { ContractorPerformanceSection } from '../reports/ContractorPerformanceSection';
import { PettyCashAuditSection } from '../reports/PettyCashAuditSection';
import { ClientChangesCommercialSection } from '../reports/ClientChangesCommercialSection';
import { TowerExecutionMatrixSection } from '../reports/TowerExecutionMatrixSection';
import { ContractorDprSection } from './siteReports/ContractorDprSection';
import { ContractorSlaSection } from './siteReports/ContractorSlaSection';
import { HandoverReadinessSection } from './siteReports/HandoverReadinessSection';
import { DailyPhotoProgressSection } from './siteReports/DailyPhotoProgressSection';
import { exportProjectToExcel } from '../../lib/excelExporter';
import { generateFlatInspectionPdf } from '../../lib/flatPdfReportGenerator';

export const SiteReportsCenter = () => {
  const state = getAppState();
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeReportTab, setActiveReportTab] = useState('dailyOperations');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [userNarration, setUserNarration] = useState('All trades worked on target schedule today across Wings B1 & B2.');

  const [isFlatPdfModalOpen, setIsFlatPdfModalOpen] = useState(false);
  const [selectedFlatId, setSelectedFlatId] = useState((state.flats || [])[0]?.id || 1);

  const handleExportExcel = async () => {
    await exportProjectToExcel(state);
  };

  const handleDownloadFlatPdf = () => {
    generateFlatInspectionPdf(state, selectedFlatId);
    setIsFlatPdfModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <Building className="w-4 h-4" />
              <span>ConstructTrack Enterprise Reporting Center</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Civil Operations, QA/QC Lab, Materials, Finance & Handover Analytics
            </h2>
            <p className="text-xs text-slate-400">
              Official PDF/WhatsApp Statements, Concrete Compression Curves, Stock Ledger, Contractor Debits & Commercial Audits
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition cursor-pointer"
              title="Download Full Project Master Matrix (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>📊 Master Excel Matrix</span>
            </button>

            <button
              onClick={() => setIsFlatPdfModalOpen(true)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-600/30 flex items-center space-x-1.5 transition cursor-pointer"
              title="Generate Detailed Room-Wise Flat PDF Report"
            >
              <Printer className="w-4 h-4" />
              <span>📄 Flat PDF Report</span>
            </button>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-extrabold flex-wrap gap-1.5">
          <button
            onClick={() => setActiveReportTab('dailyOperations')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              activeReportTab === 'dailyOperations' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📋 Daily Field DPR</span>
          </button>

          <button
            onClick={() => setActiveReportTab('qaLab')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              activeReportTab === 'qaLab' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🔬 Concrete QA Lab</span>
          </button>

          <button
            onClick={() => setActiveReportTab('snagging')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              activeReportTab === 'snagging' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚠️ Defect Snagging</span>
          </button>

          <button
            onClick={() => setActiveReportTab('materials')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              activeReportTab === 'materials' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📦 Materials & Stock</span>
          </button>

          <button
            onClick={() => setActiveReportTab('contractorSla')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              activeReportTab === 'contractorSla' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>⭐ Contractor SLA</span>
          </button>

          <button
            onClick={() => setActiveReportTab('pettyCash')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              activeReportTab === 'pettyCash' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>💰 Petty Cash Book</span>
          </button>

          <button
            onClick={() => setActiveReportTab('clientChanges')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              activeReportTab === 'clientChanges' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>✨ Client Changes</span>
          </button>

          <button
            onClick={() => setActiveReportTab('towerMatrix')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              activeReportTab === 'towerMatrix' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>🏢 Tower Matrix</span>
          </button>

          <button
            onClick={() => setActiveReportTab('photoProgress')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 transition cursor-pointer ${
              activeReportTab === 'photoProgress' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-300" />
            <span>📷 Photo Log</span>
          </button>
        </div>
      </div>

      {activeReportTab === 'dailyOperations' && <DailyOperationalHub />}
      {activeReportTab === 'qaLab' && <ConcreteQAReportSection />}
      {activeReportTab === 'snagging' && <SnaggingDefectAuditSection />}
      {activeReportTab === 'materials' && <MaterialReconciliationSection />}
      {activeReportTab === 'contractorSla' && <ContractorPerformanceSection />}
      {activeReportTab === 'pettyCash' && <PettyCashAuditSection />}
      {activeReportTab === 'clientChanges' && <ClientChangesCommercialSection />}
      {activeReportTab === 'towerMatrix' && <TowerExecutionMatrixSection />}

      {activeReportTab === 'photoProgress' && (
        <DailyPhotoProgressSection
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      {isFlatPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center space-x-2">
                <Printer className="w-5 h-5 text-sky-400" />
                <span>Select Flat for Room PDF Report</span>
              </h3>
              <button onClick={() => setIsFlatPdfModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Select Target Flat</label>
              <select
                value={selectedFlatId}
                onChange={(e) => setSelectedFlatId(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none"
              >
                {(state.flats || []).map(f => (
                  <option key={f.id} value={f.id}>
                    Wing {f.wing} • Floor {f.floorNumber} • Flat {f.flatNumber} ({f.flatType})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsFlatPdfModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-400 text-xs rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadFlatPdf}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black rounded-xl shadow flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
