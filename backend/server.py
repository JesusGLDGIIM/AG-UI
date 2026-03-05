"""
FastAPI server that exposes both agents via CopilotKit / AG-UI protocol.
- Research Assistant (LangGraph) at /copilotkit
- Travel Planner (ADK) at /adk
"""

import os
import sys

# Ensure we use the .venv site-packages
# This is a workaround for issues with the OCI runtime not activating the venv properly
venv_path = "/app/.venv/lib/python3.12/site-packages"
if os.path.exists(venv_path) and venv_path not in sys.path:
    sys.path.insert(0, venv_path)
    print(f"DEBUG: Prepended {venv_path} to sys.path")

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import warnings

from copilotkit.integrations.fastapi import add_fastapi_endpoint
from copilotkit import CopilotKitRemoteEndpoint, LangGraphAGUIAgent
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

# Silence experimental warnings from ag_ui_adk and google-adk
warnings.filterwarnings("ignore", category=UserWarning, message=".*EXPERIMENTAL.*")

from agents.research_agent import graph
from agents.travel_agent import travel_agent

# Monkey-patch LangGraphAGUIAgent and ADKAgent to add missing dict_repr method
# This is a workaround for discovery bugs in the current SDK versions
def universal_dict_repr(self):
    # Try to find a name/id in various locations
    name = getattr(self, "name", None)
    if not name:
        # Check for adk_agent or _adk_agent (private)
        adk = getattr(self, "adk_agent", getattr(self, "_adk_agent", None))
        if adk:
            name = getattr(adk, "name", None)
    
    # Fallback based on type/context if still none
    if not name:
        if "travel" in str(type(self)).lower() or "travel" in str(getattr(self, "__module__", "")).lower():
            name = "travel"
        else:
            name = "research"

    d = {
        "id": name,
        "name": name,
        "description": getattr(self, "description", "") or getattr(getattr(self, "adk_agent", getattr(self, "_adk_agent", {})), "description", ""),
        "type": "agent",
    }
    print(f"DEBUG: dict_repr for {name}: {d}")
    return d

if not hasattr(LangGraphAGUIAgent, "dict_repr"):
    LangGraphAGUIAgent.dict_repr = universal_dict_repr
    print("DEBUG: Monkey-patched LangGraphAGUIAgent")

if not hasattr(ADKAgent, "dict_repr"):
    ADKAgent.dict_repr = universal_dict_repr
    print("DEBUG: Monkey-patched ADKAgent")

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
    return {"status": "ok", "agents": ["research", "travel"]}


# --- CopilotKit Remote Endpoint for both Agents ---
# This uses the AG-UI protocol for both Research and Travel agents
research_assistant = LangGraphAGUIAgent(
    name="research",
    description="A research assistant that can search the web and provide information on any topic.",
    graph=graph,
)

copilotkit_endpoint = CopilotKitRemoteEndpoint(
    agents=[
        research_assistant,
        travel_agent, # ADKAgent is compatible with CopilotKitRemoteEndpoint
    ],
)

# Add the CopilotKit endpoint to the FastAPI app for DISCOVERY ONLY (/copilotkit/info)
add_fastapi_endpoint(app, copilotkit_endpoint, prefix="/copilotkit")

# --- Native AG-UI Endpoints for EXECUTION ---
add_langgraph_fastapi_endpoint(app, research_assistant, path="/research")
add_adk_fastapi_endpoint(app, travel_agent, path="/travel")


# --- Run Server ---
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
