# AG-UI & A2UI Demo Project

Available in: [Español](README.es.md)

This project is a demonstration of the **AG-UI** (Agent-User Interaction) and **A2UI** (Agent-to-UI) protocols using CopilotKit, LangGraph (Research Assistant), and Google ADK (Travel Planner).

## Requirements

- **Node.js 20+**
- **Python 3.12+**
- **uv** (Python package installer)
- **Podman** or **Docker**
- **Google API Key** (Gemini)

## Structure

- `backend/`: FastAPI server with LangGraph and ADK agents.
- `frontend/`: Next.js application with CopilotKit and custom UI components.

## Setup

1.  Copy the `.env.example` file to `.env` in the root of the project.
2.  Add your `GOOGLE_API_KEY`.

```bash
GOOGLE_API_KEY=your_api_key_here
```

## Running with Podman/Docker (Recommended)

From the project root:

```bash
podman-compose up --build
# or
docker-compose up --build
```

The application will be available at:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/health](http://localhost:8000/health)

## Local Development

### Backend
```bash
cd backend
uv sync
uv run python server.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Demo Features

1.  **Research Assistant (LangGraph + AG-UI)**:
    - Real-time chat with streaming.
    - Tool to change the chat background (`change_background`).
    - Tool to check the weather (`get_weather`) with custom rendering.

2.  **Travel Planner (ADK + A2UI)**:
    - Chat with A2UI capabilities (Declarative UI components).
    - Destination discovery with visual cards (`get_destinations`).
    - Interactive booking confirmation (`book_trip`).

## Security Note
Some moderate vulnerabilities in sub-dependencies (e.g., PrismJS) are present. Running `npm audit fix --force` is **not recommended** as it would downgrade CopilotKit to obsolete versions (0.2.x), breaking the modern AG-UI integration.
