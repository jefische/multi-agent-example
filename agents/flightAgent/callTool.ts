import type { ToolCall } from "@langchain/core/messages/tool";
import { flightTools } from "./tools.js";

export type FlightToolName = keyof typeof flightTools;

// Function to call a tool used ONLY by the manager agent
export async function callTool(toolCall: ToolCall) {
  const name = toolCall.name as FlightToolName;
  const tool = flightTools[name];

  if (!tool) {
    throw new Error(`Unknown tool: ${toolCall.name}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tool as any).invoke(toolCall); // Executes tool with { id, name, args }
  // Returns ToolMessage
}
