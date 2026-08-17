'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Receipt, 
  CheckCircle2, 
  Calendar, 
  User, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Wallet 
} from 'lucide-react';
import { fetchPettyCashSummary, recordCashEntry } from '../../lib/backendSync';

export const PettyCashHub = () => {
  const [cashData, setCashData] = useState({ entries: [], totalCashIn: 0, totalExpenses: 0, currentBalance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState('EXPENSE');
  const [category, setCategory] = useState('SITE_EXPENSE');
  const [amount, setAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [description, setDescription] = useState('');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadCash = async () => {
    setIsLoading(true);
    const data = await fetchPettyCashSummary();
    setCashData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadCash();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description.trim()) return;
    setIsSubmitting(true);
    try {
      await recordCashEntry({
        entryType,
        category,
        amount: Number(amount),
        paidTo: paidTo.trim() || (entryType === 'CASH_IN' ? 'Site Cash Box' : 'Local Vendor'),
        description: description.trim(),
        voucherNumber: voucherNumber.trim() || null
      });
      setFeedbackMsg(`Cash entry of ₹${Number(amount).toLocaleString('en-IN')} logged successfully.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
      setIsModalOpen(false);
      setAmount('');
      setPaidTo('');
      setDescription('');
      setVoucherNumber('');
      await loadCash();
    } catch (err) {
      alert('Error recording cash: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Wallet className="w-4 h-4" />
            <span>SiteOps Financial Ledger</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Site Petty Cash Book & Expense Vouchers
          </h2>
          <p className="text-xs text-slate-400">
            Track daily imprest top-ups, emergency site hardware purchases, labor refreshments, and running cash box balance
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Cash Transaction</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Current Cash Box Balance</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            ₹{(cashData.currentBalance || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Available physical cash on site</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Imprest Top-Ups</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            +₹{(cashData.totalCashIn || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Received from Head Office</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Site Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black font-mono text-rose-400">
            -₹{(cashData.totalExpenses || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Approved vouchers paid</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
          Recent Vouchers & Cash Entries
        </h3>

        {(cashData.entries || []).map((entry) => {
          const isCashIn = (entry.entry_type || entry.entryType) === 'CASH_IN';

          return (
            <div
              key={entry.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 transition"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  isCashIn ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {isCashIn ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                      {entry.voucherNumber || entry.voucher_number || 'VCH'}
                    </span>
                    <h4 className="font-bold text-white text-xs">{entry.description}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Paid to / Source: <strong className="text-slate-300">{entry.paidTo || entry.paid_to}</strong> • Logged by: {entry.recordedBy || entry.recorded_by}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className={`font-black text-sm ${isCashIn ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isCashIn ? '+' : '-'}₹{Number(entry.amount || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500">
                  {entry.entryDate || entry.entry_date}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Cash Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-md space-y-4">
            <h3 className="font-black text-white text-base">New Petty Cash Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryType('EXPENSE')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    entryType === 'EXPENSE'
                      ? 'bg-rose-950 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🔴 Expense (Cash Out)
                </button>

                <button
                  type="button"
                  onClick={() => setEntryType('CASH_IN')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    entryType === 'CASH_IN'
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🟢 Top-Up (Cash In)
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="3200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                >
                  <option value="SITE_EXPENSE">Site Expense (General)</option>
                  <option value="EMERGENCY_PURCHASE">Emergency Hardware Purchase</option>
                  <option value="LABOR_TEA">Labor Refreshments / Tea</option>
                  <option value="FUEL">Emergency Fuel / Generator Diesel</option>
                  <option value="ADMIN_TOPUP">Head Office Top-Up</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Paid To / Recipient</label>
                <input
                  type="text"
                  placeholder="e.g. Omkar Electrical Hardware"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Expense Purpose & Voucher Notes *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 100m Submersible wire for slab curing pump..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  {isSubmitting ? 'Saving...' : 'Save Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
