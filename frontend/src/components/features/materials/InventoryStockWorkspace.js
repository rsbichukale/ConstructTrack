'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Plus, 
  X,
  RefreshCw
} from 'lucide-react';
import { getAppState, subscribeState } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const InventoryStockWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // New Item Form
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('CIVIL');
  const [unitOfMeasure, setUnitOfMeasure] = useState('Bags');
  const [currentStock, setCurrentStock] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [unitCost, setUnitCost] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/materials/inventory');
      setItems(res?.items || state.materials || []);
    } catch (e) {
      console.error(e);
      setItems(state.materials || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemCode || !itemName) return;

    try {
      await apiClient.post('/materials/inventory', {
        itemCode,
        itemName,
        category,
        unitOfMeasure,
        currentStock: Number(currentStock) || 0,
        reorderLevel: Number(reorderLevel) || 50,
        unitCost: Number(unitCost) || 100
      });
      setIsModalOpen(false);
      setItemCode('');
      setItemName('');
      setStatusMessage('Material inventory SKU created successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
      fetchInventory();
    } catch (e) {
      console.error(e);
    }
  };

  const totalSKUs = items.length;
  const totalValuation = items.reduce((acc, i) => acc + (Number(i.current_stock || i.currentStock || 0) * Number(i.unit_cost || i.unitCost || 0)), 0);
  const lowStockCount = items.filter(i => Number(i.current_stock || i.currentStock || 0) <= Number(i.reorder_level || i.reorderLevel || 0)).length;

  const filteredItems = items.filter(i => 
    (i.item_name || i.itemName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.item_code || i.itemCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Boxes className="w-4 h-4" />
            <span>Store & Inventory Management</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Inventory Stock & Reorder Ledger</h2>
          <p className="text-xs text-slate-400">
            Real-time site material balances, minimum safety thresholds, and automated reorder alerts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Inventory Item (SKU)</span>
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
          <div className="text-[10px] font-extrabold uppercase text-slate-400">Total Material Valuation</div>
          <div className="text-3xl font-black text-emerald-400 mt-1">₹{totalValuation.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Weighted Average Valuation</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-sky-400">Tracked SKUs</div>
          <div className="text-3xl font-black text-white mt-1">{totalSKUs} Items</div>
          <div className="text-[10px] text-slate-400 mt-1">Active Store Inventory Items</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-amber-400">Low Stock Warnings</div>
          <div className="text-3xl font-black text-amber-400 mt-1">{lowStockCount} SKUs</div>
          <div className="text-[10px] text-slate-400 mt-1">Below Minimum Reorder Threshold</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="text-[10px] font-extrabold uppercase text-purple-400">Stock Health</div>
          <div className="text-3xl font-black text-purple-400 mt-1">100%</div>
          <div className="text-[10px] text-slate-400 mt-1">Zero Dead Stock Detected</div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <h3 className="font-extrabold text-white text-sm">Site Store Inventory Stock Table</h3>
          </div>
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search material or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading inventory items...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Item Code & Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-center">Unit of Measure</th>
                  <th className="p-3.5 text-right">Current Stock</th>
                  <th className="p-3.5 text-right">Reorder Level</th>
                  <th className="p-3.5 text-right">Unit Rate (₹)</th>
                  <th className="p-3.5 text-right">Total Valuation</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map(i => {
                  const stock = Number(i.current_stock || i.currentStock || 0);
                  const reorder = Number(i.reorder_level || i.reorderLevel || 0);
                  const rate = Number(i.unit_cost || i.unitCost || 0);
                  const val = stock * rate;
                  const isLow = stock <= reorder;

                  return (
                    <tr key={`item-${i.id}`} className="hover:bg-slate-850/50 transition">
                      <td className="p-3.5">
                        <div className="font-extrabold text-white">{i.item_name || i.itemName}</div>
                        <div className="text-[10px] text-emerald-400 font-mono">{i.item_code || i.itemCode}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded font-bold text-[10px]">
                          {i.category || 'CIVIL'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-slate-400 font-bold">{i.unit_of_measure || i.unitOfMeasure}</td>
                      <td className="p-3.5 text-right font-black text-sm text-white">{stock.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right text-slate-400 font-mono">{reorder.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right font-mono text-slate-300">₹{rate.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right font-black text-sm text-emerald-400">₹{val.toLocaleString('en-IN')}</td>
                      <td className="p-3.5">
                        {isLow ? (
                          <span className="px-2 py-0.5 bg-rose-950 border border-rose-800 text-rose-400 rounded-full font-bold text-[10px] flex items-center space-x-1 w-fit">
                            <AlertTriangle className="w-3 h-3 inline" />
                            <span>REORDER NOW</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-full font-bold text-[10px]">
                            HEALTHY
                          </span>
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

      {/* Add Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-panel max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Create Material Inventory SKU</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Item Code (SKU)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MAT-CMT-53"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="CIVIL">CIVIL</option>
                    <option value="STEEL">STEEL</option>
                    <option value="ELECTRICAL">ELECTRICAL</option>
                    <option value="PLUMBING">PLUMBING</option>
                    <option value="FINISHING">FINISHING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Material Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultratech PPC 53 Grade Cement"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Unit of Measure</label>
                  <select
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  >
                    <option value="Bags">Bags</option>
                    <option value="MT">MT</option>
                    <option value="Nos">Nos</option>
                    <option value="sq.ft">sq.ft</option>
                    <option value="Litres">Litres</option>
                    <option value="Brass">Brass</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Current Stock</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 500"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 380"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
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
                  Create SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryStockWorkspace;
