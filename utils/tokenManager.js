import config from "@/config";

/**
 * Token cache - shared across all API routes
 * Prevents unnecessary token fetches
 */
let cachedToken = null;
let tokenExpiry = 0;

/**
 * Fetch authentication token from VisualDx
 * Implements caching to reduce API calls
 * 
 * @returns {Promise<string>} The access token
 */
export async function getAuthToken() {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < tokenExpiry) {
    if (process.env.NODE_ENV === "development") {
      console.log("Using cached token");
    }
    return cachedToken;
  }

  // Fetch new token
  const tokenUrl = config.TOKEN_URL || `${config.API_BASE_URL}/auth/token`;
  const credentials = `${config.CLIENT_ID}:${config.CLIENT_SECRET}`;
  const base64Credentials = Buffer.from(credentials).toString("base64");

  if (process.env.NODE_ENV === "development") {
    console.log(`Fetching new token from: ${tokenUrl}`);
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${base64Credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token fetch failed: ${response.status}`);
    console.error(`Error response: ${errorText.substring(0, 500)}`);
    throw new Error(
      `Token fetch failed: ${response.status} ${errorText.substring(0, 200)}`
    );
  }

  // Check if response is JSON
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error(`Expected JSON but got ${contentType}`);
    console.error(`Response: ${text.substring(0, 500)}`);
    throw new Error(`Invalid response type: ${contentType}. Expected JSON.`);
  }

  const data = await response.json();

  // Cache token with expiration (refresh 1 minute early)
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 60000;

  if (process.env.NODE_ENV === "development") {
    console.log(`Token cached, expires in ${data.expires_in} seconds`);
  }

  return cachedToken;
}

/**
 * Clear cached token - useful for testing or forced refresh
 */
export function clearTokenCache() {
  cachedToken = null;
  tokenExpiry = 0;
  console.log("Token cache cleared");
}
