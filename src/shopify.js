import crypto from 'crypto';

// Scopes required by AppLens
export const SHOPIFY_SCOPES = [
  'read_themes',
  'write_themes',
  'read_script_tags',
  'write_script_tags',
  'read_content',
  'read_products',
].join(',');

// ── OAuth helpers ─────────────────────────────────────────────────────────────

export function buildOAuthUrl(shop, redirectUri, nonce) {
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_API_KEY,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
    state: nonce,
  });
  return `https://${shop}/admin/oauth/authorize?${params}`;
}

export function verifyHmac(query) {
  const { hmac, signature, ...rest } = query;
  if (!hmac) return false;

  // Sort and join remaining params
  const message = Object.keys(rest)
    .sort()
    .map(k => {
      const val = Array.isArray(rest[k]) ? rest[k].join(',') : rest[k];
      return `${k}=${val}`;
    })
    .join('&');

  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, 'hex'),
      Buffer.from(hmac, 'hex')
    );
  } catch {
    return false;
  }
}

export async function exchangeToken(shop, code) {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }
  return response.json();
}

// ── Session token (JWT) validation ───────────────────────────────────────────
// Shopify signs session tokens with HMAC-SHA256 using the API secret.

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, sig] = parts;
  const content = `${header}.${payload}`;

  const expected = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(content)
    .digest('base64url');

  if (sig !== expected) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) return null;
    return decoded;
  } catch {
    return null;
  }
}

// ── Shop validation ───────────────────────────────────────────────────────────

export function sanitizeShop(shop) {
  if (!shop) return null;
  const clean = shop
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase()
    .trim();
  // Must be *.myshopify.com
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(clean)) return null;
  return clean;
}

// ── Shopify REST API ──────────────────────────────────────────────────────────

export async function shopifyREST(shop, token, endpoint, options = {}) {
  const url = `https://${shop}/admin/api/2024-01${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify REST ${response.status} on ${endpoint}: ${text.slice(0, 200)}`);
  }

  return response.json();
}

// ── Shopify GraphQL ───────────────────────────────────────────────────────────

export async function shopifyGraphQL(shop, token, query, variables = {}) {
  const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify GraphQL ${response.status}`);
  }

  return response.json();
}
