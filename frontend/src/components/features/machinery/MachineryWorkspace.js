'use client';

import React, { useState } from 'react';
import { 
  Truck, 
  Fuel, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  Wrench, 
  ShieldCheck, 
  Gauge, 
  Flame, 
  Phone, 
  Search,
  Zap,
  Activity
} from 'lucide-react';
import { useMachinery } from '../../../hooks/useMachinery';
import { KPICard } from '../../ui/KPICard';
import { DataTable } from '../../ui/DataTable';
import { StatusBadge } from '../../ui/StatusBadge';
import { ActionButton } from '../../ui/ActionButton';
import { ModalDialog } from '../../ui/ModalDialog';

export const MachineryWorkspace = () => {
  const { 
    assets, 
    logs, 
    loading, 
    registerAsset, 
    updateAssetStatus, 
    recordRunAndFuelLog, 
    refresh 
  } = useMachinery(1);

  const [activeTab, setActiveTab] = useState('assets'); // 'assets' | 'logs'
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [updatingAsset, setUpdatingAsset] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Register Asset Form
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('TOWER_CRANE');
  const [regNo, setRegNo] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [operatorPhone, setOperatorPhone] = useState('');
  const [fuelBenchmark, setFuelBenchmark] = useState(14.0);
  const [serviceInterval, setServiceInterval] = useState(250);

  // Log Form
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [startHours, setStartHours] = useState(0);
  const [endHours, setEndHours] = useState(8);
  const [dieselIssued, setDieselIssued] = useState(60);
  const [workDone, setWorkDone] = useState('');
  const [logLocation, setLogLocation] = useState('Wing A Tower Crane');

  // Financial / Operational calculations
  const totalCumulativeHours = assets.reduce((sum, a) => sum + (Number(a.total_cumulative_hours) || 0), 0);
  const totalDieselIssued = logs.reduce((sum, l) => sum + (Number(l.diesel_issued_litres) || 0), 0);
  const totalLoggedHours = logs.reduce((sum, l) => sum + (Number(l.total_hours) || 0), 0);
  const avgFuelBurnRate = totalLoggedHours > 0 ? (totalDieselIssued / totalLoggedHours).toFixed(1) : '14.2';
  const overdueCount = assets.filter(a => a.healthStatus === 'SERVICE_OVERDUE').length;

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await registerAsset({
        assetName,
        assetType,
        registrationNo: regNo,
        operatorName,
        operatorPhone,
        hourlyFuelBenchmarkLitres: Number(fuelBenchmark),
        serviceIntervalHours: Number(serviceInterval)
      });
      setIsRegisterModalOpen(false);
      setAssetName('');
      setRegNo('');
      setOperatorName('');
      setOperatorPhone('');
      setActionMessage(`Heavy machinery '${assetName}' registered to site fleet!`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert('Error registering asset: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    const asset = assets.find(a => String(a.id) === String(selectedAssetId));
    try {
      setSubmitting(true);
      const totalHours = Math.max(0, Number(endHours) - Number(startHours));
      await recordRunAndFuelLog({
        assetId: selectedAssetId ? Number(selectedAssetId) : null,
        equipmentName: asset ? asset.asset_name : 'General Machinery',
        equipmentType: asset ? asset.asset_type : 'EQUIPMENT',
        registrationNo: asset ? asset.registration_no : null,
        operatorName: asset ? asset.operator_name : 'Site Operator',
        startHours: Number(startHours),
        endHours: Number(endHours),
        totalHours,
        dieselIssuedLitres: Number(dieselIssued),
        workDone,
        location: logLocation,
        logDate
      });
      setIsLogModalOpen(false);
      setWorkDone('');
      setActionMessage('Run-time hour meter & fuel issuance recorded!');
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      alert('Error recording log: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateAssetStatus(id, status);
      setUpdatingAsset(null);
      setActionMessage(`Equipment status changed to ${status}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = !searchTerm || 
      a.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.registration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.operator_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || a.asset_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const assetColumns = [
    {
      key: 'asset_name',
      header: 'Machine & Model',
      render: (val, row) => (
        <div>
          <div className="font-bold text-white flex items-center space-x-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>{val}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {row.registration_no || 'Plant No. Reg'} • {row.asset_type}
          </div>
        </div>
      )
    },
    {
      key: 'operator',
      header: 'Operator & Contact',
      render: (_, row) => (
        <div className="text-xs">
          <div className="text-slate-200 font-semibold">{row.operator_name || 'Assigned Driver'}</div>
          {row.operator_phone && (
            <a href={`tel:${row.operator_phone}`} className="text-[10px] text-sky-400 hover:underline flex items-center space-x-1">
              <Phone className="w-2.5 h-2.5" />
              <span>{row.operator_phone}</span>
            </a>
          )}
        </div>
      )
    },
    {
      key: 'total_cumulative_hours',
      header: 'Cumulative Runtime',
      render: (val) => (
        <div className="font-mono">
          <span className="font-bold text-white text-sm">{Number(val || 0).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 ml-1">Hrs</span>
        </div>
      )
    },
    {
      key: 'maintenance',
      header: 'Service Health',
      render: (_, row) => {
        const isOverdue = row.healthStatus === 'SERVICE_OVERDUE';
        const isDueSoon = row.healthStatus === 'SERVICE_DUE_SOON';
        return (
          <div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
              isOverdue 
                ? 'bg-rose-950 text-rose-300 border-rose-800' 
                : isDueSoon 
                  ? 'bg-amber-950 text-amber-300 border-amber-800' 
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}>
              {isOverdue ? 'Overdue !' : `${row.hoursTillNextService}h to service`}
            </span>
            <div className="text-[9px] text-slate-500 mt-0.5">Every {row.service_interval_hours || 250} hrs</div>
          </div>
        );
      }
    },
    {
      key: 'fuel_benchmark',
      header: 'Fuel Benchmark',
      render: (val, row) => (
        <span className="text-xs font-mono font-bold text-amber-400">
          {Number(row.hourly_fuel_benchmark_litres || 14).toFixed(1)} L/hr
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      header: 'Action',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center space-x-1">
          <select
            value={row.status}
            onChange={(e) => handleUpdateStatus(row.id, e.target.value)}
            className="bg-slate-950 border border-slate-700 text-[10px] text-slate-300 rounded px-1.5 py-1 focus:outline-none"
          >
            <option value="OPERATIONAL">OPERATIONAL</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="BREAKDOWN">BREAKDOWN</option>
            <option value="STANDBY">STANDBY</option>
          </select>
        </div>
      )
    }
  ];

  const logColumns = [
    {
      key: 'log_date',
      header: 'Log Date',
      render: (val) => <span className="font-mono text-xs text-slate-300">{val ? String(val).split('T')[0] : 'Today'}</span>
    },
    {
      key: 'equipment_name',
      header: 'Equipment / Asset',
      render: (val, row) => (
        <div>
          <div className="font-bold text-white text-xs">{val}</div>
          <span className="text-[10px] text-slate-400">{row.location || 'Site Area'}</span>
        </div>
      )
    },
    {
      key: 'hours',
      header: 'Hours Run',
      render: (_, row) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-white">{row.total_hours} hrs</span>
          <span className="text-[10px] text-slate-500 block">({row.start_hours}h → {row.end_hours}h)</span>
        </div>
      )
    },
    {
      key: 'diesel_issued_litres',
      header: 'Diesel Issued',
      render: (val) => (
        <span className="font-mono font-bold text-amber-400 text-xs">
          {Number(val || 0)} L
        </span>
      )
    },
    {
      key: 'fuel_efficiency',
      header: 'Actual Burn Rate',
      render: (_, row) => {
        const rate = Number(row.fuel_efficiency_litres_per_hour || 0);
        const isExcess = row.excess_fuel_flag;
        return (
          <div className="flex items-center space-x-1">
            <span className={`font-mono font-bold text-xs ${isExcess ? 'text-rose-400' : 'text-emerald-400'}`}>
              {rate.toFixed(1)} L/hr
            </span>
            {isExcess && (
              <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1 py-0.2 rounded font-bold" title="Fuel consumption exceeds 25% above benchmark">
                High 🔥
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'operator_name',
      header: 'Operator & Work Done',
      render: (val, row) => (
        <div className="text-xs max-w-xs truncate">
          <span className="font-semibold text-slate-200">{val || 'Site Operator'}: </span>
          <span className="text-slate-400">{row.work_done || 'Standard lifting & pouring'}</span>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Truck className="h-6 w-6 text-amber-400" />
            Heavy Machinery, Plant Fleet & Diesel Fuel Tracker
          </h2>
          <p className="text-xs text-slate-400">
            Tower Cranes, Concrete Pumps, DG Gensets run-time meter logs, diesel dispensing records, and fuel theft detection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            onClick={() => setIsLogModalOpen(true)}
            icon={Fuel}
            size="sm"
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold"
          >
            Log Runtime & Diesel
          </ActionButton>

          <ActionButton
            onClick={() => setIsRegisterModalOpen(true)}
            icon={Plus}
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-200"
          >
            Register Machine
          </ActionButton>

          <ActionButton 
            onClick={refresh} 
            icon={RefreshCw} 
            loading={loading} 
            variant="ghost" 
            size="sm" 
          />
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl text-xs font-bold text-emerald-300 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Total Plant Fleet Assets"
          value={assets.length}
          icon={Truck}
          color="amber"
          subtitle={`${assets.filter(a => a.status === 'OPERATIONAL').length} Active on site`}
        />
        <KPICard
          title="Cumulative Runtime"
          value={`${totalCumulativeHours.toLocaleString()}h`}
          icon={Clock}
          color="sky"
          subtitle="All equipment to date"
        />
        <KPICard
          title="Total Diesel Dispensed"
          value={`${totalDieselIssued.toLocaleString()} L`}
          icon={Fuel}
          color="purple"
          subtitle="From site diesel tank"
        />
        <KPICard
          title="Fleet Avg Burn Rate"
          value={`${avgFuelBurnRate} L/h`}
          icon={Flame}
          color={overdueCount > 0 ? 'rose' : 'emerald'}
          subtitle={overdueCount > 0 ? `${overdueCount} Service Overdue!` : 'Normal fuel efficiency'}
        />
      </div>

      {/* Sub-Tabs & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => setActiveTab('assets')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              activeTab === 'assets' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Machine Fleet Registry ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              activeTab === 'logs' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Runtime & Fuel Logs ({logs.length})
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search machine, model, driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-44"
            />
          </div>

          {activeTab === 'assets' && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="TOWER_CRANE">Tower Cranes</option>
              <option value="CONCRETE_PUMP">Concrete Pumps</option>
              <option value="GENSET">DG Gensets</option>
              <option value="EXCAVATOR">Excavators / JCB</option>
              <option value="TRANSIT_MIXER">Transit Mixers</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Data Tables */}
      {activeTab === 'assets' ? (
        <DataTable
          columns={assetColumns}
          data={filteredAssets}
          loading={loading}
          emptyMessage="No machinery assets registered yet. Click 'Register Machine' to add."
        />
      ) : (
        <DataTable
          columns={logColumns}
          data={logs}
          loading={loading}
          emptyMessage="No fuel logs recorded yet. Click 'Log Runtime & Diesel' to record."
        />
      )}

      {/* 1. MODAL: Register New Machinery Asset */}
      {isRegisterModalOpen && (
        <ModalDialog
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          title="🚜 Register Heavy Machinery / Plant Equipment"
          size="lg"
        >
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Equipment Name & Model</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Potain MCT-88 High-Rise Tower Crane"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Equipment Category</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="TOWER_CRANE">Tower Crane</option>
                  <option value="CONCRETE_PUMP">Concrete Stationary Pump</option>
                  <option value="GENSET">DG Genset (Electricity)</option>
                  <option value="EXCAVATOR">Excavator / Backhoe (JCB)</option>
                  <option value="TRANSIT_MIXER">Transit Mixer</option>
                  <option value="PASSENGER_HOIST">Passenger & Material Hoist</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Registration / Asset No.</label>
                <input
                  type="text"
                  placeholder="e.g. MH-12-TC-9021"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Assigned Operator Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Jadhav"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Operator Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={operatorPhone}
                  onChange={(e) => setOperatorPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Fuel Burn Benchmark (L/hr)</label>
                <input
                  type="number"
                  step="0.5"
                  value={fuelBenchmark}
                  onChange={(e) => setFuelBenchmark(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Service Interval (Hours)</label>
                <input
                  type="number"
                  step="50"
                  value={serviceInterval}
                  onChange={(e) => setServiceInterval(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <ActionButton variant="ghost" onClick={() => setIsRegisterModalOpen(false)}>
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                loading={submitting}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Register Machine
              </ActionButton>
            </div>
          </form>
        </ModalDialog>
      )}

      {/* 2. MODAL: Log Machine Hours & Diesel */}
      {isLogModalOpen && (
        <ModalDialog
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          title="⛽ Record Equipment Runtime & Diesel Dispensing"
          size="md"
        >
          <form onSubmit={handleLogSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Select Machine / Plant</label>
              <select
                required
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              >
                <option value="">-- Choose Machine --</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.asset_name} ({a.registration_no || a.asset_type})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Log Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Location / Zone</label>
                <input
                  type="text"
                  placeholder="e.g. Wing B Ground Yard"
                  value={logLocation}
                  onChange={(e) => setLogLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Start Hour Meter</label>
                <input
                  type="number"
                  step="0.1"
                  value={startHours}
                  onChange={(e) => setStartHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">End Hour Meter</label>
                <input
                  type="number"
                  step="0.1"
                  value={endHours}
                  onChange={(e) => setEndHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Diesel Issued (Litres)</label>
                <input
                  required
                  type="number"
                  step="1"
                  value={dieselIssued}
                  onChange={(e) => setDieselIssued(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Work Description / Lift Details</label>
              <textarea
                rows={2}
                placeholder="e.g. Lifted 12 bundles of 16mm rebar to Floor 6 slab and hoisted shuttering ply"
                value={workDone}
                onChange={(e) => setWorkDone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <ActionButton variant="ghost" onClick={() => setIsLogModalOpen(false)}>
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                loading={submitting}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Save Hour & Fuel Log
              </ActionButton>
            </div>
          </form>
        </ModalDialog>
      )}
    </div>
  );
};

export default MachineryWorkspace;
