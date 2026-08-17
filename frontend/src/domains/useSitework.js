'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAppState, subscribeState, updateFlatTaskProgress, calculateFlatProgress, addDailyWorkTarget, verifyDailyWorkTarget } from '../lib/dbState';

export function useSitework(filter = {}) {
  const [, setRerender] = useState(0);

  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();

  const flats = useMemo(() => {
    let list = state.flats || [];
    if (filter.wing) list = list.filter(f => f.wing === filter.wing);
    if (filter.floorNumber) list = list.filter(f => f.floorNumber === filter.floorNumber);
    return list;
  }, [state.flats, filter.wing, filter.floorNumber]);

  const flatTasks = useMemo(() => {
    let list = state.flatTasks || [];
    if (filter.flatId) list = list.filter(t => t.flatId === filter.flatId);
    if (filter.contractorId) list = list.filter(t => t.assignedContractorId === filter.contractorId);
    if (filter.status) list = list.filter(t => t.status === filter.status);
    return list;
  }, [state.flatTasks, filter.flatId, filter.contractorId, filter.status]);

  const roomZones = state.roomZones || [];
  const taskCatalog = state.taskCatalog || [];
  const snaggingItems = state.snaggingItems || [];
  const dailyWorkTargets = state.dailyWorkTargets || [];
  const logs = state.logs || [];

  const approveTask = (taskId, photoUrl, notes, contractorId) => {
    return updateFlatTaskProgress(taskId, 'APPROVED', 100, notes, photoUrl, '', contractorId);
  };

  const markTaskRework = (taskId, reason, photoUrl, notes, contractorId) => {
    return updateFlatTaskProgress(taskId, 'REWORK', 0, notes, photoUrl, reason, contractorId);
  };

  return {
    flats,
    flatTasks,
    roomZones,
    taskCatalog,
    snaggingItems,
    dailyWorkTargets,
    logs,
    getFlatProgress: calculateFlatProgress,
    updateTaskProgress: updateFlatTaskProgress,
    approveTask,
    markTaskRework,
    addTarget: addDailyWorkTarget,
    verifyTarget: verifyDailyWorkTarget
  };
}
