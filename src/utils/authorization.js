/**
 * Authorization Utilities
 * 
 * Helper functions for authorization checks.
 */

// Role-based permissions map
const PERMISSIONS = {
  // Admin role has all permissions
  admin: ['create', 'read', 'update', 'delete', 'search'],
  
  // Research role can create, read, update, and search, but cannot delete
  research: ['create', 'read', 'update', 'search'],
  
  // Writing role has all permissions
  writing: ['create', 'read', 'update', 'delete', 'search'],
  
  // Analytics role can only read and search
  analytics: ['read', 'search']
};

/**
 * Check if a role is authorized for an operation
 * 
 * @param {string} role - Role to check
 * @param {string} operation - Operation to authorize ('create', 'read', 'update', 'delete', 'search')
 * @returns {boolean} True if authorized, false otherwise
 */
exports.isAuthorized = (role, operation) => {
  if (!role || !operation) {
    return false;
  }
  
  const permissions = PERMISSIONS[role];
  if (!permissions) {
    return false;
  }
  
  return permissions.includes(operation);
};