import React, { useState } from 'react';
import { Building, Users, UserCheck, CheckCircle2, Plus, Filter, Zap, Shield, Phone, Mail, DollarSign, Award, Layers, Trash2, PauseCircle, PlayCircle, AlertCircle } from 'lucide-react';
import { getAppState, saveAppState } from '@/lib/dbState';
import { Contractor, Laborer, TradeType, SkillLevel, FlatTaskPriority } from '@/lib/types';

export const ContractorManagementSuite: React.FC = () => {
  const state = getAppState();
  const [activeTab, setActiveTab] = useState<'contractors' | 'assignment' | 'laborers'>('contractors');
  const [contractorMessage, setContractorMessage] = useState<string | null>(null);

  // Contractor Form State
  const [isAddingContractor, setIsAddingContractor] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [tradeType, setTradeType] = useState<TradeType>('BRICK WORK');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState<number>(1.50);
  const [wingScope, setWingScope] = useState<'B1' | 'B2' | 'ALL'>('ALL');

  // Toggle Suspend / Active status
  const handleToggleSuspend = (contractorId: number) => {
    const updatedContractors = state.contractors.map(c => {
      if (c.id === contractorId) {
        const nextStatus = c.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        return { ...c, status: nextStatus as 'ACTIVE' | 'SUSPENDED' };
      }
      return c;
    });

    saveAppState({
      ...state,
      contractors: updatedContractors,
    });

    const c = state.contractors.find(con => con.id === contractorId);
    setContractorMessage(`Contractor ${c?.companyName} status updated.`);
    setTimeout(() => setContractorMessage(null), 3000);
  };

  // Delete Contractor
  const handleDeleteContractor = (contractorId: number) => {
    const c = state.contractors.find(con => con.id === contractorId);
    if (!confirm(`Are you sure you want to delete contractor "${c?.companyName}"?`)) return;

    const updatedContractors = state.contractors.filter(con => con.id !== contractorId);
    // Reassign flat tasks to default contractor
    const updatedTasks = state.flatTasks.map(t => {
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

    setContractorMessage(`Contractor "${c?.companyName}" deleted successfully.`);
    setTimeout(() => setContractorMessage(null), 3000);
  };

  // Task Assignment State
  const [assignWing, setAssignWing] = useState<'B1' | 'B2'>('B1');
  const [assignFloor, setAssignFloor] = useState<number>(1);
  const [assignTrade, setAssignTrade] = useState<TradeType>('BRICK WORK');
  const [assignContractorId, setAssignContractorId] = useState<number>(1);
  const [assignPriority, setAssignPriority] = useState<FlatTaskPriority>('MEDIUM');
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);

  // Laborer Form State
  const [isAddingLaborer, setIsAddingLaborer] = useState(false);
  const [laborerName, setLaborerName] = useState('');
  const [laborerContractorId, setLaborerContractorId] = useState<number>(1);
  const [laborerSkill, setLaborerSkill] = useState<SkillLevel>('MASON');
  const [laborerPhone, setLaborerPhone] = useState('');
  const [laborerIdNum, setLaborerIdNum] = useState('');
  const [dailyWage, setDailyWage] = useState<number>(750);
  const [laborFilterContractor, setLaborFilterContractor] = useState<number | 'ALL'>('ALL');

  // Add New Contractor
  const handleAddContractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const newContractor: Contractor = {
      id: Date.now(),
      companyName,
      tradeType,
      contactPerson,
      phone,
      email,
      ratePerUnit,
      status: 'ACTIVE',
      wingScope,
    };

    saveAppState({
      ...state,
      contractors: [...state.contractors, newContractor],
    });

    setIsAddingContractor(false);
    setCompanyName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setWingScope('ALL');
  };

  // Bulk Assign Tasks to Contractor
  const handleBulkAssign = () => {
    const floorFlats = state.flats.filter(f => f.wing === assignWing && f.floorNumber === assignFloor);
    const catalogItems = state.taskCatalog.filter(c => c.tradeType === assignTrade);
    const catalogIds = catalogItems.map(c => c.id);

    const updatedTasks = state.flatTasks.map(t => {
      const flat = state.flats.find(f => f.id === t.flatId);
      if (flat && flat.wing === assignWing && flat.floorNumber === assignFloor && catalogIds.includes(t.taskCatalogId)) {
        return {
          ...t,
          assignedContractorId: assignContractorId,
          priority: assignPriority,
        };
      }
      return t;
    });

    saveAppState({
      ...state,
      flatTasks: updatedTasks,
    });

    const contractor = state.contractors.find(c => c.id === assignContractorId);
    setAssignmentMessage(`Assigned ${assignTrade} tasks on Wing ${assignWing} Floor ${assignFloor} to ${contractor?.companyName}!`);
    setTimeout(() => setAssignmentMessage(null), 3500);
  };

  // Add New Laborer
  const handleAddLaborer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!laborerName.trim()) return;

    const newLaborer: Laborer = {
      id: Date.now(),
      contractorId: laborerContractorId,
      name: laborerName,
      skillLevel: laborerSkill,
      phone: laborerPhone,
      idNumber: laborerIdNum,
      dailyWageRate: dailyWage,
    };

    saveAppState({
      ...state,
      laborers: [...(state.laborers || []), newLaborer],
    });

    setIsAddingLaborer(false);
    setLaborerName('');
    setLaborerPhone('');
    setLaborerIdNum('');
  };

  const filteredLaborers = (state.laborers || []).filter(l => {
    if (laborFilterContractor === 'ALL') return true;
    return l.contractorId === laborFilterContractor;
  });

  const trades: TradeType[] = ['BRICK WORK', 'PLASTER WORK', 'POP', 'TILES', 'PLUMBER', 'FABRICATION', 'WATERPROOFING'];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Building className="w-4 h-4" />
            <span>Contractor & Resource Management Suite</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">Contractor Profiles, Task Assignment & Labor Database</h2>
          <p className="text-xs text-slate-400">Manage trade contractor contracts, assign tasks, and track individual worker registries</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('contractors')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'contractors' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Contractor Directory ({state.contractors.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('assignment')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'assignment' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Task Assignment Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('laborers')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'laborers' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Laborer Database ({(state.laborers || []).length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CONTRACTOR DIRECTORY */}
      {activeTab === 'contractors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registered Trade Contractors</h3>
            <button
              onClick={() => setIsAddingContractor(!isAddingContractor)}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Contractor</span>
            </button>
          </div>

          {/* Add Contractor Form Modal */}
          {isAddingContractor && (
            <form onSubmit={handleAddContractor} className="bg-slate-900 border border-sky-800 p-5 rounded-2xl space-y-4 animate-in fade-in">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">Register New Trade Contractor</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Company Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Masterwork Tiling Pvt Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Trade Category</label>
                  <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value as TradeType)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    {trades.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Contact Person</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Phone Number</label>
                  <input
                    required
                    type="text"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email Address</label>
                  <input
                    type="email"
                    placeholder="contractor@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Site Lead / Supervisor</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar (Lead)"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Wing Assignment Scope</label>
                  <select
                    value={wingScope}
                    onChange={(e) => setWingScope(e.target.value as 'B1' | 'B2' | 'ALL')}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-semibold"
                  >
                    <option value="ALL">🏢 Both Wings (Wing B1 & B2)</option>
                    <option value="B1">🏢 Wing B1 Only</option>
                    <option value="B2">🏢 Wing B2 Only</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddingContractor(false)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold">Save Contractor</button>
              </div>
            </form>
          )}

          {contractorMessage && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{contractorMessage}</span>
            </div>
          )}

          {/* Contractors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.contractors.map((contractor) => {
              const assignedTasks = state.flatTasks.filter(t => t.assignedContractorId === contractor.id);
              const approvedCount = assignedTasks.filter(t => t.status === 'APPROVED').length;
              const pendingCount = assignedTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'INSPECTION_REQUESTED').length;
              const reworkCount = assignedTasks.filter(t => t.status === 'REWORK' || !!t.blockerReason).length;
              const workers = (state.laborers || []).filter(l => l.contractorId === contractor.id);
              const isSuspended = contractor.status === 'SUSPENDED';

              const scopeLabel = contractor.wingScope === 'B1'
                ? 'Wing B1 Only'
                : contractor.wingScope === 'B2'
                ? 'Wing B2 Only'
                : 'Both Wings (B1 & B2)';

              return (
                <div key={contractor.id} className={`bg-slate-900 border p-5 rounded-2xl space-y-3 transition ${
                  isSuspended ? 'border-rose-950 bg-slate-900/60' : 'border-slate-800 hover:border-slate-700'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-md">
                          {contractor.tradeType}
                        </span>
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
                      <h4 className="font-extrabold text-white text-base mt-1.5">{contractor.companyName}</h4>
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

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleToggleSuspend(contractor.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 border ${
                        isSuspended
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                          : 'bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900'
                      }`}
                    >
                      {isSuspended ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                      <span>{isSuspended ? 'Reactivate' : 'Suspend'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteContractor(contractor.id)}
                      className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TASK ASSIGNMENT ENGINE */}
      {activeTab === 'assignment' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Bulk Floor & Trade Task Assignment Engine</span>
            </h3>
            <p className="text-xs text-slate-400">Select Wing, Floor, Trade, and Contractor to assign tasks across all flats on that floor</p>
          </div>

          {assignmentMessage && (
            <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{assignmentMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="text-xs text-slate-400 font-medium">Target Wing</label>
              <select
                value={assignWing}
                onChange={(e) => setAssignWing(e.target.value as 'B1' | 'B2')}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                <option value="B1">Wing B1</option>
                <option value="B2">Wing B2</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Target Floor</label>
              <select
                value={assignFloor}
                onChange={(e) => setAssignFloor(parseInt(e.target.value, 10))}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                {[1, 2, 3, 4, 5, 6, 7].map(f => <option key={f} value={f}>Floor {f}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Trade Category</label>
              <select
                value={assignTrade}
                onChange={(e) => setAssignTrade(e.target.value as TradeType)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                {trades.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Assign To Contractor</label>
              <select
                value={assignContractorId}
                onChange={(e) => setAssignContractorId(parseInt(e.target.value, 10))}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
              >
                {state.contractors
                  .filter(c => (c.wingScope === assignWing || c.wingScope === 'ALL' || !c.wingScope) && c.status !== 'SUSPENDED')
                  .map(c => {
                    const scopeTag = c.wingScope === 'B1' ? '[Wing B1]' : c.wingScope === 'B2' ? '[Wing B2]' : '[Both Wings]';
                    return (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.tradeType}) {scopeTag}
                      </option>
                    );
                  })}
              </select>
            </div>

            <button
              onClick={handleBulkAssign}
              className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Execute Assignment</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: LABORER DATABASE REGISTRY */}
      {activeTab === 'laborers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Labor Worker Registry Database</h3>
            <button
              onClick={() => setIsAddingLaborer(!isAddingLaborer)}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Laborer</span>
            </button>
          </div>

          {/* Add Laborer Form Modal */}
          {isAddingLaborer && (
            <form onSubmit={handleAddLaborer} className="bg-slate-900 border border-emerald-800 p-5 rounded-2xl space-y-4 animate-in fade-in">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Register New Construction Laborer</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Worker Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={laborerName}
                    onChange={(e) => setLaborerName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Assigned Contractor</label>
                  <select
                    value={laborerContractorId}
                    onChange={(e) => setLaborerContractorId(parseInt(e.target.value, 10))}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    {state.contractors.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Skill Level</label>
                  <select
                    value={laborerSkill}
                    onChange={(e) => setLaborerSkill(e.target.value as SkillLevel)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="LEAD">LEAD (Foreman)</option>
                    <option value="MASON">MASON (Skilled)</option>
                    <option value="HELPER">HELPER (Assistant)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9811122233"
                    value={laborerPhone}
                    onChange={(e) => setLaborerPhone(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Gov ID / Aadhaar Number</label>
                  <input
                    type="text"
                    placeholder="AD-8849-1029"
                    value={laborerIdNum}
                    onChange={(e) => setLaborerIdNum(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Daily Wage Rate (₹ / day)</label>
                  <input
                    type="number"
                    value={dailyWage}
                    onChange={(e) => setDailyWage(parseInt(e.target.value, 10) || 0)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAddingLaborer(false)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Register Worker</button>
              </div>
            </form>
          )}

          {/* Laborer Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Worker Name</th>
                    <th className="py-3 px-4">Skill Level</th>
                    <th className="py-3 px-4">Contractor Company</th>
                    <th className="py-3 px-4">Gov ID / Aadhaar</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-right">Daily Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredLaborers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No laborers registered. Click "Register New Laborer" to add worker records.
                      </td>
                    </tr>
                  ) : (
                    filteredLaborers.map((laborer) => {
                      const contractor = state.contractors.find(c => c.id === laborer.contractorId);
                      return (
                        <tr key={laborer.id} className="hover:bg-slate-850/60 transition">
                          <td className="py-3 px-4 font-bold text-white">{laborer.name}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              laborer.skillLevel === 'LEAD'
                                ? 'bg-amber-950 text-amber-400 border-amber-800'
                                : laborer.skillLevel === 'MASON'
                                ? 'bg-sky-950 text-sky-400 border-sky-800'
                                : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            }`}>
                              {laborer.skillLevel}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-300">
                            {laborer.isDepartmentLabor ? (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-md">
                                IN-HOUSE DEPARTMENT
                              </span>
                            ) : (
                              contractor?.companyName || '—'
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">{laborer.idNumber || '—'}</td>
                          <td className="py-3 px-4 text-slate-400">{laborer.phone || '—'}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                            ₹{laborer.dailyWageRate || 0} / day
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
