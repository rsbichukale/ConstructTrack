'use client';

import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  CreditCard, 
  UserCheck, 
  X,
  FileCheck,
  Building,
  RefreshCw,
  Search
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const WageAdvancesWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [contractorId, setContractorId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [purpose, setPurpose] = useState('Weekly Food & Kharcha Advance');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');

  const contractors = state.contractors || [];

  const fetchAdvances = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/contractors/advances');
      setAdvances(res?.advances || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvances();
  }, []);

  const handleCreateAdvance = async (e) => {
    e.preventDefault();
    if (!contractorId || !amount) return;

    try {
      await apiClient.post('/contractors/advances', {
        contractorId: Number(contractorId),
        amount: Number(amount),
        paymentMode,
        purpose,
        recipientPerson: recipient,
        notes
      });
      setIsModalOpen(false);
      setAmount('');
      setRecipient('');
      setNotes('');
      setStatusMessage('Wage advance voucher disbursed and logged successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchAdvances();
    } catch (e) {
      console.error(e);
    }
  };

  const totalDisbursed = advances.reduce((acc, a) => acc + Number(a.amount || 0), 0);
  const cashDisbursed = advances.filter(a => a.payment_mode === 'CASH').reduce((acc, a) => acc + Number(a.amount || 0), 0);
  const onlineDisbursed = advances.filter(a => a.payment_mode !== 'CASH').reduce((acc, a) => acc + Number(a.amount || 0), 0);

  const filteredAdvances = advances.filter(a =>
    (a.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.purpose || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Receipt className="w-4 h-4" />
            <span>Labor Kharcha & Wage Advances</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Labor Wage Advances (Kharcha) Ledger</h2>
          <p className="text-xs text-slate-400">
            Track weekly grocery and cash advances to contractors $\rightarrow$ Automatically deducted from Running Account (RA) Bills.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Disburse Wage Advance</span>
        </button>
      </div>

      {statusMessage && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Kharcha Disbursed</div>
          <div className="text-3xl font-black text-white mt-1">₹{totalDisbursed.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-1">{advances.length} Advance Vouchers</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-amber-400">Cash Imprest Payouts</div>
          <div className="text-3xl font-black text-amber-400 mt-1">₹{cashDisbursed.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Disbursed via Site Safe</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-sky-400">Bank / UPI Transfers</div>
          <div className="text-3xl font-black text-sky-400 mt-1">₹{onlineDisbursed.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Direct Contractor Account</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-purple-400">RA Bill Recovery Status</div>
          <div className="text-3xl font-black text-purple-400 mt-1">100%</div>
          <div className="text-[10px] text-slate-400 mt-1">Auto-Deducted on Submission</div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-white text-sm">Disbursed Wage Advances Ledger</h3>
          </div>
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search contractor or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading wage advances...</div>
        ) : filteredAdvances.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="font-bold text-sm">No wage advance records found.</div>
            <div className="text-xs mt-1 text-slate-400">Click "Disburse Wage Advance" to log contractor Kharcha vouchers.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Date & Voucher</th>
                  <th className="p-3.5">Subcontractor Agency</th>
                  <th className="p-3.5">Purpose</th>
                  <th className="p-3.5">Payment Mode</th>
                  <th className="p-3.5">Recipient</th>
                  <th className="p-3.5 text-right">Amount (₹)</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAdvances.map(a => (
                  <tr key={`adv-${a.id}`} className="hover:bg-slate-850/50 transition">
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(a.date_logged || a.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <div className="font-extrabold text-white">{a.company_name}</div>
                      <div className="text-[10px] text-slate-400">{a.trade_type}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium">{a.purpose}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-md font-mono text-[10px]">
                        {a.payment_mode}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">{a.recipient_person || 'Supervisor'}</td>
                    <td className="p-3.5 text-right font-black text-sm text-emerald-400">
                      ₹{Number(a.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
                        {a.status || 'DISBURSED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Disburse Labor Wage Advance (Kharcha)</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdvance} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contractor Agency</label>
                <select
                  value={contractorId}
                  onChange={(e) => setContractorId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="">Select Contractor...</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name || c.companyName} ({c.trade_type || c.tradeType})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Advance Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="CASH">Cash (Petty Safe)</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="NEFT">Bank NEFT/RTGS</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Purpose / Note</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Recipient Supervisor Person</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patel (Mukadam)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Disburse Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WageAdvancesWorkspace;
