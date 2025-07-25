# syntax=docker/dockerfile:1.7-labs

ARG NODE_VERSION=23.6.1

FROM node:alpine AS build

WORKDIR /client

COPY client ./
RUN npm install
RUN npm run build

FROM node:${NODE_VERSION}-alpine

# Copy client to build container
COPY --from=build /client/public /api-server/public

# Move local package.json files into the build container
COPY ./api-server/package.json ./api-server/package-lock.json /api-server/

# Set working directory, run the build script
WORKDIR /api-server/
RUN npm ci

COPY --exclude=./api-server/data --exclude=./api-server/node_modules ./api-server/ /api-server/
RUN npm run build

WORKDIR /api-server/build
RUN npm i --production
RUN npm i pino-pretty @mapbox/node-pre-gyp argon2

# Use production node environment by default
ENV NODE_ENV production

# Run the application as a non-root user
# USER node

# Static file server port
EXPOSE 80

# Run the application
CMD ["npm", "run", "start"]
