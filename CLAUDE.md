# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-agent AI system built with LangChain for learning purposes. It demonstrates a scalable architecture where a manager agent orchestrates specialized sub-agents to handle different types of user requests.

**Key Concept**: The manager agent uses intent classification to route requests to appropriate specialized agents, which then use LLM tool-calling to execute tasks.

## Commands

**This project uses pnpm (not npm/yarn).**

```bash
# Run the agent with a user prompt (quotes required)
pnpm run prompt "What is 4 + 6?"

# Token management utility
pnpm run token
```

## Architecture

### Agent System Flow

1. **Entry Point** ([index.ts](index.ts)): Receives user input from CLI, invokes manager agent, prints trace
2. **Manager Agent** ([agents/managerAgent/index.ts](agents/managerAgent/index.ts)): Orchestrates by classifying intent and delegating to appropriate sub-agent
3. **Sub-Agents** (e.g., [agents/arithmeticAgent/index.ts](agents/arithmeticAgent/index.ts)): Execute specialized tasks using tool-calling loop pattern

### Intent Classification

The manager uses `classifyIntent()` ([agents/managerAgent/classifyIntent.ts](agents/managerAgent/classifyIntent.ts)) to determine request type:
- `arithmetic`: Math operations between two numbers
- `travel`: Tours, activities, recommendations (planned, not yet implemented)
- `unsupported`: Everything else

**Current limitation**: Intent classification is a standalone LLM call, not integrated into the manager's reasoning loop. Future enhancement: manager should reason about which agents to use.

### Agent Structure Pattern

Each agent follows this modular structure:
- `index.ts`: Main agent runner with tool-calling loop
- `callLlm.ts`: LLM invocation with system prompt
- `callTool.ts`: Tool execution dispatcher
- `model.ts`: LLM configuration with tools bound
- `tools.ts`: Tool definitions and type exports

**Tool-calling loop** (see [agents/arithmeticAgent/index.ts](agents/arithmeticAgent/index.ts)):
1. Call LLM with accumulated messages
2. If tool calls requested, execute them via `callTool()`
3. Append tool results to message history using `addMessages()`
4. Repeat until LLM returns without tool calls
5. Return full message trace

### Model Configuration

- **Primary**: Google Gemini (requires `GOOGLE_API_KEY` in `.env`)
  - Model: `gemini-2.5-flash` ([models/gemini.ts](models/gemini.ts))
- **Alternative**: Ollama local models ([models/ollama.ts](models/ollama.ts))
  - Model: `qwen2.5:3b`
  - No API key required

To switch models: Change import in agent's `model.ts` file (e.g., [agents/arithmeticAgent/model.ts](agents/arithmeticAgent/model.ts:1-2))

### Tool Implementation

Tools use LangChain's `tool()` function with Zod schema validation (see [tools/arithmetic/add.ts](tools/arithmetic/add.ts)):
- Define function logic
- Provide clear description (critical for LLM tool selection)
- Specify Zod schema for typed parameters

**Current tools**:
- Arithmetic: `add`, `subtract`, `multiply`, `divide` (in [tools/arithmetic/](tools/arithmetic/))
- Travel: `recommendTours` (in [tools/travel/](tools/travel/), not yet integrated)

## TypeScript Configuration

- Module system: ESM (`"type": "module"` in package.json)
- Module resolution: `nodenext`
- Strict mode enabled with additional safety checks
- All imports must use `.js` extension (TypeScript ESM requirement)

## Adding New Agents

1. Create agent directory in `agents/` with standard structure
2. Define tools in `tools/[domain]/`
3. Add intent type to [types/intents.ts](types/intents.ts)
4. Update `classifyIntent()` system prompt in [agents/managerAgent/classifyIntent.ts](agents/managerAgent/classifyIntent.ts)
5. Add routing logic to manager in [agents/managerAgent/index.ts](agents/managerAgent/index.ts)

## Environment Setup

1. Copy `.env.example` to `.env`
2. Add `GOOGLE_API_KEY` if using Gemini
3. For Ollama: No key needed, but ensure model is pulled locally
