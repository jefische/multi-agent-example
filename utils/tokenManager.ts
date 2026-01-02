import "dotenv/config";

interface TokenData {
    access_token: string;
    token_type: string;
    expires_in: number;
    state?: string;
}

interface CachedToken {
    access_token: string;
    expiresAt: number;
}

let cachedToken: CachedToken | null = null;

/**
 * Fetches a new access token from the Amadeus API
 */
async function fetchNewToken(): Promise<TokenData> {
    const response = await fetch(`https://test.api.amadeus.com/v1/security/oauth2/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: process.env.AMADEUS_API_KEY!,
            client_secret: process.env.AMADEUS_API_SECRET!
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Gets a valid access token, using cached token if available and not expired
 */
export async function getAccessToken(): Promise<string> {
    const now = Date.now();

    // Check if we have a cached token that's still valid
    if (cachedToken && cachedToken.expiresAt > now) {
        console.log("Using cached token");
        return cachedToken.access_token;
    }

    console.log("Fetching new token...");
    const tokenData = await fetchNewToken();

    // Cache the token with a buffer of 60 seconds before actual expiration
    // This prevents using a token that might expire during a request
    const bufferSeconds = 60;
    cachedToken = {
        access_token: tokenData.access_token,
        expiresAt: now + (tokenData.expires_in - bufferSeconds) * 1000
    };

    console.log(`Token fetched successfully. Expires in ${tokenData.expires_in} seconds`);
    return cachedToken.access_token;
}

/**
 * Clears the cached token (useful for testing or forcing a refresh)
 */
export function clearTokenCache(): void {
    cachedToken = null;
    console.log("Token cache cleared");
}
