/**
 * Note Formatter Utilities
 * 
 * Functions for parsing and formatting note content.
 */

const path = require('path');
const yaml = require('js-yaml');

/**
 * Parse a note's content into structured data
 * 
 * @param {string} content - The raw note content
 * @param {string} filePath - The file path
 * @param {string} notesDir - The base notes directory for ID calculation
 * @returns {Object} Structured note data
 */
exports.parseNoteContent = (content, filePath, notesDir) => {
  const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!metadataMatch) {
    // If no metadata found, extract title from first header
    const titleMatch = content.match(/^# (.*?)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
    
    return {
      id: path.relative(notesDir, filePath),
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
      id: path.relative(notesDir, filePath),
      path: filePath,
      title: title,
      content: bodyContent.trim(),
      metadata
    };
  } catch (error) {
    console.error('Error parsing metadata:', error);
    return {
      id: path.relative(notesDir, filePath),
      path: filePath,
      title: path.basename(filePath, '.md'),
      content: content,
      metadata: {}
    };
  }
};

/**
 * Format a note's metadata and content into a string
 * 
 * @param {Object} metadata - Note metadata
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @returns {string} Formatted note content
 */
exports.formatNoteContent = (metadata, title, content) => {
  const metadataYaml = yaml.dump(metadata);
  
  // Check if content already starts with a title
  if (content.trim().startsWith('# ')) {
    return `---\n${metadataYaml}---\n\n${content}`;
  } else {
    return `---\n${metadataYaml}---\n\n# ${title}\n\n${content}`;
  }
};