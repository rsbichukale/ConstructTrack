import React, { useState } from 'react';
import { Package, ArrowDownLeft, ArrowUpRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { useMaterials } from '../../../hooks/useMaterials';
import { KPICard } from '../../ui/KPICard';
import { DataTable } from '../../ui/DataTable';
import { ActionButton } from '../../ui/ActionButton';
import { ModalDialog } from '../../ui/ModalDialog';

export const MaterialsWorkspace = () => {
  const { inventory, summary, loading, recordInward, recordOutward, refresh } = useMaterials();
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);

  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [unit, setUnit] = useState('BAGS');
  const [supplier, setSupplier] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [rate, setRate] = useState(400);

  const handleInward = async (e) => {
    e.preventDefault();
    await recordInward({ itemName, quantity: Number(quantity), unit, supplier, challanNo, rate: Number(rate) });
    setIsInwardModalOpen(false);
  };

  const handleOutward = async (e) => {
    e.preventDefault();
    await recordOutward({ itemName, quantity: Number(quantity), unit, purpose: 'Floor Issue' });
    setIsOutwardModalOpen(false);
  };

  const columns = [
    { key: 'item_name', header: 'Material Item' },
    { key: 'category', header: 'Category' },
    { key: 'current_stock', header: 'Current Stock', render: (val, row) => <span className="font-bold text-white">{val} {row.unit}</span> },
    { key: 'min_reorder_level', header: 'Min Buffer', render: (val, row) => `${val} ${row.unit}` },
    { key: 'avg_rate_per_unit', header: 'Avg Unit Rate', render: (val) => `₹${Number(val).toLocaleString()}` },
    {
      key: 'valuation',
      header: 'Total Valuation',
      render: (_, row) => <span className="font-bold text-emerald-400">₹{(Number(row.current_stock) * Number(row.avg_rate_per_unit)).toLocaleString()}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-amber-500" />
            Materials Inventory & Site Store Ledger
          </h2>
          <p className="text-xs text-slate-400">Live store stock ledger, inward GRN challans, and outward floor issues.</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton onClick={() => { setItemName(inventory[0]?.item_name || ''); setIsInwardModalOpen(true); }} icon={ArrowDownLeft} size="sm">
            Inward GRN
          </ActionButton>
          <ActionButton onClick={() => { setItemName(inventory[0]?.item_name || ''); setIsOutwardModalOpen(true); }} icon={ArrowUpRight} variant="secondary" size="sm">
            Issue Outward
          </ActionButton>
          <ActionButton onClick={refresh} icon={RefreshCw} loading={loading} variant="ghost" size="sm">
            Refresh
          </ActionButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard title="Total Store SKUs" value={summary.totalItems} icon={Package} color="amber" subtitle="Active store items" />
        <KPICard title="Store Inventory Valuation" value={`₹${Number(summary.totalValuation).toLocaleString()}`} icon={Package} color="emerald" subtitle="Book value" />
        <KPICard title="Low Stock Alerts" value={summary.lowStockCount} icon={AlertTriangle} color={summary.lowStockCount > 0 ? 'rose' : 'emerald'} subtitle="Below min buffer" />
        <KPICard title="Local Store Mode" value="Active (100%)" icon={RefreshCw} color="blue" subtitle="Local PostgreSQL" />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Material Store Inventory</h3>
        <DataTable columns={columns} data={inventory} searchKey="item_name" searchPlaceholder="Search material by name or category..." />
      </div>

      {/* Inward Modal */}
      <ModalDialog isOpen={isInwardModalOpen} onClose={() => setIsInwardModalOpen(false)} title="Record Material Inward (GRN)">
        <form onSubmit={handleInward} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Material Item</label>
            <select value={itemName} onChange={(e) => setItemName(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white">
              {inventory.map(i => <option key={i.id} value={i.item_name}>{i.item_name} ({i.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Quantity Received</label>
              <input type="number" min="1" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Unit Rate (₹)</label>
              <input type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Supplier Name</label>
              <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. UltraTech Plant" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Challan / Bill No.</label>
              <input type="text" value={challanNo} onChange={(e) => setChallanNo(e.target.value)} placeholder="e.g. CH-9901" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <ActionButton onClick={() => setIsInwardModalOpen(false)} variant="ghost" size="sm">Cancel</ActionButton>
            <ActionButton type="submit" size="sm">Record Inward</ActionButton>
          </div>
        </form>
      </ModalDialog>

      {/* Outward Modal */}
      <ModalDialog isOpen={isOutwardModalOpen} onClose={() => setIsOutwardModalOpen(false)} title="Issue Material Outward to Floor">
        <form onSubmit={handleOutward} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Material Item</label>
            <select value={itemName} onChange={(e) => setItemName(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white">
              {inventory.map(i => <option key={i.id} value={i.item_name}>{i.item_name} ({i.unit})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300">Quantity to Issue</label>
            <input type="number" min="1" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <ActionButton onClick={() => setIsOutwardModalOpen(false)} variant="ghost" size="sm">Cancel</ActionButton>
            <ActionButton type="submit" size="sm">Issue Material</ActionButton>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
};

export default MaterialsWorkspace;
