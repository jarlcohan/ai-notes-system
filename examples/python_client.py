# Example AI Agent Client for Notes API

import requests
import json
from datetime import datetime

class NotesAPIClient:
    """Client for interacting with the AI Notes API."""
    
    def __init__(self, base_url, api_key, agent_name):
        """Initialize the Notes API client.
        
        Args:
            base_url: The base URL of the Notes API
            api_key: The API key for authentication
            agent_name: The name of the agent using this client
        """
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }
        self.agent_name = agent_name
    
    def create_note(self, title, content, tags=None, category="topics"):
        """Create a new note.
        
        Args:
            title: The title of the note
            content: The content of the note
            tags: List of tags for categorization
            category: The category folder (topics, projects, etc.)
            
        Returns:
            The created note data or None if creation failed
        """
        if tags is None:
            tags = []
            
        payload = {
            "title": title,
            "content": content,
            "tags": tags,
            "category": category
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/notes",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error creating note: {e}")
            return None
    
    def search_notes(self, keyword=None, tags=None, category=None):
        """Search for notes based on criteria.
        
        Args:
            keyword: Text to search for in note content
            tags: List of tags to filter by
            category: Category to filter by
            
        Returns:
            List of matching notes or empty list if search failed
        """
        params = {}
        if keyword:
            params['keyword'] = keyword
        if tags:
            params['tags'] = ','.join(tags)
        if category:
            params['category'] = category
            
        try:
            response = requests.get(
                f"{self.base_url}/notes",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error searching notes: {e}")
            return []
    
    def append_to_note(self, note_id, content):
        """Append content to an existing note.
        
        Args:
            note_id: The ID of the note to append to
            content: The content to append
            
        Returns:
            True if successful, False otherwise
        """
        payload = {
            "content": content
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/notes/{note_id}/append",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error appending to note: {e}")
            return False


# Example usage in a Research Agent
class ResearchAgent:
    """Example agent that gathers information and stores it in the Notes system."""
    
    def __init__(self, api_url, api_key):
        self.notes_client = NotesAPIClient(
            api_url,
            api_key,
            "Research Agent"
        )
    
    def research_topic(self, topic):
        """Research a topic and store findings."""
        print(f"Researching topic: {topic}")
        
        # In a real agent, this would involve web searches, data analysis, etc.
        # For this example, we'll simulate gathering some information
        
        # First, check if we already have notes on this topic
        existing_notes = self.notes_client.search_notes(keyword=topic)
        
        if existing_notes:
            print(f"Found existing notes on {topic}")
            # Append new information to existing note
            note_id = existing_notes[0]['id']
            today = datetime.now().strftime("%Y-%m-%d")
            
            new_content = f"\n\n## Update ({today})\nNew research findings for {topic}:\n"
            new_content += f"- Example finding 1\n- Example finding 2\n"
            
            self.notes_client.append_to_note(note_id, new_content)
            return f"Updated existing note on {topic}"
        else:
            # Create a new note for this topic
            title = f"Research: {topic}"
            content = f"""## Overview
Initial research on {topic}.

## Key Findings
- Example finding 1
- Example finding 2

## Sources
- Example source 1
- Example source 2
"""
            tags = [topic.lower(), "research", "initial"]
            result = self.notes_client.create_note(title, content, tags)
            
            if result:
                return f"Created new research note on {topic}"
            else:
                return f"Failed to create note on {topic}"


# Example usage
if __name__ == "__main__":
    # In a real system, these would come from environment variables or config
    API_URL = "http://localhost:3000"
    API_KEY = "research-agent-key"
    
    agent = ResearchAgent(API_URL, API_KEY)
    
    # Example research operation
    result = agent.research_topic("Quantum Computing")
    print(result)
    
    # Another research operation
    result = agent.research_topic("Machine Learning Ethics")
    print(result)