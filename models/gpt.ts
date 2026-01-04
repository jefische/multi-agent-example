// import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

// Create the model using Google Gemini
export const model = new ChatOpenAI({
  model: "gpt-4o",
//   model: "gpt-4o-mini",
  temperature: 0, // Controls randomness. 0 is good for deterministic results (Math, tools, agents).
});
