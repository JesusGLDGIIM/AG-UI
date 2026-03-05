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

// Import Google Fonts (Inter)
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";

type AgentType = "research" | "travel";

export default function Home() {
  const [activeAgent, setActiveAgent] = useState<AgentType>("research");

  return (
    <div className={`app-container ${activeAgent}-theme`}>
      {/* Premium Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <h1 className="app-title">
              <span className="emoji">✨</span> AG-UI Nexus
            </h1>
            <p className="app-subtitle">
              Advanced Agentic Interface • LangGraph & Google ADK
            </p>
          </div>

          <div className="agent-selector">
            <button
              className={`agent-btn research-active ${activeAgent === "research" ? "active" : ""}`}
              onClick={() => setActiveAgent("research")}
            >
              <span className="agent-icon">🔬</span>
              <div className="agent-info">
                <span className="agent-label">Research</span>
                <span className="agent-tech">LangGraph</span>
              </div>
            </button>
            <button
              className={`agent-btn travel-active ${activeAgent === "travel" ? "active" : ""}`}
              onClick={() => setActiveAgent("travel")}
            >
              <span className="agent-icon">✈️</span>
              <div className="agent-info">
                <span className="agent-label">Travel</span>
                <span className="agent-tech">ADK</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Experience Area */}
      <main className="chat-area">
        <CopilotKit
          key={activeAgent}
          runtimeUrl={`/api/copilotkit/${activeAgent}`}
          showDevConsole={false}
          agent={activeAgent === "travel" ? "travel" : "research"}
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
          <div className="destination-card loading">
            <div className="weather-loading">
              <span className="spinner"></span>
              Exploring {args.region}...
            </div>
          </div>
        );
      }
      const data = typeof result === "string" ? JSON.parse(result) : result;
      return (
        <div className="destinations-container">
          <h4 style={{ marginBottom: "1rem", color: "var(--text-muted)" }}>
            Popular Picks in {data?.region || args.region}
          </h4>
          <div className="destinations-grid">
            {data?.destinations?.map((dest: any, i: number) => (
              <div key={i} className="destination-card">
                <span className="dest-name">{dest.name}</span>
                <span className="stat-label">Rating: {dest.rating} ⭐</span>
                <ul className="dest-highlights">
                  {dest.highlights?.map((h: string, j: number) => (
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

  // Render tool: book trip
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
              Securing your booking for {args.destination}...
            </div>
          </div>
        );
      }
      const data = typeof result === "string" ? JSON.parse(result) : result;
      return (
        <div className="booking-conf">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ color: "#4ade80" }}>Booking Confirmed! ✅</h3>
            <span className="stat-label">#{data?.booking_id}</span>
          </div>
          <div className="conf-details">
            <div className="conf-row">
              <span className="stat-label">Destination</span>
              <span className="stat-value">{data?.destination || args.destination}</span>
            </div>
            <div className="conf-row">
              <span className="stat-label">Dates</span>
              <span className="stat-value">{data?.dates || args.dates}</span>
            </div>
            <div className="conf-row">
              <span className="stat-label">Travelers</span>
              <span className="stat-value">{data?.travelers || args.travelers}</span>
            </div>
            <div className="conf-row" style={{ marginTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.5rem" }}>
              <span className="stat-label">Total Paid ({data?.currency})</span>
              <span className="stat-value" style={{ color: "#4ade80", fontSize: "1.2rem" }}>
                ${data?.total_price}
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
