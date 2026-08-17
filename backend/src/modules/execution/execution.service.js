const ExecutionRepository = require('./execution.repository');
const eventBus = require('../../lib/eventBus');

class ExecutionService {
  static async getTowerElevation(siteId = 1) {
    return ExecutionRepository.getAllFlats(siteId);
  }

  static async getFlatDetails(flatId) {
    const tasks = await ExecutionRepository.getFlatTasksByFlatId(flatId);
    const completed = tasks.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
    const progressPct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return {
      flatId: Number(flatId),
      totalTasks: tasks.length,
      completedTasks: completed,
      progressPct,
      tasks
    };
  }

  static async getFlatRoomDimensions(flatId) {
    return ExecutionRepository.getFlatRoomDimensions(flatId);
  }

  static async saveRoomDimensions(flatId, roomZoneId, data) {
    const record = await ExecutionRepository.saveRoomDimensions(flatId, roomZoneId, data);
    eventBus.broadcast('DIMENSIONS_UPDATED', { flatId, roomZoneId, record });
    return record;
  }

  static async assignContractor(taskId, contractorId) {
    const updated = await ExecutionRepository.assignContractor(taskId, contractorId);
    eventBus.broadcast('TASK_ASSIGNED', { taskId, contractorId, updated });
    return updated;
  }

  static async startTaskToday(taskId) {
    const updated = await ExecutionRepository.startTaskToday(taskId);
    eventBus.broadcast('TASK_STARTED', { taskId, updated });
    return updated;
  }

  static async requestInspection(taskId) {
    const updated = await ExecutionRepository.requestInspection(taskId);
    eventBus.broadcast('INSPECTION_REQUESTED', { taskId, updated });
    return updated;
  }

  static async approveTask(taskId) {
    const updated = await ExecutionRepository.approveTask(taskId);
    eventBus.broadcast('TASK_APPROVED', { taskId, updated });
    return updated;
  }

  static async updateTaskProgress(taskId, { status, completionPct, remarks, loggedBy }) {
    const updated = await ExecutionRepository.updateTaskStatus(taskId, status, completionPct, remarks, loggedBy);
    
    // Broadcast live event across site LAN!
    eventBus.broadcast('TASK_UPDATED', {
      taskId: Number(taskId),
      status,
      completionPct,
      updatedAt: new Date().toISOString()
    });

    return updated;
  }

  static async getTypologyTemplates(siteId = 1, flatType = '3BHK') {
    return ExecutionRepository.getTypologyTemplates(siteId, flatType);
  }

  static async saveTypologyTemplate(siteId, flatType, roomZoneId, data) {
    const record = await ExecutionRepository.saveTypologyTemplate(siteId, flatType, roomZoneId, data);
    eventBus.broadcast('TYPOLOGY_TEMPLATE_UPDATED', { flatType, roomZoneId, record });
    return record;
  }

  static async propagateTypologyToFlats(siteId = 1, flatType = '3BHK') {
    const result = await ExecutionRepository.propagateTypologyToFlats(siteId, flatType);
    eventBus.broadcast('TYPOLOGY_PROPAGATED', { flatType, result });
    return result;
  }

  static async addTaskCatalogItem(data) {
    const item = await ExecutionRepository.addTaskCatalogItem(data);
    eventBus.broadcast('CATALOG_ITEM_ADDED', { item });
    return item;
  }

  static async updateTaskCatalogItem(id, data) {
    const item = await ExecutionRepository.updateTaskCatalogItem(id, data);
    eventBus.broadcast('CATALOG_ITEM_UPDATED', { item });
    return item;
  }

  static async deleteTaskCatalogItem(id) {
    const deleted = await ExecutionRepository.deleteTaskCatalogItem(id);
    eventBus.broadcast('CATALOG_ITEM_DELETED', { id });
    return deleted;
  }
}

module.exports = ExecutionService;
