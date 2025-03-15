/**
 * Health Controller
 * 
 * Handles health check endpoints for the API.
 */

const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const NOTES_DIR = process.env.NOTES_DIR || './notes';

/**
 * Health check endpoint
 */
exports.getHealth = async (req, res) => {
  try {
    // Get storage information
    const stats = await getStorageStats();
    
    res.json({
      status: 'healthy',
      version: '1.0.0',
      storage: {
        type: process.env.STORAGE_TYPE || 'local',
        path: NOTES_DIR,
        ...stats
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodejs: process.version,
        cpus: os.cpus().length
      }
    });
  } catch (error) {
    // Even if stats collection fails, we should return a healthy status
    res.json({
      status: 'healthy',
      version: '1.0.0',
      uptime: process.uptime(),
      error: error.message
    });
  }
};

/**
 * Get storage statistics
 */
async function getStorageStats() {
  try {
    // Check if notes directory exists
    try {
      await fs.access(NOTES_DIR);
    } catch (error) {
      // Create directory if it doesn't exist
      await fs.mkdir(NOTES_DIR, { recursive: true });
    }
    
    // Count files and total size
    let totalFiles = 0;
    let totalSize = 0;
    
    async function countFiles(dirPath) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await countFiles(fullPath);
        } else {
          totalFiles++;
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    }
    
    await countFiles(NOTES_DIR);
    
    // Get disk space information
    const diskStats = await getDiskStats(NOTES_DIR);
    
    return {
      files: totalFiles,
      size: formatBytes(totalSize),
      ...diskStats
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

/**
 * Get disk statistics
 * This is a simplified version that may not work on all platforms
 */
async function getDiskStats(directory) {
  try {
    // This is a simplified approach that doesn't actually check disk space
    // In a real application, you might use a library like diskusage
    return {
      totalSpace: 'unknown',
      freeSpace: 'unknown'
    };
  } catch (error) {
    return {
      totalSpace: 'unknown',
      freeSpace: 'unknown',
      error: error.message
    };
  }
}

/**
 * Format bytes into human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}