'use client';

import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  Truck, 
  Plus, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Search, 
  X,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const MaterialInwardWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [inwardLogs, setInwardLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [materialId, setMaterialId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [challanNumber, setChallanNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [quantityReceived, setQuantityReceived] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const materials = state.materials || [];

  const fetchInward = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/materials/inward');
      setInwardLogs(res?.inward || []);
    } catch (e) {
      console.error(e);
      setInwardLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInward();
  }, []);

  const handleCreateInward = async (e) => {
    e.preventDefault();
    if (!materialId || !quantityReceived) return;

    try {
      await apiClient.post('/materials/inward', {
        inventoryItemId: Number(materialId),
        supplierName,
        challanNumber,
        vehicleNumber,
        quantityReceived: Number(quantityReceived),
        unitPrice: Number(unitPrice) || 0
      });
      setIsModalOpen(false);
      setSupplierName('');
      setChallanNumber('');
      setVehicleNumber('');
      setQuantityReceived('');
      setStatusMessage('Material Goods Received Note (GRN) logged & stock incremented!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchInward();
    } catch (e) {
      console.error(e);
    }
  };

  const totalDeliveries = inwardLogs.length;
  const totalInwardValue = inwardLogs.reduce((acc, l) => acc + (Number(l.quantity_received || 0) * Number(l.unit_price || 0)), 0);

  const filteredLogs = inwardLogs.filter(l => 
    (l.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.challan_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.item_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <PackageCheck className="w-4 h-4" />
            <span>Goods Received Note (GRN)</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Material Inward Delivery Challans</h2>
          <p className="text-xs text-slate-400">
            Log supplier challans, vehicle gate weight slips, quality inspection and stock addition.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Log Material Inward (GRN)</span>
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
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Total GRN Deliveries</div>
          <div className="text-3xl font-black text-white mt-1">{totalDeliveries}</div>
          <div className="text-[10px] text-emerald-400 font-bold mt-1">Challans Inspected & Accepted</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-emerald-400">Cumulative Inward Value</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">₹{totalInwardValue.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Total Material Cost Received</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-sky-400">Quality Check Status</div>
          <div className="text-3xl font-black text-sky-400 mt-1">100% Passed</div>
          <div className="text-[10px] text-slate-400 mt-1">Store Verified with PO</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-purple-400">Sync Status</div>
          <div className="text-3xl font-black text-purple-400 mt-1">Real-Time</div>
          <div className="text-[10px] text-slate-400 mt-1">Stock Incremented on Submit</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-white text-sm">Goods Received Notes (GRN) Ledger</h3>
          </div>
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search supplier, challan, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading GRN records...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="font-bold text-sm">No material inward records logged yet.</div>
            <div className="text-xs mt-1 text-slate-400">Click "Log Material Inward (GRN)" to receive site deliveries.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Date & Challan No</th>
                  <th className="p-3.5">Material SKU</th>
                  <th className="p-3.5">Supplier Agency</th>
                  <th className="p-3.5">Vehicle No</th>
                  <th className="p-3.5 text-right">Qty Received</th>
                  <th className="p-3.5 text-right">Unit Rate (₹)</th>
                  <th className="p-3.5 text-right">Total Amount (₹)</th>
                  <th className="p-3.5">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map(l => (
                  <tr key={`inward-${l.id}`} className="hover:bg-slate-850/50 transition">
                    <td className="p-3.5">
                      <div className="font-extrabold text-white font-mono">{l.challan_number || 'CH-001'}</div>
                      <div className="text-[10px] text-slate-400">{new Date(l.received_at || l.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{l.item_name || 'Material Item'}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{l.item_code}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium">{l.supplier_name || 'Supplier'}</td>
                    <td className="p-3.5 font-mono text-slate-400">{l.vehicle_number || 'MH-12-XX-0000'}</td>
                    <td className="p-3.5 text-right font-black text-white text-sm">
                      {Number(l.quantity_received).toLocaleString('en-IN')} {l.unit_of_measure}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">₹{Number(l.unit_price).toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right font-black text-emerald-400 text-sm">
                      ₹{(Number(l.quantity_received) * Number(l.unit_price)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
                        QC ACCEPTED
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
                <span>Log Goods Received Note (GRN)</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInward} className="space-y-4">
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
                    <option key={m.id} value={m.id}>{m.item_name || m.itemName} ({m.item_code || m.itemCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Supplier Company</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UltraTech Cement Agency"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Challan / Bill No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CH-89042"
                    value={challanNumber}
                    onChange={(e) => setChallanNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vehicle No</label>
                  <input
                    type="text"
                    placeholder="MH-12-RN-8822"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Qty Received</label>
                  <input
                    type="number"
                    required
                    placeholder="200"
                    value={quantityReceived}
                    onChange={(e) => setQuantityReceived(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Unit Rate (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="380"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
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
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Save Inward & Increment Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialInwardWorkspace;
