# Guide: AG-UI with LangGraph

This guide provides a comprehensive overview of how to integrate AG-UI (CopilotKit) with LangGraph to build advanced agentic user interfaces.

## Backend: LangGraph & CopilotKit

To enable AG-UI support in your LangGraph backend, you need to use the `CopilotKitMiddleware` and a compatible state schema.

### Basic Setup
```python
from langgraph.graph import StateGraph, MessagesState
from copilotkit import CopilotKitMiddleware, CopilotKitState

# Extend MessagesState with CopilotKitState
class AgentState(MessagesState, CopilotKitState):
    """Your agent's state."""
    pass

# Initialize Graph
workflow = StateGraph(AgentState)
# ... add nodes and edges ...

# Compile with Middleware
graph = workflow.compile(
    middleware=[CopilotKitMiddleware()],
    # Use MemorySaver for local persistence
    checkpointer=MemorySaver() 
)
```

### Predictive State Updates (Streaming)
To stream tool call arguments directly to the frontend state while they are being generated, use `predict_state` metadata.

```python
config["metadata"]["predict_state"] = [{
    "state_key": "document",      # Key in frontend state
    "tool": "write_document",     # Tool triggering the update
    "tool_argument": "content"    # Argument to stream
}]
```

### Emitting Intermediate State
Use `manually_emit_state` to update the frontend UI during a long-running node.

```python
from langchain_core.callbacks.manager import adispatch_custom_event

await adispatch_custom_event(
    "manually_emit_state",
    state,
    config=config,
)
```

---

## Frontend: React & CopilotKit

The frontend uses hooks and components from `@copilotkit/react-core/v2`.

### Core Hooks
| Hook | Description |
| --- | --- |
| `useAgent` | Connects to the agent and syncs state. |
| `useFrontendTool` | Defines a client-side tool the agent can call. |
| `useRenderTool` | Defines how to render the output of a backend tool. |
| `useLangGraphInterrupt` | Handles LangGraph `interrupt` responses. |

### Example: Syncing Agent State
```tsx
const { agent } = useAgent({
  agentId: "my_agent",
  updates: [UseAgentUpdate.OnStateChanged],
});

const steps = (agent.state as any)?.steps;
```

### Example: Rendering Backend Tools
```tsx
useRenderTool({
  name: "get_weather",
  render: ({ args, result, status }) => {
    if (status !== "complete") return <div>Loading...</div>;
    return <WeatherCard data={result} />;
  },
});
```

### Human-in-the-loop (Interrupts)
```tsx
useLangGraphInterrupt({
  render: ({ event, resolve }) => (
    <InterruptModal 
      event={event} 
      onConfirm={(data) => resolve(data)} 
    />
  ),
});
```
