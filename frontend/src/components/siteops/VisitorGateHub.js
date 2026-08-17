'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DoorOpen, 
  Car, 
  Plus, 
  Clock, 
  CheckCircle2, 
  LogOut, 
  Calendar, 
  Phone, 
  User 
} from 'lucide-react';
import { fetchVisitors, recordVisitorEntry, recordVisitorExit } from '../../lib/backendSync';

export const VisitorGateHub = () => {
  const [visitorData, setVisitorData] = useState({ visitors: [], activeInsideCount: 0, totalVisitorsCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorType, setVisitorType] = useState('CLIENT');
  const [purpose, setPurpose] = useState('');
  const [personToMeet, setPersonToMeet] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadVisitors = async () => {
    setIsLoading(true);
    const data = await fetchVisitors();
    setVisitorData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!visitorName.trim() || !purpose.trim()) return;
    setIsSubmitting(true);
    try {
      await recordVisitorEntry({
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim() || null,
        visitorType,
        purposeOfVisit: purpose.trim(),
        personToMeet: personToMeet.trim() || 'Project Team',
        vehicleNumber: vehicleNumber.trim() || null
      });
      setFeedbackMsg(`Gate Pass issued for visitor ${visitorName}.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
      setIsModalOpen(false);
      setVisitorName('');
      setVisitorPhone('');
      setPurpose('');
      setPersonToMeet('');
      setVehicleNumber('');
      await loadVisitors();
    } catch (err) {
      alert('Error recording entry: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = async (id) => {
    try {
      await recordVisitorExit(id);
      setFeedbackMsg('Visitor marked as checked out.');
      setTimeout(() => setFeedbackMsg(null), 3000);
      await loadVisitors();
    } catch (err) {
      alert('Error logging exit: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <DoorOpen className="w-4 h-4" />
            <span>SiteOps Security & Gate Pass Access</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Site Visitor Register & Vehicle Gate Pass
          </h2>
          <p className="text-xs text-slate-400">
            Issue digital gate passes for prospective buyers, structural consultants, vendors & VIP visitors with check-in/out timestamps
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Visitor Gate Pass</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-indigo-900/60 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-indigo-300 font-bold">
            <span>Currently Inside Site</span>
            <DoorOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black font-mono text-indigo-400">
            {visitorData.activeInsideCount || 0} <span className="text-xs text-slate-400 font-normal">Active Visitors</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Checked-in and on premises</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Logged Visits</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {visitorData.totalVisitorsCount || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Cumulative recorded site visits</p>
        </div>
      </div>

      {/* Visitor Entries */}
      <div className="space-y-3">
        {(visitorData.visitors || []).map((visitor) => {
          const isInside = !(visitor.out_time || visitor.outTime);

          return (
            <div
              key={visitor.id}
              className={`bg-slate-900 border p-5 rounded-3xl transition shadow-lg space-y-3 ${
                isInside ? 'border-indigo-900/80 bg-slate-900/90' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded-lg border border-indigo-800">
                      {visitor.gatePassNumber || visitor.gate_pass_number || 'PASS'}
                    </span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                      {visitor.visitorType || visitor.visitor_type}
                    </span>
                    <h3 className="font-black text-white text-sm">{visitor.visitorName || visitor.visitor_name}</h3>
                  </div>
                  <p className="text-xs text-slate-300 pt-1">
                    Purpose: <strong className="text-slate-100">{visitor.purposeOfVisit || visitor.purpose_of_visit}</strong>
                  </p>
                </div>

                <div className="text-right">
                  {isInside ? (
                    <button
                      onClick={() => handleExit(visitor.id)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/20 transition flex items-center space-x-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check-Out</span>
                    </button>
                  ) : (
                    <span className="text-slate-500 font-mono text-xs">
                      Exited at: {new Date(visitor.outTime || visitor.out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span>Meeting: <strong className="text-slate-200">{visitor.personToMeet || visitor.person_to_meet}</strong></span>
                {visitor.vehicleNumber && <span>Vehicle: <strong className="text-slate-200">{visitor.vehicleNumber}</strong></span>}
                <span>In-Time: {new Date(visitor.inTime || visitor.in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-md space-y-4">
            <h3 className="font-black text-white text-base">Issue Visitor Gate Pass</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kulkarni"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98220 12345"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Visitor Category</label>
                  <select
                    value={visitorType}
                    onChange={(e) => setVisitorType(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    <option value="CLIENT">Client / Flat Buyer</option>
                    <option value="CONSULTANT">RCC / Structural Consultant</option>
                    <option value="VENDOR">Material Supplier / Vendor</option>
                    <option value="INSPECTOR">Municipal / RERA Inspector</option>
                    <option value="VIP">VIP / Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspection of 4th floor flat layout"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Person to Meet</label>
                  <input
                    type="text"
                    placeholder="e.g. Amit Joshi (Sales)"
                    value={personToMeet}
                    onChange={(e) => setPersonToMeet(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="MH-12-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? 'Issuing...' : 'Issue Gate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
