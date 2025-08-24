# Dockerfile for Node.js web server and client
FROM node:22-slim

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN echo "  Installing Node dependencies..." \
    && npm install \
    && echo "  Node dependencies installed."

# Install Python for AI service on Debian-based slim image
RUN echo "  Installing Python prerequisites..." \
    && echo "    Updating apt repositories..." \
    && apt-get update \
    && echo "    Installing python3, venv, pip..." \
    && apt-get install -y python3 python3-venv python3-pip \
    && echo "    Cleaning apt lists..." \
    && rm -rf /var/lib/apt/lists/* \
    && echo "  Python prerequisites installed."

# Set up Python virtual environment for AI service
RUN echo "  Creating Python virtual environment..." \
    && python3 -m venv /app/venv \
    && echo "  Virtual environment created."
ENV PATH="/app/venv/bin:$PATH"

# Copy the rest of the application code
COPY . .

# Install Python and Node dependencies via npm script
RUN echo "  Running setup (npm install & pip install)..." \
    && npm run setup \
    && echo "  Setup completed."

# Expose both API and AI ports
EXPOSE 3000 5001

# Start the development server (includes client + API via ViteExpress)
CMD ["sh", "-c", "npm run setup && npm run start:both"]
