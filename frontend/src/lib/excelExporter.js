import ExcelJS from 'exceljs';

function addSheet(workbook, name, rows) {
  const worksheet = workbook.addWorksheet(name);
  worksheet.addRows(rows);
  worksheet.views = [{ state: 'frozen', ySplit: 2 }];
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(2).font = { bold: true };
  worksheet.columns.forEach(column => {
    const columnIndex = Math.max(0, (column.number ?? 1) - 1);
    column.width = Math.min(45, Math.max(12, ...rows.map(row => String(row[columnIndex] ?? '').length + 2)));
  });
}

/** Generates and downloads the complete project workbook without parsing uploaded files. */
export async function exportProjectToExcel(state) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ConstructTrack';
  workbook.created = new Date();

  const headerRow1 = ['Micro-Task Name', 'Trade Category', 'Execution Phase'];
  const headerRow2 = ['', '', ''];
  (state.flats || []).forEach(flat => {
    headerRow1.push(`Flat ${flat.wing}-${flat.flatNumber} (${flat.flatType})`);
    headerRow2.push(`Floor ${flat.floorNumber}`);
  });

  const matrixRows = [headerRow1, headerRow2];
  (state.taskCatalog || []).forEach(catalogItem => {
    const roomZone = (state.roomZones || []).find(zone => zone.id === catalogItem.roomZoneId);
    const phase = (state.executionPhases || []).find(item => item.id === catalogItem.executionPhaseId);
    const row = [
      `${catalogItem.taskName} [${roomZone?.zoneLabel || ''}]`,
      catalogItem.tradeType,
      phase ? `Phase ${phase.phaseNumber}` : 'General',
    ];

    (state.flats || []).forEach(flat => {
      const task = (state.flatTasks || []).find(item => item.flatId === flat.id && item.taskCatalogId === catalogItem.id);
      if (!task) {
        row.push('N/A');
        return;
      }
      const contractor = (state.contractors || []).find(item => item.id === task.assignedContractorId);
      const blocker = task.blockerReason ? ` [Blocker: ${task.blockerReason}]` : '';
      row.push(`${task.completionPct}% (${task.status})${blocker} • ${contractor?.companyName || 'Unassigned'}`);
    });
    matrixRows.push(row);
  });
  addSheet(workbook, 'Task Execution Matrix', matrixRows);

  const summaryRows = [[
    'Wing', 'Floor No', 'Flat No', 'Flat Type', 'Total Micro-Tasks', 'Approved Tasks',
    'Pending Tasks', 'Rework Tasks', 'Overall Progress %', 'Flat Handover Status',
  ]];
  (state.flats || []).forEach(flat => {
    const tasks = (state.flatTasks || []).filter(task => task.flatId === flat.id);
    const approved = tasks.filter(task => task.status === 'APPROVED').length;
    const rework = tasks.filter(task => task.status === 'REWORK' || Boolean(task.blockerReason)).length;
    const percent = tasks.length > 0 ? Math.round((approved / tasks.length) * 100) : 0;
    summaryRows.push([
      `Wing ${flat.wing}`, flat.floorNumber, `Flat ${flat.flatNumber}`, flat.flatType, tasks.length,
      approved, tasks.length - approved, rework, percent,
      percent === 100 ? 'Ready for Customer Possession' : percent >= 80 ? 'Near Completion (80%+)' : 'In Construction',
    ]);
  });
  addSheet(workbook, 'Flat Progress Summary', summaryRows);

  const contractorRows = [[
    'Contractor Company', 'Trade Type', 'Contact Person', 'Phone Number', 'Unit Rate (₹/sqft)',
    'Total Assigned Tasks', 'Completed Tasks', 'Pending Tasks', 'Rework Tasks', 'Completion SLA %',
  ]];
  (state.contractors || []).forEach(contractor => {
    const tasks = (state.flatTasks || []).filter(task => task.assignedContractorId === contractor.id);
    const completed = tasks.filter(task => task.status === 'APPROVED').length;
    const rework = tasks.filter(task => task.status === 'REWORK' || Boolean(task.blockerReason)).length;
    contractorRows.push([
      contractor.companyName, contractor.tradeType, contractor.contactPerson, contractor.phone,
      contractor.ratePerUnit, tasks.length, completed, tasks.length - completed, rework,
      tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 100,
    ]);
  });
  addSheet(workbook, 'Contractor Summary', contractorRows);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ConstructTrack_Project_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
