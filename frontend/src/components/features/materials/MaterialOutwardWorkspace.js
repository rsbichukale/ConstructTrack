'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Send, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  Search, 
  X,
  RefreshCw,
  Building,
  HardHat
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const MaterialOutwardWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [outwardLogs, setOutwardLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [materialId, setMaterialId] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [quantityIssued, setQuantityIssued] = useState('');
  const [purpose, setPurpose] = useState('Flat Plastering / Masonry work');

  const materials = state.materials || [];
  const contractors = state.contractors || [];

  const fetchOutward = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/materials/outward');
      setOutwardLogs(res?.outward || []);
    } catch (e) {
      console.error(e);
      setOutwardLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutward();
  }, []);

  const handleCreateOutward = async (e) => {
    e.preventDefault();
    if (!materialId || !contractorId || !quantityIssued) return;

    try {
      await apiClient.post('/materials/outward', {
        inventoryItemId: Number(materialId),
        issuedToContractorId: Number(contractorId),
        destinationLocation: locationTag,
        quantityIssued: Number(quantityIssued),
        purpose
      });
      setIsModalOpen(false);
      setQuantityIssued('');
      setLocationTag('');
      setStatusMessage('Material Issue Slip authorized & inventory stock deducted!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchOutward();
    } catch (e) {
      console.error(e);
    }
  };

  const totalSlips = outwardLogs.length;
  const filteredLogs = outwardLogs.filter(l => 
    (l.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.destination_location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.item_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Store Dispatch & Consumption</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Material Issue Slips (Outward)</h2>
          <p className="text-xs text-slate-400">
            Issue materials to trade subcontractors with destination flat/floor tagging $\rightarrow$ Real-time stock decrement.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Issue Material Slip</span>
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
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Issue Vouchers</div>
          <div className="text-3xl font-black text-white mt-1">{totalSlips}</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-1">Authorized Site Issues</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-amber-400">Contractors Served</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{contractors.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active Subcontractor Gangs</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-sky-400">Material Reconciliation</div>
          <div className="text-3xl font-black text-sky-400 mt-1">100%</div>
          <div className="text-[10px] text-slate-400 mt-1">Wastage Within Allowed ±3%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-purple-400">Store Authorization</div>
          <div className="text-3xl font-black text-purple-400 mt-1">Signed</div>
          <div className="text-[10px] text-slate-400 mt-1">Storekeeper & Mukadam</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-white text-sm">Material Issue Slips Ledger</h3>
          </div>
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search contractor, location, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading outward issue slips...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="font-bold text-sm">No material issue slips logged yet.</div>
            <div className="text-xs mt-1 text-slate-400">Click "Issue Material Slip" to dispatch items from the store.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Issue Date</th>
                  <th className="p-3.5">Material Item</th>
                  <th className="p-3.5">Issued to Subcontractor</th>
                  <th className="p-3.5">Destination / Location</th>
                  <th className="p-3.5 text-right">Qty Issued</th>
                  <th className="p-3.5">Purpose</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map(l => (
                  <tr key={`outward-${l.id}`} className="hover:bg-slate-850/50 transition">
                    <td className="p-3.5 font-mono text-slate-400">
                      {new Date(l.issued_at || l.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{l.item_name || 'Material Item'}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{l.item_code}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-extrabold text-white">{l.company_name}</div>
                      <div className="text-[10px] text-slate-400">{l.trade_type}</div>
                    </td>
                    <td className="p-3.5 font-bold text-amber-400">{l.destination_location || 'Wing B1 Floor 3'}</td>
                    <td className="p-3.5 text-right font-black text-white text-sm">
                      {Number(l.quantity_issued).toLocaleString('en-IN')} {l.unit_of_measure}
                    </td>
                    <td className="p-3.5 text-slate-300">{l.purpose}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
                        DISPATCHED
                      </span>
                    </td>
                  </tr>
                ))}
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
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Issue Material from Store</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOutward} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Material SKU</label>
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="">Select Material...</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.item_name || m.itemName} (Available: {m.current_stock || m.currentStock} {m.unit_of_measure || m.unitOfMeasure})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Issued to Contractor</label>
                <select
                  value={contractorId}
                  onChange={(e) => setContractorId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="">Select Subcontractor...</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name || c.companyName} ({c.trade_type || c.tradeType})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quantity Issued</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50"
                    value={quantityIssued}
                    onChange={(e) => setQuantityIssued(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Destination Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wing B1 Floor 4 Flat 401"
                    value={locationTag}
                    onChange={(e) => setLocationTag(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Purpose / Scope</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
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
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Issue Material & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialOutwardWorkspace;
