import { addMessages } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { callLlm } from "./callLlm.js";
import { callTool } from "./callTool.js";

/**
 * Runs the arithmetic agent with the given input.
 * The agent will loop until there are no more tool calls
 * from the model. The results of the tool calls and the
 * model's responses are aggregated and returned.
 * @param {string} input - The user's input.
 * @returns {Promise<BaseMessage[]>} - The aggregated results of the tool calls and the model's responses.
 */
export async function runArithmeticAgent(
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
