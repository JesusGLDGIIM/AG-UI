import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Copilot Runtime proxy route.
 * Forwards requests from the CopilotKit frontend to the appropriate backend agent.
 * Handles subpaths (like /info) and supports both GET and POST.
 * 
 * Routes:
 * - /api/copilotkit/research/[[...path]] -> Backend /copilotkit/[[...path]] (LangGraph)
 * - /api/copilotkit/travel/[[...path]] -> Backend /adk/[[...path]] (ADK)
 */
async function handler(
    req: NextRequest,
    { params }: { params: Promise<{ integrationId: string; path?: string[] }> }
) {
    const { integrationId, path } = await params;

    // Both agents are now consolidated in the single /copilotkit/ runtime
    // for standard CopilotKit discovery.
    const backendBase = "/copilotkit/";

    // Construct the subpath correctly
    const subpath = path ? path.join("/") : "";

    // Ensure we don't end up with double slashes but maintain the trailing slash for the base
    const backendUrl = `${BACKEND_URL}${backendBase}${subpath}${req.nextUrl.search}`;

    // Forward all headers except host and connection
    const headers = new Headers();
    req.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "host" && key.toLowerCase() !== "connection") {
            headers.set(key, value);
        }
    });

    console.log(`Proxying ${req.method} ${req.url} -> ${backendUrl}`);

    try {
        const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

        const response = await fetch(backendUrl, {
            method: req.method,
            headers,
            body,
            // Follow redirects to handle any remaining 307s internally
            redirect: "follow",
        });

        const contentType = response.headers.get("Content-Type") || "";

        // Stream the response back to the client only if it's an event-stream
        if (contentType.includes("text/event-stream") && response.body) {
            return new NextResponse(response.body, {
                status: response.status,
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    Connection: "keep-alive",
                },
            });
        }

        // For JSON or other responses (like /info or handshakes), buffer the body
        // and return it as a standard response. This is crucial for agent discovery.
        let data = await response.json().catch(() => ({}));

        // Protocol Translation (v0 Backend -> v1 Frontend)
        // Newer CopilotKit versions expect 'agents' to be a map/object, not an array.
        // If we see an array and it's a discovery request, transform it.
        if (data && Array.isArray(data.agents)) {
            console.log("Transforming agents array to object for v1 compatibility");
            const agentsMap: Record<string, any> = {};
            data.agents.forEach((agent: any) => {
                const id = agent.id || agent.name || "unknown";
                agentsMap[id] = agent;
            });
            data.agents = agentsMap;
        }

        console.log(`Backend response from ${backendUrl}:`, JSON.stringify(data, null, 2));

        // Return JSON with original status and relevant headers
        return NextResponse.json(data, {
            status: response.status,
            headers: {
                "Content-Type": "application/json",
            }
        });

    } catch (error) {
        console.error(`Error proxying to ${backendUrl}:`, error);
        return NextResponse.json(
            { error: "Failed to connect to backend", details: (error as Error).message, target: backendUrl },
            { status: 502 }
        );
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
