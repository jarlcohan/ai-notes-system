// Example Node.js Express API for AI Notes System

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const yaml = require('js-yaml');

const app = express();
const PORT = process.env.PORT || 3000;
const NOTES_DIR = process.env.NOTES_DIR || '/home/cj/Documents/AInotes';

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authenticateAgent = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (!apiKey) return res.status(401).json({ error: 'API key required' });
  
  // In production, use a secure authentication method
  // This is a simplified example
  const validKeys = {
    'research-agent-key': { role: 'research', name: 'Research Agent' },
    'writing-agent-key': { role: 'writing', name: 'Writing Agent' },
    'analytics-agent-key': { role: 'analytics', name: 'Analytics Agent' },
    'admin-key': { role: 'admin', name: 'Admin' }
  };
  
  const agent = validKeys[apiKey];
  if (!agent) return res.status(403).json({ error: 'Invalid API key' });
  
  req.agent = agent;
  next();
};

// Get all notes with optional filtering
app.get('/notes', authenticateAgent, async (req, res) => {
  try {
    const { tags, category, keyword } = req.query;
    // Implementation would include directory traversal and filtering
    // This is simplified for demonstration purposes
    
    const allNotes = await getAllNotes(NOTES_DIR);
    let filteredNotes = allNotes;
    
    if (tags) {
      const tagList = tags.split(',');
      filteredNotes = filteredNotes.filter(note => 
        tagList.some(tag => note.metadata.tags.includes(tag))
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

// Create a new note
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
      author: req.agent.name
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

// Get a specific note
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

// Update a note
app.put('/notes/:id', authenticateAgent, async (req, res) => {
  // Implementation similar to POST but with file update logic
  // Omitted for brevity
  res.status(200).json({ success: true });
});

// Helper function to parse note content
function parseNoteContent(content, filePath) {
  const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!metadataMatch) {
    return {
      path: filePath,
      content: content,
      metadata: {}
    };
  }
  
  try {
    const metadata = yaml.load(metadataMatch[1]);
    const actualContent = metadataMatch[2];
    
    return {
      path: filePath,
      content: actualContent,
      metadata
    };
  } catch (error) {
    console.error('Error parsing metadata:', error);
    return {
      path: filePath,
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
      const content = await fs.readFile(fullPath, 'utf8');
      const note = parseNoteContent(content, fullPath);
      notes.push(note);
    }
  }
  
  return notes;
}

// Search functionality
app.post('/notes/search', authenticateAgent, async (req, res) => {
  // Advanced search implementation
  // Omitted for brevity
  res.json([]);
});

// Append to existing note
app.post('/notes/:id/append', authenticateAgent, async (req, res) => {
  // Implementation for appending content
  // Omitted for brevity
  res.status(200).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`AI Notes API running on port ${PORT}`);
});

module.exports = app; // For testing