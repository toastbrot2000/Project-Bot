FROM node:20-alpine

# Set working directory
WORKDIR /opt/app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./

# Install dependencies
# We use --prod false to ensure devDependencies (like typescript) are installed for the build step
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build the Strapi admin panel
RUN pnpm build

# Expose the Strapi port
EXPOSE 1337

# Start the application
CMD ["pnpm", "start"]
