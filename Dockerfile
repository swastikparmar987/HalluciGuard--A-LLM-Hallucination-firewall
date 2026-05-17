# ==========================================
# Stage 1: Build the React frontend
# ==========================================
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# Install dependencies first (for docker caching)
COPY frontend/package*.json ./
RUN npm install

# Copy source and build static assets
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Serve React via Nginx and run FastAPI
# ==========================================
FROM python:3.11-slim
WORKDIR /app

# Install Nginx and other process utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/
# Copy configuration files and entrypoint
COPY nginx.conf /etc/nginx/conf.d/default.conf
# On some Debian platforms, the default sites-enabled/default overrides conf.d
# Let's remove it if it exists to ensure our default.conf is respected
RUN rm -f /etc/nginx/sites-enabled/default

# Copy entrypoint script and make it executable
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Copy built frontend static assets from Stage 1 into Nginx default html directory
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Expose Nginx port 80
EXPOSE 80

# Environment defaults
ENV PORT=80
ENV ALLOWED_ORIGINS="*"
ENV ENABLE_SMART_EVAL="true"

# Launch Gunicorn and Nginx together
ENTRYPOINT ["/app/entrypoint.sh"]
