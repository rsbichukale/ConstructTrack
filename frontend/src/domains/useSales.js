'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAppState, subscribeState, calculateFlatProgress } from '../lib/dbState';

export function useSales() {
  const [, setRerender] = useState(0);

  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();

  const handoverReadiness = useMemo(() => {
    const flats = state.flats || [];
    const tasks = state.flatTasks || [];
    const snags = state.snaggingItems || [];

    const taskStats = {};
    tasks.forEach(t => {
      if (!taskStats[t.flatId]) taskStats[t.flatId] = { total: 0, approved: 0 };
      taskStats[t.flatId].total++;
      if (t.status === 'APPROVED') taskStats[t.flatId].approved++;
    });

    const openSnagsMap = {};
    snags.forEach(s => {
      if (s.status === 'OPEN' || s.status === 'REPORTED') {
        openSnagsMap[s.flatId] = (openSnagsMap[s.flatId] || 0) + 1;
      }
    });

    const unitList = flats.map(f => {
      const stats = taskStats[f.id] || { total: 0, approved: 0 };
      const pct = calculateFlatProgress(f.id);
      const openSnags = openSnagsMap[f.id] || 0;
      const isReady = pct === 100 && openSnags === 0;

      return {
        id: f.id,
        wing: f.wing,
        floorNumber: f.floorNumber,
        flatNumber: f.flatNumber,
        flatType: f.flatType,
        totalTasks: stats.total,
        approvedTasks: stats.approved,
        openSnagsCount: openSnags,
        completionPct: pct,
        handoverStatus: isReady ? 'READY_FOR_POSSESSION' : pct >= 80 ? 'NEAR_COMPLETION' : 'IN_PROGRESS'
      };
    });

    const readyUnits = unitList.filter(u => u.handoverStatus === 'READY_FOR_POSSESSION');

    return {
      units: unitList,
      totalUnits: unitList.length,
      readyUnitsCount: readyUnits.length,
      readinessPct: unitList.length > 0 ? Math.round((readyUnits.length / unitList.length) * 100) : 0
    };
  }, [state.flats, state.flatTasks, state.snaggingItems]);

  return {
    handoverReadiness
  };
}
