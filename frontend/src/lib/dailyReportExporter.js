import ExcelJS from 'exceljs';

/**
 * Builds clean, structured WhatsApp summary text for the daily operational field report
 */
export function buildDailyWhatsAppSummary({
  date,
  siteName = 'Main Construction Site',
  weather = 'Sunny & Clear',
  shift = 'Day Shift',
  summary = {},
  contractorAtt = [],
  deptAtt = [],
  targets = [],
  materialInward = [],
  machinery = [],
  safety = [],
  narration = ''
}) {
  const {
    totalHeadcount = 0,
    totalMasons = 0,
    totalHelpers = 0,
    totalDeptLabor = 0,
    targetsAssigned = 0,
    targetsAchieved = 0,
    achievementPct = 0,
    totalInwardValue = 0,
    machineryRunningHours = 0,
    dieselIssuedLitres = 0,
    incidentCount = 0
  } = summary;

  let text = `*🏗️ ${siteName.toUpperCase()} — DAILY OPERATIONAL FIELD REPORT*\n`;
  text += `*📅 Date:* ${date} | *Shift:* ${shift} | *Weather:* ${weather}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // 1. Manpower
  text += `*👷 1. TOTAL MANPOWER DEPLOYED: ${totalHeadcount} Workers*\n`;
  text += `   • Masons: ${totalMasons} | Helpers: ${totalHelpers}\n`;
  text += `   • Department Helpers: ${totalDeptLabor}\n`;

  const activeContractors = contractorAtt.filter(c => c.isPresent);
  const absentContractors = contractorAtt.filter(c => !c.isPresent);

  if (activeContractors.length > 0) {
    text += `   • *Contractors on Site:*\n`;
    activeContractors.forEach(c => {
      text += `     - ${c.companyName} (${c.tradeType}): ${c.totalWorkers} workers (${c.masonsCount}M, ${c.helpersCount}H)\n`;
    });
  }

  if (absentContractors.length > 0) {
    text += `   • *Absent Contractors:*\n`;
    absentContractors.forEach(c => {
      text += `     - ❌ ${c.companyName}: ${c.absenceReason || 'Not Reported'}\n`;
    });
  }
  text += `\n`;

  // 2. Physical Targets
  text += `*🎯 2. PHYSICAL WORK TARGETS: ${targetsAchieved}/${targetsAssigned} (${achievementPct}% Achieved)*\n`;
  if (targets.length > 0) {
    targets.forEach(t => {
      const icon = (t.status === 'ACHIEVED' || t.status === 'VERIFIED') ? '✅' : '⏳';
      text += `   ${icon} [${t.wing}-Fl${t.floorNumber}] ${t.tradeType}: ${t.targetDescription} (${t.actualCompletionPct || t.completionPct || 0}%)\n`;
      if (t.delayReason) {
        text += `      ⚠️ Blocker: ${t.delayReason}\n`;
      }
    });
  } else {
    text += `   • No specific micro-targets logged for this date.\n`;
  }
  text += `\n`;

  // 3. Materials
  text += `*📦 3. MATERIAL INWARD (GRN) & STORE:*\n`;
  if (materialInward.length > 0) {
    text += `   • Receipts: ${materialInward.length} Challans (Value: ₹${Number(totalInwardValue).toLocaleString('en-IN')})\n`;
    materialInward.forEach(m => {
      text += `     - ${m.itemName}: ${m.quantityReceived} ${m.unit} (Supplier: ${m.supplierName || 'Direct'})\n`;
    });
  } else {
    text += `   • No material deliveries recorded today.\n`;
  }
  text += `\n`;

  // 4. Machinery & Fuel
  text += `*🚜 4. PLANT & MACHINERY (P&M):*\n`;
  text += `   • Total Running Hours: ${machineryRunningHours} hrs | Diesel Issued: ${dieselIssuedLitres} L\n`;
  if (machinery.length > 0) {
    machinery.forEach(m => {
      text += `     - ${m.equipmentName}: ${m.totalHours} hrs | ${m.dieselIssuedLitres}L diesel (${m.workDone || 'Operational'})\n`;
    });
  }
  text += `\n`;

  // 5. Safety & HSE
  text += `*🛡️ 5. HEALTH, SAFETY & ENVIRONMENT (HSE):*\n`;
  if (safety.length > 0) {
    safety.forEach(s => {
      text += `   • TBT Topic: "${s.topic}" (${s.attendeeCount} attended, ${s.ppeCompliancePct}% PPE score)\n`;
    });
  }
  text += `   • Incidents / Near-Miss: ${incidentCount === 0 ? '🟢 Zero Incidents (Safe Day)' : `🔴 ${incidentCount} Incident(s) Logged`}\n\n`;

  // Observations
  if (narration && narration.trim()) {
    text += `*📝 SITE ENGINEER REMARKS:*\n${narration.trim()}\n\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `_Generated via ConstructTrack ERP Enterprise Reporting Engine_`;

  return text;
}

/**
 * Exports complete multi-sheet Daily Operational Report to Excel (.xlsx)
 */
export async function exportDailyReportToExcel({
  date,
  siteName = 'Main Construction Site',
  summary = {},
  contractorAtt = [],
  deptAtt = [],
  targets = [],
  materialInward = [],
  materialOutward = [],
  machinery = [],
  safety = [],
  visitorPasses = []
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ConstructTrack ERP';
  workbook.created = new Date();

  const addStyledSheet = (name, columns, rows) => {
    const ws = workbook.addWorksheet(name);
    ws.columns = columns;
    ws.addRows(rows);
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }
    };
    ws.columns.forEach(column => {
      let maxLen = 12;
      rows.forEach(r => {
        const val = r[column.key] || '';
        if (String(val).length > maxLen) maxLen = String(val).length;
      });
      column.width = Math.min(40, maxLen + 3);
    });
    return ws;
  };

  // Sheet 1: Manpower & Muster Roll
  const manpowerCols = [
    { header: 'Type', key: 'type' },
    { header: 'Contractor / Name', key: 'name' },
    { header: 'Trade / Skill', key: 'trade' },
    { header: 'Status', key: 'status' },
    { header: 'Masons', key: 'masons' },
    { header: 'Helpers', key: 'helpers' },
    { header: 'Total Workers', key: 'total' },
    { header: 'Reason / Work Notes', key: 'notes' }
  ];
  const manpowerRows = [
    ...contractorAtt.map(c => ({
      type: 'Contractor',
      name: c.companyName,
      trade: c.tradeType,
      status: c.isPresent ? 'PRESENT' : 'ABSENT',
      masons: c.masonsCount || 0,
      helpers: c.helpersCount || 0,
      total: c.totalWorkers || (c.masonsCount + c.helpersCount) || 0,
      notes: c.isPresent ? (c.workAssigned || 'Active on site') : (c.absenceReason || 'Absent')
    })),
    ...deptAtt.map(d => ({
      type: 'Department Labor',
      name: d.laborerName,
      trade: d.skillLevel,
      status: d.status,
      masons: 0,
      helpers: 1,
      total: 1,
      notes: d.workDescription || d.narration || ''
    }))
  ];
  addStyledSheet('Manpower Muster Roll', manpowerCols, manpowerRows);

  // Sheet 2: Daily Work Targets
  const targetCols = [
    { header: 'Wing', key: 'wing' },
    { header: 'Floor', key: 'floor' },
    { header: 'Trade', key: 'trade' },
    { header: 'Target Description', key: 'description' },
    { header: 'Target Sq.Ft', key: 'targetQty' },
    { header: 'Planned Labor', key: 'plannedLabor' },
    { header: 'Status', key: 'status' },
    { header: 'Actual %', key: 'actualPct' },
    { header: 'Delay / Blocker Reason', key: 'delayReason' }
  ];
  const targetRows = targets.map(t => ({
    wing: t.wing || 'B1',
    floor: t.floorNumber || 1,
    trade: t.tradeType || 'General',
    description: t.targetDescription || '',
    targetQty: t.targetQuantitySqft || 0,
    plannedLabor: t.plannedLaborCount || 0,
    status: t.status || 'ASSIGNED',
    actualPct: `${t.actualCompletionPct || 0}%`,
    delayReason: t.delayReason || 'None'
  }));
  addStyledSheet('Physical Work Targets', targetCols, targetRows);

  // Sheet 3: Material Inward (GRN)
  const inwardCols = [
    { header: 'Item Name', key: 'itemName' },
    { header: 'Category', key: 'category' },
    { header: 'Supplier Name', key: 'supplier' },
    { header: 'Challan No', key: 'challan' },
    { header: 'Vehicle No', key: 'vehicle' },
    { header: 'Qty Received', key: 'qty' },
    { header: 'Unit', key: 'unit' },
    { header: 'Rate (₹)', key: 'rate' },
    { header: 'Total (₹)', key: 'total' },
    { header: 'Received By', key: 'receivedBy' }
  ];
  const inwardRows = materialInward.map(m => ({
    itemName: m.itemName,
    category: m.category,
    supplier: m.supplierName,
    challan: m.challanNumber,
    vehicle: m.vehicleNumber,
    qty: m.quantityReceived,
    unit: m.unit,
    rate: m.ratePerUnit,
    total: m.totalAmount,
    receivedBy: m.receivedBy
  }));
  addStyledSheet('Material Inward (GRN)', inwardCols, inwardRows);

  // Sheet 4: Store Issues
  const outwardCols = [
    { header: 'Item Name', key: 'itemName' },
    { header: 'Category', key: 'category' },
    { header: 'Issued To Contractor', key: 'contractor' },
    { header: 'Wing', key: 'wing' },
    { header: 'Floor', key: 'floor' },
    { header: 'Quantity Issued', key: 'qty' },
    { header: 'Unit', key: 'unit' },
    { header: 'Purpose', key: 'purpose' },
    { header: 'Issued By', key: 'issuedBy' }
  ];
  const outwardRows = materialOutward.map(m => ({
    itemName: m.itemName,
    category: m.category,
    contractor: m.contractorName,
    wing: m.wing,
    floor: m.floorNumber,
    qty: m.quantityIssued,
    unit: m.unit,
    purpose: m.purpose,
    issuedBy: m.issuedBy
  }));
  addStyledSheet('Material Issues Ledger', outwardCols, outwardRows);

  // Sheet 5: Plant & Machinery
  const machCols = [
    { header: 'Equipment Name', key: 'name' },
    { header: 'Type', key: 'type' },
    { header: 'Registration No', key: 'regNo' },
    { header: 'Operator', key: 'operator' },
    { header: 'Start Meter', key: 'start' },
    { header: 'End Meter', key: 'end' },
    { header: 'Total Hours', key: 'hours' },
    { header: 'Diesel (L)', key: 'diesel' },
    { header: 'Work Executed', key: 'work' },
    { header: 'Location', key: 'location' }
  ];
  const machRows = machinery.map(eq => ({
    name: eq.equipmentName,
    type: eq.equipmentType,
    regNo: eq.registrationNo,
    operator: eq.operatorName,
    start: eq.startHours,
    end: eq.endHours,
    hours: eq.totalHours,
    diesel: eq.dieselIssuedLitres,
    work: eq.workDone,
    location: eq.location
  }));
  addStyledSheet('Machinery & Fuel Log', machCols, machRows);

  // Download workbook
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Daily_Operational_Report_${date}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
