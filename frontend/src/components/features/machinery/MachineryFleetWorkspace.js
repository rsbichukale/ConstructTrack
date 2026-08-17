'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Settings, 
  Plus, 
  CheckCircle2, 
  UserCheck, 
  Building2, 
  Search, 
  X,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const MachineryFleetWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [machineName, setMachineName] = useState('');
  const [machineType, setMachineType] = useState('TOWER_CRANE');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [ownershipType, setOwnershipType] = useState('RENTED');
  const [operatorName, setOperatorName] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/machinery');
      setFleet(res?.machinery || state.machinery || []);
    } catch (e) {
      console.error(e);
      setFleet(state.machinery || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleRegisterAsset = async (e) => {
    e.preventDefault();
    if (!machineName || !registrationNumber) return;

    try {
      await apiClient.post('/machinery', {
        machineName,
        machineType,
        registrationNumber,
        ownershipType,
        operatorName,
        hourlyRate: Number(hourlyRate) || 0
      });
      setIsModalOpen(false);
      setMachineName('');
      setRegistrationNumber('');
      setOperatorName('');
      setStatusMessage('Plant & machinery asset registered in fleet registry!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchFleet();
    } catch (e) {
      console.error(e);
    }
  };

  const totalAssets = fleet.length;
  const activeAssets = fleet.filter(f => (f.status || 'OPERATIONAL') === 'OPERATIONAL').length;
  const rentedAssets = fleet.filter(f => (f.ownership_type || f.ownershipType) === 'RENTED').length;
  const ownedAssets = fleet.filter(f => (f.ownership_type || f.ownershipType) === 'OWNED').length;

  const filteredFleet = fleet.filter(f => 
    (f.machine_name || f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.registration_number || f.regNo || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Truck className="w-4 h-4" />
            <span>Heavy Plant & Equipment Registry</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Plant Equipment Asset Registry</h2>
          <p className="text-xs text-slate-400">
            Tower cranes, concrete boom pumps, transit mixers, backhoes, excavators, and DG sets.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-purple-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Register Plant Equipment</span>
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
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Fleet Assets</div>
          <div className="text-3xl font-black text-white mt-1">{totalAssets}</div>
          <div className="text-[10px] text-purple-400 font-bold mt-1">Registered Heavy Plant</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-emerald-400">Operational On Site</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">{activeAssets}</div>
          <div className="text-[10px] text-slate-400 mt-1">100% Fit & Certified</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-amber-400">Rented Equipment</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{rentedAssets}</div>
          <div className="text-[10px] text-slate-400 mt-1">Commercial Monthly Billing</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-sky-400">Owned Capital Assets</div>
          <div className="text-3xl font-black text-sky-400 mt-1">{ownedAssets}</div>
          <div className="text-[10px] text-slate-400 mt-1">Developer Owned Fleet</div>
        </div>
      </div>

      {/* Grid of Equipment Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-purple-400" />
            <h3 className="font-extrabold text-white text-sm">Site Plant Equipment Cards</h3>
          </div>

          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search asset or reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading machinery assets...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFleet.map(f => {
              const name = f.machine_name || f.name;
              const reg = f.registration_number || f.regNo;
              const type = f.machine_type || f.type || 'HEAVY_PLANT';
              const operator = f.operator_name || f.operator || 'Assigned Operator';
              const ownership = f.ownership_type || f.ownershipType || 'RENTED';
              const rate = f.hourly_rate || f.rate || 1200;

              return (
                <div key={`mach-${f.id}`} className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition space-y-3 shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-400 inline-block mb-1">
                        {type.replace('_', ' ')}
                      </span>
                      <h3 className="font-extrabold text-white text-sm">{name}</h3>
                    </div>
                    <span className="text-xs font-mono text-purple-400 bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded-lg">
                      {reg}
                    </span>
                  </div>

                  <div className="border-t border-slate-800/80 pt-2 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Operator:</span>
                      <span className="font-bold text-white">{operator}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Ownership:</span>
                      <span className="font-bold text-amber-400">{ownership}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Hourly Rate:</span>
                      <span className="font-mono text-emerald-400 font-bold">₹{rate} / hr</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                    <span className="text-emerald-400 font-bold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      <span>OPERATIONAL</span>
                    </span>
                    <span className="text-slate-500 font-mono">ID: #{f.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Register Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Register Heavy Plant Asset</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterAsset} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Equipment / Machine Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower Crane Potain MC85"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Machine Type</label>
                  <select
                    value={machineType}
                    onChange={(e) => setMachineType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="TOWER_CRANE">Tower Crane</option>
                    <option value="BOOM_PUMP">Concrete Boom Pump</option>
                    <option value="TRANSIT_MIXER">Transit Mixer (TM)</option>
                    <option value="EXCAVATOR">Excavator / JCB</option>
                    <option value="GENERATOR_DG">Silent DG Generator</option>
                    <option value="PASSENGER_HOIST">Builder Passenger Hoist</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Registration / Asset No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TC-01 / MH-12-XX"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ownership</label>
                  <select
                    value={ownershipType}
                    onChange={(e) => setOwnershipType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="RENTED">Rented</option>
                    <option value="OWNED">Owned</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Operator Name</label>
                  <input
                    type="text"
                    placeholder="Operator name"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    placeholder="1200"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
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
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineryFleetWorkspace;
