# frontend/Dockerfile
# --- Stage 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# --- Stage 2: Production ---
FROM nginx:alpine
# react-scripts outputs to build/, not dist/
COPY --from=builder /app/build /usr/share/nginx/html
# Single-origin mode: with REACT_APP_API_URL=/api the browser calls
# same-origin /api/..., and nginx proxies them to the backend.
# nginx:alpine renders /etc/nginx/templates/*.template with envsubst at
# container start, so BACKEND_UPSTREAM is runtime config, not baked in.
ENV BACKEND_UPSTREAM=http://backend-node:5000
# Docker embedded DNS. Override where it differs, e.g. Cloud Run sidecar:
# NGINX_RESOLVER=169.254.169.254
ENV NGINX_RESOLVER=127.0.0.11
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
