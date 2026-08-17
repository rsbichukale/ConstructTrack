'use client';

import React, { useState, useEffect } from 'react';
import { Building, Users, UserCheck, CheckCircle2, Plus, Zap, Phone, Trash2, PauseCircle, PlayCircle, Edit, Save, X } from 'lucide-react';
import { getAppState, saveAppState, getDynamicTrades, subscribeState } from '../../lib/dbState';
import { 
  syncContractorToBackend, 
  deleteContractorFromBackend, 
  syncLaborerToBackend, 
  deleteLaborerFromBackend, 
  syncBulkFlatTasksToBackend 
} from '../../lib/backendSync';

export const ContractorManagementSuite = () => {
  // BUG-03: Subscribe to state so contractor/laborer lists re-render on saves
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [activeTab, setActiveTab] = useState('contractors');
  const [contractorMessage, setContractorMessage] = useState(null);

  const trades = getDynamicTrades(state);

  const [isAddingContractor, setIsAddingContractor] = useState(false);
  const [editingContractor, setEditingContractor] = useState(null);

  const availableWings = (state.wings && state.wings.length > 0)
    ? state.wings.map(w => w.wing_code || w.wingCode || w.name || w)
    : Array.from(new Set((state.flats || []).map(f => f.wing))).filter(Boolean);
  const wingsList = availableWings;

  const [companyName, setCompanyName] = useState('');
  const [selectedTradeTypes, setSelectedTradeTypes] = useState(trades[0] ? [trades[0]] : []);
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState(0);
  const [wingScope, setWingScope] = useState('ALL');

  const [isAddingNewTrade, setIsAddingNewTrade] = useState(false);
  const [newTradeName, setNewTradeName] = useState('');

  const handleToggleTradeSelection = (t) => {
    if (selectedTradeTypes.includes(t)) {
      if (selectedTradeTypes.length > 1) {
        setSelectedTradeTypes(selectedTradeTypes.filter(tr => tr !== t));
      }
    } else {
      setSelectedTradeTypes([...selectedTradeTypes, t]);
    }
  };

  const handleCreateCustomTrade = () => {
    if (!newTradeName.trim()) return;
    const formattedTrade = newTradeName.trim().toUpperCase();
    if (!selectedTradeTypes.includes(formattedTrade)) {
      setSelectedTradeTypes([...selectedTradeTypes, formattedTrade]);
    }
    setNewTradeName('');
    setIsAddingNewTrade(false);
  };

  const handleStartAddContractor = () => {
    setCompanyName('');
    setSelectedTradeTypes(trades[0] ? [trades[0]] : []);
    setContactPerson('');
    setPhone('');
    setEmail('');
    setRatePerUnit(0);
    setWingScope('ALL');
    setEditingContractor(null);
    setIsAddingContractor(true);
  };

  const handleStartEditContractor = (c) => {
    setEditingContractor(c);
    setCompanyName(c.companyName);
    const initialTrades = (c.tradeTypes && c.tradeTypes.length > 0) ? c.tradeTypes : [c.tradeType];
    setSelectedTradeTypes(initialTrades);
    setContactPerson(c.contactPerson);
    setPhone(c.phone);
    setEmail(c.email || '');
    setRatePerUnit(c.ratePerUnit || 0);
    setWingScope(c.wingScope || 'ALL');
    setIsAddingContractor(false);
  };

  const handleAddContractor = (e) => {
    e.preventDefault();
    if (!companyName.trim() || selectedTradeTypes.length === 0) return;

    const primaryTrade = selectedTradeTypes[0];
    const newContractor = {
      id: Date.now(),
      companyName: companyName.trim(),
      tradeType: primaryTrade,
      tradeTypes: selectedTradeTypes,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      ratePerUnit,
      status: 'ACTIVE',
      wingScope,
    };

    saveAppState({
      ...state,
      contractors: [...(state.contractors || []), newContractor],
    });

    syncContractorToBackend(newContractor);

    setIsAddingContractor(false);
    setContractorMessage(`Registered contractor "${companyName}" with ${selectedTradeTypes.length} trades (${selectedTradeTypes.join(', ')})!`);
    setTimeout(() => setContractorMessage(null), 3500);
  };

  const handleSaveEditedContractor = (e) => {
    e.preventDefault();
    if (!editingContractor || !companyName.trim() || selectedTradeTypes.length === 0) return;

    const primaryTrade = selectedTradeTypes[0];
    const updatedContractor = {
      ...editingContractor,
      companyName: companyName.trim(),
      tradeType: primaryTrade,
      tradeTypes: selectedTradeTypes,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      ratePerUnit,
      wingScope,
    };

    const updatedContractors = (state.contractors || []).map(c => c.id === editingContractor.id ? updatedContractor : c);

    saveAppState({
      ...state,
      contractors: updatedContractors,
    });

    syncContractorToBackend(updatedContractor);

    setEditingContractor(null);
    setContractorMessage(`Updated contractor "${companyName}" with ${selectedTradeTypes.length} trades (${selectedTradeTypes.join(', ')})!`);
    setTimeout(() => setContractorMessage(null), 3500);
  };

  const handleToggleSuspend = (contractorId) => {
    const updatedContractors = (state.contractors || []).map(c => {
      if (c.id === contractorId) {
        const nextStatus = c.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        return { ...c, status: nextStatus };
      }
      return c;
    });

    saveAppState({
      ...state,
      contractors: updatedContractors,
    });

    const c = (state.contractors || []).find(con => con.id === contractorId);
    if (c) syncContractorToBackend({ ...c, status: c.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' });
    setContractorMessage(`Contractor ${c?.companyName} status updated.`);
    setTimeout(() => setContractorMessage(null), 3000);
  };

  const handleDeleteContractor = (contractorId) => {
    const c = (state.contractors || []).find(con => con.id === contractorId);
    if (!confirm(`Are you sure you want to delete contractor "${c?.companyName}"?`)) return;

    const updatedContractors = (state.contractors || []).filter(con => con.id !== contractorId);
    const updatedTasks = (state.flatTasks || []).map(t => {
      if (t.assignedContractorId === contractorId) {
        return { ...t, assignedContractorId: 1 };
      }
      return t;
    });

    saveAppState({
      ...state,
      contractors: updatedContractors,
      flatTasks: updatedTasks,
    });

    deleteContractorFromBackend(contractorId);

    setContractorMessage(`Contractor "${c?.companyName}" deleted successfully.`);
    setTimeout(() => setContractorMessage(null), 3000);
  };

  const [assignWing, setAssignWing] = useState('B1');
  const [assignFloor, setAssignFloor] = useState(1);
  const [assignTrade, setAssignTrade] = useState('BRICK WORK');
  const [assignContractorId, setAssignContractorId] = useState(1);
  const [assignPriority, setAssignPriority] = useState('MEDIUM');
  const [assignmentMessage, setAssignmentMessage] = useState(null);

  const [isAddingLaborer, setIsAddingLaborer] = useState(false);
  const [laborerName, setLaborerName] = useState('');
  const [laborerContractorId, setLaborerContractorId] = useState(1);
  const [laborerSkill, setLaborerSkill] = useState('MASON');
  const [laborerPhone, setLaborerPhone] = useState('');
  const [laborerIdNum, setLaborerIdNum] = useState('');
  const [dailyWage, setDailyWage] = useState(750);
  const [laborFilterContractor, setLaborFilterContractor] = useState('ALL');

  const handleBulkAssign = () => {
    const catalogItems = (state.taskCatalog || []).filter(c => c.tradeType === assignTrade);
    const catalogIds = catalogItems.map(c => c.id);

    const changedTasks = [];
    const updatedTasks = (state.flatTasks || []).map(t => {
      const flat = (state.flats || []).find(f => f.id === t.flatId);
      if (flat && flat.wing === assignWing && flat.floorNumber === assignFloor && catalogIds.includes(t.taskCatalogId)) {
        const updated = {
          ...t,
          assignedContractorId: assignContractorId,
          priority: assignPriority,
        };
        changedTasks.push(updated);
        return updated;
      }
      return t;
    });

    saveAppState({
      ...state,
      flatTasks: updatedTasks,
    });

    syncBulkFlatTasksToBackend(changedTasks);

    const contractor = (state.contractors || []).find(c => c.id === assignContractorId);
    setAssignmentMessage(`Assigned ${assignTrade} tasks on Wing ${assignWing} Floor ${assignFloor} to ${contractor?.companyName}!`);
    setTimeout(() => setAssignmentMessage(null), 3500);
  };

  const handleAddLaborer = (e) => {
    e.preventDefault();
    if (!laborerName.trim()) return;

    const newLaborer = {
      id: Date.now(),
      contractorId: laborerContractorId,
      name: laborerName.trim(),
      skillLevel: laborerSkill,
      phone: laborerPhone.trim(),
      idNumber: laborerIdNum.trim(),
      dailyWageRate: dailyWage,
    };

    saveAppState({
      ...state,
      laborers: [...(state.laborers || []), newLaborer],
    });

    syncLaborerToBackend(newLaborer);

    setIsAddingLaborer(false);
    setLaborerName('');
    setLaborerPhone('');
    setLaborerIdNum('');
  };

  const [editingLaborer, setEditingLaborer] = useState(null);
  const [editLaborerName, setEditLaborerName] = useState('');
  const [editLaborerContractorId, setEditLaborerContractorId] = useState(1);
  const [editLaborerSkill, setEditLaborerSkill] = useState('MASON');
  const [editLaborerPhone, setEditLaborerPhone] = useState('');
  const [editLaborerIdNum, setEditLaborerIdNum] = useState('');
  const [editDailyWage, setEditDailyWage] = useState(750);

  const handleStartEditLaborer = (l) => {
    setEditingLaborer(l);
    setEditLaborerName(l.name);
    setEditLaborerContractorId(l.contractorId || 1);
    setEditLaborerSkill(l.skillLevel);
    setEditLaborerPhone(l.phone || '');
    setEditLaborerIdNum(l.idNumber || '');
    setEditDailyWage(l.dailyWageRate || 750);
  };

  const handleSaveEditedLaborer = (e) => {
    e.preventDefault();
    if (!editingLaborer || !editLaborerName.trim()) return;

    const updatedLaborer = {
      ...editingLaborer,
      name: editLaborerName.trim(),
      contractorId: editLaborerContractorId,
      skillLevel: editLaborerSkill,
      phone: editLaborerPhone.trim(),
      idNumber: editLaborerIdNum.trim(),
      dailyWageRate: editDailyWage,
    };

    const updatedList = (state.laborers || []).map(l => l.id === editingLaborer.id ? updatedLaborer : l);

    saveAppState({
      ...state,
      laborers: updatedList,
    });

    syncLaborerToBackend(updatedLaborer);

    setEditingLaborer(null);
    setContractorMessage(`Updated worker "${editLaborerName}" details.`);
    setTimeout(() => setContractorMessage(null), 3000);
  };

  const handleDeleteLaborer = (laborerId) => {
    const l = (state.laborers || []).find(w => w.id === laborerId);
    if (!confirm(`Are you sure you want to delete worker "${l?.name}"?`)) return;

    const updatedList = (state.laborers || []).filter(w => w.id !== laborerId);

    saveAppState({
      ...state,
      laborers: updatedList,
    });

    deleteLaborerFromBackend(laborerId);

    setContractorMessage(`Deleted worker "${l?.name}".`);
    setTimeout(() => setContractorMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <Building className="w-4 h-4" />
              <span>Contractor & Resource Command Center</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Multi-Trade Contractors, Work Allocations & Site Labor Force
            </h2>
            <p className="text-xs text-slate-400">
              Register contractors with single or multiple trade capabilities (e.g. Brickwork + Plastering) and assign floor tasks
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('contractors')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition ${
                activeTab === 'contractors' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👷 Registered Contractors ({(state.contractors || []).length})</span>
            </button>
            <button
              onClick={() => setActiveTab('assignment')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition ${
                activeTab === 'assignment' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>⚡ Bulk Floor Allocation</span>
            </button>
            <button
              onClick={() => setActiveTab('laborers')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition ${
                activeTab === 'laborers' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>🛠️ Site Labor Force ({(state.laborers || []).length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'contractors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registered Trade Contractors</h3>
            <button
              onClick={handleStartAddContractor}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Contractor</span>
            </button>
          </div>

          {isAddingContractor && (
            <form onSubmit={handleAddContractor} className="bg-slate-900 border border-sky-800 p-5 rounded-2xl space-y-4 animate-in fade-in">
              <h4 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider">Register New Multi-Trade Contractor</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Company Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Masterwork Civil & Plastering Pvt Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Contact Person (Owner/Lead)</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    required
                    type="text"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-sky-300 uppercase tracking-wider block">
                    Trade Capabilities (Select All Trades This Contractor Executes):
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewTrade(!isAddingNewTrade)}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingNewTrade ? 'Cancel' : '+ Custom Trade'}</span>
                  </button>
                </div>

                {isAddingNewTrade && (
                  <div className="flex items-center space-x-1.5 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. SOLAR, HVAC, FIRE SAFETY"
                      value={newTradeName}
                      onChange={(e) => setNewTradeName(e.target.value)}
                      className="w-full bg-slate-950 border border-sky-500/50 rounded-xl p-2 text-xs text-white uppercase focus:ring-1 focus:ring-sky-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCustomTrade}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition shrink-0"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  {trades.map(t => {
                    const isSelected = selectedTradeTypes.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleToggleTradeSelection(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 border ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs text-slate-400">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="contractor@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Wing Scope</label>
                  <select
                    value={wingScope}
                    onChange={(e) => setWingScope(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-semibold"
                  >
                    <option value="ALL">🏢 All Wings</option>
                    {wingsList.map(w => (
                      <option key={w} value={w}>🏢 Wing {w} Only</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddingContractor(false)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black shadow">Save Contractor</button>
              </div>
            </form>
          )}

          {contractorMessage && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-3.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{contractorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(state.contractors || []).map((contractor) => {
              const assignedTasks = (state.flatTasks || []).filter(t => t.assignedContractorId === contractor.id);
              const approvedCount = assignedTasks.filter(t => t.status === 'APPROVED').length;
              const workers = (state.laborers || []).filter(l => l.contractorId === contractor.id);
              const isSuspended = contractor.status === 'SUSPENDED';

              const contractorTrades = (contractor.tradeTypes && contractor.tradeTypes.length > 0)
                ? contractor.tradeTypes
                : [contractor.tradeType];

              const scopeLabel = contractor.wingScope === 'ALL' || !contractor.wingScope
                ? 'All Wings'
                : `Wing ${contractor.wingScope} Only`;

              return (
                <div key={contractor.id} className={`bg-slate-900 border p-5 rounded-2xl space-y-3 transition flex flex-col justify-between ${
                  isSuspended ? 'border-rose-950 bg-slate-900/60' : 'border-slate-800 hover:border-slate-700'
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {contractorTrades.map(tr => (
                            <span key={tr} className="text-[10px] font-extrabold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-md uppercase">
                              {tr}
                            </span>
                          ))}
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-md">
                            🏢 {scopeLabel}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            isSuspended
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          }`}>
                            {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-white text-base mt-2">{contractor.companyName}</h4>
                        <p className="text-xs text-slate-400">{contractor.contactPerson} • {contractor.phone}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-950 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-slate-400 text-[10px]">Assigned</div>
                        <div className="font-extrabold text-white font-mono">{assignedTasks.length}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Approved</div>
                        <div className="font-extrabold text-emerald-400 font-mono">{approvedCount}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">Workers</div>
                        <div className="font-extrabold text-amber-400 font-mono">{workers.length}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handleStartEditContractor(contractor)}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Trades</span>
                    </button>

                    <button
                      onClick={() => handleToggleSuspend(contractor.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
                        isSuspended
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {isSuspended ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                      <span>{isSuspended ? 'Reactivate' : 'Suspend'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteContractor(contractor.id)}
                      className="p-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold transition"
                      title="Delete Contractor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingContractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Contractor Trades & Profile</h3>
              <button onClick={() => setEditingContractor(null)} className="p-1.5 bg-slate-800 text-slate-400 rounded-xl"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveEditedContractor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-sky-300 uppercase tracking-wider block">
                  Assigned Trades (Toggle to Add/Remove Trade Capabilities):
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto">
                  {trades.map(t => {
                    const isSelected = selectedTradeTypes.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleToggleTradeSelection(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 border ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                        }`}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Wing Assignment Scope</label>
                  <select
                    value={wingScope}
                    onChange={(e) => setWingScope(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-semibold"
                  >
                    <option value="ALL">🏢 Both Wings (B1 & B2)</option>
                    <option value="B1">🏢 Wing B1 Only</option>
                    <option value="B2">🏢 Wing B2 Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setEditingContractor(null)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow"><Save className="w-4 h-4" /><span>Save Changes</span></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'assignment' && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Bulk Floor Task Assignment to Contractor</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-400">Wing</label>
              <select
                value={assignWing}
                onChange={(e) => setAssignWing(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value="B1">Wing B1</option>
                <option value="B2">Wing B2</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400">Floor Number</label>
              <select
                value={assignFloor}
                onChange={(e) => setAssignFloor(parseInt(e.target.value, 10))}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                {Array.from({ length: 7 }, (_, i) => i + 1).map(fl => (
                  <option key={fl} value={fl}>Floor {fl}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400">Trade Category</label>
              <select
                value={assignTrade}
                onChange={(e) => setAssignTrade(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                {trades.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400">Assign Contractor</label>
              <select
                value={assignContractorId}
                onChange={(e) => setAssignContractorId(parseInt(e.target.value, 10))}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                {(state.contractors || []).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({(c.tradeTypes && c.tradeTypes.length > 0) ? c.tradeTypes.join(', ') : c.tradeType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleBulkAssign}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow"
            >
              <Zap className="w-4 h-4" />
              <span>Assign All {assignTrade} Tasks on Floor {assignFloor}</span>
            </button>
          </div>

          {assignmentMessage && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{assignmentMessage}</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'laborers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>Site Labor Force & Worker Directory ({(state.laborers || []).length})</span>
              </h3>
              <p className="text-xs text-slate-400">Manage individual masons, plumbers, electricians, and department helpers</p>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={laborFilterContractor}
                onChange={(e) => setLaborFilterContractor(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value="ALL">🏢 All Contractors ({(state.contractors || []).length})</option>
                {(state.contractors || []).map(c => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>

              <button
                onClick={() => setIsAddingLaborer(!isAddingLaborer)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Register Worker</span>
              </button>
            </div>
          </div>

          {isAddingLaborer && (
            <form onSubmit={handleAddLaborer} className="bg-slate-900 border border-purple-800/80 p-5 rounded-2xl space-y-4 animate-in fade-in">
              <h4 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">Register Site Worker / Laborer</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Worker Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={laborerName}
                    onChange={(e) => setLaborerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Assigned Contractor</label>
                  <select
                    value={laborerContractorId}
                    onChange={(e) => setLaborerContractorId(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    {(state.contractors || []).map(c => (
                      <option key={c.id} value={c.id}>{c.companyName} ({c.tradeType})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Skill Category</label>
                  <select
                    value={laborerSkill}
                    onChange={(e) => setLaborerSkill(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    <option value="MASON">🧱 MASON / SKILLED</option>
                    <option value="HELPER">🛠️ HELPER / UNSKILLED</option>
                    <option value="TILE_FITTER">🔲 TILE FITTER</option>
                    <option value="PLUMBER">🚰 PLUMBER</option>
                    <option value="ELECTRICIAN">⚡ ELECTRICIAN</option>
                    <option value="PAINTER">🎨 PAINTER</option>
                    <option value="CARPENTER">🪚 CARPENTER</option>
                    <option value="SUPERVISOR">📋 FOREMAN / SUPERVISOR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={laborerPhone}
                    onChange={(e) => setLaborerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Government ID / Aadhaar (Optional)</label>
                  <input
                    type="text"
                    placeholder="XXXX-XXXX-XXXX"
                    value={laborerIdNum}
                    onChange={(e) => setLaborerIdNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Daily Wage Rate (₹ / Day)</label>
                  <input
                    type="number"
                    min={300}
                    max={3000}
                    value={dailyWage}
                    onChange={(e) => setDailyWage(parseInt(e.target.value, 10) || 750)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-400 font-mono font-extrabold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddingLaborer(false)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow">Save Worker</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(state.laborers || [])
              .filter(l => (laborFilterContractor === 'ALL' ? true : l.contractorId === laborFilterContractor))
              .map((laborer, lIdx) => {
                const contractor = (state.contractors || []).find(c => c.id === laborer.contractorId);
                return (
                  <div key={laborer.id || `laborer-${lIdx}`} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-purple-400 bg-purple-950 border border-purple-800 px-2 py-0.5 rounded uppercase">
                          {laborer.skillLevel}
                        </span>
                        <h4 className="font-extrabold text-white text-sm mt-1.5">{laborer.name}</h4>
                        <p className="text-xs text-slate-400 font-semibold">{contractor?.companyName || 'In-House Department'}</p>
                      </div>

                      <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-1 rounded-xl">
                        ₹{laborer.dailyWageRate || 750}/day
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                      <span>📞 {laborer.phone || 'N/A'}</span>
                      <span>ID: {laborer.idNumber || 'Not Uploaded'}</span>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/50">
                      <button
                        onClick={() => handleStartEditLaborer(laborer)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteLaborer(laborer.id)}
                        className="p-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold transition"
                        title="Delete Worker"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {editingLaborer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Site Worker Profile</h3>
              <button onClick={() => setEditingLaborer(null)} className="p-1.5 bg-slate-800 text-slate-400 rounded-xl"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveEditedLaborer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Worker Full Name</label>
                  <input
                    type="text"
                    required
                    value={editLaborerName || ''}
                    onChange={(e) => setEditLaborerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Assigned Contractor</label>
                  <select
                    value={editLaborerContractorId || 1}
                    onChange={(e) => setEditLaborerContractorId(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    {(state.contractors || []).map((c, cIdx) => (
                      <option key={c.id || `c-${cIdx}`} value={c.id}>{c.companyName} ({c.tradeType})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Skill Category</label>
                  <select
                    value={editLaborerSkill || 'MASON'}
                    onChange={(e) => setEditLaborerSkill(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    <option value="MASON">🧱 MASON / SKILLED</option>
                    <option value="HELPER">🛠️ HELPER / UNSKILLED</option>
                    <option value="TILE_FITTER">🔲 TILE FITTER</option>
                    <option value="PLUMBER">🚰 PLUMBER</option>
                    <option value="ELECTRICIAN">⚡ ELECTRICIAN</option>
                    <option value="PAINTER">🎨 PAINTER</option>
                    <option value="CARPENTER">🪚 CARPENTER</option>
                    <option value="SUPERVISOR">📋 FOREMAN / SUPERVISOR</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Daily Wage Rate (₹ / Day)</label>
                  <input
                    type="number"
                    min={300}
                    max={3000}
                    value={editDailyWage || 750}
                    onChange={(e) => setEditDailyWage(parseInt(e.target.value, 10) || 750)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-400 font-mono font-extrabold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editLaborerPhone || ''}
                    onChange={(e) => setEditLaborerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">ID / Aadhaar Number</label>
                  <input
                    type="text"
                    value={editLaborerIdNum || ''}
                    onChange={(e) => setEditLaborerIdNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setEditingLaborer(null)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow"><Save className="w-4 h-4" /><span>Save Changes</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
