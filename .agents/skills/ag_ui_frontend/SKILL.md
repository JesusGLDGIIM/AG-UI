---
name: ag_ui_frontend
description: Skill for developing agentic user interfaces with CopilotKit (AG-UI) and React. Compatible with LangGraph and ADK backends.
---

# AG-UI Frontend Skill

This skill provides instructions and templates for building React interfaces that interact with agentic backends via CopilotKit.

## Core Concepts

### 1. Connecting to an Agent
Use the `useAgent` hook to sync frontend state with the backend agent.

```tsx
import { useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";

const { agent } = useAgent({
  agentId: "my_agent_id",
  updates: [UseAgentUpdate.OnStateChanged],
});

const state = agent.state as MyState;
// You can also set state back to the agent:
// agent.setState({ key: "value" });
```

### 2. Providing Context and Suggestions
Use `useAgentContext` for temporary session data and `useConfigureSuggestions` for guided interactions.

```tsx
import { useAgentContext, useConfigureSuggestions } from "@copilotkit/react-core/v2";

useAgentContext({
  description: 'Name of the user',
  value: 'Bob'
});

useConfigureSuggestions({
  suggestions: [
    { title: "Start Search", message: "Search for available products." },
  ],
  available: "always",
});
```

### 3. Rendering Backend Tools
Use `useRenderTool` to provide custom UI for specific backend tool calls. You can even render the arguments *while* they are being streamed (`status !== "complete"`).

```tsx
import { useRenderTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

useRenderTool({
  name: "get_weather",
  parameters: z.object({
    location: z.string(),
  }),
  render: ({ args, result, status }) => {
    if (status !== "complete") {
      return <div>Streaming weather for {args.location}...</div>;
    }
    return <WeatherCard location={args.location} temp={result.temp} />;
  },
});
```

### 4. Frontend Tools with Custom Rendering
Use `useFrontendTool` to trigger client-side code. If you provide a `render` function, the agent will show it in the chat while the tool is executing.

```tsx
useFrontendTool({
  name: "change_background",
  parameters: z.object({ color: z.string() }),
  handler: async ({ color }) => {
    document.body.style.background = color;
    return "Background changed";
  },
  render: ({ args }) => <div>Applying {args.color} background...</div>
});
```

### 5. Multi-Backend Support
AG-UI works seamlessly with both:
- **LangGraph**: Via `useLangGraphInterrupt` and standard tool rendering.
- **ADK**: Via `ToolContext` state syncing and `ResumabilityConfig` for HITL.

The frontend implementation remains consistent regardless of the backend architecture.

useLangGraphInterrupt({
  render: ({ event, resolve }) => (
    <div className="p-4 border rounded shadow">
      <h3>Review Plan</h3>
      <p>{event.value.steps.join(", ")}</p>
      <button onClick={() => resolve("Confirmed")}>Accept</button>
    </div>
  ),
});
```

## Best Practices
- **Premium Aesthetics**: Use gradients, smooth transitions, and glassmorphism.
- **Real-time Feedback**: Use the `status` prop in `render` functions to show progress (streaming vs. complete).
- **Responsive Design**: Ensure custom cards look good on all devices.
- **Type Safety**: Use Zod for parameter definitions.
