import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { Intent } from "../../types/intents.js";
// import { model } from "../../models/ollama.js";
import { model } from "../../models/gemini.js";

/**
 * Classify the user's request into exactly ONE of the following categories:
 * - arithmetic: simple math involving two numbers
 * - travel: tours, activities, locations, recommendations
 * - unsupported: anything else
 *
 */
export async function classifyIntent(input: string): Promise<Intent> {
  const response = await model.invoke([
    new SystemMessage(`
    You are an intent classifier.

    Classify the user's request into exactly ONE of the following categories:
    - arithmetic: simple math involving two numbers
    - travel: tours, activities, locations, recommendations
    - unsupported: anything else

    Rules:
    - Return JSON ONLY
    - No explanations
    - No markdown

    Example outputs:
    { "intent": "arithmetic" }
    { "intent": "travel" }
    { "intent": "unsupported" }
    `),
    new HumanMessage(input),
  ]);

  try {
    const parsed = JSON.parse(response.text);
    return parsed.intent as Intent;
  } catch {
    return "unsupported";
  }
}
