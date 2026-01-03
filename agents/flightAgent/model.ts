// import { model } from "../../models/ollama.js";
import { model } from "../../models/gemini.js";
import { flightTools } from "./tools.js";

// Augment the LLM with tools - the type of model can be adjusted above.
const tools = Object.values(flightTools);
export const flightModel = model.bindTools(tools); // LLM instance with tools bound
