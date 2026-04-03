/**
 * Authentication middleware for API routes
 * Prevents unauthorized access to Next.js API endpoints
 */

/**
 * Validate that request comes from our own app
 * Multiple layers of protection:
 * 1. Origin/Referer check - prevents calls from other domains
 * 2. Custom header check - prevents simple curl/postman calls
 * 
 * @param {Object} req - The request object
 * @param {string[]} allowedMethods - Array of allowed HTTP methods (default: ['GET', 'POST'])
 * @returns {Object} Validation result with valid flag, error message, and code
 */
export function validateApiRequest(req, allowedMethods = ["GET", "POST"]) {
  // Layer 1: Origin/Referer validation
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    const allowedDev = ["localhost", "127.0.0.1"];
    if (origin) {
      const originHost = new URL(origin).hostname;
      if (!allowedDev.includes(originHost)) {
        return {
          valid: false,
          error: "Invalid origin in development",
          code: 403,
        };
      }
    }
  } else {
    // In production, only allow same origin
    if (!origin || !origin.includes(host)) {
      return {
        valid: false,
        error: "Invalid origin - requests must come from the same domain",
        code: 403,
      };
    }
  }

  // Layer 2: Custom header check
  // Client-side code should set this header
  const apiKey = req.headers["x-app-key"];
  const expectedKey = process.env.NEXT_PUBLIC_APP_KEY;

  if (!apiKey || apiKey !== expectedKey) {
    return {
      valid: false,
      error: "Missing or invalid app key",
      code: 401,
    };
  }

  // Layer 3: Method validation
  if (!allowedMethods.includes(req.method)) {
    return {
      valid: false,
      error: `Method not allowed. Allowed methods: ${allowedMethods.join(", ")}`,
      code: 405,
    };
  }

  return { valid: true };
}

/**
 * Rate limiter to prevent abuse
 * Simple in-memory implementation (for production, use Redis)
 */
const requestCounts = new Map();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

export function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = requestCounts.get(identifier) || [];

  // Remove old requests outside the window
  const recentRequests = userRequests.filter(
    (timestamp) => now - timestamp < RATE_WINDOW
  );

  if (recentRequests.length >= RATE_LIMIT) {
    return {
      allowed: false,
      error: "Rate limit exceeded. Please try again later.",
      code: 429,
    };
  }

  // Add current request
  recentRequests.push(now);
  requestCounts.set(identifier, recentRequests);

  return { allowed: true };
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(req) {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const ip =
    forwarded?.split(",")[0] || realIp || req.socket.remoteAddress || "unknown";

  return ip;
}
