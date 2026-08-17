/**
 * Calculates CPM (Critical Path Method) Network for a given Flat's task set
 */
function calculateCPMNetwork(
  flatId,
  flatTasks,
  taskCatalog,
  baseStartDateInput,
  targetHandoverDateInput
) {
  const currentFlatTasks = (flatTasks || []).filter(t => t.flatId === flatId);
  if (currentFlatTasks.length === 0) {
    return {
      flatId,
      projectDurationDays: 0,
      criticalPathTasks: [],
      allTasks: [],
    };
  }

  // Map task nodes with duration and dependency edges
  const nodes = currentFlatTasks.map(ft => {
    const catalog = taskCatalog.find(c => c.id === ft.taskCatalogId);
    const durationDays = catalog?.mostLikelyDays || 3;
    const prerequisiteIds = catalog?.prerequisiteTaskIds || [];

    return {
      flatTaskId: ft.id,
      taskCatalogId: ft.taskCatalogId,
      taskName: catalog?.taskName || `Task ${ft.id}`,
      tradeType: catalog?.tradeType || 'GENERAL',
      durationDays,
      prerequisiteIds,
      successorIds: [],
      earlyStart: 0,
      earlyFinish: 0,
      lateStart: 0,
      lateFinish: 0,
      totalFloat: 0,
      freeFloat: 0,
      isCriticalPath: false,
    };
  });

  // Build successor links
  nodes.forEach(node => {
    node.prerequisiteIds.forEach(prereqCatalogId => {
      const prereqNode = nodes.find(n => n.taskCatalogId === prereqCatalogId);
      if (prereqNode) {
        prereqNode.successorIds.push(node.taskCatalogId);
      }
    });
  });

  // 1. Forward Pass (ES & EF)
  let changed = true;
  let iterations = 0;
  while (changed && iterations < nodes.length * 2) {
    changed = false;
    iterations++;

    nodes.forEach(node => {
      let maxPrereqEF = 0;
      node.prerequisiteIds.forEach(prereqCatalogId => {
        const prereqNode = nodes.find(n => n.taskCatalogId === prereqCatalogId);
        if (prereqNode) {
          maxPrereqEF = Math.max(maxPrereqEF, prereqNode.earlyFinish);
        }
      });

      const newES = maxPrereqEF;
      const newEF = newES + node.durationDays;

      if (newES !== node.earlyStart || newEF !== node.earlyFinish) {
        node.earlyStart = newES;
        node.earlyFinish = newEF;
        changed = true;
      }
    });
  }

  // Maximum EF defines total project duration
  const projectDurationDays = Math.max(...nodes.map(n => n.earlyFinish), 0);

  // 2. Backward Pass (LF & LS)
  nodes.forEach(node => {
    node.lateFinish = projectDurationDays;
  });

  iterations = 0;
  changed = true;
  while (changed && iterations < nodes.length * 2) {
    changed = false;
    iterations++;

    nodes.forEach(node => {
      if (node.successorIds.length === 0) {
        node.lateFinish = projectDurationDays;
      } else {
        let minSuccessorLS = Infinity;
        node.successorIds.forEach(succCatalogId => {
          const succNode = nodes.find(n => n.taskCatalogId === succCatalogId);
          if (succNode) {
            minSuccessorLS = Math.min(minSuccessorLS, succNode.lateStart);
          }
        });
        if (minSuccessorLS !== Infinity) {
          node.lateFinish = minSuccessorLS;
        }
      }

      const newLS = node.lateFinish - node.durationDays;
      if (newLS !== node.lateStart) {
        node.lateStart = newLS;
        changed = true;
      }
    });
  }

  function formatYYYYMMDD(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseDateInput(input) {
    if (!input) return new Date();
    const parts = input.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(input);
  }

  const baseDate = parseDateInput(baseStartDateInput);

  const addDays = (d, days) => {
    const res = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
    return formatYYYYMMDD(res);
  };

  const todayStr = formatYYYYMMDD(new Date());

  // 3. Float & Critical Path Calculations & Calendar Dates
  nodes.forEach(node => {
    node.totalFloat = Math.max(0, node.lateStart - node.earlyStart);

    if (node.successorIds.length === 0) {
      node.freeFloat = projectDurationDays - node.earlyFinish;
    } else {
      let minSuccES = Infinity;
      node.successorIds.forEach(succCatalogId => {
        const succNode = nodes.find(n => n.taskCatalogId === succCatalogId);
        if (succNode) {
          minSuccES = Math.min(minSuccES, succNode.earlyStart);
        }
      });
      node.freeFloat = minSuccES !== Infinity ? Math.max(0, minSuccES - node.earlyFinish) : 0;
    }

    node.isCriticalPath = node.totalFloat === 0;

    const startDate = addDays(baseDate, node.earlyStart);
    const finishDate = addDays(baseDate, node.earlyFinish);

    node.scheduledStartDate = startDate;
    node.scheduledFinishDate = finishDate;

    const flatTask = currentFlatTasks.find(ft => ft.id === node.flatTaskId);
    const completionPct = flatTask?.completionPct || 0;

    if (completionPct < 100 && todayStr > finishDate) {
      node.scheduleStatus = 'OVERDUE';
    } else if (todayStr >= startDate && todayStr <= finishDate && completionPct < 100) {
      node.scheduleStatus = 'DUE_SOON';
    } else {
      node.scheduleStatus = 'ON_TIME';
    }
  });

  const criticalPathTasks = nodes.filter(n => n.isCriticalPath);
  const projectedHandoverDate = addDays(baseDate, projectDurationDays);

  return {
    flatId,
    projectDurationDays,
    projectedHandoverDate,
    targetHandoverDate: targetHandoverDateInput || projectedHandoverDate,
    criticalPathTasks,
    allTasks: nodes,
  };
}

module.exports = {
  calculateCPMNetwork
};
