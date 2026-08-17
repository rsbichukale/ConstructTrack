const AuditRepository = require('./audit.repository');

class AuditService {
  static async log(payload) {
    return AuditRepository.logAction(payload);
  }

  static async getLogs(limit, entityType) {
    return AuditRepository.getLogs(Number(limit) || 100, entityType);
  }

  static async getTimeline(entityType, entityId) {
    return AuditRepository.getTimeline(entityType, entityId);
  }
}

module.exports = AuditService;
