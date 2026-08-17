import { openDB } from 'idb';

const DB_NAME = 'ConstructTrackDB';
const DB_VERSION = 1;

const STORES = [
  'flats',
  'room_zones',
  'task_catalog',
  'execution_phases',
  'contractors',
  'laborers',
  'flat_tasks',
  'logs',
  'attendance',
  'daily_work_targets',
  'snagging_items',
  'department_attendance',
  'trades',
  'wings',
  'floors',
];

let dbPromise = null;

export function getDb() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('sync_outbox')) {
          db.createObjectStore('sync_outbox', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadAllLocalState() {
  const db = await getDb();
  if (!db) return null;

  try {
    const tx = db.transaction([...STORES, 'meta'], 'readonly');
    const results = {};

    await Promise.all([
      ...STORES.map(async storeName => {
        const items = await tx.objectStore(storeName).getAll();
        const stateKey = mapStoreToStateKey(storeName);
        results[stateKey] = items || [];
      }),
      (async () => {
        const metaItem = await tx.objectStore('meta').get('last_sync_timestamp');
        results.lastSyncTimestamp = metaItem ? metaItem.value : null;
      })(),
    ]);

    await tx.done;

    const hasData = results.flats && results.flats.length > 0;
    return hasData ? results : null;
  } catch (err) {
    console.warn('[LocalDB] Error reading local state:', err);
    return null;
  }
}

export async function saveFullLocalState(state) {
  const db = await getDb();
  if (!db || !state) return;

  try {
    const tx = db.transaction([...STORES, 'meta'], 'readwrite');

    for (const storeName of STORES) {
      const stateKey = mapStoreToStateKey(storeName);
      const items = state[stateKey] || [];
      const store = tx.objectStore(storeName);
      await store.clear();
      for (const item of items) {
        if (item && item.id !== undefined) {
          await store.put(item);
        }
      }
    }

    if (state.lastSyncTimestamp) {
      await tx.objectStore('meta').put({ key: 'last_sync_timestamp', value: state.lastSyncTimestamp });
    }

    await tx.done;
  } catch (err) {
    console.error('[LocalDB] Error saving full local state:', err);
  }
}

export async function upsertLocalRecords(storeName, records) {
  const db = await getDb();
  if (!db || !records || records.length === 0) return;

  try {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const record of records) {
      if (record && record.id !== undefined) {
        await store.put(record);
      }
    }
    await tx.done;
  } catch (err) {
    console.error(`[LocalDB] Error upserting to ${storeName}:`, err);
  }
}

export async function deleteLocalRecord(storeName, id) {
  const db = await getDb();
  if (!db || id === undefined) return;

  try {
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).delete(id);
    await tx.done;
  } catch (err) {
    console.error(`[LocalDB] Error deleting from ${storeName}:`, err);
  }
}

export async function enqueueOutboxMutation(type, payload) {
  const db = await getDb();
  if (!db) return;

  try {
    const tx = db.transaction('sync_outbox', 'readwrite');
    await tx.objectStore('sync_outbox').add({
      type,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0,
    });
    await tx.done;
  } catch (err) {
    console.error('[LocalDB] Failed to enqueue mutation in outbox:', err);
  }
}

export async function getPendingOutbox() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.getAll('sync_outbox');
  } catch (err) {
    console.warn('[LocalDB] Error reading outbox:', err);
    return [];
  }
}

export async function removeOutboxItems(ids) {
  const db = await getDb();
  if (!db || !ids || ids.length === 0) return;

  try {
    const tx = db.transaction('sync_outbox', 'readwrite');
    const store = tx.objectStore('sync_outbox');
    for (const id of ids) {
      await store.delete(id);
    }
    await tx.done;
  } catch (err) {
    console.error('[LocalDB] Error removing outbox items:', err);
  }
}

export async function getLastSyncTimestamp() {
  const db = await getDb();
  if (!db) return null;

  try {
    const item = await db.get('meta', 'last_sync_timestamp');
    return item ? item.value : null;
  } catch (e) {
    return null;
  }
}

export async function setLastSyncTimestamp(timestamp) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.put('meta', { key: 'last_sync_timestamp', value: timestamp });
  } catch (e) {
    console.warn('[LocalDB] Error writing sync timestamp:', e);
  }
}

// BUG-13: Explicit mapping for every store — no fragile default fallthrough.
// If a store name diverges from its state key in the future, this will catch it.
function mapStoreToStateKey(storeName) {
  const MAP = {
    'flats':                'flats',
    'room_zones':           'roomZones',
    'task_catalog':         'taskCatalog',
    'execution_phases':     'executionPhases',
    'contractors':          'contractors',
    'laborers':             'laborers',
    'flat_tasks':           'flatTasks',
    'logs':                 'logs',
    'attendance':           'attendance',
    'daily_work_targets':   'dailyWorkTargets',
    'snagging_items':       'snaggingItems',
    'department_attendance':'departmentAttendance',
    'trades':               'trades',
    'wings':                'wings',
    'floors':               'floors',
  };
  const key = MAP[storeName];
  if (!key) {
    console.warn(`[LocalDB] Unknown store name "${storeName}" \u2014 no state key mapping found.`);
  }
  return key || storeName;
}
