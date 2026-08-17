'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAppState, subscribeState, getDynamicTrades } from '../lib/dbState';

export function useWorkforce() {
  const [, setRerender] = useState(0);

  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();

  const contractors = state.contractors || [];
  const laborers = state.laborers || [];
  const attendance = state.attendance || [];
  const departmentAttendance = state.departmentAttendance || [];
  const trades = getDynamicTrades(state);

  const contractorStats = useMemo(() => {
    const tasks = state.flatTasks || [];
    return contractors.map(c => {
      const contractorTasks = tasks.filter(t => t.assignedContractorId === c.id);
      const total = contractorTasks.length;
      const completed = contractorTasks.filter(t => t.status === 'APPROVED').length;
      const rework = contractorTasks.filter(t => t.status === 'REWORK').length;
      const sla = total > 0 ? Math.round((completed / total) * 100) : 100;

      return {
        ...c,
        totalTasks: total,
        completedTasks: completed,
        reworkTasks: rework,
        slaPercentage: sla
      };
    });
  }, [contractors, state.flatTasks]);

  return {
    contractors: contractorStats,
    laborers,
    attendance,
    departmentAttendance,
    trades
  };
}
