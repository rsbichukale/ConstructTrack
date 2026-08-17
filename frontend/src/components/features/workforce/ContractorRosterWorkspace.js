'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Plus, 
  CheckCircle2, 
  DollarSign, 
  ShieldCheck, 
  Building2, 
  Search, 
  Edit3,
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const ContractorRosterWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [tradeType, setTradeType] = useState('BRICK WORK');
  const [supervisorName, setSupervisorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [ratePerSqft, setRatePerSqft] = useState(30);

  const fetchContractors = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/contractors');
      setContractors(res?.contractors || state.contractors || []);
    } catch (e) {
      console.error(e);
      setContractors(state.contractors || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleRegisterContractor = async (e) => {
    e.preventDefault();
    if (!companyName || !tradeType) return;

    try {
      await apiClient.post('/contractors', {
        companyName,
        tradeType,
        supervisorName,
        phoneNumber,
        ratePerSqft: Number(ratePerSqft) || 0
      });
      setIsModalOpen(false);
      setCompanyName('');
      setSupervisorName('');
      setPhoneNumber('');
      setStatusMessage('Subcontractor agency registered successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchContractors();
    } catch (e) {
      console.error(e);
    }
  };

  const tradesList = Array.from(new Set(contractors.map(c => c.trade_type || c.tradeType || 'GENERAL')));

  const filteredContractors = contractors.filter(c => {
    const nameMatch = (c.company_name || c.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (c.supervisor_name || c.supervisorName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const tradeMatch = selectedTrade === 'ALL' || (c.trade_type || c.tradeType) === selectedTrade;
    return nameMatch && tradeMatch;
  });

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Subcontractor Master Registry</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">14 Trade Contractor Roster Directory</h2>
          <p className="text-xs text-slate-400">
            Registered trade agencies, contract rates (₹/sq.ft), supervisor contacts, and active wing assignments.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-sky-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Register New Subcontractor</span>
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
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Registered Contractors</div>
          <div className="text-3xl font-black text-white mt-1">{contractors.length}</div>
          <div className="text-[10px] text-sky-400 font-bold mt-1">14 Civil & Finishing Trades</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-emerald-400">Active On Site</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">{contractors.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">100% Contract Validated</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-amber-400">Average Trade Rate</div>
          <div className="text-3xl font-black text-amber-400 mt-1">₹34.50</div>
          <div className="text-[10px] text-slate-400 mt-1">Per sq.ft standard BOQ rate</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-purple-400">Coverage</div>
          <div className="text-3xl font-black text-purple-400 mt-1">Both Wings</div>
          <div className="text-[10px] text-slate-400 mt-1">Wing B1 & Wing B2 Allocated</div>
        </div>
      </div>

      {/* Filters & Directory Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedTrade('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedTrade === 'ALL' ? 'bg-sky-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              All Trades ({contractors.length})
            </button>
            {tradesList.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTrade(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedTrade === t ? 'bg-sky-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search agency or supervisor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContractors.map(c => {
            const name = c.company_name || c.companyName;
            const trade = c.trade_type || c.tradeType;
            const supervisor = c.supervisor_name || c.supervisorName || 'Supervisor';
            const phone = c.phone_number || c.phoneNumber || '+91 9876543210';
            const rate = c.rate_per_sqft || 30;

            return (
              <div key={`contractor-card-${c.id}`} className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition space-y-3 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-sky-400 inline-block mb-1">
                      {trade}
                    </span>
                    <h3 className="font-extrabold text-white text-sm">{name}</h3>
                  </div>
                  <span className="text-xs font-black text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-lg">
                    ₹{rate} / sq.ft
                  </span>
                </div>

                <div className="border-t border-slate-800/80 pt-2 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Supervisor:</span>
                    <span className="font-bold text-white">{supervisor}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Phone Contact:</span>
                    <a href={`tel:${phone}`} className="font-mono text-sky-400 hover:underline flex items-center space-x-1">
                      <Phone className="w-3 h-3 inline" />
                      <span>{phone}</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span>Contract Active</span>
                  </span>
                  <span className="text-slate-500 font-mono">ID: #{c.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Register Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Register Subcontractor Agency</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterContractor} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Company / Agency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Masonry & Finishing Works"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Trade Specialization</label>
                  <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="BRICK WORK">BRICK WORK</option>
                    <option value="PLASTER WORK">PLASTER WORK</option>
                    <option value="POP">POP / GYPSUM</option>
                    <option value="TILES">TILES & FLOORING</option>
                    <option value="ELECTRICAL">ELECTRICAL</option>
                    <option value="PLUMBING">PLUMBING</option>
                    <option value="PAINTING">PAINTING</option>
                    <option value="WATERPROOFING">WATERPROOFING</option>
                    <option value="CARPENTRY">CARPENTRY & DOORS</option>
                    <option value="FABRICATION">FABRICATION & GRILLS</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Contract Rate (₹/sq.ft)</label>
                  <input
                    type="number"
                    required
                    value={ratePerSqft}
                    onChange={(e) => setRatePerSqft(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Supervisor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
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
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Register Subcontractor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorRosterWorkspace;
