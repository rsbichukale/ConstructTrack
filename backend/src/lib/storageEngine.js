const fs = require('fs');
const path = require('path');

const STORAGE_ROOT = path.resolve(__dirname, '../../../storage');

const CATEGORIES = {
  SNAGS: 'snags',
  CONCRETE_LAB: 'concrete_lab',
  MATERIALS_GRN: 'materials_grn',
  CLIENT_CHANGES: 'client_changes',
  RA_BILLS: 'ra_bills',
  SAFETY_BRIEFINGS: 'safety_briefings',
  PETTY_CASH: 'petty_cash'
};

// Ensure all storage directories exist on startup
function ensureDirectories() {
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }
  Object.values(CATEGORIES).forEach(sub => {
    const dir = path.join(STORAGE_ROOT, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

ensureDirectories();

class StorageEngine {
  static getStorageRoot() {
    return STORAGE_ROOT;
  }

  static getCategoryDir(category) {
    const sub = CATEGORIES[category.toUpperCase()] || category.toLowerCase();
    const dir = path.join(STORAGE_ROOT, sub);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Save a base64 or buffer payload into structured storage
   * @param {Object} options
   * @param {string} options.category - One of SNAGS, CONCRETE_LAB, MATERIALS_GRN, CLIENT_CHANGES, RA_BILLS, SAFETY_BRIEFINGS, PETTY_CASH
   * @param {string} options.fileName - Suggested file name / prefix
   * @param {string|Buffer} options.data - Base64 string (with or without data URI header) or Buffer
   * @param {string} [options.mimeType] - e.g. 'image/jpeg', 'application/pdf'
   * @returns {Promise<{ relativeUrl: string, absolutePath: string, fileName: string, sizeBytes: number }>}
   */
  static async saveFile({ category, fileName, data, mimeType }) {
    ensureDirectories();
    const catDir = this.getCategoryDir(category);

    let buffer;
    let ext = '.jpg';

    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const detectedMime = matches[1];
          ext = this.getExtensionFromMime(detectedMime);
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          buffer = Buffer.from(data, 'base64');
        }
      } else {
        buffer = Buffer.from(data, 'base64');
      }
    } else {
      throw new Error('Invalid file data provided. Expected Buffer or base64 string.');
    }

    if (mimeType && ext === '.jpg') {
      ext = this.getExtensionFromMime(mimeType);
    }

    // Sanitize and structure filename
    const cleanBaseName = (fileName || `File_${Date.now()}`)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const finalFileName = `${cleanBaseName}_${Date.now()}${ext}`;
    const absolutePath = path.join(catDir, finalFileName);

    await fs.promises.writeFile(absolutePath, buffer);

    const categorySub = CATEGORIES[category.toUpperCase()] || category.toLowerCase();
    const relativeUrl = `/storage/${categorySub}/${finalFileName}`;

    return {
      fileName: finalFileName,
      category: categorySub,
      relativeUrl,
      absolutePath,
      sizeBytes: buffer.length
    };
  }

  static getExtensionFromMime(mime) {
    switch (mime.toLowerCase()) {
      case 'image/png': return '.png';
      case 'image/jpeg':
      case 'image/jpg': return '.jpg';
      case 'image/webp': return '.webp';
      case 'application/pdf': return '.pdf';
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return '.xlsx';
      default: return '.jpg';
    }
  }

  static async listFiles(category) {
    const catDir = this.getCategoryDir(category);
    const files = await fs.promises.readdir(catDir);
    const categorySub = CATEGORIES[category.toUpperCase()] || category.toLowerCase();

    return files.map(file => ({
      fileName: file,
      relativeUrl: `/storage/${categorySub}/${file}`,
      path: path.join(catDir, file)
    }));
  }
}

module.exports = {
  StorageEngine,
  CATEGORIES
};
