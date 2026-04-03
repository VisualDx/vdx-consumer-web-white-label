import config from "@/config";
import {
  validateApiRequest,
  checkRateLimit,
  getClientIdentifier,
} from "@/middleware/auth";
import { getAuthToken } from "@/utils/tokenManager";

/**
 * Validate request origin to prevent hotlinking from other sites
 * Only accept requests from our own domain AND must be fetch/XHR (not navigation)
 */
function validateOrigin(req) {
  const origin = req.headers.origin || req.headers.referer;
  const fetchDest = req.headers['sec-fetch-dest'];
  const fetchSite = req.headers['sec-fetch-site'];
  const fetchMode = req.headers['sec-fetch-mode'];
  const accept = req.headers['accept'];
  
  // Always require origin/referer for security
  if (!origin) {
    return false;
  }

  // Multi-layer check to prevent browser navigation
  // Layer 1: Check Sec-Fetch-Site - must be same-origin
  if (fetchSite && fetchSite !== 'same-origin') {
    return false;
  }

  // Layer 2: Check Sec-Fetch-Dest - if present, must be 'image' (not 'document')
  if (fetchDest && fetchDest !== 'image') {
    return false;
  }

  // Layer 3: Check Accept header - image requests should accept image/*
  // Navigation requests typically accept text/html
  if (accept && accept.includes('text/html') && !accept.includes('image/')) {
    return false;
  }

  // In development, allow localhost
  if (process.env.NODE_ENV === "development") {
    return origin.includes("localhost") || origin.includes("127.0.0.1");
  }

  // In production, check against allowed domains
  const allowedDomains = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  return allowedDomains.some(domain => origin.includes(domain));
}

/**
 * Generate a signature for the request
 * Generate a simple request signature for additional security
 * In production, use proper session management or JWT
 */
function generateRequestSignature(id, timestamp) {
  // Simple signature based on id and timestamp
  // In production, use crypto.createHmac with a secret key
  const secret = process.env.IMAGE_SECRET || "default-secret-change-in-production";
  return Buffer.from(`${id}:${timestamp}:${secret}`).toString("base64");
}

/**
 * Validate request signature
 */
function validateRequestSignature(id, timestamp, signature) {
  // Check if timestamp is recent (within 5 minutes)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  
  if (isNaN(requestTime) || now - requestTime > 300000) {
    return false; // Expired or invalid
  }

  const expectedSignature = generateRequestSignature(id, timestamp);
  return signature === expectedSignature;
}

/**
 * API route to fetch images from VisualDx API
 * Multi-layer security:
 * 1. Rate limiting
 * 2. Origin validation (anti-hotlinking)
 * 3. Request signature validation
 * 4. Timestamp expiry (5 minutes)
 * 5. Server-side token management
 * 
 * Usage: /api/images/[id]?size=thumbnail&ts=timestamp&sig=signature
 */
export default async function handler(req, res) {
  const { id } = req.query;
  const size = req.query.size || "thumbnail";
  const timestamp = req.query.ts;
  const signature = req.query.sig;

  if (!id) {
    return res.status(400).json({ error: "Image ID is required" });
  }

  // Layer 1: Rate limiting
  const clientId = getClientIdentifier(req);
  const rateCheck = checkRateLimit(clientId);
  if (!rateCheck.allowed) {
    return res.status(rateCheck.code).json({ error: rateCheck.error });
  }

  // Layer 2: Validate origin - prevent hotlinking from other sites
  if (!validateOrigin(req)) {
    return res.status(403).json({ error: "Access denied - invalid origin" });
  }

  // Layer 3: Validate request signature for security
  // This prevents unauthorized access to image URLs
  if (!timestamp || !signature || !validateRequestSignature(id, timestamp, signature)) {
    return res.status(401).json({ error: "Unauthorized access" });
  }

  try {
    // Layer 4: Get token server-side - client never sees it
    const token = await getAuthToken();
    
    const apiUrl = `${config.API_BASE_URL}/libraries/images/${id}?size=${size}`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Image fetch failed: ${response.status} ${errorText}`);
      return res.status(response.status).json({ 
        error: "Failed to fetch image",
        details: errorText 
      });
    }

    // Get the image content type
    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    
    // Get the image as array buffer
    const imageBuffer = await response.arrayBuffer();
    
    // Set appropriate headers including anti-hotlinking
    res.setHeader("Content-Type", contentType);
    // IMPORTANT: Disable caching to ensure security validation on EVERY request
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    
    // Prevent embedding on other sites (optional, may break some use cases)
    // res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
    
    // Send the image
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error("Error in image API route:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
}

// Export signature generator for use in client
export { generateRequestSignature };
