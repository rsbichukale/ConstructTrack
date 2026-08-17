const express = require('express');
const router = express.Router();
const db = require('../../lib/db');
const eventBus = require('../../lib/eventBus');

router.get('/', (req, res) => {
  return res.json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

router.get('/site-diagnostics', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'CONNECTED';
  let latencyMs = 0;
  let counts = {};

  try {
    const pingRes = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM flats) as total_flats,
        (SELECT COUNT(*) FROM flat_tasks) as total_tasks,
        (SELECT COUNT(*) FROM contractors) as total_contractors,
        (SELECT COUNT(*) FROM material_inventory) as total_inventory,
        (SELECT pg_size_pretty(pg_database_size('constructtrack_db'))) as db_size;
    `);
    latencyMs = Date.now() - startTime;
    counts = pingRes.rows[0];
  } catch (err) {
    dbStatus = 'DISCONNECTED: ' + err.message;
  }

  return res.json({
    success: true,
    server: {
      status: 'ONLINE',
      port: 5000,
      uptimeSeconds: Math.floor(process.uptime()),
      connectedLanClients: eventBus.getClientCount()
    },
    database: {
      status: dbStatus,
      latencyMs,
      databaseName: 'constructtrack_db',
      stats: counts
    }
  });
});

module.exports = router;
