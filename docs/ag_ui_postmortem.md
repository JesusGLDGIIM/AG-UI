# AG-UI Integration Retrospective & Post-Mortem

This document details the critical integration issues encountered when connecting the **CopilotKit v1.50+ Frontend** (React) with the **Python v0.1.78 Backend** using the specialized AG-UI (`ag_ui_langgraph` and `ag_ui_adk`) wrappers, and how they were systematically resolved.

## 1. The "Silent Agents" Issue (No Streaming/Responses)

**Symptom:** The user could load the chat interface and see the agents, but sending a message resulted in no UI updates, no streaming text, and no errors in the frontend console.

**Root Causes & Solutions:**

### A. Docker Environment Activation Bug
*   **The Problem:** The `ag-ui-backend` Docker container was executing the FastAPI server using the system Python instead of the isolated `.venv` where `copilotkit` and `langchain` were installed. This caused the backend to crash immediately upon receiving a request due to `ModuleNotFoundError`.
*   **The Fix:** Hardcoded a `sys.path.insert(0, "/app/.venv/lib/python3.12/site-packages")` at the very top of `server.py` to guarantee the application loaded the correct library environment, regardless of the OCI runtime's activation state. Additionally, added an anonymous volume `v-ag-ui-backend-venv:/app/.venv` in `docker-compose.yml` to protect the Linux environment from being overwritten by the host Windows environment.

### B. V1 JSON Envelope vs V0 Path Routing (Protocol Mismatch)
*   **The Problem:** CopilotKit React SDK updated to v1 sent execution requests as generic `POST /copilotkit/` with a JSON body wrapping the intent: `{"method": "agent/run", "body": {...}}`. However, the Python SDK v0 backend was designed around URL-centric routing, expecting requests to hit `/copilotkit/agent/<agent-name>` directly with an unwrapped payload.
*   **The Fix (Deep Protocol Translation):** Implemented an intelligent proxy layer in Next.js (`route.ts`). The proxy intercepts `POST` requests, parses the JSON to identify `"agent/run"` intents, extracts the target `agentId`, and dynamically reroutes the HTTP request to the correct backend format.

### C. The `execute()` vs `run()` Native Endpoint Crash
*   **The Problem:** Even after routing correctly, the backend crashed with `AttributeError: 'LangGraphAGUIAgent' object has no attribute 'execute'`. The generic `CopilotKitRemoteEndpoint` router mandates that agents have an `.execute()` method. However, the specialized AG-UI agents (`LangGraphAGUIAgent` and `ADKAgent`) use a `.run()` method based on a completely different `RunAgentInput` type system.
*   **The Fix (Split-Routing Architecture):** 
    1.  **Discovery:** Kept `CopilotKitRemoteEndpoint` mounted at `/copilotkit` *only* to serve the `/info` handshake required by the frontend layout.
    2.  **Execution:** Mounted the native ASGI execution routers (`add_langgraph_fastapi_endpoint` at `/research` and `add_adk_fastapi_endpoint` at `/travel`).
    3.  **Proxy Update:** Updated the Next.js proxy to unwrap the `RunAgentInput` from the v1 envelope and forward it directly to these root paths instead of the generic `/copilotkit/agent/` path.

### D. The Fetch Content-Length Mismatch
*   **The Problem:** After unwrapping the JSON payload in the proxy to send to the native endpoints, the physical size of the HTTP body shrank. Node's `fetch` crashed with `UND_ERR_REQ_CONTENT_LENGTH_MISMATCH` because it was still using the original `content-length` header sent by the browser.
*   **The Fix:** Explicitly stripped the `content-length` (and `host`) headers in the proxy loop, forcing `undici` to recalculate the correct size for the rewritten body dynamically.

### E. The Application Load LLM Crash (`agent/connect`)
*   **The Problem:** On initial load, the frontend sends an `agent/connect` event to sync state, containing an empty `messages: []` array. When the proxy forwarded this to the execution endpoints, LangGraph/ADK immediately triggered the Google Gemini LLM, which abruptly crashed with `ValueError: contents are required`.
*   **The Fix (Proxy Interception):** Added a short-circuit rule in `route.ts`. If the proxy detects an `agent/connect` intent or an empty messages array, it *intercepts* the request and returns a mocked, successful `RUN_STARTED` -> `RUN_FINISHED` Server-Sent Events stream instantly, completely shielding the LLMs from invalid state checks.

## 2. Discovery Compatibility (Agents Array vs Object)

*   **The Problem:** The v0 Python SDK returns available agents as a JSON array (`agents: [{...}]`). The React v1 SDK expects a dictionary map (`agents: {"travel": {...}}`). This caused the UI to fail to render any active agent context.
*   **The Fix:** Added a transformation layer in the `route.ts` proxy for non-streaming `/info` responses, iterating through the array and restructuring the JSON into the required map object before returning it to the browser.

## Conclusion

The core friction stemmed from attempting to bridge a **v1.50+ strict-typing React Frontend** with a **v0.1.78 Experimental Python Backend** utilizing specialized, undocumented AG-UI event loops (`ag_ui_adk`, `ag_ui_langgraph`). Bypassing the monolithic `CopilotKitRemoteEndpoint` for execution and building a highly aware Next.js translation proxy was the definitive architectural solution to restoring full real-time streaming capabilities.
