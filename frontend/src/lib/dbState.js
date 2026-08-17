import {
  loadAllLocalState,
  saveFullLocalState,
  upsertLocalRecords,
  deleteLocalRecord,
  enqueueOutboxMutation,
} from './localDb';
import { runSyncEngine, startBackgroundSyncWorker } from './syncEngine';
import {
  syncTaskToBackend,
  syncDailyWorkTargetToBackend,
  verifyDailyWorkTargetInBackend,
  deleteDailyWorkTargetFromBackend,
  syncSnaggingItemToBackend,
  updateSnaggingStatusInBackend,
  deleteSnaggingItemFromBackend,
  syncDepartmentLaborAttendanceToBackend,
  syncTaskCatalogItemToBackend,
  deleteTaskCatalogItemFromBackend,
  syncExecutionPhaseToBackend,
  deleteExecutionPhaseFromBackend,
  syncContractorToBackend,
  deleteContractorFromBackend,
  syncLaborerToBackend,
  deleteLaborerFromBackend,
  syncBulkFlatTasksToBackend,
} from './backendSync';

let currentState = null;
const listeners = [];
let isInitializing = false;

export async function initializeBackendState() {
  if (typeof window === 'undefined' || isInitializing) return;
  isInitializing = true;

  try {
    // 1. INSTANT BOOT (0ms): Load existing state from local IndexedDB
    const localState = await loadAllLocalState();
    if (localState) {
      const current = getAppState();
      const merged = {
        ...current,
        ...localState,
      };
      saveAppState(merged);
      console.log('⚡ [LocalDB] Instant boot loaded from local database.');
    }

    // 2. Start background sync worker (drains outbox & pulls deltas)
    startBackgroundSyncWorker();
    void runSyncEngine();
  } catch (err) {
    console.error('[State Init] Error initializing local state:', err);
  } finally {
    isInitializing = false;
  }
}

export function getAppState() {
  if (!currentState) {
    currentState = loadInitialState();
  }
  return currentState;
}

function loadInitialState() {
  const emptyState = {
    sites: [],
    flats: [],
    roomZones: [],
    taskCatalog: [],
    executionPhases: [],
    contractors: [],
    laborers: [],
    flatTasks: [],
    logs: [],
    attendance: [],
    dailyWorkTargets: [],
    pinnedFlatIds: [],
    snaggingItems: [],
    departmentAttendance: [],
    trades: [],
    wings: [],
    floors: [],
  };

  currentState = emptyState;
  return emptyState;
}

export function saveAppState(state) {
  currentState = state;
  listeners.forEach(fn => fn());
}

export function subscribeState(listener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function resetAppState() {
  currentState = null;
  return getAppState();
}

export function getDynamicTrades(state) {
  const st = state || getAppState();
  const tradeCodesFromDb = (st.trades || []).map(t => t.tradeCode || t.trade_code);
  const tradeNamesFromDb = (st.trades || []).map(t => t.tradeName || t.trade_name);
  const tradeFromCatalog = (st.taskCatalog || []).map(t => t.tradeType || t.trade_type);
  const tradeFromContractors = (st.contractors || []).map(c => c.tradeType || c.trade_type);
  const customTrades = st.customTrades || [];

  const combined = [
    ...tradeCodesFromDb,
    ...tradeNamesFromDb,
    ...tradeFromCatalog,
    ...tradeFromContractors,
    ...customTrades,
  ];

  return Array.from(new Set(combined)).filter(Boolean);
}

export function checkTradeDependency(flatTaskId) {
  return { isLocked: false };
}

export function generateUniqueId(existingIds) {
  const maxExisting = existingIds.length > 0 ? Math.max(0, ...existingIds) : 0;
  const now = Date.now();
  let candidate = Math.max(maxExisting + 1, now);
  while (existingIds.includes(candidate)) {
    candidate++;
  }
  return candidate;
}

export function updateFlatTaskProgress(
  flatTaskId,
  statusOrPct,
  completionPct,
  notes,
  photoUrl,
  blockerReason,
  assignedContractorId,
  laborCount = 1,
  loggedByUserId = 1
) {
  const state = getAppState();
  const taskIndex = (state.flatTasks || []).findIndex(t => String(t.id) === String(flatTaskId));
  if (taskIndex === -1) {
    console.warn('Task does not exist in the persisted project state. Updating task optimistically:', flatTaskId);
    return null;
  }

  const currentTask = state.flatTasks[taskIndex];

  // Resolve status & completionPct flexibly if caller passed (taskId, 100, '', undefined, 'APPROVED') or (taskId, 'APPROVED', 100)
  let status = 'IN_PROGRESS';
  let pct = 0;

  if (typeof statusOrPct === 'number') {
    pct = statusOrPct;
    status = typeof completionPct === 'string' && completionPct ? completionPct : (pct === 100 ? 'APPROVED' : pct > 0 ? 'IN_PROGRESS' : 'PENDING');
  } else if (typeof statusOrPct === 'string') {
    status = statusOrPct;
    pct = typeof completionPct === 'number' ? completionPct : (status === 'APPROVED' || status === 'COMPLETED' ? 100 : 0);
  }

  const delta = pct - (Number(currentTask.completionPct || currentTask.completion_pct) || 0);

  const updatedTask = {
    ...currentTask,
    status,
    completionPct: pct,
    completion_pct: pct,
    updatedAt: new Date().toISOString(),
    assignedContractorId: assignedContractorId !== undefined ? assignedContractorId : (currentTask.assignedContractorId || currentTask.assigned_contractor_id),
    blockerReason: blockerReason === undefined ? currentTask.blockerReason : blockerReason || undefined,
    photoUrl: photoUrl || currentTask.photoUrl,
  };

  const newTasks = [...state.flatTasks];
  newTasks[taskIndex] = updatedTask;

  const existingLogIds = (state.logs || []).map(l => l.id);
  const newLogId = generateUniqueId(existingLogIds);

  const newLog = {
    id: newLogId,
    flatTaskId,
    loggedByUserId,
    dateLogged: new Date().toISOString().split('T')[0],
    laborCount: Math.max(0, laborCount),
    completionDelta: delta,
    photoUrl,
    notes: typeof notes === 'string' ? notes : undefined,
  };

  let snaggingItems = state.snaggingItems || [];

  if ((status === 'REWORK' || blockerReason) && (blockerReason || notes)) {
    const catalogItem = (state.taskCatalog || []).find(c => String(c.id) === String(currentTask.taskCatalogId || currentTask.task_catalog_id));
    const roomZoneId = catalogItem ? (catalogItem.roomZoneId || catalogItem.room_zone_id) : 1;
    const desc = blockerReason || notes || 'Defect logged during inspection';
    
    const exists = snaggingItems.some(s => String(s.flatId || s.flat_id) === String(currentTask.flatId || currentTask.flat_id) && String(s.roomZoneId || s.room_zone_id) === String(roomZoneId) && s.description === desc && s.status === 'OPEN');
    if (!exists) {
      const existingSnagIds = snaggingItems.map(s => s.id);
      const newSnag = {
        id: generateUniqueId(existingSnagIds),
        flatId: currentTask.flatId || currentTask.flat_id,
        roomZoneId,
        category: 'FINISH_DEFECT',
        description: desc,
        assignedContractorId: currentTask.assignedContractorId || currentTask.assigned_contractor_id,
        status: 'OPEN',
        reportedAt: new Date().toISOString(),
        photoUrl,
      };
      snaggingItems = [newSnag, ...snaggingItems];
      void upsertLocalRecords('snagging_items', [newSnag]);
      void enqueueOutboxMutation('SNAGGING_ITEM', newSnag);
    }
  }

  const updatedState = {
    ...state,
    flatTasks: newTasks,
    logs: [newLog, ...(state.logs || [])],
    snaggingItems,
  };

  saveAppState(updatedState);

  // Instant local database write + outbox queue
  void upsertLocalRecords('flat_tasks', [updatedTask]);
  void upsertLocalRecords('logs', [newLog]);
  void enqueueOutboxMutation('TASK_PROGRESS', updatedTask);

  // Background non-blocking sync
  void syncTaskToBackend(updatedTask);

  return updatedTask;
}

export function calculateFlatProgress(flatId) {
  const state = getAppState();
  const tasks = (state.flatTasks || []).filter(t => t.flatId === flatId || t.flat_id === flatId);
  if (tasks.length === 0) return 0;
  const totalPct = tasks.reduce((sum, t) => sum + (Number(t.completionPct || t.completion_pct) || 0), 0);
  return Math.round(totalPct / tasks.length);
}

export function calculateFloorProgress(wing, floorNumber) {
  const state = getAppState();
  const floorFlats = (state.flats || []).filter(f => (f.wing === wing || f.wing_code === wing) && (f.floorNumber === floorNumber || f.floor_number === floorNumber));
  if (floorFlats.length === 0) return 0;
  const sum = floorFlats.reduce((acc, flat) => acc + calculateFlatProgress(flat.id), 0);
  return Math.round(sum / floorFlats.length);
}

export function calculateWingProgress(wing) {
  const state = getAppState();
  const wingFlats = (state.flats || []).filter(f => f.wing === wing || f.wing_code === wing);
  if (wingFlats.length === 0) return 0;
  const sum = wingFlats.reduce((acc, flat) => acc + calculateFlatProgress(flat.id), 0);
  return Math.round(sum / wingFlats.length);
}

export function calculateSiteProgress(siteId = 1) {
  const state = getAppState();
  const siteFlats = (state.flats || []).filter(flat => flat.siteId === siteId || flat.site_id === siteId);
  if (siteFlats.length === 0) return 0;
  const sum = siteFlats.reduce((acc, flat) => acc + calculateFlatProgress(flat.id), 0);
  return Math.round(sum / siteFlats.length);
}

export function addExecutionPhase(phase) {
  const state = getAppState();
  const newPhase = {
    ...phase,
    id: Date.now(),
  };

  saveAppState({
    ...state,
    executionPhases: [...(state.executionPhases || []), newPhase],
  });

  void upsertLocalRecords('execution_phases', [newPhase]);
  void syncExecutionPhaseToBackend(newPhase);
  return newPhase;
}

export function updateExecutionPhase(phaseId, updates) {
  const state = getAppState();
  let updatedPhaseObj = null;

  const updatedPhases = (state.executionPhases || []).map(p => {
    if (p.id === phaseId) {
      updatedPhaseObj = { ...p, ...updates };
      return updatedPhaseObj;
    }
    return p;
  });

  saveAppState({
    ...state,
    executionPhases: updatedPhases,
  });

  if (updatedPhaseObj) {
    void upsertLocalRecords('execution_phases', [updatedPhaseObj]);
    void syncExecutionPhaseToBackend(updatedPhaseObj);
  }
}

export function reorderExecutionPhases(orderedPhaseIds) {
  const state = getAppState();
  const phases = state.executionPhases || [];
  const reordered = orderedPhaseIds.map((id, idx) => {
    const phase = phases.find(p => p.id === id);
    if (phase) {
      return { ...phase, phaseNumber: idx + 1 };
    }
    return null;
  }).filter(Boolean);

  saveAppState({
    ...state,
    executionPhases: reordered,
  });

  void upsertLocalRecords('execution_phases', reordered);
  reordered.forEach(p => void syncExecutionPhaseToBackend(p));
}

export function deleteExecutionPhase(phaseId) {
  const state = getAppState();
  const filtered = (state.executionPhases || []).filter(p => p.id !== phaseId);
  const renumbered = filtered.map((p, idx) => ({ ...p, phaseNumber: idx + 1 }));

  const updatedCatalog = state.taskCatalog.map(t => {
    if (t.executionPhaseId === phaseId) {
      return { ...t, executionPhaseId: undefined };
    }
    return t;
  });

  saveAppState({
    ...state,
    executionPhases: renumbered,
    taskCatalog: updatedCatalog,
  });

  void deleteLocalRecord('execution_phases', phaseId);
  void deleteExecutionPhaseFromBackend(phaseId);
}

export function addDailyWorkTarget(target) {
  const state = getAppState();
  // BUG-09: Use high-entropy ID to reduce collision with backend-generated IDs
  const newTarget = {
    ...target,
    id: Date.now() * 1000 + Math.floor(Math.random() * 999),
    status: 'ASSIGNED',
  };

  saveAppState({
    ...state,
    dailyWorkTargets: [...(state.dailyWorkTargets || []), newTarget],
  });

  void upsertLocalRecords('daily_work_targets', [newTarget]);
  void enqueueOutboxMutation('DAILY_TARGET', newTarget);
  void syncDailyWorkTargetToBackend(newTarget);
  return newTarget;
}

export function verifyDailyWorkTarget(
  targetId,
  status,
  actualCompletionPct,
  actualLaborCount,
  delayReason,
  verifiedBySupervisor = 'Site Engineer'
) {
  const state = getAppState();
  let targetToSync = null;

  const updatedTargets = (state.dailyWorkTargets || []).map(t => {
    if (t.id === targetId) {
      targetToSync = {
        ...t,
        status,
        actualCompletionPct,
        actualLaborCount,
        delayReason,
        verifiedBySupervisor,
        verifiedAt: new Date().toISOString(),
      };
      return targetToSync;
    }
    return t;
  });

  saveAppState({
    ...state,
    dailyWorkTargets: updatedTargets,
  });

  if (targetToSync) {
    void upsertLocalRecords('daily_work_targets', [targetToSync]);
    void verifyDailyWorkTargetInBackend(targetId, targetToSync);
  }
}

export function deleteDailyWorkTarget(targetId) {
  const state = getAppState();
  saveAppState({
    ...state,
    dailyWorkTargets: (state.dailyWorkTargets || []).filter(t => t.id !== targetId),
  });
  void deleteLocalRecord('daily_work_targets', targetId);
  void deleteDailyWorkTargetFromBackend(targetId);
}

export function addSnaggingItem(item) {
  const state = getAppState();
  const newItem = {
    ...item,
    id: Date.now(),
    status: 'OPEN',
    reportedAt: new Date().toISOString(),
  };

  saveAppState({
    ...state,
    snaggingItems: [newItem, ...(state.snaggingItems || [])],
  });

  void upsertLocalRecords('snagging_items', [newItem]);
  void enqueueOutboxMutation('SNAGGING_ITEM', newItem);
  void syncSnaggingItemToBackend(newItem);
  return newItem;
}

export function updateSnaggingStatus(
  snagId, 
  status, 
  notes,
  resolvedPhotoUrl
) {
  const state = getAppState();
  let updatedSnag = null;
  const updated = (state.snaggingItems || []).map(item => {
    if (item.id === snagId) {
      updatedSnag = {
        ...item,
        status,
        inspectorNotes: notes || item.inspectorNotes,
        resolvedPhotoUrl: resolvedPhotoUrl || item.resolvedPhotoUrl,
        resolvedAt: status === 'FIXED' || status === 'VERIFIED' ? new Date().toISOString() : item.resolvedAt,
      };
      return updatedSnag;
    }
    return item;
  });

  saveAppState({
    ...state,
    snaggingItems: updated,
  });

  if (updatedSnag) {
    void upsertLocalRecords('snagging_items', [updatedSnag]);
    void updateSnaggingStatusInBackend(snagId, updatedSnag);
  }
}

export function deleteSnaggingItem(snagId) {
  const state = getAppState();
  saveAppState({
    ...state,
    snaggingItems: (state.snaggingItems || []).filter(item => item.id !== snagId),
  });
  void deleteLocalRecord('snagging_items', snagId);
  void deleteSnaggingItemFromBackend(snagId);
}

export function saveDepartmentLaborAttendance(
  laborerId,
  dateLogged,
  status,
  workDescription,
  narration
) {
  const state = getAppState();
  const list = state.departmentAttendance || [];
  const existingIdx = list.findIndex(a => a.laborerId === laborerId && a.dateLogged === dateLogged);

  const newEntry = {
    id: existingIdx > -1 ? list[existingIdx].id : Date.now() + Math.floor(Math.random() * 1000),
    laborerId,
    dateLogged,
    status,
    workDescription,
    narration,
  };

  let updatedList = [...list];
  if (existingIdx > -1) {
    updatedList[existingIdx] = newEntry;
  } else {
    updatedList = [newEntry, ...updatedList];
  }

  saveAppState({
    ...state,
    departmentAttendance: updatedList,
  });

  void upsertLocalRecords('department_attendance', [newEntry]);
  void syncDepartmentLaborAttendanceToBackend(newEntry);
}

export function addCustomRoomTaskToAllFlats(
  roomZoneId,
  taskName,
  tradeType,
  autoApproveInspectedFlats = true
) {
  const state = getAppState();

  const newCatalogId = Date.now();
  const newCatalogItem = {
    id: newCatalogId,
    tradeType,
    taskName,
    roomZoneId,
    executionPhaseId: 1,
    mostLikelyDays: 2,
  };

  const contractor = state.contractors.find(c => c.tradeType === tradeType) || state.contractors[0];

  let newFlatTaskIdCounter = Date.now() + Math.floor(Math.random() * 10000);
  const newFlatTasks = [];

  state.flats.forEach(flat => {
    const existingZoneCatalogIds = state.taskCatalog
      .filter(c => c.roomZoneId === roomZoneId)
      .map(c => c.id);
    
    const existingZoneTasks = state.flatTasks.filter(
      t => t.flatId === flat.id && existingZoneCatalogIds.includes(t.taskCatalogId)
    );

    const isAlreadyInspectedApproved = 
      existingZoneTasks.length > 0 &&
      existingZoneTasks.every(t => t.status === 'APPROVED');

    const shouldAutoApprove = autoApproveInspectedFlats && isAlreadyInspectedApproved;

    const newTask = {
      id: newFlatTaskIdCounter++,
      flatId: flat.id,
      taskCatalogId: newCatalogId,
      assignedContractorId: contractor ? contractor.id : 1,
      status: shouldAutoApprove ? 'APPROVED' : 'NOT_STARTED',
      priority: 'MEDIUM',
      completionPct: shouldAutoApprove ? 100 : 0,
      updatedAt: new Date().toISOString(),
    };

    newFlatTasks.push(newTask);
  });

  saveAppState({
    ...state,
    taskCatalog: [...state.taskCatalog, newCatalogItem],
    flatTasks: [...state.flatTasks, ...newFlatTasks],
  });

  void upsertLocalRecords('task_catalog', [newCatalogItem]);
  void upsertLocalRecords('flat_tasks', newFlatTasks);
  void syncTaskCatalogItemToBackend(newCatalogItem);
  void syncBulkFlatTasksToBackend(newFlatTasks);

  return newCatalogItem;
}

export function updateTaskCatalogItem(id, updates) {
  const state = getAppState();
  let updatedCatalogItem = null;

  const updatedCatalog = (state.taskCatalog || []).map(item => {
    if (item.id === id) {
      updatedCatalogItem = { ...item, ...updates };
      return updatedCatalogItem;
    }
    return item;
  });

  saveAppState({
    ...state,
    taskCatalog: updatedCatalog,
  });

  if (updatedCatalogItem) {
    void upsertLocalRecords('task_catalog', [updatedCatalogItem]);
    void syncTaskCatalogItemToBackend(updatedCatalogItem);
  }
}

export function deleteTaskCatalogItem(id) {
  const state = getAppState();
  const updatedCatalog = (state.taskCatalog || []).filter(item => item.id !== id);
  const updatedFlatTasks = (state.flatTasks || []).filter(t => t.taskCatalogId !== id);

  saveAppState({
    ...state,
    taskCatalog: updatedCatalog,
    flatTasks: updatedFlatTasks,
  });

  void deleteLocalRecord('task_catalog', id);
  void deleteTaskCatalogItemFromBackend(id);
}
