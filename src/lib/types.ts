export type FlatTaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'INSPECTION_REQUESTED' | 'APPROVED' | 'REWORK';
export type FlatTaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TradeType = 
  | 'BRICK WORK' | 'PLASTER WORK' | 'POP' | 'TILES' | 'PLUMBER' 
  | 'FABRICATION' | 'WATERPROOFING'
  | 'ELECTRICAL' | 'PAINTING' | 'CARPENTRY' | 'FALSE CEILING' 
  | 'DOOR FITTING' | 'SANITARY' | 'CLEANING';
export type SkillLevel = 'MASON' | 'HELPER' | 'LEAD';

export interface ExecutionPhase {
  id: number;
  phaseNumber: number;        // 1, 2, 3... (the execution order)
  phaseName: string;          // "Structural & Partition Brickwork"
  phaseDescription: string;   // "Internal partition walls & door frame lintels"
  tradeType: TradeType;       // Which trade performs this phase
  estimatedDays?: number;     // Estimated days for this phase per flat
  isMandatory: boolean;       // Can this phase be skipped?
  minHoldDaysAfterPrereq?: number; // Curing/drying mandatory wait (e.g. 7 days after plaster)
  canRunParallelWith?: number[];   // Phase IDs that can overlap with this phase
}

export interface DailyWorkTarget {
  id: number;
  dateAssigned: string; // YYYY-MM-DD
  contractorId: number;
  wing: 'B1' | 'B2';
  floorNumber: number;
  tradeType: TradeType;
  targetDescription: string;
  targetQuantitySqft?: number;
  plannedLaborCount: number; // Masons + Helpers committed
  
  // End-of-Day Verification Audit Fields
  status: 'ASSIGNED' | 'ACHIEVED' | 'PARTIAL' | 'MISSED';
  actualCompletionPct?: number;
  actualLaborCount?: number;
  delayReason?: string;
  verifiedBySupervisor?: string;
  verifiedAt?: string;
}

export interface Site {
  id: number;
  name: string;
}

export interface TradeMaster {
  id: number;
  tradeCode: string;
  tradeName: string;
}

export interface WingMaster {
  id: number;
  siteId: number;
  wingCode: 'B1' | 'B2' | string;
  wingName: string;
}

export interface FloorMaster {
  id: number;
  siteId: number;
  wingCode: string;
  floorNumber: number;
  floorLabel: string;
}

export interface Flat {
  id: number;
  siteId: number;
  wing: 'B1' | 'B2';
  floorNumber: number; // 1 to 7
  flatNumber: string; // '101' to '705'
  flatType: string; // '2BHK'
}

export interface RoomZone {
  id: number;
  zoneCode: string; // 'HALL', 'KITCHEN', 'MASTER_BEDROOM', etc.
  zoneLabel: string;
  iconName?: string;
}

export interface TaskCatalogItem {
  id: number;
  tradeType: TradeType;
  taskName: string;
  roomZoneId: number;
  prerequisiteTaskIds?: number[]; // Multi-prerequisite DAG support
  executionPhaseId?: number;     // Which construction phase does this task belong to?
  isBuildingCommon?: boolean;    // Appears across all flats
}

export interface FlatTask {
  id: number;
  flatId: number;
  taskCatalogId: number;
  assignedContractorId?: number;
  status: FlatTaskStatus;
  priority: FlatTaskPriority;
  completionPct: number; // 0 to 100
  unitOfMeasure?: string; // 'SQFT', 'NOS', 'METERS', 'BAGS'
  totalQuantity?: number;
  completedQuantity?: number;
  updatedAt: string;
  blockerReason?: string;
  photoUrl?: string;
  isCustomClientTask?: boolean;
  clientNotes?: string;
}

export interface DailyProgressLog {
  id: number;
  flatTaskId: number;
  loggedByUserId: number;
  dateLogged: string;
  laborCount: number;
  completionDelta: number;
  quantityDelta?: number;
  photoUrl?: string;
  notes?: string;
}

export interface Contractor {
  id: number;
  companyName: string;
  tradeType: TradeType;
  contactPerson: string;
  phone: string;
  ratePerUnit: number; // Unit rate for RA billing calculation
  email?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  wingScope?: 'B1' | 'B2' | 'ALL'; // Wing B1, Wing B2, or Both Wings
}

export interface Laborer {
  id: number;
  contractorId?: number;
  isDepartmentLabor?: boolean; // True for in-house department helpers/workers
  name: string;
  skillLevel: SkillLevel;
  phone?: string;
  idNumber?: string; // Aadhaar / Gov ID
  dailyWageRate?: number;
  photoUrl?: string;
}

export interface ContractorAttendance {
  id: number;
  contractorId: number;
  siteId: number;
  dateLogged: string;
  isPresent: boolean; // Present or Absent
  masonsCount: number;
  helpersCount: number;
  absenceReason?: string; // If Absent: Why (e.g. Festival, Payment, Material Delay, No Work)
  workAssigned?: string;  // Work description done today
  notes?: string;
}

export interface DepartmentLaborAttendance {
  id: number;
  laborerId: number;
  dateLogged: string;
  status: 'PRESENT' | 'HALF_DAY' | 'ABSENT';
  workDescription?: string; // Work done by this department helper
  narration?: string;
}

export type SnaggingStatus = 'OPEN' | 'IN_REPAIR' | 'FIXED' | 'VERIFIED';
export type SnaggingCategory = 'CRACK' | 'LEAK' | 'PAINT_DEFECT' | 'TILE_MISALIGNMENT' | 'ELECTRICAL_FAULT' | 'PLUMBING_FAULT' | 'DOOR_ISSUE' | 'FINISH_DEFECT' | 'OTHER';

export interface SnaggingItem {
  id: number;
  flatId: number;
  roomZoneId: number;
  category: SnaggingCategory;
  description: string;
  photoUrl?: string;
  assignedContractorId?: number;
  status: SnaggingStatus;
  reportedAt: string;
  resolvedAt?: string;
  resolvedPhotoUrl?: string;
  inspectorNotes?: string;
}

export interface AdminUserCredentials {
  id: number;
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  phone: string;
}
