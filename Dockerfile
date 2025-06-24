# 1. Base Image: Use an official Node.js image.
# We're using a specific version for consistency.
FROM node:18-alpine

# 2. Set Working Directory: Create a directory inside the container.
WORKDIR /app

# 3. Copy package files and install dependencies.
# This step is separated to leverage Docker's layer caching.
# Dependencies are only re-installed if package.json or package-lock.json changes.
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 4. Copy Application Code: Copy the rest of your Next.js app into the container.
COPY . .

# 5. Build the Application: Run the Next.js build command.
RUN npm run build

# 6. Expose Port: The Next.js app runs on port 3000 by default.
EXPOSE 3000

# 7. Start Command: The command to run when the container starts.
# We use "next start" to run the optimized production server.
CMD ["npm", "start"] 



