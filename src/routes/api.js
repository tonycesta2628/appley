import { Router } from 'express';
import { verifySessionToken, sanitizeShop, shopifyREST } from '../shopify.js';
import { sessionsDB, scansDB, reportsDB, activityDB } from '../db.js';
import { scanStore, fetchPageSpeed } from '../scanner.js';

const router = Router();

// ── Auth middleware ───────────────────────────────────────────────────────────
// Supports two modes:
//   1. Session token (Authorization: Bearer <jwt>) — production embedded app
//   2. ?shop= query param — development / CLI testing

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  let shop = null;

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const decoded = verifySessionToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid session token' });
    // dest looks like "https://shop.myshopify.com"
    shop = sanitizeShop((decoded.dest || '').replace(/^https?:\/\//, ''));
    if (!shop) return res.status(401).json({ error: 'Invalid shop in token' });
  } else {
    shop = sanitizeShop(req.query.shop || req.body?.shop);
    if (!shop) return res.status(401).json({ error: 'Authorization required' });
  }

  const session = sessionsDB.get(shop);
  if (!session) {
    return res.status(401).json({ error: 'Shop not installed', redirectTo: `/auth?shop=${shop}` });
  }

  req.shop = shop;
  req.accessToken = session.access_token;
  next();
};

// ── GET /api/data — Load scan data (cached or fresh) ──────────────────────────
router.get('/api/data', requireAuth, async (req, res) => {
  const { shop, accessToken } = req;
  const force = req.query.force === 'true';
  const CACHE_TTL = 300; // 5 minutes

  if (!force) {
    const cached = scansDB.getLatest(shop);
    if (cached) {
      const ageSeconds = Date.now() / 1000 - cached.created_at;
      if (ageSeconds < CACHE_TTL) {
        // Attach live reports
        cached.data.reports = reportsDB.list(shop);
        return res.json({ ...cached.data, _cached: true, _cacheAge: Math.round(ageSeconds) });
      }
    }
  }

  try {
    const data = await scanStore(shop, accessToken);
    data.reports = reportsDB.list(shop);
    scansDB.save(shop, data);
    activityDB.log(shop, 'ok', `Audit complete · score ${data.score.current} · ${data.orphaned.length} orphaned scripts`);
    res.json({ ...data, _cached: false });
  } catch (err) {
    console.error(`[api/data] ${shop}:`, err.message);

    // Fall back to last cached scan if available
    const cached = scansDB.getLatest(shop);
    if (cached) {
      cached.data.reports = reportsDB.list(shop);
      return res.json({ ...cached.data, _cached: true, _error: err.message });
    }

    res.status(500).json({ error: `Scan failed: ${err.message}` });
  }
});

// ── POST /api/scan — Force a fresh scan ───────────────────────────────────────
router.post('/api/scan', requireAuth, async (req, res) => {
  const { shop, accessToken } = req;
  try {
    const data = await scanStore(shop, accessToken);
    data.reports = reportsDB.list(shop);
    scansDB.save(shop, data);
    activityDB.log(shop, 'ok', `Manual scan · score ${data.score.current}`);
    res.json({ ...data, _cached: false });
  } catch (err) {
    console.error(`[api/scan] ${shop}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/performance — PageSpeed Insights ─────────────────────────────────
router.get('/api/performance', requireAuth, async (req, res) => {
  const { shop } = req;
  const storeUrl = `https://${shop}`;

  try {
    const result = await fetchPageSpeed(storeUrl);
    if (!result) {
      return res.json({
        _mock: true,
        score: 28,
        lcp: 4.8, tbt: 720, cls: 0.08, tti: 5.6, fcp: 2.4,
        message: 'Set PAGESPEED_API_KEY for live metrics',
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/theme/assets — List live theme assets ────────────────────────────
router.get('/api/theme/assets', requireAuth, async (req, res) => {
  const { shop, accessToken } = req;
  try {
    const themesData = await shopifyREST(shop, accessToken, '/themes.json');
    const live = themesData.themes.find(t => t.role === 'main');
    if (!live) return res.status(404).json({ error: 'No live theme' });
    const assets = await shopifyREST(shop, accessToken, `/themes/${live.id}/assets.json`);
    res.json({ theme: live, assets: assets.assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/reports — List report templates ──────────────────────────────────
router.get('/api/reports', requireAuth, (req, res) => {
  res.json(reportsDB.list(req.shop));
});

// ── POST /api/reports — Create or update a report ────────────────────────────
router.post('/api/reports', requireAuth, (req, res) => {
  const report = {
    ...req.body,
    id: req.body.id || `${req.shop}-${Date.now()}`,
    shop: req.shop,
  };
  reportsDB.upsert(report);
  res.json({ ok: true, report });
});

// ── DELETE /api/reports/:id — Delete a report ─────────────────────────────────
router.delete('/api/reports/:id', requireAuth, (req, res) => {
  reportsDB.delete(req.params.id);
  res.json({ ok: true });
});

// ── GET /api/activity — Recent activity log ───────────────────────────────────
router.get('/api/activity', requireAuth, (req, res) => {
  res.json(activityDB.recent(req.shop, 20));
});

// ── GET /api/scan/history — Scan history ─────────────────────────────────────
router.get('/api/scan/history', requireAuth, (req, res) => {
  res.json(scansDB.history(req.shop, 10));
});

export default router;
