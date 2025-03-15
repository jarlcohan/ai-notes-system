# Agent Integration Guide

This guide explains how to integrate AI agents with the AI Notes System, allowing agents to create, retrieve, and update notes.

## Overview

AI agents can integrate with the Notes System via the REST API. Each agent needs:

1. An API key with appropriate permissions
2. A client library to communicate with the API
3. Integration code that determines when and how to store or retrieve notes

```
┌─────────────────┐            ┌─────────────────┐
│                 │            │                 │
│    AI Agent     │            │   Notes API     │
│                 │            │                 │
└────────┬────────┘            └────────┬────────┘
         │                              │
         │     1. API Request           │
         │  (with API Key header)       │
         │ ─────────────────────────────►
         │                              │
         │     2. Process Request       │
         │                              │
         │     3. API Response          │
         │ ◄─────────────────────────────
         │                              │
┌────────┴────────┐            ┌────────┴────────┐
│     Client      │            │     Server      │
│    Library      │            │     Logic       │
└─────────────────┘            └─────────────────┘
```

## Client Libraries

### Python Integration

Here's a basic Python client for the Notes API:

```python
import requests
import json

class NotesClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }
    
    def create_note(self, title, content, tags=None, category="topics"):
        payload = {
            "title": title,
            "content": content,
            "tags": tags or [],
            "category": category
        }
        response = requests.post(
            f"{self.base_url}/notes",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
        
    def search_notes(self, keyword=None, tags=None, category=None):
        params = {}
        if keyword:
            params['keyword'] = keyword
        if tags:
            params['tags'] = ','.join(tags)
        if category:
            params['category'] = category
            
        response = requests.get(
            f"{self.base_url}/notes",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def get_note(self, note_id):
        response = requests.get(
            f"{self.base_url}/notes/{note_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def update_note(self, note_id, title=None, content=None, tags=None):
        payload = {}
        if title:
            payload['title'] = title
        if content:
            payload['content'] = content
        if tags:
            payload['tags'] = tags
            
        response = requests.put(
            f"{self.base_url}/notes/{note_id}",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def append_to_note(self, note_id, content):
        payload = {
            "content": content
        }
        
        response = requests.post(
            f"{self.base_url}/notes/{note_id}/append",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()

# Usage example
client = NotesClient(
    "http://localhost:3000",
    "your-api-key"
)

# Create a note
new_note = client.create_note(
    "Machine Learning Concepts",
    "# Introduction to Machine Learning\n\nThis note covers basic ML concepts.",
    ["ml", "ai", "basics"]
)

# Search for notes
ml_notes = client.search_notes(keyword="machine learning")
```

### JavaScript/Node.js Integration

Here's a basic JavaScript client using axios:

```javascript
const axios = require('axios');

class NotesClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    };
  }
  
  async createNote(title, content, tags = [], category = 'topics') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/notes`,
        { title, content, tags, category },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating note:', error.message);
      throw error;
    }
  }
  
  async searchNotes({ keyword, tags, category } = {}) {
    try {
      const params = {};
      
      if (keyword) params.keyword = keyword;
      if (tags && Array.isArray(tags)) params.tags = tags.join(',');
      if (category) params.category = category;
      
      const response = await axios.get(
        `${this.baseUrl}/notes`,
        { 
          headers: this.headers,
          params
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error searching notes:', error.message);
      return [];
    }
  }
  
  async getNote(noteId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/notes/${noteId}`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting note ${noteId}:`, error.message);
      throw error;
    }
  }
  
  async updateNote(noteId, { title, content, tags } = {}) {
    const updates = {};
    
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (tags) updates.tags = tags;
    
    if (Object.keys(updates).length === 0) {
      throw new Error('No update parameters provided');
    }
    
    try {
      const response = await axios.put(
        `${this.baseUrl}/notes/${noteId}`,
        updates,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating note ${noteId}:`, error.message);
      throw error;
    }
  }
  
  async appendToNote(noteId, content) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/notes/${noteId}/append`,
        { content },
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Error appending to note ${noteId}:`, error.message);
      throw error;
    }
  }
}

// Usage example
const client = new NotesClient(
  'http://localhost:3000',
  'your-api-key'
);

async function example() {
  try {
    // Create a note
    const newNote = await client.createNote(
      'JavaScript Best Practices',
      '# JavaScript Best Practices\n\nThis note covers modern JS practices.',
      ['javascript', 'programming', 'best-practices']
    );
    console.log('Created note:', newNote);
    
    // Search for notes
    const jsNotes = await client.searchNotes({ keyword: 'javascript' });
    console.log('Found notes:', jsNotes);
  } catch (error) {
    console.error('Error in example:', error);
  }
}

example();
```

## Agent Implementation Patterns

### Pattern 1: Conversation Memory

Store key points from conversations to provide context for future interactions.

```python
class ConversationAgent:
    def __init__(self, api_url, api_key):
        self.notes_client = NotesClient(api_url, api_key)
        self.current_topic = None
    
    def process_message(self, user_message):
        # Determine the topic of the conversation
        topic = self.extract_topic(user_message)
        
        if topic:
            self.current_topic = topic
            
            # Check if we have existing notes on this topic
            existing_notes = self.notes_client.search_notes(keyword=topic)
            
            if existing_notes:
                # Use existing information to inform the response
                note = existing_notes[0]
                # Generate response using the note content...
                
                # Append new information from this conversation
                self.notes_client.append_to_note(
                    note['id'],
                    f"\n\n## Conversation Update ({self.get_date()})\n{user_message}\n"
                )
                
            else:
                # Create a new note for this topic
                self.notes_client.create_note(
                    f"Conversation: {topic}",
                    f"# {topic}\n\n## Initial Conversation ({self.get_date()})\n{user_message}\n",
                    [topic.lower(), "conversation"]
                )
                
        # Generate and return response...
    
    def extract_topic(self, message):
        # Implementation to extract the main topic from a message
        # This could use NLP or simple keyword matching
        pass
        
    def get_date(self):
        return datetime.now().strftime("%Y-%m-%d")
```

### Pattern 2: Knowledge Base Builder

Progressively build a knowledge base from information gathered across interactions.

```javascript
class KnowledgeAgent {
  constructor(apiUrl, apiKey) {
    this.notesClient = new NotesClient(apiUrl, apiKey);
  }
  
  async processInformation(topic, information) {
    // Search for existing knowledge on this topic
    const existingNotes = await this.notesClient.searchNotes({ 
      keyword: topic,
      category: 'knowledge-base'
    });
    
    if (existingNotes.length > 0) {
      // Update existing knowledge
      const note = existingNotes[0];
      
      // Check if this information is new or contradicts existing knowledge
      if (this.isNewInformation(note, information)) {
        const updatedContent = this.mergeInformation(note.content, information);
        
        await this.notesClient.updateNote(note.id, { 
          content: updatedContent 
        });
        
        return `Updated knowledge base for ${topic}`;
      } else {
        return `No new information for ${topic}`;
      }
    } else {
      // Create new knowledge entry
      await this.notesClient.createNote(
        topic,
        `# ${topic}\n\n${information}`,
        [topic.toLowerCase(), 'knowledge'],
        'knowledge-base'
      );
      
      return `Added new knowledge about ${topic}`;
    }
  }
  
  isNewInformation(existingNote, newInformation) {
    // Implement logic to detect if information is new
    // This could use semantic comparison, text similarity, etc.
  }
  
  mergeInformation(existingContent, newInformation) {
    // Implement logic to merge information intelligently
    // This could preserve structure, remove duplicates, etc.
  }
}
```

### Pattern 3: Multi-Agent Collaboration

Enable multiple agents to collaborate on shared notes.

```python
class ResearchAgent:
    def __init__(self, api_url, api_key):
        self.notes_client = NotesClient(api_url, api_key)
    
    def research_topic(self, topic):
        # Perform research on the topic...
        research_results = self.perform_research(topic)
        
        # Create a research note
        self.notes_client.create_note(
            f"Research: {topic}",
            f"# Research: {topic}\n\n{research_results}",
            [topic.lower(), "research"],
            "topics"
        )
        
        return f"Research on {topic} complete and stored"
    
    def perform_research(self, topic):
        # Implementation of research functionality
        pass

class WritingAgent:
    def __init__(self, api_url, api_key):
        self.notes_client = NotesClient(api_url, api_key)
    
    def create_article(self, topic):
        # Find research notes on this topic
        research_notes = self.notes_client.search_notes(
            keyword=topic,
            tags=["research"]
        )
        
        if not research_notes:
            return f"No research found on {topic}"
        
        # Use research to generate an article
        article_content = self.generate_article(topic, research_notes)
        
        # Create an article note
        self.notes_client.create_note(
            f"Article: {topic}",
            article_content,
            [topic.lower(), "article"],
            "projects"
        )
        
        return f"Article on {topic} created"
    
    def generate_article(self, topic, research_notes):
        # Implementation to generate an article from research
        pass
```

## Best Practices

### 1. Error Handling

Always implement proper error handling in your integration code:

```python
try:
    notes = client.search_notes(keyword="machine learning")
except requests.exceptions.RequestException as e:
    print(f"Error searching notes: {e}")
    # Implement fallback behavior
```

### 2. Connection Pooling

For high-volume integrations, use connection pooling:

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

session = requests.Session()
retry = Retry(total=3, backoff_factor=0.5)
adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=20)
session.mount('http://', adapter)
session.mount('https://', adapter)

# Use session in your client
```

### 3. Caching

For frequently accessed notes, implement a caching layer:

```python
import time

class CachedNotesClient:
    def __init__(self, base_client, cache_ttl=300):  # 5 minute cache
        self.client = base_client
        self.cache = {}
        self.cache_ttl = cache_ttl
    
    def get_note(self, note_id):
        now = time.time()
        
        if note_id in self.cache:
            cached_time, note = self.cache[note_id]
            if now - cached_time < self.cache_ttl:
                return note
        
        # Cache miss or expired
        note = self.client.get_note(note_id)
        self.cache[note_id] = (now, note)
        return note
```

### 4. Rate Limiting

Implement client-side rate limiting to avoid overloading the API:

```python
import time

class RateLimitedClient:
    def __init__(self, base_client, requests_per_minute=60):
        self.client = base_client
        self.rate_limit = requests_per_minute
        self.interval = 60.0 / requests_per_minute
        self.last_request_time = 0
    
    def _rate_limit(self):
        now = time.time()
        elapsed = now - self.last_request_time
        
        if elapsed < self.interval:
            sleep_time = self.interval - elapsed
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def create_note(self, *args, **kwargs):
        self._rate_limit()
        return self.client.create_note(*args, **kwargs)
    
    # Implement other methods with rate limiting
```

### 5. Logging

Implement comprehensive logging to troubleshoot integration issues:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='notes_client.log'
)

class LoggedNotesClient:
    def __init__(self, base_client):
        self.client = base_client
        self.logger = logging.getLogger('notes_client')
    
    def create_note(self, title, content, tags=None, category="topics"):
        self.logger.info(f"Creating note: {title} in {category}")
        try:
            result = self.client.create_note(title, content, tags, category)
            self.logger.info(f"Created note with ID: {result.get('id')}")
            return result
        except Exception as e:
            self.logger.error(f"Error creating note: {e}")
            raise
```

## Security Considerations

### API Key Management

- Store API keys in environment variables or a secure secrets manager
- Use different API keys for different agents with appropriate permissions
- Rotate API keys periodically

### Content Validation

- Validate and sanitize content before sending to the API
- Implement checks for sensitive information

### Communication Security

- Use HTTPS for all API communication
- Implement certificate validation

## Conclusion

By following this guide, you can integrate AI agents with the Notes System to create a persistent memory layer for your AI applications. This enables more context-aware interactions, knowledge accumulation, and multi-agent collaboration.