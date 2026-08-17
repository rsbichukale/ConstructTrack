import jsPDF from 'jspdf';

/**
 * Generates a detailed Flat-Wise & Room-Wise PDF Inspection Report
 * Detailing which work on which room is Done vs Pending, with Contractor assignments and Blocker notes.
 */
export function generateFlatInspectionPdf(state, targetFlatId) {
  const flat = (state.flats || []).find(f => f.id === targetFlatId);
  if (!flat) return;

  const flatTasks = (state.flatTasks || []).filter(t => t.flatId === flat.id);
  const totalTasks = flatTasks.length;
  const approvedTasks = flatTasks.filter(t => t.status === 'APPROVED').length;
  const inProgressTasks = flatTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'INSPECTION_REQUESTED').length;
  const assignedTasks = flatTasks.filter(t => t.status === 'ASSIGNED').length;
  const reworkTasks = flatTasks.filter(t => t.status === 'REWORK' || !!t.blockerReason).length;
  const overallPct = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let y = 15;

  // Title Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(56, 189, 248);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CONSTRUCTTRACK • DETAILED FLAT INSPECTION REPORT', 14, 13);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Flat ${flat.wing}-${flat.flatNumber} (${flat.flatType}) • Floor ${flat.floorNumber} • Wing ${flat.wing}`, 14, 22);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 135, 22);

  y = 38;

  // Executive Summary Card
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 182, 22, 3, 3, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Overall Progress: ${overallPct}% (${approvedTasks}/${totalTasks} Tasks Completed)`, 18, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Approved: ${approvedTasks}  |  In Progress: ${inProgressTasks}  |  Assigned: ${assignedTasks}  |  Rework/Blocked: ${reworkTasks}`, 18, y + 16);

  y += 30;

  // Group Micro-Tasks by Room Zone
  (state.roomZones || []).forEach(zone => {
    const zoneCatalogItems = (state.taskCatalog || []).filter(c => c.roomZoneId === zone.id);
    const zoneFlatTasks = flatTasks.filter(t => zoneCatalogItems.some(c => c.id === t.taskCatalogId));

    if (zoneFlatTasks.length === 0) return;

    if (y > 250) {
      doc.addPage();
      y = 15;
    }

    doc.setFillColor(30, 41, 59);
    doc.rect(14, y, 182, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const zoneApproved = zoneFlatTasks.filter(t => t.status === 'APPROVED').length;
    doc.text(`ROOM ZONE: ${zone.zoneLabel.toUpperCase()} (${zoneApproved}/${zoneFlatTasks.length} Done)`, 18, y + 5.5);

    y += 10;

    doc.setFillColor(226, 232, 240);
    doc.rect(14, y, 182, 6, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Micro-Task Description', 16, y + 4.5);
    doc.text('Trade', 85, y + 4.5);
    doc.text('Status', 120, y + 4.5);
    doc.text('Completion', 145, y + 4.5);
    doc.text('Assigned Contractor', 170, y + 4.5);

    y += 7;

    zoneFlatTasks.forEach(task => {
      if (y > 270) {
        doc.addPage();
        y = 15;
      }

      const catalogItem = (state.taskCatalog || []).find(c => c.id === task.taskCatalogId);
      const contractor = (state.contractors || []).find(c => c.id === task.assignedContractorId);
      const contractorName = contractor ? contractor.companyName : 'Unassigned';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      const taskName = catalogItem?.taskName || 'Micro-Task';
      const truncatedName = taskName.length > 38 ? taskName.substring(0, 36) + '...' : taskName;
      doc.text(truncatedName, 16, y);
      doc.text(catalogItem?.tradeType || 'General', 85, y);

      if (task.status === 'APPROVED') {
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPLETED', 120, y);
      } else if (task.status === 'REWORK' || !!task.blockerReason) {
        doc.setTextColor(225, 29, 72);
        doc.setFont('helvetica', 'bold');
        doc.text('REWORK', 120, y);
      } else if (task.status === 'IN_PROGRESS') {
        doc.setTextColor(217, 119, 6);
        doc.setFont('helvetica', 'bold');
        doc.text('STARTED', 120, y);
      } else if (task.status === 'ASSIGNED') {
        doc.setTextColor(2, 132, 199);
        doc.setFont('helvetica', 'bold');
        doc.text('ASSIGNED', 120, y);
      } else {
        doc.setTextColor(100, 116, 139);
        doc.text('NOT STARTED', 120, y);
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(`${task.completionPct}%`, 148, y);

      const truncatedContractor = contractorName.length > 18 ? contractorName.substring(0, 16) + '...' : contractorName;
      doc.text(truncatedContractor, 170, y);

      y += 5;

      if (task.blockerReason) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(225, 29, 72);
        doc.text(`⚠ Blocker: ${task.blockerReason}`, 20, y);
        y += 4.5;
      }
    });

    y += 4;
  });

  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  y += 10;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 196, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Site Manager Signature: _______________________', 14, y);
  doc.text('Contractor Representative: _______________________', 115, y);

  doc.save(`Flat_${flat.wing}_${flat.flatNumber}_Inspection_Report.pdf`);
}
