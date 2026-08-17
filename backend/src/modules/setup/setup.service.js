const SetupRepository = require('./setup.repository');

class SetupService {
  static async getPresets(siteId) {
    return SetupRepository.getPresets(siteId);
  }

  static async initializeProject(payload) {
    return SetupRepository.initializeProject(payload);
  }
}

module.exports = SetupService;
