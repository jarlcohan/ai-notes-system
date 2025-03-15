/**
 * Default Configuration
 * 
 * Base configuration for all environments.
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // Notes configuration
  notes: {
    directory: process.env.NOTES_DIR || './notes',
    storageType: process.env.STORAGE_TYPE || 'local'
  },
  
  // API configuration
  api: {
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '5mb',
    corsEnabled: process.env.ENABLE_CORS === 'true'
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};