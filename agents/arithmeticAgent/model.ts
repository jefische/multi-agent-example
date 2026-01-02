// import { model } from "../../models/ollama.js";
import { model } from "../../models/gemini.js";
import { arithmeticTools } from "./tools.js";

// Augment the LLM with tools - the type of model can be adjusted above.
const tools = Object.values(arithmeticTools);
export const arithmeticModel = model.bindTools(tools); // Lets LLM see what tools exist
