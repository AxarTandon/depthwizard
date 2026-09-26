FROM node:20-alpine AS base
WORKDIR /app

# NEXT_PUBLIC_* variables are inlined into the client bundle at `next build`
# time, not read at container-start time. They must arrive as build ARGs
# (passed via docker-compose `build.args`) and be exported as ENV before the
# build step runs, or the shipped frontend silently falls back to demo mode
# even when the backend is fully configured.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_USE_BACKEND
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_USE_BACKEND=$NEXT_PUBLIC_USE_BACKEND

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
