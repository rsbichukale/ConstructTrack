'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  UserCheck, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Search, 
  X,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const VisitorGatePassWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [visitorName, setVisitorName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [purpose, setPurpose] = useState('Structural Consultant Site Inspection');
  const [hostPerson, setHostPerson] = useState('Project Manager Rajesh');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/visitors');
      setVisitors(res?.visitors || []);
    } catch (e) {
      console.error(e);
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleCreatePass = async (e) => {
    e.preventDefault();
    if (!visitorName) return;

    try {
      await apiClient.post('/visitors', {
        visitorName,
        phoneNumber,
        purpose,
        hostPerson,
        vehicleNumber
      });
      setIsModalOpen(false);
      setVisitorName('');
      setPhoneNumber('');
      setVehicleNumber('');
      setStatusMessage('Digital Visitor Gate Pass issued & logged!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchVisitors();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckOut = async (id) => {
    try {
      await apiClient.patch(`/visitors/${id}/checkout`, {});
      fetchVisitors();
    } catch (e) {
      console.error(e);
    }
  };

  const totalVisitors = visitors.length;
  const activeInside = visitors.filter(v => !v.out_time).length;

  const filteredVisitors = visitors.filter(v => 
    (v.visitor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.purpose || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.vehicle_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Site Security & Gate Management</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Visitor & Vehicle Gate Passes</h2>
          <p className="text-xs text-slate-400">
            Digital gate entry passes for architects, consultants, material delivery drivers, prospective buyers, and government inspectors.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-teal-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Issue Gate Pass</span>
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
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Visits Today</div>
          <div className="text-3xl font-black text-white mt-1">{totalVisitors}</div>
          <div className="text-[10px] text-teal-400 font-bold mt-1">Registered Digital Gate Passes</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-amber-400">Currently Inside Site</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{activeInside} Persons</div>
          <div className="text-[10px] text-slate-400 mt-1">Active Badges On-Site</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-emerald-400">PPE Issued at Gate</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">100%</div>
          <div className="text-[10px] text-slate-400 mt-1">Visitor Helmets & Vests Checked</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-purple-400">Gate Security Level</div>
          <div className="text-3xl font-black text-purple-400 mt-1">SECURE</div>
          <div className="text-[10px] text-slate-400 mt-1">Automated Entry & Exit Logging</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-teal-400" />
            <h3 className="font-extrabold text-white text-sm">Site Visitor Gate Pass Register</h3>
          </div>
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search visitor, vehicle, purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading visitor gate passes...</div>
        ) : filteredVisitors.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="font-bold text-sm">No visitor passes registered.</div>
            <div className="text-xs mt-1 text-slate-400">Click "Issue Gate Pass" to record new visitors.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Pass ID & Time In</th>
                  <th className="p-3.5">Visitor Name</th>
                  <th className="p-3.5">Phone Number</th>
                  <th className="p-3.5">Purpose / Agency</th>
                  <th className="p-3.5">Host Engineer</th>
                  <th className="p-3.5">Vehicle No</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredVisitors.map(v => {
                  const isInside = !v.out_time;

                  return (
                    <tr key={`vis-${v.id}`} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5 font-mono text-slate-400">
                        <div className="font-bold text-teal-400">PASS #{v.id}</div>
                        <div className="text-[10px]">{new Date(v.in_time || v.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-3.5 font-bold text-white text-sm">{v.visitor_name}</td>
                      <td className="p-3.5 font-mono text-slate-300">{v.phone_number || '-'}</td>
                      <td className="p-3.5 text-slate-300 font-medium">{v.purpose}</td>
                      <td className="p-3.5 text-slate-400">{v.host_person}</td>
                      <td className="p-3.5 font-mono text-amber-400 font-bold">{v.vehicle_number || 'Walking'}</td>
                      <td className="p-3.5">
                        {isInside ? (
                          <span className="px-2 py-0.5 bg-amber-950 border border-amber-800 text-amber-400 rounded-full font-bold text-[10px]">
                            INSIDE SITE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-500 rounded-full font-bold text-[10px]">
                            EXITED
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {isInside && (
                          <button
                            onClick={() => handleCheckOut(v.id)}
                            className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center space-x-1 mx-auto"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Mark Exit</span>
                          </button>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-teal-400" />
                <span>Issue Digital Visitor Gate Pass</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePass} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Visitor Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ar. Amit Sharma"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Host Engineer / Dept</label>
                  <input
                    type="text"
                    required
                    value={hostPerson}
                    onChange={(e) => setHostPerson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vehicle No (if any)</label>
                  <input
                    type="text"
                    placeholder="MH-12-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
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
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Issue Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorGatePassWorkspace;
