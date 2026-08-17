const { StorageEngine, CATEGORIES } = require('../../lib/storageEngine');

class StorageService {
  static async uploadFile({ category, fileName, data, mimeType }) {
    return StorageEngine.saveFile({ category, fileName, data, mimeType });
  }

  static async listCategoryFiles(category) {
    return StorageEngine.listFiles(category);
  }

  static getCategories() {
    return Object.values(CATEGORIES);
  }
}

module.exports = StorageService;
