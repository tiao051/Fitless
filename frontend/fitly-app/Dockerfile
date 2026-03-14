FROM node:20-alpine

WORKDIR /app

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose Expo dev server port
EXPOSE 19000
EXPOSE 19001

# Start Expo dev server
CMD ["expo", "start", "--tunnel"]
