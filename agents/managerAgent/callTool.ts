import type { ToolCall } from "@langchain/core/messages/tool";
import { managerTools } from "./tools.js";

export type ManagerToolName = keyof typeof managerTools;

// Function to call a tool used ONLY by the manager agent
export async function callTool(toolCall: ToolCall) {
  const name = toolCall.name as ManagerToolName;
  const tool = managerTools[name];

  if (!tool) {
    throw new Error(`Unknown tool: ${toolCall.name}`);
  }

  return tool.invoke(toolCall);
}
