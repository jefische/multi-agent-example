import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage } from "@langchain/core/messages";
import { addMessages } from "@langchain/langgraph";
import { callLlm } from "./callLlm.js";
import { callTool } from "./callTool.js";

type ManagerResult =
  | { type: "trace"; messages: BaseMessage[] }
  | { type: "error"; message: string };

// Controller agent - Decides which agent to use after classifying the intent
// of the user's request
export async function runManager(input: string): Promise<ManagerResult> {
  let messages: BaseMessage[] = [new HumanMessage(input)];
  let modelResponse = await callLlm(messages); // AIMessage (LLM response) content with text, may have tool_calls array
  console.log("-----------------------------------------------");
  console.log(modelResponse);
  // Manager can call MULTIPLE tools and orchestrate them
  while (true) {
    if (!modelResponse.tool_calls?.length) break;
    
    const toolResults = await Promise.all(
      modelResponse.tool_calls.map(callTool) // callTool for each item in the array
    );
    
    messages = addMessages(messages, [modelResponse, ...toolResults]);
    modelResponse = await callLlm(messages);
  }
  
  messages = addMessages(messages, [modelResponse]);
  return { type: "trace", messages };
}
