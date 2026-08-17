'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Building2, 
  Search, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
  Filter,
  Play,
  UserPlus,
  FileCheck2,
  Ruler,
  Edit3,
  Save,
  DollarSign,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { getAppState, subscribeState, updateFlatTaskProgress, calculateFlatProgress } from '../../../lib/dbState';
import { apiClient } from '../../../lib/apiClient';

export const FlatInspectionWorkspace = () => {
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();

  // 1. Available Wings
  const availableWings = (state.wings && state.wings.length > 0)
    ? state.wings.map(w => (typeof w === 'object' ? (w.wing_code || w.wingCode || w.name) : w)).filter(Boolean)
    : Array.from(new Set((state.flats || []).map(f => f.wing || f.wing_code))).filter(Boolean);
  const wingsList = availableWings;

  const [selectedWing, setSelectedWing] = useState(wingsList[0] || '');

  // 2. Available Floors for Selected Wing
  const availableFloors = Array.from(
    new Set((state.flats || [])
      .filter(f => String(f.wing || f.wing_code || '').toUpperCase() === String(selectedWing || '').toUpperCase())
      .map(f => Number(f.floorNumber || f.floor_number))
    )
  ).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
  const floorsList = availableFloors;

  const [selectedFloor, setSelectedFloor] = useState(floorsList[0] || null);

  // 3. Available Flats on Selected Floor & Wing
  const floorFlats = (state.flats || []).filter(f => {
    const fWing = String(f.wing || f.wing_code || '').toUpperCase();
    const sWing = String(selectedWing || '').toUpperCase();
    const fFloor = Number(f.floorNumber || f.floor_number);
    const sFloor = Number(selectedFloor);
    return fWing === sWing && fFloor === sFloor;
  });

  const [selectedFlatId, setSelectedFlatId] = useState(floorFlats[0]?.id || 1);

  // Keep selectedFlatId valid
  useEffect(() => {
    if (floorFlats.length > 0) {
      const exists = floorFlats.some(f => String(f.id) === String(selectedFlatId));
      if (!exists) setSelectedFlatId(floorFlats[0].id);
    }
  }, [selectedWing, selectedFloor, state.flats?.length]);

  const selectedFlat = (state.flats || []).find(f => String(f.id) === String(selectedFlatId)) || floorFlats[0];

  // 4. Room Zone Selection per Flat Plan
  const allZones = state.roomZones || [];
  const firstZone = allZones[0];
  const [selectedZoneId, setSelectedZoneId] = useState(firstZone?.id ?? '1');

  // Room Dimensions State
  const [isEditingDimensions, setIsEditingDimensions] = useState(false);
  const [dimLength, setDimLength] = useState(14.0);
  const [dimWidth, setDimWidth] = useState(12.0);
  const [dimHeight, setDimHeight] = useState(10.0);
  const [dimDeduction, setDimDeduction] = useState(30.0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTradeFilter, setSelectedTradeFilter] = useState('ALL');
  const [inspectionMessage, setInspectionMessage] = useState(null);

  const selectedZone = allZones.find(z => String(z.id) === String(selectedZoneId) || String(z.zone_code) === String(selectedZoneId)) || allZones[0];

  // Fetch or sync dimensions from local DB state
  useEffect(() => {
    if (selectedFlat && selectedZone) {
      const existingDim = (state.roomDimensions || []).find(
        d => String(d.flat_id || d.flatId) === String(selectedFlat.id) &&
             String(d.room_zone_id || d.roomZoneId) === String(selectedZone.id)
      );
      if (existingDim) {
        setDimLength(Number(existingDim.length_ft || existingDim.lengthFt || 14.0));
        setDimWidth(Number(existingDim.width_ft || existingDim.widthFt || 12.0));
        setDimHeight(Number(existingDim.height_ft || existingDim.heightFt || 10.0));
        setDimDeduction(Number(existingDim.door_window_deduction_sqft || existingDim.doorWindowDeductionSqft || 30.0));
      } else {
        // Defaults per room type
        const code = selectedZone.zone_code || selectedZone.zoneCode;
        if (code === 'HALL') { setDimLength(16); setDimWidth(12); setDimHeight(10); setDimDeduction(40); }
        else if (code === 'MASTER_BEDROOM') { setDimLength(14); setDimWidth(11); setDimHeight(10); setDimDeduction(30); }
        else if (code === 'KITCHEN') { setDimLength(10); setDimWidth(8.5); setDimHeight(10); setDimDeduction(25); }
        else if (code?.includes('TOILET')) { setDimLength(7); setDimWidth(5); setDimHeight(10); setDimDeduction(15); }
        else if (code?.includes('BALCONY')) { setDimLength(8); setDimWidth(4.5); setDimHeight(10); setDimDeduction(10); }
        else { setDimLength(12); setDimWidth(10); setDimHeight(10); setDimDeduction(25); }
      }
    }
  }, [selectedFlatId, selectedZoneId, state.roomDimensions?.length]);

  // Computed Room BOQ Quantities
  const computedFlooringSqft = Math.round(dimLength * dimWidth * 100) / 100;
  const computedWallSqft = Math.round(Math.max(0, (2 * (dimLength + dimWidth) * dimHeight) - dimDeduction) * 100) / 100;
  const computedCeilingSqft = computedFlooringSqft;
  const computedSkirtingRft = Math.round(Math.max(0, 2 * (dimLength + dimWidth) - 3.0) * 100) / 100;

  // Tasks strictly for the selected Flat
  const flatTasks = (state.flatTasks || []).filter(t => String(t.flatId ?? t.flat_id) === String(selectedFlat?.id));

  // Enrich tasks
  const enrichedTasks = flatTasks.map(t => {
    const catalog = (state.taskCatalog || []).find(c => String(c.id) === String(t.taskCatalogId ?? t.task_catalog_id));
    const zId = catalog?.roomZoneId ?? catalog?.room_zone_id ?? t.roomZoneId ?? t.room_zone_id;
    const zone = allZones.find(z => String(z.id) === String(zId) || String(z.zone_code) === String(catalog?.zoneCode || catalog?.zone_code));
    const contractor = (state.contractors || []).find(c => String(c.id) === String(t.assignedContractorId ?? t.assigned_contractor_id));

    // Dynamic quantity based on task trade & room dimensions
    const trade = (catalog?.tradeType || catalog?.trade_type || t.tradeType || 'GENERAL').toUpperCase();
    let taskQty = computedFlooringSqft;
    let unit = 'sq.ft';

    if (trade.includes('BRICK') || trade.includes('PLASTER') || trade.includes('POP') || trade.includes('PAINT')) {
      taskQty = computedWallSqft;
      unit = 'sq.ft';
    } else if (trade.includes('TILE') || trade.includes('FLOOR')) {
      taskQty = computedFlooringSqft;
      unit = 'sq.ft';
    } else if (trade.includes('DOOR') || trade.includes('WINDOW')) {
      taskQty = 1;
      unit = 'No.';
    } else if (trade.includes('ELECTRICAL') || trade.includes('PLUMBING')) {
      taskQty = computedSkirtingRft;
      unit = 'r.ft';
    }

    const rate = Number(contractor?.rate_per_sqft || contractor?.rate_per_unit || 25.0);
    const completionPct = Number(t.completionPct ?? t.completion_pct ?? 0);
    const earnedVal = Math.round((taskQty * (completionPct / 100) * rate) * 100) / 100;

    return {
      ...t,
      taskName: catalog?.taskName || catalog?.task_name || t.taskName || `Task #${t.id}`,
      tradeType: trade,
      zoneLabel: zone?.zoneLabel || zone?.zone_label || 'Zone',
      zoneId: zone?.id || zId,
      zoneCode: zone?.zone_code || zone?.zoneCode,
      contractorName: contractor?.companyName || contractor?.company_name || 'Unassigned',
      contractorId: contractor?.id,
      contractorRate: rate,
      taskQty,
      unit,
      completionPct,
      earnedVal,
      status: t.status || 'PENDING',
      startedAt: t.startedAt || t.started_at,
      inspectionRequestedAt: t.inspectionRequestedAt || t.inspection_requested_at,
      approvedAt: t.approvedAt || t.approved_at
    };
  });

  // Filter tasks for the Selected Room Zone
  const roomTasks = enrichedTasks.filter(t => {
    const matchesZone = String(t.zoneId) === String(selectedZone?.id) || 
      String(t.zoneCode).toUpperCase() === String(selectedZone?.zone_code).toUpperCase();
    const matchesTrade = selectedTradeFilter === 'ALL' || t.tradeType === selectedTradeFilter;
    const matchesSearch = !searchQuery.trim() || t.taskName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesZone && matchesTrade && matchesSearch;
  });

  // Stage 1: Assign Contractor
  const handleAssignContractor = async (taskId, contractorId) => {
    try {
      await apiClient.post(`/execution/tasks/${taskId}/assign`, { contractorId });
      updateFlatTaskProgress(taskId, 'ASSIGNED', undefined, undefined, undefined, undefined, contractorId);
      setInspectionMessage('Contractor assigned successfully!');
      setTimeout(() => setInspectionMessage(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Stage 2: Start Work Today
  const handleStartToday = async (taskId, taskName) => {
    try {
      await apiClient.post(`/execution/tasks/${taskId}/start-today`, {});
      updateFlatTaskProgress(taskId, 'IN_PROGRESS', 15, 'Work started on site');
      setInspectionMessage(`Recorded: Contractor started work on "${taskName}" today!`);
      setTimeout(() => setInspectionMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Stage 3: Daily Progress Update
  const handleDailyProgress = (taskId, pct, taskName) => {
    try {
      const status = pct === 100 ? 'INSPECTION_PENDING' : pct > 0 ? 'IN_PROGRESS' : 'PENDING';
      updateFlatTaskProgress(taskId, status, pct, `Daily progress logged: ${pct}%`);
      setInspectionMessage(`Updated "${taskName}" to ${pct}% completion!`);
      setTimeout(() => setInspectionMessage(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Stage 4: Request Inspection
  const handleRequestInspection = async (taskId, taskName) => {
    try {
      await apiClient.post(`/execution/tasks/${taskId}/request-inspection`, {});
      updateFlatTaskProgress(taskId, 'INSPECTION_PENDING', undefined, 'Ready for QA inspection');
      setInspectionMessage(`Inspection requested for "${taskName}"! Site engineer notified.`);
      setTimeout(() => setInspectionMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Stage 5: Final QA Verification & Approval
  const handleApprove100 = async (taskId, taskName) => {
    try {
      await apiClient.post(`/execution/tasks/${taskId}/approve`, {});
      updateFlatTaskProgress(taskId, 'APPROVED', 100, 'Passed QA checklist and verified on site');
      setInspectionMessage(`🎉 Approved & Verified 100%: "${taskName}" completed!`);
      setTimeout(() => setInspectionMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Save Custom Dimensions
  const handleSaveDimensions = async () => {
    try {
      await apiClient.post(`/execution/flats/${selectedFlat.id}/dimensions/${selectedZone.id}`, {
        lengthFt: dimLength,
        widthFt: dimWidth,
        heightFt: dimHeight,
        doorWindowDeductionSqft: dimDeduction
      });
      setIsEditingDimensions(false);
      setInspectionMessage(`Saved room dimensions for ${selectedZone.zoneLabel || selectedZone.zone_label}!`);
      setTimeout(() => setInspectionMessage(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const totalFlatTasks = enrichedTasks.length;
  const completedFlatTasks = enrichedTasks.filter(t => t.completionPct === 100 || t.status === 'APPROVED').length;
  const flatProgress = totalFlatTasks > 0 ? Math.round((completedFlatTasks / totalFlatTasks) * 100) : 0;

  const totalEarnedInRoom = roomTasks.reduce((sum, t) => sum + t.earnedVal, 0);

  return (
    <div className="space-y-6 max-w-[1800px] mx-auto">
      {/* Top Ribbon & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Site Execution & Quality Lifecycle</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Flat Inspection, Room Dimensions & Contractor Workflows
          </h1>
          <p className="text-xs text-slate-400">
            Multi-stage task execution: Assign Contractor $\rightarrow$ Start Work Today $\rightarrow$ Daily Status $\rightarrow$ Inspect $\rightarrow$ Complete.
          </p>
        </div>

        {/* Global Wing & Floor Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Wing</label>
            <select
              value={selectedWing}
              onChange={(e) => {
                const newWing = e.target.value;
                setSelectedWing(newWing);
                const nextFloors = Array.from(new Set((state.flats || []).filter(f => String(f.wing || f.wing_code || '').toUpperCase() === String(newWing || '').toUpperCase()).map(f => Number(f.floorNumber || f.floor_number)))).filter(Boolean).sort((a, b) => a - b);
                if (nextFloors.length > 0 && !nextFloors.includes(selectedFloor)) {
                  setSelectedFloor(nextFloors[0]);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-white outline-none"
            >
              {wingsList.map((w, idx) => (
                <option key={`wing-opt-${w}-${idx}`} value={w}>🏢 Wing {w}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Floor</label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(parseInt(e.target.value, 10))}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-white outline-none"
            >
              {floorsList.map((f, idx) => (
                <option key={`floor-opt-${f}-${idx}`} value={f}>Floor {f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STEP 1: Wing & Flat Selection Ribbon */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>Step 1: Select Flat on Floor {selectedFloor} (Wing {selectedWing})</span>
          </span>
          <span className="text-xs font-bold text-slate-400">
            {floorFlats.length} Units Available
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {floorFlats.map((flat) => {
            const isSelected = String(flat.id) === String(selectedFlat?.id);
            const flatProg = calculateFlatProgress(flat.id);

            return (
              <button
                key={`flat-btn-${flat.id}`}
                onClick={() => setSelectedFlatId(flat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>Flat {flat.flatNumber || flat.flat_number}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 font-bold'
                }`}>
                  {flat.unitType || flat.unit_type || 'Unit'} • {flatProg}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: Room Zone Selector & Architectural Dimensions Card */}
      {selectedFlat && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room Zones Selector */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-sky-400 tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Step 2: Room Plan of Flat {selectedFlat.flatNumber || selectedFlat.flat_number}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {allZones.length} Zones
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {allZones.map((z) => {
                const isSelected = String(z.id) === String(selectedZone?.id);
                const zoneTasks = enrichedTasks.filter(t => String(t.zoneId) === String(z.id) || String(t.zoneCode) === String(z.zone_code));
                const completedInZone = zoneTasks.filter(t => t.completionPct === 100 || t.status === 'APPROVED').length;

                return (
                  <button
                    key={`zone-card-${z.id}`}
                    onClick={() => setSelectedZoneId(z.id)}
                    className={`p-3 rounded-xl text-left transition flex items-center justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-sky-950 border-sky-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-sm flex items-center space-x-2">
                        <span>{z.zoneLabel || z.zone_label}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {zoneTasks.length} Micro-Tasks • {completedInZone} Approved
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xs font-black ${completedInZone === zoneTasks.length && zoneTasks.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {zoneTasks.length > 0 ? `${Math.round((completedInZone / zoneTasks.length) * 100)}%` : '0%'}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 ml-auto mt-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room Dimensions & BOQ Spec Card */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Ruler className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-white text-base">
                    Room Structural Dimensions: {selectedZone?.zoneLabel || selectedZone?.zone_label} (Flat {selectedFlat.flatNumber || selectedFlat.flat_number})
                  </h3>
                </div>

                <button
                  onClick={() => {
                    if (isEditingDimensions) handleSaveDimensions();
                    else setIsEditingDimensions(true);
                  }}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {isEditingDimensions ? <Save className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5 text-sky-400" />}
                  <span>{isEditingDimensions ? 'Save Dimensions' : 'Edit Dimensions'}</span>
                </button>
              </div>

              {/* Dimensions Inputs / Displays */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Length (L)</span>
                  {isEditingDimensions ? (
                    <input 
                      type="number" 
                      value={dimLength} 
                      onChange={(e) => setDimLength(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm font-black text-white outline-none mt-1"
                    />
                  ) : (
                    <span className="text-lg font-black text-white mt-1 block">{dimLength} ft</span>
                  )}
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Width (W)</span>
                  {isEditingDimensions ? (
                    <input 
                      type="number" 
                      value={dimWidth} 
                      onChange={(e) => setDimWidth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm font-black text-white outline-none mt-1"
                    />
                  ) : (
                    <span className="text-lg font-black text-white mt-1 block">{dimWidth} ft</span>
                  )}
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Height (H)</span>
                  {isEditingDimensions ? (
                    <input 
                      type="number" 
                      value={dimHeight} 
                      onChange={(e) => setDimHeight(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm font-black text-white outline-none mt-1"
                    />
                  ) : (
                    <span className="text-lg font-black text-white mt-1 block">{dimHeight} ft</span>
                  )}
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Door/Window Ded.</span>
                  {isEditingDimensions ? (
                    <input 
                      type="number" 
                      value={dimDeduction} 
                      onChange={(e) => setDimDeduction(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-sm font-black text-white outline-none mt-1"
                    />
                  ) : (
                    <span className="text-lg font-black text-amber-400 mt-1 block">-{dimDeduction} sq.ft</span>
                  )}
                </div>
              </div>

              {/* Auto-Calculated BOQ Quantities */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block">Flooring Area</span>
                  <span className="text-base font-black text-white mt-0.5 block">{computedFlooringSqft} sq.ft</span>
                  <span className="text-[9px] text-slate-500">L × W</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-sky-400 uppercase block">Wall Plaster Area</span>
                  <span className="text-base font-black text-white mt-0.5 block">{computedWallSqft} sq.ft</span>
                  <span className="text-[9px] text-slate-500">2(L+W)H - Ded.</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-purple-400 uppercase block">Ceiling Area</span>
                  <span className="text-base font-black text-white mt-0.5 block">{computedCeilingSqft} sq.ft</span>
                  <span className="text-[9px] text-slate-500">L × W</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-amber-400 uppercase block">Skirting Length</span>
                  <span className="text-base font-black text-white mt-0.5 block">{computedSkirtingRft} r.ft</span>
                  <span className="text-[9px] text-slate-500">Perimeter - Door</span>
                </div>
              </div>
            </div>

            {/* Total Earned Value in Selected Room */}
            <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800 mt-2">
              <span className="text-xs font-bold text-slate-400">
                Total Earned Contractor Value in {selectedZone?.zoneLabel || selectedZone?.zone_label}:
              </span>
              <span className="text-base font-black text-emerald-400 flex items-center space-x-1">
                <span>₹ {totalEarnedInRoom.toLocaleString('en-IN')}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Multi-Stage Room Micro-Tasks Table */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider flex items-center space-x-1.5">
              <FileCheck2 className="w-4 h-4" />
              <span>Step 3: {selectedZone?.zoneLabel || selectedZone?.zone_label} Micro-Tasks & Multi-Stage Operations</span>
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute lifecycle stages for all tasks in this room zone.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search room tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {inspectionMessage && (
          <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{inspectionMessage}</span>
          </div>
        )}

        {/* Tasks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 font-bold min-w-[220px]">Micro-Task & Trade</th>
                <th className="py-3 px-4 font-bold min-w-[170px]">Contractor & Rate</th>
                <th className="py-3 px-4 font-bold text-center min-w-[120px]">Quantity (BOQ)</th>
                <th className="py-3 px-4 font-bold text-center min-w-[180px]">Lifecycle Stage</th>
                <th className="py-3 px-4 font-bold text-right min-w-[340px]">Multi-Stage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {roomTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-bold">
                    No micro-tasks configured for {selectedZone?.zoneLabel || selectedZone?.zone_label} zone.
                  </td>
                </tr>
              ) : (
                roomTasks.map((t, idx) => {
                  const isApproved = t.completionPct === 100 || t.status === 'APPROVED';
                  const isInspectionPending = t.status === 'INSPECTION_PENDING';
                  const isInProgress = t.status === 'IN_PROGRESS';
                  const isAssigned = t.status === 'ASSIGNED';
                  const isPending = t.status === 'PENDING' || !t.status;

                  return (
                    <tr key={`task-row-${t.id || idx}`} className="hover:bg-slate-850/50 transition">
                      {/* Task Name & Trade */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-white text-sm">{t.taskName}</div>
                        <span className="text-[10px] text-sky-400 font-bold bg-sky-950/60 border border-sky-800 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {t.tradeType}
                        </span>
                      </td>

                      {/* Assigned Contractor & Registered Rate */}
                      <td className="py-3.5 px-4">
                        <select
                          value={t.contractorId || ''}
                          onChange={(e) => handleAssignContractor(t.id, Number(e.target.value))}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-[11px] font-bold text-white outline-none w-full mb-1"
                        >
                          <option value="">Select Contractor...</option>
                          {(state.contractors || []).map((c) => (
                            <option key={`opt-c-${c.id}`} value={c.id}>
                              {c.companyName || c.company_name} (₹{c.rate_per_sqft || c.rate_per_unit || 25}/sq.ft)
                            </option>
                          ))}
                        </select>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Rate: ₹{t.contractorRate}/sq.ft
                        </div>
                      </td>

                      {/* Dimension Quantity & Earned Value */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-black text-white text-sm">{t.taskQty} {t.unit}</div>
                        <div className="text-[10px] font-bold text-emerald-400 mt-0.5">
                          Earned: ₹{t.earnedVal.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Stage Badge & Progress */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border inline-block ${
                          isApproved
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : isInspectionPending
                            ? 'bg-purple-950 text-purple-400 border-purple-800 animate-pulse'
                            : isInProgress
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : isAssigned
                            ? 'bg-sky-950 text-sky-400 border-sky-800'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}>
                          {isApproved ? '5. APPROVED (100%)' :
                           isInspectionPending ? '4. INSPECTION PENDING' :
                           isInProgress ? `3. IN PROGRESS (${t.completionPct}%)` :
                           isAssigned ? '1. ASSIGNED TO CONTRACTOR' : '0. NOT STARTED'}
                        </span>
                        <div className="w-24 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800 mx-auto mt-1.5">
                          <div 
                            className={`h-full ${isApproved ? 'bg-emerald-400' : isInspectionPending ? 'bg-purple-400' : 'bg-amber-400'}`}
                            style={{ width: `${t.completionPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Multi-Stage Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* Stage 2: Start Today */}
                          {(!t.startedAt && !isApproved) && (
                            <button
                              onClick={() => handleStartToday(t.id, t.taskName)}
                              className="px-2.5 py-1.5 bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-300 rounded-xl text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              title="Set today Contractor Started Work"
                            >
                              <Play className="w-3 h-3 text-sky-400" />
                              <span>Start Today</span>
                            </button>
                          )}

                          {/* Stage 3: Daily Progress Increments */}
                          {!isApproved && (
                            <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                              <button
                                onClick={() => handleDailyProgress(t.id, 25, t.taskName)}
                                className="px-1.5 py-1 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold"
                              >
                                25%
                              </button>
                              <button
                                onClick={() => handleDailyProgress(t.id, 50, t.taskName)}
                                className="px-1.5 py-1 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold"
                              >
                                50%
                              </button>
                              <button
                                onClick={() => handleDailyProgress(t.id, 75, t.taskName)}
                                className="px-1.5 py-1 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold"
                              >
                                75%
                              </button>
                            </div>
                          )}

                          {/* Stage 4: Request Inspection */}
                          {(!isInspectionPending && !isApproved) && (
                            <button
                              onClick={() => handleRequestInspection(t.id, t.taskName)}
                              className="px-2.5 py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 rounded-xl text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              title="Request Quality Inspection"
                            >
                              <Clock className="w-3 h-3 text-purple-400" />
                              <span>Inspect</span>
                            </button>
                          )}

                          {/* Stage 5: Final QA Approve 100% */}
                          <button
                            onClick={() => handleApprove100(t.id, t.taskName)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1 border cursor-pointer ${
                              isApproved
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                                : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isApproved ? 'Verified 100%' : 'Approve 100%'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FlatInspectionWorkspace;
