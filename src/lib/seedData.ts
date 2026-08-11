import { Site, RoomZone, TaskCatalogItem, Contractor, Flat, FlatTask, DailyWorkTarget, ExecutionPhase } from './types';

export const INITIAL_SITES: Site[] = [
  { id: 1, name: 'Site 1 (Tower Alpha)' },
  { id: 2, name: 'Site 2 (Tower Beta)' },
];

export const INITIAL_ROOM_ZONES: RoomZone[] = [
  { id: 1, zoneCode: 'HALL', zoneLabel: 'Hall', iconName: 'Sofa' },
  { id: 2, zoneCode: 'MASTER_BEDROOM', zoneLabel: 'Master Bedroom', iconName: 'BedDouble' },
  { id: 3, zoneCode: 'CHILDREN_BEDROOM', zoneLabel: 'Children Bedroom', iconName: 'Bed' },
  { id: 4, zoneCode: 'KITCHEN', zoneLabel: 'Kitchen', iconName: 'Utensils' },
  { id: 5, zoneCode: 'WESTERN_TOILET', zoneLabel: 'Western Toilet (Master)', iconName: 'Bath' },
  { id: 6, zoneCode: 'INDIAN_TOILET', zoneLabel: 'Indian Toilet (Common)', iconName: 'Droplets' },
  { id: 7, zoneCode: 'DRY_BALCONY', zoneLabel: 'Dry Balcony', iconName: 'Wind' },
  { id: 8, zoneCode: 'BALCONY', zoneLabel: 'Balcony', iconName: 'Sun' },
  { id: 9, zoneCode: 'COMMON_AREA', zoneLabel: 'Common Area', iconName: 'Building' },
  { id: 10, zoneCode: 'GUEST_BEDROOM', zoneLabel: 'Guest Bedroom (Bed 3)', iconName: 'BedSingle' },
  { id: 11, zoneCode: 'TOILET_3', zoneLabel: 'Attached Toilet 3 (3BHK)', iconName: 'Bath' },
];

export const INITIAL_CONTRACTORS: Contractor[] = [
  { id: 1, companyName: 'Apex Masonry Works', tradeType: 'BRICK WORK', contactPerson: 'Ramesh Patel', phone: '+91 9876543210', ratePerUnit: 0, email: 'apex@masonry.com', status: 'ACTIVE', wingScope: 'B1' },
  { id: 2, companyName: 'BuildPro Plastering Co.', tradeType: 'PLASTER WORK', contactPerson: 'Suresh Kumar', phone: '+91 9876543211', ratePerUnit: 0, email: 'buildpro@plaster.com', status: 'ACTIVE', wingScope: 'B1' },
  { id: 3, companyName: 'Royal POP Designers', tradeType: 'POP', contactPerson: 'Vijay Sharma', phone: '+91 9876543212', ratePerUnit: 0, email: 'royal@pop.com', status: 'ACTIVE', wingScope: 'ALL' },
  { id: 4, companyName: 'Granite & Tile Masters', tradeType: 'TILES', contactPerson: 'Anil Gupta', phone: '+91 9876543213', ratePerUnit: 0, email: 'granite@tiles.com', status: 'ACTIVE', wingScope: 'ALL' },
  { id: 5, companyName: 'FlowTech Plumbing Solutions', tradeType: 'PLUMBER', contactPerson: 'Prakash Rao', phone: '+91 9876543214', ratePerUnit: 0, email: 'flowtech@plumber.com', status: 'ACTIVE', wingScope: 'B2' },
  { id: 6, companyName: 'StrongHold Fabricators', tradeType: 'FABRICATION', contactPerson: 'Dinesh Joshi', phone: '+91 9876543215', ratePerUnit: 0, email: 'stronghold@fab.com', status: 'ACTIVE', wingScope: 'ALL' },
  { id: 7, companyName: 'ShieldPro Waterproofing', tradeType: 'WATERPROOFING', contactPerson: 'Mahesh Verma', phone: '+91 9876543216', ratePerUnit: 0, email: 'shieldpro@wp.com', status: 'ACTIVE', wingScope: 'B2' },
  // New Trades
  { id: 8, companyName: 'PowerLine Electrical Works', tradeType: 'ELECTRICAL', contactPerson: 'Ashok Electricwala', phone: '+91 9876543217', ratePerUnit: 0, email: 'powerline@elec.com', status: 'ACTIVE', wingScope: 'ALL' },
  { id: 9, companyName: 'ColorKraft Painters', tradeType: 'PAINTING', contactPerson: 'Rakesh Painter', phone: '+91 9876543218', ratePerUnit: 0, email: 'colorkraft@paint.com', status: 'ACTIVE', wingScope: 'ALL' },
  { id: 10, companyName: 'WoodCraft Interiors', tradeType: 'CARPENTRY', contactPerson: 'Mohan Carpenter', phone: '+91 9876543219', ratePerUnit: 0, email: 'woodcraft@carp.com', status: 'ACTIVE', wingScope: 'ALL' },
  { id: 11, companyName: 'CeilPro False Ceiling', tradeType: 'FALSE CEILING', contactPerson: 'Ganesh Ceiling', phone: '+91 9876543220', ratePerUnit: 0, email: 'ceilpro@fc.com', status: 'ACTIVE', wingScope: 'ALL' },
  { id: 12, companyName: 'DoorMaster Fittings', tradeType: 'DOOR FITTING', contactPerson: 'Kamlesh Door', phone: '+91 9876543221', ratePerUnit: 0, email: 'doormaster@fit.com', status: 'ACTIVE', wingScope: 'ALL' },
  { id: 13, companyName: 'SaniFlow CP Fittings', tradeType: 'SANITARY', contactPerson: 'Bharat Sanitary', phone: '+91 9876543222', ratePerUnit: 0, email: 'saniflow@cp.com', status: 'ACTIVE', wingScope: 'ALL' },
  { id: 14, companyName: 'CleanSite Services', tradeType: 'CLEANING', contactPerson: 'Suman Clean', phone: '+91 9876543223', ratePerUnit: 0, email: 'cleansite@srv.com', status: 'ACTIVE', wingScope: 'ALL' },
];

export const INITIAL_LABORERS: any[] = [
  // Contractor Labours
  { id: 1, contractorId: 1, name: 'Ram Singh', skillLevel: 'LEAD', phone: '+91 9811122233', idNumber: 'AD-8849-1029', dailyWageRate: 850 },
  { id: 2, contractorId: 1, name: 'Shyam Yadav', skillLevel: 'MASON', phone: '+91 9811122234', idNumber: 'AD-8849-1030', dailyWageRate: 750 },
  { id: 3, contractorId: 1, name: 'Vikram Kumar', skillLevel: 'HELPER', phone: '+91 9811122235', idNumber: 'AD-8849-1031', dailyWageRate: 500 },
  { id: 4, contractorId: 2, name: 'Manoj Verma', skillLevel: 'MASON', phone: '+91 9822233344', idNumber: 'AD-7738-9920', dailyWageRate: 750 },
  { id: 5, contractorId: 2, name: 'Sanjay Paswan', skillLevel: 'HELPER', phone: '+91 9822233345', idNumber: 'AD-7738-9921', dailyWageRate: 500 },
  { id: 6, contractorId: 4, name: 'Deepak Tilemaster', skillLevel: 'LEAD', phone: '+91 9833344455', idNumber: 'AD-6627-8812', dailyWageRate: 900 },
  { id: 7, contractorId: 5, name: 'Rajesh Plumber', skillLevel: 'MASON', phone: '+91 9844455566', idNumber: 'AD-5516-7703', dailyWageRate: 800 },
  // In-House Department Labours (Developer / Supervisor Helpers)
  { id: 8, isDepartmentLabor: true, name: 'Suresh (Department Helper 1)', skillLevel: 'HELPER', phone: '+91 9899900011', idNumber: 'DEP-101', dailyWageRate: 600 },
  { id: 9, isDepartmentLabor: true, name: 'Ramesh (Department Helper 2)', skillLevel: 'HELPER', phone: '+91 9899900012', idNumber: 'DEP-102', dailyWageRate: 600 },
  { id: 10, isDepartmentLabor: true, name: 'Ganesh (Site Mukadam / Department Lead)', skillLevel: 'LEAD', phone: '+91 9899900013', idNumber: 'DEP-103', dailyWageRate: 900 },
];

// ========== 14-PHASE EXECUTION SEQUENCE (Indian Standard) ==========
export const INITIAL_EXECUTION_PHASES: ExecutionPhase[] = [
  { id: 1,  phaseNumber: 1,  phaseName: 'Structural & Partition Brickwork',          phaseDescription: 'Internal partition walls & door frame lintels',              tradeType: 'BRICK WORK',    estimatedDays: 5, isMandatory: true },
  { id: 2,  phaseNumber: 2,  phaseName: 'Door Frame Installation (Sub-frames)',       phaseDescription: 'Main door, bedroom & toilet door sub-frames',                tradeType: 'DOOR FITTING',  estimatedDays: 2, isMandatory: true },
  { id: 3,  phaseNumber: 3,  phaseName: 'Electrical Concealing (Chasing & Conduit)',  phaseDescription: 'Wall chasing, conduit laying, switch box placement, DB box',  tradeType: 'ELECTRICAL',    estimatedDays: 4, isMandatory: true, canRunParallelWith: [4] },
  { id: 4,  phaseNumber: 4,  phaseName: 'Concealed Plumbing & Sanitary Piping',      phaseDescription: 'Toilet & kitchen water supply & drainage lines',             tradeType: 'PLUMBER',       estimatedDays: 3, isMandatory: true, canRunParallelWith: [3] },
  { id: 5,  phaseNumber: 5,  phaseName: 'Internal Cement Plastering',                phaseDescription: 'Smooth cement mortar coat over brickwork',                   tradeType: 'PLASTER WORK',  estimatedDays: 4, isMandatory: true, minHoldDaysAfterPrereq: 1 },
  { id: 6,  phaseNumber: 6,  phaseName: 'Wet Area Waterproofing (Coba & Coating)',    phaseDescription: 'Toilet brickbat coba & balcony waterproofing layer',         tradeType: 'WATERPROOFING', estimatedDays: 2, isMandatory: true, minHoldDaysAfterPrereq: 2 },
  { id: 7,  phaseNumber: 7,  phaseName: 'POP Wall Punning & Ceiling Gypsum',         phaseDescription: 'Smooth POP finish over plaster for paint-ready walls',       tradeType: 'POP',           estimatedDays: 4, isMandatory: true, minHoldDaysAfterPrereq: 7 },
  { id: 8,  phaseNumber: 8,  phaseName: 'False Ceiling Installation',                phaseDescription: 'Gypsum board false ceiling in hall, bedrooms & toilets',     tradeType: 'FALSE CEILING', estimatedDays: 2, isMandatory: false },
  { id: 9,  phaseNumber: 9,  phaseName: 'Granite Sills & Stone Work',                phaseDescription: 'Window sills, door frames granite, kitchen platform',        tradeType: 'TILES',         estimatedDays: 2, isMandatory: true },
  { id: 10, phaseNumber: 10, phaseName: 'Flooring Tiles & Wall Dado',                phaseDescription: 'Ceramic/Vitrified tiles in hall, kitchen, toilets',          tradeType: 'TILES',         estimatedDays: 5, isMandatory: true },
  { id: 11, phaseNumber: 11, phaseName: 'Painting (Primer, Putty & Final Coat)',      phaseDescription: 'Wall primer, putty, 2-coat emulsion paint on all walls',     tradeType: 'PAINTING',      estimatedDays: 5, isMandatory: true, minHoldDaysAfterPrereq: 1 },
  { id: 12, phaseNumber: 12, phaseName: 'Carpentry & Door Shutters',                 phaseDescription: 'Main door, bedroom doors, kitchen cabinets, wardrobes',      tradeType: 'CARPENTRY',     estimatedDays: 4, isMandatory: true },
  { id: 13, phaseNumber: 13, phaseName: 'Safety Grills & Railings Fabrication',       phaseDescription: 'Window safety grills & balcony railings',                    tradeType: 'FABRICATION',   estimatedDays: 2, isMandatory: true },
  { id: 14, phaseNumber: 14, phaseName: 'Sanitary, CP Fittings, Electricals & Cleaning', phaseDescription: 'Commode, basin, taps, switches, lights, deep clean & handover', tradeType: 'SANITARY', estimatedDays: 3, isMandatory: true },
];

// ========== 87-TASK MASTER CATALOGUE (Indian Standard) ==========
export const INITIAL_TASK_CATALOG: TaskCatalogItem[] = [
  // ── Phase 1: BRICK WORK - RED BRICK & STUB COLUMNS (Drawing 1293/BLDG-B/06) ──
  { id: 1,  tradeType: 'BRICK WORK', taskName: 'Hall Red Brickwork & SC-200x200 Stub Column',       roomZoneId: 1, executionPhaseId: 1 },
  { id: 2,  tradeType: 'BRICK WORK', taskName: 'Master Bedroom Red Brickwork & Stub Column',        roomZoneId: 2, executionPhaseId: 1 },
  { id: 3,  tradeType: 'BRICK WORK', taskName: 'Children Bedroom Red Brickwork & Stub Column',      roomZoneId: 3, executionPhaseId: 1 },
  { id: 4,  tradeType: 'BRICK WORK', taskName: 'Western Toilet Red Brickwork & Sunk Wall',          roomZoneId: 5, executionPhaseId: 1 },
  { id: 5,  tradeType: 'BRICK WORK', taskName: 'Indian Toilet Red Brickwork & Sunk Wall',           roomZoneId: 6, executionPhaseId: 1 },
  { id: 6,  tradeType: 'BRICK WORK', taskName: 'Kitchen Red Brickwork & Stub Column',               roomZoneId: 4, executionPhaseId: 1 },
  { id: 7,  tradeType: 'BRICK WORK', taskName: 'Dry Balcony Red Brickwork',                          roomZoneId: 7, executionPhaseId: 1 },
  { id: 8,  tradeType: 'BRICK WORK', taskName: 'Balcony Red Brickwork & 150mm Sunk Edge',            roomZoneId: 8, executionPhaseId: 1 },
  { id: 9,  tradeType: 'BRICK WORK', taskName: 'Common Area Red Brickwork',                          roomZoneId: 9, executionPhaseId: 1 },

  // ── Phase 2: DOOR FITTING - Sub-frames (4 Tasks) ──
  { id: 52, tradeType: 'DOOR FITTING', taskName: 'Main Door Frame',              roomZoneId: 1, prerequisiteTaskIds: [1],  executionPhaseId: 2 },
  { id: 53, tradeType: 'DOOR FITTING', taskName: 'Bedroom Door Frames',          roomZoneId: 2, prerequisiteTaskIds: [2],  executionPhaseId: 2 },
  { id: 54, tradeType: 'DOOR FITTING', taskName: 'Toilet Door Frames',           roomZoneId: 5, prerequisiteTaskIds: [4],  executionPhaseId: 2 },
  { id: 55, tradeType: 'DOOR FITTING', taskName: 'Kitchen Door Frame',           roomZoneId: 4, prerequisiteTaskIds: [6],  executionPhaseId: 2 },

  // ── Phase 3: ELECTRICAL - Concealing (7 Tasks) ──
  { id: 56, tradeType: 'ELECTRICAL', taskName: 'Hall Concealing & Wiring',        roomZoneId: 1, prerequisiteTaskIds: [1],  executionPhaseId: 3 },
  { id: 57, tradeType: 'ELECTRICAL', taskName: 'Master Bedroom Concealing',       roomZoneId: 2, prerequisiteTaskIds: [2],  executionPhaseId: 3 },
  { id: 58, tradeType: 'ELECTRICAL', taskName: 'Children Bedroom Concealing',     roomZoneId: 3, prerequisiteTaskIds: [3],  executionPhaseId: 3 },
  { id: 59, tradeType: 'ELECTRICAL', taskName: 'Kitchen Concealing',              roomZoneId: 4, prerequisiteTaskIds: [6],  executionPhaseId: 3 },
  { id: 60, tradeType: 'ELECTRICAL', taskName: 'Western Toilet Concealing',       roomZoneId: 5, prerequisiteTaskIds: [4],  executionPhaseId: 3 },
  { id: 61, tradeType: 'ELECTRICAL', taskName: 'Indian Toilet Concealing',        roomZoneId: 6, prerequisiteTaskIds: [5],  executionPhaseId: 3 },
  { id: 62, tradeType: 'ELECTRICAL', taskName: 'DB Box & MCB Panel',              roomZoneId: 9, prerequisiteTaskIds: [9],  executionPhaseId: 3 },

  // ── Phase 4: PLUMBER - Concealed Piping & Beam Sleeves (Sec 3-3 Leave Sleeve) ──
  { id: 44, tradeType: 'PLUMBER', taskName: 'Western Toilet Piping & Beam Sleeves', roomZoneId: 5, prerequisiteTaskIds: [4],  executionPhaseId: 4 },
  { id: 45, tradeType: 'PLUMBER', taskName: 'Kitchen Sink Piping & Drain Sleeves',   roomZoneId: 4, prerequisiteTaskIds: [6],  executionPhaseId: 4 },
  { id: 46, tradeType: 'PLUMBER', taskName: 'Indian Toilet Piping & Sleeves',       roomZoneId: 6, prerequisiteTaskIds: [5],  executionPhaseId: 4 },
  { id: 47, tradeType: 'PLUMBER', taskName: 'Balcony Piping',                       roomZoneId: 8, prerequisiteTaskIds: [8],  executionPhaseId: 4 },

  // ── Phase 5: PLASTER WORK (9 Tasks) — Prereq: Brickwork + Electrical concealing ──
  { id: 10, tradeType: 'PLASTER WORK', taskName: 'Hall Internal Cement Plaster',          roomZoneId: 1, prerequisiteTaskIds: [1, 56],  executionPhaseId: 5 },
  { id: 11, tradeType: 'PLASTER WORK', taskName: 'Master Bedroom Internal Plaster',       roomZoneId: 2, prerequisiteTaskIds: [2, 57],  executionPhaseId: 5 },
  { id: 12, tradeType: 'PLASTER WORK', taskName: 'Children Bedroom Plaster',              roomZoneId: 3, prerequisiteTaskIds: [3, 58],  executionPhaseId: 5 },
  { id: 13, tradeType: 'PLASTER WORK', taskName: 'Western Toilet Plaster',                roomZoneId: 5, prerequisiteTaskIds: [4, 60, 44], executionPhaseId: 5 },
  { id: 14, tradeType: 'PLASTER WORK', taskName: 'Indian Toilet Plaster',                 roomZoneId: 6, prerequisiteTaskIds: [5, 61, 46], executionPhaseId: 5 },
  { id: 15, tradeType: 'PLASTER WORK', taskName: 'Kitchen Plaster',                       roomZoneId: 4, prerequisiteTaskIds: [6, 59, 45], executionPhaseId: 5 },
  { id: 16, tradeType: 'PLASTER WORK', taskName: 'Dry Balcony Plaster',                   roomZoneId: 7, prerequisiteTaskIds: [7],  executionPhaseId: 5 },
  { id: 17, tradeType: 'PLASTER WORK', taskName: 'Balcony Plaster',                       roomZoneId: 8, prerequisiteTaskIds: [8, 47], executionPhaseId: 5 },
  { id: 18, tradeType: 'PLASTER WORK', taskName: 'Common Area Plaster',                   roomZoneId: 9, prerequisiteTaskIds: [9, 62], executionPhaseId: 5 },

  // ── Phase 6: WATERPROOFING - 200mm TOILET SUNK & 150mm BALCONY SUNK (Drawing Legends) ──
  { id: 50, tradeType: 'WATERPROOFING', taskName: '200mm Toilet Sunk Brickbat Coba & Coating', roomZoneId: 5, prerequisiteTaskIds: [13], executionPhaseId: 6 },
  { id: 51, tradeType: 'WATERPROOFING', taskName: '150mm Balcony Sunk Waterproof Coba & Slope',roomZoneId: 8, prerequisiteTaskIds: [17], executionPhaseId: 6 },
  { id: 104, tradeType: 'WATERPROOFING', taskName: '48-Hour Toilet Sunk Water Ponding Test',   roomZoneId: 5, prerequisiteTaskIds: [50], executionPhaseId: 6 },

  // ── Phase 7: POP WORK (9 Tasks) — Prereq: Plaster (7 day curing hold) ──
  { id: 19, tradeType: 'POP', taskName: 'Hall POP',              roomZoneId: 1, prerequisiteTaskIds: [10], executionPhaseId: 7 },
  { id: 20, tradeType: 'POP', taskName: 'Master Bedroom POP',    roomZoneId: 2, prerequisiteTaskIds: [11], executionPhaseId: 7 },
  { id: 21, tradeType: 'POP', taskName: 'Children Bedroom POP',  roomZoneId: 3, prerequisiteTaskIds: [12], executionPhaseId: 7 },
  { id: 22, tradeType: 'POP', taskName: 'Western Toilet POP',    roomZoneId: 5, prerequisiteTaskIds: [13], executionPhaseId: 7 },
  { id: 23, tradeType: 'POP', taskName: 'Indian Toilet POP',     roomZoneId: 6, prerequisiteTaskIds: [14], executionPhaseId: 7 },
  { id: 24, tradeType: 'POP', taskName: 'Kitchen POP',           roomZoneId: 4, prerequisiteTaskIds: [15], executionPhaseId: 7 },
  { id: 25, tradeType: 'POP', taskName: 'Dry Balcony POP',       roomZoneId: 7, prerequisiteTaskIds: [16], executionPhaseId: 7 },
  { id: 26, tradeType: 'POP', taskName: 'Balcony POP',           roomZoneId: 8, prerequisiteTaskIds: [17], executionPhaseId: 7 },
  { id: 27, tradeType: 'POP', taskName: 'Common Area POP',       roomZoneId: 9, prerequisiteTaskIds: [18], executionPhaseId: 7 },

  // ── Phase 8: FALSE CEILING (3 Tasks) — Prereq: POP ──
  { id: 63, tradeType: 'FALSE CEILING', taskName: 'Hall False Ceiling',            roomZoneId: 1, prerequisiteTaskIds: [19], executionPhaseId: 8 },
  { id: 64, tradeType: 'FALSE CEILING', taskName: 'Master Bedroom False Ceiling',  roomZoneId: 2, prerequisiteTaskIds: [20], executionPhaseId: 8 },
  { id: 65, tradeType: 'FALSE CEILING', taskName: 'Toilet False Ceiling',          roomZoneId: 5, prerequisiteTaskIds: [22], executionPhaseId: 8 },

  // ── Phase 9: TILES - Granite Sills & Stone (8 Tasks) ──
  { id: 28, tradeType: 'TILES', taskName: 'Master Bedroom Window Granite',  roomZoneId: 2, prerequisiteTaskIds: [20], executionPhaseId: 9 },
  { id: 29, tradeType: 'TILES', taskName: 'Children Bedroom Window Granite', roomZoneId: 3, prerequisiteTaskIds: [21], executionPhaseId: 9 },
  { id: 30, tradeType: 'TILES', taskName: 'Kitchen Door Granite',           roomZoneId: 4, prerequisiteTaskIds: [24], executionPhaseId: 9 },
  { id: 31, tradeType: 'TILES', taskName: 'Kitchen Window Granite',         roomZoneId: 4, prerequisiteTaskIds: [24], executionPhaseId: 9 },
  { id: 32, tradeType: 'TILES', taskName: 'Master Toilet Door Granite',     roomZoneId: 5, prerequisiteTaskIds: [22], executionPhaseId: 9 },
  { id: 33, tradeType: 'TILES', taskName: 'Common Toilet Door Granite',     roomZoneId: 6, prerequisiteTaskIds: [23], executionPhaseId: 9 },
  { id: 34, tradeType: 'TILES', taskName: 'Kitchen Bottom Granite',         roomZoneId: 4, prerequisiteTaskIds: [24], executionPhaseId: 9 },
  { id: 35, tradeType: 'TILES', taskName: 'Kitchen Top Granite',            roomZoneId: 4, prerequisiteTaskIds: [24], executionPhaseId: 9 },

  // ── Phase 10: TILES - Flooring & Wall Dado (8 Tasks) ──
  { id: 36, tradeType: 'TILES', taskName: 'Hall Flooring Tiles',                roomZoneId: 1, prerequisiteTaskIds: [19],     executionPhaseId: 10 },
  { id: 37, tradeType: 'TILES', taskName: 'Kitchen Flooring Tiles',             roomZoneId: 4, prerequisiteTaskIds: [45, 24], executionPhaseId: 10 },
  { id: 38, tradeType: 'TILES', taskName: 'Balcony Tiles',                      roomZoneId: 8, prerequisiteTaskIds: [51],     executionPhaseId: 10 },
  { id: 39, tradeType: 'TILES', taskName: 'Dry Balcony Tiles',                  roomZoneId: 7, prerequisiteTaskIds: [25],     executionPhaseId: 10 },
  { id: 40, tradeType: 'TILES', taskName: 'Master Bedroom Flooring Tiles',      roomZoneId: 2, prerequisiteTaskIds: [20],     executionPhaseId: 10 },
  { id: 41, tradeType: 'TILES', taskName: 'Children Bedroom Flooring Tiles',    roomZoneId: 3, prerequisiteTaskIds: [21],     executionPhaseId: 10 },
  { id: 42, tradeType: 'TILES', taskName: 'Master Toilet Tiles (Wall + Floor)', roomZoneId: 5, prerequisiteTaskIds: [50, 44], executionPhaseId: 10 },
  { id: 43, tradeType: 'TILES', taskName: 'Common Toilet Tiles (Wall + Floor)', roomZoneId: 6, prerequisiteTaskIds: [50, 46], executionPhaseId: 10 },

  // ── Phase 11: PAINTING (8 Tasks) — Prereq: POP + False Ceiling ──
  { id: 66, tradeType: 'PAINTING', taskName: 'Hall Primer, Putty & Paint',           roomZoneId: 1, prerequisiteTaskIds: [19, 63], executionPhaseId: 11 },
  { id: 67, tradeType: 'PAINTING', taskName: 'Master Bedroom Paint',                 roomZoneId: 2, prerequisiteTaskIds: [20, 64], executionPhaseId: 11 },
  { id: 68, tradeType: 'PAINTING', taskName: 'Children Bedroom Paint',               roomZoneId: 3, prerequisiteTaskIds: [21],     executionPhaseId: 11 },
  { id: 69, tradeType: 'PAINTING', taskName: 'Kitchen Paint',                        roomZoneId: 4, prerequisiteTaskIds: [24],     executionPhaseId: 11 },
  { id: 70, tradeType: 'PAINTING', taskName: 'Western Toilet Ceiling Paint',         roomZoneId: 5, prerequisiteTaskIds: [65],     executionPhaseId: 11 },
  { id: 71, tradeType: 'PAINTING', taskName: 'Indian Toilet Ceiling Paint',          roomZoneId: 6, prerequisiteTaskIds: [23],     executionPhaseId: 11 },
  { id: 72, tradeType: 'PAINTING', taskName: 'Balcony & Dry Balcony Paint',          roomZoneId: 8, prerequisiteTaskIds: [26],     executionPhaseId: 11 },
  { id: 73, tradeType: 'PAINTING', taskName: 'Common Area Paint',                    roomZoneId: 9, prerequisiteTaskIds: [27],     executionPhaseId: 11 },

  // ── Phase 12: CARPENTRY (5 Tasks) — After Flooring, before final paint touch-up ──
  { id: 74, tradeType: 'CARPENTRY', taskName: 'Main Door Shutter & Hardware',     roomZoneId: 1, prerequisiteTaskIds: [52, 36], executionPhaseId: 12 },
  { id: 75, tradeType: 'CARPENTRY', taskName: 'Bedroom Door Shutters & Locks',    roomZoneId: 2, prerequisiteTaskIds: [53, 40], executionPhaseId: 12 },
  { id: 76, tradeType: 'CARPENTRY', taskName: 'Toilet Door Shutters',             roomZoneId: 5, prerequisiteTaskIds: [54, 42], executionPhaseId: 12 },
  { id: 77, tradeType: 'CARPENTRY', taskName: 'Kitchen Cabinets (Modular)',        roomZoneId: 4, prerequisiteTaskIds: [37, 69], executionPhaseId: 12 },
  { id: 78, tradeType: 'CARPENTRY', taskName: 'Bedroom Wardrobes',                roomZoneId: 2, prerequisiteTaskIds: [40, 67], executionPhaseId: 12 },

  // ── Phase 13: FABRICATION (6 Tasks - Window Grills & Safety Gates) ──
  { id: 48, tradeType: 'FABRICATION', taskName: 'Hall Window Safety Grill',           roomZoneId: 1, prerequisiteTaskIds: [66], executionPhaseId: 13 },
  { id: 49, tradeType: 'FABRICATION', taskName: 'Balcony Railings',                   roomZoneId: 8, prerequisiteTaskIds: [72], executionPhaseId: 13 },
  { id: 95, tradeType: 'FABRICATION', taskName: 'Master Bedroom Window Safety Grill',  roomZoneId: 2, prerequisiteTaskIds: [67], executionPhaseId: 13 },
  { id: 96, tradeType: 'FABRICATION', taskName: 'Children Bedroom Window Safety Grill', roomZoneId: 3, prerequisiteTaskIds: [68], executionPhaseId: 13 },
  { id: 97, tradeType: 'FABRICATION', taskName: 'Kitchen Window Safety Grill',        roomZoneId: 4, prerequisiteTaskIds: [69], executionPhaseId: 13 },
  { id: 98, tradeType: 'FABRICATION', taskName: 'Main Door Safety MS Grill Gate',    roomZoneId: 1, prerequisiteTaskIds: [74], executionPhaseId: 13 },

  // ── Phase 6 & 9: WINDOW CHAJJA, ALUMINUM / UPVC WINDOW FRAMES (7 Tasks) ──
  { id: 88, tradeType: 'WATERPROOFING', taskName: 'Window Chajja Waterproofing & Plaster', roomZoneId: 1, prerequisiteTaskIds: [10], executionPhaseId: 6 },
  { id: 89, tradeType: 'WATERPROOFING', taskName: 'Master Bed Chajja Waterproofing',     roomZoneId: 2, prerequisiteTaskIds: [11], executionPhaseId: 6 },
  { id: 90, tradeType: 'WATERPROOFING', taskName: 'Kitchen Chajja Waterproofing',        roomZoneId: 4, prerequisiteTaskIds: [15], executionPhaseId: 6 },
  { id: 91, tradeType: 'FABRICATION',   taskName: 'Hall Aluminum/UPVC Window Sliding Frame', roomZoneId: 1, prerequisiteTaskIds: [28], executionPhaseId: 9 },
  { id: 92, tradeType: 'FABRICATION',   taskName: 'Master Bed Aluminum Window Frame',     roomZoneId: 2, prerequisiteTaskIds: [28], executionPhaseId: 9 },
  { id: 93, tradeType: 'FABRICATION',   taskName: 'Children Bed Aluminum Window Frame',   roomZoneId: 3, prerequisiteTaskIds: [29], executionPhaseId: 9 },
  { id: 94, tradeType: 'FABRICATION',   taskName: 'Kitchen Aluminum Window Frame',        roomZoneId: 4, prerequisiteTaskIds: [31], executionPhaseId: 9 },

  // ── Phase 14: SANITARY + ELECTRICAL FIXTURES + UTILITIES + CLEANING (13 Tasks) ──
  { id: 79, tradeType: 'SANITARY',    taskName: 'Western Toilet Commode',        roomZoneId: 5, prerequisiteTaskIds: [42, 70], executionPhaseId: 14 },
  { id: 80, tradeType: 'SANITARY',    taskName: 'Indian Toilet Pan',             roomZoneId: 6, prerequisiteTaskIds: [43, 71], executionPhaseId: 14 },
  { id: 81, tradeType: 'SANITARY',    taskName: 'Basin & Mirror (Master)',       roomZoneId: 5, prerequisiteTaskIds: [42, 70], executionPhaseId: 14 },
  { id: 82, tradeType: 'SANITARY',    taskName: 'CP Fittings (Taps/Mixer/Shower)', roomZoneId: 5, prerequisiteTaskIds: [42], executionPhaseId: 14 },
  { id: 83, tradeType: 'SANITARY',    taskName: 'Kitchen Sink Fitting',          roomZoneId: 4, prerequisiteTaskIds: [77],     executionPhaseId: 14 },
  { id: 84, tradeType: 'ELECTRICAL',  taskName: 'Switch & Socket Fitting',       roomZoneId: 1, prerequisiteTaskIds: [66],     executionPhaseId: 14 },
  { id: 85, tradeType: 'ELECTRICAL',  taskName: 'Light Fixture & Fan Fitting',   roomZoneId: 1, prerequisiteTaskIds: [66],     executionPhaseId: 14 },
  { id: 99, tradeType: 'ELECTRICAL',  taskName: 'Kitchen Exhaust Fan & Louver Hole', roomZoneId: 4, prerequisiteTaskIds: [69], executionPhaseId: 14 },
  { id: 100, tradeType: 'ELECTRICAL', taskName: 'AC Copper Piping & Outdoor Bracket', roomZoneId: 2, prerequisiteTaskIds: [67], executionPhaseId: 14 },
  { id: 101, tradeType: 'PLUMBER',    taskName: 'Plumbing Shaft & Duct Cover Panel',  roomZoneId: 9, prerequisiteTaskIds: [47], executionPhaseId: 14 },
  // ── 3BHK SPECIFIC ROOM ZONE TASKS (Guest Bed 3 & Toilet 3 - RoomZones 10 & 11) ──
  { id: 105, tradeType: 'BRICK WORK',   taskName: 'Guest Bed 3 Red Brickwork & Stub Column',  roomZoneId: 10, executionPhaseId: 1 },
  { id: 106, tradeType: 'BRICK WORK',   taskName: 'Toilet 3 Red Brickwork & Sunk Wall',       roomZoneId: 11, executionPhaseId: 1 },
  { id: 107, tradeType: 'DOOR FITTING', taskName: 'Guest Bed 3 Door Frame',                   roomZoneId: 10, prerequisiteTaskIds: [105], executionPhaseId: 2 },
  { id: 108, tradeType: 'DOOR FITTING', taskName: 'Toilet 3 Door Frame',                      roomZoneId: 11, prerequisiteTaskIds: [106], executionPhaseId: 2 },
  { id: 109, tradeType: 'ELECTRICAL',  taskName: 'Guest Bed 3 Concealing & Wiring',          roomZoneId: 10, prerequisiteTaskIds: [105], executionPhaseId: 3 },
  { id: 110, tradeType: 'ELECTRICAL',  taskName: 'Toilet 3 Concealing',                       roomZoneId: 11, prerequisiteTaskIds: [106], executionPhaseId: 3 },
  { id: 111, tradeType: 'PLUMBER',     taskName: 'Toilet 3 Concealed Piping & Beam Sleeve',   roomZoneId: 11, prerequisiteTaskIds: [106], executionPhaseId: 4 },
  { id: 112, tradeType: 'PLASTER WORK',taskName: 'Guest Bed 3 Cement Plaster',                roomZoneId: 10, prerequisiteTaskIds: [105, 109], executionPhaseId: 5 },
  { id: 113, tradeType: 'PLASTER WORK',taskName: 'Toilet 3 Cement Plaster',                  roomZoneId: 11, prerequisiteTaskIds: [106, 110, 111], executionPhaseId: 5 },
  { id: 114, tradeType: 'WATERPROOFING',taskName: 'Toilet 3 Sunk Brickbat Coba & Coating',    roomZoneId: 11, prerequisiteTaskIds: [113], executionPhaseId: 6 },
  { id: 115, tradeType: 'POP',          taskName: 'Guest Bed 3 POP Punning',                  roomZoneId: 10, prerequisiteTaskIds: [112], executionPhaseId: 7 },
  { id: 116, tradeType: 'POP',          taskName: 'Toilet 3 POP',                             roomZoneId: 11, prerequisiteTaskIds: [113], executionPhaseId: 7 },
  { id: 117, tradeType: 'TILES',        taskName: 'Guest Bed 3 Window Granite Sill',          roomZoneId: 10, prerequisiteTaskIds: [115], executionPhaseId: 9 },
  { id: 118, tradeType: 'TILES',        taskName: 'Toilet 3 Door Granite Frame',              roomZoneId: 11, prerequisiteTaskIds: [116], executionPhaseId: 9 },
  { id: 119, tradeType: 'TILES',        taskName: 'Guest Bed 3 Flooring Tiles',               roomZoneId: 10, prerequisiteTaskIds: [115], executionPhaseId: 10 },
  { id: 120, tradeType: 'TILES',        taskName: 'Toilet 3 Tiles (Wall Dado & Flooring)',    roomZoneId: 11, prerequisiteTaskIds: [114, 111], executionPhaseId: 10 },
  { id: 121, tradeType: 'PAINTING',     taskName: 'Guest Bed 3 Primer, Putty & Paint',        roomZoneId: 10, prerequisiteTaskIds: [115], executionPhaseId: 11 },
  { id: 122, tradeType: 'PAINTING',     taskName: 'Toilet 3 Ceiling Paint',                   roomZoneId: 11, prerequisiteTaskIds: [116], executionPhaseId: 11 },
  { id: 123, tradeType: 'CARPENTRY',    taskName: 'Guest Bed 3 Door Shutter & Lock',          roomZoneId: 10, prerequisiteTaskIds: [107, 119], executionPhaseId: 12 },
  { id: 124, tradeType: 'CARPENTRY',    taskName: 'Toilet 3 Door Shutter',                    roomZoneId: 11, prerequisiteTaskIds: [108, 120], executionPhaseId: 12 },
  { id: 125, tradeType: 'FABRICATION',  taskName: 'Guest Bed 3 Window Safety Grill',          roomZoneId: 10, prerequisiteTaskIds: [121], executionPhaseId: 13 },
  { id: 126, tradeType: 'FABRICATION',  taskName: 'Guest Bed 3 Aluminum Window Frame',        roomZoneId: 10, prerequisiteTaskIds: [117], executionPhaseId: 9 },
  { id: 127, tradeType: 'SANITARY',     taskName: 'Toilet 3 Commode & CP Fittings',           roomZoneId: 11, prerequisiteTaskIds: [120, 122], executionPhaseId: 14 },
];

export function generateInitialFlats(): Flat[] {
  const flats: Flat[] = [];
  let idCounter = 1;
  const wings: ('B1' | 'B2')[] = ['B1', 'B2'];

  wings.forEach(wing => {
    for (let floor = 1; floor <= 7; floor++) {
      for (let flatNum = 1; flatNum <= 5; flatNum++) {
        const flatNumber = `${floor}0${flatNum}`;
        // Flats x01 & x02 are 3BHK; Flats x03, x04, x05 are 2BHK
        const flatType = flatNum <= 2 ? '3BHK' : '2BHK';
        flats.push({
          id: idCounter++,
          siteId: 1,
          wing,
          floorNumber: floor,
          flatNumber,
          flatType,
        });
      }
    }
  });

  return flats;
}

export function generateInitialFlatTasks(flats: Flat[]): FlatTask[] {
  const flatTasks: FlatTask[] = [];
  let taskIdCounter = 1;

  flats.forEach(flat => {
    const is3BHK = flat.flatType === '3BHK';

    INITIAL_TASK_CATALOG.forEach(taskCat => {
      // 3BHK room zones (10: Guest Bed 3, 11: Toilet 3) only apply to 3BHK flats
      if (!is3BHK && (taskCat.roomZoneId === 10 || taskCat.roomZoneId === 11)) {
        return; // Skip 3BHK-only tasks for 2BHK units
      }

      const contractor = INITIAL_CONTRACTORS.find(c => c.tradeType === taskCat.tradeType);

      flatTasks.push({
        id: taskIdCounter++,
        flatId: flat.id,
        taskCatalogId: taskCat.id,
        assignedContractorId: contractor ? contractor.id : 1,
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        completionPct: 0,
        updatedAt: new Date().toISOString(),
      });
    });
  });

  return flatTasks;
}

export const INITIAL_DAILY_TARGETS: DailyWorkTarget[] = [
  {
    id: 1,
    dateAssigned: new Date().toISOString().split('T')[0],
    contractorId: 1,
    wing: 'B1',
    floorNumber: 1,
    tradeType: 'BRICK WORK',
    targetDescription: 'Complete 9 Brickwork Micro-Tasks across Flat 101 and Flat 102',
    targetQuantitySqft: 1250,
    plannedLaborCount: 6,
    status: 'ASSIGNED',
  },
  {
    id: 2,
    dateAssigned: new Date().toISOString().split('T')[0],
    contractorId: 2,
    wing: 'B1',
    floorNumber: 1,
    tradeType: 'PLASTER WORK',
    targetDescription: 'Complete Hall & Bedroom Plastering in Flat 103',
    targetQuantitySqft: 800,
    plannedLaborCount: 4,
    status: 'ASSIGNED',
  },
];

