# backend/Dockerfile
# node:sqlite (DatabaseSync) needs Node 22.5+; use 24 LTS to match local dev.
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
