FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Vite only embeds VITE_* env vars that exist at build time - must declare as ARG
# and export to ENV before running the build.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 5173

# Cloud platforms (Railway, Render, etc.) inject $PORT dynamically - fall back
# to 5173 for local docker-compose where the port is fixed.
CMD ["sh", "-c", "serve -s dist -l ${PORT:-5173}"]
