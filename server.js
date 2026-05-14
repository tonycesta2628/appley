import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sessionsDB } from './src/db.js';
import { sanitizeShop } from './src/shopify.js';
import authRoutes from './src/routes/auth.js';
import apiRoutes from './src/routes/api.js';
import webhookRoutes from './src/routes/webhooks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ── Webhooks need raw body before any body parser ─────────────────────────────
app.use('/webhooks', express.raw({ type: 'application/json' }));

// ── Standard middleware ───────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// Permissive CSP so Shopify admin can embed this app in an iframe
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors https://*.myshopify.com https://admin.shopify.com"
  );
  next();
});

// ── Static assets ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Auth & webhooks ───────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', apiRoutes);
app.use('/', webhookRoutes);

// ── Root → redirect to install or app ────────────────────────────────────────
app.get('/', (req, res) => {
  const shop = sanitizeShop(req.query.shop);
  if (shop) {
    const session = sessionsDB.get(shop);
    if (session) {
      const host = req.query.host || Buffer.from(`${shop}/admin`).toString('base64url');
      return res.redirect(`/app?shop=${shop}&host=${host}`);
    }
    return res.redirect(`/auth?shop=${shop}`);
  }
  res.sendFile(path.join(__dirname, 'public', 'install.html'));
});

// ── Embedded app page ─────────────────────────────────────────────────────────
app.get('/app', (req, res) => {
  const shop = sanitizeShop(req.query.shop);
  if (!shop) return res.redirect('/');

  const session = sessionsDB.get(shop);
  if (!session) return res.redirect(`/auth?shop=${shop}`);

  // Inject API key so the client can initialise App Bridge
  const template = fs.readFileSync(path.join(__dirname, 'public', 'embed.html'), 'utf8');
  const html = template.replace(/__SHOPIFY_API_KEY__/g, process.env.SHOPIFY_API_KEY || '');
  res.send(html);
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  AppLens running on port ${PORT}`);
  console.log(`  Install URL: ${process.env.SHOPIFY_APP_URL || `http://localhost:${PORT}`}?shop=YOURSTORE.myshopify.com\n`);
});
