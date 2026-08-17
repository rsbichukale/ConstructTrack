const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });
require('dotenv').config();

const corsOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || process.env.APP_URL || '')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

module.exports = {
  PORT: process.env.PORT || process.env.BACKEND_PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  APP_URL: process.env.APP_URL || '',
  CORS_ORIGINS: corsOrigins
};
