# Bloom

[![Node.js CI](https://github.com/youssef20031/Bloom/workflows/Node.js%20CI/badge.svg)](https://github.com/youssef20031/Bloom/actions/workflows/node.js.yml)
[![Docker Build](https://github.com/youssef20031/Bloom/workflows/Docker%20Build%20and%20Push/badge.svg)](https://github.com/youssef20031/Bloom/actions/workflows/docker-build.yml)

A modern React and Node.js web application built with Vite.

## Features

- React 19+ frontend
- Express.js backend
- Python AI service integration
- Vite build system
- Hot reloading for development
- Automated Docker builds

## Getting Started

### Prerequisites

- Node.js (18.x, 20.x, or 22.x)
- npm
- Python 3.10+ (for AI service)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm ci
   ```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Docker Deployment

For containerized deployment, see [DOCKER.md](./DOCKER.md) for detailed instructions.

Quick start with Docker Compose:
```bash
docker-compose up
```

## Build Status

The project uses GitHub Actions for:
- **Continuous Integration**: Testing on Node.js versions 18.x, 20.x, and 22.x
- **Docker Builds**: Automated building and publishing of Docker images