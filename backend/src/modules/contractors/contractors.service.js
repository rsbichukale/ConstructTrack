const ContractorsRepository = require('./contractors.repository');
const eventBus = require('../../lib/eventBus');

class ContractorsService {
  static async getAllContractors() {
    return ContractorsRepository.getAllContractors();
  }

  static async getDailyTargets(date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return ContractorsRepository.getDailyTargets(targetDate);
  }

  static async createDailyTarget(payload) {
    const target = await ContractorsRepository.createDailyTarget(payload);
    eventBus.broadcast('TARGET_ASSIGNED', target);
    return target;
  }

  static async updateTargetStatus(id, status) {
    const target = await ContractorsRepository.updateDailyTargetStatus(id, status);
    eventBus.broadcast('TARGET_UPDATED', target);
    return target;
  }

  static async recordAttendance(payload) {
    const att = await ContractorsRepository.recordAttendance(payload);
    eventBus.broadcast('ATTENDANCE_LOGGED', att);
    return att;
  }

  static async getMusterRoll(siteId = 1, date) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const roster = await ContractorsRepository.getMusterRoll(siteId, targetDate);

    const totalMasons = roster.reduce((s, r) => s + Number(r.masons_count), 0);
    const totalHelpers = roster.reduce((s, r) => s + Number(r.helpers_count), 0);
    const totalBarbenders = roster.reduce((s, r) => s + Number(r.barbenders_count), 0);
    const totalCarpenters = roster.reduce((s, r) => s + Number(r.carpenters_count), 0);
    const totalElectricians = roster.reduce((s, r) => s + Number(r.electricians_count), 0);
    const totalPlumbers = roster.reduce((s, r) => s + Number(r.plumbers_count), 0);
    const totalHeadcount = totalMasons + totalHelpers + totalBarbenders + totalCarpenters + totalElectricians + totalPlumbers;

    const presentContractors = roster.filter(r => r.is_present).length;

    return {
      date: targetDate,
      summary: {
        totalContractors: roster.length,
        presentContractors,
        totalHeadcount,
        totalMasons,
        totalHelpers,
        totalBarbenders,
        totalCarpenters,
        totalElectricians,
        totalPlumbers
      },
      roster
    };
  }

  static async getAllWageAdvances(siteId = 1) {
    const advances = await ContractorsRepository.getAllWageAdvances(siteId);
    const totalAdvances = advances.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const totalDisbursed = advances.filter(a => a.status === 'DISBURSED').reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const totalDeductedInRA = advances.filter(a => a.status === 'DEDUCTED_IN_RA_BILL').reduce((s, a) => s + (Number(a.amount) || 0), 0);

    return {
      summary: {
        totalAdvances,
        totalDisbursed,
        totalDeductedInRA,
        totalVouchersCount: advances.length
      },
      advances
    };
  }

  static async createWageAdvance(payload) {
    const adv = await ContractorsRepository.createWageAdvance(payload);
    eventBus.broadcast('WAGE_ADVANCE_ISSUED', adv);
    return adv;
  }

  static async createContractor(payload) {
    const contractor = await ContractorsRepository.createContractor(payload);
    eventBus.broadcast('CONTRACTOR_REGISTERED', contractor);
    return contractor;
  }
}

module.exports = ContractorsService;
