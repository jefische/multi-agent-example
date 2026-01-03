import { getAccessToken } from "./utils/tokenManager.js";

// Example: Get token multiple times to demonstrate caching
console.log("=== First token request ===");
const token1 = await getAccessToken();
console.log("Token:", token1);

console.log("\n=== Second token request (should use cache) ===");
const token2 = await getAccessToken();
console.log("Token:", token2);

console.log("\n=== Tokens match:", token1 === token2);

