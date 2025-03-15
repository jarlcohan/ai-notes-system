/**
 * Authentication Middleware
 * 
 * Validates API keys and assigns roles.
 */

// Parse API keys from environment
let API_KEYS = {};
try {
  API_KEYS = JSON.parse(process.env.API_KEYS || '{}');
} catch (error) {
  console.error('Error parsing API keys:', error);
  process.exit(1);
}

/**
 * Authentication middleware
 * Validates the API key in the X-API-Key header
 */
const authenticateAgent = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const role = API_KEYS[apiKey];
  if (!role) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  // Attach agent info to the request
  req.agent = {
    role,
    key: apiKey,
    name: `${role} Agent`
  };
  
  next();
};

/**
 * Authorization middleware factory
 * Checks if the agent has the required role
 * 
 * @param {string[]} allowedRoles - Array of roles that are allowed
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.agent || !req.agent.role) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.agent.role) && !allowedRoles.includes('*')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Role-based authorization constants
const ROLES = {
  // All roles
  ALL: ['admin', 'research', 'writing', 'analytics'],
  
  // Roles that can create
  CREATORS: ['admin', 'research', 'writing'],
  
  // Roles that can update
  EDITORS: ['admin', 'research', 'writing'],
  
  // Roles that can delete
  DELETERS: ['admin', 'writing'],
  
  // Roles that can read
  READERS: ['admin', 'research', 'writing', 'analytics']
};

module.exports = {
  authenticateAgent,
  authorize,
  ROLES
};