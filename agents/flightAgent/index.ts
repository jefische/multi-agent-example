import { addMessages } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { callLlm } from "./callLlm.js";
import { callTool } from "./callTool.js";

export async function runFlightAgent(
  input: string
): Promise<BaseMessage[]> {
  let messages: BaseMessage[] = [new HumanMessage(input)];
  let modelResponse = await callLlm(messages);

  while (true) {
    if (!modelResponse.tool_calls?.length) break;

    const toolResults = await Promise.all(
      modelResponse.tool_calls.map(callTool)
    );

    messages = addMessages(messages, [modelResponse, ...toolResults]);
    modelResponse = await callLlm(messages);
  }

  // Add final AI response (even if no tools were called)
  messages = addMessages(messages, [modelResponse]);
  
  return messages;
}

