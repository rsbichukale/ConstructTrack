import { supabase, isSupabaseConfigured } from './supabaseClient';
import { AppState } from './dbState';
import { INITIAL_SITES, INITIAL_ROOM_ZONES, INITIAL_CONTRACTORS, INITIAL_LABORERS, INITIAL_TASK_CATALOG, generateInitialFlats, generateInitialFlatTasks } from './seedData';

export async function fetchStateFromSupabase(): Promise<Partial<AppState> | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const [
      sitesRes,
      roomZonesRes,
      taskCatalogRes,
      flatsRes,
      contractorsRes,
      laborersRes,
      flatTasksRes,
      dailyLogsRes,
      contractorAttendanceRes,
      departmentAttendanceRes,
      dailyWorkTargetsRes,
      snaggingItemsRes,
      adminCredsRes,
    ] = await Promise.all([
      supabase.from('sites').select('*'),
      supabase.from('room_zones').select('*'),
      supabase.from('task_catalog').select('*'),
      supabase.from('flats').select('*'),
      supabase.from('contractors').select('*'),
      supabase.from('laborers').select('*'),
      supabase.from('flat_tasks').select('*'),
      supabase.from('daily_progress_logs').select('*').order('date_logged', { ascending: false }),
      supabase.from('contractor_attendance').select('*'),
      supabase.from('department_attendance').select('*'),
      supabase.from('daily_work_targets').select('*'),
      supabase.from('snagging_items').select('*'),
      supabase.from('admin_credentials').select('*').limit(1),
    ]);

    const sites = sitesRes.data;
    const roomZones = roomZonesRes.data;
    const taskCatalog = taskCatalogRes.data;
    const flats = flatsRes.data;
    const contractors = contractorsRes.data;
    const laborers = laborersRes.data;
    const flatTasks = flatTasksRes.data;
    const dailyLogs = dailyLogsRes.data;
    const contractorAttendance = contractorAttendanceRes.data;
    const departmentAttendance = departmentAttendanceRes.data;
    const dailyWorkTargets = dailyWorkTargetsRes.data;
    const snaggingItems = snaggingItemsRes.data;
    const adminCreds = adminCredsRes.data;

    const result: Partial<AppState> = {};

    if (sites && sites.length > 0) {
      result.sites = sites.map(s => ({
        id: s.id,
        name: s.name,
      }));
    }

    if (roomZones && roomZones.length > 0) {
      result.roomZones = roomZones.map(z => ({
        id: z.id,
        zoneCode: z.zone_code,
        zoneLabel: z.zone_label,
        iconName: z.icon_name,
      }));
    }

    if (taskCatalog && taskCatalog.length > 0) {
      result.taskCatalog = taskCatalog.map(tc => ({
        id: tc.id,
        tradeType: tc.trade_type,
        taskName: tc.task_name,
        roomZoneId: tc.room_zone_id,
        prerequisiteTaskIds: tc.prerequisite_task_ids || [],
        executionPhaseId: tc.execution_phase_id,
        isBuildingCommon: tc.is_building_common || false,
      }));
    }

    if (flats && flats.length > 0) {
      result.flats = flats.map(f => ({
        id: f.id,
        siteId: f.site_id,
        wing: f.wing,
        floorNumber: f.floor_number,
        flatNumber: f.flat_number,
        flatType: f.flat_type,
      }));
    }

    if (contractors && contractors.length > 0) {
      result.contractors = contractors.map(c => ({
        id: c.id,
        companyName: c.company_name,
        tradeType: c.trade_type,
        contactPerson: c.contact_person,
        phone: c.phone,
        ratePerUnit: parseFloat(c.rate_per_unit || 0),
        email: c.email,
        status: c.status,
        wingScope: c.wing_scope,
      }));
    }

    if (laborers && laborers.length > 0) {
      result.laborers = laborers.map(l => ({
        id: l.id,
        contractorId: l.contractor_id,
        isDepartmentLabor: l.is_department_labor,
        name: l.name,
        skillLevel: l.skill_level,
        phone: l.phone,
        idNumber: l.id_number,
        dailyWageRate: parseFloat(l.daily_wage_rate || 0),
      }));
    }

    if (flatTasks && flatTasks.length > 0) {
      result.flatTasks = flatTasks.map(t => ({
        id: t.id,
        flatId: t.flat_id,
        taskCatalogId: t.task_catalog_id,
        assignedContractorId: t.assigned_contractor_id,
        status: t.status,
        priority: t.priority,
        completionPct: t.completion_pct,
        unitOfMeasure: t.unit_of_measure,
        totalQuantity: parseFloat(t.total_quantity || 1000),
        completedQuantity: parseFloat(t.completed_quantity || 0),
        updatedAt: t.updated_at,
        blockerReason: t.blocker_reason,
        photoUrl: t.photo_url,
      }));
    }

    if (dailyLogs && dailyLogs.length > 0) {
      result.logs = dailyLogs.map(l => ({
        id: l.id,
        flatTaskId: l.flat_task_id,
        loggedByUserId: l.logged_by_user_id || 1,
        dateLogged: l.date_logged,
        laborCount: l.labor_count || 1,
        completionDelta: l.completion_delta,
        photoUrl: l.photo_url,
        notes: l.notes,
      }));
    }

    if (contractorAttendance && contractorAttendance.length > 0) {
      result.attendance = contractorAttendance.map(a => ({
        id: a.id,
        contractorId: a.contractor_id,
        siteId: a.site_id,
        dateLogged: a.date_logged,
        isPresent: a.is_present,
        masonsCount: a.masons_count,
        helpersCount: a.helpers_count,
        absenceReason: a.absence_reason,
        workAssigned: a.work_assigned,
      }));
    }

    if (departmentAttendance && departmentAttendance.length > 0) {
      result.departmentAttendance = departmentAttendance.map(d => ({
        id: d.id,
        laborerId: d.laborer_id,
        dateLogged: d.date_logged,
        status: d.status,
        workDescription: d.work_description,
        narration: d.narration,
      }));
    }

    if (dailyWorkTargets && dailyWorkTargets.length > 0) {
      result.dailyWorkTargets = dailyWorkTargets.map(t => ({
        id: t.id,
        dateAssigned: t.date_assigned,
        contractorId: t.contractor_id,
        wing: t.wing,
        floorNumber: t.floor_number,
        tradeType: t.trade_type,
        targetDescription: t.target_description,
        targetQuantitySqft: t.target_quantity_sqft,
        plannedLaborCount: t.planned_labor_count,
        status: t.status,
        actualCompletionPct: t.actual_completion_pct,
        actualLaborCount: t.actual_labor_count,
        delayReason: t.delay_reason,
      }));
    }

    if (snaggingItems && snaggingItems.length > 0) {
      result.snaggingItems = snaggingItems.map(s => ({
        id: s.id,
        flatId: s.flat_id,
        roomZoneId: s.room_zone_id,
        category: s.category,
        description: s.description,
        photoUrl: s.photo_url,
        assignedContractorId: s.assigned_contractor_id,
        status: s.status,
        reportedAt: s.reported_at,
        resolvedAt: s.resolved_at,
        resolvedPhotoUrl: s.resolved_photo_url,
      }));
    }

    if (adminCreds && adminCreds.length > 0) {
      const a = adminCreds[0];
      result.adminCredentials = {
        id: a.id,
        username: a.username,
        passwordHash: a.password_hash,
        name: a.name,
        email: a.email,
        phone: a.phone,
      };
    }

    return result;
  } catch (error) {
    console.error('[Supabase Sync] Failed to fetch state from Supabase:', error);
    return null;
  }
}

export async function syncTaskToSupabase(task: any) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('flat_tasks').upsert({
      id: task.id,
      flat_id: task.flatId,
      task_catalog_id: task.taskCatalogId,
      assigned_contractor_id: task.assignedContractorId || null,
      status: task.status || 'NOT_STARTED',
      priority: task.priority || 'MEDIUM',
      completion_pct: task.completionPct || 0,
      blocker_reason: task.blockerReason || null,
      photo_url: task.photoUrl || null,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Supabase Sync] Error syncing flat task:', err);
  }
}

export async function syncDailyProgressLogToSupabase(log: any) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('daily_progress_logs').insert({
      flat_task_id: log.flatTaskId,
      logged_by_user_id: log.loggedByUserId || 1,
      date_logged: log.dateLogged || new Date().toISOString(),
      labor_count: log.laborCount || 1,
      completion_delta: log.completionDelta || 0,
      photo_url: log.photoUrl || null,
      notes: log.notes || null,
    });
  } catch (err) {
    console.error('[Supabase Sync] Error syncing daily progress log:', err);
  }
}

export async function syncContractorAttendanceToSupabase(att: any) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('contractor_attendance').upsert({
      id: att.id,
      contractor_id: att.contractorId,
      site_id: att.siteId || 1,
      date_logged: att.dateLogged,
      is_present: att.isPresent !== false,
      masons_count: att.masonsCount || 0,
      helpers_count: att.helpersCount || 0,
      absence_reason: att.absenceReason,
      work_assigned: att.workAssigned,
    });
  } catch (err) {
    console.error('[Supabase Sync] Error syncing attendance:', err);
  }
}

export async function syncDailyWorkTargetToSupabase(target: any) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('daily_work_targets').upsert({
      id: target.id,
      date_assigned: target.dateAssigned,
      contractor_id: target.contractorId,
      wing: target.wing,
      floor_number: target.floorNumber,
      trade_type: target.tradeType,
      target_description: target.targetDescription,
      target_quantity_sqft: target.targetQuantitySqft || 1000,
      planned_labor_count: target.plannedLaborCount || 6,
      status: target.status || 'ASSIGNED',
      actual_completion_pct: target.actualCompletionPct,
      actual_labor_count: target.actualLaborCount,
      delay_reason: target.delayReason,
    });
  } catch (err) {
    console.error('[Supabase Sync] Error syncing daily work target:', err);
  }
}

export async function syncSnaggingItemToSupabase(snag: any) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('snagging_items').upsert({
      id: snag.id,
      flat_id: snag.flatId,
      room_zone_id: snag.roomZoneId,
      category: snag.category,
      description: snag.description,
      photo_url: snag.photoUrl,
      assigned_contractor_id: snag.assignedContractorId,
      status: snag.status,
      reported_at: snag.reportedAt,
      resolved_at: snag.resolvedAt,
      resolved_photo_url: snag.resolvedPhotoUrl,
    });
  } catch (err) {
    console.error('[Supabase Sync] Error syncing snagging item:', err);
  }
}

/**
 * Migrate & Seed Complete Project Database (Sites, Room Zones, Master Micro-Tasks, Contractors, Flats, Execution Matrix) into Supabase
 */
export async function seedFullProjectDataToSupabase(state: AppState): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, message: 'Supabase credentials missing. Check .env variables.' };
  }

  try {
    console.log('[Supabase Seeder] Starting full database migration to Supabase Cloud...');

    const sitesToSeed = (state.sites && state.sites.length > 0) ? state.sites : INITIAL_SITES;
    const roomZonesToSeed = (state.roomZones && state.roomZones.length > 0) ? state.roomZones : INITIAL_ROOM_ZONES;
    const taskCatalogToSeed = (state.taskCatalog && state.taskCatalog.length > 0) ? state.taskCatalog : INITIAL_TASK_CATALOG;
    const contractorsToSeed = (state.contractors && state.contractors.length > 0) ? state.contractors : INITIAL_CONTRACTORS;
    const laborersToSeed = (state.laborers && state.laborers.length > 0) ? state.laborers : INITIAL_LABORERS;
    const flatsToSeed = (state.flats && state.flats.length > 0) ? state.flats : generateInitialFlats();
    const flatTasksToSeed = (state.flatTasks && state.flatTasks.length > 0) ? state.flatTasks : generateInitialFlatTasks(flatsToSeed);

    // 1. Seed Sites
    await supabase.from('sites').upsert(sitesToSeed.map(s => ({
      id: s.id,
      name: s.name,
    })));

    // 2. Seed Room Zones (11 Zones)
    await supabase.from('room_zones').upsert(roomZonesToSeed.map(z => ({
      id: z.id,
      zone_code: z.zoneCode,
      zone_label: z.zoneLabel,
      icon_name: z.iconName || 'Building',
    })));

    // 3. Seed Master Micro-Task Catalog (87 Tasks)
    await supabase.from('task_catalog').upsert(taskCatalogToSeed.map(tc => ({
      id: tc.id,
      trade_type: tc.tradeType,
      task_name: tc.taskName,
      room_zone_id: tc.roomZoneId,
      prerequisite_task_ids: tc.prerequisiteTaskIds || [],
      execution_phase_id: tc.executionPhaseId || null,
      is_building_common: tc.isBuildingCommon || false,
    })));

    // 4. Seed Contractors
    await supabase.from('contractors').upsert(contractorsToSeed.map(c => ({
      id: c.id,
      company_name: c.companyName,
      trade_type: c.tradeType,
      contact_person: c.contactPerson,
      phone: c.phone,
      rate_per_unit: c.ratePerUnit || 0,
      email: c.email || null,
      status: c.status || 'ACTIVE',
      wing_scope: c.wingScope || 'ALL',
    })));

    // 5. Seed Laborers
    await supabase.from('laborers').upsert(laborersToSeed.map(l => ({
      id: l.id,
      contractor_id: l.contractorId || null,
      is_department_labor: l.isDepartmentLabor || false,
      name: l.name,
      skill_level: l.skillLevel,
      phone: l.phone || null,
      id_number: l.idNumber || null,
      daily_wage_rate: l.dailyWageRate || 0,
    })));

    // 6. Seed Flats (70 Flats)
    await supabase.from('flats').upsert(flatsToSeed.map(f => ({
      id: f.id,
      site_id: f.siteId || 1,
      wing: f.wing,
      floor_number: f.floorNumber,
      flat_number: f.flatNumber,
      flat_type: f.flatType || '2BHK',
    })));

    // 7. Seed Flat Tasks Execution Matrix in 500-item chunks (3,000+ entries)
    const formattedTasks = flatTasksToSeed.map(t => ({
      id: t.id,
      flat_id: t.flatId,
      task_catalog_id: t.taskCatalogId,
      assigned_contractor_id: t.assignedContractorId || null,
      status: t.status || 'NOT_STARTED',
      priority: t.priority || 'MEDIUM',
      completion_pct: t.completionPct || 0,
      blocker_reason: t.blockerReason || null,
      photo_url: t.photoUrl || null,
      updated_at: t.updatedAt || new Date().toISOString(),
    }));

    const chunkSize = 500;
    for (let i = 0; i < formattedTasks.length; i += chunkSize) {
      const chunk = formattedTasks.slice(i, i + chunkSize);
      await supabase.from('flat_tasks').upsert(chunk);
    }

    console.log('[Supabase Seeder] Successfully migrated full project dataset to Supabase!');
    return { success: true, message: `Migrated ${taskCatalogToSeed.length} Micro-Tasks and ${flatTasksToSeed.length} Execution Matrix entries to Supabase!` };
  } catch (error: any) {
    console.error('[Supabase Seeder] Migration Error:', error);
    return { success: false, message: error.message || 'Database Seeding Failed.' };
  }
}
