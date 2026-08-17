'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Search, 
  X, 
  RefreshCw, 
  Sparkles,
  HardHat,
  Home,
  Receipt,
  Layers,
  Check,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { getAppState, subscribeState, getDynamicTrades } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const ClientChangesWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrade, setFilterTrade] = useState('ALL');

  // Form states
  const [flatId, setFlatId] = useState('');
  const [roomZoneId, setRoomZoneId] = useState('');
  const [tradeType, setTradeType] = useState('ELECTRICAL');
  const [contractorId, setContractorId] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [scopeDetails, setScopeDetails] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [contractorCost, setContractorCost] = useState('');
  const [createMicroTask, setCreateMicroTask] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flats = state.flats || [];
  const roomZones = state.roomZones || [];
  const contractors = state.contractors || [];
  const dynamicTrades = getDynamicTrades(state);

  // Filter contractors by selected trade
  const matchingContractors = contractors.filter(c => 
    !tradeType || (c.trade_type || c.tradeType || '').toUpperCase() === tradeType.toUpperCase()
  );

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/client-changes');
      const data = res?.changes || res?.requests || (Array.isArray(res) ? res : []);
      setRequests(data);
    } catch (e) {
      console.error('Failed to fetch client variations:', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  // Auto-fill contractor cost at ~70% if empty and quote is entered
  const handleQuoteChange = (val) => {
    setQuotedAmount(val);
    if (!contractorCost && val) {
      const suggested = Math.round(Number(val) * 0.68);
      setContractorCost(suggested.toString());
    }
  };

  const handleCreateChange = async (e) => {
    e.preventDefault();
    if (!flatId || !requestTitle.trim() || !quotedAmount) return;

    setIsSubmitting(true);
    try {
      const selectedRoom = roomZones.find(r => r.id.toString() === roomZoneId.toString());

      await apiClient.post('/client-changes', {
        flatId: Number(flatId),
        roomZoneId: roomZoneId ? Number(roomZoneId) : null,
        roomZoneLabel: selectedRoom ? (selectedRoom.zone_label || selectedRoom.zoneLabel) : null,
        tradeType: tradeType || 'GENERAL',
        contractorId: contractorId ? Number(contractorId) : null,
        requestTitle: requestTitle.trim(),
        scopeDetails: scopeDetails.trim(),
        quotedAmount: Number(quotedAmount),
        contractorCost: Number(contractorCost) || (Number(quotedAmount) * 0.7),
        createMicroTask
      });

      setIsModalOpen(false);
      setRequestTitle('');
      setScopeDetails('');
      setQuotedAmount('');
      setContractorCost('');
      setRoomZoneId('');
      setContractorId('');
      setStatusMessage('Client customization variation logged & micro-task linked to Contractor RA Bill!');
      setTimeout(() => setStatusMessage(null), 4000);
      fetchChanges();
    } catch (e) {
      console.error('Error logging variation:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await apiClient.patch(`/client-changes/${id}`, { status });
      setStatusMessage(`Variation #${id} marked as ${status}!`);
      setTimeout(() => setStatusMessage(null), 3000);
      fetchChanges();
    } catch (e) {
      console.error(e);
    }
  };

  const totalQuoted = requests.reduce((acc, r) => acc + Number(r.quoted_amount || 0), 0);
  const totalCost = requests.reduce((acc, r) => acc + Number(r.contractor_cost || 0), 0);
  const totalMargin = totalQuoted - totalCost;
  const marginPct = totalQuoted > 0 ? Math.round((totalMargin / totalQuoted) * 100) : 0;

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      (r.change_title || r.request_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.flat_number || '').toString().includes(searchQuery.toLowerCase()) ||
      (r.wing || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.contractor_company_name || r.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.room_zone_label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.trade_type || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrade = filterTrade === 'ALL' || (r.trade_type || '').toUpperCase() === filterTrade.toUpperCase();

    return matchesSearch && matchesTrade;
  });

  // Calculate live margin preview in modal
  const liveQuote = Number(quotedAmount) || 0;
  const liveCost = Number(contractorCost) || 0;
  const liveMargin = liveQuote - liveCost;
  const liveMarginPct = liveQuote > 0 ? Math.round((liveMargin / liveQuote) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Buyer Customizations & Subcontractor Variations Engine</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Client Variation Orders & Contractor Claims</h2>
          <p className="text-xs text-slate-400">
            Log buyer upgrades (tiles, AC points, plumbing fixtures), auto-generate room micro-tasks, and link costs directly to Subcontractor RA Bills.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Log Buyer Variation Order</span>
        </button>
      </div>

      {statusMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in shadow-lg shadow-emerald-950/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center justify-between">
            <span>Billed to Buyers (Revenue)</span>
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-white mt-1">₹{totalQuoted.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-amber-400 font-bold mt-1">{requests.length} Total Variation Orders</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-rose-400 flex items-center justify-between">
            <span>Contractor Execution Cost</span>
            <HardHat className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 mt-1">₹{totalCost.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Payable via Subcontractor RA Bills</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-emerald-400 flex items-center justify-between">
            <span>Developer Net Profit Margin</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-1">₹{totalMargin.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-1">Net Commercial Gain</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-sky-400 flex items-center justify-between">
            <span>Average Margin Yield</span>
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-sky-400 mt-1">{marginPct}%</div>
          <div className="text-[10px] text-slate-400 mt-1">Markup on Contractor Direct Cost</div>
        </div>
      </div>

      {/* Table & Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-white text-sm">Client Variations & Contractor Claims Ledger</h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
              {filteredRequests.length} orders
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filterTrade}
              onChange={(e) => setFilterTrade(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none"
            >
              <option value="ALL">All Trades</option>
              {dynamicTrades.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search flat, room, trade, agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={fetchChanges}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition"
              title="Refresh ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Loading client variation records...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-bold text-sm text-slate-400">No client customization requests matching filter.</div>
            <div className="text-xs text-slate-500">Click "Log Buyer Variation Order" to create custom trade works and link to RA Bills.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Flat & Room Zone</th>
                  <th className="p-3.5">Variation Scope</th>
                  <th className="p-3.5">Assigned Trade & Contractor</th>
                  <th className="p-3.5 text-right">Quoted to Buyer (₹)</th>
                  <th className="p-3.5 text-right">Contractor Cost (₹)</th>
                  <th className="p-3.5 text-right">Dev Net Margin (₹)</th>
                  <th className="p-3.5 text-center">Execution & RA Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequests.map(r => {
                  const quote = Number(r.quoted_amount || 0);
                  const cost = Number(r.contractor_cost || 0);
                  const margin = quote - cost;
                  const title = r.change_title || r.request_title;
                  const description = r.change_description || r.scope_details;
                  const contractorName = r.contractor_company_name || r.company_name || 'Not Assigned';
                  const roomName = r.room_zone_label || 'Full Flat';
                  const isCompleted = r.status === 'COMPLETED';

                  return (
                    <tr key={`change-${r.id}`} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5">
                        <div className="font-black text-white flex items-center space-x-1.5">
                          <Home className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Wing {r.wing} - {r.flat_number}</span>
                        </div>
                        <div className="text-[10px] text-amber-400/90 font-semibold mt-0.5 flex items-center space-x-1">
                          <Layers className="w-2.5 h-2.5 shrink-0" />
                          <span>{roomName}</span>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-white leading-tight">{title}</div>
                        {description && (
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{description}</div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="inline-block px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md font-extrabold text-[9px] uppercase tracking-wider mb-1">
                          {r.trade_type || 'GENERAL'}
                        </span>
                        <div className="font-bold text-slate-200 flex items-center space-x-1">
                          <HardHat className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{contractorName}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-black text-sm text-white">
                        ₹{quote.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-rose-400">
                        ₹{cost.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-right font-black text-emerald-400 text-sm">
                        ₹{margin.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3.5 text-center">
                        {isCompleted ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>COMPLETED</span>
                            </span>
                            <span className="text-[9px] text-emerald-500 font-bold mt-0.5">Ready for RA Bill</span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-0.5 rounded-full font-extrabold text-[10px] bg-sky-950 text-sky-400 border border-sky-800 flex items-center space-x-1">
                              <Sparkles className="w-3 h-3" />
                              <span>IN EXECUTION</span>
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">Micro-Task Active</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {!isCompleted ? (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'COMPLETED')}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black transition flex items-center space-x-1 mx-auto shadow-md shadow-emerald-900/30"
                            title="Certify task completion and push to Subcontractor RA Bill"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Certify & Bill</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-bold">Certified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Buyer Customization Variation Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Log Buyer Customization & RA Variation</h3>
                  <p className="text-[11px] text-slate-400">Creates room micro-task and links payout to Contractor RA Bill</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg transition hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChange} className="space-y-4">
              {/* Row 1: Flat & Room Zone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Select Flat Unit *
                  </label>
                  <select
                    value={flatId}
                    onChange={(e) => setFlatId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="">Select Flat...</option>
                    {flats.map(f => (
                      <option key={f.id} value={f.id}>
                        Wing {f.wing} - Flat {f.flat_number || f.flatNumber} ({f.flat_type || f.unit_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Room / Zone *
                  </label>
                  <select
                    value={roomZoneId}
                    onChange={(e) => setRoomZoneId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="">Select Room Zone...</option>
                    {roomZones.map(rz => (
                      <option key={rz.id} value={rz.id}>
                        {rz.zone_label || rz.zoneLabel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Trade & Subcontractor Agency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Trade Category *
                  </label>
                  <select
                    value={tradeType}
                    onChange={(e) => {
                      setTradeType(e.target.value);
                      setContractorId('');
                    }}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    {dynamicTrades.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Assign Subcontractor Agency *
                  </label>
                  <select
                    value={contractorId}
                    onChange={(e) => setContractorId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="">Select Subcontractor...</option>
                    {matchingContractors.length > 0 && (
                      <optgroup label={`Matching ${tradeType} Agencies`}>
                        {matchingContractors.map(c => (
                          <option key={`match-${c.id}`} value={c.id}>
                            {c.company_name || c.companyName} ({c.trade_type || c.tradeType})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="All Contractors">
                      {contractors.map(c => (
                        <option key={`all-${c.id}`} value={c.id}>
                          {c.company_name || c.companyName} ({c.trade_type || c.tradeType})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Variation Order Title */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Variation Order Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Italian Statuario Marble Flooring Upgrade in Living & Dining"
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              {/* Commercial Pricing: Quoted to Buyer vs Contractor Cost */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-3">
                <div className="text-[10px] font-black uppercase text-amber-400 flex items-center justify-between">
                  <span>Commercial Head & RA Billing Breakdown</span>
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Quoted to Buyer (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 85000"
                      value={quotedAmount}
                      onChange={(e) => handleQuoteChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Contractor Execution Cost (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 55000"
                      value={contractorCost}
                      onChange={(e) => setContractorCost(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-rose-400 font-black outline-none"
                    />
                  </div>
                </div>

                {liveQuote > 0 && (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs">
                    <span className="font-bold text-slate-300">Developer Gross Margin:</span>
                    <span className="font-black text-emerald-400">
                      ₹{liveMargin.toLocaleString('en-IN')} ({liveMarginPct}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Scope & Specifications Details */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Scope & Specifications Details
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. 800x1600mm Statuario Glazed Vitrified Tiles with paper joint laying & epoxy grouting"
                  value={scopeDetails}
                  onChange={(e) => setScopeDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              {/* Execution Micro-Task Sync Option */}
              <div className="flex items-center space-x-2.5 p-3 bg-slate-950/90 border border-slate-800 rounded-xl">
                <input
                  type="checkbox"
                  id="createMicroTaskCheckbox"
                  checked={createMicroTask}
                  onChange={(e) => setCreateMicroTask(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="createMicroTaskCheckbox" className="text-xs font-bold text-slate-200 cursor-pointer">
                  Auto-create inspection Micro-Task in Room Matrix & link to Contractor RA Bill
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-1 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{isSubmitting ? 'Recording...' : 'Record Variation Order & Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientChangesWorkspace;
