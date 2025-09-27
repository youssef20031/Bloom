# Docker Deployment Guide

This repository includes automated Docker image building through GitHub Actions.

## Available Docker Images

### Main Application Image
- **Image**: `ghcr.io/youssef20031/bloom:latest`
- **Contains**: Node.js frontend/backend + Python AI service
- **Ports**: 3000 (web), 5001 (AI service)

### AI Service Image
- **Image**: `ghcr.io/youssef20031/bloom-ai:latest`
- **Contains**: Python Flask AI service only
- **Ports**: 5001

## Automated Builds

Docker images are automatically built and pushed to GitHub Container Registry when:

- Code is pushed to `master`, `Youssef_Branch`, or `Radwan_Branch`
- New tags are created (e.g., `v1.0.0`)
- Pull requests are opened to `master` (build only, no push)

## Image Tags

- `latest`: Latest build from master branch
- `<branch-name>`: Latest build from specific branch
- `<branch-name>-<sha>`: Specific commit SHA
- `v<version>`: Release versions (when tagged)

## Local Development

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Commands

```bash
# Build main application
docker build -t bloom .

# Build AI service
docker build -t bloom-ai -f Dockerfile.ai .

# Run main application
docker run -p 3000:3000 -p 5001:5001 bloom

# Run AI service only
docker run -p 5001:5001 bloom-ai
```

## Production Deployment

### Pull from Registry

```bash
# Pull latest images
docker pull ghcr.io/youssef20031/bloom:latest
docker pull ghcr.io/youssef20031/bloom-ai:latest

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -p 5001:5001 \
  -e MONGODB_URI=mongodb://your-mongo-host:27017/bloom \
  --name bloom-app \
  ghcr.io/youssef20031/bloom:latest
```

### Environment Variables

- `NODE_ENV`: Set to `production` for production deployment
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Override default port (3000)

## Troubleshooting

### Build Issues
- Check GitHub Actions logs for build failures
- Verify Dockerfile syntax
- Ensure all dependencies are properly specified

### Runtime Issues
- Check container logs: `docker logs <container-name>`
- Verify environment variables are set correctly
- Ensure required services (MongoDB) are accessible