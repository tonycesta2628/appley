import { Router } from 'express';
import crypto from 'crypto';
import { buildOAuthUrl, verifyHmac, exchangeToken, sanitizeShop } from '../shopify.js';
import { sessionsDB, activityDB } from '../db.js';

const router = Router();

// GET /auth — Begin OAuth flow
router.get('/auth', (req, res) => {
  const shop = sanitizeShop(req.query.shop);
  if (!shop) {
    return res.status(400).send('Missing or invalid ?shop= parameter (must be *.myshopify.com)');
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  res.cookie('applens_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 120_000, // 2 minutes
  });

  const callbackUrl = `${process.env.SHOPIFY_APP_URL}/auth/callback`;
  const authUrl = buildOAuthUrl(shop, callbackUrl, nonce);
  res.redirect(authUrl);
});

// GET /auth/callback — Complete OAuth and exchange code for access token
router.get('/auth/callback', async (req, res) => {
  const { code, state, shop: rawShop } = req.query;

  const shop = sanitizeShop(rawShop);
  if (!shop) return res.status(400).send('Invalid shop');

  // Validate HMAC
  if (!verifyHmac(req.query)) {
    return res.status(403).send('HMAC validation failed — request may have been tampered with');
  }

  // Validate nonce/state
  const storedNonce = req.cookies.applens_nonce;
  if (!storedNonce || storedNonce !== state) {
    return res.status(403).send('State mismatch — possible CSRF attempt');
  }

  res.clearCookie('applens_nonce');

  try {
    const { access_token: token, scope } = await exchangeToken(shop, code);
    sessionsDB.upsert(shop, token, scope);
    activityDB.log(shop, 'ok', 'AppLens installed successfully');
    console.log(`[auth] ${shop} installed`);

    const host = req.query.host || Buffer.from(`${shop}/admin`).toString('base64url');
    res.redirect(`/app?shop=${shop}&host=${host}`);
  } catch (err) {
    console.error('[auth] callback error:', err);
    res.status(500).send(`Authentication failed: ${err.message}`);
  }
});

export default router;
