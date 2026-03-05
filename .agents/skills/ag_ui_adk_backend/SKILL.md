---
name: ag_ui_adk_backend
description: Skill for developing ADK agents that integrate with AG-UI (CopilotKit).
---

# AG-UI ADK Backend Skill

This skill provides instructions and templates for building ADK agents that communicate with AG-UI frontends.

## Core Concepts

### 1. Wrapping with ADKAgent
Use the `ADKAgent` wrapper and the `AGUIToolset` to enable AG-UI compatibility.

```python
from ag_ui_adk import ADKAgent, AGUIToolset
from google.adk.agents import LlmAgent

sample_agent = LlmAgent(
    name="assistant",
    tools=[AGUIToolset()] # Required
)

chat_agent = ADKAgent(adk_agent=sample_agent)
```

### 2. Shared State with ToolContext
Manage data between the agent and the frontend using `tool_context.state`.

```python
from google.adk.tools import ToolContext

def my_tool(tool_context: ToolContext, some_data: str):
    # Read/Write session state
    tool_context.state["my_data"] = some_data
    return {"status": "success"}
```

### 3. HitL with ResumabilityConfig
Use `ResumabilityConfig` for Human-in-the-Loop workflows that require pausing and resuming.

```python
from google.adk.apps import App, ResumabilityConfig

adk_app = App(
    name="demo_app",
    root_agent=my_agent,
    resumability_config=ResumabilityConfig(is_resumable=True),
)

adk_agent = ADKAgent.from_app(adk_app)
```

### 4. Customizing Request/Response
Use `before_model_modifier` and `after_model_modifier` to inject state into prompts or handle specific execution outcomes.

```python
def before_model_modifier(callback_context: CallbackContext, llm_request: LlmRequest):
    # Inject shared state into system instructions
    state = callback_context.state
    llm_request.config.system_instruction += f"\nCurrent state: {state}"
```

## Best Practices
- **Explicit States**: Initialize the session state in a `before_agent_callback` to ensure the frontend has a valid initial object.
- **Concise Summaries**: After an agent updates the UI through a tool, encourage it to provide a one-sentence summary instead of repeating the data.
- **Resumability**: Always enable `ResumabilityConfig` for any agent that requires user approval or multi-turn tool interaction.
