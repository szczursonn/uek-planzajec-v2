FROM node:23.3-slim

# Create app directory
WORKDIR /usr/src/app

# Copy source code
COPY . .

# Install git (necessary for build)
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git

# Install app dependencies
RUN npm install

# Build
RUN npm run build

EXPOSE 3000
CMD [ "npm", "start" ]