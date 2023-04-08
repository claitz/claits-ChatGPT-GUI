# ---- FRONTEND ----
# Import the base image
FROM node:19-alpine as frontend-build

# Set the working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy the package.json and pnpm-lock.yaml files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install the dependencies
RUN pnpm install -P

# Copy the rest of the files
COPY . .

# Build the frontend
RUN pnpm run build

# ---- BACKEND ----
# Import the base image
FROM node:19-alpine as backend-build

# Set the working directory
WORKDIR /app

# Install and pnpm
RUN npm install -g pnpm

# Copy the package.json and pnpm-lock.yaml files
COPY /server/package*.json ./
COPY /server/pnpm-lock.yaml ./

# Install the dependencies
RUN pnpm install -P

# Install serve to serve the frontend
RUN npm install -g serve

# Copy the backend files
COPY  /server/Server.js .

# Copy the build directory from the frontend-build stage
COPY --from=frontend-build /app/build /app/build

# Expose the port on which the backend will listen and the frontend will be served
EXPOSE 3001
EXPOSE 5000

# Start the server and serve the frontend
CMD ["sh", "-c", "node Server.js & serve -s /app/build -l 5000"]