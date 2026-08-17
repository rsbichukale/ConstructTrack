const path = require('path');
const fs = require('fs');
const BackupService = require('./backup.service');

async function createBackup(req, res, next) {
  try {
    const backupResult = await BackupService.createBackup();
    return res.json({
      success: true,
      backup: backupResult
    });
  } catch (err) {
    next(err);
  }
}

async function listBackups(req, res, next) {
  try {
    const backups = await BackupService.listBackups();
    return res.json({
      success: true,
      backups
    });
  } catch (err) {
    next(err);
  }
}

async function downloadBackup(req, res, next) {
  try {
    const { fileName } = req.params;
    // Sanitize fileName to prevent directory traversal
    const safeFileName = path.basename(fileName);
    const filePath = path.join(BackupService.getBackupsDir(), safeFileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Backup archive not found.' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

async function restoreBackup(req, res, next) {
  try {
    const { fileName, archiveBase64 } = req.body;

    let buffer = null;
    if (archiveBase64) {
      const base64Data = archiveBase64.replace(/^data:.*,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    }

    const restoreResult = await BackupService.restoreBackup(fileName, buffer);
    return res.json({
      success: true,
      result: restoreResult
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBackup,
  listBackups,
  downloadBackup,
  restoreBackup
};
