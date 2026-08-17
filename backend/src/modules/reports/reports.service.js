/**
 * Reports Service - Encapsulates all calculation, metric aggregation, and business logic
 */

const ReportsRepository = require('./reports.repository');

class ReportsService {
  // 1. DPR Aggregator
  static async getDailyOperationalReport(targetDate, siteId) {
    const raw = await ReportsRepository.getDailyOperationalData(targetDate, siteId);

    const totalMasons = raw.contractorAttendance.reduce((acc, r) => acc + (Number(r.masons_count) || 0), 0);
    const totalHelpers = raw.contractorAttendance.reduce((acc, r) => acc + (Number(r.helpers_count) || 0), 0);
    const totalDeptLabor = raw.deptAttendance.length;
    const totalHeadcount = totalMasons + totalHelpers + totalDeptLabor;

    const presentContractorIds = new Set(raw.contractorAttendance.map(r => Number(r.contractor_id)));
    const contractorPresentCount = presentContractorIds.size;
    const contractorAbsentCount = Math.max(0, raw.contractors.length - contractorPresentCount);

    const targetsAssigned = raw.dailyTargets.length;
    const targetsAchieved = raw.dailyTargets.filter(t => t.status === 'COMPLETED' || t.status === 'VERIFIED').length;
    const achievementPct = targetsAssigned > 0 ? Math.round((targetsAchieved / targetsAssigned) * 100) : 0;

    const inwardCount = raw.materialInward.length;
    const totalInwardValue = raw.materialInward.reduce((acc, r) => acc + (Number(r.total_amount) || 0), 0);
    const outwardCount = raw.materialOutward.length;

    const machineryRunningHours = raw.machineryLogs.reduce((acc, r) => acc + (Number(r.total_hours) || 0), 0);
    const dieselIssuedLitres = raw.machineryLogs.reduce((acc, r) => acc + (Number(r.diesel_issued_litres) || 0), 0);

    const safetyBriefingsCount = raw.safetyBriefings.length;
    const visitorCount = raw.visitorPasses.length;

    return {
      date: targetDate,
      summary: {
        totalHeadcount,
        totalMasons,
        totalHelpers,
        totalDeptLabor,
        contractorPresentCount,
        contractorAbsentCount,
        targetsAssigned,
        targetsAchieved,
        achievementPct,
        inwardCount,
        totalInwardValue,
        outwardCount,
        machineryRunningHours,
        dieselIssuedLitres,
        safetyBriefingsCount,
        incidentCount: 0,
        visitorCount
      },
      data: raw
    };
  }

  // 2. Concrete QA Lab Aggregator
  static async getConcreteQAReport(siteId, wing, grade) {
    const records = await ReportsRepository.getConcreteQAReportData(siteId, wing, grade);
    const totalTests = records.length;
    const passedTests = records.filter(r => r.status === 'PASSED').length;
    const failedTests = records.filter(r => r.status === 'FAILED').length;
    const passRatePct = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

    const sevenDayTests = records.filter(r => Number(r.test_age_days) === 7 && Number(r.actual_strength_mpa) > 0);
    const avgStrength7d = sevenDayTests.length > 0
      ? Number((sevenDayTests.reduce((acc, r) => acc + Number(r.actual_strength_mpa), 0) / sevenDayTests.length).toFixed(1))
      : 0;

    const twentyEightDayTests = records.filter(r => Number(r.test_age_days) === 28 && Number(r.actual_strength_mpa) > 0);
    const avgStrength28d = twentyEightDayTests.length > 0
      ? Number((twentyEightDayTests.reduce((acc, r) => acc + Number(r.actual_strength_mpa), 0) / twentyEightDayTests.length).toFixed(1))
      : 0;

    const avgSlumpMm = totalTests > 0
      ? Number((records.reduce((acc, r) => acc + (Number(r.slump_mm) || 0), 0) / totalTests).toFixed(1))
      : 0;

    return {
      summary: { totalTests, passedTests, failedTests, passRatePct, avgStrength7d, avgStrength28d, avgSlumpMm },
      records
    };
  }

  // 3. Snagging Defect Audit Aggregator
  static async getSnaggingAuditReport(siteId, wing, severity, status) {
    const snags = await ReportsRepository.getSnaggingAuditData(siteId, wing, severity, status);
    const totalSnags = snags.length;
    const openSnags = snags.filter(s => s.status === 'OPEN').length;
    const inProgressSnags = snags.filter(s => s.status === 'IN_PROGRESS').length;
    const resolvedSnags = snags.filter(s => s.status === 'RESOLVED' || s.status === 'CLOSED').length;
    const resolutionPct = totalSnags > 0 ? Math.round((resolvedSnags / totalSnags) * 100) : 100;

    return {
      summary: { totalSnags, openSnags, inProgressSnags, resolvedSnags, resolutionPct },
      snags
    };
  }

  // 4. Material Reconciliation Aggregator
  static async getMaterialReconciliationReport(siteId, startDate, endDate) {
    const raw = await ReportsRepository.getMaterialReconciliationData(siteId, startDate, endDate);
    const totalInventoryItems = raw.inventory.length;
    const totalInventoryValue = raw.inventory.reduce((acc, item) => {
      return acc + ((Number(item.current_stock) || 0) * (Number(item.avg_rate_per_unit) || 0));
    }, 0);

    const lowStockItems = raw.inventory.filter(item => (Number(item.current_stock) || 0) <= (Number(item.min_reorder_level) || 0));

    return {
      summary: {
        totalInventoryItems,
        totalInventoryValue,
        lowStockItemsCount: lowStockItems.length,
        totalInwardRecords: raw.inward.length,
        totalOutwardIssues: raw.outward.length
      },
      lowStockItems,
      inventory: raw.inventory,
      inward: raw.inward,
      outward: raw.outward
    };
  }

  // 5. Contractor Performance Aggregator
  static async getContractorPerformanceReport(siteId, startDate, endDate) {
    const raw = await ReportsRepository.getContractorPerformanceData(siteId, startDate, endDate);
    const contractors = raw.contractors.map(c => {
      const cAtt = raw.attendance.filter(a => Number(a.contractor_id) === Number(c.id));
      const cTargets = raw.targets.filter(t => Number(t.contractor_id) === Number(c.id));
      const totalMasons = cAtt.reduce((acc, a) => acc + (Number(a.masons_count) || 0), 0);
      const totalHelpers = cAtt.reduce((acc, a) => acc + (Number(a.helpers_count) || 0), 0);
      const assigned = cTargets.length;
      const completed = cTargets.filter(t => t.status === 'COMPLETED' || t.status === 'VERIFIED').length;
      const adherencePct = assigned > 0 ? Math.round((completed / assigned) * 100) : 100;

      return {
        ...c,
        totalMasons,
        totalHelpers,
        totalLabor: totalMasons + totalHelpers,
        targetsAssigned: assigned,
        targetsCompleted: completed,
        adherencePct
      };
    });

    return {
      summary: {
        totalContractors: raw.contractors.length,
        activeContractors: raw.contractors.filter(c => c.status === 'ACTIVE').length,
        totalTargetsLogged: raw.targets.length,
        totalAttendanceEntries: raw.attendance.length
      },
      contractors
    };
  }

  // 6. Petty Cash Aggregator
  static async getPettyCashReport(siteId, startDate, endDate) {
    const entries = await ReportsRepository.getPettyCashData(siteId, startDate, endDate);
    const totalCashIn = entries.filter(e => e.entry_type === 'CASH_IN').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalExpense = entries.filter(e => e.entry_type === 'EXPENSE').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const netBalance = totalCashIn - totalExpense;

    return {
      summary: { totalCashIn, totalExpense, netBalance, totalEntries: entries.length },
      entries
    };
  }

  // 7. Client Changes Commercial Margins Aggregator
  static async getClientChangesReport(siteId) {
    const requests = await ReportsRepository.getClientChangesData(siteId);
    const totalQuotedAmount = requests.reduce((acc, r) => acc + (Number(r.quoted_amount) || 0), 0);
    const totalContractorCost = requests.reduce((acc, r) => acc + (Number(r.contractor_cost) || 0), 0);
    const totalDeveloperMargin = totalQuotedAmount - totalContractorCost;
    const marginPct = totalQuotedAmount > 0 ? Math.round((totalDeveloperMargin / totalQuotedAmount) * 100) : 0;

    return {
      summary: {
        totalRequests: requests.length,
        totalQuotedAmount,
        totalContractorCost,
        totalDeveloperMargin,
        marginPct,
        statusBreakdown: []
      },
      requests
    };
  }

  // 8. Tower Execution Matrix Aggregator
  static async getTowerExecutionMatrix(siteId, wing) {
    const flats = await ReportsRepository.getTowerExecutionData(siteId, wing);
    const totalFlats = flats.length;
    const readyFlats = flats.filter(f => Number(f.total_tasks) > 0 && Number(f.completed_tasks) >= Number(f.total_tasks)).length;
    const totalTasksAcrossAll = flats.reduce((acc, f) => acc + Number(f.total_tasks), 0);
    const completedTasksAcrossAll = flats.reduce((acc, f) => acc + Number(f.completed_tasks), 0);
    const overallProgressPct = totalTasksAcrossAll > 0 ? Math.round((completedTasksAcrossAll / totalTasksAcrossAll) * 100) : 0;

    return {
      summary: { totalFlats, readyFlats, overallProgressPct, totalPhases: 10 },
      flats
    };
  }

  // 9. Sitewise Complete Micro-Tasks Master Export (6,832+ Records)
  static async getSitewiseTasksExport(siteId = 1, filters = {}) {
    const tasks = await ReportsRepository.getSitewiseAllTasksData(siteId, filters);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'APPROVED' || t.status === 'VERIFIED' || Number(t.completion_pct) === 100).length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'WORK_STARTED').length;
    const totalEarnedAmount = tasks.reduce((sum, t) => sum + (Number(t.earned_amount) || 0), 0);

    return {
      summary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks: totalTasks - completedTasks - inProgressTasks,
        overallCompletionPct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalEarnedAmount: Math.round(totalEarnedAmount * 100) / 100
      },
      tasks
    };
  }

  // Helper to serialize Sitewise Tasks into standard RFC-4180 CSV
  static generateSitewiseCSV(tasks) {
    const headers = [
      'Task ID',
      'Project Name',
      'Wing',
      'Floor Number',
      'Flat Number',
      'Flat Typology',
      'Room Zone',
      'Phase Name',
      'Micro-Task Name',
      'Trade Type',
      'Assigned Contractor',
      'Contractor Lead Contact',
      'Contractor Phone',
      'Contractor Unit Rate (INR/sq.ft)',
      'Room Length (ft)',
      'Room Width (ft)',
      'Room Height (ft)',
      'Deductions (sq.ft)',
      'BOQ Calculated Quantity',
      'Unit of Measure',
      'Current Execution Status',
      'Completion Percentage (%)',
      'Earned Contractor Value (INR)',
      'Work Started Date',
      'Inspection Requested Date',
      'Milestone Approved Date',
      'Blocker / Snag Remarks',
      'Last Updated Timestamp'
    ];

    const rows = tasks.map(t => [
      t.task_id,
      `"${(t.project_name || 'ConstructTrack Site').replace(/"/g, '""')}"`,
      t.wing,
      t.floor_number,
      t.flat_number,
      t.flat_type,
      `"${(t.room_zone || '').replace(/"/g, '""')}"`,
      `"${(t.phase_name || '').replace(/"/g, '""')}"`,
      `"${(t.task_name || '').replace(/"/g, '""')}"`,
      `"${(t.trade_type || '').replace(/"/g, '""')}"`,
      `"${(t.contractor_name || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(t.contractor_lead || 'N/A').replace(/"/g, '""')}"`,
      `"${(t.contractor_phone || 'N/A').replace(/"/g, '""')}"`,
      t.contractor_rate_sqft,
      t.room_length_ft,
      t.room_width_ft,
      t.room_height_ft,
      t.deduction_sqft,
      t.task_quantity,
      t.unit_of_measure,
      t.status,
      t.completion_pct,
      t.earned_amount,
      t.started_at ? `"${new Date(t.started_at).toISOString().split('T')[0]}"` : '""',
      t.inspection_requested_at ? `"${new Date(t.inspection_requested_at).toISOString().split('T')[0]}"` : '""',
      t.approved_at ? `"${new Date(t.approved_at).toISOString().split('T')[0]}"` : '""',
      `"${(t.blocker_reason || '').replace(/"/g, '""')}"`,
      `"${t.updated_at ? new Date(t.updated_at).toISOString() : ''}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  }
}

module.exports = ReportsService;
