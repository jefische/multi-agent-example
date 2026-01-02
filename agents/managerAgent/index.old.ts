import { classifyIntent } from "./classifyIntent.js";
import { runArithmeticAgent } from "../arithmeticAgent/index.js";
// import { formatFinalOutput } from "../../utils/formatFinalOutput.js";
import type { BaseMessage } from "@langchain/core/messages";

type ManagerResult =
  | { type: "trace"; messages: BaseMessage[] }
  | { type: "error"; message: string };

// Controller agent - Decides which agent to use after classifying the intent
// of the user's request
export async function runManager(input: string): Promise<ManagerResult> {
  // Determine the user's intent
  const intent = await classifyIntent(input);

  if (intent === "arithmetic") {
    const messages = await runArithmeticAgent(input);
    return { type: "trace", messages };
    // return formatFinalOutput(messages);
  }

  // TODO: Add travel agent
  // if (intent === "travel") {
  //   return format(await runTravelAgent(...));
  // }

  return {
    type: "error",
    message: "Please ask an arithmetic or travel-related question.",
  };
}
