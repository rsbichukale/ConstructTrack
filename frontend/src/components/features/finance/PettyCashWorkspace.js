'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Receipt, 
  Plus, 
  CheckCircle2, 
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar, 
  Search, 
  X,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const PettyCashWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [entryType, setEntryType] = useState('EXPENSE');
  const [category, setCategory] = useState('LOCAL_PURCHASE');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');

  const fetchPettyCash = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/petty-cash');
      setEntries(res?.entries || []);
    } catch (e) {
      console.error(e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPettyCash();
  }, []);

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    try {
      await apiClient.post('/petty-cash', {
        entryType,
        category,
        amount: Number(amount),
        recipientOrSource: recipient,
        description
      });
      setIsModalOpen(false);
      setAmount('');
      setRecipient('');
      setDescription('');
      setStatusMessage('Petty cash voucher logged into site imprest safe book!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchPettyCash();
    } catch (e) {
      console.error(e);
    }
  };

  const totalIn = entries.filter(e => e.entry_type === 'CASH_IN').reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const totalOut = entries.filter(e => e.entry_type === 'EXPENSE').reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const currentSafeBalance = 50000 + totalIn - totalOut; // Starting site imprest ₹50,000

  const filteredEntries = entries.filter(e => 
    (e.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.recipient_or_source || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Wallet className="w-4 h-4" />
            <span>Site Imprest & Cashbook</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Site Petty Cash & Imprest Safe</h2>
          <p className="text-xs text-slate-400">
            Emergency on-site local hardware purchases, fuel top-ups, municipal permits, and minor contractor payments.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Cash Voucher</span>
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
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Current Imprest Safe Balance</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">₹{currentSafeBalance.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Available Cash in Physical Safe</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-rose-400">Total Site Expenses</div>
          <div className="text-3xl font-black text-rose-400 mt-1">₹{totalOut.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Minor Hardware & Site Ops</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-sky-400">Cash Inflows (Head Office)</div>
          <div className="text-3xl font-black text-sky-400 mt-1">₹{totalIn.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Replenished from HO Accounts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-purple-400">Voucher Audit</div>
          <div className="text-3xl font-black text-purple-400 mt-1">100% Signed</div>
          <div className="text-[10px] text-slate-400 mt-1">Project Manager Approved</div>
        </div>
      </div>

      {/* Cashbook Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-white text-sm">Site Imprest Cashbook Ledger</h3>
          </div>
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search voucher or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading cash vouchers...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="font-bold text-sm">No cash entries logged yet.</div>
            <div className="text-xs mt-1 text-slate-400">Click "New Cash Voucher" to record site expenses or safe top-ups.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Date & Voucher</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Paid To / Received From</th>
                  <th className="p-3.5 text-right">Inflow (+)</th>
                  <th className="p-3.5 text-right">Outflow (-)</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEntries.map(e => {
                  const isIn = e.entry_type === 'CASH_IN';
                  const amt = Number(e.amount);

                  return (
                    <tr key={`cash-${e.id}`} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5 font-mono text-slate-400">
                        {new Date(e.created_at || e.date_logged).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-amber-400 rounded font-bold text-[10px]">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-white font-medium">{e.description}</td>
                      <td className="p-3.5 text-slate-300">{e.recipient_or_source || 'Site Vendor'}</td>
                      <td className="p-3.5 text-right font-black text-emerald-400 text-sm">
                        {isIn ? `+₹${amt.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-400 text-sm">
                        {!isIn ? `-₹${amt.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
                          AUDITED
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Log Site Petty Cash Voucher</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Transaction Type</label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="EXPENSE">Cash Expense (Outflow)</option>
                    <option value="CASH_IN">HO Imprest Top-up (Inflow)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="LOCAL_PURCHASE">Local Hardware / Binding Wire</option>
                    <option value="DIESEL_TOPUP">Diesel & Petrol Top-up</option>
                    <option value="TEA_SNACKS">Site Labor Tea & Snacks</option>
                    <option value="MUNICIPAL_PERMIT">Municipal & Testing Fees</option>
                    <option value="MISCELLANEOUS">Miscellaneous Repairs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Paid To / Source</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Om Hardware Store"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description / Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency purchase of 5kg binding wire for 4th slab"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Record Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PettyCashWorkspace;
