'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAppState, subscribeState } from '../lib/dbState';

export function useAccounting() {
  const [, setRerender] = useState(0);

  useEffect(() => {
    return subscribeState(() => setRerender(n => n + 1));
  }, []);

  const state = getAppState();

  const billingLedger = useMemo(() => {
    const contractors = state.contractors || [];
    const tasks = state.flatTasks || [];

    return contractors.map(c => {
      const contractorTasks = tasks.filter(t => t.assignedContractorId === c.id);
      const totalTasks = contractorTasks.length;
      const approvedTasks = contractorTasks.filter(t => t.status === 'APPROVED');
      const inProgressTasks = contractorTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'INSPECTION_REQUESTED');

      const rate = parseFloat(c.ratePerUnit || 0);
      const totalEstimatedValue = totalTasks * rate;
      const grossApprovedValue = approvedTasks.length * rate;
      const retentionDeduction = grossApprovedValue * 0.05;
      const tdsDeduction = grossApprovedValue * 0.02;
      const netPayable = grossApprovedValue - retentionDeduction - tdsDeduction;

      return {
        contractorId: c.id,
        companyName: c.companyName,
        tradeType: c.tradeType,
        ratePerUnit: rate,
        totalTasks,
        approvedTasksCount: approvedTasks.length,
        inProgressTasksCount: inProgressTasks.length,
        totalEstimatedValue,
        grossApprovedValue,
        retentionDeduction,
        tdsDeduction,
        netPayable
      };
    });
  }, [state.contractors, state.flatTasks]);

  const totalCommittedValue = billingLedger.reduce((sum, b) => sum + b.totalEstimatedValue, 0);
  const totalGrossApproved = billingLedger.reduce((sum, b) => sum + b.grossApprovedValue, 0);
  const totalNetPayable = billingLedger.reduce((sum, b) => sum + b.netPayable, 0);
  const totalRetentionHeld = billingLedger.reduce((sum, b) => sum + b.retentionDeduction, 0);

  return {
    billingLedger,
    totalCommittedValue,
    totalGrossApproved,
    totalNetPayable,
    totalRetentionHeld
  };
}
