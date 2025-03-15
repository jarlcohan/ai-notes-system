/**
 * Notes Routes
 * 
 * Defines the API routes for notes-related endpoints.
 */

const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const { authenticateAgent, authorize, ROLES } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateAgent);

// GET /notes - Get all notes with optional filtering
router.get('/', authorize(ROLES.READERS), notesController.getAllNotes);

// GET /notes/:id - Get a specific note by ID
router.get('/:id', authorize(ROLES.READERS), notesController.getNoteById);

// POST /notes - Create a new note
router.post('/', authorize(ROLES.CREATORS), notesController.createNote);

// PUT /notes/:id - Update an existing note
router.put('/:id', authorize(ROLES.EDITORS), notesController.updateNote);

// DELETE /notes/:id - Delete or archive a note
router.delete('/:id', authorize(ROLES.DELETERS), notesController.deleteNote);

// POST /notes/:id/append - Append content to an existing note
router.post('/:id/append', authorize(ROLES.EDITORS), notesController.appendToNote);

// POST /notes/search - Advanced search functionality
router.post('/search', authorize(ROLES.READERS), notesController.searchNotes);

module.exports = router;