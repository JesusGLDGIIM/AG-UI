# Guide: AG-UI with ADK (Agent Development Kit)

This guide explains how to integrate AG-UI (CopilotKit) with agents built using the Google Agent Development Kit (ADK).

## Backend: ADK & AG-UI

To connect an ADK agent to an AG-UI frontend, use the `ADKAgent` wrapper and the `AGUIToolset`.

### Basic Setup
```python
from fastapi import FastAPI
from ag_ui_adk import ADKAgent, AGUIToolset, add_adk_fastapi_endpoint
from google.adk.agents import LlmAgent

# Define your ADK Agent
sample_agent = LlmAgent(
    name="assistant",
    model="gemini-2.0-flash",
    instruction="You are a helpful assistant.",
    tools=[
        AGUIToolset(), # Required for AG-UI client-side tools
    ]
)

# Wrap with ADKAgent for AG-UI compatibility
chat_agent = ADKAgent(
    adk_agent=sample_agent,
    app_name="my_app",
    user_id="user_123"
)

app = FastAPI()
add_adk_fastapi_endpoint(app, chat_agent, path="/api/copilotkit")
```

### Shared State
ADK uses `ToolContext` to manage state that is shared with the frontend.

```python
from google.adk.tools import ToolContext

def update_recipe(tool_context: ToolContext, title: str):
    """Update the shared recipe state."""
    # Access and modify the persistent session state
    tool_context.state["recipe"] = {"title": title}
    return {"status": "success"}
```

### Human-in-the-Loop (HITL)
To support multi-turn approvals or rejections, use `ResumabilityConfig`.

```python
from google.adk.apps import App, ResumabilityConfig

adk_app = App(
    name="my_app",
    root_agent=my_agent,
    resumability_config=ResumabilityConfig(is_resumable=True),
)

# Create ADKAgent from the App
chat_agent = ADKAgent.from_app(adk_app, user_id="user_123")
```

---

## Frontend Integration

The frontend remains largely the same, but ensure your `CopilotKit` component points to the correct ADK endpoint.

```tsx
<CopilotKit runtimeUrl="/api/copilotkit" agent="my_adk_agent">
  <CopilotChat />
</CopilotKit>
```

Refer to the [Frontend Skill](file:///C:/Users/Jesug/OneDrive/Desktop/LangGraphProjects/AG-UI/.agents/skills/ag_ui_frontend/SKILL.md) for UI patterns.
