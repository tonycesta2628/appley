# AppLens — Shopify App Auditor

AppLens is a fully embedded Shopify app that acts like a task-manager for your store's installed apps. It identifies performance-killing scripts, orphaned code from uninstalled apps, duplicate app categories, and wasted subscription spend — then gives you a step-by-step fix plan with one-click theme cleanup.

## Features

| Tab | What it shows |
|-----|--------------|
| **Overview** | Performance score ring, top KPIs, waterfall chart, action plan summary, scan log |
| **Installed apps** | All detected apps with script weight, 30-day trend sparkline, usage, cost, and bulk-action controls |
| **Performance impact** | Core Web Vitals (LCP, TBT, CLS, TTI), page-by-page Lighthouse scores, script waterfall, treemap |
| **Orphaned scripts** | Scripts in `theme.liquid` whose parent app is no longer installed — with one-click mark-for-removal |
| **Action plan** | Prioritised, checkable fix list — each item shows projected score gain, effort estimate, and risk |
| **Costs & usage** | Cost vs. usage scatter chart, fiscal-year projection, unused paid apps, renewal calendar |
| **Theme cleanup** | Safe diff-based workflow — duplicates theme first, lets you preview & compare before publishing |
| **Reports** | Scheduled PDF/email/Slack reports, alert rules, 7-day activity log |

---

## Quick start

### 1. Prerequisites

- **Node.js 18+** (`node --version`)
- A **Shopify Partner account** — [partners.shopify.com](https://partners.shopify.com)
- A **development store** (or any store you have access to)
- **ngrok** (or any HTTPS tunnel) for local development

### 2. Create the Shopify app

1. Log in to your Partner Dashboard → **Apps → Create app → Create app manually**
2. Give it a name (e.g. *AppLens Dev*)
3. Under **App setup**, set:
   - **App URL**: `https://YOUR-NGROK-URL.ngrok.io`
   - **Allowed redirection URLs**: `https://YOUR-NGROK-URL.ngrok.io/auth/callback`
4. Copy the **API key** and **API secret key**

### 3. Configure the project

```bash
cd applens-shopify
cp .env.example .env
```

Edit `.env`:

```env
SHOPIFY_API_KEY=your_api_key_from_partner_dashboard
SHOPIFY_API_SECRET=your_api_secret_from_partner_dashboard
SHOPIFY_APP_URL=https://YOUR-NGROK-URL.ngrok.io
PORT=3000

# Optional: enables live PageSpeed Insights metrics
# Get a free key at https://developers.google.com/speed/docs/insights/v5/get-started
PAGESPEED_API_KEY=
```

### 4. Install dependencies

```bash
npm install
```

> **Note:** `better-sqlite3` compiles a native addon. If you see a build error, run `npm install --build-from-source` or ensure you have Xcode CLT (macOS) / build-essential (Linux) installed.

### 5. Start the dev server and tunnel

In one terminal:
```bash
npm run dev
# or: npm start
```

In another terminal:
```bash
ngrok http 3000
# Copy the https:// URL into .env as SHOPIFY_APP_URL (then restart the server)
```

### 6. Install on your test store

Open your browser:
```
https://YOUR-NGROK-URL.ngrok.io?shop=YOUR-STORE.myshopify.com
```

You'll be redirected through Shopify's OAuth flow. After approval, AppLens opens inside your Shopify Admin and immediately runs its first scan.

---

## Deployment (production)

### Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `SHOPIFY_API_KEY` | Yes | From Partner Dashboard |
| `SHOPIFY_API_SECRET` | Yes | From Partner Dashboard |
| `SHOPIFY_APP_URL` | Yes | Public HTTPS URL (no trailing slash) |
| `PORT` | No | Default `3000` |
| `PAGESPEED_API_KEY` | No | Google PageSpeed Insights API key |
| `NODE_ENV` | No | Set to `production` in prod |

### Deploy to Railway / Render / Fly.io

These platforms work out of the box with this Express app. The SQLite database (`applens.sqlite`) is created in the project root on first run.

For platforms without persistent disk (e.g. Heroku dynos), mount a volume at `/app/applens.sqlite` or swap `better-sqlite3` for a hosted Postgres/MySQL client.

### Register webhooks

After deploying, register the webhooks in your Partner Dashboard (or via Shopify API):

| Topic | Path |
|-------|------|
| `app/uninstalled` | `https://YOUR-DOMAIN/webhooks/app/uninstalled` |
| `themes/publish` | `https://YOUR-DOMAIN/webhooks/themes/publish` |
| `script_tags/create` | `https://YOUR-DOMAIN/webhooks/script_tags/create` |

---

## Architecture

```
applens-shopify/
├── server.js               ← Express app (OAuth, routing, template injection)
├── src/
│   ├── db.js               ← SQLite (sessions, scans, reports, activity log)
│   ├── shopify.js          ← OAuth helpers, HMAC, REST/GraphQL client
│   ├── scanner.js          ← Core scan engine + PageSpeed integration
│   └── routes/
│       ├── auth.js         ← GET /auth, GET /auth/callback
│       ├── api.js          ← GET /api/data, POST /api/scan, GET /api/reports, …
│       └── webhooks.js     ← POST /webhooks/*
└── public/
    ├── embed.html          ← Embedded app shell (served at /app, API key injected)
    ├── install.html        ← Install page (served at /)
    ├── tokens.css          ← Polaris-inspired design tokens (light + dark)
    ├── layout.css          ← Screen-specific layout rules
    ├── ui.jsx              ← Shared icons, Badge, ScoreRing, Sparkline, charts
    ├── screens-a.jsx       ← Overview, Installed apps, Performance
    ├── screens-b.jsx       ← Orphaned scripts, Action plan, Costs
    └── screens-c.jsx       ← Theme cleanup, Reports
```

### How scanning works

1. **Fetch** `GET /admin/api/2024-01/themes.json` → find the live theme
2. **Fetch** `GET /admin/api/2024-01/themes/{id}/assets.json?asset[key]=layout/theme.liquid`
3. **Parse** all `<script src="…">` and Liquid `asset_url | script_tag` references
4. **Fetch** `GET /admin/api/2024-01/script_tags.json` — apps that registered script tags via API
5. **Cross-reference**: scripts present in `theme.liquid` but absent from the Script Tags API → **orphaned**
6. **Match** each script URL against 30+ known app CDN fingerprints (Klaviyo, Privy, Tidio, etc.)
7. **Fetch** billing via `GET /admin/api/2024-01/recurring_application_charges.json` (if scoped)
8. **Score** the store (0–100) based on total script count, orphan count, duplicates, and payload size
9. **Generate** a prioritised action plan from the findings
10. **Cache** results in SQLite for 5 minutes

### Shopify permissions required

| Scope | Used for |
|-------|---------|
| `read_themes` | Read `theme.liquid` to detect scripts |
| `write_themes` | (Future) Apply safe edits via Theme API |
| `read_script_tags` | Compare registered script tags vs theme scripts |
| `write_script_tags` | (Future) Remove orphaned script tag registrations |
| `read_content` | Blog/page asset detection |
| `read_products` | Product page script attribution |

---

## Customisation

### Adding more app fingerprints

Edit `APP_PATTERNS` in [src/scanner.js](src/scanner.js). Each entry needs:

```js
{ name, domain, category, initials, tone, estKb, scripts }
```

### Extending the UI

The UI is plain React + custom CSS (no Polaris components) matching the Figma design exactly. Screens live in `public/screens-a/b/c.jsx`. The data shape is defined by `window.AppLensData` — match the schema returned by `scanStore()` in `src/scanner.js`.

### Enabling live PageSpeed metrics

1. Get a free API key: [developers.google.com/speed/docs/insights/v5/get-started](https://developers.google.com/speed/docs/insights/v5/get-started)
2. Add it to `.env`: `PAGESPEED_API_KEY=AIza...`
3. Re-scan — the Performance tab will now show live Core Web Vitals

---

## Development tips

- **Test without a real store**: hit `/api/data?shop=demo.myshopify.com` — you'll get a 401. Create a `sessionsDB.upsert('demo.myshopify.com', 'fake-token', 'read_themes')` call in a scratch script and mock the Shopify REST responses for fast iteration.
- **SQLite browser**: open `applens.sqlite` with [DB Browser for SQLite](https://sqlitebrowser.org/) to inspect sessions, scans, and logs.
- **Dark mode**: the light/dark toggle in the top-right corner persists via `data-theme` attribute on `<html>`. Both palettes are defined in `tokens.css`.

---

## License

MIT
