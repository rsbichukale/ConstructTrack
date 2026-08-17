'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Filter, 
  CheckCircle2, 
  Building2, 
  Layers, 
  Users, 
  Clock, 
  DollarSign, 
  RefreshCw,
  X
} from 'lucide-react';
import { getAppState } from '../../../lib/dbState';

export const SitewiseExcelExportModal = ({ isOpen, onClose }) => {
  const state = getAppState();
  const [selectedWing, setSelectedWing] = useState('ALL');
  const [selectedTrade, setSelectedTrade] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedContractor, setSelectedContractor] = useState('ALL');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const tradesList = (state.trades || []).map(t => t.trade_name || t.tradeName || t.name).filter(Boolean);

  const handleDownloadCSV = () => {
    setIsDownloading(true);
    try {
      const params = new URLSearchParams({
        format: 'csv',
        wing: selectedWing,
        tradeType: selectedTrade,
        status: selectedStatus,
        contractorId: selectedContractor
      });

      const exportUrl = `http://localhost:5000/api/reports/sitewise-tasks-export?${params.toString()}`;
      const link = document.createElement('a');
      link.href = exportUrl;
      link.setAttribute('download', `Sitewise_Tasks_Master_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        onClose();
      }, 800);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                Export Complete Sitewise Master Excel Sheet
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Export all 6,832 micro-tasks with live completion status, room dimensions, trades & contractor billing values.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wing Scope */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Wing / Tower Scope
            </label>
            <select
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none"
            >
              <option value="ALL">All Wings (B1 & B2 • 70 Flats)</option>
              <option value="B1">Wing B1 (35 Flats)</option>
              <option value="B2">Wing B2 (35 Flats)</option>
            </select>
          </div>

          {/* Trade Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Trade Filter
            </label>
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none"
            >
              <option value="ALL">All Trades (Masonry, Plaster, Tiles, Electrical, Plumbing...)</option>
              {tradesList.map((tr, idx) => (
                <option key={`tr-opt-${idx}`} value={tr}>{tr}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Execution Stage Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none"
            >
              <option value="ALL">All Execution Statuses (0% to 100%)</option>
              <option value="APPROVED">Verified & Approved (100%)</option>
              <option value="COMPLETED">Completed by Contractor</option>
              <option value="INSPECTED">Inspected / Quality Checked</option>
              <option value="IN_PROGRESS">In Progress (1% - 99%)</option>
              <option value="WORK_STARTED">Work Started Today</option>
              <option value="ASSIGNED">Assigned to Contractor</option>
              <option value="NOT_STARTED">Not Started (0%)</option>
              <option value="REWORK">Active Blocker / Rework</option>
            </select>
          </div>

          {/* Contractor Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Contractor Agency
            </label>
            <select
              value={selectedContractor}
              onChange={(e) => setSelectedContractor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-bold text-white outline-none"
            >
              <option value="ALL">All Subcontractors</option>
              {(state.contractors || []).map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName || c.company_name} ({c.tradeType || 'General'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comprehensive Export Fields Overview */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider block">
            Included Master Excel Columns (28 Data Fields):
          </span>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400">
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Task ID</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Project Name</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Wing</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Floor Number</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Flat Number</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Room Zone</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Phase Name</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Micro-Task Name</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Trade Type</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Contractor Name</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Contract Unit Rate (₹/sq.ft)</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Room Dimensions (L×W×H)</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">BOQ Quantity</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Completion Status</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Completion %</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Earned Amount (₹)</span>
            <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Execution Timestamps</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={isDownloading}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            {isDownloading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDownloading ? 'Generating Spreadsheet...' : 'Download Master Excel (CSV)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SitewiseExcelExportModal;
