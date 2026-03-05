"""
Travel Planner Agent - Built with Google ADK + AG-UI.
Demonstrates the A2UI protocol for generating declarative UI components.
Uses ADKAgent from ag_ui_adk for AG-UI integration.
"""

import json
import random

from google.adk.agents import LlmAgent
from ag_ui_adk import ADKAgent, AGUIToolset


# --- Simulated Travel Tools ---

def get_destinations(region: str) -> str:
    """Get popular travel destinations for a given region.

    Args:
        region: The region to search destinations for (e.g., 'Asia', 'Europe', 'Americas').
    """
    destinations_db = {
        "asia": [
            {"name": "Tokyo, Japan", "rating": 4.8, "price_range": "$$$",
             "highlights": ["Temples", "Street Food", "Cherry Blossoms", "Tech Culture"]},
            {"name": "Bali, Indonesia", "rating": 4.7, "price_range": "$$",
             "highlights": ["Beaches", "Rice Terraces", "Surfing", "Yoga Retreats"]},
            {"name": "Bangkok, Thailand", "rating": 4.6, "price_range": "$",
             "highlights": ["Street Markets", "Temples", "Night Life", "Thai Cuisine"]},
        ],
        "europe": [
            {"name": "Barcelona, Spain", "rating": 4.7, "price_range": "$$$",
             "highlights": ["Gaudí Architecture", "Beaches", "Tapas", "Nightlife"]},
            {"name": "Prague, Czech Republic", "rating": 4.6, "price_range": "$$",
             "highlights": ["Old Town", "Castle", "Beer Culture", "History"]},
            {"name": "Santorini, Greece", "rating": 4.9, "price_range": "$$$$",
             "highlights": ["Sunsets", "Volcanic Beaches", "Wine", "White Architecture"]},
        ],
        "americas": [
            {"name": "Cancún, Mexico", "rating": 4.5, "price_range": "$$",
             "highlights": ["Beaches", "Mayan Ruins", "Snorkeling", "Resorts"]},
            {"name": "New York City, USA", "rating": 4.7, "price_range": "$$$$",
             "highlights": ["Broadway", "Central Park", "Museums", "Food Scene"]},
            {"name": "Machu Picchu, Peru", "rating": 4.9, "price_range": "$$",
             "highlights": ["Inca Ruins", "Hiking", "Mountains", "History"]},
        ],
    }

    region_lower = region.lower()
    for key, destinations in destinations_db.items():
        if key in region_lower:
            return json.dumps({
                "region": region,
                "destinations": destinations,
                "count": len(destinations),
            })

    all_destinations = []
    for dests in destinations_db.values():
        all_destinations.extend(dests)
    selected = random.sample(all_destinations, min(3, len(all_destinations)))
    return json.dumps({
        "region": region,
        "destinations": selected,
        "count": len(selected),
    })


def get_weather(city: str) -> str:
    """Get the current weather forecast for a city.

    Args:
        city: The name of the city to get weather for.
    """
    weather_conditions = ["Sunny", "Partly Cloudy", "Clear Skies", "Light Rain", "Warm and Humid"]
    temp = random.randint(18, 35)
    condition = random.choice(weather_conditions)

    return json.dumps({
        "city": city,
        "temperature": temp,
        "humidity": random.randint(40, 80),
        "wind_speed": random.randint(5, 20),
        "conditions": condition,
        "forecast": f"{condition} with a high of {temp}°C",
    })


def book_trip(destination: str, dates: str, travelers: int) -> str:
    """Book a trip to a destination (simulated).

    Args:
        destination: The destination city/place to book.
        dates: The travel dates (e.g., '2026-04-15 to 2026-04-22').
        travelers: Number of travelers.
    """
    booking_id = f"BK-{random.randint(10000, 99999)}"
    price_per_person = random.randint(500, 3000)
    total_price = price_per_person * travelers

    return json.dumps({
        "booking_id": booking_id,
        "destination": destination,
        "dates": dates,
        "travelers": travelers,
        "price_per_person": price_per_person,
        "total_price": total_price,
        "currency": "USD",
        "status": "confirmed",
        "message": f"Trip to {destination} booked successfully! Booking ID: {booking_id}",
    })


# --- Create ADK Agent ---

travel_llm_agent = LlmAgent(
    name="travel",
    model="google_genai:gemini-3-flash-preview",
    description="A helpful travel planning assistant that helps users discover destinations, check weather, and book trips.",
    instruction=(
        "You are a friendly and knowledgeable Travel Planner assistant. "
        "Help users plan their perfect vacation by:\n"
        "1. Suggesting destinations based on their preferences using the get_destinations tool.\n"
        "2. Providing weather information using the get_weather tool.\n"
        "3. Helping them book trips using the book_trip tool.\n\n"
        "Always be enthusiastic about travel and provide helpful tips. "
        "When presenting destinations, describe each one vividly with emojis. "
        "Present results in a well-organized format.\n"
        "If the user greets you, greet them back warmly and ask where they'd like to travel."
    ),
    tools=[
        get_destinations,
        get_weather,
        book_trip,
        AGUIToolset(),  # Enables AG-UI client-provided tools
    ],
)

# Wrap in ADKAgent for AG-UI protocol support
travel_agent = ADKAgent(
    adk_agent=travel_llm_agent,
    app_name="travel_demo",
    user_id="demo_user",
    session_timeout_seconds=3600,
    use_in_memory_services=True,
)
