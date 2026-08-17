import React, { useState } from 'react';
import { DollarSign, FileCheck, ArrowUpRight, Plus, RefreshCw, Wallet } from 'lucide-react';
import { useFinance } from '../../../hooks/useFinance';
import { KPICard } from '../../ui/KPICard';
import { DataTable } from '../../ui/DataTable';
import { StatusBadge } from '../../ui/StatusBadge';
import { ActionButton } from '../../ui/ActionButton';
import { ModalDialog } from '../../ui/ModalDialog';

import { RABillingWorkspace } from '../billing/RABillingWorkspace';

export const FinanceWorkspace = () => {
  const { pettyCash, clientChanges, loading, createPettyCashEntry, approveClientChange, refresh } = useFinance();
  const [activeSubTab, setActiveSubTab] = useState('cash');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);

  // Cash form
  const [entryType, setEntryType] = useState('EXPENSE');
  const [category, setCategory] = useState('Site Sundries');
  const [amount, setAmount] = useState(1500);
  const [paidTo, setPaidTo] = useState('');
  const [description, setDescription] = useState('');
  const [voucherNo, setVoucherNo] = useState('');

  const handleCreateCash = async (e) => {
    e.preventDefault();
    await createPettyCashEntry({ entryType, category, amount: Number(amount), paidTo, description, voucherNumber: voucherNo });
    setIsCashModalOpen(false);
  };

  const cashColumns = [
    { key: 'entry_date', header: 'Date', render: (val) => val ? String(val).split('T')[0] : '—' },
    { key: 'entry_type', header: 'Type', render: (val) => <span className={`font-bold ${val === 'CASH_IN' ? 'text-emerald-400' : 'text-rose-400'}`}>{val}</span> },
    { key: 'category', header: 'Category' },
    { key: 'amount', header: 'Amount (₹)', render: (val) => `₹${Number(val).toLocaleString()}` },
    { key: 'paid_to', header: 'Paid To / Received From' },
    { key: 'description', header: 'Purpose / Details' },
    { key: 'voucher_number', header: 'Voucher No' }
  ];

  const changesColumns = [
    { key: 'flat_number', header: 'Flat', render: (val, row) => `${row.wing || 'B1'}-${val || 'Unit'}` },
    { key: 'change_title', header: 'Variation Title' },
    { key: 'trade_type', header: 'Trade' },
    { key: 'quoted_amount', header: 'Client Quoted (₹)', render: (val) => `₹${Number(val).toLocaleString()}` },
    { key: 'contractor_cost', header: 'Contractor Cost (₹)', render: (val) => `₹${Number(val).toLocaleString()}` },
    {
      key: 'margin',
      header: 'Developer Profit (₹)',
      render: (_, row) => <span className="font-bold text-emerald-400">₹{(Number(row.quoted_amount) - Number(row.contractor_cost)).toLocaleString()}</span>
    },
    { key: 'status', header: 'Approval Status', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'actions',
      header: 'Action',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => approveClientChange(row.id, 'APPROVED', 'developer')}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300"
        >
          Approve Margin
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-amber-500" />
            Finance, Site Imprest & Commercial Variations
          </h2>
          <p className="text-xs text-slate-400">Site petty cash register and 3-tier client modification profit margin tracker.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button onClick={() => setActiveSubTab('cash')} className={`rounded-lg px-3 py-1 text-xs font-semibold ${activeSubTab === 'cash' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
              Petty Cash Register
            </button>
            <button onClick={() => setActiveSubTab('changes')} className={`rounded-lg px-3 py-1 text-xs font-semibold ${activeSubTab === 'changes' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
              Client Variations
            </button>
            <button onClick={() => setActiveSubTab('billing')} className={`rounded-lg px-3 py-1 text-xs font-semibold ${activeSubTab === 'billing' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
              Subcontractor RA Bills
            </button>
          </div>
          {activeSubTab === 'cash' && (
            <ActionButton onClick={() => setIsCashModalOpen(true)} icon={Plus} size="sm">
              Log Cash Entry
            </ActionButton>
          )}
          <ActionButton onClick={refresh} icon={RefreshCw} loading={loading} variant="ghost" size="sm">
            Refresh
          </ActionButton>
        </div>
      </div>

      {activeSubTab === 'billing' ? (
        <RABillingWorkspace />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KPICard title="Total Cash In (Imprest)" value={`₹${Number(pettyCash?.summary?.totalCashIn || 0).toLocaleString()}`} icon={Wallet} color="emerald" subtitle="Top-ups received" />
            <KPICard title="Total Expenses" value={`₹${Number(pettyCash?.summary?.totalExpense || 0).toLocaleString()}`} icon={ArrowUpRight} color="rose" subtitle="Site disbursements" />
            <KPICard title="Cash Safe Balance" value={`₹${Number(pettyCash?.summary?.netBalance || 0).toLocaleString()}`} icon={DollarSign} color="amber" subtitle="Available on site" />
            <KPICard title="Client Variations" value={clientChanges.length} icon={FileCheck} color="blue" subtitle="Custom work items" />
          </div>

          {activeSubTab === 'cash' ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Site Petty Cash Register & Expense Vouchers</h3>
              <DataTable columns={cashColumns} data={pettyCash?.entries || []} searchKey="description" searchPlaceholder="Search cash vouchers..." />
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client Customization Requests & 3-Tier Commercial Settlement</h3>
              <DataTable columns={changesColumns} data={clientChanges} searchKey="change_title" searchPlaceholder="Search client variation..." />
            </div>
          )}
        </>
      )}

      {/* Cash Modal */}
      <ModalDialog isOpen={isCashModalOpen} onClose={() => setIsCashModalOpen(false)} title="Record Petty Cash Voucher">
        <form onSubmit={handleCreateCash} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Entry Type</label>
              <select value={entryType} onChange={(e) => setEntryType(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white">
                <option value="EXPENSE">EXPENSE (Cash Out)</option>
                <option value="CASH_IN">CASH IN (Imprest Top-up)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Amount (₹)</label>
              <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Paid To / Recipient</label>
              <input type="text" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder="e.g. Ramesh Hardware Store" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Voucher / Receipt No.</label>
              <input type="text" value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} placeholder="e.g. VCH-0091" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300">Purpose / Details</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Emergency purchase of 10 masonry trowels and nails" required rows={3} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <ActionButton onClick={() => setIsCashModalOpen(false)} variant="ghost" size="sm">Cancel</ActionButton>
            <ActionButton type="submit" size="sm">Save Cash Voucher</ActionButton>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
};

export default FinanceWorkspace;
