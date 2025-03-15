# AI Notes System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Docker](https://img.shields.io/badge/docker-supported-blue.svg)

A flexible knowledge management platform that enables AI agents to create, organize, and retrieve notes from conversations. It provides a centralized repository for storing thoughts, ideas, and information discovered through AI interactions.

<p align="center">
  <img src="docs/images/system-diagram.png" alt="AI Notes System Diagram" width="600"/>
</p>

## 🚀 Key Features

- **Persistent Memory**: Store and retrieve information across multiple conversations
- **Organization**: Automatic categorization and structured storage
- **Continuity**: Pick up where you left off on previous topics
- **Collaboration**: Multiple AI agents can contribute to the same knowledge base
- **Accessibility**: RESTful API for easy integration

## 📋 Table of Contents

- [Installation](#-installation)
  - [Docker](#docker-installation-recommended)
  - [Direct Installation](#direct-installation)
  - [Cloud Deployment](#cloud-deployment)
- [Usage](#-usage)
  - [API Endpoints](#api-endpoints)
  - [Agent Integration](#agent-integration)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## 🔧 Installation

### Docker Installation (Recommended)

```bash
# Pull the image
docker pull example/ai-notes-system:latest

# Create a notes directory
mkdir -p ~/ai-notes

# Run the container
docker run -d \
  --name ai-notes-api \
  -p 3000:3000 \
  -v ~/ai-notes:/app/notes \
  -e API_KEYS='{"test-key":"admin"}' \
  example/ai-notes-system:latest
```

### Direct Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-notes-system.git
cd ai-notes-system

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env file with your configuration

# Start the server
npm start
```

### Cloud Deployment

For deployment on AWS, GCP, or Kubernetes, see our [Deployment Guide](docs/deployment.md).

## 🔍 Usage

### API Endpoints

```
POST /notes
- Create new note
- Body: {title, content, tags, category}

GET /notes
- List notes with optional filters
- Query params: tags, category, dateRange, keywords

GET /notes/{id}
- Retrieve specific note

PUT /notes/{id}
- Update existing note
- Body: {title, content, tags, category}

DELETE /notes/{id}
- Archive or delete note

POST /notes/search
- Advanced search functionality
- Body: {query, filters}

POST /notes/{id}/append
- Append to existing note
- Body: {content}
```

### Agent Integration

#### Python Example

```python
import requests

class NotesClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }
    
    def create_note(self, title, content, tags=None):
        payload = {
            "title": title,
            "content": content,
            "tags": tags or []
        }
        response = requests.post(
            f"{self.base_url}/notes",
            headers=self.headers,
            json=payload
        )
        return response.json()

# Usage
client = NotesClient(
    "http://localhost:3000",
    "your-api-key"
)

# Create a new note
client.create_note(
    "Quantum Computing",
    "Notes about quantum computing concepts.",
    ["quantum", "physics", "computing"]
)
```

#### JavaScript Example

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
  
  async createNote(title, content, tags = []) {
    const response = await axios.post(
      `${this.baseUrl}/notes`,
      { title, content, tags },
      { headers: this.headers }
    );
    return response.data;
  }
}

// Usage
const client = new NotesClient(
  'http://localhost:3000',
  'your-api-key'
);

// Create a note
client.createNote(
  'Machine Learning Basics',
  'Introduction to ML concepts and algorithms.',
  ['ml', 'ai', 'beginners']
);
```

## 📚 Documentation

- [System Documentation](docs/system-documentation.md)
- [API Reference](docs/api-reference.md)
- [Installation Guide](docs/installation.md)
- [Directory Structure](docs/directory-structure.md)
- [Agent Integration Guide](docs/agent-integration.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ✨ Acknowledgements

- Express.js for the web framework
- Markdown for the note format
- All the contributors who have helped this project

---

<p align="center">
  Made with ❤️ for AI agent development
</p>