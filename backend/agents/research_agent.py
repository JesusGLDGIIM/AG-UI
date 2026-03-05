"""
Research Assistant Agent - Built with LangGraph + CopilotKit.
Demonstrates the AG-UI protocol for streaming agent responses to the frontend.
Uses langchain.agents.create_agent with CopilotKitMiddleware.
"""

import json
import random

from langchain.agents import create_agent
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from copilotkit import CopilotKitMiddleware, CopilotKitState


# --- Simulated Research Tools ---

@tool
def search_web(query: str) -> str:
    """Search the web for information about a topic. Returns relevant results.

    Args:
        query: The search query to look up.
    """
    results_db = {
        "quantum computing": [
            "Quantum computing uses quantum bits (qubits) that can exist in superposition, enabling parallel computation.",
            "Google's Willow chip achieved a major milestone in quantum error correction in 2024.",
            "IBM plans to deliver a 100,000-qubit system by 2033.",
            "Quantum computers could revolutionize drug discovery, cryptography, and optimization problems.",
        ],
        "artificial intelligence": [
            "Large Language Models (LLMs) like GPT-4 and Gemini have shown remarkable reasoning capabilities.",
            "AI agents are becoming increasingly autonomous, capable of using tools and making decisions.",
            "The AI industry is expected to reach $1.8 trillion by 2030.",
            "Multimodal AI systems can process text, images, audio, and video simultaneously.",
        ],
        "climate change": [
            "Global temperatures have risen by approximately 1.1°C since pre-industrial times.",
            "The Paris Agreement aims to limit warming to 1.5°C above pre-industrial levels.",
            "Renewable energy sources now account for over 30% of global electricity generation.",
            "Carbon capture technologies are being developed to remove CO2 from the atmosphere.",
        ],
        "space exploration": [
            "NASA's Artemis program aims to return humans to the Moon and eventually Mars.",
            "SpaceX's Starship is the largest and most powerful rocket ever built.",
            "The James Webb Space Telescope has revealed unprecedented details about distant galaxies.",
            "Private space tourism is becoming a growing industry with companies like Blue Origin and Virgin Galactic.",
        ],
    }

    query_lower = query.lower()
    for key, results in results_db.items():
        if key in query_lower:
            selected = random.sample(results, min(3, len(results)))
            return json.dumps({
                "query": query,
                "results": selected,
                "source": "Simulated Web Search",
            })

    return json.dumps({
        "query": query,
        "results": [
            f"Research shows that '{query}' is an active area of study with multiple ongoing developments.",
            f"Recent publications indicate growing interest in {query} across academic and industry sectors.",
            f"Experts predict significant advances in {query} within the next 5 years.",
        ],
        "source": "Simulated Web Search",
    })


@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location. This is a backend tool whose rendering can be handled by the frontend.

    Args:
        location: The city or location to get weather for.
    """
    conditions = ["Sunny", "Partly Cloudy", "Clear Skies", "Light Rain", "Warm and Humid"]
    temp = random.randint(15, 35)
    condition = random.choice(conditions)

    return json.dumps({
        "city": location,
        "temperature": temp,
        "humidity": random.randint(40, 80),
        "wind_speed": random.randint(5, 25),
        "conditions": condition,
    })


# --- Build the LangGraph Agent ---

memory = MemorySaver()

graph = create_agent(
    model="google_genai:gemini-3-flash-preview",
    tools=[search_web, get_weather],
    middleware=[CopilotKitMiddleware()],
    system_prompt=(
        "You are a helpful Research Assistant. Your job is to help users "
        "find and summarize information on any topic.\n\n"
        "- Use the search_web tool to find information when asked about a topic.\n"
        "- Use the get_weather tool when asked about weather conditions.\n"
        "- Always provide well-structured, informative responses.\n"
        "- When presenting research results, organize them clearly with headings "
        "and bullet points.\n"
        "- Be enthusiastic about sharing knowledge!"
    ),
    checkpointer=memory,
    state_schema=CopilotKitState,
)
