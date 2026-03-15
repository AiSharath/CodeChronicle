# CodeChronicle — Time Travel Debugger

A developer tool that lets you replay JavaScript execution like a video.
Step forward and backward through your code to inspect variable state at every line.

## Features
- Step-by-step code execution with time-travel slider
- Variable state inspection at each step
- Line highlighting in Monaco Editor
- Supports if statements, for loops, while loops
- Docker sandboxed execution for security

## Tech Stack
- Frontend: React + Vite + Monaco Editor
- Backend: Node.js + Express
- Execution Engine: AST instrumentation with Acorn
- Sandbox: Docker
