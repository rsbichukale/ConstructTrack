'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Trash2,
  Loader2,
  Check,
  Home,
  CheckSquare,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Edit2,
  PackagePlus,
  Boxes,
  Truck,
  ShieldCheck,
  Wallet,
  Building2,
  Flame,
  AlertTriangle,
  Users
} from 'lucide-react';
import { api } from '../../lib/apiClient';
import { fetchStateFromBackend } from '../../lib/backendSync';
import { saveAppState, getAppState } from '../../lib/dbState';
import { saveFullLocalState } from '../../lib/localDb';

const TYPOLOGY_OPTIONS = [
  { value: '1BHK', label: '1BHK', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' },
  { value: '2BHK', label: '2BHK', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30' },
  { value: '3BHK', label: '3BHK', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' },
  { value: '4BHK', label: '4BHK', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30' },
];

export const ProjectSetupWizard = ({ isOpen, onClose, onComplete }) => {
  const state = getAppState();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);

  // Form State - Step 1: Site Identity
  const dbSite = (state.sites || [])[0];
  const dbWings = Array.from(new Set([
    ...(state.wings || []).map(w => w.wing_code || w.wingCode || w.name || w),
    ...(state.flats || []).map(f => f.wing)
  ])).filter(Boolean);

  const [siteName, setSiteName] = useState(dbSite?.name || 'Apex Grandeur Site');
  const [location, setLocation] = useState(dbSite?.location || 'Sector 18 Site');
  const [targetDate, setTargetDate] = useState('2027-12-31');

  // Form State - Step 2: Wings & Flats Layout
  const [wings, setWings] = useState(dbWings.length > 0 ? dbWings : ['B1', 'B2']);
  const [floorsCount, setFloorsCount] = useState((state.floors || []).length || 7);
  const [flatsPerFloor, setFlatsPerFloor] = useState(5);
  const [showMatrixView, setShowMatrixView] = useState(false);

  const [flatTypologyRules, setFlatTypologyRules] = useState({
    '1': '3BHK',
    '2': '3BHK',
    '3': '2BHK',
    '4': '2BHK',
    '5': '2BHK',
  });

  const [customFlatTypologies, setCustomFlatTypologies] = useState({});

  // Form State - Step 3: Room Structure & Typology Map
  const [roomZones, setRoomZones] = useState([]);
  const [activeTypologyTab, setActiveTypologyTab] = useState('3BHK');
  const [typologyRoomMap, setTypologyRoomMap] = useState({
    '3BHK': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    '2BHK': [1, 2, 3, 4, 5, 6, 7, 8, 9],
    '1BHK': [1, 2, 4, 6, 7, 8, 9],
    '4BHK': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  });
  const [newRoomName, setNewRoomName] = useState('');

  // Form State - Step 4: Master Checklist & Micro-Tasks Catalog
  const [taskCatalog, setTaskCatalog] = useState([]);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [selectedTradeFilter, setSelectedTradeFilter] = useState('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');
  const [expandedRooms, setExpandedRooms] = useState({});
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  // New Micro-Task Form State
  const [newMicroTaskName, setNewMicroTaskName] = useState('');
  const [newMicroTaskTrade, setNewMicroTaskTrade] = useState('BRICK WORK');
  const [newMicroTaskZone, setNewMicroTaskZone] = useState(1);
  const [newMicroTaskDays, setNewMicroTaskDays] = useState(2);

  // Form State - Step 5: Contractors & Phases
  const [trades, setTrades] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [executionPhases, setExecutionPhases] = useState([]);

  // Form State - Step 6: Materials Store Baseline
  const [materials, setMaterials] = useState([]);
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] = useState('CEMENT');
  const [newMatStock, setNewMatStock] = useState(100);
  const [newMatUnit, setNewMatUnit] = useState('Bags');
  const [newMatRate, setNewMatRate] = useState(380);

  // Form State - Step 7: Machinery Fleet Baseline
  const [machinery, setMachinery] = useState([]);
  const [newMachName, setNewMachName] = useState('');
  const [newMachType, setNewMachType] = useState('Crane');
  const [newMachModel, setNewMachModel] = useState('');
  const [newMachHours, setNewMachHours] = useState(50);

  // Form State - Step 8: HSE Safety & Petty Cash
  const [safetyOfficer, setSafetyOfficer] = useState('R. K. Verma');
  const [emergencyHospital, setEmergencyHospital] = useState('Apollo Multispeciality Hospital (022-27748888)');
  const [ppeTopics, setPpeTopics] = useState([
    'Mandatory Hard Hats, Steel-Toe Boots & High-Vis Vests',
    'Double Lanyard Safety Harness on Slab Edges',
    'Dust Masks & Eye Goggles during Concrete Grinding'
  ]);
  const [newPpeTopic, setNewPpeTopic] = useState('');
  const [openingCashFloat, setOpeningCashFloat] = useState(50000);
  const [cashCustodian, setCashCustodian] = useState('Site Accounts Officer');
  const [dailyCashLimit, setDailyCashLimit] = useState(15000);

  // Fetch presets on mount
  useEffect(() => {
    if (!isOpen) return;

    const loadPresets = async () => {
      setIsLoadingPresets(true);
      try {
        const res = await api.get('/setup/presets');
        if (res.success && res.presets) {
          setTrades(res.presets.trades || []);
          setRoomZones(res.presets.roomZones || []);
          setTypologyRoomMap(res.presets.typologyRoomMap || {
            '3BHK': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            '2BHK': [1, 2, 3, 4, 5, 6, 7, 8, 9],
            '1BHK': [1, 2, 4, 6, 7, 8, 9],
            '4BHK': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          });
          setContractors(res.presets.contractors || []);
          setExecutionPhases(res.presets.executionPhases || []);
          setTaskCatalog(res.presets.taskCatalog || []);
          setMaterials(res.presets.materials || []);
          setMachinery(res.presets.machinery || []);

          if (res.presets.hse) {
            setSafetyOfficer(res.presets.hse.safetyOfficerName || 'R. K. Verma');
            setEmergencyHospital(res.presets.hse.emergencyHospital || 'Apollo Hospital');
            if (res.presets.hse.ppeBriefingTopics) {
              setPpeTopics(res.presets.hse.ppeBriefingTopics);
            }
          }

          if (res.presets.pettyCash) {
            setOpeningCashFloat(res.presets.pettyCash.openingBalance || 50000);
            setCashCustodian(res.presets.pettyCash.custodianName || 'Site Accounts Officer');
            setDailyCashLimit(res.presets.pettyCash.dailyLimit || 15000);
          }

          // Expand all room zones by default
          const exp = {};
          (res.presets.roomZones || []).forEach(r => { exp[r.id] = true; });
          setExpandedRooms(exp);
        }
      } catch (err) {
        console.warn('[Setup Wizard] Failed to load presets:', err.message);
      } finally {
        setIsLoadingPresets(false);
      }
    };

    void loadPresets();
  }, [isOpen]);

  useEffect(() => {
    const updated = { ...flatTypologyRules };
    for (let i = 1; i <= flatsPerFloor; i++) {
      if (!updated[String(i)]) {
        updated[String(i)] = i <= 2 ? '3BHK' : '2BHK';
      }
    }
    setFlatTypologyRules(updated);
  }, [flatsPerFloor]);

  if (!isOpen) return null;

  const totalFlats = wings.length * Number(floorsCount) * Number(flatsPerFloor);

  const countTypologyBreakdown = () => {
    const counts = { '1BHK': 0, '2BHK': 0, '3BHK': 0, '4BHK': 0 };
    for (const wing of wings) {
      for (let floor = 1; floor <= Number(floorsCount); floor++) {
        for (let flatNum = 1; flatNum <= Number(flatsPerFloor); flatNum++) {
          const flatNumber = `${floor}0${flatNum}`;
          const flatKey = `${wing}-${flatNumber}`;
          const type = customFlatTypologies[flatKey] || flatTypologyRules[String(flatNum)] || '2BHK';
          counts[type] = (counts[type] || 0) + 1;
        }
      }
    }
    return counts;
  };

  const typologyCounts = countTypologyBreakdown();

  const computeTotalTasks = () => {
    let total = 0;
    for (const wing of wings) {
      for (let floor = 1; floor <= Number(floorsCount); floor++) {
        for (let flatNum = 1; flatNum <= Number(flatsPerFloor); flatNum++) {
          const flatNumber = `${floor}0${flatNum}`;
          const flatKey = `${wing}-${flatNumber}`;
          const type = customFlatTypologies[flatKey] || flatTypologyRules[String(flatNum)] || '2BHK';
          const allowedRooms = typologyRoomMap[type] || [1, 2, 3, 4, 5, 6, 7, 8, 9];

          for (const item of taskCatalog) {
            if (item.isBuildingCommon || !item.roomZoneId || allowedRooms.includes(Number(item.roomZoneId))) {
              total++;
            }
          }
        }
      }
    }
    return total;
  };

  const calculatedTotalTasks = computeTotalTasks();

  const handleNext = () => {
    if (currentStep < 9) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAddWing = () => {
    const nextCode = `B${wings.length + 1}`;
    setWings([...wings, nextCode]);
  };

  const handleRemoveWing = (idx) => {
    if (wings.length <= 1) return;
    setWings(wings.filter((_, i) => i !== idx));
  };

  const handleTypologyChange = (flatNumStr, newType) => {
    setFlatTypologyRules(prev => ({ ...prev, [flatNumStr]: newType }));
  };

  const handleApplyPresetTypology = (type) => {
    const updated = {};
    for (let i = 1; i <= flatsPerFloor; i++) {
      if (type === 'ALL_2BHK') updated[String(i)] = '2BHK';
      else if (type === 'ALL_3BHK') updated[String(i)] = '3BHK';
      else if (type === 'ALL_1BHK') updated[String(i)] = '1BHK';
      else if (type === 'STANDARD_MIX') updated[String(i)] = i <= 2 ? '3BHK' : '2BHK';
    }
    setFlatTypologyRules(updated);
    setCustomFlatTypologies({});
  };

  const handleToggleSingleFlatTypology = (wing, flatNumber, currentType) => {
    const flatKey = `${wing}-${flatNumber}`;
    const nextType = currentType === '3BHK' ? '2BHK' : currentType === '2BHK' ? '1BHK' : currentType === '1BHK' ? '4BHK' : '3BHK';
    setCustomFlatTypologies(prev => ({ ...prev, [flatKey]: nextType }));
  };

  const handleToggleRoomInTypology = (typology, roomId) => {
    const currentList = typologyRoomMap[typology] || [];
    let updated;
    if (currentList.includes(roomId)) {
      updated = currentList.filter(id => id !== roomId);
    } else {
      updated = [...currentList, roomId];
    }
    setTypologyRoomMap(prev => ({ ...prev, [typology]: updated }));
  };

  const handleAddCustomRoom = () => {
    if (!newRoomName.trim()) return;
    const newId = roomZones.length > 0 ? Math.max(...roomZones.map(r => r.id)) + 1 : 1;
    const newZone = {
      id: newId,
      zoneCode: newRoomName.trim().toUpperCase().replace(/\s+/g, '_'),
      zoneLabel: newRoomName.trim(),
      iconName: 'Home',
    };
    setRoomZones([...roomZones, newZone]);
    setTypologyRoomMap(prev => ({
      ...prev,
      [activeTypologyTab]: [...(prev[activeTypologyTab] || []), newId],
    }));
    setExpandedRooms(prev => ({ ...prev, [newId]: true }));
    setNewRoomName('');
  };

  const handleToggleRoomAccordion = (zoneId) => {
    setExpandedRooms(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
  };

  const handleAddMicroTask = () => {
    if (!newMicroTaskName.trim()) return;
    const newId = taskCatalog.length > 0 ? Math.max(...taskCatalog.map(t => t.id)) + 1 : 1;
    const newTask = {
      id: newId,
      taskName: newMicroTaskName.trim(),
      tradeType: newMicroTaskTrade,
      roomZoneId: Number(newMicroTaskZone),
      mostLikelyDays: Number(newMicroTaskDays),
      executionPhaseId: 1,
    };
    setTaskCatalog([...taskCatalog, newTask]);
    setNewMicroTaskName('');
    setIsAddFormOpen(false);
  };

  const handleDeleteMicroTask = (taskId) => {
    setTaskCatalog(taskCatalog.filter(t => t.id !== taskId));
  };

  const handleUpdateTaskField = (taskId, field, value) => {
    setTaskCatalog(taskCatalog.map(t => (t.id === taskId ? { ...t, [field]: value } : t)));
  };

  // Materials Handlers (Step 6)
  const handleAddMaterial = () => {
    if (!newMatName.trim()) return;
    const item = {
      itemName: newMatName.trim(),
      category: newMatCategory,
      currentStock: Number(newMatStock) || 0,
      unit: newMatUnit,
      avgRatePerUnit: Number(newMatRate) || 0,
      minReorderLevel: 10
    };
    setMaterials([...materials, item]);
    setNewMatName('');
    setNewMatStock(100);
  };

  const handleRemoveMaterial = (idx) => {
    setMaterials(materials.filter((_, i) => i !== idx));
  };

  // Machinery Handlers (Step 7)
  const handleAddMachinery = () => {
    if (!newMachName.trim()) return;
    const item = {
      equipmentName: newMachName.trim(),
      equipmentType: newMachType,
      modelNumber: newMachModel.trim() || 'Standard',
      capacity: 'Operational',
      status: 'OPERATIONAL',
      currentHours: Number(newMachHours) || 0
    };
    setMachinery([...machinery, item]);
    setNewMachName('');
    setNewMachModel('');
  };

  const handleRemoveMachinery = (idx) => {
    setMachinery(machinery.filter((_, i) => i !== idx));
  };

  // PPE Topic Handlers (Step 8)
  const handleAddPpeTopic = () => {
    if (!newPpeTopic.trim()) return;
    setPpeTopics([...ppeTopics, newPpeTopic.trim()]);
    setNewPpeTopic('');
  };

  const handleRemovePpeTopic = (idx) => {
    setPpeTopics(ppeTopics.filter((_, i) => i !== idx));
  };

  const handleExecuteSetup = async () => {
    setIsSubmitting(true);
    setSubmitProgress(20);

    try {
      const payload = {
        siteName,
        location,
        wings,
        floorsCount: Number(floorsCount),
        flatsPerFloor: Number(flatsPerFloor),
        flatTypologyRules,
        customFlatTypologies,
        typologyRoomMap,
        roomZones,
        trades,
        contractors,
        executionPhases,
        taskCatalog,
        materials,
        machinery,
        hse: {
          safetyOfficerName: safetyOfficer,
          emergencyHospital,
          ppeBriefingTopics: ppeTopics
        },
        pettyCash: {
          openingBalance: Number(openingCashFloat),
          custodianName: cashCustodian,
          dailyLimit: Number(dailyCashLimit)
        }
      };

      setSubmitProgress(50);
      const res = await api.post('/setup/initialize', payload);

      if (!res.success) {
        throw new Error(res.error || 'Project initialization failed');
      }

      setSubmitProgress(80);

      const freshState = await fetchStateFromBackend();
      if (freshState) {
        saveAppState(freshState);
        await saveFullLocalState(freshState);
      }

      setSubmitProgress(100);
      setTimeout(() => {
        setIsSubmitting(false);
        if (onComplete) onComplete(freshState);
        onClose();
      }, 800);
    } catch (err) {
      console.error('[Setup Wizard Error]:', err);
      alert(`Setup Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="w-full max-w-5xl max-h-[94vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <span>Enterprise Project Setup Wizard</span>
                <span className="text-xs px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full font-mono">
                  Step {currentStep} of 9
                </span>
              </h2>
              <p className="text-xs text-slate-400">Complete building layout, task matrix, store baseline, machinery & HSE setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold overflow-x-auto">
          {[
            { num: 1, label: 'Identity' },
            { num: 2, label: 'Wings & Layout' },
            { num: 3, label: 'Room Zones' },
            { num: 4, label: 'Micro-Tasks' },
            { num: 5, label: 'Contractors' },
            { num: 6, label: 'Store Baseline' },
            { num: 7, label: 'Plant Fleet' },
            { num: 8, label: 'HSE & Cash Float' },
            { num: 9, label: 'Review & Generate' },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => !isSubmitting && setCurrentStep(s.num)}
              className={`flex-1 min-w-[95px] py-2.5 px-2 text-center cursor-pointer transition-all flex items-center justify-center space-x-1 border-b-2 ${
                currentStep === s.num
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : currentStep > s.num
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-400'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                currentStep === s.num ? 'bg-amber-500 text-slate-950 font-black' : currentStep > s.num ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {currentStep > s.num ? <Check className="w-2 h-2 stroke-[3]" /> : s.num}
              </span>
              <span className="truncate">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoadingPresets ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading master presets from PostgreSQL database...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: Site Identity */}
              {currentStep === 1 && (
                <div className="space-y-4 max-w-xl mx-auto pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Project / Site Name *</label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="e.g. Apex Grandeur High-Rise"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Plot Location & City *</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Plot 42, Sector 18, Kharghar"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Target Delivery / Handover Date</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Wings & Layout */}
              {currentStep === 2 && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                      <label className="text-xs font-bold text-slate-300">Tower Wings</label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {wings.map((w, idx) => (
                          <div key={idx} className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-mono font-bold">
                            <span>Wing {w}</span>
                            {wings.length > 1 && (
                              <button onClick={() => handleRemoveWing(idx)} className="hover:text-red-400 ml-1">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button onClick={handleAddWing} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs flex items-center space-x-1">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Wing</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                      <label className="text-xs font-bold text-slate-300">Floors Count</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={floorsCount}
                        onChange={(e) => setFloorsCount(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
                      />
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                      <label className="text-xs font-bold text-slate-300">Flats Per Floor</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={flatsPerFloor}
                        onChange={(e) => setFlatsPerFloor(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Typology Distribution Rules</span>
                      <div className="flex space-x-2">
                        <button onClick={() => handleApplyPresetTypology('STANDARD_MIX')} className="px-2.5 py-1 bg-slate-800 text-[10px] text-slate-300 rounded-lg hover:bg-slate-700">Standard Mix</button>
                        <button onClick={() => handleApplyPresetTypology('ALL_2BHK')} className="px-2.5 py-1 bg-slate-800 text-[10px] text-slate-300 rounded-lg hover:bg-slate-700">All 2BHK</button>
                        <button onClick={() => handleApplyPresetTypology('ALL_3BHK')} className="px-2.5 py-1 bg-slate-800 text-[10px] text-slate-300 rounded-lg hover:bg-slate-700">All 3BHK</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {Array.from({ length: flatsPerFloor }).map((_, i) => {
                        const fn = String(i + 1);
                        const current = flatTypologyRules[fn] || '2BHK';
                        return (
                          <div key={fn} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-center">
                            <span className="text-[10px] text-slate-400 font-mono block font-bold">Unit *0{fn}</span>
                            <select
                              value={current}
                              onChange={(e) => handleTypologyChange(fn, e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1 text-white text-xs font-bold text-center"
                            >
                              <option value="1BHK">1BHK</option>
                              <option value="2BHK">2BHK</option>
                              <option value="3BHK">3BHK</option>
                              <option value="4BHK">4BHK</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Room Zones */}
              {currentStep === 3 && (
                <div className="space-y-4 pt-1">
                  <div className="flex space-x-2 border-b border-slate-800 pb-2">
                    {['3BHK', '2BHK', '1BHK', '4BHK'].map((typ) => (
                      <button
                        key={typ}
                        onClick={() => setActiveTypologyTab(typ)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                          activeTypologyTab === typ ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {typ} Layout
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {roomZones.map((zone) => {
                      const isIncluded = (typologyRoomMap[activeTypologyTab] || []).includes(zone.id);
                      return (
                        <div
                          key={zone.id}
                          onClick={() => handleToggleRoomInTypology(activeTypologyTab, zone.id)}
                          className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                            isIncluded
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold">{zone.zoneLabel}</span>
                          <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                            isIncluded ? 'bg-amber-500 text-slate-950' : 'border border-slate-700'
                          }`}>
                            {isIncluded && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: Micro-Tasks Catalog */}
              {currentStep === 4 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">{taskCatalog.length} Template Tasks Active</span>
                    <button
                      onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Task</span>
                    </button>
                  </div>

                  {isAddFormOpen && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs animate-in fade-in">
                      <input
                        type="text"
                        placeholder="Task Name..."
                        value={newMicroTaskName}
                        onChange={(e) => setNewMicroTaskName(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                      <select
                        value={newMicroTaskTrade}
                        onChange={(e) => setNewMicroTaskTrade(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                      >
                        {trades.map(t => <option key={t.tradeCode} value={t.tradeCode}>{t.tradeName}</option>)}
                      </select>
                      <select
                        value={newMicroTaskZone}
                        onChange={(e) => setNewMicroTaskZone(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                      >
                        {roomZones.map(z => <option key={z.id} value={z.id}>{z.zoneLabel}</option>)}
                      </select>
                      <button onClick={handleAddMicroTask} className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg">Save Task</button>
                    </div>
                  )}

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {taskCatalog.slice(0, 15).map((task) => (
                      <div key={task.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-white font-medium">{task.taskName}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">{task.tradeType}</span>
                          <button onClick={() => handleDeleteMicroTask(task.id)} className="text-slate-500 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: Contractors */}
              {currentStep === 5 && (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-slate-400">Configure trade subcontractors and unit execution rates.</p>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {contractors.map((c, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">{c.tradeType}</span>
                          <input
                            type="text"
                            value={c.companyName}
                            onChange={(e) => {
                              const u = [...contractors];
                              u[idx] = { ...u[idx], companyName: e.target.value };
                              setContractors(u);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-medium"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Contact</span>
                          <input
                            type="text"
                            value={c.contactPerson || ''}
                            onChange={(e) => {
                              const u = [...contractors];
                              u[idx] = { ...u[idx], contactPerson: e.target.value };
                              setContractors(u);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Phone</span>
                          <input
                            type="text"
                            value={c.phone || ''}
                            onChange={(e) => {
                              const u = [...contractors];
                              u[idx] = { ...u[idx], phone: e.target.value };
                              setContractors(u);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Rate (₹/Unit)</span>
                          <input
                            type="number"
                            value={c.ratePerUnit || 0}
                            onChange={(e) => {
                              const u = [...contractors];
                              u[idx] = { ...u[idx], ratePerUnit: Number(e.target.value) };
                              setContractors(u);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 6: [NEW] Materials Store Baseline */}
              {currentStep === 6 && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                        <Boxes className="w-4 h-4 text-amber-400" />
                        <span>Initial Materials Store Baseline</span>
                      </h4>
                      <p className="text-xs text-slate-400">Register core opening stock of building materials & fuel.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-xs">
                    <input
                      type="text"
                      placeholder="Material Item..."
                      value={newMatName}
                      onChange={(e) => setNewMatName(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white sm:col-span-2"
                    />
                    <select
                      value={newMatCategory}
                      onChange={(e) => setNewMatCategory(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                    >
                      <option value="CEMENT">CEMENT</option>
                      <option value="STEEL">STEEL</option>
                      <option value="AGGREGATE">AGGREGATE</option>
                      <option value="FUEL">FUEL</option>
                      <option value="CHEMICALS">CHEMICALS</option>
                    </select>
                    <div className="flex space-x-1">
                      <input
                        type="number"
                        placeholder="Stock"
                        value={newMatStock}
                        onChange={(e) => setNewMatStock(Number(e.target.value))}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={newMatUnit}
                        onChange={(e) => setNewMatUnit(e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                      />
                    </div>
                    <button onClick={handleAddMaterial} className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg flex items-center justify-center space-x-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add SKU</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {materials.map((mat, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-white font-bold block">{mat.itemName}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-mono">{mat.category} | Reorder Threshold: {mat.minReorderLevel} {mat.unit}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold rounded-lg">
                            {mat.currentStock} {mat.unit}
                          </span>
                          <button onClick={() => handleRemoveMaterial(idx)} className="text-slate-500 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 7: [NEW] Machinery & Heavy Plant Fleet */}
              {currentStep === 7 && (
                <div className="space-y-4 pt-1">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-sky-400" />
                      <span>Plant, Machinery & Heavy Fleet Registry</span>
                    </h4>
                    <p className="text-xs text-slate-400">Register active cranes, concrete transit mixers, hoists, and generators.</p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-2 items-center text-xs">
                    <input
                      type="text"
                      placeholder="Equipment Name (e.g. Tower Crane TC-02)..."
                      value={newMachName}
                      onChange={(e) => setNewMachName(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                    <select
                      value={newMachType}
                      onChange={(e) => setNewMachType(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                    >
                      <option value="Crane">Tower Crane</option>
                      <option value="Hoist">Passenger Hoist</option>
                      <option value="Mixer">Transit Concrete Mixer</option>
                      <option value="Earthmover">JCB / Excavator</option>
                      <option value="Generator">Diesel Generator</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Initial Hours"
                      value={newMachHours}
                      onChange={(e) => setNewMachHours(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                    <button onClick={handleAddMachinery} className="px-3 py-1.5 bg-sky-500 text-slate-950 font-bold rounded-lg flex items-center justify-center space-x-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Asset</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {machinery.map((mach, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-white font-bold block">{mach.equipmentName}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-mono">{mach.equipmentType} | {mach.modelNumber || 'Model N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono font-bold rounded-lg">
                            {mach.currentHours} Hours Meter
                          </span>
                          <button onClick={() => handleRemoveMachinery(idx)} className="text-slate-500 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 8: [NEW] HSE Safety Baseline & Petty Cash Imprest */}
              {currentStep === 8 && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Petty Cash Imprest */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Site Petty Cash Opening Imprest</h4>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold">Opening Cash Float Amount (₹) *</label>
                        <input
                          type="number"
                          value={openingCashFloat}
                          onChange={(e) => setOpeningCashFloat(Math.max(0, Number(e.target.value)))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold text-base"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold">Authorized Custodian Name</label>
                        <input
                          type="text"
                          value={cashCustodian}
                          onChange={(e) => setCashCustodian(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                        />
                      </div>
                    </div>

                    {/* HSE Safety Baseline */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">HSE & Emergency Protocol</h4>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold">Lead Site Safety Officer</label>
                        <input
                          type="text"
                          value={safetyOfficer}
                          onChange={(e) => setSafetyOfficer(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 font-bold">Nearest Emergency Hospital Contact</label>
                        <input
                          type="text"
                          value={emergencyHospital}
                          onChange={(e) => setEmergencyHospital(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Safety Induction Topics */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">Mandatory Safety Induction Checkpoints</span>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Add safety checkpoint topic..."
                        value={newPpeTopic}
                        onChange={(e) => setNewPpeTopic(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                      <button onClick={handleAddPpeTopic} className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center space-x-1">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                    <div className="space-y-1 pt-1">
                      {ppeTopics.map((topic, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
                          <span className="text-slate-300">✓ {topic}</span>
                          <button onClick={() => handleRemovePpeTopic(idx)} className="text-slate-500 hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 9: Master Review & Generation */}
              {currentStep === 9 && (
                <div className="space-y-4 max-w-2xl mx-auto pt-1 text-center">
                  <div className="p-6 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl text-left">
                    <h3 className="text-base font-bold text-white text-center">Enterprise Onboarding Master Summary</h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Wings</span>
                        <span className="text-base font-black text-amber-400 font-mono">{wings.join(', ')}</span>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Units</span>
                        <span className="text-base font-black text-emerald-400 font-mono">{totalFlats} Flats</span>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Tasks Matrix</span>
                        <span className="text-base font-black text-purple-400 font-mono">{calculatedTotalTasks.toLocaleString()}</span>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Opening Cash</span>
                        <span className="text-base font-black text-emerald-400 font-mono">₹{Number(openingCashFloat).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-500 block font-bold">STORE BASELINE</span>
                        <span className="text-white font-bold">{materials.length} Material SKUs</span>
                      </div>
                      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-500 block font-bold">PLANT FLEET</span>
                        <span className="text-white font-bold">{machinery.length} Heavy Assets</span>
                      </div>
                      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-[10px] text-slate-500 block font-bold">HSE SAFETY LEAD</span>
                        <span className="text-white font-bold">{safetyOfficer}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed text-center pt-2">
                      Clicking <strong>Initialize Project</strong> will atomically write all <strong>{totalFlats} flats</strong>, <strong>{calculatedTotalTasks.toLocaleString()} micro-tasks</strong>, store SKUs, plant machinery, and opening petty cash float directly to <strong>PostgreSQL</strong>.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1 || isSubmitting}
            onClick={handleBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl flex items-center space-x-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep < 9 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleNext}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleExecuteSetup}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Provisioning Database...' : '🚀 Initialize Project & Generate Matrix'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
