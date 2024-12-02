FROM node:23.3-slim

# Create app directory
WORKDIR /usr/src/app

# Copy source code
COPY . .

# Install app dependencies
RUN npm install

# Build
RUN npm run build

EXPOSE 3000
CMD [ "npm", "start" ]