const MaterialsRepository = require('./materials.repository');
const eventBus = require('../../lib/eventBus');

class MaterialsService {
  static async getInventory() {
    const items = await MaterialsRepository.getInventory();
    const lowStock = items.filter(i => Number(i.current_stock) <= Number(i.min_reorder_level));
    const totalVal = items.reduce((acc, i) => acc + (Number(i.current_stock) * Number(i.avg_rate_per_unit)), 0);

    return {
      totalItems: items.length,
      totalValuation: totalVal,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock,
      items
    };
  }

  static async recordInward(payload) {
    const record = await MaterialsRepository.recordInward(payload);
    eventBus.broadcast('MATERIAL_INWARD', record);
    return record;
  }

  static async recordOutward(payload) {
    const record = await MaterialsRepository.recordOutward(payload);
    eventBus.broadcast('MATERIAL_OUTWARD', record);
    return record;
  }
}

module.exports = MaterialsService;
