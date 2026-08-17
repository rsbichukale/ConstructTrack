const BillingRepository = require('./billing.repository');
const eventBus = require('../../lib/eventBus');

class BillingService {
  static async getAllBills(siteId = 1) {
    return BillingRepository.getAllBills(siteId);
  }

  static async getBillDetails(id) {
    return BillingRepository.getBillById(id);
  }

  static async previewRABill(contractorId) {
    const tasks = await BillingRepository.getContractorApprovedTasks(contractorId);
    const pendingDebitNotes = await BillingRepository.getPendingDebitNotes(contractorId);

    // Calculate line items based on task rate & room dimension quantities
    const items = tasks.map(t => {
      const rate = Number(t.rate_per_unit) || 25;
      const qty = Number(t.calculated_quantity) || 120;
      const totalAmount = Math.round((qty * rate) * 100) / 100;
      return {
        flatTaskId: t.flat_task_id,
        description: `Flat ${t.wing}-${t.flat_number} (${t.zone_label}): ${t.task_name}`,
        quantity: qty,
        unit: t.unit_of_measure || 'sq.ft',
        rate,
        totalAmount
      };
    });

    const grossAmount = items.reduce((acc, i) => acc + i.totalAmount, 0);
    const retentionPct = 5.0;
    const retentionAmount = Math.round((grossAmount * (retentionPct / 100)) * 100) / 100;

    const tdsPct = 1.0;
    const tdsAmount = Math.round((grossAmount * (tdsPct / 100)) * 100) / 100;

    const laborCessPct = 1.0;
    const laborCessAmount = Math.round((grossAmount * (laborCessPct / 100)) * 100) / 100;

    const debitNotesTotal = pendingDebitNotes.reduce((acc, d) => acc + Number(d.amount), 0);
    const netPayableAmount = Math.max(0, grossAmount - retentionAmount - tdsAmount - laborCessAmount - debitNotesTotal);

    return {
      contractorId: Number(contractorId),
      eligibleTasksCount: tasks.length,
      grossAmount,
      retentionPct,
      retentionAmount,
      tdsPct,
      tdsAmount,
      laborCessPct,
      laborCessAmount,
      debitNotesDeducted: debitNotesTotal,
      netPayableAmount,
      pendingDebitNotes,
      items
    };
  }

  static async generateRABill(payload) {
    const preview = await this.previewRABill(payload.contractorId);
    const billNumber = `RA-${payload.contractorId}-${Date.now().toString().slice(-6)}`;

    const bill = await BillingRepository.createRABill({
      siteId: payload.siteId || 1,
      billNumber,
      contractorId: payload.contractorId,
      startDate: payload.startDate || '2026-08-01',
      endDate: payload.endDate || new Date().toISOString().split('T')[0],
      grossAmount: preview.grossAmount,
      retentionPct: preview.retentionPct,
      retentionAmount: preview.retentionAmount,
      tdsPct: preview.tdsPct,
      tdsAmount: preview.tdsAmount,
      laborCessPct: preview.laborCessPct,
      laborCessAmount: preview.laborCessAmount,
      debitNotesDeducted: preview.debitNotesDeducted,
      netPayableAmount: preview.netPayableAmount,
      notes: payload.notes || 'Subcontractor RA Bill generated from site task approvals'
    }, preview.items, preview.pendingDebitNotes.map(d => d.id));

    eventBus.broadcast('RA_BILL_GENERATED', bill);
    return bill;
  }

  static async certifyBill(id, certifiedBy) {
    const certified = await BillingRepository.certifyBill(id, certifiedBy || 'QS Manager');
    eventBus.broadcast('RA_BILL_CERTIFIED', certified);
    return certified;
  }

  static async recordPayment(id, paymentReference) {
    const paid = await BillingRepository.recordPayment(id, paymentReference || 'NEFT-SITE-PAY');
    eventBus.broadcast('RA_BILL_PAID', paid);
    return paid;
  }

  static async createDebitNote(payload) {
    const note = await BillingRepository.createDebitNote(payload);
    eventBus.broadcast('DEBIT_NOTE_CREATED', note);
    return note;
  }
}

module.exports = BillingService;
