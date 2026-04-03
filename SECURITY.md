# Security Architecture

## Overview

This document describes the multi-layered security architecture implemented to protect API credentials and prevent unauthorized access to the VisualDx API integration.

## Architecture Flow

```
Browser (Client)           Next.js Server (API Routes)         VisualDx API
     │                              │                               │
     │  1. Request + App Key        │                               │
     ├─────────────────────────────>│                               │
     │                              │  2. Fetch Token (CLIENT_ID +  │
     │                              │     CLIENT_SECRET)            │
     │                              ├──────────────────────────────>│
     │                              │<──────────────────────────────┤
     │                              │  3. Access Token              │
     │                              │                               │
     │                              │  4. API Call with Token       │
     │                              ├──────────────────────────────>│
     │                              │<──────────────────────────────┤
     │  5. Response Data            │  5. Data                      │
     │<─────────────────────────────┤                               │
```

## Security Layers

### Layer 1: Server-Side Token Management

The most critical security layer. API credentials are stored and managed exclusively on the server.

**Implementation:**
- ✅ `CLIENT_ID` and `CLIENT_SECRET` stored in `.env.local` (server-side only)
- ✅ Credentials never exposed to browser/client
- ✅ Token fetching and caching handled entirely server-side
- ✅ Automatic token refresh on expiration
- ✅ Shared token cache across all API routes

**Files:**
- [/utils/tokenManager.js](utils/tokenManager.js) - Centralized token management
- [/pages/api/differential.js](pages/api/differential.js) - Uses getAuthToken()
- [/pages/api/images/[id].js](pages/api/images/[id].js) - Uses getAuthToken()

**Security Benefits:**
- Even if client code is compromised, credentials remain safe
- Prevents credential exposure in browser DevTools or network logs
- Token caching reduces API calls and improves performance

### Layer 2: App Key Validation

Prevents unauthorized clients from calling Next.js API routes.

**Implementation:**
- ✅ Client must send `x-app-key` header with every request
- ✅ Server validates app key before processing request
- ✅ Invalid app key returns 401 Unauthorized

**Files:**
- [/middleware/auth.js](middleware/auth.js) - validateApiRequest()
- [/utils/api.js](utils/api.js) - Sends x-app-key header

**Why NEXT_PUBLIC_APP_KEY?**
- `NEXT_PUBLIC_*` variables are bundled into client code
- Client needs to know the app key to include in headers
- **Note:** This provides basic protection but can be reverse-engineered from bundled JavaScript

**Limitations:**
- App key is visible in browser source code
- Attackers can extract the key from JavaScript bundles
- Provides protection against casual unauthorized access only

### Layer 3: Origin Validation

Prevents hotlinking and cross-origin API abuse.

**Implementation:**
- ✅ Validates `Origin` and `Referer` headers
- ✅ Development: Only allows localhost/127.0.0.1
- ✅ Production: Only allows same-origin requests
- ✅ Blocks requests from other domains

**Files:**
- [/middleware/auth.js](middleware/auth.js) - validateApiRequest()
- [/pages/api/images/[id].js](pages/api/images/[id].js) - validateOrigin()

**Security Benefits:**
- Prevents external websites from using your API
- Blocks simple curl/Postman requests without spoofed headers
- Protects against CSRF attacks

### Layer 4: Rate Limiting

Prevents abuse through request throttling.

**Implementation:**
- ✅ Maximum 100 requests per minute per IP
- ✅ Tracks requests using IP address from headers/socket
- ✅ In-memory implementation (consider Redis for production)
- ✅ Returns 429 Too Many Requests when limit exceeded

**Files:**
- [/middleware/auth.js](middleware/auth.js) - checkRateLimit(), getClientIdentifier()

**Current Limitations:**
- In-memory cache resets on server restart
- Not suitable for distributed/multi-instance deployments
- **Recommendation:** Use Redis or external rate limiting service in production

### Layer 5: Signed Image URLs

Prevents unauthorized direct access to image resources.

**Implementation:**
- ✅ Image URLs include timestamp and cryptographic signature
- ✅ Signature = HMAC-SHA256(imageId + timestamp + secret)
- ✅ URLs expire after 5 minutes
- ✅ Secret key stored server-side only

**Files:**
- [/pages/api/images/sign.js](pages/api/images/sign.js) - Generates signed URLs
- [/pages/api/images/[id].js](pages/api/images/[id].js) - Validates signatures

**Security Benefits:**
- Time-limited access prevents URL sharing
- Signature prevents URL tampering
- Server-side signing ensures consistency

### Layer 6: Browser Navigation Protection

Prevents direct browser navigation to image URLs via DevTools or address bar.

**Implementation:**
- ✅ Validates `Sec-Fetch-Site` header (must be 'same-origin')
- ✅ Validates `Sec-Fetch-Dest` header (must be 'image', not 'document')
- ✅ Validates `Accept` header (rejects text/html without image/*)
- ✅ Disables browser caching (`Cache-Control: no-store, no-cache`)

**Files:**
- [/pages/api/images/[id].js](pages/api/images/[id].js) - validateOrigin() with Sec-Fetch headers

**Security Benefits:**
- Blocks DevTools "Open in new tab" access
- Prevents copy/paste URL into address bar
- Forces every request through validation (no cached responses)
- Protects against manual browser navigation attempts

### Layer 7: Scroll Position Persistence

Enhances user experience while maintaining security during navigation.

**Implementation:**
- ✅ Saves scroll position to sessionStorage before navigating to detail page
- ✅ Restores scroll position when returning via back button
- ✅ Data cleared after restoration (no persistent tracking)

**Files:**
- [/pages/results/index.js](pages/results/index.js) - handleDiagnosisClick(), scroll restoration useEffect
- [/next.config.mjs](next.config.mjs) - experimental.scrollRestoration

**Security Benefits:**
- Uses sessionStorage (isolated per tab, not shared across origins)
- Data automatically cleared when tab closes
- No cross-origin data leakage

## Threat Analysis

### Scenario 1: Direct VisualDx API Access
**Attack:** Attacker tries to call VisualDx API directly

**Protection:** ❌ **Blocked**
- Attacker does not have `CLIENT_ID` and `CLIENT_SECRET`
- Credentials stored server-side only

### Scenario 2: Next.js API Route Access

**Attack:** Attacker tries to call your Next.js API routes

**Protection:** ⚠️ **Difficult but Possible**

#### Defense Layers:
1. ❌ **From Different Domain:** Blocked by origin validation
2. ❌ **From Postman/curl:** Blocked by app key + origin validation
3. ❌ **Request Spam:** Blocked by rate limiting
4. ⚠️ **With Reverse-Engineered App Key:** Possible if attacker:
   - Inspects bundled JavaScript source
   - Extracts `NEXT_PUBLIC_APP_KEY`
   - Spoofs `Origin` header
   - **However:** Still limited by rate limiting

### Scenario 3: Image Hotlinking

**Attack:** Attacker tries to use image URLs on external website

**Protection:** ❌ **Blocked**
- Signed URLs expire after 5 minutes
- Signature validation prevents tampering
- Origin validation prevents cross-domain access

### Scenario 4: DevTools Image URL Access

**Attack:** Attacker opens image URL from DevTools in new tab/window

**Protection:** ❌ **Blocked**
- Sec-Fetch-Dest header check detects navigation vs image request
- Sec-Fetch-Site header must be 'same-origin'
- Accept header validation blocks text/html requests
- Browser cache disabled forces every request through validation

**Previous Vulnerability:**
- Browser navigation sends Referer header (passes origin check)
- Could open image directly in new tab

**Current Defense:**
- Multi-layer Sec-Fetch header validation
- Distinguishes between `<img>` tag loads and direct navigation
- No caching ensures protection persists

### Scenario 5: Token Extraction from Client Code

**Attack:** Attacker inspects browser DevTools to extract API tokens

**Protection:** ✅ **Impossible**
- Access tokens never sent to browser
- All token operations on server-side only
- Client only sees final data, never authentication details

## Security Enhancements

### Recommended Improvements

#### 1. Session-Based Authentication
**Priority:** High (for public applications)

```javascript
// Require user login before API access
// Only authenticated users can call endpoints
middleware: requireAuth()
```

**Benefits:**
- Strongest protection against unauthorized access
- Per-user access control
- Audit trail of API usage

#### 2. reCAPTCHA Integration
**Priority:** Medium (for public-facing endpoints)

```javascript
// Verify reCAPTCHA token with each request
// Prevents automated bot access
```

**Benefits:**
- Blocks automated scripts and bots
- Reduces abuse from scrapers
- Minimal user friction

#### 3. API Gateway
**Priority:** Medium (for production deployments)

**Options:**
- AWS API Gateway
- Cloudflare Workers
- Kong API Gateway

**Benefits:**
- Built-in rate limiting and DDoS protection
- Advanced authentication mechanisms
- Comprehensive monitoring and analytics
- Distributed deployment support

#### 4. App Key Rotation
**Priority:** Low (periodic maintenance)

```javascript
// Regularly rotate NEXT_PUBLIC_APP_KEY
// Invalidate old keys
```

**Benefits:**
- Limits window of exposure if key is leaked
- Forces attackers to re-extract key periodically

## Security Assessment

### Current Strengths ✅

1. **Credentials:** 100% secure - server-side only
2. **Origin Validation:** Blocks cross-domain requests
3. **Browser Navigation Protection:** Sec-Fetch headers block DevTools access
4. **App Key:** Basic protection layer
5. **Rate Limiting:** Prevents abuse and DoS
6. **Signed URLs:** Time-limited image access (5-minute expiry)
7. **Token Caching:** Reduced API exposure, better performance
8. **No Browser Caching:** Forces validation on every image request
9. **Scroll Persistence:** Enhances UX without security trade-offs

### Current Weaknesses ⚠️

1. **App Key Exposure:** `NEXT_PUBLIC_APP_KEY` visible in client code
2. **Rate Limit Persistence:** In-memory cache resets on restart
3. **No User Authentication:** Anyone with valid app key + origin can access
4. **Origin Header Spoofing:** Can be bypassed with custom HTTP clients

### Recommendations by Use Case

#### Internal Tool / Demo
**Current security:** ✅ **Sufficient**
- Token management provides strong credential protection
- Rate limiting prevents accidental abuse
- Origin validation blocks casual unauthorized access

#### Public Consumer Application
**Recommended additions:**
- ✅ Session-based user authentication
- ✅ reCAPTCHA for sensitive operations
- ✅ Redis-based rate limiting
- ✅ Regular app key rotation

#### Enterprise / Sensitive Data
**Recommended additions:**
- ✅ OAuth 2.0 / OpenID Connect
- ✅ API Gateway with advanced security
- ✅ Per-user rate limiting and quotas
- ✅ Comprehensive audit logging
- ✅ IP whitelisting for additional protection

## Environment Variables

### Server-Side Only (Never Exposed)
```bash
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
IMAGE_SECRET=your_image_secret
TOKEN_URL=https://api-dev.visualdx.com/v1/auth/token
```

### Client-Side (Bundled into Application)
```bash
NEXT_PUBLIC_APP_KEY=your_app_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Generate Secure Keys
```bash
# Generate app key
openssl rand -base64 32

# Generate image secret
openssl rand -base64 32
```

## Best Practices

1. **Never commit `.env.local`** to version control
2. **Rotate keys regularly** in production environments
3. **Monitor API usage** for unusual patterns
4. **Use HTTPS only** in production
5. **Keep dependencies updated** to patch security vulnerabilities
6. **Implement proper error handling** without exposing sensitive details
7. **Log security events** for audit and incident response
8. **Test security layers** regularly (attempt to bypass protections)
9. **Clear sessionStorage** on logout/session end
10. **Disable cache for sensitive endpoints** to ensure validation

## Common Pitfalls to Avoid

### ❌ Don't Store Secrets in Client Code
```javascript
// BAD - Never do this
const CLIENT_SECRET = "abc123"; // Visible in browser
```

### ❌ Don't Skip Origin Validation
```javascript
// BAD - Allows any origin
if (true) { // Always passes
  return true;
}
```

### ❌ Don't Return Sensitive Errors to Client
```javascript
// BAD - Exposes internal details
return res.status(500).json({ 
  error: error.stack,  // Shows file paths, code structure
  secret: process.env.CLIENT_SECRET // Leaks credentials
});

// GOOD - Generic error messages
return res.status(500).json({ 
  error: "Internal server error"
});
```

### ❌ Don't Trust Client-Side Validation Alone
```javascript
// BAD - Client can bypass
if (clientSaysValid) { // Client controls this
  grantAccess();
}

// GOOD - Always validate server-side
if (serverValidation(req)) {
  grantAccess();
}
```

### ✅ Do Validate Every Request
```javascript
// GOOD - Multi-layer validation
const validation = validateApiRequest(req);
const rateCheck = checkRateLimit(clientId);
const originValid = validateOrigin(req);
const signatureValid = validateRequestSignature(id, ts, sig);

if (!validation.valid || !rateCheck.allowed || !originValid || !signatureValid) {
  return res.status(403).json({ error: "Access denied" });
}
```

## Incident Response

If credentials are compromised:

1. **Immediate (Within 1 hour):**
   - Rotate `CLIENT_ID` and `CLIENT_SECRET` with VisualDx
   - Regenerate `IMAGE_SECRET` and redeploy
   - Block suspicious IPs at firewall/CDN level
   - Clear server-side token cache

2. **Short-term (Within 24 hours):**
   - Rotate `NEXT_PUBLIC_APP_KEY` and redeploy application
   - Force clear all client browsers (cache busting)
   - Review and tighten rate limits
   - Enable additional security layers (reCAPTCHA, auth)

3. **Analysis (Within 3 days):**
   - Review server logs for unauthorized access patterns
   - Identify scope of data accessed/exposed
   - Check for unusual API usage spikes
   - Trace attack vector (how credentials were obtained)

4. **Communication:**
   - Notify stakeholders about incident
   - Document timeline and impact assessment
   - Inform VisualDx if API abuse detected
   - Update security procedures based on lessons learned

5. **Prevention (Ongoing):**
   - Implement recommended security enhancements
   - Add monitoring and alerting for unusual patterns
   - Schedule regular security audits
   - Document and test incident response procedures

### Security Monitoring Checklist

**Daily:**
- [ ] Check error logs for unusual 401/403 responses
- [ ] Monitor API request volume for spikes

**Weekly:**
- [ ] Review rate limit hits
- [ ] Check for geographic anomalies in access patterns
- [ ] Verify all environment variables still secure

**Monthly:**
- [ ] Update dependencies (`npm audit fix`)
- [ ] Test security measures (penetration testing)
- [ ] Review and rotate app keys
- [ ] Audit access logs for patterns

## References

- [Next.js Security Best Practices](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [OAuth 2.0 Specification](https://oauth.net/2/)
