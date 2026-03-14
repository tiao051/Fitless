FROM node:20-alpine

WORKDIR /app

# Clear npm cache
RUN npm cache clean --force

# Copy package files
COPY package*.json ./

# Install dependencies (suppress audit warnings)
RUN npm install --audit=false

# Copy app source
COPY . .

# Expose Expo dev server port
EXPOSE 19000
EXPOSE 19001

# Start Expo dev server in LAN mode (no interactive input needed)
CMD ["npm", "start", "--silent", "--", "--lan"]
