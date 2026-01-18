
# Base image with full TeX Live distribution
FROM texlive/texlive:latest

# Install Node.js and dependencies
# Updates apt-get and installs nodejs and npm
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs build-essential

# Set working directory for the app
WORKDIR /app

# Copy the application (renamed to app)
COPY app ./app

# Copy the TeX assets to a known location
# We place it in /app/tex so that ../tex logic from /app/app works
COPY tex ./tex

# Install dependencies and build the Next.js app
WORKDIR /app/app
RUN npm install
RUN npx prisma generate
RUN npm run build

# Set Environment Variables
ENV NODE_ENV=production
ENV IS_CONTAINERIZED=true
# Point to where we copied 'tex' relative to the app execution
ENV RESUME_ASSETS_PATH=/app

# Database volume should be handled by docker-compose or run command
# For SQLite, we need to ensure the file exists or is created in a volume

# Expose Next.js port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
