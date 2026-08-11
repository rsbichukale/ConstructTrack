// dbSyncService.js - IndexedDB Offline Queue & Service Worker Sync
import { openDB } from 'idb';

const DB_NAME = 'ConstructTrackOfflineDB';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('queued_logs')) {
        db.createObjectStore('queued_logs', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function saveOfflineLog(logData) {
  const db = await initDB();
  await db.add('queued_logs', { ...logData, timestamp: new Date().toISOString() });
  
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-site-logs');
  }
}