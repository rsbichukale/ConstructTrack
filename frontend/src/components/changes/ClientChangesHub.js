'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Filter, 
  Building, 
  Home, 
  FileText, 
  Download, 
  Calendar, 
  Layers, 
  User, 
  Hammer,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Check,
  Receipt,
  Wallet,
  Briefcase,
  HardHat,
  ChevronRight,
  Info
} from 'lucide-react';
import { getAppState } from '../../lib/dbState';
import { 
  fetchClientChangesFromBackend, 
  createClientChangeInBackend, 
  approveTierClientChangeInBackend,
  rejectClientChangeInBackend, 
  finalizeSettlementClientChangeInBackend 
} from '../../lib/backendSync';
import { getSessionUser } from '../../lib/auth';

export const ClientChangesHub = () => {
  const state = getAppState();
  const [changesList, setChangesList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedChangeForSettle, setSelectedChangeForSettle] = useState(null);
  const [settlementNotes, setSettlementNotes] = useState('');
  
  const [activeFilterStatus, setActiveFilterStatus] = useState('ALL');
  const [activeFilterChargeHead, setActiveFilterChargeHead] = useState('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Form State
  const availableWings = (state.wings && state.wings.length > 0)
    ? state.wings.map(w => w.wing_code || w.wingCode || w.name || w)
    : Array.from(new Set((state.flats || []).map(f => f.wing))).filter(Boolean);
  const wingsList = availableWings.length > 0 ? availableWings : ['B1'];

  const [formWing, setFormWing] = useState(wingsList[0] || 'B1');
  const [formFlatId, setFormFlatId] = useState('');
  const [formRoomZoneId, setFormRoomZoneId] = useState('');
  const [formTradeType, setFormTradeType] = useState('ELECTRICAL');
  const [formChangeTitle, setFormChangeTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formChargeHead, setFormChargeHead] = useState('CLIENT_HEAD'); // 'CLIENT_HEAD' | 'COMPANY_HEAD' | 'CONTRACTOR_HEAD'
  const [formCategory, setFormCategory] = useState('PAID_MINOR');
  const [formQuotedAmount, setFormQuotedAmount] = useState('2800');
  const [formContractorCost, setFormContractorCost] = useState('1400');
  const [formImpactDays, setFormImpactDays] = useState('1');
  const [formRequestedBy, setFormRequestedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wingFlats = (state.flats || []).filter(f => f.wing === formWing);
  const roomZones = state.roomZones || [];
  const trades = (state.trades && state.trades.length > 0)
    ? state.trades.map(t => ({ tradeCode: t.tradeCode || t.trade_code || t.code || t.name, tradeName: t.tradeName || t.trade_name || t.name || t.tradeCode }))
    : Array.from(new Set((state.taskCatalog || []).map(tc => tc.tradeType || tc.trade_type))).filter(Boolean).map(tc => ({ tradeCode: tc, tradeName: tc }));

  const loadChanges = async () => {
    setIsLoading(true);
    const data = await fetchClientChangesFromBackend();
    setChangesList(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadChanges();
    getSessionUser().then(setCurrentUser);
  }, []);

  const handleCreateChange = async (e) => {
    e.preventDefault();
    if (!formFlatId || !formChangeTitle.trim()) {
      alert('Please select a flat and enter a change title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedFlat = wingFlats.find(f => String(f.id) === String(formFlatId));
      const selectedZone = roomZones.find(z => String(z.id) === String(formRoomZoneId));

      const finalQuoted = formChargeHead === 'COMPANY_HEAD' ? 0 : Number(formQuotedAmount || 0);

      const payload = {
        flatId: Number(formFlatId),
        flatNumber: selectedFlat ? selectedFlat.flatNumber : formFlatId,
        wing: formWing,
        roomZoneId: formRoomZoneId ? Number(formRoomZoneId) : null,
        roomZoneLabel: selectedZone ? selectedZone.zoneLabel : 'General Unit Area',
        tradeType: formTradeType,
        changeTitle: formChangeTitle.trim(),
        changeDescription: formDescription.trim(),
        category: formCategory,
        chargeHead: formChargeHead,
        quotedAmount: finalQuoted,
        contractorCost: Number(formContractorCost || 0),
        impactDays: Number(formImpactDays || 0),
        requestedBy: formRequestedBy.trim() || 'Client',
      };

      await createClientChangeInBackend(payload);
      setFeedbackMsg('Client variation request logged & sent to Sales Team for Tier-1 verification!');
      setTimeout(() => setFeedbackMsg(null), 4000);
      setIsNewModalOpen(false);
      
      // Reset form
      setFormChangeTitle('');
      setFormDescription('');
      setFormRequestedBy('');
      
      await loadChanges();
    } catch (err) {
      alert('Error creating change request: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3-Tier Approval Handler
  const handleApproveTier = async (change, tier) => {
    const approver = currentUser?.name || (tier === 'sales' ? 'Sales Desk' : tier === 'developer' ? 'Developer' : 'Site Engineer');
    
    let promptMsg = `Approve Tier: ${tier.toUpperCase()} for "${change.changeTitle}"?`;
    if (tier === 'sales') promptMsg = `[Tier 1 - Sales Desk] Confirm buyer KYC, quotation agreement (₹${change.quotedAmount}) and charge head (${change.chargeHead})?`;
    if (tier === 'developer') promptMsg = `[Tier 2 - Developer] Authorize commercial margin & budget absorption for flat ${change.wing}-${change.flatNumber}?`;
    if (tier === 'engineer') promptMsg = `[Tier 3 - Site Engineer] Confirm on-site civil feasibility, schedule impact (+${change.impactDays}d) & generate task for trade contractor?`;

    if (!confirm(promptMsg)) return;

    try {
      await approveTierClientChangeInBackend(change.id, {
        tier,
        approvedBy: approver,
        remarks: `${tier.toUpperCase()} sign-off completed by ${approver}`,
        impactDays: change.impactDays
      });

      if (tier === 'engineer') {
        setFeedbackMsg('Tier 3 Clearance Granted! Custom work order task generated in flat room checklist.');
      } else {
        setFeedbackMsg(`Tier ${tier.toUpperCase()} approval recorded! Forwarded to next stage.`);
      }
      setTimeout(() => setFeedbackMsg(null), 4000);
      await loadChanges();
    } catch (err) {
      alert('Approval error: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter reason for rejecting this change request (e.g. Structural load restriction, Past plumbing conduit phase):');
    if (reason === null) return;
    try {
      await rejectClientChangeInBackend(id, reason, currentUser?.name || 'Authorized Reviewer');
      setFeedbackMsg('Change request marked as REJECTED.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      await loadChanges();
    } catch (err) {
      alert('Error rejecting: ' + err.message);
    }
  };

  const handleOpenSettleModal = (change) => {
    setSelectedChangeForSettle(change);
    setSettlementNotes(`Work verified on-site. Charged to ${change.chargeHead}.`);
    setIsSettleModalOpen(true);
  };

  const handleConfirmSettlement = async () => {
    if (!selectedChangeForSettle) return;
    try {
      await finalizeSettlementClientChangeInBackend(selectedChangeForSettle.id, {
        finalizedBy: currentUser?.name || 'Site Engineer',
        settlementNotes: settlementNotes.trim()
      });
      setFeedbackMsg(`Work Finalized! Commercial settlement of ₹${selectedChangeForSettle.quotedAmount} posted to ${selectedChangeForSettle.chargeHead}.`);
      setTimeout(() => setFeedbackMsg(null), 4500);
      setIsSettleModalOpen(false);
      setSelectedChangeForSettle(null);
      await loadChanges();
    } catch (err) {
      alert('Error finalizing settlement: ' + err.message);
    }
  };

  // KPIs
  const totalRequests = changesList.length;
  const clientHeadCount = changesList.filter(c => c.chargeHead === 'CLIENT_HEAD').length;
  const companyHeadCount = changesList.filter(c => c.chargeHead === 'COMPANY_HEAD').length;
  const totalQuotedBilled = changesList
    .filter(c => c.chargeHead === 'CLIENT_HEAD' && (c.status === 'APPROVED_FOR_EXECUTION' || c.status === 'COMPLETED'))
    .reduce((sum, c) => sum + (c.quotedAmount || 0), 0);
  const totalCompanyAbsorbed = changesList
    .filter(c => c.chargeHead === 'COMPANY_HEAD' && (c.status === 'APPROVED_FOR_EXECUTION' || c.status === 'COMPLETED'))
    .reduce((sum, c) => sum + (c.contractorCost || 0), 0);

  const pendingSalesCount = changesList.filter(c => c.status === 'PENDING_SALES_APPROVAL').length;
  const pendingDevCount = changesList.filter(c => c.status === 'PENDING_DEVELOPER_APPROVAL').length;
  const pendingEngCount = changesList.filter(c => c.status === 'PENDING_ENGINEER_APPROVAL').length;
  const inExecutionCount = changesList.filter(c => c.status === 'APPROVED_FOR_EXECUTION').length;

  const filteredChanges = changesList.filter(c => {
    const statusMatch = activeFilterStatus === 'ALL' || c.status === activeFilterStatus;
    const chargeMatch = activeFilterChargeHead === 'ALL' || c.chargeHead === activeFilterChargeHead;
    return statusMatch && chargeMatch;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Flat', 'Room Zone', 'Trade', 'Title', 'Charge Head', 'Client Quote (INR)', 'Vendor Cost (INR)', 'Impact Days', 'Status', 'Sales Sign-Off', 'Developer Sign-Off', 'Engineer Sign-Off'];
    const rows = filteredChanges.map(c => [
      c.id,
      `"${c.wing}-${c.flatNumber || c.flatId}"`,
      `"${c.roomZoneLabel || ''}"`,
      `"${c.tradeType}"`,
      `"${c.changeTitle}"`,
      `"${c.chargeHead}"`,
      c.quotedAmount || 0,
      c.contractorCost || 0,
      `"${c.impactDays || 0} days"`,
      `"${c.status}"`,
      `"${c.salesApproval?.approvedBy || 'Pending'}"`,
      `"${c.developerApproval?.approvedBy || 'Pending'}"`,
      `"${c.engineerApproval?.approvedBy || 'Pending'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Client_Changes_3Tier_Settlement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const userRole = currentUser?.role || 'admin';
  const isAdmin = userRole === 'admin';
  const isSales = isAdmin || userRole === 'sales';
  const isDeveloper = isAdmin || userRole === 'developer';
  const isEngineer = isAdmin || ['site_engineer', 'supervisor', 'quality_inspector'].includes(userRole);

  return (
    <div className="space-y-6">
      {/* Top Banner with Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Multi-Tier Approval & Settlement Engine</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Client Variations & Commercial Change Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Enforce sequential 3-tier approvals (<span className="text-amber-300 font-bold">Sales Desk</span> ➔ <span className="text-amber-300 font-bold">Developer</span> ➔ <span className="text-amber-300 font-bold">Site Engineer</span>) and settle extra work over <span className="text-emerald-300 font-bold">Client Head</span> or <span className="text-purple-300 font-bold">Company Head</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-bold rounded-2xl text-xs transition flex items-center space-x-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Audit CSV</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log Client Variation</span>
          </button>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-200 text-xs font-bold flex items-center space-x-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Variations</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{totalRequests} Requests</div>
          <div className="text-[11px] text-slate-400">
            <span className="text-emerald-400 font-bold">{clientHeadCount} Client Head</span> • <span className="text-purple-400 font-bold">{companyHeadCount} Company Head</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client Billable Volume</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">₹{totalQuotedBilled.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-400">Debited to Buyer Handover Ledger</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Absorbed</span>
            <Wallet className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300">₹{totalCompanyAbsorbed.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-400">Goodwill & Project Overhead Cost</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300">{pendingSalesCount + pendingDevCount + pendingEngCount} In Review</div>
          <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 pt-0.5">
            <span className="px-1.5 py-0.2 bg-slate-950 border border-slate-800 rounded font-bold">{pendingSalesCount} Sales</span>
            <span className="px-1.5 py-0.2 bg-slate-950 border border-slate-800 rounded font-bold">{pendingDevCount} Dev</span>
            <span className="px-1.5 py-0.2 bg-slate-950 border border-slate-800 rounded font-bold">{pendingEngCount} Eng</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 text-xs font-bold no-scrollbar">
          <span className="text-slate-500 mr-2 text-[11px] uppercase tracking-wider shrink-0 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'PENDING_SALES_APPROVAL', label: '1. Pending Sales' },
            { id: 'PENDING_DEVELOPER_APPROVAL', label: '2. Pending Dev' },
            { id: 'PENDING_ENGINEER_APPROVAL', label: '3. Pending Eng' },
            { id: 'APPROVED_FOR_EXECUTION', label: 'In Execution' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setActiveFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 cursor-pointer ${
                activeFilterStatus === st.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Charge Head Filter */}
        <div className="flex items-center space-x-1 text-xs font-bold">
          <span className="text-slate-500 text-[11px] uppercase tracking-wider shrink-0">Charge Head:</span>
          {[
            { id: 'ALL', label: 'All Heads' },
            { id: 'CLIENT_HEAD', label: '👤 Client Head' },
            { id: 'COMPANY_HEAD', label: '🏢 Company Head' },
          ].map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveFilterChargeHead(ch.id)}
              className={`px-2.5 py-1 rounded-xl transition cursor-pointer text-xs ${
                activeFilterChargeHead === ch.id
                  ? 'bg-slate-100 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Variation Request Cards List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold">Loading variation requests...</p>
        </div>
      ) : filteredChanges.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3">
          <div className="p-3 bg-slate-800/80 text-amber-400 w-12 h-12 rounded-2xl mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-white">No Client Variations Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No change requests match the selected status or charge head filter. Click "Log Client Variation" above to record a new buyer modification.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChanges.map((change) => {
            const isClientHead = change.chargeHead === 'CLIENT_HEAD';
            const isCompanyHead = change.chargeHead === 'COMPANY_HEAD';

            // Stepper Stage Calculation
            const isSalesDone = !!change.salesApproval;
            const isDevDone = !!change.developerApproval;
            const isEngDone = !!change.engineerApproval || change.status === 'APPROVED_FOR_EXECUTION' || change.status === 'COMPLETED';
            const isCompleted = change.status === 'COMPLETED';
            const isRejected = change.status === 'REJECTED';

            return (
              <div 
                key={change.id}
                className="p-5 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl space-y-5 hover:border-slate-700 transition"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs font-extrabold rounded-lg">
                        {change.wing}-{change.flatNumber || change.flatId}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[11px] font-bold rounded-lg">
                        {change.roomZoneLabel || 'General Area'}
                      </span>
                      <span className="px-2 py-0.5 bg-sky-950/80 text-sky-300 border border-sky-800 text-[11px] font-bold rounded-lg">
                        {change.tradeType}
                      </span>

                      {/* Charge Head Badge */}
                      {isClientHead ? (
                        <span className="px-2.5 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center space-x-1">
                          <User className="w-3 h-3 text-emerald-400" />
                          <span>Client Head (Billed)</span>
                        </span>
                      ) : isCompanyHead ? (
                        <span className="px-2.5 py-0.5 bg-purple-950/90 text-purple-300 border border-purple-800 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center space-x-1">
                          <Building className="w-3 h-3 text-purple-400" />
                          <span>Company Head (Absorbed)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-rose-950/90 text-rose-300 border border-rose-800 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center space-x-1">
                          <HardHat className="w-3 h-3 text-rose-400" />
                          <span>Contractor Head</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base sm:text-lg font-black text-white leading-snug">
                      {change.changeTitle}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                      {change.changeDescription}
                    </p>
                  </div>

                  {/* Commercial Value Card */}
                  <div className="sm:text-right shrink-0 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 min-w-[140px]">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {isClientHead ? 'Client Quoted' : 'Goodwill (₹0 Billed)'}
                    </div>
                    <div className="text-lg font-black text-emerald-400">
                      ₹{(change.quotedAmount || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Vendor Cost: <span className="text-slate-200 font-bold">₹{change.contractorCost || 0}</span> • <span className="text-amber-300 font-bold">+{change.impactDays || 0}d Impact</span>
                    </div>
                  </div>
                </div>

                {/* 3-Tier Interactive Visual Stepper */}
                <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800/80 space-y-3">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>3-Tier Multi-Role Approval Pipeline:</span>
                    <span className={`font-black ${
                      change.status === 'COMPLETED' ? 'text-emerald-400' :
                      change.status === 'APPROVED_FOR_EXECUTION' ? 'text-sky-400 animate-pulse' :
                      change.status === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      STATUS: {change.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    {/* Tier 1: Sales Desk */}
                    <div className={`p-2.5 rounded-xl border flex items-start space-x-2.5 transition ${
                      isSalesDone 
                        ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' 
                        : change.status === 'PENDING_SALES_APPROVAL' 
                          ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/30' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                    }`}>
                      <div className={`p-1 rounded-lg shrink-0 ${isSalesDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        {isSalesDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Briefcase className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[11px] leading-tight">1. Sales Desk</div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {isSalesDone ? `✓ ${change.salesApproval?.approvedBy || 'Approved'}` : 'Pending Buyer KYC'}
                        </div>
                      </div>
                    </div>

                    {/* Tier 2: Developer Commercials */}
                    <div className={`p-2.5 rounded-xl border flex items-start space-x-2.5 transition ${
                      isDevDone 
                        ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' 
                        : change.status === 'PENDING_DEVELOPER_APPROVAL' 
                          ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/30' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                    }`}>
                      <div className={`p-1 rounded-lg shrink-0 ${isDevDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        {isDevDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Building className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[11px] leading-tight">2. Developer</div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {isDevDone ? `✓ ${change.developerApproval?.approvedBy || 'Approved'}` : 'Commercial Margin'}
                        </div>
                      </div>
                    </div>

                    {/* Tier 3: Site Engineer Feasibility */}
                    <div className={`p-2.5 rounded-xl border flex items-start space-x-2.5 transition ${
                      isEngDone 
                        ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' 
                        : change.status === 'PENDING_ENGINEER_APPROVAL' 
                          ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/30' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                    }`}>
                      <div className={`p-1 rounded-lg shrink-0 ${isEngDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        {isEngDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <HardHat className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[11px] leading-tight">3. Site Engineer</div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {isEngDone ? `✓ ${change.engineerApproval?.approvedBy || 'Cleared'}` : 'Civil Feasibility'}
                        </div>
                      </div>
                    </div>

                    {/* Stage 4: On-Site Execution & Settlement */}
                    <div className={`p-2.5 rounded-xl border flex items-start space-x-2.5 transition ${
                      isCompleted 
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30' 
                        : change.status === 'APPROVED_FOR_EXECUTION' 
                          ? 'bg-sky-950/40 border-sky-500/60 text-sky-200' 
                          : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                    }`}>
                      <div className={`p-1 rounded-lg shrink-0 ${isCompleted ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Hammer className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[11px] leading-tight">4. Settle Work</div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {isCompleted ? `✓ Billed to ${change.chargeHead}` : 'Executing On-Site'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role-Gated Action Buttons Row */}
                {!isCompleted && !isRejected && (
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleReject(change.id)}
                        className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 border border-rose-900/60 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Request</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Tier 1 Button: Sales */}
                      {change.status === 'PENDING_SALES_APPROVAL' && (
                        <button
                          onClick={() => handleApproveTier(change, 'sales')}
                          disabled={!isSales}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg cursor-pointer ${
                            isSales 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:scale-105 active:scale-95' 
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                          }`}
                          title={!isSales ? 'Requires Sales Desk or Admin Role' : 'Approve as Sales Desk'}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Approve Tier 1 (Sales Desk)</span>
                        </button>
                      )}

                      {/* Tier 2 Button: Developer */}
                      {change.status === 'PENDING_DEVELOPER_APPROVAL' && (
                        <button
                          onClick={() => handleApproveTier(change, 'developer')}
                          disabled={!isDeveloper}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg cursor-pointer ${
                            isDeveloper 
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:scale-105 active:scale-95' 
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                          }`}
                          title={!isDeveloper ? 'Requires Developer Promoter or Admin Role' : 'Authorize Budget as Developer'}
                        >
                          <Building className="w-3.5 h-3.5" />
                          <span>Approve Tier 2 (Developer Sign-Off)</span>
                        </button>
                      )}

                      {/* Tier 3 Button: Site Engineer */}
                      {change.status === 'PENDING_ENGINEER_APPROVAL' && (
                        <button
                          onClick={() => handleApproveTier(change, 'engineer')}
                          disabled={!isEngineer}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg cursor-pointer ${
                            isEngineer 
                              ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-slate-950 hover:scale-105 active:scale-95' 
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                          }`}
                          title={!isEngineer ? 'Requires Site Engineer or Admin Role' : 'Grant Site Feasibility Clearance'}
                        >
                          <HardHat className="w-3.5 h-3.5" />
                          <span>Approve Tier 3 (Site Engineer Clearance)</span>
                        </button>
                      )}

                      {/* Stage 4 Button: Finalize & Settle Work */}
                      {change.status === 'APPROVED_FOR_EXECUTION' && (
                        <button
                          onClick={() => handleOpenSettleModal(change)}
                          disabled={!isEngineer}
                          className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg cursor-pointer ${
                            isEngineer 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:scale-105 active:scale-95' 
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                          }`}
                          title={!isEngineer ? 'Requires Site Engineer or Admin Role' : 'Finalize Work & Settle Commercial Billing'}
                        >
                          <Receipt className="w-4 h-4 stroke-[2.5]" />
                          <span>Finalize Work & Settle Billing →</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Modal: Log Client Change Request */}
      {isNewModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsNewModalOpen(false)}>
          <div className="modal-panel max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-black text-white">Log Client Variation Request</h3>
              </div>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChange} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400">Wing</label>
                  <select
                    value={formWing}
                    onChange={(e) => {
                      setFormWing(e.target.value);
                      setFormFlatId('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {wingsList.map(w => (
                      <option key={w} value={w}>Wing {w}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Select Flat *</label>
                  <select
                    value={formFlatId}
                    onChange={(e) => setFormFlatId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Flat...</option>
                    {wingFlats.map(f => (
                      <option key={f.id} value={f.id}>Flat {f.flatNumber || f.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400">Room Zone</label>
                  <select
                    value={formRoomZoneId}
                    onChange={(e) => setFormRoomZoneId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">General Flat Area</option>
                    {roomZones.map(z => (
                      <option key={z.id} value={z.id}>{z.zoneLabel}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Trade Category *</label>
                  <select
                    value={formTradeType}
                    onChange={(e) => setFormTradeType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {trades.map(t => (
                      <option key={t.tradeCode} value={t.tradeCode}>{t.tradeName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Change Request Title *</label>
                <input
                  type="text"
                  placeholder="e.g., 2 Extra 16A Power Points in Kitchen back-splash"
                  value={formChangeTitle}
                  onChange={(e) => setFormChangeTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Scope Details & Client Notes</label>
                <textarea
                  rows="2"
                  placeholder="Provide details on location, dimensions, specific brand, or color code requested by buyer..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Commercial Charge Head Selector */}
              <div className="space-y-1.5 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                <label className="text-slate-300 flex items-center space-x-1.5">
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                  <span>Commercial Settlement Head *</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormChargeHead('CLIENT_HEAD');
                      setFormCategory('PAID_MINOR');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      formChargeHead === 'CLIENT_HEAD'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-extrabold text-xs">👤 Client Head</div>
                    <div className="text-[10px] text-slate-400">Billed to buyer invoice</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormChargeHead('COMPANY_HEAD');
                      setFormCategory('FREE_COURTESY');
                      setFormQuotedAmount('0');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      formChargeHead === 'COMPANY_HEAD'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-extrabold text-xs">🏢 Company Head</div>
                    <div className="text-[10px] text-slate-400">Goodwill (₹0 to buyer)</div>
                  </button>
                </div>
              </div>

              {/* Pricing & Cost Inputs */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-slate-400">Client Quote (₹)</label>
                  <input
                    type="number"
                    value={formChargeHead === 'COMPANY_HEAD' ? '0' : formQuotedAmount}
                    disabled={formChargeHead === 'COMPANY_HEAD'}
                    onChange={(e) => setFormQuotedAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Vendor Cost (₹)</label>
                  <input
                    type="number"
                    value={formContractorCost}
                    onChange={(e) => setFormContractorCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Impact (Days)</label>
                  <input
                    type="number"
                    value={formImpactDays}
                    onChange={(e) => setFormImpactDays(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black rounded-xl hover:scale-105 transition shadow-lg cursor-pointer"
                >
                  {isSubmitting ? 'Logging...' : 'Submit to Tier 1 (Sales)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Finalize Work & Settle Billing */}
      {isSettleModalOpen && selectedChangeForSettle && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsSettleModalOpen(false)}>
          <div className="modal-panel max-w-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-black text-white">Finalize & Settle Work</h3>
              </div>
              <button 
                onClick={() => setIsSettleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-sm font-black text-white">{selectedChangeForSettle.changeTitle}</div>
                <div className="text-slate-400">
                  Flat: <span className="text-white font-mono font-bold">{selectedChangeForSettle.wing}-{selectedChangeForSettle.flatNumber}</span> • Zone: <span className="text-white font-bold">{selectedChangeForSettle.roomZoneLabel}</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Settlement Charge Head:</span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-black">
                    {selectedChangeForSettle.chargeHead}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Commercial Amount:</span>
                  <span className="text-base font-black text-emerald-400">
                    ₹{(selectedChangeForSettle.quotedAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Inspection & Settlement Sign-Off Notes</label>
                <textarea
                  rows="2"
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-[11px] text-emerald-300 flex items-start space-x-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  {selectedChangeForSettle.chargeHead === 'CLIENT_HEAD'
                    ? 'Confirming will close the work order and post an extra ₹' + selectedChangeForSettle.quotedAmount + ' demand invoice into the buyer’s Handover payment schedule.'
                    : 'Confirming will close the work order and absorb ₹' + selectedChangeForSettle.contractorCost + ' as company project variance.'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSettlement}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-xl hover:scale-105 transition shadow-lg cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
