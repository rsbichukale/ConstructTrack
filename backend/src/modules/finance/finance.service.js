const FinanceRepository = require('./finance.repository');
const eventBus = require('../../lib/eventBus');

class FinanceService {
  static async getPettyCashEntries(startDate, endDate) {
    const today = new Date().toISOString().split('T')[0];
    const sDate = startDate || '2026-08-01';
    const eDate = endDate || today;

    const entries = await FinanceRepository.getPettyCashEntries(sDate, eDate);
    const totalCashIn = entries.filter(e => e.entry_type === 'CASH_IN').reduce((acc, e) => acc + Number(e.amount), 0);
    const totalExpense = entries.filter(e => e.entry_type === 'EXPENSE').reduce((acc, e) => acc + Number(e.amount), 0);
    const netBalance = totalCashIn - totalExpense;

    return {
      summary: { totalCashIn, totalExpense, netBalance, count: entries.length },
      entries
    };
  }

  static async createPettyCashEntry(payload) {
    const entry = await FinanceRepository.createPettyCashEntry(payload);
    eventBus.broadcast('PETTY_CASH_LOGGED', entry);
    return entry;
  }

  static async getClientChanges() {
    return FinanceRepository.getClientChanges();
  }

  static async createClientChange(payload) {
    const change = await FinanceRepository.createClientChange(payload);
    eventBus.broadcast('CLIENT_CHANGE_CREATED', change);
    return change;
  }

  static async updateClientChangeStatus(id, status, approver) {
    const updated = await FinanceRepository.updateClientChangeStatus(id, status, 'engineer_approval', approver);
    eventBus.broadcast('CLIENT_CHANGE_UPDATED', updated);
    return updated;
  }

  static async approveClientChange(id, status, approvalType, approver) {
    const fieldMap = {
      sales: 'sales_approval',
      developer: 'developer_approval',
      engineer: 'engineer_approval'
    };
    const approvalField = fieldMap[approvalType] || 'developer_approval';
    const updated = await FinanceRepository.updateClientChangeStatus(id, status, approvalField, approver);
    eventBus.broadcast('CLIENT_CHANGE_UPDATED', updated);
    return updated;
  }
}

module.exports = FinanceService;
