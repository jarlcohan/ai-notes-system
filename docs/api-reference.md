# API Reference

This document provides detailed information about the AI Notes System API endpoints, request parameters, and response formats.

## Base URL

All API endpoints are relative to the base URL of your deployed instance:

```
http://localhost:3000/
```

## Authentication

All API requests require authentication using an API key. The API key should be included in the `X-API-Key` header.

```
X-API-Key: your-api-key
```

## Endpoints

### Health Check

```
GET /health
```

Returns the current status of the API and system information.

#### Response

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "storage": {
    "type": "local",
    "path": "/app/notes"
  },
  "uptime": 3600
}
```

### List Notes

```
GET /notes
```

Returns a list of notes, with optional filtering by tags, category, and keyword.

#### Query Parameters

| Parameter | Type   | Description                                    |
|-----------|--------|------------------------------------------------|
| tags      | string | Comma-separated list of tags to filter by      |
| category  | string | Category to filter by (e.g., "topics")         |
| keyword   | string | Text to search for in note content             |

#### Response

```json
[
  {
    "id": "topics/2025-03-15_quantum_computing.md",
    "title": "Quantum Computing",
    "path": "/app/notes/topics/2025-03-15_quantum_computing.md",
    "content": "Content of the note...",
    "metadata": {
      "date": "2025-03-15",
      "tags": ["quantum", "physics", "computing"],
      "related": [],
      "author": "Research Agent"
    }
  },
  {
    "id": "topics/2025-03-14_artificial_intelligence.md",
    "title": "Artificial Intelligence",
    "path": "/app/notes/topics/2025-03-14_artificial_intelligence.md",
    "content": "Content of the note...",
    "metadata": {
      "date": "2025-03-14",
      "tags": ["ai", "machine-learning"],
      "related": [],
      "author": "Research Agent"
    }
  }
]
```

### Get Note

```
GET /notes/{id}
```

Returns a specific note by ID.

#### Parameters

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| id        | string | The ID of the note to retrieve       |

#### Response

```json
{
  "id": "topics/2025-03-15_quantum_computing.md",
  "title": "Quantum Computing",
  "path": "/app/notes/topics/2025-03-15_quantum_computing.md",
  "content": "Content of the note...",
  "metadata": {
    "date": "2025-03-15",
    "tags": ["quantum", "physics", "computing"],
    "related": [],
    "author": "Research Agent"
  }
}
```

### Create Note

```
POST /notes
```

Creates a new note.

#### Request Body

```json
{
  "title": "Quantum Computing",
  "content": "Content of the note...",
  "tags": ["quantum", "physics", "computing"],
  "category": "topics"
}
```

| Field    | Type   | Required | Description                                        |
|----------|--------|----------|----------------------------------------------------|
| title    | string | Yes      | The title of the note                              |
| content  | string | Yes      | The content of the note (markdown format)          |
| tags     | array  | No       | Array of tags for categorization                   |
| category | string | No       | Category folder (default: "topics")                |

#### Response

```json
{
  "id": "topics/2025-03-15_quantum_computing.md",
  "title": "Quantum Computing",
  "path": "/app/notes/topics/2025-03-15_quantum_computing.md",
  "created": "2025-03-15"
}
```

### Update Note

```
PUT /notes/{id}
```

Updates an existing note.

#### Parameters

| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| id        | string | The ID of the note to update          |

#### Request Body

```json
{
  "title": "Updated Quantum Computing",
  "content": "Updated content...",
  "tags": ["quantum", "physics", "computing", "updated"]
}
```

| Field    | Type   | Required | Description                                       |
|----------|--------|----------|---------------------------------------------------|
| title    | string | No       | The new title of the note                         |
| content  | string | No       | The new content of the note (markdown format)     |
| tags     | array  | No       | New array of tags for categorization              |

#### Response

```json
{
  "id": "topics/2025-03-15_quantum_computing.md",
  "title": "Updated Quantum Computing",
  "updated": "2025-03-15"
}
```

### Delete/Archive Note

```
DELETE /notes/{id}
```

Deletes or archives a note.

#### Parameters

| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| id        | string | The ID of the note to delete/archive  |

#### Query Parameters

| Parameter | Type    | Description                                        |
|-----------|---------|---------------------------------------------------|
| archive   | boolean | If true, moves the note to archive instead of deleting (default: false) |

#### Response (when archiving)

```json
{
  "message": "Note archived",
  "id": "archive/2025-03-15_quantum_computing.md"
}
```

#### Response (when deleting)

```json
{
  "message": "Note deleted"
}
```

### Append to Note

```
POST /notes/{id}/append
```

Appends content to an existing note.

#### Parameters

| Parameter | Type   | Description                           |
|-----------|--------|---------------------------------------|
| id        | string | The ID of the note to append to       |

#### Request Body

```json
{
  "content": "Content to append..."
}
```

| Field   | Type   | Required | Description                        |
|---------|--------|----------|------------------------------------|
| content | string | Yes      | The content to append to the note  |

#### Response

```json
{
  "id": "topics/2025-03-15_quantum_computing.md",
  "message": "Content appended successfully"
}
```

### Advanced Search

```
POST /notes/search
```

Performs an advanced search with filters.

#### Request Body

```json
{
  "query": "quantum",
  "filters": {
    "tags": ["physics", "research"],
    "category": "topics",
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-03-15"
    }
  }
}
```

| Field          | Type   | Required | Description                                |
|----------------|--------|----------|--------------------------------------------|
| query          | string | Yes      | Search query text                          |
| filters        | object | No       | Additional filters                         |
| filters.tags   | array  | No       | Tags to filter by                          |
| filters.category | string | No     | Category to filter by                      |
| filters.dateRange | object | No    | Date range with start and end dates        |

#### Response

```json
[
  {
    "id": "topics/2025-03-15_quantum_computing.md",
    "title": "Quantum Computing",
    "path": "/app/notes/topics/2025-03-15_quantum_computing.md",
    "content": "Content of the note...",
    "metadata": {
      "date": "2025-03-15",
      "tags": ["quantum", "physics", "computing"],
      "related": [],
      "author": "Research Agent"
    }
  }
]
```

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200 OK`: The request succeeded
- `201 Created`: The resource was successfully created
- `400 Bad Request`: The request was invalid
- `401 Unauthorized`: Missing API key
- `403 Forbidden`: Invalid API key or insufficient permissions
- `404 Not Found`: The requested resource was not found
- `500 Internal Server Error`: Server error

Error responses include a JSON object with an error message:

```json
{
  "error": "Description of the error"
}
```

## Permissions

API access is controlled by roles associated with API keys. The available roles are:

- `admin`: Full access to all operations
- `research`: Can create, read, update, and search notes, but cannot delete them
- `writing`: Can create, read, update, delete, and search notes
- `analytics`: Read-only access, can only read and search notes