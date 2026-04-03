// -----------------------------
// DIRECT COGNITO CONFIG (NO ENV)
// -----------------------------

const COGNITO_LOGIN_BASE = "https://developer-portal-auth-dev.auth.us-east-2.amazoncognito.com/login";
const CLIENT_ID = "2c9lfc949jumk2jniodup19r3d";
const RESPONSE_TYPE = "token";
const SCOPE = encodeURIComponent("email openid profile");

// -----------------------------
// BUILD LOGIN URL — dynamic redirect_uri
// -----------------------------

function getLoginUrl(req) {
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const redirectUri = encodeURIComponent(`${protocol}://${host}/auth/callback`);

    return (
        `${COGNITO_LOGIN_BASE}?client_id=${CLIENT_ID}` +
        `&response_type=${RESPONSE_TYPE}` +
        `&scope=${SCOPE}` +
        `&redirect_uri=${redirectUri}`
    );
}

// -----------------------------
// HANDLER
// -----------------------------

export default function signin(req, res) {
    const loginUrl = getLoginUrl(req);
    res.redirect(loginUrl);
}
