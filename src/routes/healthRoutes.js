/**
 * Health Routes
 * 
 * Defines the API routes for health check endpoints.
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { authenticateAgent, authorize, ROLES } = require('../middleware/auth');

// GET /health - Public health check
router.get('/', healthController.getHealth);

// GET /health/detailed - Authenticated detailed health check
router.get('/detailed', authenticateAgent, authorize(ROLES.ALL), healthController.getHealth);

module.exports = router;