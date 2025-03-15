# Directory Structure

This document outlines the directory structure of the AI Notes System, explaining the purpose of each directory and file.

## Repository Structure

```
ai-notes-system/
├── src/                     # Source code
│   ├── index.js             # Main application entry point
│   ├── controllers/         # API route controllers
│   ├── middleware/          # Express middleware
│   ├── models/              # Data models
│   ├── routes/              # API route definitions
│   └── utils/               # Utility functions
│
├── docs/                    # Documentation
│   ├── images/              # Documentation images
│   ├── api-reference.md     # API endpoint documentation
│   ├── system-documentation.md  # Overall system documentation
│   ├── installation.md      # Installation guide
│   ├── directory-structure.md   # This file
│   └── agent-integration.md # Guide for AI agent integration
│
├── examples/                # Example code
│   ├── python_client.py     # Python client example
│   └── javascript_client.js # JavaScript client example
│
├── config/                  # Configuration files
│
├── notes/                   # Default notes directory (gitignored)
│   ├── topics/              # Subject-based notes
│   ├── projects/            # Project-specific notes
│   ├── references/          # Reference materials
│   └── archive/             # Archived notes
│
├── .env.example             # Example environment variables
├── .gitignore               # Git ignore configuration
├── LICENSE                  # License file
├── package.json             # Node.js package configuration
├── README.md                # Project overview
└── Dockerfile               # Docker container definition
```

## Notes Directory Structure

The `notes/` directory is where all notes are stored. This directory is usually mounted as a volume when using Docker, or configured via the `NOTES_DIR` environment variable.

```
notes/
├── topics/                  # Subject-based notes
│   ├── 2025-03-15_quantum_computing.md
│   ├── 2025-03-15_artificial_intelligence.md
│   └── ...
│
├── projects/                # Project-specific notes
│   ├── 2025-03-15_project_alpha.md
│   ├── 2025-03-15_project_beta.md
│   └── ...
│
├── references/              # Reference materials
│   ├── 2025-03-15_api_documentation.md
│   ├── 2025-03-15_research_paper.md
│   └── ...
│
└── archive/                # Archived notes
    ├── 2025-02-15_old_project.md
    └── ...
```

## Note File Format

Each note is stored as a Markdown file with YAML frontmatter for metadata:

```markdown
---
date: 2025-03-15
tags: [tag1, tag2, tag3]
related: [related_note_1, related_note_2]
author: Agent Name
---

# Note Title

## Section 1
Content of section 1...

## Section 2
Content of section 2...
```

## Source Code Structure

### src/index.js

The main entry point for the application. It initializes the Express server, sets up middleware, and connects the routes.

### src/controllers/

Contains the logic for handling API requests, separated by resource type:

- `notesController.js`: Handles CRUD operations for notes

### src/middleware/

Contains Express middleware functions:

- `auth.js`: Authentication middleware for API key validation
- `errorHandler.js`: Global error handling middleware

### src/models/

Contains data models and interfaces with the storage layer:

- `noteModel.js`: Functions for note operations (create, read, update, delete)

### src/routes/

Contains API route definitions:

- `notesRoutes.js`: Routes for note-related endpoints
- `healthRoutes.js`: Routes for health check endpoints

### src/utils/

Contains utility functions used throughout the application:

- `fileUtils.js`: Utilities for file operations
- `yamlParser.js`: Utilities for parsing YAML frontmatter

## Configuration

### .env.example

Example environment variables used for configuration:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Notes Directory
NOTES_DIR=./notes

# API Keys (JSON format)
API_KEYS={"research-key":"research","writing-key":"writing","admin-key":"admin"}

# Storage Configuration
STORAGE_TYPE=local
```

### config/ directory

Contains configuration files for different environments:

- `default.js`: Default configuration
- `development.js`: Development environment configuration
- `production.js`: Production environment configuration

## Docker Setup

### Dockerfile

Defines the Docker container:

- Uses Node.js Alpine as the base image
- Installs dependencies
- Copies application files
- Sets environment variables
- Exposes port 3000
- Defines the entry point

The Docker container creates a `/app/notes` directory that should be mounted as a volume to persist notes data.

## Examples

### examples/python_client.py

Example Python client implementation for interacting with the Notes API.

### examples/javascript_client.js

Example JavaScript/Node.js client implementation for interacting with the Notes API.

## Documentation

### docs/api-reference.md

Comprehensive documentation of all API endpoints, request parameters, and response formats.

### docs/system-documentation.md

Overview of the entire system, including architecture, key features, and use cases.

### docs/installation.md

Step-by-step guide for installing and configuring the AI Notes System.

### docs/agent-integration.md

Guide for integrating AI agents with the Notes System, including client libraries and implementation patterns.

### docs/directory-structure.md

This file, explaining the directory structure of the project.