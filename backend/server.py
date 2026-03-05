"""
FastAPI server that exposes both agents via CopilotKit / AG-UI protocol.
- Research Assistant (LangGraph) at /copilotkit
- Travel Planner (ADK) at /adk
"""

import os
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from copilotkit import CopilotKitRemoteEndpoint, LangGraphAgent
from ag_ui_adk import add_adk_fastapi_endpoint

from agents.research_agent import graph
from agents.travel_agent import travel_agent

# Load environment variables
load_dotenv()

# --- FastAPI App ---
app = FastAPI(
    title="AG-UI & A2UI Demo",
    description="Example project demonstrating AG-UI and A2UI protocols with LangGraph and ADK agents",
    version="1.0.0",
)

# CORS - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Health Check ---
@app.get("/health")
async def health():
    return {"status": "ok", "agents": ["research_assistant", "travel_planner"]}


# --- CopilotKit Remote Endpoint for LangGraph Agent ---
# This uses the AG-UI protocol for the Research Assistant
copilotkit_endpoint = CopilotKitRemoteEndpoint(
    agents=[
        LangGraphAgent(
            name="research_assistant",
            description="A research assistant that can search the web and provide information on any topic.",
            graph=graph,
        ),
    ],
)

# Mount the CopilotKit endpoint
app.mount("/copilotkit", copilotkit_endpoint.as_asgi_app())


# --- ADK Endpoint for Travel Agent ---
# This uses the AG-UI protocol (with A2UI capabilities) for the Travel Planner
add_adk_fastapi_endpoint(app, travel_agent, path="/adk")


# --- Run Server ---
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
