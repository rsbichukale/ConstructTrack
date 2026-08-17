'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { getAppState, subscribeState, updateFlatTaskProgress, checkTradeDependency } from '../../lib/dbState';
import { calculateCPMNetwork } from '../../lib/cpmEngine';
import { RoomTaskCard } from './RoomTaskCard';
import { RoomHeaderBar } from './roomInspector/RoomHeaderBar';
import { AddCustomTaskModal } from './roomInspector/AddCustomTaskModal';
import { TaskInspectionModal } from './roomInspector/TaskInspectionModal';

export function getTaskPhaseNumber(catalogItem) {
  if (!catalogItem) return 999;
  if (catalogItem.executionPhaseId && catalogItem.executionPhaseId > 0) {
    return catalogItem.executionPhaseId;
  }
  const trade = catalogItem.tradeType;
  const name = (catalogItem.taskName || '').toUpperCase();

  if (trade === 'BRICK WORK') return 1;
  if (trade === 'DOOR FITTING') return 2;
  if (trade === 'ELECTRICAL') return 3;
  if (trade === 'PLUMBER') return 4;
  if (trade === 'PLASTER WORK') return 5;
  if (trade === 'WATERPROOFING') return 6;
  if (trade === 'POP') return 7;
  if (trade === 'FALSE CEILING') return 8;
  if (trade === 'TILES') {
    if (name.includes('GRANITE') || name.includes('SILL') || name.includes('FRAME')) return 9;
    return 10;
  }
  if (trade === 'PAINTING') return 11;
  if (trade === 'CARPENTRY') return 12;
  if (trade === 'FABRICATION') return 13;
  if (trade === 'SANITARY') return 14;

  return 15;
}

export const RoomInspector = ({
  flat,
  roomZone,
  onSelectFlat,
  onCompleteReport,
  onBackToZones,
}) => {
  // BUG-02: Subscribe to state so task cards re-render after saving a report
  const [, setRerender] = useState(0);
  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();

  const loadedCatalog = state.taskCatalog || [];
  let catalogItems = loadedCatalog.filter(c => c.roomZoneId === roomZone.id);

  catalogItems.sort((a, b) => {
    const phaseA = getTaskPhaseNumber(a);
    const phaseB = getTaskPhaseNumber(b);
    if (phaseA !== phaseB) return phaseA - phaseB;
    return a.id - b.id;
  });

  const catalogIds = catalogItems.map(c => c.id);

  const existingFlatTasks = (state.flatTasks || []).filter(
    t => t.flatId === flat.id && catalogIds.includes(t.taskCatalogId)
  );

  const tasks = catalogItems.map(cItem => {
    const found = existingFlatTasks.find(t => t.taskCatalogId === cItem.id);
    if (found) return found;

    const matchedContractor = (state.contractors || []).find(c => c.tradeType === cItem.tradeType);

    return {
      id: flat.id * 1000 + cItem.id,
      flatId: flat.id,
      taskCatalogId: cItem.id,
      assignedContractorId: matchedContractor?.id || 1,
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      completionPct: 0,
      unitOfMeasure: 'SQFT',
      totalQuantity: 1000,
      completedQuantity: 0,
      updatedAt: new Date().toISOString(),
    };
  });

  const [taskFilter, setTaskFilter] = useState('ALL');
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(null);

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState('NOT_STARTED');
  const [completionPct, setCompletionPct] = useState(0);
  const [laborCount, setLaborCount] = useState(2);
  const [assignedContractorId, setAssignedContractorId] = useState(undefined);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [blockerReason, setBlockerReason] = useState('');

  const fileInputRef = useRef(null);

  const handleOpenTaskModal = (task) => {
    setSelectedTaskId(task.id);
    setStatus(task.status);
    setCompletionPct(task.completionPct);
    setPhotoUrl(task.photoUrl || '');
    setBlockerReason(task.blockerReason || '');
    setAssignedContractorId(task.assignedContractorId);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleQuickStatusUpdate = (taskId, newStatus, newPct) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      updateFlatTaskProgress(
        taskId,
        newStatus,
        newPct,
        undefined,
        task.photoUrl,
        task.blockerReason,
        task.assignedContractorId,
        laborCount
      );
    } catch (error) {
      setSubmittedMessage(error instanceof Error ? error.message : 'Unable to update this task.');
      return;
    }

    const catalogItem = (state.taskCatalog || []).find(c => c.id === task.taskCatalogId);
    setSubmittedMessage(`Updated "${catalogItem?.taskName}" to ${newStatus.replace('_', ' ')} (${newPct}%)`);
    setTimeout(() => setSubmittedMessage(null), 3000);
  };

  const handleSaveReport = () => {
    if (!selectedTaskId) return;

    try {
      updateFlatTaskProgress(
        selectedTaskId,
        status,
        completionPct,
        notes,
        photoUrl,
        status === 'REWORK' ? blockerReason : '',
        assignedContractorId,
        laborCount
      );
    } catch (error) {
      setSubmittedMessage(error instanceof Error ? error.message : 'Unable to save this report.');
      return;
    }

    const activeTask = tasks.find(t => t.id === selectedTaskId);
    const activeCatalogItem = (state.taskCatalog || []).find(c => c.id === activeTask?.taskCatalogId);

    setSubmittedMessage(`Report saved for "${activeCatalogItem?.taskName}" in Flat ${flat.wing}-${flat.flatNumber}!`);
    setTimeout(() => setSubmittedMessage(null), 3000);

    setIsModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const maxBytes = 2 * 1024 * 1024;
    if (!allowedTypes.has(file.type)) {
      setSubmittedMessage('Only JPEG, PNG, and WebP evidence images are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > maxBytes) {
      setSubmittedMessage('Evidence images must be 2 MB or smaller.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'ASSIGNED') return !!task.assignedContractorId;
    return true;
  });

  filteredTasks.sort((taskA, taskB) => {
    const catalogA = loadedCatalog.find(c => c.id === taskA.taskCatalogId);
    const catalogB = loadedCatalog.find(c => c.id === taskB.taskCatalogId);
    const phaseA = getTaskPhaseNumber(catalogA);
    const phaseB = getTaskPhaseNumber(catalogB);
    if (phaseA !== phaseB) return phaseA - phaseB;
    return taskA.id - taskB.id;
  });

  const activeTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null;
  const activeCatalogItem = activeTask ? (state.taskCatalog || []).find(c => c.id === activeTask.taskCatalogId) || null : null;
  const cpmNetwork = calculateCPMNetwork(flat.id, state.flatTasks, state.taskCatalog);

  return (
    <div className="space-y-6 pb-12">
      {submittedMessage && (
        <div className="bg-emerald-950/95 border border-emerald-500 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{submittedMessage}</span>
        </div>
      )}

      <RoomHeaderBar
        flat={flat}
        roomZone={roomZone}
        tasks={tasks}
        filteredTasks={filteredTasks}
        taskFilter={taskFilter}
        onSetTaskFilter={setTaskFilter}
        onOpenAddCustomModal={() => setIsAddCustomModalOpen(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <button
          onClick={() => setIsAddCustomModalOpen(true)}
          className="p-5 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 rounded-2xl text-left transition flex flex-col justify-between group space-y-4"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Custom Scope</span>
              <h3 className="font-extrabold text-white text-sm">Add New Micro-Task</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Need an extra task in {roomZone.zoneLabel}? Add it here to cascade across all 70 flats.
          </p>
          <div className="text-xs font-black text-emerald-400 flex items-center space-x-1">
            <span>+ Add Task to {roomZone.zoneLabel}</span>
          </div>
        </button>

        {filteredTasks.map((task) => {
          const catalogItem = (state.taskCatalog || []).find(c => c.id === task.taskCatalogId);
          if (!catalogItem) return null;

          let assignedContractor = (state.contractors || []).find(c => c.id === task.assignedContractorId);
          if (!assignedContractor) {
            const matches = (state.contractors || []).filter(
              c => c.tradeType === catalogItem.tradeType &&
                   (c.wingScope === flat.wing || c.wingScope === 'ALL' || !c.wingScope) &&
                   c.status !== 'SUSPENDED'
            );
            if (matches.length > 0) assignedContractor = matches[0];
          }

          const dep = checkTradeDependency(task.id);
          const isCritical = (cpmNetwork.criticalPathTasks || []).some(c => c.taskCatalogId === catalogItem.id);

          return (
            <RoomTaskCard
              key={task.id}
              task={task}
              catalogItem={catalogItem}
              assignedContractor={assignedContractor}
              isCritical={isCritical}
              isLocked={dep.isLocked}
              lockWarning={dep.holdWarning}
              onClick={() => handleOpenTaskModal(task)}
              onQuickStatusChange={(newStatus, newPct) => {
                handleQuickStatusUpdate(task.id, newStatus, newPct);
              }}
            />
          );
        })}
      </div>

      <TaskInspectionModal
        isOpen={isModalOpen}
        flat={flat}
        roomZone={roomZone}
        activeTask={activeTask}
        activeCatalogItem={activeCatalogItem}
        status={status}
        completionPct={completionPct}
        laborCount={laborCount}
        assignedContractorId={assignedContractorId}
        notes={notes}
        photoUrl={photoUrl}
        blockerReason={blockerReason}
        fileInputRef={fileInputRef}
        onClose={handleCloseModal}
        onStatusChange={setStatus}
        onCompletionPctChange={setCompletionPct}
        onLaborCountChange={setLaborCount}
        onAssignedContractorIdChange={setAssignedContractorId}
        onNotesChange={setNotes}
        onPhotoUrlChange={setPhotoUrl}
        onBlockerReasonChange={setBlockerReason}
        onFileUpload={handleFileUpload}
        onSaveReport={handleSaveReport}
      />

      <AddCustomTaskModal
        roomZone={roomZone}
        isOpen={isAddCustomModalOpen}
        onClose={() => setIsAddCustomModalOpen(false)}
        onSuccess={(msg) => {
          setSubmittedMessage(msg);
          setTimeout(() => setSubmittedMessage(null), 4000);
        }}
      />
    </div>
  );
};
