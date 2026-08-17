import { api } from './apiClient';

/**
 * Backend API Synchronization Gateway:
 * Routes all data requests and state mutations through the secure Express REST backend.
 */

export async function fetchStateFromBackend() {
  try {
    const res = await api.get('/state');
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  } catch (error) {
    console.error('[API Sync] Failed to fetch state from backend:', error.message);
    return null;
  }
}

export async function flushOfflineQueueToBackend() {
  try {
    const { runSyncEngine } = await import('./syncEngine');
    await runSyncEngine();
    return 1;
  } catch (err) {
    console.warn('[API Sync] Failed to flush offline queue:', err.message);
    return 0;
  }
}

export async function syncTaskToBackend(task) {
  try {
    await api.post(`/tasks/${task.id}/progress`, {
      status: task.status,
      completionPct: task.completionPct,
      blockerReason: task.blockerReason,
      photoUrl: task.photoUrl,
      assignedContractorId: task.assignedContractorId,
      laborCount: 1,
    });
  } catch (err) {
    console.error('[API Sync] Error syncing task to backend:', err.message);
  }
}

export async function syncDailyProgressLogToBackend(log) {
  // Task progress updates automatically generate daily progress logs in backend controller
}

export async function syncContractorAttendanceToBackend(att) {
  try {
    await api.post('/contractors/attendance', {
      contractorId: att.contractorId,
      dateLogged: att.dateLogged,
      isPresent: att.isPresent !== false,
      masonsCount: att.masonsCount || 0,
      helpersCount: att.helpersCount || 0,
      absenceReason: att.absenceReason,
      workAssigned: att.workAssigned,
    });
  } catch (err) {
    console.error('[API Sync] Error syncing attendance to backend:', err.message);
  }
}

export async function syncDailyWorkTargetToBackend(target) {
  try {
    const contractorIdVal = target.contractorId || target.assignedContractorId || 1;
    const dateVal = target.dateAssigned || target.targetDate || new Date().toISOString().split('T')[0];
    const descVal = target.targetDescription || target.workDescription || 'Daily Target Work';

    // BUG-B: Fixed URL: route is /reports/daily-targets, not /reports/targets
    await api.post('/reports/daily-targets', {
      id: target.id,
      wing: target.wing || 'B1',
      floorNumber: target.floorNumber || 1,
      tradeType: target.tradeType || 'GENERAL',
      dateAssigned: dateVal,
      targetDate: dateVal,
      contractorId: contractorIdVal,
      assignedContractorId: contractorIdVal,
      targetDescription: descVal,
      workDescription: descVal,
      targetQuantitySqft: target.targetQuantitySqft || target.sqftTarget || 1000,
      sqftTarget: target.sqftTarget || target.targetQuantitySqft || 1000,
      plannedLaborCount: target.plannedLaborCount || ((target.masonTarget || 0) + (target.helperTarget || 0)) || 6,
      masonTarget: target.masonTarget,
      helperTarget: target.helperTarget,
      supervisorNotes: target.supervisorNotes,
      status: target.status || 'ASSIGNED',
      targetScope: target.targetScope,
      selectedFlatIds: target.selectedFlatIds,
      actualSqftCompleted: target.actualSqftCompleted,
    });
  } catch (err) {
    console.error('[API Sync] Error syncing target to backend:', err.message);
  }
}

export async function verifyDailyWorkTargetInBackend(targetId, target) {
  try {
    await api.patch(`/reports/daily-targets/${targetId}/verify`, {
      status: target.status,
      actualCompletionPct: target.actualCompletionPct,
      actualLaborCount: target.actualLaborCount,
      delayReason: target.delayReason,
      verifiedBySupervisor: target.verifiedBySupervisor || target.supervisorNotes || 'Site Engineer',
      actualSqftCompleted: target.actualSqftCompleted,
      supervisorNotes: target.supervisorNotes,
    });
  } catch (err) {
    console.error('[API Sync] Error verifying target in backend:', err.message);
  }
}

export async function deleteDailyWorkTargetFromBackend(targetId) {
  try {
    await api.delete(`/reports/daily-targets/${targetId}`);
  } catch (err) {
    console.error('[API Sync] Error deleting target from backend:', err.message);
  }
}

export async function syncSnaggingItemToBackend(snag) {
  try {
    await api.post('/snagging', {
      id: snag.id,
      flatId: snag.flatId,
      taskId: snag.taskId,
      roomZoneId: snag.roomZoneId,
      tradeType: snag.tradeType,
      description: snag.description,
      photoUrl: snag.photoUrl,
      priority: snag.priority,
      status: snag.status,
      assignedContractorId: snag.assignedContractorId,
      reportedBy: snag.reportedBy,
      resolvedAt: snag.resolvedAt,
    });
  } catch (err) {
    console.error('[API Sync] Error syncing snag item to backend:', err.message);
  }
}

export async function updateSnaggingStatusInBackend(snagId, statusOrData) {
  try {
    const payload = typeof statusOrData === 'object' && statusOrData !== null
      ? {
          status: statusOrData.status,
          inspectorNotes: statusOrData.inspectorNotes,
          resolvedPhotoUrl: statusOrData.resolvedPhotoUrl,
          resolvedAt: statusOrData.resolvedAt
        }
      : { status: statusOrData };
    await api.patch(`/snagging/${snagId}/status`, payload);
  } catch (err) {
    console.error('[API Sync] Error updating snag status in backend:', err.message);
  }
}

export async function deleteSnaggingItemFromBackend(snagId) {
  try {
    await api.delete(`/snagging/${snagId}`);
  } catch (err) {
    console.error('[API Sync] Error deleting snag item from backend:', err.message);
  }
}

export async function syncDepartmentLaborAttendanceToBackend(att) {
  try {
    // BUG-A: Fixed URL: route is /reports/department-attendance, not /contractors/department-attendance
    await api.post('/reports/department-attendance', {
      id: att.id,
      dateLogged: att.dateLogged,
      tradeType: att.tradeType,
      count: att.count,
      notes: att.notes,
    });
  } catch (err) {
    console.error('[API Sync] Error syncing dept attendance to backend:', err.message);
  }
}

export async function syncTradeToBackend(tradeName) {}

export async function syncTaskCatalogItemToBackend(item) {
  try {
    await api.post('/templates/catalog', {
      id: item.id,
      tradeType: item.tradeType,
      taskName: item.taskName,
      roomZoneId: item.roomZoneId,
      prerequisiteTaskIds: item.prerequisiteTaskIds,
      executionPhaseId: item.executionPhaseId,
      isBuildingCommon: item.isBuildingCommon,
      optimisticDays: item.optimisticDays,
      mostLikelyDays: item.mostLikelyDays,
      pessimisticDays: item.pessimisticDays,
    });
  } catch (err) {
    console.error('[API Sync] Error syncing catalog item to backend:', err.message);
  }
}

export async function deleteTaskCatalogItemFromBackend(id) {
  try {
    await api.delete(`/templates/catalog/${id}`);
  } catch (err) {
    console.error('[API Sync] Error deleting catalog item from backend:', err.message);
  }
}

export async function syncExecutionPhaseToBackend(phase) {
  try {
    await api.post('/templates/phases', {
      id: phase.id,
      phaseNumber: phase.phaseNumber,
      phaseName: phase.phaseName,
      phaseDescription: phase.phaseDescription,
      tradeType: phase.tradeType,
      estimatedDays: phase.estimatedDays,
      minHoldDaysAfterPrereq: phase.minHoldDaysAfterPrereq,
      isMandatory: phase.isMandatory,
      canRunParallelWith: phase.canRunParallelWith,
    });
  } catch (err) {
    console.error('[API Sync] Error syncing phase to backend:', err.message);
  }
}

export async function deleteExecutionPhaseFromBackend(phaseId) {
  try {
    await api.delete(`/templates/phases/${phaseId}`);
  } catch (err) {
    console.error('[API Sync] Error deleting phase from backend:', err.message);
  }
}

export async function syncContractorToBackend(contractor) {
  try {
    await api.post('/contractors', {
      id: contractor.id,
      companyName: contractor.companyName,
      tradeType: contractor.tradeType,
      tradeTypes: contractor.tradeTypes,
      contactPerson: contractor.contactPerson,
      phone: contractor.phone,
      ratePerUnit: contractor.ratePerUnit,
      email: contractor.email,
      status: contractor.status,
      wingScope: contractor.wingScope,
    });
  } catch (err) {
    console.error('[API Sync] Error syncing contractor to backend:', err.message);
  }
}

export async function deleteContractorFromBackend(contractorId) {
  try {
    await api.delete(`/contractors/${contractorId}`);
  } catch (err) {
    console.error('[API Sync] Error deleting contractor from backend:', err.message);
  }
}

export async function syncLaborerToBackend(laborer) {
  try {
    await api.post('/contractors/laborers', {
      id: laborer.id,
      contractorId: laborer.contractorId,
      name: laborer.name,
      skillLevel: laborer.skillLevel,
      phone: laborer.phone,
      idNumber: laborer.idNumber,
      dailyWageRate: laborer.dailyWageRate,
    });
  } catch (err) {
    console.error('[API Sync] Error syncing laborer to backend:', err.message);
  }
}

export async function deleteLaborerFromBackend(laborerId) {
  try {
    await api.delete(`/contractors/laborers/${laborerId}`);
  } catch (err) {
    console.error('[API Sync] Error deleting laborer from backend:', err.message);
  }
}

export async function syncBulkFlatTasksToBackend(tasks) {
  try {
    await api.post('/tasks/bulk', { tasks });
  } catch (err) {
    console.error('[API Sync] Error syncing bulk tasks to backend:', err.message);
  }
}

export async function fetchClientChangesFromBackend(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/client-changes?${query}` : '/client-changes';
    const res = await api.get(endpoint);
    return res.data || [];
  } catch (err) {
    console.error('[API Sync] Error fetching client changes:', err.message);
    return [];
  }
}

export async function createClientChangeInBackend(changeData) {
  try {
    const res = await api.post('/client-changes', changeData);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error creating client change:', err.message);
    throw err;
  }
}

export async function approveTierClientChangeInBackend(id, { tier, approvedBy, remarks, impactDays }) {
  try {
    const res = await api.patch(`/client-changes/${id}/approve-tier`, { tier, approvedBy, remarks, impactDays });
    return res.data;
  } catch (err) {
    console.error(`[API Sync] Error approving tier ${tier} for client change:`, err.message);
    throw err;
  }
}

export async function approveClientChangeInBackend(id, approvedBy) {
  return approveTierClientChangeInBackend(id, { tier: 'engineer', approvedBy });
}

export async function rejectClientChangeInBackend(id, reason, rejectedBy) {
  try {
    const res = await api.patch(`/client-changes/${id}/reject`, { reason, rejectedBy });
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error rejecting client change:', err.message);
    throw err;
  }
}

export async function finalizeSettlementClientChangeInBackend(id, { finalizedBy, proofPhotoUrl, settlementNotes }) {
  try {
    const res = await api.patch(`/client-changes/${id}/finalize-settlement`, { finalizedBy, proofPhotoUrl, settlementNotes });
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error finalizing client change settlement:', err.message);
    throw err;
  }
}

export async function completeClientChangeInBackend(id) {
  return finalizeSettlementClientChangeInBackend(id, { finalizedBy: 'Site Engineer' });
}

export async function fetchUsersFromBackend() {
  try {
    const res = await api.get('/auth/users');
    return res.data || [];
  } catch (err) {
    console.error('[API Sync] Error fetching user list:', err.message);
    return [];
  }
}

export async function fetchRolesFromBackend() {
  try {
    const res = await api.get('/auth/roles');
    return res.data || [];
  } catch (err) {
    console.error('Error fetching roles:', err);
    return [];
  }
}

export async function createUserInBackend(userData) {
  try {
    const res = await api.post('/auth/users', userData);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error provisioning user:', err.message);
    throw err;
  }
}

export async function updateUserInBackend(id, updateData) {
  try {
    const res = await api.patch(`/auth/users/${id}`, updateData);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error updating user:', err.message);
    throw err;
  }
}

export async function deleteUserInBackend(id) {
  try {
    const res = await api.delete(`/auth/users/${id}`);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error deleting user:', err.message);
    throw err;
  }
}

export async function resendInviteInBackend(email) {
  try {
    const res = await api.post('/auth/resend-invite', { email });
    return res;
  } catch (err) {
    console.error('[API Sync] Error resending invite:', err.message);
    throw err;
  }
}

export async function requestPasswordResetInBackend(email) {
  try {
    const res = await api.post('/auth/reset-password', { email });
    return res;
  } catch (err) {
    console.error('[API Sync] Error requesting password reset:', err.message);
    throw err;
  }
}

// ==============================================================================
// SITEOPS ENTERPRISE MODULE API GATEWAY METHODS
// ==============================================================================

export async function fetchMaterialsOverview() {
  try {
    const res = await api.get('/materials');
    return res.data || { inward: [], outward: [], inventory: [], totalStockValue: 0 };
  } catch (err) {
    console.error('[API Sync] Error fetching materials:', err.message);
    return { inward: [], outward: [], inventory: [], totalStockValue: 0 };
  }
}

export async function recordMaterialInward(data) {
  try {
    const res = await api.post('/materials/inward', data);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error recording material inward:', err.message);
    throw err;
  }
}

export async function recordMaterialOutward(data) {
  try {
    const res = await api.post('/materials/outward', data);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error recording material outward:', err.message);
    throw err;
  }
}

export async function fetchPettyCashSummary() {
  try {
    const res = await api.get('/cash');
    return res.data || { entries: [], totalCashIn: 0, totalExpenses: 0, currentBalance: 0 };
  } catch (err) {
    console.error('[API Sync] Error fetching petty cash:', err.message);
    return { entries: [], totalCashIn: 0, totalExpenses: 0, currentBalance: 0 };
  }
}

export async function recordCashEntry(data) {
  try {
    const res = await api.post('/cash/entry', data);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error recording cash entry:', err.message);
    throw err;
  }
}

export async function fetchMachineryLogs() {
  try {
    const res = await api.get('/machinery');
    return res.data || { logs: [], totalOperatingHours: 0, totalDieselLiters: 0, activeMachinesCount: 0 };
  } catch (err) {
    console.error('[API Sync] Error fetching machinery logs:', err.message);
    return { logs: [], totalOperatingHours: 0, totalDieselLiters: 0, activeMachinesCount: 0 };
  }
}

export async function recordMachineryLog(data) {
  try {
    const res = await api.post('/machinery/log', data);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error recording machinery log:', err.message);
    throw err;
  }
}

export async function fetchSafetyLogs() {
  try {
    const res = await api.get('/safety');
    return res.data || { logs: [], toolboxCount: 0, incidentsCount: 0, totalSafetyEvents: 0 };
  } catch (err) {
    console.error('[API Sync] Error fetching safety logs:', err.message);
    return { logs: [], toolboxCount: 0, incidentsCount: 0, totalSafetyEvents: 0 };
  }
}

export async function recordSafetyLog(data) {
  try {
    const res = await api.post('/safety/log', data);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error recording safety log:', err.message);
    throw err;
  }
}

export async function fetchVisitors() {
  try {
    const res = await api.get('/visitors');
    return res.data || { visitors: [], activeInsideCount: 0, totalVisitorsCount: 0 };
  } catch (err) {
    console.error('[API Sync] Error fetching visitors:', err.message);
    return { visitors: [], activeInsideCount: 0, totalVisitorsCount: 0 };
  }
}

export async function recordVisitorEntry(data) {
  try {
    const res = await api.post('/visitors/entry', data);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error recording visitor entry:', err.message);
    throw err;
  }
}

export async function recordVisitorExit(id) {
  try {
    const res = await api.patch(`/visitors/${id}/exit`, {});
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error recording visitor exit:', err.message);
    throw err;
  }
}

export async function fetchConcreteTests() {
  try {
    const res = await api.get('/quality');
    return res.data || { tests: [], passedCount: 0, totalCount: 0, passPercentage: 100 };
  } catch (err) {
    console.error('[API Sync] Error fetching concrete tests:', err.message);
    return { tests: [], passedCount: 0, totalCount: 0, passPercentage: 100 };
  }
}

export async function recordConcreteTest(data) {
  try {
    const res = await api.post('/quality/test', data);
    return res.data;
  } catch (err) {
    console.error('[API Sync] Error recording concrete test:', err.message);
    throw err;
  }
}
