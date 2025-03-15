/**
 * Note Model
 * 
 * Handles interaction with the notes data storage.
 */

const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');
const { isAuthorized } = require('../utils/authorization');
const { parseNoteContent, formatNoteContent } = require('../utils/noteFormatter');

const NOTES_DIR = process.env.NOTES_DIR || './notes';

/**
 * Get all notes with optional filtering
 * 
 * @param {string} role - Agent role for authorization
 * @param {string} tags - Comma-separated list of tags to filter by
 * @param {string} category - Category to filter by
 * @param {string} keyword - Text to search for in note content
 * @returns {Promise<Array>} Filtered notes array
 */
exports.getAllNotes = async (role, tags, category, keyword) => {
  if (!isAuthorized(role, 'read')) {
    throw new Error('Insufficient permissions');
  }
  
  // Ensure notes directory exists
  await ensureNotesDirectory();
  
  // Get all notes
  const allNotes = await getAllNotesInternal();
  
  let filteredNotes = allNotes;
  
  // Apply tag filtering
  if (tags) {
    const tagList = tags.split(',');
    filteredNotes = filteredNotes.filter(note => 
      tagList.some(tag => note.metadata.tags && note.metadata.tags.includes(tag))
    );
  }
  
  // Apply category filtering
  if (category) {
    filteredNotes = filteredNotes.filter(note => 
      note.path.includes(`/${category}/`)
    );
  }
  
  // Apply keyword filtering
  if (keyword) {
    filteredNotes = filteredNotes.filter(note => 
      note.content.toLowerCase().includes(keyword.toLowerCase()) ||
      note.title.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  return filteredNotes;
};

/**
 * Get a specific note by ID
 * 
 * @param {string} role - Agent role for authorization
 * @param {string} noteId - The ID of the note to retrieve
 * @returns {Promise<Object>} The note or null if not found
 */
exports.getNoteById = async (role, noteId) => {
  if (!isAuthorized(role, 'read')) {
    throw new Error('Insufficient permissions');
  }
  
  const notePath = path.join(NOTES_DIR, noteId);
  
  // Validate the path is within NOTES_DIR to prevent directory traversal attacks
  const resolvedPath = path.resolve(notePath);
  if (!resolvedPath.startsWith(path.resolve(NOTES_DIR))) {
    throw new Error('Invalid note path');
  }
  
  try {
    const content = await fs.readFile(notePath, 'utf8');
    return parseNoteContent(content, notePath, NOTES_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

/**
 * Create a new note
 * 
 * @param {string} role - Agent role for authorization
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @param {Array} tags - Array of tags
 * @param {string} category - Category folder
 * @param {string} author - Author name
 * @returns {Promise<Object>} Created note information
 */
exports.createNote = async (role, title, content, tags, category, author) => {
  if (!isAuthorized(role, 'create')) {
    throw new Error('Insufficient permissions');
  }
  
  // Ensure notes directory exists
  await ensureNotesDirectory();
  
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const filename = `${dateStr}_${slug}.md`;
  const categoryDir = path.join(NOTES_DIR, category);
  
  // Ensure category directory exists
  await fs.mkdir(categoryDir, { recursive: true });
  
  const filePath = path.join(categoryDir, filename);
  
  // Create metadata
  const metadata = {
    date: dateStr,
    tags: tags,
    related: [],
    author: author
  };
  
  // Format note with metadata
  const fullContent = formatNoteContent(metadata, title, content);
  
  await fs.writeFile(filePath, fullContent, 'utf8');
  
  return { 
    id: path.relative(NOTES_DIR, filePath),
    title,
    path: filePath,
    created: dateStr
  };
};

/**
 * Update an existing note
 * 
 * @param {string} role - Agent role for authorization
 * @param {string} noteId - The ID of the note to update
 * @param {string} title - New title (optional)
 * @param {string} content - New content (optional)
 * @param {Array} tags - New tags (optional)
 * @returns {Promise<Object>} Updated note information or null if not found
 */
exports.updateNote = async (role, noteId, title, content, tags) => {
  if (!isAuthorized(role, 'update')) {
    throw new Error('Insufficient permissions');
  }
  
  const notePath = path.join(NOTES_DIR, noteId);
  
  // Validate the path is within NOTES_DIR
  const resolvedPath = path.resolve(notePath);
  if (!resolvedPath.startsWith(path.resolve(NOTES_DIR))) {
    throw new Error('Invalid note path');
  }
  
  try {
    // Check if file exists
    await fs.access(notePath);
    
    // Read existing file
    const existingContent = await fs.readFile(notePath, 'utf8');
    const note = parseNoteContent(existingContent, notePath, NOTES_DIR);
    
    // Update metadata
    const updatedMetadata = {
      ...note.metadata,
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    if (tags) {
      updatedMetadata.tags = tags;
    }
    
    // Format updated note
    const updatedTitle = title || note.title;
    const updatedContent = content || note.content;
    
    const fullContent = formatNoteContent(updatedMetadata, updatedTitle, updatedContent);
    
    await fs.writeFile(notePath, fullContent, 'utf8');
    
    return {
      id: noteId,
      title: updatedTitle,
      updated: updatedMetadata.lastModified
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

/**
 * Delete or archive a note
 * 
 * @param {string} role - Agent role for authorization
 * @param {string} noteId - The ID of the note to delete/archive
 * @param {boolean} shouldArchive - If true, move to archive instead of deleting
 * @returns {Promise<Object>} Result information or null if not found
 */
exports.deleteNote = async (role, noteId, shouldArchive) => {
  if (!isAuthorized(role, 'delete')) {
    throw new Error('Insufficient permissions');
  }
  
  const notePath = path.join(NOTES_DIR, noteId);
  
  // Validate the path is within NOTES_DIR
  const resolvedPath = path.resolve(notePath);
  if (!resolvedPath.startsWith(path.resolve(NOTES_DIR))) {
    throw new Error('Invalid note path');
  }
  
  try {
    // Check if file exists
    await fs.access(notePath);
    
    if (shouldArchive) {
      // Move to archive directory instead of deleting
      const fileName = path.basename(notePath);
      const archivePath = path.join(NOTES_DIR, 'archive', fileName);
      
      // Ensure archive directory exists
      await fs.mkdir(path.join(NOTES_DIR, 'archive'), { recursive: true });
      
      // Move file to archive
      await fs.rename(notePath, archivePath);
      
      return { 
        message: 'Note archived',
        id: path.relative(NOTES_DIR, archivePath)
      };
    } else {
      // Delete the file
      await fs.unlink(notePath);
      return { message: 'Note deleted' };
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

/**
 * Append content to an existing note
 * 
 * @param {string} role - Agent role for authorization
 * @param {string} noteId - The ID of the note to append to
 * @param {string} content - Content to append
 * @returns {Promise<Object>} Result information or null if not found
 */
exports.appendToNote = async (role, noteId, content) => {
  if (!isAuthorized(role, 'update')) {
    throw new Error('Insufficient permissions');
  }
  
  const notePath = path.join(NOTES_DIR, noteId);
  
  // Validate the path is within NOTES_DIR
  const resolvedPath = path.resolve(notePath);
  if (!resolvedPath.startsWith(path.resolve(NOTES_DIR))) {
    throw new Error('Invalid note path');
  }
  
  try {
    // Check if file exists
    await fs.access(notePath);
    
    // Read existing file
    const existingContent = await fs.readFile(notePath, 'utf8');
    
    // Update metadata to include lastModified
    const note = parseNoteContent(existingContent, notePath, NOTES_DIR);
    const updatedMetadata = {
      ...note.metadata,
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    // Append content
    const updatedContent = `${note.content}\n\n${content}`;
    
    // Format updated note
    const fullContent = formatNoteContent(updatedMetadata, note.title, updatedContent);
    
    await fs.writeFile(notePath, fullContent, 'utf8');
    
    return {
      id: noteId,
      message: 'Content appended successfully'
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

/**
 * Advanced search functionality
 * 
 * @param {string} role - Agent role for authorization
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Search results
 */
exports.searchNotes = async (role, query, filters = {}) => {
  if (!isAuthorized(role, 'read')) {
    throw new Error('Insufficient permissions');
  }
  
  // Get all notes
  const allNotes = await getAllNotesInternal();
  
  // Basic search implementation
  let results = allNotes.filter(note => {
    // Search in title and content
    const matchesQuery = 
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase());
    
    if (!matchesQuery) return false;
    
    // Apply additional filters
    if (filters.tags && filters.tags.length > 0) {
      if (!note.metadata.tags) return false;
      
      const hasMatchingTag = filters.tags.some(tag => 
        note.metadata.tags.includes(tag)
      );
      
      if (!hasMatchingTag) return false;
    }
    
    if (filters.category) {
      if (!note.path.includes(`/${filters.category}/`)) {
        return false;
      }
    }
    
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      const noteDate = note.metadata.date;
      
      if (start && noteDate < start) return false;
      if (end && noteDate > end) return false;
    }
    
    return true;
  });
  
  // Sort by relevance (simple implementation)
  results.sort((a, b) => {
    // Count occurrences of query in title and content
    const countA = 
      (a.title.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length +
      (a.content.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length;
      
    const countB = 
      (b.title.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length +
      (b.content.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length;
    
    return countB - countA;
  });
  
  return results;
};

/**
 * Helper function to ensure the notes directory exists
 */
async function ensureNotesDirectory() {
  try {
    await fs.access(NOTES_DIR);
  } catch (error) {
    // Create directory if it doesn't exist
    await fs.mkdir(NOTES_DIR, { recursive: true });
    
    // Create subdirectories
    const subdirs = ['topics', 'projects', 'references', 'archive'];
    for (const dir of subdirs) {
      await fs.mkdir(path.join(NOTES_DIR, dir), { recursive: true });
    }
  }
}

/**
 * Helper function to get all notes
 */
async function getAllNotesInternal() {
  const notes = [];
  
  // Ensure notes directory exists
  await ensureNotesDirectory();
  
  async function processDirectory(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Process subdirectories recursively
        await processDirectory(fullPath);
      } else if (entry.name.endsWith('.md')) {
        // Process markdown files
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const note = parseNoteContent(content, fullPath, NOTES_DIR);
          notes.push(note);
        } catch (error) {
          console.error(`Error reading file ${fullPath}:`, error);
        }
      }
    }
  }
  
  await processDirectory(NOTES_DIR);
  
  // Sort by date, newest first
  return notes.sort((a, b) => {
    if (a.metadata.date > b.metadata.date) return -1;
    if (a.metadata.date < b.metadata.date) return 1;
    return 0;
  });
}