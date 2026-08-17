'use client';

import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Printer, 
  FileText, 
  Building, 
  DollarSign, 
  Search, 
  ArrowDownRight, 
  CreditCard,
  Percent,
  Calculator
} from 'lucide-react';
import { useBilling } from '../../../hooks/useBilling';
import { KPICard } from '../../ui/KPICard';
import { DataTable } from '../../ui/DataTable';
import { StatusBadge } from '../../ui/StatusBadge';
import { ActionButton } from '../../ui/ActionButton';
import { ModalDialog } from '../../ui/ModalDialog';

export const RABillingWorkspace = () => {
  const { 
    bills, 
    contractors, 
    loading, 
    preview, 
    previewLoading, 
    fetchPreview, 
    generateBill, 
    certifyBill, 
    recordPayment, 
    createDebitNote, 
    refresh 
  } = useBilling(1);

  const [activeTab, setActiveTab] = useState('bills'); // 'bills' | 'debitNotes'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [contractorFilter, setContractorFilter] = useState('ALL');

  // Generate Bill Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedContractorId, setSelectedContractorId] = useState('');
  const [billingNotes, setBillingNotes] = useState('');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Debit Note Modal
  const [isDebitModalOpen, setIsDebitModalOpen] = useState(false);
  const [debitContractorId, setDebitContractorId] = useState('');
  const [debitReason, setDebitReason] = useState('Damaged tiles during transport');
  const [debitAmount, setDebitAmount] = useState(2500);

  // Payment Record Modal
  const [payingBill, setPayingBill] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');

  // Voucher View Modal
  const [viewingBill, setViewingBill] = useState(null);

  // Financial aggregates
  const totalGross = bills.reduce((sum, b) => sum + (Number(b.gross_amount) || 0), 0);
  const totalRetention = bills.reduce((sum, b) => sum + (Number(b.retention_amount) || 0), 0);
  const totalTDS = bills.reduce((sum, b) => sum + (Number(b.tds_amount) || 0), 0);
  const totalNetPaid = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + (Number(b.net_payable_amount) || 0), 0);
  const totalPendingPayout = bills.filter(b => b.status !== 'PAID').reduce((sum, b) => sum + (Number(b.net_payable_amount) || 0), 0);

  const handleContractorSelectForPreview = async (cid) => {
    setSelectedContractorId(cid);
    if (cid) {
      await fetchPreview(cid);
    }
  };

  const handleCreateRABill = async (e) => {
    e.preventDefault();
    if (!selectedContractorId) return;
    try {
      setSubmitting(true);
      await generateBill({
        contractorId: Number(selectedContractorId),
        startDate,
        endDate,
        notes: billingNotes
      });
      setIsGenerateModalOpen(false);
      setSelectedContractorId('');
      setBillingNotes('');
      setActionMessage('Subcontractor RA Bill generated & sent to QS approval queue!');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      alert('Error generating RA Bill: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDebitNote = async (e) => {
    e.preventDefault();
    if (!debitContractorId) return;
    try {
      setSubmitting(true);
      await createDebitNote({
        contractorId: Number(debitContractorId),
        amount: Number(debitAmount),
        reason: debitReason
      });
      setIsDebitModalOpen(false);
      setDebitContractorId('');
      setActionMessage('Debit Note issued. Will auto-deduct in next RA Bill.');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      alert('Error issuing Debit Note: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCertify = async (billId) => {
    if (!confirm('Certify this RA Bill for payout clearance?')) return;
    try {
      await certifyBill(billId);
      setActionMessage('RA Bill certified by QS/Billing Engineer!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Certification failed: ' + err.message);
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payingBill) return;
    try {
      setSubmitting(true);
      await recordPayment(payingBill.id, paymentRef || `NEFT-${Date.now()}`);
      setPayingBill(null);
      setPaymentRef('');
      setActionMessage('Payment recorded and RA Bill marked as PAID!');
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert('Payment record failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = !searchTerm || 
      b.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesContractor = contractorFilter === 'ALL' || String(b.contractor_id) === String(contractorFilter);
    return matchesSearch && matchesStatus && matchesContractor;
  });

  const columns = [
    { 
      key: 'bill_number', 
      header: 'RA Bill #', 
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-sky-400">{val}</span>
          <div className="text-[10px] text-slate-400">
            {row.period_start ? `${String(row.period_start).split('T')[0]} to ${String(row.period_end).split('T')[0]}` : 'Current Cycle'}
          </div>
        </div>
      )
    },
    { 
      key: 'company_name', 
      header: 'Subcontractor / Trade', 
      render: (val, row) => (
        <div>
          <div className="font-bold text-white flex items-center space-x-1.5">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>{val || 'Direct Contractor'}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
            {row.trade_type || 'General'}
          </span>
        </div>
      )
    },
    { 
      key: 'gross_amount', 
      header: 'Gross Work (₹)', 
      render: (val) => <span className="font-mono font-semibold text-white">₹{Number(val || 0).toLocaleString()}</span> 
    },
    { 
      key: 'deductions', 
      header: 'Deductions (₹)', 
      render: (_, row) => {
        const ret = Number(row.retention_amount || 0);
        const tds = Number(row.tds_amount || 0);
        const deb = Number(row.debit_notes_deducted || 0);
        const totalDed = ret + tds + deb;
        return (
          <div className="text-[11px] font-mono space-y-0.5">
            <div className="text-rose-400 font-bold">-₹{totalDed.toLocaleString()}</div>
            <div className="text-[9px] text-slate-400">(Ret: ₹{ret} | TDS: ₹{tds} | Deb: ₹{deb})</div>
          </div>
        );
      }
    },
    { 
      key: 'net_payable_amount', 
      header: 'Net Payable (₹)', 
      render: (val) => (
        <span className="font-mono font-black text-emerald-400 text-sm">
          ₹{Number(val || 0).toLocaleString()}
        </span>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (val) => <StatusBadge status={val} /> 
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setViewingBill(row)}
            title="View & Print Payment Voucher"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg transition border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {row.status === 'SUBMITTED' && (
            <button
              onClick={() => handleCertify(row.id)}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition"
            >
              Certify
            </button>
          )}

          {row.status === 'CERTIFIED' && (
            <button
              onClick={() => { setPayingBill(row); setPaymentRef(`NEFT-${Date.now().toString().slice(-6)}`); }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1"
            >
              <CreditCard className="w-3 h-3" />
              <span>Pay</span>
            </button>
          )}

          {row.status === 'PAID' && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
              Paid ✓
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-emerald-400" />
            Subcontractor RA Billing & Payout Engine
          </h2>
          <p className="text-xs text-slate-400">
            Running Account (RA) bills generator, 5% security retention, 1% TDS, debit notes deductions, and certified payout vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            onClick={() => setIsGenerateModalOpen(true)}
            icon={Plus}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            Generate RA Bill
          </ActionButton>

          <ActionButton
            onClick={() => setIsDebitModalOpen(true)}
            icon={AlertTriangle}
            variant="outline"
            size="sm"
            className="border-rose-800 text-rose-300 hover:bg-rose-950"
          >
            Issue Debit Note
          </ActionButton>

          <ActionButton 
            onClick={refresh} 
            icon={RefreshCw} 
            loading={loading} 
            variant="ghost" 
            size="sm" 
          />
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl text-xs font-bold text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Total Gross Work Billed"
          value={`₹${totalGross.toLocaleString()}`}
          icon={Receipt}
          color="sky"
          subtitle={`${bills.length} Total RA Bills`}
        />
        <KPICard
          title="5% Security Retention Held"
          value={`₹${totalRetention.toLocaleString()}`}
          icon={ShieldCheck}
          color="purple"
          subtitle="Held until DLP period"
        />
        <KPICard
          title="Statutory TDS (1%) Withheld"
          value={`₹${totalTDS.toLocaleString()}`}
          icon={Percent}
          color="amber"
          subtitle="Tax deducted at source"
        />
        <KPICard
          title="Net Disbursed to Subcontractors"
          value={`₹${totalNetPaid.toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          subtitle={`₹${totalPendingPayout.toLocaleString()} pending clearance`}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Bill # or Subcontractor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="CERTIFIED">CERTIFIED</option>
            <option value="PAID">PAID</option>
          </select>

          <select
            value={contractorFilter}
            onChange={(e) => setContractorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="ALL">All Contractors</option>
            {contractors.map(c => (
              <option key={c.id} value={c.id}>{c.company_name} ({c.trade_type})</option>
            ))}
          </select>
        </div>
      </div>

      {/* RA Bills Data Table */}
      <DataTable
        columns={columns}
        data={filteredBills}
        loading={loading}
        emptyMessage="No Subcontractor RA Bills generated yet. Click 'Generate RA Bill' to create from approved tasks."
      />

      {/* 1. MODAL: Generate RA Bill Wizard */}
      {isGenerateModalOpen && (
        <ModalDialog
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          title="⚡ Generate Subcontractor RA Bill"
          size="lg"
        >
          <form onSubmit={handleCreateRABill} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Select Subcontractor</label>
                <select
                  required
                  value={selectedContractorId}
                  onChange={(e) => handleContractorSelectForPreview(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="">-- Choose Subcontractor --</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name} — {c.trade_type} ({c.contact_person})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Period Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Period End</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Live Calculation Preview Box */}
            {previewLoading ? (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold">Querying verified tasks & debit notes...</p>
              </div>
            ) : preview ? (
              <div className="bg-slate-950 border border-emerald-500/40 p-4 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase flex items-center space-x-1.5">
                    <Calculator className="w-4 h-4" />
                    <span>Live Statutory Formula Breakdown</span>
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {preview.eligibleTasksCount} Approved Tasks Measured
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>1. Gross Value of Work Done:</span>
                    <span className="font-bold text-white">₹{Number(preview.grossAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-purple-400">
                    <span>2. Less: 5.0% Security Retention:</span>
                    <span>-₹{Number(preview.retentionAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>3. Less: 1.0% TDS (Sec 194C):</span>
                    <span>-₹{Number(preview.tdsAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sky-400">
                    <span>4. Less: 1.0% Building Labor Cess:</span>
                    <span>-₹{Number(preview.laborCessAmount).toLocaleString()}</span>
                  </div>
                  {preview.debitNotesDeducted > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>5. Less: Debit Notes (Material/Safety):</span>
                      <span>-₹{Number(preview.debitNotesDeducted).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-emerald-400">
                    <span>NET PAYABLE CERTIFIED AMOUNT:</span>
                    <span className="text-base font-black">₹{Number(preview.netPayableAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Billing Notes & Justification</label>
              <textarea
                rows={2}
                placeholder="e.g. Month 1 Masonry & Plastering RA Bill 01 based on engineer site measurement"
                value={billingNotes}
                onChange={(e) => setBillingNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <ActionButton variant="ghost" onClick={() => setIsGenerateModalOpen(false)}>
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                loading={submitting}
                disabled={!selectedContractorId}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Submit RA Bill
              </ActionButton>
            </div>
          </form>
        </ModalDialog>
      )}

      {/* 2. MODAL: Issue Debit Note */}
      {isDebitModalOpen && (
        <ModalDialog
          isOpen={isDebitModalOpen}
          onClose={() => setIsDebitModalOpen(false)}
          title="⚠️ Issue Subcontractor Debit Note"
          size="md"
        >
          <form onSubmit={handleCreateDebitNote} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Subcontractor</label>
              <select
                required
                value={debitContractorId}
                onChange={(e) => setDebitContractorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              >
                <option value="">-- Choose Subcontractor --</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name} ({c.trade_type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Deduction Amount (₹)</label>
              <input
                required
                type="number"
                min="100"
                step="50"
                value={debitAmount}
                onChange={(e) => setDebitAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Reason / Penalty Description</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. 5 bags of ultra-tech cement damaged by rain due to improper tarp covering in Wing A"
                value={debitReason}
                onChange={(e) => setDebitReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <ActionButton variant="ghost" onClick={() => setIsDebitModalOpen(false)}>
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                loading={submitting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Issue Debit Note
              </ActionButton>
            </div>
          </form>
        </ModalDialog>
      )}

      {/* 3. MODAL: Record Payout */}
      {payingBill && (
        <ModalDialog
          isOpen={!!payingBill}
          onClose={() => setPayingBill(null)}
          title="💳 Record Subcontractor Payout"
          size="md"
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
            <div className="p-4 bg-slate-950 border border-emerald-500/50 rounded-2xl space-y-2">
              <div className="text-xs text-slate-400">Paying Certified RA Bill:</div>
              <div className="text-sm font-bold text-white">{payingBill.bill_number} — {payingBill.company_name}</div>
              <div className="text-xl font-black text-emerald-400 font-mono">
                ₹{Number(payingBill.net_payable_amount).toLocaleString()}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Bank Payment Reference (NEFT / Cheque #)</label>
              <input
                required
                type="text"
                placeholder="e.g. HDFC-NEFT-98471203"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <ActionButton variant="ghost" onClick={() => setPayingBill(null)}>
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                loading={submitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Confirm Payout
              </ActionButton>
            </div>
          </form>
        </ModalDialog>
      )}

      {/* 4. MODAL: Printable Payment Voucher Dossier */}
      {viewingBill && (
        <ModalDialog
          isOpen={!!viewingBill}
          onClose={() => setViewingBill(null)}
          title={`📄 RA Payment Voucher: ${viewingBill.bill_number}`}
          size="lg"
        >
          <div className="space-y-6 text-slate-900 bg-white p-6 rounded-2xl font-sans" id="printable-voucher">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">CONSTRUCTTRACK ENTERPRISE</h1>
                <p className="text-xs font-bold text-slate-600">Grand Site Tower Project • Site Office 01</p>
                <p className="text-[11px] text-slate-500">Subcontractor Running Account (RA) Payment Voucher</p>
              </div>
              <div className="text-right font-mono">
                <span className="px-2 py-1 bg-slate-900 text-white text-xs font-bold rounded">
                  {viewingBill.status}
                </span>
                <p className="text-xs font-bold mt-1 text-slate-800">{viewingBill.bill_number}</p>
                <p className="text-[11px] text-slate-500">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Contractor Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase block text-[10px]">Contractor:</span>
                <span className="font-bold text-sm text-slate-900">{viewingBill.company_name}</span>
                <p className="text-slate-600">Trade: {viewingBill.trade_type}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase block text-[10px]">Billing Cycle:</span>
                <span className="font-semibold text-slate-900">
                  {viewingBill.period_start ? `${String(viewingBill.period_start).split('T')[0]} to ${String(viewingBill.period_end).split('T')[0]}` : 'Current Month'}
                </span>
                {viewingBill.payment_reference && (
                  <p className="text-emerald-700 font-mono font-bold">Ref: {viewingBill.payment_reference}</p>
                )}
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5 text-left">Description</th>
                    <th className="p-2.5 text-right">Calculation</th>
                    <th className="p-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-bold">Gross Work Value Measured</td>
                    <td className="p-2.5 text-right text-slate-500">As per site verification</td>
                    <td className="p-2.5 text-right font-mono font-bold">₹{Number(viewingBill.gross_amount).toLocaleString()}</td>
                  </tr>
                  <tr className="text-slate-600">
                    <td className="p-2.5">Less: 5.0% Security Retention</td>
                    <td className="p-2.5 text-right font-mono">5.00%</td>
                    <td className="p-2.5 text-right font-mono text-rose-600">-₹{Number(viewingBill.retention_amount).toLocaleString()}</td>
                  </tr>
                  <tr className="text-slate-600">
                    <td className="p-2.5">Less: 1.0% TDS (Income Tax Sec 194C)</td>
                    <td className="p-2.5 text-right font-mono">1.00%</td>
                    <td className="p-2.5 text-right font-mono text-rose-600">-₹{Number(viewingBill.tds_amount).toLocaleString()}</td>
                  </tr>
                  <tr className="text-slate-600">
                    <td className="p-2.5">Less: 1.0% Building Labor Welfare Cess</td>
                    <td className="p-2.5 text-right font-mono">1.00%</td>
                    <td className="p-2.5 text-right font-mono text-rose-600">-₹{Number(viewingBill.labor_cess_amount || 0).toLocaleString()}</td>
                  </tr>
                  {Number(viewingBill.debit_notes_deducted) > 0 && (
                    <tr className="text-slate-600">
                      <td className="p-2.5">Less: Debit Notes / Damage Penalties</td>
                      <td className="p-2.5 text-right text-slate-500">Store / Safety deductions</td>
                      <td className="p-2.5 text-right font-mono text-rose-600">-₹{Number(viewingBill.debit_notes_deducted).toLocaleString()}</td>
                    </tr>
                  )}
                  <tr className="bg-emerald-50 font-black text-emerald-950 text-sm border-t-2 border-slate-900">
                    <td className="p-3">NET PAYABLE VOUCHER TOTAL</td>
                    <td className="p-3 text-right text-xs font-mono text-emerald-800">Clearance Approved</td>
                    <td className="p-3 text-right font-mono text-base">₹{Number(viewingBill.net_payable_amount).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sign-off Authorization Boxes */}
            <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[10px] text-slate-600">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900">Prepared By</p>
                <p>Site Billing Engineer</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900">{viewingBill.certified_by || 'Checked By'}</p>
                <p>QS / Billing Manager</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900">Authorized By</p>
                <p>Project Director / Accounts</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 space-x-2 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Voucher</span>
              </button>
            </div>
          </div>
        </ModalDialog>
      )}
    </div>
  );
};

export default RABillingWorkspace;
