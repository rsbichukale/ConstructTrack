'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Truck, 
  DollarSign, 
  CheckCircle2,
  Building,
  Layers,
  FileText
} from 'lucide-react';
import { 
  fetchMaterialsOverview, 
  recordMaterialInward, 
  recordMaterialOutward 
} from '../../lib/backendSync';

export const MaterialsHub = () => {
  const [activeSubTab, setActiveSubTab] = useState('inventory'); // 'inventory', 'inward', 'outward'
  const [data, setData] = useState({ inward: [], outward: [], inventory: [], totalStockValue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Inward Modal
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [inwardItemName, setInwardItemName] = useState('');
  const [inwardCategory, setInwardCategory] = useState('CEMENT');
  const [inwardSupplier, setInwardSupplier] = useState('');
  const [inwardQuantity, setInwardQuantity] = useState('');
  const [inwardUnit, setInwardUnit] = useState('Bags');
  const [inwardRate, setInwardRate] = useState('');
  const [inwardChallan, setInwardChallan] = useState('');
  const [inwardVehicle, setInwardVehicle] = useState('');
  const [isSubmittingInward, setIsSubmittingInward] = useState(false);

  // Outward Modal
  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);
  const [outwardItemName, setOutwardItemName] = useState('');
  const [outwardQuantity, setOutwardQuantity] = useState('');
  const [outwardUnit, setOutwardUnit] = useState('Bags');
  const [outwardWing, setOutwardWing] = useState('B1');
  const [outwardFloor, setOutwardFloor] = useState('1');
  const [outwardContractor, setOutwardContractor] = useState('');
  const [outwardPurpose, setOutwardPurpose] = useState('');
  const [isSubmittingOutward, setIsSubmittingOutward] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const res = await fetchMaterialsOverview();
    setData(res);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInwardSubmit = async (e) => {
    e.preventDefault();
    if (!inwardItemName.trim() || !inwardQuantity) return;
    setIsSubmittingInward(true);
    try {
      await recordMaterialInward({
        itemName: inwardItemName.trim(),
        category: inwardCategory,
        supplierName: inwardSupplier.trim() || 'Direct Vendor',
        quantityReceived: Number(inwardQuantity),
        unit: inwardUnit,
        ratePerUnit: Number(inwardRate || 0),
        challanNumber: inwardChallan.trim() || null,
        vehicleNumber: inwardVehicle.trim() || null
      });
      setFeedbackMsg(`GRN Inward recorded for ${inwardQuantity} ${inwardUnit} of ${inwardItemName}.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
      setIsInwardModalOpen(false);
      setInwardItemName('');
      setInwardQuantity('');
      setInwardRate('');
      setInwardChallan('');
      setInwardVehicle('');
      await loadData();
    } catch (err) {
      alert('Error recording inward: ' + err.message);
    } finally {
      setIsSubmittingInward(false);
    }
  };

  const handleOutwardSubmit = async (e) => {
    e.preventDefault();
    if (!outwardItemName.trim() || !outwardQuantity) return;
    setIsSubmittingOutward(true);
    try {
      await recordMaterialOutward({
        itemName: outwardItemName.trim(),
        quantityIssued: Number(outwardQuantity),
        unit: outwardUnit,
        wing: outwardWing,
        floorNumber: Number(outwardFloor),
        issuedToContractor: outwardContractor.trim() || 'General Civil Works',
        purpose: outwardPurpose.trim() || 'Site Execution'
      });
      setFeedbackMsg(`Material issue recorded: ${outwardQuantity} ${outwardUnit} to ${outwardContractor || 'Site'}.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
      setIsOutwardModalOpen(false);
      setOutwardItemName('');
      setOutwardQuantity('');
      setOutwardContractor('');
      setOutwardPurpose('');
      await loadData();
    } catch (err) {
      alert('Error recording issue: ' + err.message);
    } finally {
      setIsSubmittingOutward(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Package className="w-4 h-4" />
            <span>SiteOps Materials & Inventory Management</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Material Inward (GRN), Issues & Stock Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Track cement, steel, sand & aggregate inward challans, contractor issue slips, and real-time stock balances
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsOutwardModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/60 rounded-xl text-xs font-bold transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue Material (Outward)</span>
          </button>

          <button
            onClick={() => setIsInwardModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Record GRN Inward</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Stock Inward Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            ₹{(data.totalStockValue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Cumulative GRN inventory procured</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Tracked Inventory SKUs</span>
            <Package className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {data.inventory?.length || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Active material categories</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Inward GRN Deliveries</span>
            <ArrowDownLeft className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">
            {data.inward?.length || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Recorded vehicle challans</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Material Issue Slips</span>
            <ArrowUpRight className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black font-mono text-purple-400">
            {data.outward?.length || 0}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Contractor site disbursements</p>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeSubTab === 'inventory'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Current Stock Ledger</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inward')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeSubTab === 'inward'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Inward Register (GRN)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('outward')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeSubTab === 'outward'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Outward Issue Log</span>
        </button>
      </div>

      {/* TAB 1: CURRENT STOCK LEDGER */}
      {activeSubTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data.inventory || []).map((inv, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-white text-sm">{inv.itemName}</h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Unit: {inv.unit}</span>
                </div>
                {inv.isLowStock && (
                  <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Low Stock</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 font-sans font-bold">Received</div>
                  <div className="text-sm font-bold text-emerald-400">{inv.totalReceived}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-sans font-bold">Issued</div>
                  <div className="text-sm font-bold text-rose-400">{inv.totalIssued}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-sans font-bold">In Hand</div>
                  <div className="text-sm font-black text-amber-400">{inv.currentStock}</div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1">
                <span>Procured Value:</span>
                <strong className="text-slate-200 font-mono">₹{inv.totalValue.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: INWARD GRN REGISTER */}
      {activeSubTab === 'inward' && (
        <div className="space-y-3">
          {(data.inward || []).map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs text-amber-400 bg-amber-950 px-2 py-0.5 rounded-md">
                    {item.challanNumber || item.challan_number || 'GRN'}
                  </span>
                  <h4 className="font-bold text-white text-sm">{item.itemName || item.item_name}</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Supplier: <strong className="text-slate-300">{item.supplierName || item.supplier_name}</strong> • Vehicle: {item.vehicleNumber || item.vehicle_number || 'Direct'}
                </p>
              </div>

              <div className="text-right font-mono">
                <div className="text-emerald-400 font-extrabold text-sm">
                  +{item.quantityReceived || item.quantity_received} {item.unit}
                </div>
                <div className="text-xs text-slate-400">
                  ₹{(item.totalAmount || item.total_amount || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: OUTWARD ISSUE LOG */}
      {activeSubTab === 'outward' && (
        <div className="space-y-3">
          {(data.outward || []).map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs text-sky-400 bg-sky-950 px-2 py-0.5 rounded-md">
                    Wing {item.wing} • Floor {item.floorNumber || item.floor_number}
                  </span>
                  <h4 className="font-bold text-white text-sm">{item.itemName || item.item_name}</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Issued to: <strong className="text-slate-300">{item.issuedToContractor || item.issued_to_contractor}</strong> • Purpose: {item.purpose}
                </p>
              </div>

              <div className="text-right font-mono">
                <div className="text-rose-400 font-extrabold text-sm">
                  -{item.quantityIssued || item.quantity_issued} {item.unit}
                </div>
                <div className="text-[10px] text-slate-500">
                  {item.dateIssued || item.date_issued}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inward Modal */}
      {isInwardModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsInwardModalOpen(false)}>
          <div className="modal-panel max-w-md space-y-4">
            <h3 className="font-black text-white text-base">Record Material GRN Inward</h3>
            <form onSubmit={handleInwardSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultratech OPC 53 Cement"
                  value={inwardItemName}
                  onChange={(e) => setInwardItemName(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="500"
                    value={inwardQuantity}
                    onChange={(e) => setInwardQuantity(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Unit</label>
                  <select
                    value={inwardUnit}
                    onChange={(e) => setInwardUnit(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="Bags">Bags</option>
                    <option value="Tons">Tons</option>
                    <option value="CFT">CFT</option>
                    <option value="Nos">Nos</option>
                    <option value="Liters">Liters</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Rate / Unit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="380"
                    value={inwardRate}
                    onChange={(e) => setInwardRate(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Shree Cement"
                    value={inwardSupplier}
                    onChange={(e) => setInwardSupplier(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Challan Number</label>
                  <input
                    type="text"
                    placeholder="CH-8821"
                    value={inwardChallan}
                    onChange={(e) => setInwardChallan(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="MH-12-RN-4455"
                    value={inwardVehicle}
                    onChange={(e) => setInwardVehicle(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInwardModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInward}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl"
                >
                  {isSubmittingInward ? 'Saving...' : 'Save GRN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outward Modal */}
      {isOutwardModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsOutwardModalOpen(false)}>
          <div className="modal-panel max-w-md space-y-4">
            <h3 className="font-black text-white text-base">Issue Material (Outward Slip)</h3>
            <form onSubmit={handleOutwardSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400">Material Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultratech OPC 53 Cement"
                  value={outwardItemName}
                  onChange={(e) => setOutwardItemName(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Quantity Issued *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="80"
                    value={outwardQuantity}
                    onChange={(e) => setOutwardQuantity(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Unit</label>
                  <select
                    value={outwardUnit}
                    onChange={(e) => setOutwardUnit(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="Bags">Bags</option>
                    <option value="Tons">Tons</option>
                    <option value="CFT">CFT</option>
                    <option value="Nos">Nos</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-400">Target Wing</label>
                  <input
                    type="text"
                    value={outwardWing}
                    onChange={(e) => setOutwardWing(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Floor Number</label>
                  <input
                    type="number"
                    value={outwardFloor}
                    onChange={(e) => setOutwardFloor(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Issued to Contractor / Trade</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Masonry Works"
                  value={outwardContractor}
                  onChange={(e) => setOutwardContractor(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400">Purpose of Issue</label>
                <input
                  type="text"
                  placeholder="e.g. 4th floor external brickwork"
                  value={outwardPurpose}
                  onChange={(e) => setOutwardPurpose(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOutwardModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOutward}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-black rounded-xl"
                >
                  {isSubmittingOutward ? 'Issuing...' : 'Issue Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
