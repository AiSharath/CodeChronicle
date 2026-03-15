FROM node:20

WORKDIR /CodeChronicle

# copy backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# copy project folders
COPY backend ./backend
COPY debugger ./debugger
COPY docker ./docker

WORKDIR /CodeChronicle/backend

EXPOSE 3000

CMD ["node","server.js"]