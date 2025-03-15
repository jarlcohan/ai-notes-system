/**
 * AI Notes System - Main Application File
 * 
 * This is the entry point for the AI Notes System API server.
 */

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');
const yaml = require('js-yaml');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NOTES_DIR = process.env.NOTES_DIR || './notes';

// Parse API keys from environment
let API_KEYS = {};
try {
  API_KEYS = JSON.parse(process.env.API_KEYS || '{}');
} catch (error) {
  console.error('Error parsing API keys:', error);
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Authentication middleware
const authenticateAgent = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (!apiKey) return res.status(401).json({ error: 'API key required' });
  
  const role = API_KEYS[apiKey];
  if (!role) return res.status(403).json({ error: 'Invalid API key' });
  
  req.agent = {
    role,
    key: apiKey
  };
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    storage: {
      type: 'local',
      path: NOTES_DIR
    },
    uptime: process.uptime()
  });
});

// Ensure notes directory exists
(async () => {
  try {
    await fs.mkdir(NOTES_DIR, { recursive: true });
    
    // Create subdirectories if they don't exist
    const subdirs = ['topics', 'projects', 'references', 'archive'];
    for (const dir of subdirs) {
      await fs.mkdir(path.join(NOTES_DIR, dir), { recursive: true });
    }
    
    console.log(`Notes directory structure created at ${NOTES_DIR}`);
  } catch (error) {
    console.error('Error creating notes directories:', error);
  }
})();

// GET all notes with optional filtering
app.get('/notes', authenticateAgent, async (req, res) => {
  try {
    const { tags, category, keyword } = req.query;
    
    const allNotes = await getAllNotes(NOTES_DIR);
    let filteredNotes = allNotes;
    
    if (tags) {
      const tagList = tags.split(',');
      filteredNotes = filteredNotes.filter(note => 
        tagList.some(tag => note.metadata.tags && note.metadata.tags.includes(tag))
      );
    }
    
    if (category) {
      filteredNotes = filteredNotes.filter(note => 
        note.path.includes(`/${category}/`)
      );
    }
    
    if (keyword) {
      filteredNotes = filteredNotes.filter(note => 
        note.content.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    res.json(filteredNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET a specific note
app.get('/notes/:id', authenticateAgent, async (req, res) => {
  try {
    const notePath = path.join(NOTES_DIR, req.params.id);
    
    // Validate the path is within NOTES_DIR to prevent directory traversal attacks
    const resolvedPath = path.resolve(notePath);
    if (!resolvedPath.startsWith(path.resolve(NOTES_DIR))) {
      return res.status(403).json({ error: 'Invalid note path' });
    }
    
    const content = await fs.readFile(notePath, 'utf8');
    const note = parseNoteContent(content, notePath);
    
    res.json(note);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST a new note
app.post('/notes', authenticateAgent, async (req, res) => {
  try {
    const { title, content, tags = [], category = 'topics' } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Check permissions
    if (!['admin', 'research', 'writing'].includes(req.agent.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const filename = `${dateStr}_${slug}.md`;
    const categoryDir = path.join(NOTES_DIR, category);
    
    // Ensure directory exists
    await fs.mkdir(categoryDir, { recursive: true });
    
    const filePath = path.join(categoryDir, filename);
    
    // Create metadata
    const metadata = {
      date: dateStr,
      tags: tags,
      related: [],
      author: req.agent.role
    };
    
    // Format note with metadata
    const metadataYaml = yaml.dump(metadata);
    const fullContent = `---\n${metadataYaml}---\n\n# ${title}\n\n${content}`;
    
    await fs.writeFile(filePath, fullContent, 'utf8');
    
    res.status(201).json({ 
      id: path.relative(NOTES_DIR, filePath),
      title,
      path: filePath,
      created: dateStr
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (update) an existing note
app.put('/notes/:id', authenticateAgent, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const notePath = path.join(NOTES_DIR, req.params.id);
    
    // Validate the path is within NOTES_DIR
    const resolvedPath = path.resolve(notePath);
    if (!resolvedPath.startsWith(path.resolve(NOTES_DIR))) {
      return res.status(403).json({ error: 'Invalid note path' });
    }
    
    // Check if file exists
    try {
      await fs.access(notePath);
    } catch (error) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Check permissions
    if (!['admin', 'research', 'writing'].includes(req.agent.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    // Read existing file
    const existingContent = await fs.readFile(notePath, 'utf8');
    const note = parseNoteContent(existingContent, notePath);
    
    // Update metadata
    const updatedMetadata = {
      ...note.metadata,
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    if (tags) {
      updatedMetadata.tags = tags;
    }
    
    // Format updated note
    const metadataYaml = yaml.dump(updatedMetadata);
    const updatedTitle = title || note.title;
    const updatedContent = content || note.content;
    
    const fullContent = `---\n${metadataYaml}---\n\n# ${updatedTitle}\n\n${updatedContent}`;
    
    await fs.writeFile(notePath, fullContent, 'utf8');
    
    res.json({
      id: req.params.id,
      title: updatedTitle,
      updated: updatedMetadata.lastModified
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE (or archive) a note
app.delete('/notes/:id', authenticateAgent, async (req, res) => {
  try {
    // Only admin and writing roles can delete
    if (!['admin', 'writing'].includes(req.agent.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const notePath = path.join(NOTES_DIR, req.params.id);
    
    // Validate the path is within NOTES_DIR
    const resolvedPath = path.resolve(notePath);
    if (!resolvedPath.startsWith(path.resolve(NOTES_DIR))) {
      return res.status(403).json({ error: 'Invalid note path' });
    }
    
    const { archive } = req.query;
    
    if (archive === 'true') {
      // Move to archive directory instead of deleting
      const fileName = path.basename(notePath);
      const archivePath = path.join(NOTES_DIR, 'archive', fileName);
      
      // Ensure archive directory exists
      await fs.mkdir(path.join(NOTES_DIR, 'archive'), { recursive: true });
      
      // Move file to archive
      await fs.rename(notePath, archivePath);
      
      res.json({ 
        message: 'Note archived',
        id: path.relative(NOTES_DIR, archivePath)
      });
    } else {
      // Delete the file
      await fs.unlink(notePath);
      res.json({ message: 'Note deleted' });
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST append to an existing note
app.post('/notes/:id/append', authenticateAgent, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Check permissions
    if (!['admin', 'research', 'writing'].includes(req.agent.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const notePath = path.join(NOTES_DIR, req.params.id);
    
    // Validate the path is within NOTES_DIR
    const resolvedPath = path.resolve(notePath);
    if (!resolvedPath.startsWith(path.resolve(NOTES_DIR))) {
      return res.status(403).json({ error: 'Invalid note path' });
    }
    
    // Read existing file
    const existingContent = await fs.readFile(notePath, 'utf8');
    
    // Append content
    const updatedContent = `${existingContent}\n\n${content}`;
    
    await fs.writeFile(notePath, updatedContent, 'utf8');
    
    res.json({
      id: req.params.id,
      message: 'Content appended successfully'
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST advanced search
app.post('/notes/search', authenticateAgent, async (req, res) => {
  try {
    const { query, filters = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const allNotes = await getAllNotes(NOTES_DIR);
    
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
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to parse note content
function parseNoteContent(content, filePath) {
  const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!metadataMatch) {
    // If no metadata found, extract title from first header
    const titleMatch = content.match(/^# (.*?)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
    
    return {
      id: path.relative(NOTES_DIR, filePath),
      path: filePath,
      title: title,
      content: content,
      metadata: {}
    };
  }
  
  try {
    const metadata = yaml.load(metadataMatch[1]);
    const bodyContent = metadataMatch[2];
    
    // Extract title from first h1
    const titleMatch = bodyContent.match(/^# (.*?)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
    
    return {
      id: path.relative(NOTES_DIR, filePath),
      path: filePath,
      title: title,
      content: bodyContent.trim(),
      metadata
    };
  } catch (error) {
    console.error('Error parsing metadata:', error);
    return {
      id: path.relative(NOTES_DIR, filePath),
      path: filePath,
      title: path.basename(filePath, '.md'),
      content: content,
      metadata: {}
    };
  }
}

// Helper function to recursively get all notes
async function getAllNotes(directory) {
  const notes = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    
    if (entry.isDirectory()) {
      const subNotes = await getAllNotes(fullPath);
      notes.push(...subNotes);
    } else if (entry.name.endsWith('.md')) {
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        const note = parseNoteContent(content, fullPath);
        notes.push(note);
      } catch (error) {
        console.error(`Error reading file ${fullPath}:`, error);
      }
    }
  }
  
  return notes;
}

// Start the server
app.listen(PORT, () => {
  console.log(`AI Notes API running on port ${PORT}`);
  console.log(`Notes directory: ${NOTES_DIR}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // For testing