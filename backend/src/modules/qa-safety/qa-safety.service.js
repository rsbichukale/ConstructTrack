const QASafetyRepository = require('./qa-safety.repository');
const eventBus = require('../../lib/eventBus');

class QASafetyService {
  static async getCubeTests(wing, grade) {
    return QASafetyRepository.getCubeTests(wing, grade);
  }

  static async recordCubeTest(payload) {
    const record = await QASafetyRepository.recordCubeTest(payload);
    eventBus.broadcast('CONCRETE_TEST_RECORDED', record);
    return record;
  }

  static async getSnags(wing, status) {
    return QASafetyRepository.getSnaggingItems(wing, status);
  }

  static async recordSnag(payload) {
    const snag = await QASafetyRepository.recordSnag(payload);
    eventBus.broadcast('SNAG_REPORTED', snag);
    return snag;
  }

  static async resolveSnag(id, photoAfter, notes) {
    const snag = await QASafetyRepository.resolveSnag(id, photoAfter, notes);
    eventBus.broadcast('SNAG_RESOLVED', snag);
    return snag;
  }

  static async recordSafetyBriefing(payload) {
    const briefing = await QASafetyRepository.recordSafetyBriefing(payload);
    eventBus.broadcast('SAFETY_BRIEFING_LOGGED', briefing);
    return briefing;
  }

  static async getVisitors(siteId = 1) {
    return QASafetyRepository.getVisitors(siteId);
  }

  static async recordVisitor(payload) {
    const visitor = await QASafetyRepository.recordVisitor(payload);
    eventBus.broadcast('VISITOR_PASS_ISSUED', visitor);
    return visitor;
  }
}

module.exports = QASafetyService;
