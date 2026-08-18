# CodeChronicle — Time Travel Debugger

A developer tool that lets you replay JavaScript execution like a video.
Step forward and backward through your code to inspect variable state at every line.

## Features
- Step-by-step code execution with time-travel slider
- Variable state inspection at each step
- Line highlighting in Monaco Editor
- Supports if statements, for loops, while loops

## Tech Stack
- Frontend: React + Vite + Monaco Editor
- Backend: Node.js + Express
- Execution Engine: AST instrumentation with Acorn

## Production-ready updates in this repository
- Backend is configurable through environment variables
- Health endpoint available at `GET /health`
- Request payload validation, execution timeout, and capped output buffer
- Frontend serves through Nginx and proxies `/api/*` to backend
- Docker Compose deployment for full stack

## Configuration
Backend supports the following environment variables:
- `PORT` (default: `3000`)
- `NODE_ENV` (default: `development`)
- `RUNNER_MODE` (`process` or `docker`, default: `process`)
- `RUNNER_IMAGE` (default: `debugger-sandbox`, used only in `docker` mode)
- `ALLOWED_ORIGINS` (comma-separated list; empty allows all)
- `MAX_CODE_SIZE` (default: `50000` bytes)
- `EXEC_TIMEOUT_MS` (default: `5000`)
- `EXEC_MAX_BUFFER` (default: `1048576` bytes)

## Local development
### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deploy with Docker Compose
From repository root:
```bash
docker compose up --build -d
```

Application URL:
- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:8080/api/health`

Stop services:
```bash
docker compose down
```

## Optional sandboxed execution mode
For stronger isolation, run backend with `RUNNER_MODE=docker` and build the runner image:
```bash
docker build -t debugger-sandbox ./docker
```
This mode requires the backend runtime to have access to Docker.
