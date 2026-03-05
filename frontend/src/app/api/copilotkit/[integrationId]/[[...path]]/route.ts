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

    // Forward all critical headers (auth, protocol, etc.)
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        // Drop headers that interfere with proxying or body rewriting
        if (lowerKey !== "connection" && lowerKey !== "content-length" && lowerKey !== "host") {
            headers[key] = value;
        }
    });

    console.log(`Proxying ${req.method} ${req.url} -> ${backendUrl}`);

    try {
        const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

        if (body) {
            console.log(`Payload sent to ${backendUrl}:`, body);
        }

        let finalBackendUrl = backendUrl;
        let finalBody = body;

        // --- DEEP PROTOCOL TRANSLATION (Frontend v1 -> Backend AG-UI Native) ---
        // The v1 React SDK sends actions embedded in a JSON envelope (e.g., {"method": "agent/run", "body": { ...RunAgentInput... }}).
        // CopilotKitRemoteEndpoint is used for DISCOVERY (/info) only.
        // For EXECUTION, we route directly to the native AG-UI FastAPI endpoints mounted at /research and /travel.
        if (req.method === "POST" && body) {
            try {
                const parsedBody = JSON.parse(body);
                const methodType = parsedBody.method;
                console.log(`[PROXY] Parse successful. Method type is: ${methodType}`);

                if (methodType === "info") {
                    finalBackendUrl = `${BACKEND_URL}/copilotkit/info`;
                } else if (methodType === "agent/run" || methodType === "agent/connect" || methodType === "agent/execute") {
                    const innerBody = parsedBody.body || {};
                    const threadId = innerBody.threadId || "unknown";
                    const runId = innerBody.runId || "unknown";

                    // Prevent LLM crashes by intercepting 'connect' requests or empty message executions
                    if (methodType === "agent/connect" || (Array.isArray(innerBody.messages) && innerBody.messages.length === 0)) {
                        console.log(`[PROXY] Intercepted ${methodType} with empty messages. Mocking successful stream to prevent backend crash.`);
                        const encoder = new TextEncoder();
                        const stream = new ReadableStream({
                            start(controller) {
                                controller.enqueue(encoder.encode(`data: {"type":"RUN_STARTED","threadId":"${threadId}","runId":"${runId}"}\n\n`));
                                controller.enqueue(encoder.encode(`data: {"type":"RUN_FINISHED","threadId":"${threadId}","runId":"${runId}"}\n\n`));
                                controller.close();
                            }
                        });
                        return new NextResponse(stream, {
                            status: 200,
                            headers: {
                                "Content-Type": "text/event-stream",
                                "Cache-Control": "no-cache",
                                "Connection": "keep-alive",
                            },
                        });
                    }

                    // Route to the native AG-UI endpoint (e.g., http://backend:8000/research)
                    const agentId = parsedBody.params?.agentId || integrationId;
                    finalBackendUrl = `${BACKEND_URL}/${agentId}`;

                    // The native AG-UI endpoint expects the inner 'body' (RunAgentInput) directly.
                    // It natively accepts 'tools' in camelCase.
                    finalBody = JSON.stringify(innerBody);
                    console.log(`[PROXY] Translated Protocol: Routing unwrapped payload natively to ${finalBackendUrl}`);
                }
            } catch (e) {
                console.error("[PROXY] Failed to parse or translate request body, falling back to original:", e);
            }
        }

        const response = await fetch(finalBackendUrl, {
            method: req.method,
            headers,
            body: finalBody,
            // Follow redirects to handle any remaining 307s internally
            redirect: "follow",
        });

        const contentType = (response.headers.get("content-type") || response.headers.get("Content-Type") || "").toLowerCase();

        // --- STREAMING SUPPORT ---
        // If the backend returns an event-stream (standard for chat/tools), 
        // we MUST pipe it directly to allow real-time UI updates.
        if (contentType.includes("text/event-stream") && response.body) {
            console.log(`Piping event-stream from ${finalBackendUrl}`);
            return new NextResponse(response.body, {
                status: response.status,
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                },
            });
        }

        // --- JSON DISCOVERY / HANDSHAKE ---
        // For non-streaming responses (like discovery /info), buffer and transform if needed.
        let data = await response.json().catch(() => ({}));

        // Protocol Translation (Discovery Fix)
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
