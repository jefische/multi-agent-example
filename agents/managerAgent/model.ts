// import { model } from "../../models/ollama.js";
import { model } from "../../models/gemini.js";
import { managerTools } from "./tools.js";

// Augment the LLM with tools - the type of model can be adjusted above.
const tools = Object.values(managerTools);
export const managerModel = model.bindTools(tools); // Lets LLM see what tools exist
