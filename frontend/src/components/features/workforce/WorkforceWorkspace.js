'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  UserCheck, 
  DollarSign, 
  Target, 
  ShieldCheck, 
  Building, 
  CreditCard, 
  Receipt,
  Phone,
  Search
} from 'lucide-react';
import { useWorkforce } from '../../../hooks/useWorkforce';
import { KPICard } from '../../ui/KPICard';
import { DataTable } from '../../ui/DataTable';
import { StatusBadge } from '../../ui/StatusBadge';
import { ActionButton } from '../../ui/ActionButton';
import { ModalDialog } from '../../ui/ModalDialog';

export const WorkforceWorkspace = () => {
  const { 
    date, 
    setDate, 
    contractors, 
    targets, 
    muster, 
    advances, 
    loading, 
    createTarget, 
    updateTargetStatus, 
    recordAttendance, 
    createWageAdvance, 
    refresh 
  } = useWorkforce();

  const [activeTab, setActiveTab] = useState('muster'); // 'muster' | 'targets' | 'advances' | 'roster'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMessage, setActionMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Target modal state
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState('');
  const [targetDesc, setTargetDesc] = useState('');
  const [wing, setWing] = useState('B1');
  const [floor, setFloor] = useState(1);

  // Multi-Skill Attendance Modal state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [masons, setMasons] = useState(6);
  const [helpers, setHelpers] = useState(4);
  const [barbenders, setBarbenders] = useState(0);
  const [carpenters, setCarpenters] = useState(0);
  const [electricians, setElectricians] = useState(0);
  const [plumbers, setPlumbers] = useState(0);
  const [workAssigned, setWorkAssigned] = useState('Wing A Floor 4 Brickwork & Plastering');

  // Wage Advance Modal state
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceContractorId, setAdvanceContractorId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState(5000);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [disbursedToLeader, setDisbursedToLeader] = useState('Mukadam / Gang Leader');
  const [disbursedBy, setDisbursedBy] = useState('Site Engineer');
  const [advancePurpose, setAdvancePurpose] = useState('Weekly Food & Labor Kharcha Advance');
  const [advanceNotes, setAdvanceNotes] = useState('');

  // Target Submission
  const handleCreateTarget = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createTarget({
        contractorId: Number(selectedContractor),
        description: targetDesc,
        wing,
        floorNumber: Number(floor),
        masons: Number(masons),
        helpers: Number(helpers)
      });
      setIsTargetModalOpen(false);
      setTargetDesc('');
      setActionMessage('Daily work target assigned successfully!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Error creating target: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Multi-Skill Muster Roll Submission
  const handleRecordAttendance = async (e) => {
    e.preventDefault();
    if (!selectedContractor) return;
    try {
      setSubmitting(true);
      await recordAttendance({
        contractorId: Number(selectedContractor),
        masons: Number(masons),
        helpers: Number(helpers),
        barbenders: Number(barbenders),
        carpenters: Number(carpenters),
        electricians: Number(electricians),
        plumbers: Number(plumbers),
        workAssigned
      });
      setIsAttendanceModalOpen(false);
      setActionMessage('Multi-skill muster roll attendance saved for contractor!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Error recording muster: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Wage Advance Submission
  const handleCreateAdvance = async (e) => {
    e.preventDefault();
    if (!advanceContractorId) return;
    try {
      setSubmitting(true);
      await createWageAdvance({
        contractorId: Number(advanceContractorId),
        amount: Number(advanceAmount),
        paymentMode,
        disbursedToLeader,
        disbursedBy,
        purpose: advancePurpose,
        notes: advanceNotes,
        disbursedDate: date
      });
      setIsAdvanceModalOpen(false);
      setActionMessage(`Wage advance voucher of ₹${Number(advanceAmount).toLocaleString()} issued!`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert('Error issuing advance: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Columns: Muster Roll
  const musterColumns = [
    {
      key: 'company_name',
      header: 'Subcontractor / Trade',
      render: (val, row) => (
        <div>
          <div className="font-bold text-white flex items-center space-x-1.5">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>{val}</span>
          </div>
          <div className="text-[10px] text-slate-400">{row.trade_type} • {row.contact_person}</div>
        </div>
      )
    },
    {
      key: 'masons_count',
      header: 'Masons',
      render: (val) => <span className="font-mono font-bold text-white text-xs">{val || 0}</span>
    },
    {
      key: 'helpers_count',
      header: 'Helpers',
      render: (val) => <span className="font-mono font-bold text-slate-300 text-xs">{val || 0}</span>
    },
    {
      key: 'barbenders_count',
      header: 'Bar-benders',
      render: (val) => <span className="font-mono font-bold text-sky-400 text-xs">{val || 0}</span>
    },
    {
      key: 'carpenters_count',
      header: 'Carpenters',
      render: (val) => <span className="font-mono font-bold text-purple-400 text-xs">{val || 0}</span>
    },
    {
      key: 'electricians_count',
      header: 'MEP / Plumbers',
      render: (_, row) => (
        <span className="font-mono font-bold text-amber-400 text-xs">
          {(Number(row.electricians_count) || 0) + (Number(row.plumbers_count) || 0)}
        </span>
      )
    },
    {
      key: 'total_headcount',
      header: 'Total Gang Strength',
      render: (_, row) => {
        const total = (Number(row.masons_count) || 0) + 
          (Number(row.helpers_count) || 0) + 
          (Number(row.barbenders_count) || 0) + 
          (Number(row.carpenters_count) || 0) + 
          (Number(row.electricians_count) || 0) + 
          (Number(row.plumbers_count) || 0);
        return (
          <span className={`font-mono font-black text-sm ${total > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
            {total} Workers
          </span>
        );
      }
    },
    {
      key: 'work_assigned',
      header: 'Assigned Work',
      render: (val, row) => (
        <span className="text-xs text-slate-300">{val || (row.is_present ? 'General Work' : 'Absent / No Gang')}</span>
      )
    }
  ];

  // Columns: Wage Advances Ledger
  const advanceColumns = [
    {
      key: 'advance_voucher_no',
      header: 'Voucher #',
      render: (val) => <span className="font-mono font-bold text-sky-400 text-xs">{val}</span>
    },
    {
      key: 'company_name',
      header: 'Contractor',
      render: (val, row) => (
        <div>
          <span className="font-bold text-white text-xs">{val}</span>
          <div className="text-[10px] text-slate-400">{row.trade_type}</div>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Advance Paid (₹)',
      render: (val) => (
        <span className="font-mono font-black text-emerald-400 text-sm">
          ₹{Number(val || 0).toLocaleString()}
        </span>
      )
    },
    {
      key: 'disbursed_to_leader',
      header: 'Handed Over To',
      render: (val, row) => (
        <div className="text-xs">
          <span className="text-slate-200 font-semibold">{val}</span>
          <div className="text-[10px] text-slate-400">Mode: {row.payment_mode}</div>
        </div>
      )
    },
    {
      key: 'disbursed_date',
      header: 'Disbursed Date',
      render: (val) => <span className="font-mono text-xs text-slate-300">{val ? String(val).split('T')[0] : '—'}</span>
    },
    {
      key: 'status',
      header: 'Settlement Status',
      render: (val) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
          val === 'DEDUCTED_IN_RA_BILL' 
            ? 'bg-purple-950 text-purple-300 border-purple-800' 
            : 'bg-amber-950 text-amber-300 border-amber-800'
        }`}>
          {val === 'DEDUCTED_IN_RA_BILL' ? 'Deducted in RA' : 'Pending RA Settlement'}
        </span>
      )
    }
  ];

  // Columns: Daily Targets
  const targetColumns = [
    { key: 'company_name', header: 'Contractor', render: (val) => <span className="font-bold text-white text-xs">{val}</span> },
    { key: 'wing', header: 'Location', render: (val, row) => <span className="text-xs text-slate-300">{val || 'B1'} - Floor {row.floor_number || 1}</span> },
    { key: 'target_description', header: 'Target Description', render: (val) => <span className="text-xs text-white">{val}</span> },
    { key: 'assigned_masons', header: 'Labor Deployed', render: (val, row) => <span className="font-mono text-xs text-amber-400">{val || 0} Masons, {row.assigned_helpers || 0} Helpers</span> },
    { key: 'status', header: 'Status', render: (val) => <StatusBadge status={val} /> },
    {
      key: 'actions',
      header: 'Action',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => updateTargetStatus(row.id, row.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
          className="text-xs text-amber-400 hover:text-amber-300 font-bold"
        >
          {row.status === 'COMPLETED' ? 'Reopen' : 'Mark Completed ✓'}
        </button>
      )
    }
  ];

  // Columns: Contractor Directory
  const contractorColumns = [
    { key: 'company_name', header: 'Contractor Company', render: (val) => <span className="font-bold text-white text-xs">{val}</span> },
    { key: 'trade_type', header: 'Trade Scope' },
    { key: 'contact_person', header: 'Supervisor Name' },
    { 
      key: 'phone', 
      header: 'Phone Call', 
      render: (val) => val ? (
        <a href={`tel:${val}`} className="text-sky-400 hover:underline flex items-center space-x-1 text-xs">
          <Phone className="w-3 h-3" />
          <span>{val}</span>
        </a>
      ) : '—'
    },
    { key: 'status', header: 'Status', render: (val) => <StatusBadge status={val} /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Date Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" />
            Contractor Workforce, Muster Roll & Wage Advances
          </h2>
          <p className="text-xs text-slate-400">
            Daily multi-skill labor strength, weekly kharcha/advance ledger, and daily work target tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
            <Calendar className="w-4 h-4 text-amber-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            />
          </div>

          <ActionButton
            onClick={() => setIsAttendanceModalOpen(true)}
            icon={UserCheck}
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            Log Muster Roll
          </ActionButton>

          <ActionButton
            onClick={() => setIsAdvanceModalOpen(true)}
            icon={DollarSign}
            size="sm"
            variant="outline"
            className="border-emerald-700 text-emerald-300 hover:bg-emerald-950"
          >
            Issue Wage Advance
          </ActionButton>

          <ActionButton
            onClick={() => setIsTargetModalOpen(true)}
            icon={Plus}
            size="sm"
            variant="ghost"
          >
            Assign Target
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Total Site Headcount Today"
          value={`${muster?.summary?.totalHeadcount || 0} Workers`}
          icon={Users}
          color="amber"
          subtitle={`${muster?.summary?.totalMasons || 0} Masons • ${muster?.summary?.totalHelpers || 0} Helpers`}
        />
        <KPICard
          title="Specialized Craftsmen"
          value={`${(muster?.summary?.totalBarbenders || 0) + (muster?.summary?.totalCarpenters || 0)}`}
          icon={Building}
          color="sky"
          subtitle={`${muster?.summary?.totalBarbenders || 0} Rebar • ${muster?.summary?.totalCarpenters || 0} Shuttering`}
        />
        <KPICard
          title="Weekly Wage Advances (Kharcha)"
          value={`₹${Number(advances?.summary?.totalAdvances || 0).toLocaleString()}`}
          icon={CreditCard}
          color="emerald"
          subtitle={`${advances?.advances?.length || 0} Advance Vouchers`}
        />
        <KPICard
          title="Contractor Deployment Rate"
          value={`${muster?.summary?.presentContractors || 0} / ${muster?.summary?.totalContractors || 14}`}
          icon={ShieldCheck}
          color="purple"
          subtitle="Trade gangs deployed on site"
        />
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex flex-wrap rounded-xl border border-slate-800 bg-slate-950 p-1 gap-1">
          <button
            onClick={() => setActiveTab('muster')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              activeTab === 'muster' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Muster Roll Matrix
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              activeTab === 'advances' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Labor Wage Advances & Kharcha ({advances?.advances?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('targets')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              activeTab === 'targets' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Work Targets ({targets.length})
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              activeTab === 'roster' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Contractor Directory ({contractors.length})
          </button>
        </div>
      </div>

      {/* Main Content Render */}
      {activeTab === 'muster' && (
        <DataTable
          columns={musterColumns}
          data={muster?.roster || []}
          loading={loading}
          emptyMessage="No muster roll attendance logged for selected date. Click 'Log Muster Roll' to record."
        />
      )}

      {activeTab === 'advances' && (
        <DataTable
          columns={advanceColumns}
          data={advances?.advances || []}
          loading={loading}
          emptyMessage="No labor wage advances issued yet. Click 'Issue Wage Advance' to log weekly food kharcha."
        />
      )}

      {activeTab === 'targets' && (
        <DataTable
          columns={targetColumns}
          data={targets}
          loading={loading}
          emptyMessage="No targets assigned for this date."
        />
      )}

      {activeTab === 'roster' && (
        <DataTable
          columns={contractorColumns}
          data={contractors}
          loading={loading}
          emptyMessage="No contractors found."
        />
      )}

      {/* 1. MODAL: Multi-Skill Muster Roll Attendance */}
      {isAttendanceModalOpen && (
        <ModalDialog
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
          title="👷 Log Multi-Skill Labor Muster Roll"
          size="lg"
        >
          <form onSubmit={handleRecordAttendance} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Contractor / Trade</label>
              <select
                required
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              >
                <option value="">-- Choose Contractor --</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name} ({c.trade_type})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Masons (Karigar)</label>
                <input
                  type="number"
                  min="0"
                  value={masons}
                  onChange={(e) => setMasons(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Helpers / Laborers</label>
                <input
                  type="number"
                  min="0"
                  value={helpers}
                  onChange={(e) => setHelpers(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Bar-Benders (Rebar)</label>
                <input
                  type="number"
                  min="0"
                  value={barbenders}
                  onChange={(e) => setBarbenders(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Carpenters (Shuttering)</label>
                <input
                  type="number"
                  min="0"
                  value={carpenters}
                  onChange={(e) => setCarpenters(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Electricians</label>
                <input
                  type="number"
                  min="0"
                  value={electricians}
                  onChange={(e) => setElectricians(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Plumbers</label>
                <input
                  type="number"
                  min="0"
                  value={plumbers}
                  onChange={(e) => setPlumbers(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Work Location & Scope Assigned</label>
              <input
                type="text"
                placeholder="e.g. Wing A Floor 5 Internal Plaster & Bathroom Waterproofing"
                value={workAssigned}
                onChange={(e) => setWorkAssigned(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <ActionButton variant="ghost" onClick={() => setIsAttendanceModalOpen(false)}>
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                loading={submitting}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Save Muster Roll
              </ActionButton>
            </div>
          </form>
        </ModalDialog>
      )}

      {/* 2. MODAL: Issue Labor Wage Advance (Kharcha) */}
      {isAdvanceModalOpen && (
        <ModalDialog
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          title="💰 Issue Labor Wage Advance (Kharcha Voucher)"
          size="md"
        >
          <form onSubmit={handleCreateAdvance} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Contractor / Gang</label>
              <select
                required
                value={advanceContractorId}
                onChange={(e) => setAdvanceContractorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              >
                <option value="">-- Choose Contractor --</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name} ({c.trade_type})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Advance Amount (₹)</label>
                <input
                  required
                  type="number"
                  min="100"
                  step="500"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="CASH">Cash Voucher</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="BANK_TRANSFER">Bank NEFT</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Handed Over To (Gang Leader / Mukadam)</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ramesh Mukadam / Bablu"
                  value={disbursedToLeader}
                  onChange={(e) => setDisbursedToLeader(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Purpose / Notes</label>
              <input
                type="text"
                placeholder="e.g. Weekly food ration & medicine advance for 12 laborers"
                value={advancePurpose}
                onChange={(e) => setAdvancePurpose(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <ActionButton variant="ghost" onClick={() => setIsAdvanceModalOpen(false)}>
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                loading={submitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Issue Advance Voucher
              </ActionButton>
            </div>
          </form>
        </ModalDialog>
      )}

      {/* 3. MODAL: Assign Target */}
      {isTargetModalOpen && (
        <ModalDialog
          isOpen={isTargetModalOpen}
          onClose={() => setIsTargetModalOpen(false)}
          title="🎯 Assign Daily Work Target"
          size="md"
        >
          <form onSubmit={handleCreateTarget} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Contractor</label>
              <select
                required
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              >
                <option value="">-- Choose Contractor --</option>
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name} ({c.trade_type})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Wing</label>
                <select
                  value={wing}
                  onChange={(e) => setWing(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="A">Wing A</option>
                  <option value="B">Wing B</option>
                  <option value="B1">Wing B1</option>
                  <option value="B2">Wing B2</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Floor</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Target Description</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Complete 4 flats internal plaster finish and curing"
                value={targetDesc}
                onChange={(e) => setTargetDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <ActionButton variant="ghost" onClick={() => setIsTargetModalOpen(false)}>
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                loading={submitting}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Assign Target
              </ActionButton>
            </div>
          </form>
        </ModalDialog>
      )}
    </div>
  );
};

export default WorkforceWorkspace;
