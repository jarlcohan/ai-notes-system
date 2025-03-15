/**
 * Development Configuration
 * 
 * Configuration for development environment.
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: 'development'
  },
  
  // Notes configuration
  notes: {
    directory: process.env.NOTES_DIR || './notes',
    storageType: 'local'
  },
  
  // API configuration
  api: {
    maxRequestSize: '10mb',
    corsEnabled: true
  },
  
  // Logging configuration
  logging: {
    level: 'debug'
  }
};