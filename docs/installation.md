# Installation Guide

This guide provides detailed instructions for installing and configuring the AI Notes System in various environments.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 7.0.0 or higher
- **Storage**: Minimum 1GB of disk space for the application and notes

## Option 1: Docker Installation (Recommended)

Docker provides the simplest way to deploy the AI Notes System.

### Prerequisites

- Docker Engine 20.10.0 or higher
- Docker Compose (optional, for multi-container deployments)

### Steps

1. **Pull the Image**

   ```bash
   docker pull example/ai-notes-system:latest
   ```

   Alternatively, you can build the image locally:

   ```bash
   git clone https://github.com/yourusername/ai-notes-system.git
   cd ai-notes-system
   docker build -t ai-notes-system .
   ```

2. **Create a Notes Directory**

   Create a directory on your host machine to store the notes:

   ```bash
   mkdir -p ~/ai-notes
   ```

3. **Run the Container**

   ```bash
   docker run -d \
     --name ai-notes-api \
     -p 3000:3000 \
     -v ~/ai-notes:/app/notes \
     -e API_KEYS='{"research-key":"research","writing-key":"writing","admin-key":"admin"}' \
     example/ai-notes-system:latest
   ```

   This command:
   - Names the container `ai-notes-api`
   - Maps port 3000 on the host to port 3000 in the container
   - Mounts the local notes directory to `/app/notes` in the container
   - Sets environment variables for API keys

4. **Verify Installation**

   ```bash
   curl -X GET http://localhost:3000/health \
     -H "X-API-Key: admin-key"
   ```

   You should receive a response indicating the service is healthy.

### Docker Compose Setup

For a more complete setup with persistent data, create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  ai-notes-api:
    image: example/ai-notes-system:latest
    container_name: ai-notes-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_KEYS={"research-key":"research","writing-key":"writing","admin-key":"admin"}
    volumes:
      - ai-notes-data:/app/notes
    restart: unless-stopped

volumes:
  ai-notes-data:
```

Run with:

```bash
docker-compose up -d
```

## Option 2: Direct Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm 7.0.0 or higher
- Git (for cloning the repository)

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/ai-notes-system.git
   cd ai-notes-system
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your preferred text editor:

   ```bash
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

4. **Create Notes Directory**

   ```bash
   mkdir -p notes
   ```

5. **Start the Server**

   For development:

   ```bash
   npm run dev
   ```

   For production:

   ```bash
   npm start
   ```

6. **Verify Installation**

   The server should start and display a message indicating it's running on port 3000.

   ```bash
   curl -X GET http://localhost:3000/health \
     -H "X-API-Key: admin-key"
   ```

## Option 3: Cloud Deployments

### Amazon EC2 Deployment

1. **Launch an EC2 Instance**
   - Recommended: t3.small or larger
   - Amazon Linux 2 or Ubuntu 20.04+

2. **Connect to your instance**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Install Docker**
   ```bash
   # For Amazon Linux 2
   sudo yum update -y
   sudo amazon-linux-extras install docker -y
   sudo service docker start
   sudo systemctl enable docker
   sudo usermod -a -G docker ec2-user
   # Log out and back in for group changes to take effect
   ```

4. **Create data directory and run container**
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

5. **Configure security groups to allow HTTP traffic on port 80**

### Google Cloud Run Deployment

1. **Install Google Cloud SDK and authenticate**

2. **Build and push the container**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ai-notes-api
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy ai-notes-api \
     --image gcr.io/YOUR_PROJECT_ID/ai-notes-api \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars="NOTES_STORAGE=gcs,GCS_BUCKET=your-notes-bucket,API_KEYS={\"gcp-key\":\"admin\"}"
   ```

4. **Create a Cloud Storage bucket for notes**
   ```bash
   gsutil mb gs://your-notes-bucket
   ```

### Microsoft Azure App Service Deployment

1. **Create an Azure App Service with Docker support**

2. **Configure environment variables in the Azure Portal**
   - `API_KEYS`: JSON string of API keys and roles
   - `NOTES_DIR`: Path for notes storage

3. **Set up Continuous Deployment from your GitHub repository**

## Security Considerations

### API Key Management

API keys are passed as environment variables in a JSON string format. In production:

1. **Use a Secret Management Service**
   - AWS: Use AWS Secrets Manager
   - GCP: Use Google Secret Manager
   - Azure: Use Azure Key Vault

2. **Rotate Keys Regularly**
   - Implement a key rotation policy
   - Update environment variables when keys change

### Secure Storage

1. **Backup Strategy**
   - Implement regular backups of the notes directory
   - Consider using a versioned storage solution (S3, GCS, etc.)

2. **Encryption**
   - Use encrypted volumes for note storage
   - Consider encrypting sensitive notes at rest

### Networking

1. **HTTPS**
   - In production, always use HTTPS
   - Set up a reverse proxy like Nginx with Let's Encrypt certificates

2. **Firewall Rules**
   - Restrict access to the API server
   - Consider IP whitelisting for agent access

## Troubleshooting

### Common Issues

1. **Container won't start**
   - Check if port 3000 is already in use
   - Verify the notes directory has correct permissions

2. **API key rejection**
   - Ensure the API_KEYS environment variable is properly formatted as JSON
   - Check if the key is included in the X-API-Key header

3. **Notes directory issues**
   - Ensure the mounted volume exists and has write permissions
   - Check that the NOTES_DIR environment variable is correctly set

### Logs

Access container logs:

```bash
docker logs ai-notes-api
```

For direct installation:

```bash
npm run dev
```

Will show logs in the console.