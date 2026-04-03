export default {
  API_BASE_URL: process.env.API_BASE_URL || "https://api-dev.visualdx.com/v1",
  TOKEN_URL: process.env.TOKEN_URL || "https://api-dev.visualdx.com/v1/auth/token",
  CLIENT_ID: process.env.CLIENT_ID || "",
  CLIENT_SECRET: process.env.CLIENT_SECRET || "",
  // Audience setting: "consumer" or "clinical"
  AUDIENCE: process.env.AUDIENCE || "clinical",
  // Cache settings (time-to-live in seconds)
  CACHE_TTL: process.env.CACHE_TTL || 259200,
  // Proxy Base URL for Next.js frontend
  NEXT_PUBLIC_PROXY_BASE_URL: process.env.NEXT_PUBLIC_PROXY_BASE_URL || "",
};

