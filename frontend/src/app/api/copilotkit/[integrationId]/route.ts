import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Copilot Runtime proxy route.
 * Forwards requests from the CopilotKit frontend to the appropriate backend agent.
 * 
 * Routes:
 * - /api/copilotkit/research -> Backend /copilotkit (LangGraph Research Agent)
 * - /api/copilotkit/travel -> Backend /adk (ADK Travel Agent)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  const { integrationId } = await params;

  // Route to the correct backend endpoint based on integration ID
  let backendPath: string;
  switch (integrationId) {
    case "research":
      backendPath = "/copilotkit";
      break;
    case "travel":
      backendPath = "/adk";
      break;
    default:
      backendPath = "/copilotkit";
  }

  const backendUrl = `${BACKEND_URL}${backendPath}`;

  try {
    const body = await req.text();

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    // Stream the response back to the client
    if (response.body) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return NextResponse.json(
      { error: "No response body" },
      { status: 502 }
    );
  } catch (error) {
    console.error(`Error proxying to ${backendUrl}:`, error);
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 502 }
    );
  }
}
