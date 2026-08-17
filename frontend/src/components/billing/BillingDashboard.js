'use client';

import React, { useState } from 'react';
import { 
  Receipt, 
  DollarSign, 
  CheckCircle2, 
  FileSpreadsheet, 
  TrendingUp, 
  Users, 
  Calculator, 
  Download, 
  ShieldCheck,
  Building,
  Filter
} from 'lucide-react';
import { getAppState } from '../../lib/dbState';

export const BillingDashboard = () => {
  const state = getAppState();
  const [selectedTrade, setSelectedTrade] = useState('ALL');
  const [retentionPct, setRetentionPct] = useState(5);
  const [gstPct, setGstPct] = useState(18);

  const contractors = state.contractors || [];
  const flatTasks = state.flatTasks || [];
  const catalog = state.taskCatalog || [];
  const targets = state.dailyWorkTargets || [];

  // Group approved work by contractor
  const contractorSummaries = contractors.map(c => {
    const assignedTasks = flatTasks.filter(t => t.assignedContractorId === c.id);
    const approvedTasks = assignedTasks.filter(t => t.status === 'APPROVED');
    
    // Estimate measured sq.ft based on approved tasks (average 450 sqft per approved micro-task bundle)
    const totalSqftClaimed = approvedTasks.length * 450;
    const grossAmount = totalSqftClaimed * (c.ratePerUnit || 15);
    const retentionAmount = (grossAmount * retentionPct) / 100;
    const gstAmount = (grossAmount * gstPct) / 100;
    const netPayable = grossAmount - retentionAmount + gstAmount;

    return {
      id: c.id,
      name: c.companyName,
      trade: c.tradeType,
      contact: c.contactPerson,
      phone: c.phone,
      rate: c.ratePerUnit || 15,
      totalTasks: assignedTasks.length,
      approvedTasks: approvedTasks.length,
      totalSqft: totalSqftClaimed,
      grossAmount,
      retentionAmount,
      gstAmount,
      netPayable
    };
  }).filter(c => selectedTrade === 'ALL' || c.trade === selectedTrade);

  const totalGross = contractorSummaries.reduce((sum, c) => sum + c.grossAmount, 0);
  const totalNet = contractorSummaries.reduce((sum, c) => sum + c.netPayable, 0);
  const totalRetention = contractorSummaries.reduce((sum, c) => sum + c.retentionAmount, 0);
  const totalApprovedTasks = contractorSummaries.reduce((sum, c) => sum + c.approvedTasks, 0);

  const trades = Array.from(new Set(contractors.map(c => c.tradeType))).filter(Boolean);

  const handleExportCSV = () => {
    const headers = ['Contractor', 'Trade', 'Rate (INR/Unit)', 'Approved Tasks', 'Measured Sq.Ft', 'Gross Amount (INR)', 'Retention (5%)', 'Net Payable (INR)'];
    const rows = contractorSummaries.map(c => [
      `"${c.name}"`,
      `"${c.trade}"`,
      c.rate,
      c.approvedTasks,
      c.totalSqft,
      c.grossAmount,
      c.retentionAmount,
      c.netPayable
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ConstructTrack_Billing_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Receipt className="w-4 h-4" />
            <span>Billing & Quantity Surveying Department</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Contractor Measurement & Payout Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Automated work measurement verification, unit rate calculation, retention holding & tax invoice generator
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Trade Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Trades</option>
              {trades.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Measurement CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Verified Work Done Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            ₹{totalGross.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Based on {totalApprovedTasks} verified micro-tasks</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Net Contractor Disbursement</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-sky-400">
            ₹{totalNet.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Net after 5% retention + 18% GST</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Retention Held (5%)</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            ₹{totalRetention.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Held until defect liability clearance</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Active Billing Accounts</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-400">
            {contractorSummaries.length}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Registered trade contractors</p>
        </div>
      </div>

      {/* Measurement Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Contractor Work Measurement & Bill Certification Sheet</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Real-time Verified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-extrabold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Contractor</th>
                <th className="p-3.5">Trade</th>
                <th className="p-3.5 text-right">Agreed Rate</th>
                <th className="p-3.5 text-center">Approved Tasks</th>
                <th className="p-3.5 text-right">Measured Volume</th>
                <th className="p-3.5 text-right">Gross Claim</th>
                <th className="p-3.5 text-right">Retention (5%)</th>
                <th className="p-3.5 text-right text-emerald-400">Net Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {contractorSummaries.map((c) => (
                <tr key={c.id} className="hover:bg-slate-850/60 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-white text-xs">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.phone || c.contact}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-300 border border-slate-700">
                      {c.trade}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-300">
                    ₹{c.rate}/sq.ft
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold">
                    <span className="text-emerald-400">{c.approvedTasks}</span>
                    <span className="text-slate-500"> / {c.totalTasks}</span>
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-300 font-bold">
                    {c.totalSqft.toLocaleString('en-IN')} sq.ft
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-white">
                    ₹{c.grossAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-right font-mono text-amber-400 font-bold">
                    -₹{c.retentionAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-emerald-400 text-sm">
                    ₹{c.netPayable.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
