import { Site, Flat, RoomZone, TaskCatalogItem, FlatTask, Contractor, Laborer, DailyProgressLog, ContractorAttendance, DepartmentLaborAttendance, DailyWorkTarget, ExecutionPhase, SnaggingItem, AdminUserCredentials, TradeMaster, WingMaster, FloorMaster, TradeType } from './types';
import { INITIAL_SITES, INITIAL_ROOM_ZONES, INITIAL_CONTRACTORS, INITIAL_LABORERS, INITIAL_TASK_CATALOG, INITIAL_DAILY_TARGETS, INITIAL_EXECUTION_PHASES, generateInitialFlats, generateInitialFlatTasks } from './seedData';
import { saveOfflineLog } from '@/lib/offlineSync';
import { syncTaskToSupabase, syncDailyProgressLogToSupabase, syncDailyWorkTargetToSupabase, syncSnaggingItemToSupabase, fetchStateFromSupabase, seedFullProjectDataToSupabase } from './supabaseSync';

const STORAGE_KEY = 'construct_track_state_v14';

export interface AppState {
  sites: Site[];
  flats: Flat[];
  roomZones: RoomZone[];
  taskCatalog: TaskCatalogItem[];
  executionPhases: ExecutionPhase[];
  contractors: Contractor[];
  laborers: Laborer[];
  flatTasks: FlatTask[];
  logs: DailyProgressLog[];
  attendance: ContractorAttendance[];
  dailyWorkTargets: DailyWorkTarget[];
  pinnedFlatIds: number[];
  snaggingItems: SnaggingItem[];
  departmentAttendance: DepartmentLaborAttendance[];
  adminCredentials: AdminUserCredentials;
  customTrades?: string[];
  trades?: TradeMaster[];
  wings?: WingMaster[];
  floors?: FloorMaster[];
}

let currentState: AppState | null = null;
const listeners: Array<() => void> = [];
let isInitializing = false;

export async function initializeSupabaseState() {
  if (typeof window === 'undefined' || isInitializing) return;
  isInitializing = true;
  try {
    const remoteState = await fetchStateFromSupabase();
    const current = getAppState();

    if (remoteState && (remoteState.taskCatalog?.length || 0) > 0 && (remoteState.flats?.length || 0) > 0) {
      // Remote Supabase has populated tables -> merge into active state
      const merged: AppState = {
        ...current,
        ...remoteState,
        sites: remoteState.sites || current.sites,
        roomZones: remoteState.roomZones || current.roomZones,
        taskCatalog: remoteState.taskCatalog || current.taskCatalog,
        flats: remoteState.flats || current.flats,
        flatTasks: remoteState.flatTasks || current.flatTasks,
      };
      saveAppState(merged);
    } else {
      // Supabase is connected but tables are empty! Seed Supabase PostgreSQL now!
      console.log('[Supabase Init] Remote Supabase tables are empty. Seeding full project dataset to Supabase Cloud...');
      const seedResult = await seedFullProjectDataToSupabase(current);
      console.log('[Supabase Init] Seeding result:', seedResult);

      const reFetched = await fetchStateFromSupabase();
      if (reFetched && Object.keys(reFetched).length > 0) {
        saveAppState({
          ...current,
          ...reFetched,
        });
      }
    }
  } catch (err) {
    console.error('[Supabase Init] Error initializing state from Supabase:', err);
  }
}

export function getAppState(): AppState {
  if (!currentState) {
    currentState = loadInitialState();
  }
  return currentState;
}

function loadInitialState(): AppState {
  const defaultState: AppState = {
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
    adminCredentials: {
      id: 1,
      username: 'admin',
      passwordHash: 'admin',
      name: 'Site Manager & Owner',
      email: 'admin@constructtrack.com',
      phone: '+91 9876543210',
    },
    trades: [],
    wings: [],
    floors: [],
  };

  currentState = defaultState;
  return defaultState;
}

export function saveAppState(state: AppState) {
  currentState = state;
  listeners.forEach(fn => fn());
}

export function subscribeState(listener: () => void) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function resetAppState(): AppState {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  currentState = null;
  return getAppState();
}

export function getDynamicTrades(state?: AppState): TradeType[] {
  const st = state || getAppState();
  const tradeCodesFromDb = (st.trades || []).map(t => t.tradeCode);
  const tradeNamesFromDb = (st.trades || []).map(t => t.tradeName);
  const tradeFromCatalog = (st.taskCatalog || []).map(t => t.tradeType);
  const tradeFromContractors = (st.contractors || []).map(c => c.tradeType);
  const customTrades = st.customTrades || [];

  const unique = Array.from(
    new Set([
      ...tradeCodesFromDb,
      ...tradeNamesFromDb,
      ...tradeFromCatalog,
      ...tradeFromContractors,
      ...customTrades,
    ])
  ).filter(Boolean);

  return unique as TradeType[];
}

// Check Trade Dependency Rules (Multi-prerequisite & Curing Hold Support)
export function checkTradeDependency(flatTaskId: number): { 
  isLocked: boolean; 
  prerequisiteTaskNames?: string[];
  holdWarning?: string;
} {
  const state = getAppState();
  const task = state.flatTasks.find(t => t.id === flatTaskId);
  if (!task) return { isLocked: false };

  const catalogItem = state.taskCatalog.find(c => c.id === task.taskCatalogId);
  if (!catalogItem) return { isLocked: false };

  const prereqIds = catalogItem.prerequisiteTaskIds || [];
  const missingPrereqNames: string[] = [];
  let latestPrereqApprovedDate: Date | null = null;

  for (const prereqId of prereqIds) {
    const prereqCatalog = state.taskCatalog.find(c => c.id === prereqId);
    if (!prereqCatalog) continue;

    const prereqFlatTask = state.flatTasks.find(
      t => t.flatId === task.flatId && t.taskCatalogId === prereqId
    );

    if (!prereqFlatTask || prereqFlatTask.status !== 'APPROVED') {
      missingPrereqNames.push(prereqCatalog.taskName);
    } else if (prereqFlatTask.updatedAt) {
      const approvedAt = new Date(prereqFlatTask.updatedAt);
      if (!latestPrereqApprovedDate || approvedAt > latestPrereqApprovedDate) {
        latestPrereqApprovedDate = approvedAt;
      }
    }
  }

  if (missingPrereqNames.length > 0) {
    return {
      isLocked: true,
      prerequisiteTaskNames: missingPrereqNames,
    };
  }

  // Curing Hold Period Check
  if (catalogItem.executionPhaseId && latestPrereqApprovedDate) {
    const phase = state.executionPhases?.find(p => p.id === catalogItem.executionPhaseId);
    if (phase && phase.minHoldDaysAfterPrereq && phase.minHoldDaysAfterPrereq > 0) {
      const daysSinceApproval = (Date.now() - latestPrereqApprovedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceApproval < phase.minHoldDaysAfterPrereq) {
        const remainingDays = Math.ceil(phase.minHoldDaysAfterPrereq - daysSinceApproval);
        return {
          isLocked: true,
          holdWarning: `Curing / Hold period active: Mandatory ${phase.minHoldDaysAfterPrereq}-day wait. ${remainingDays} day(s) remaining before execution can commence.`,
        };
      }
    }
  }

  return { isLocked: false };
}

// Update Flat Task Progress
export function updateFlatTaskProgress(
  flatTaskId: number,
  status: FlatTask['status'],
  completionPct: number,
  notes?: string,
  photoUrl?: string,
  blockerReason?: string
) {
  const state = getAppState();
  const taskIndex = state.flatTasks.findIndex(t => t.id === flatTaskId);
  if (taskIndex === -1) return;

  const currentTask = state.flatTasks[taskIndex];
  const delta = completionPct - currentTask.completionPct;

  const updatedTask: FlatTask = {
    ...currentTask,
    status,
    completionPct,
    updatedAt: new Date().toISOString(),
    blockerReason: blockerReason || currentTask.blockerReason,
    photoUrl: photoUrl || currentTask.photoUrl,
  };

  const newTasks = [...state.flatTasks];
  newTasks[taskIndex] = updatedTask;

  const newLog: DailyProgressLog = {
    id: Date.now(),
    flatTaskId,
    loggedByUserId: 1, // Default supervisor
    dateLogged: new Date().toISOString().split('T')[0],
    laborCount: 1,
    completionDelta: delta,
    photoUrl,
    notes,
  };

  let snaggingItems = state.snaggingItems || [];

  // Auto snag creation on REWORK or blockerReason
  if ((status === 'REWORK' || blockerReason) && (blockerReason || notes)) {
    const catalogItem = state.taskCatalog.find(c => c.id === currentTask.taskCatalogId);
    const roomZoneId = catalogItem ? catalogItem.roomZoneId : 1;
    const desc = blockerReason || notes || 'Defect logged during inspection';
    
    // Check if open snag already exists for this flat & room
    const exists = snaggingItems.some(s => s.flatId === currentTask.flatId && s.roomZoneId === roomZoneId && s.description === desc && s.status === 'OPEN');
    if (!exists) {
      snaggingItems = [{
        id: Date.now() + Math.floor(Math.random() * 1000),
        flatId: currentTask.flatId,
        roomZoneId,
        category: 'FINISH_DEFECT',
        description: desc,
        assignedContractorId: currentTask.assignedContractorId,
        status: 'OPEN',
        reportedAt: new Date().toISOString(),
        photoUrl,
      }, ...snaggingItems];
    }
  } else if (status === 'APPROVED') {
    // Resolve open snags for this flat & room zone
    const catalogItem = state.taskCatalog.find(c => c.id === currentTask.taskCatalogId);
    if (catalogItem) {
      snaggingItems = snaggingItems.map(s => {
        if (s.flatId === currentTask.flatId && s.roomZoneId === catalogItem.roomZoneId && s.status !== 'VERIFIED') {
          return { ...s, status: 'VERIFIED', resolvedAt: new Date().toISOString() };
        }
        return s;
      });
    }
  }

  const updatedState: AppState = {
    ...state,
    flatTasks: newTasks,
    logs: [newLog, ...state.logs],
    snaggingItems,
  };

  saveAppState(updatedState);

  // Sync to Supabase in real-time if connected
  syncTaskToSupabase(updatedTask);
  syncDailyProgressLogToSupabase(newLog);

  // Queue to IndexedDB for PWA Offline Sync
  saveOfflineLog({
    flatTaskId,
    status,
    completionPct,
    notes,
    photoUrl,
    timestamp: new Date().toISOString(),
  });
}

// Rollup Calculations
export function calculateFlatProgress(flatId: number): number {
  const state = getAppState();
  const tasks = state.flatTasks.filter(t => t.flatId === flatId);
  if (tasks.length === 0) return 0;
  const totalPct = tasks.reduce((sum, t) => sum + t.completionPct, 0);
  return Math.round(totalPct / tasks.length);
}

export function calculateFloorProgress(wing: 'B1' | 'B2', floorNumber: number): number {
  const state = getAppState();
  const floorFlats = state.flats.filter(f => f.wing === wing && f.floorNumber === floorNumber);
  if (floorFlats.length === 0) return 0;
  const sum = floorFlats.reduce((acc, flat) => acc + calculateFlatProgress(flat.id), 0);
  return Math.round(sum / floorFlats.length);
}

export function calculateWingProgress(wing: 'B1' | 'B2'): number {
  const state = getAppState();
  const wingFlats = state.flats.filter(f => f.wing === wing);
  if (wingFlats.length === 0) return 0;
  const sum = wingFlats.reduce((acc, flat) => acc + calculateFlatProgress(flat.id), 0);
  return Math.round(sum / wingFlats.length);
}

export function calculateSiteProgress(siteId: number = 1): number {
  const state = getAppState();
  if (state.flats.length === 0) return 0;
  const sum = state.flats.reduce((acc, flat) => acc + calculateFlatProgress(flat.id), 0);
  return Math.round(sum / state.flats.length);
}

// Execution Phase CRUD Helpers
export function addExecutionPhase(phase: Omit<ExecutionPhase, 'id'>): ExecutionPhase {
  const state = getAppState();
  const newPhase: ExecutionPhase = {
    ...phase,
    id: Date.now(),
  };

  saveAppState({
    ...state,
    executionPhases: [...(state.executionPhases || []), newPhase],
  });

  return newPhase;
}

export function updateExecutionPhase(phaseId: number, updates: Partial<ExecutionPhase>) {
  const state = getAppState();
  const updatedPhases = (state.executionPhases || []).map(p => {
    if (p.id === phaseId) {
      return { ...p, ...updates };
    }
    return p;
  });

  saveAppState({
    ...state,
    executionPhases: updatedPhases,
  });
}

export function reorderExecutionPhases(orderedPhaseIds: number[]) {
  const state = getAppState();
  const phases = state.executionPhases || [];
  const reordered = orderedPhaseIds.map((id, idx) => {
    const phase = phases.find(p => p.id === id);
    if (phase) {
      return { ...phase, phaseNumber: idx + 1 };
    }
    return null;
  }).filter(Boolean) as ExecutionPhase[];

  saveAppState({
    ...state,
    executionPhases: reordered,
  });
}

export function deleteExecutionPhase(phaseId: number) {
  const state = getAppState();
  const filtered = (state.executionPhases || []).filter(p => p.id !== phaseId);
  // Re-number remaining phases
  const renumbered = filtered.map((p, idx) => ({ ...p, phaseNumber: idx + 1 }));

  // Unlink any catalogue tasks that referenced this phase
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
}

export function addDailyWorkTarget(target: Omit<DailyWorkTarget, 'id' | 'status'>): DailyWorkTarget {
  const state = getAppState();
  const newTarget: DailyWorkTarget = {
    ...target,
    id: Date.now(),
    status: 'ASSIGNED',
  };

  saveAppState({
    ...state,
    dailyWorkTargets: [...(state.dailyWorkTargets || []), newTarget],
  });

  syncDailyWorkTargetToSupabase(newTarget);
  return newTarget;
}

export function verifyDailyWorkTarget(
  targetId: number,
  status: DailyWorkTarget['status'],
  actualCompletionPct: number,
  actualLaborCount: number,
  delayReason?: string,
  verifiedBySupervisor: string = 'Site Engineer'
) {
  const state = getAppState();
  let targetToSync: DailyWorkTarget | null = null;

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
    syncDailyWorkTargetToSupabase(targetToSync);
  }
}

// Snagging / Punch-List CRUD Helpers
export function addSnaggingItem(item: Omit<SnaggingItem, 'id' | 'status' | 'reportedAt'>): SnaggingItem {
  const state = getAppState();
  const newItem: SnaggingItem = {
    ...item,
    id: Date.now(),
    status: 'OPEN',
    reportedAt: new Date().toISOString(),
  };

  saveAppState({
    ...state,
    snaggingItems: [newItem, ...(state.snaggingItems || [])],
  });

  syncSnaggingItemToSupabase(newItem);
  return newItem;
}

export function updateSnaggingStatus(
  snagId: number, 
  status: SnaggingItem['status'], 
  notes?: string,
  resolvedPhotoUrl?: string
) {
  const state = getAppState();
  const updated = (state.snaggingItems || []).map(item => {
    if (item.id === snagId) {
      return {
        ...item,
        status,
        inspectorNotes: notes || item.inspectorNotes,
        resolvedPhotoUrl: resolvedPhotoUrl || item.resolvedPhotoUrl,
        resolvedAt: status === 'FIXED' || status === 'VERIFIED' ? new Date().toISOString() : item.resolvedAt,
      };
    }
    return item;
  });

  saveAppState({
    ...state,
    snaggingItems: updated,
  });
}

export function deleteSnaggingItem(snagId: number) {
  const state = getAppState();
  saveAppState({
    ...state,
    snaggingItems: (state.snaggingItems || []).filter(item => item.id !== snagId),
  });
}

// Department Labor Attendance CRUD Helper
export function saveDepartmentLaborAttendance(
  laborerId: number,
  dateLogged: string,
  status: DepartmentLaborAttendance['status'],
  workDescription?: string,
  narration?: string
) {
  const state = getAppState();
  const list = state.departmentAttendance || [];
  const existingIdx = list.findIndex(a => a.laborerId === laborerId && a.dateLogged === dateLogged);

  const newEntry: DepartmentLaborAttendance = {
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
}

// Admin Password & Credentials Manager
export function updateAdminCredentials(newCreds: Partial<AdminUserCredentials>) {
  const state = getAppState();
  const current = state.adminCredentials || {
    id: 1,
    username: 'admin',
    passwordHash: 'admin',
    name: 'Site Manager & Owner',
    email: 'admin@constructtrack.com',
    phone: '+91 9876543210',
  };

  const updated: AdminUserCredentials = {
    ...current,
    ...newCreds,
  };

  saveAppState({
    ...state,
    adminCredentials: updated,
  });

  return updated;
}


