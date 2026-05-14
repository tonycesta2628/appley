import { Router } from 'express';
import crypto from 'crypto';
import { sessionsDB, scansDB, activityDB } from '../db.js';
import { scanStore } from '../scanner.js';

const router = Router();

// ── HMAC validation ───────────────────────────────────────────────────────────
function verifyWebhookHmac(rawBody, hmac) {
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(rawBody)
    .digest('base64');
  return digest === hmac;
}

const webhookAuth = (req, res, next) => {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  if (!hmac || !verifyWebhookHmac(req.body, hmac)) {
    return res.status(401).json({ error: 'Webhook HMAC validation failed' });
  }
  try {
    req.webhookBody = JSON.parse(req.body.toString());
  } catch {
    req.webhookBody = {};
  }
  next();
};

// ── Webhook: app/uninstalled ──────────────────────────────────────────────────
router.post('/webhooks/app/uninstalled', webhookAuth, (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  console.log(`[webhook] app/uninstalled: ${shop}`);
  sessionsDB.delete(shop);
  res.status(200).json({ ok: true });
});

// ── Webhook: themes/publish — re-scan after theme deploy ─────────────────────
router.post('/webhooks/themes/publish', webhookAuth, async (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  console.log(`[webhook] themes/publish: ${shop}`);
  res.status(200).json({ ok: true }); // Respond immediately (Shopify expects < 5s)

  const session = sessionsDB.get(shop);
  if (!session) return;

  try {
    const data = await scanStore(shop, session.access_token);
    scansDB.save(shop, data);
    activityDB.log(shop, 'info', `Theme published — re-scan completed · score ${data.score.current}`);
  } catch (err) {
    console.error(`[webhook] re-scan failed for ${shop}:`, err.message);
  }
});

// ── Webhook: script_tags/create — new script detected ────────────────────────
router.post('/webhooks/script_tags/create', webhookAuth, (req, res) => {
  const shop = req.headers['x-shopify-shop-domain'];
  const tag = req.webhookBody;
  console.log(`[webhook] script_tags/create: ${shop} — ${tag.src}`);
  activityDB.log(shop, 'warn', `New script tag detected — ${tag.src?.split('/').pop() || tag.src}`);
  res.status(200).json({ ok: true });
});

export default router;
