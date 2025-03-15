/**
 * Notes Controller
 * 
 * Handles the business logic for notes-related API endpoints.
 */

const noteModel = require('../models/noteModel');

/**
 * Get all notes with optional filtering
 */
exports.getAllNotes = async (req, res, next) => {
  try {
    const { tags, category, keyword } = req.query;
    const notes = await noteModel.getAllNotes(req.agent.role, tags, category, keyword);
    res.json(notes);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific note by ID
 */
exports.getNoteById = async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const note = await noteModel.getNoteById(req.agent.role, noteId);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new note
 */
exports.createNote = async (req, res, next) => {
  try {
    const { title, content, tags = [], category = 'topics' } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const result = await noteModel.createNote(
      req.agent.role, 
      title, 
      content, 
      tags, 
      category,
      req.agent.name || req.agent.role
    );
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing note
 */
exports.updateNote = async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const { title, content, tags } = req.body;
    
    if (!title && !content && !tags) {
      return res.status(400).json({ error: 'At least one field to update is required' });
    }
    
    const result = await noteModel.updateNote(
      req.agent.role,
      noteId,
      title,
      content,
      tags
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete or archive a note
 */
exports.deleteNote = async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const { archive } = req.query;
    const shouldArchive = archive === 'true';
    
    const result = await noteModel.deleteNote(
      req.agent.role,
      noteId,
      shouldArchive
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Append content to an existing note
 */
exports.appendToNote = async (req, res, next) => {
  try {
    const noteId = req.params.id;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const result = await noteModel.appendToNote(
      req.agent.role,
      noteId,
      content
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Advanced search functionality
 */
exports.searchNotes = async (req, res, next) => {
  try {
    const { query, filters = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const results = await noteModel.searchNotes(
      req.agent.role,
      query,
      filters
    );
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};