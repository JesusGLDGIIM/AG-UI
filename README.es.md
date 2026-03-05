# AG-UI & A2UI Demo Project

Disponible en: [English](README.md)

Este proyecto es una demostración de los protocolos **AG-UI** (Agent-User Interaction) y **A2UI** (Agent-to-UI) utilizando CopilotKit, LangGraph (Research Assistant) y Google ADK (Travel Planner).

## Requisitos

- **Node.js 20+**
- **Python 3.12+**
- **uv** (instalador de paquetes de Python)
- **Podman** o **Docker**
- **Google API Key** (Gemini)

## Estructura

- `backend/`: Servidor FastAPI con agentes LangGraph y ADK.
- `frontend/`: Aplicación Next.js con CopilotKit y componentes de UI personalizados.

## Configuración

1.  Copia el archivo `.env.example` a `.env` en la raíz del proyecto.
2.  Añade tu `GOOGLE_API_KEY`.

```bash
GOOGLE_API_KEY=tu_api_key_aqui
```

## Ejecución con Podman/Docker (Recomendado)

Desde la raíz del proyecto:

```bash
podman-compose up --build
# o
docker-compose up --build
```

La aplicación estará disponible en:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/health](http://localhost:8000/health)

## Ejecución Local (Desarrollo)

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

## Características de la Demostración

1.  **Research Assistant (LangGraph + AG-UI)**:
    - Chat en tiempo real con streaming.
    - Herramienta para cambiar el fondo del chat (`change_background`).
    - Herramienta para consultar el clima (`get_weather`) con renderizado personalizado.

2.  **Travel Planner (ADK + A2UI)**:
    - Chat con capacidades A2UI (Componentes UI declarativos).
    - Descubrimiento de destinos con tarjetas visuales (`get_destinations`).
    - Confirmación de reservas interactiva (`book_trip`).
