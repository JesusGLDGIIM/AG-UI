---
name: ag_ui_backend
description: Skill for developing LangGraph agents that integrate with AG-UI (CopilotKit).
---

# AG-UI Backend Skill

This skill provides instructions and templates for building LangGraph agents that can communicate with AG-UI frontends.

## Core Concepts

### 1. Middleware and State
Integrate `CopilotKitMiddleware` and use `CopilotKitState` to enable AG-UI features.

```python
from langgraph.graph import StateGraph, MessagesState
from copilotkit import CopilotKitMiddleware, CopilotKitState

class AgentState(MessagesState, CopilotKitState):
    """Your agent state."""
    # Add your custom state keys here
    document: str = ""
    steps: list = []

workflow = StateGraph(AgentState)
graph = workflow.compile(middleware=[CopilotKitMiddleware()])
```

### 2. FastAPI Integration & Discovery
The `LangGraphAGUIAgent` must be integrated using `add_fastapi_endpoint`. Due to current SDK bugs, a monkey-patch is required for discovery.

```python
from copilotkit import LangGraphAGUIAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint

# CRITICAL: Monkey-patch for agent discovery (SDK v0.1.78)
# Required for compatibility with Frontend v1.52.1+
def universal_dict_repr(self):
    name = getattr(self, "name", "unknown")
    return {
        "id": name,
        "name": name,
        "description": getattr(self, "description", ""),
        "type": "agent", # 'agent' is more portable than 'langgraph'
    }

if not hasattr(LangGraphAGUIAgent, "dict_repr"):
    LangGraphAGUIAgent.dict_repr = universal_dict_repr

# ... define endpoint and add to app
copilotkit_endpoint = CopilotKitRemoteEndpoint(agents=[...])
add_fastapi_endpoint(app, copilotkit_endpoint, prefix="/copilotkit")
```

### 3. Predictive State (Streaming)
Enable streaming of tool arguments to the frontend state using `predict_state` metadata. This allows the UI to update *while* the LLM is generating the tool call.

```python
config["metadata"]["predict_state"] = [{
    "state_key": "document",      # Key in frontend state
    "tool": "write_document",     # Tool triggering the update
    "tool_argument": "content"    # Argument to stream
}]
```

### 3. Emitting State Mid-Node
Update the UI state during long-running processes or between steps using custom events.

```python
from langchain_core.callbacks.manager import adispatch_custom_event

# 1. Update the frontend state value
state["document"] = "Updated content"

# 2. Emit the event to sync with CopilotKit
await adispatch_custom_event(
    "manually_emit_state", # or "manually_emit_intermediate_state"
    state,
    config=config,
)
```

### 4. Human-In-The-Loop (Interrupts)
Use the `interrupt` function to pause execution and request user input from the frontend.

```python
from langgraph.types import interrupt

# Inside a node:
# This pauses the graph and waits for the frontend to resolve 'my_interrupt'
user_response = interrupt({"question": "Confirm these steps?", "steps": ["Step 1", "Step 2"]})

# Process response after user confirms in UI
if user_response == "Confirmed":
    return {"messages": ["User confirmed steps."]}
```

## Best Practices
- **Structured Tools**: Use Pydantic models for tool arguments.
- **State Initialization**: Always ensure initial state is emitted on the first node to avoid "undefined" errors in React.
- **Recursion Limits**: In AG-UI, complex loops might trigger recursion limits; ensure `config = RunnableConfig(recursion_limit=X)` is set appropriately.
- **Checkpointers**: Use `MemorySaver` for local development to maintain conversation history and state sync.
