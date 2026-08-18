FROM node:20-alpine

WORKDIR /CodeChronicle

COPY backend/package*.json ./backend/
COPY debugger/package*.json ./debugger/
RUN cd backend && npm ci --omit=dev
RUN cd debugger && npm ci --omit=dev

COPY backend ./backend
COPY debugger ./debugger
COPY docker ./docker

WORKDIR /CodeChronicle/backend

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
