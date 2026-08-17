const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const BackupRepository = require('./backup.repository');
const { StorageEngine } = require('../../lib/storageEngine');

const BACKUPS_DIR = path.resolve(__dirname, '../../../backups');

function ensureBackupsDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

ensureBackupsDir();

class BackupService {
  static getBackupsDir() {
    ensureBackupsDir();
    return BACKUPS_DIR;
  }

  static async createBackup() {
    ensureBackupsDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `ConstructTrack_Backup_${timestamp}.zip`;
    const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

    // 1. Export Database Tables
    const { dump, counts } = await BackupRepository.exportFullDatabase();

    const zip = new AdmZip();

    // 2. Add Database Dump JSON
    zip.addFile('database_dump.json', Buffer.from(JSON.stringify(dump, null, 2), 'utf8'));

    // 3. Add Manifest
    const manifest = {
      appName: 'ConstructTrack Enterprise',
      version: '2.2.0',
      createdAt: new Date().toISOString(),
      fileName: backupFileName,
      tableCounts: counts,
      totalRecords: Object.values(counts).reduce((a, b) => a + b, 0)
    };
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));

    // 4. Add Storage Files
    const storageRoot = StorageEngine.getStorageRoot();
    if (fs.existsSync(storageRoot)) {
      zip.addLocalFolder(storageRoot, 'storage');
    }

    // 5. Write to Backups directory
    zip.writeZip(backupFilePath);
    const stats = fs.statSync(backupFilePath);

    return {
      fileName: backupFileName,
      filePath: backupFilePath,
      sizeBytes: stats.size,
      manifest
    };
  }

  static async listBackups() {
    ensureBackupsDir();
    const files = await fs.promises.readdir(BACKUPS_DIR);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.zip')) {
        const fullPath = path.join(BACKUPS_DIR, file);
        const stats = await fs.promises.stat(fullPath);
        
        let manifest = null;
        try {
          const zip = new AdmZip(fullPath);
          const manifestEntry = zip.getEntry('manifest.json');
          if (manifestEntry) {
            manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
          }
        } catch (e) {
          // Ignore unreadable manifest
        }

        backups.push({
          fileName: file,
          sizeBytes: stats.size,
          createdAt: stats.mtime,
          manifest
        });
      }
    }

    // Sort newest first
    return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async restoreBackup(backupFileName, uploadedBuffer = null) {
    let zip;
    if (uploadedBuffer) {
      zip = new AdmZip(uploadedBuffer);
    } else {
      const fullPath = path.join(BACKUPS_DIR, backupFileName);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Backup file ${backupFileName} does not exist in /backups.`);
      }
      zip = new AdmZip(fullPath);
    }

    // 1. Extract and Validate Manifest & Database Dump
    const dbEntry = zip.getEntry('database_dump.json');
    if (!dbEntry) {
      throw new Error('Invalid backup archive: missing database_dump.json');
    }

    const dump = JSON.parse(dbEntry.getData().toString('utf8'));

    // 2. Restore PostgreSQL Database
    const dbResult = await BackupRepository.restoreFullDatabase(dump);

    // 3. Restore Storage Directory
    const storageRoot = StorageEngine.getStorageRoot();
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('storage/') && !entry.isDirectory) {
        const relativeStoragePath = entry.entryName.replace(/^storage\//, '');
        const targetPath = path.join(storageRoot, relativeStoragePath);
        const targetDir = path.dirname(targetPath);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.writeFileSync(targetPath, entry.getData());
      }
    }

    return {
      success: true,
      message: 'Complete database and document storage restored successfully!',
      dbResult
    };
  }
}

module.exports = BackupService;
