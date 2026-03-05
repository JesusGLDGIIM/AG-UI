"use client";

import React, { useState } from "react";
import "@copilotkit/react-core/v2/styles.css";
import {
  useFrontendTool,
  useRenderTool,
  useConfigureSuggestions,
  CopilotChat,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";

type AgentType = "research" | "travel";

export default function Home() {
  const [activeAgent, setActiveAgent] = useState<AgentType>("research");

  return (
    <div className="app-container">
      {/* Agent Selector Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="emoji">🤖</span> AG-UI & A2UI Demo
          </h1>
          <p className="app-subtitle">
            Demonstrating AG-UI and A2UI protocols with LangGraph & ADK agents
          </p>
          <div className="agent-selector">
            <button
              className={`agent-btn ${activeAgent === "research" ? "active research-active" : ""}`}
              onClick={() => setActiveAgent("research")}
            >
              <span className="agent-icon">🔬</span>
              <span className="agent-label">Research Assistant</span>
              <span className="agent-tech">LangGraph + AG-UI</span>
            </button>
            <button
              className={`agent-btn ${activeAgent === "travel" ? "active travel-active" : ""}`}
              onClick={() => setActiveAgent("travel")}
            >
              <span className="agent-icon">✈️</span>
              <span className="agent-label">Travel Planner</span>
              <span className="agent-tech">ADK + A2UI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area - re-mount on agent change */}
      <main className="chat-area">
        <CopilotKit
          key={activeAgent}
          runtimeUrl={`/api/copilotkit/${activeAgent}`}
          showDevConsole={false}
          agent={activeAgent === "research" ? "research_assistant" : "travel_planner"}
        >
          <ChatInterface agentType={activeAgent} />
        </CopilotKit>
      </main>
    </div>
  );
}

function ChatInterface({ agentType }: { agentType: AgentType }) {
  const [background, setBackground] = useState<string>("");

  // Frontend tool: change background color
  useFrontendTool({
    name: "change_background",
    description: "Change the background color of the chat area. Use CSS gradients for beautiful effects.",
    parameters: z.object({
      background: z.string().describe("CSS background value. Prefer beautiful gradients."),
    }),
    handler: async ({ background }: { background: string }) => {
      setBackground(background);
      return { status: "success", message: `Background changed to ${background}` };
    },
  });

  // Render tool: weather display (works with both agents' get_weather tool)
  useRenderTool({
    name: "get_weather",
    parameters: z.object({
      location: z.string().optional(),
      city: z.string().optional(),
    }),
    render: ({ args, result, status }: any) => {
      if (status !== "complete") {
        return (
          <div className="weather-card loading">
            <div className="weather-loading">
              <span className="spinner"></span>
              Loading weather for {args.location || args.city}...
            </div>
          </div>
        );
      }
      const data = typeof result === "string" ? JSON.parse(result) : result;
      return (
        <div className="weather-card">
          <div className="weather-header">
            <span className="weather-icon">
              {data?.conditions?.includes("Sunny") ? "☀️" :
                data?.conditions?.includes("Cloud") ? "⛅" :
                  data?.conditions?.includes("Rain") ? "🌧️" :
                    data?.conditions?.includes("Clear") ? "🌤️" : "🌡️"}
            </span>
            <h3>{data?.city || args.location || args.city}</h3>
          </div>
          <div className="weather-details">
            <div className="weather-stat">
              <span className="stat-label">Temperature</span>
              <span className="stat-value">{data?.temperature}°C</span>
            </div>
            <div className="weather-stat">
              <span className="stat-label">Humidity</span>
              <span className="stat-value">{data?.humidity}%</span>
            </div>
            <div className="weather-stat">
              <span className="stat-label">Wind Speed</span>
              <span className="stat-value">{data?.wind_speed || data?.windSpeed} mph</span>
            </div>
            <div className="weather-stat">
              <span className="stat-label">Conditions</span>
              <span className="stat-value">{data?.conditions}</span>
            </div>
          </div>
        </div>
      );
    },
  });

  // Render tool: travel destinations
  useRenderTool({
    name: "get_destinations",
    parameters: z.object({
      region: z.string(),
    }),
    render: ({ args, result, status }: any) => {
      if (status !== "complete") {
        return (
          <div className="weather-card loading">
            <div className="weather-loading">
              <span className="spinner"></span>
              Finding best destinations in {args.region}...
            </div>
          </div>
        );
      }
      const data = typeof result === "string" ? JSON.parse(result) : result;
      return (
        <div className="destinations-container">
          <h3 className="section-title">🌟 Top Picks for {data?.region}</h3>
          <div className="destinations-grid">
            {data?.destinations?.map((dest: any, i: number) => (
              <div key={i} className="destination-card">
                <div className="dest-name">{dest.name}</div>
                <div className="dest-rating">⭐ {dest.rating} • {dest.price_range}</div>
                <ul className="dest-highlights">
                  {dest.highlights.map((h: string, j: number) => (
                    <li key={j}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    },
  });

  // Render tool: booking confirmation
  useRenderTool({
    name: "book_trip",
    parameters: z.object({
      destination: z.string(),
      dates: z.string(),
      travelers: z.number(),
    }),
    render: ({ args, result, status }: any) => {
      if (status !== "complete") {
        return (
          <div className="booking-conf loading">
            <div className="weather-loading">
              <span className="spinner"></span>
              Confirming your booking to {args.destination}...
            </div>
          </div>
        );
      }
      const data = typeof result === "string" ? JSON.parse(result) : result;
      return (
        <div className="booking-conf">
          <div className="conf-header">
            <span className="weather-icon">✅</span>
            <h3>Booking Confirmed!</h3>
          </div>
          <div className="conf-details">
            <div className="conf-row">
              <span className="stat-label">Booking ID</span>
              <span className="stat-value">{data.booking_id}</span>
            </div>
            <div className="conf-row">
              <span className="stat-label">Destination</span>
              <span className="stat-value">{data.destination}</span>
            </div>
            <div className="conf-row">
              <span className="stat-label">Dates</span>
              <span className="stat-value">{data.dates}</span>
            </div>
            <div className="conf-row">
              <span className="stat-label">Travelers</span>
              <span className="stat-value">{data.travelers}</span>
            </div>
            <div className="conf-row">
              <span className="stat-label">Total Price</span>
              <span className="stat-value" style={{ color: "#4ade80", fontWeight: "bold" }}>
                {data.currency} {data.total_price.toLocaleString()}
              </span>
            </div>
          </div>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#94a3b8" }}>
            {data.message}
          </p>
        </div>
      );
    },
  });

  // Configure suggestions based on active agent
  useConfigureSuggestions({
    suggestions: agentType === "research"
      ? [
        { title: "🔍 Research topic", message: "Search for information about quantum computing" },
        { title: "🌤️ Check weather", message: "What's the weather like in Tokyo?" },
        { title: "🤖 AI trends", message: "What are the latest trends in artificial intelligence?" },
      ]
      : [
        { title: "🗺️ Find destinations", message: "Show me travel destinations in Europe" },
        { title: "✈️ Plan a trip", message: "Help me plan a trip to Tokyo" },
        { title: "🌤️ Check weather", message: "What's the weather like in Barcelona?" },
      ],
    available: "always",
  });

  return (
    <div
      className="chat-wrapper"
      style={background ? { background } : undefined}
    >
      <CopilotChat
        className="copilot-chat"
        labels={{
          welcomeMessageText: agentType === "research"
            ? "Hi! I'm your Research Assistant. I can search for information on any topic and check the weather. What would you like to know?"
            : "Hello! I'm your Travel Planner. I can help you discover destinations, check weather conditions, and book trips. Where would you like to go?",
          chatInputPlaceholder: "Type your message...",
        }}
      />
    </div>
  );
}
