# Use an official Node.js runtime as a parent image
FROM node:16-alpine3.14

# Set the working directory to /app
WORKDIR /app

# Copy the main app's package.json and package-lock.json files to the container
COPY package*.json ./

# Install dependencies for the main app
RUN npm install --omit=dev

# Copy the main app files to the container
COPY . .

# Build the frontend for the main app
RUN npm run build

# Switch to the server directory
WORKDIR /app/server

# Copy the server package.json and package-lock.json files to the container
COPY server/package*.json ./

# Install dependencies for the server
RUN npm install --omit=dev

# Copy the server files to the container
COPY server/ .

# Expose the port on which the server will listen
EXPOSE 3000

# Start the server with --experimental-modules flag
CMD ["node", "--experimental-modules", "server.js"]
