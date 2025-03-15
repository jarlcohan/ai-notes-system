# AI Notes System: Quick Start Guide

This guide will help you quickly set up the AI Notes System in various environments.

## What You'll Need

- A server or cloud environment
- Basic knowledge of the command line
- Docker (recommended) or Node.js 18+

## Installation Options

Choose the installation option that best fits your environment:

### 1. Local Development Setup

```
┌────────────────┐
│                │
│  Your Computer │
│                │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  AI Notes API  │
│   (localhost)  │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  Notes Folder  │
│                │
└────────────────┘
```

**Steps:**

```bash
# Clone the repository
git clone https://github.com/example/ai-notes-system
cd ai-notes-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env file to set NOTES_DIR to your desired path

# Start the server
npm start
```

The API will be available at http://localhost:3000

### 2. Docker Desktop Installation

Perfect for development and testing on your local machine.

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

### 3. Ubuntu/Debian Server Setup

For a production environment on a Linux server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
sudo apt install -y docker.io
sudo systemctl enable --now docker

# Create a notes directory
sudo mkdir -p /opt/ai-notes
sudo chown $USER:$USER /opt/ai-notes

# Run the container
docker run -d \
  --name ai-notes-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/ai-notes:/app/notes \
  -e API_KEYS='{"prod-key-1":"research","prod-key-2":"writing"}' \
  example/ai-notes-system:latest
```

### 4. Amazon EC2 Installation

```
┌────────────────┐
│                │
│  Amazon EC2    │
│  Instance      │
│                │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  AI Notes API  │
│   (Container)  │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  EBS Volume    │
│  (Notes Data)  │
└────────────────┘
```

**Steps:**

1. Launch an EC2 instance (t3.small or larger recommended)
2. Connect to your instance via SSH
3. Install Docker:

```bash
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user
# Log out and back in for group changes to take effect
```

4. Create a data directory and run the container:

```bash
mkdir -p ~/ai-notes-data
docker run -d \
  --name ai-notes-api \
  --restart unless-stopped \
  -p 80:3000 \
  -v ~/ai-notes-data:/app/notes \
  -e API_KEYS='{"ec2-key":"admin"}' \
  example/ai-notes-system:latest
```

5. Configure security groups to allow HTTP traffic on port 80

### 5. Google Cloud Run Deployment

Serverless deployment with automatic scaling:

```
┌────────────────┐
│                │
│  Cloud Run     │
│  Service       │
│                │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  AI Notes API  │
│   (Container)  │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  Cloud Storage │
│  (Notes Data)  │
└────────────────┘
```

**Steps:**

1. Build and push your container:

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Build the container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ai-notes-api

# Deploy to Cloud Run
gcloud run deploy ai-notes-api \
  --image gcr.io/YOUR_PROJECT_ID/ai-notes-api \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NOTES_STORAGE=gcs,GCS_BUCKET=your-notes-bucket,API_KEYS={\"gcp-key\":\"admin\"}"
```

2. Create a Cloud Storage bucket for notes:

```bash
gsutil mb gs://your-notes-bucket
```

### 6. Kubernetes Deployment

For scalable, orchestrated deployments:

1. Create a Kubernetes deployment file (`deployment.yaml`):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-notes-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-notes-api
  template:
    metadata:
      labels:
        app: ai-notes-api
    spec:
      containers:
      - name: ai-notes-api
        image: example/ai-notes-system:latest
        ports:
        - containerPort: 3000
        env:
        - name: API_KEYS
          valueFrom:
            secretKeyRef:
              name: ai-notes-secrets
              key: api-keys
        volumeMounts:
        - name: notes-storage
          mountPath: /app/notes
      volumes:
      - name: notes-storage
        persistentVolumeClaim:
          claimName: notes-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: ai-notes-api
spec:
  selector:
    app: ai-notes-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

2. Create a secret for API keys:

```bash
kubectl create secret generic ai-notes-secrets \
  --from-literal=api-keys='{"k8s-key-1":"research","k8s-key-2":"writing"}'
```

3. Create a persistent volume claim for notes storage:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: notes-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

4. Apply the configuration:

```bash
kubectl apply -f deployment.yaml
kubectl apply -f pvc.yaml
```

## Verifying Your Installation

After installation, test your API with:

```bash
# Replace with your actual API key and URL
curl -X GET http://localhost:3000/health \
  -H "X-API-Key: your-api-key"
```

You should see a response like:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "storage": {
    "type": "local",
    "path": "/app/notes"
  }
}
```

## Connecting AI Agents

### Python Example

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
    "http://localhost:3000",  # Replace with your API URL
    "your-api-key"            # Replace with your API key
)

# Create a new note
client.create_note(
    "My First Note",
    "This is a test note created via the API.",
    ["test", "example"]
)
```

### Node.js Example

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
  'http://localhost:3000',  // Replace with your API URL
  'your-api-key'            // Replace with your API key
);

// Create a note
client.createNote(
  'My First Note',
  'This is a test note created via the API.',
  ['test', 'example']
);
```

## Next Steps

- Set up secure HTTPS access using a reverse proxy like Nginx
- Implement automated backups of your notes repository
- Create additional agent-specific API keys with appropriate permissions
- Explore the full API documentation for advanced features

For more detailed information, refer to the full documentation.