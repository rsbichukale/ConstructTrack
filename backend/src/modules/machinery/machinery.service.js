const MachineryRepository = require('./machinery.repository');
const eventBus = require('../../lib/eventBus');

class MachineryService {
  static calculateFuelEfficiency(hours, dieselLitres) {
    const h = Number(hours) || 0;
    const l = Number(dieselLitres) || 0;
    if (h <= 0) return 0;
    return Math.round((l / h) * 100) / 100;
  }

  static async getAllAssets(siteId = 1) {
    const assets = await MachineryRepository.getAllAssets(siteId);
    return assets.map(a => {
      const cumHours = Number(a.total_cumulative_hours || 0);
      const lastService = Number(a.last_service_hours || 0);
      const interval = Number(a.service_interval_hours || 250);
      const hoursSinceService = cumHours - lastService;
      const hoursTillNextService = Math.max(0, interval - hoursSinceService);
      const isOverdue = hoursSinceService >= interval;

      return {
        ...a,
        hoursSinceService,
        hoursTillNextService,
        isOverdue,
        healthStatus: isOverdue ? 'SERVICE_OVERDUE' : (hoursTillNextService < 25 ? 'SERVICE_DUE_SOON' : 'HEALTHY')
      };
    });
  }

  static async registerAsset(payload) {
    const asset = await MachineryRepository.createAsset(payload);
    eventBus.broadcast('MACHINERY_ASSET_REGISTERED', asset);
    return asset;
  }

  static async updateStatus(id, status) {
    const updated = await MachineryRepository.updateAssetStatus(id, status);
    eventBus.broadcast('MACHINERY_STATUS_CHANGED', updated);
    return updated;
  }

  static async getAllLogs(siteId = 1) {
    return MachineryRepository.getAllLogs(siteId);
  }

  static async recordRunAndFuelLog(payload) {
    const totalHours = payload.totalHours || Math.max(0, (Number(payload.endHours) || 0) - (Number(payload.startHours) || 0));
    const efficiency = this.calculateFuelEfficiency(totalHours, payload.dieselIssuedLitres);

    let benchmark = 14.0;
    if (payload.assetId) {
      const asset = await MachineryRepository.getAssetById(payload.assetId);
      if (asset) benchmark = Number(asset.hourly_fuel_benchmark_litres) || 14.0;
    }

    const excessFuelFlag = efficiency > (benchmark * 1.25);

    const log = await MachineryRepository.createLog({
      ...payload,
      totalHours,
      fuelEfficiencyLitresPerHour: efficiency,
      excessFuelFlag
    });

    eventBus.broadcast('MACHINERY_LOG_RECORDED', log);
    return log;
  }
}

module.exports = MachineryService;
