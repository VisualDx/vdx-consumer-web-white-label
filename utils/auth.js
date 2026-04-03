/**
 * Simple session-based authentication middleware
 * In production, use proper session management (NextAuth, etc.)
 */

const VALID_SESSION_KEY = "vdx_session_valid";

/**
 * Check if user has valid session
 * This should be replaced with proper authentication in production
 */
export function hasValidSession(req) {
  // Check if request has valid session cookie
  const sessionCookie = req.cookies?.[VALID_SESSION_KEY];
  
  if (!sessionCookie) {
    return false;
  }

  // In production, validate session against database/Redis
  // For now, just check if cookie exists
  return sessionCookie === "true";
}

/**
 * Create session for authenticated user
 */
export function createSession(res) {
  // Set httpOnly cookie for security
  res.setHeader(
    "Set-Cookie",
    `${VALID_SESSION_KEY}=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
  );
}

/**
 * Destroy user session
 */
export function destroySession(res) {
  res.setHeader(
    "Set-Cookie",
    `${VALID_SESSION_KEY}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
  );
}
