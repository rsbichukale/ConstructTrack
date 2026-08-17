'use client';

import React, { useState } from 'react';
import { 
  Users, 
  PhoneCall, 
  CheckCircle2, 
  UserPlus,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Send,
  Zap,
  Filter,
  Layers,
  Building2,
  Clock,
  MessageSquare
} from 'lucide-react';
import { getAppState, saveAppState, updateFlatTaskProgress } from '../../lib/dbState';
import { syncTaskToBackend, syncBulkFlatTasksToBackend } from '../../lib/backendSync';

export const PendingWorkHub = () => {
  const state = getAppState();
  const [activeTab, setActiveTab] = useState('blockers'); // 'blockers' | 'unassigned' | 'contractors'
  const [selectedWing, setSelectedWing] = useState('ALL');
  const [selectedTrade, setSelectedTrade] = useState('ALL');
  const [hubMessage, setHubMessage] = useState(null);

  // 1. Active Blockers & Snags
  const blockedTasks = (state.flatTasks || []).filter(t => {
    if (t.status === 'APPROVED' || t.status === 'VERIFIED') return false;
    const hasBlocker = t.status === 'REWORK' || Boolean(t.blockerReason || t.blocker_reason);
    if (!hasBlocker) return false;
    const flat = (state.flats || []).find(f => String(f.id) === String(t.flatId || t.flat_id));
    if (selectedWing !== 'ALL' && flat?.wing !== selectedWing) return false;
    return true;
  });

  // 2. Unassigned Tasks
  const unassignedTasks = (state.flatTasks || []).filter(t => {
    if (t.status === 'APPROVED' || t.status === 'VERIFIED') return false;
    if (Boolean(t.assignedContractorId || t.assigned_contractor_id)) return false;
    const flat = (state.flats || []).find(f => String(f.id) === String(t.flatId || t.flat_id));
    if (selectedWing !== 'ALL' && flat?.wing !== selectedWing) return false;
    return true;
  });

  // Filter unassigned by trade
  const filteredUnassignedTasks = unassignedTasks.filter(t => {
    if (selectedTrade === 'ALL') return true;
    const catalog = (state.taskCatalog || []).find(c => String(c.id) === String(t.taskCatalogId || t.task_catalog_id));
    return (catalog?.tradeType || catalog?.trade_type) === selectedTrade;
  });

  // 3. Contractor Work Breakdown
  const contractorWorkGroups = (state.contractors || []).map(contractor => {
    const tasks = (state.flatTasks || []).filter(t => {
      if (t.status === 'APPROVED' || t.status === 'VERIFIED') return false;
      if (String(t.assignedContractorId || t.assigned_contractor_id) !== String(contractor.id)) return false;
      const flat = (state.flats || []).find(f => String(f.id) === String(t.flatId || t.flat_id));
      if (selectedWing !== 'ALL' && flat?.wing !== selectedWing) return false;
      return true;
    });

    const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'WORK_STARTED').length;
    const blockedCount = tasks.filter(t => t.status === 'REWORK' || Boolean(t.blockerReason || t.blocker_reason)).length;
    const notStartedCount = tasks.filter(t => t.status === 'NOT_STARTED' || t.status === 'ASSIGNED' || !t.status).length;

    return {
      contractor,
      totalPending: tasks.length,
      inProgressCount,
      blockedCount,
      notStartedCount,
      tasks
    };
  }).filter(g => g.totalPending > 0);

  // Actions
  const handleResolveBlocker = (taskId) => {
    updateFlatTaskProgress(taskId, 'IN_PROGRESS', 50, 'Blocker resolved on site', undefined, '');
    setHubMessage('Blocker cleared! Task transitioned back to IN PROGRESS.');
    setTimeout(() => setHubMessage(null), 3000);
  };

  const handleBulkAssign = (contractorId) => {
    const contractor = (state.contractors || []).find(c => String(c.id) === String(contractorId));
    if (!contractor) return;

    const unassignedIds = new Set(filteredUnassignedTasks.map(t => t.id));
    const modifiedTasks = [];

    const updatedTasks = (state.flatTasks || []).map(t => {
      if (unassignedIds.has(t.id)) {
        const mod = { ...t, assignedContractorId: contractor.id, status: 'ASSIGNED' };
        modifiedTasks.push(mod);
        return mod;
      }
      return t;
    });

    saveAppState({ ...state, flatTasks: updatedTasks });
    syncBulkFlatTasksToBackend(modifiedTasks);
    setHubMessage(`Assigned ${modifiedTasks.length} tasks to ${contractor.companyName || contractor.company_name}!`);
    setTimeout(() => setHubMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            <span>Site Resolution & Blocker Center</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Pending Snags, Blocker Call Hub & Bulk Work Allocation
          </h2>
          <p className="text-xs text-slate-400">
            Rapid resolution center to unblock critical path snags, call subcontractor leaders, and allocate task backlogs.
          </p>
        </div>

        {/* Global Wing Filter */}
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Wing Scope:</span>
          {['ALL', 'B1', 'B2'].map(w => (
            <button
              key={w}
              onClick={() => setSelectedWing(w)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                selectedWing === w ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {w === 'ALL' ? 'All Wings' : `Wing ${w}`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTab('blockers')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'blockers' ? 'bg-rose-950/60 border-rose-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400">1. Active Blockers & Snags</span>
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{blockedTasks.length} Issues</div>
          <p className="text-[10px] text-slate-400 mt-1">Requiring immediate supervisor clearance</p>
        </div>

        <div 
          onClick={() => setActiveTab('unassigned')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'unassigned' ? 'bg-amber-950/60 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">2. Unassigned Task Backlog</span>
            <UserPlus className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{unassignedTasks.length} Tasks</div>
          <p className="text-[10px] text-slate-400 mt-1">Pending allocation to trade contractors</p>
        </div>

        <div 
          onClick={() => setActiveTab('contractors')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'contractors' ? 'bg-sky-950/60 border-sky-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400">3. Contractor Call Ledger</span>
            <PhoneCall className="w-5 h-5 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{contractorWorkGroups.length} Active Agencies</div>
          <p className="text-[10px] text-slate-400 mt-1">Pending progress and target follow-ups</p>
        </div>
      </div>

      {hubMessage && (
        <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{hubMessage}</span>
        </div>
      )}

      {/* TAB 1: ACTIVE BLOCKERS & SNAGS */}
      {activeTab === 'blockers' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2 text-rose-400 font-extrabold text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>Active Site Blockers & Defect Reworks ({blockedTasks.length})</span>
            </div>
            <span className="text-xs text-slate-400 font-bold">Wing {selectedWing}</span>
          </div>

          {blockedTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-bold">
              🎉 Zero active blockers! All site tasks running smoothly.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {blockedTasks.map(t => {
                const catalog = (state.taskCatalog || []).find(c => String(c.id) === String(t.taskCatalogId || t.task_catalog_id));
                const flat = (state.flats || []).find(f => String(f.id) === String(t.flatId || t.flat_id));
                const contractor = (state.contractors || []).find(c => String(c.id) === String(t.assignedContractorId || t.assigned_contractor_id));

                return (
                  <div key={`blocker-${t.id}`} className="bg-slate-950 border border-rose-900/60 p-4 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black text-rose-400 bg-rose-950 border border-rose-800 px-2 py-0.5 rounded">
                          FLAT {flat?.wing}-{flat?.flatNumber || flat?.flat_number} ({flat?.unitType || flat?.unit_type})
                        </span>
                        <h4 className="text-sm font-extrabold text-white mt-1.5">
                          {catalog?.taskName || catalog?.task_name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Trade: <strong className="text-slate-300">{catalog?.tradeType || catalog?.trade_type}</strong> • Contractor: <strong className="text-slate-300">{contractor?.companyName || 'Apex Works'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="bg-rose-950/40 border border-rose-900/80 p-2.5 rounded-xl text-xs text-rose-300">
                      <strong>Blocker Reason:</strong> {t.blockerReason || t.blocker_reason || 'Material delay or preceding trade snag'}
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => handleResolveBlocker(t.id)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Clear Blocker & Resume</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UNASSIGNED TASK BACKLOG & 1-CLICK ALLOCATOR */}
      {activeTab === 'unassigned' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span>1-Click Bulk Contractor Allocation Tool</span>
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Allocate all unassigned micro-tasks for a selected trade to a registered contractor in 1 click.
              </p>
            </div>

            {/* Bulk Contractor Selector */}
            <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assign All To:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkAssign(Number(e.target.value));
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-bold text-white outline-none"
              >
                <option value="">Choose Contractor to Allocate...</option>
                {(state.contractors || []).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.company_name} ({c.tradeType || 'General'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
            {filteredUnassignedTasks.map(t => {
              const catalog = (state.taskCatalog || []).find(c => String(c.id) === String(t.taskCatalogId || t.task_catalog_id));
              const flat = (state.flats || []).find(f => String(f.id) === String(t.flatId || t.flat_id));

              return (
                <div key={`unassigned-${t.id}`} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-sky-400">Flat {flat?.wing}-{flat?.flatNumber || flat?.flat_number}</span>
                    <h5 className="text-xs font-bold text-white mt-0.5">{catalog?.taskName || catalog?.task_name}</h5>
                    <span className="text-[10px] text-slate-500 font-semibold">{catalog?.tradeType || catalog?.trade_type}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
                    UNASSIGNED
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CONTRACTOR CALL LEDGER & FOLLOW-UP */}
      {activeTab === 'contractors' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-extrabold uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4" />
              <span>Subcontractor Escalation & Attendance Follow-Up</span>
            </span>
            <span className="text-xs text-slate-400 font-bold">{contractorWorkGroups.length} Agencies Working</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contractorWorkGroups.map(g => (
              <div key={`agency-card-${g.contractor.id}`} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{g.contractor.companyName || g.contractor.company_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Lead: <strong className="text-slate-300">{g.contractor.contactPerson || 'Site Supervisor'}</strong> • {g.contractor.phone || '+91 98765 43210'}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-sky-400 bg-sky-950 border border-sky-800 px-2.5 py-1 rounded-xl">
                    ₹{g.contractor.rate_per_sqft || g.contractor.ratePerUnit || 25}/sq.ft
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending</span>
                    <span className="text-sm font-black text-white">{g.totalPending}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-amber-400 uppercase block">In Progress</span>
                    <span className="text-sm font-black text-amber-400">{g.inProgressCount}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-rose-400 uppercase block">Blocked</span>
                    <span className="text-sm font-black text-rose-400">{g.blockedCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/60">
                  <a
                    href={`tel:${g.contractor.phone || '9876543210'}`}
                    className="px-3 py-1.5 bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-300 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Supervisor</span>
                  </a>
                  <a
                    href={`https://wa.me/91${(g.contractor.phone || '9876543210').replace(/\D/g, '')}?text=Site%20Notice:%20Please%20expedite%20the%20${g.inProgressCount}%20in-progress%20tasks%20in%20Wing%20${selectedWing}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Notice</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingWorkHub;
