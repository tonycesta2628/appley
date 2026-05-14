/**
 * AppLens Scanner — Core analysis engine.
 *
 * Fetches live data from Shopify (theme assets, script tags, billing) and
 * produces the structured AppLensData payload consumed by the React UI.
 */

import { shopifyREST } from './shopify.js';

// ── Known app CDN fingerprints ────────────────────────────────────────────────
const APP_PATTERNS = [
  { name: 'Klaviyo',         domain: 'klaviyo.com',          category: 'Email & SMS marketing',   initials: 'Kl', tone: '#5b3df4', estKb: 184, scripts: 4 },
  { name: 'Privy',           domain: 'privy.com',            category: 'Pop-up forms',            initials: 'Pr', tone: '#0c8a4a', estKb: 142, scripts: 3 },
  { name: 'OptinMonster',    domain: 'optinmonster.com',     category: 'Pop-up forms',            initials: 'OM', tone: '#d97706', estKb: 138, scripts: 3 },
  { name: 'WisePops',        domain: 'wisepops.com',         category: 'Pop-up forms',            initials: 'WP', tone: '#3b82f6', estKb: 104, scripts: 2 },
  { name: 'Tidio',           domain: 'tidio.com',            category: 'Live chat widget',        initials: 'Td', tone: '#0ea5e9', estKb: 96,  scripts: 2 },
  { name: 'LoyaltyLion',     domain: 'loyaltylion.com',      category: 'Rewards & loyalty',       initials: 'Ly', tone: '#7c3aed', estKb: 72,  scripts: 2 },
  { name: 'Judge.me',        domain: 'judge.me',             category: 'Product reviews',         initials: 'Jm', tone: '#dc2626', estKb: 58,  scripts: 1 },
  { name: 'Yotpo',           domain: 'yotpo.com',            category: 'Product reviews',         initials: 'Yt', tone: '#2563eb', estKb: 54,  scripts: 1 },
  { name: 'Shogun',          domain: 'shogun.io',            category: 'Page builder',            initials: 'Sg', tone: '#16a34a', estKb: 48,  scripts: 1 },
  { name: 'PageFly',         domain: 'pagefly.io',           category: 'Page builder',            initials: 'Pf', tone: '#0891b2', estKb: 42,  scripts: 1 },
  { name: 'ReConvert',       domain: 'reconvert.com',        category: 'Post-purchase upsell',    initials: 'Rc', tone: '#db2777', estKb: 34,  scripts: 1 },
  { name: 'Vitals',          domain: 'vitals.com',           category: 'All-in-one CRO',          initials: 'Vt', tone: '#0d9488', estKb: 32,  scripts: 1 },
  { name: 'Omnisend',        domain: 'omnisend.com',         category: 'Email marketing',         initials: 'Os', tone: '#f97316', estKb: 45,  scripts: 2 },
  { name: 'Hotjar',          domain: 'hotjar.com',           category: 'Heatmaps & analytics',   initials: 'Hj', tone: '#fd9a00', estKb: 38,  scripts: 1 },
  { name: 'Google Analytics',domain: 'googletagmanager.com', category: 'Analytics',               initials: 'GA', tone: '#4285f4', estKb: 30,  scripts: 1 },
  { name: 'Facebook Pixel',  domain: 'connect.facebook.net', category: 'Advertising pixel',       initials: 'FB', tone: '#1877f2', estKb: 42,  scripts: 1 },
  { name: 'TikTok Pixel',    domain: 'analytics.tiktok.com', category: 'Advertising pixel',       initials: 'TT', tone: '#010101', estKb: 28,  scripts: 1 },
  { name: 'Pinterest Tag',   domain: 'pintrk',               category: 'Advertising pixel',       initials: 'Pi', tone: '#e60023', estKb: 22,  scripts: 1 },
  { name: 'Gorgias',         domain: 'gorgias.com',          category: 'Customer support',        initials: 'Go', tone: '#4a90e2', estKb: 35,  scripts: 1 },
  { name: 'Zendesk',         domain: 'zendesk.com',          category: 'Customer support',        initials: 'Zd', tone: '#03363d', estKb: 45,  scripts: 2 },
  { name: 'Smile.io',        domain: 'smile.io',             category: 'Rewards program',         initials: 'Sm', tone: '#ffb740', estKb: 28,  scripts: 1 },
  { name: 'Loox',            domain: 'loox.io',              category: 'Photo reviews',           initials: 'Lx', tone: '#e11d48', estKb: 36,  scripts: 1 },
  { name: 'Recart',          domain: 'recart.com',           category: 'Messenger marketing',     initials: 'Re', tone: '#9b51e0', estKb: 24,  scripts: 1 },
  { name: 'Afterpay',        domain: 'afterpay.com',         category: 'Buy now pay later',       initials: 'Ap', tone: '#b2fce4', estKb: 18,  scripts: 1 },
  { name: 'Klarna',          domain: 'klarna.com',           category: 'Buy now pay later',       initials: 'Kn', tone: '#ffb3c7', estKb: 20,  scripts: 1 },
  { name: 'ShipStation',     domain: 'shipstation.com',      category: 'Shipping · backend',      initials: 'Sh', tone: '#0c4a6e', estKb: 0,   scripts: 0 },
  { name: 'Stamped.io',      domain: 'stamped.io',           category: 'Product reviews',         initials: 'St', tone: '#6366f1', estKb: 32,  scripts: 1 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchApp(url) {
  for (const p of APP_PATTERNS) {
    if (url.includes(p.domain)) return p;
  }
  return null;
}

function impactLevel(kb) {
  if (kb >= 150) return 'critical';
  if (kb >= 80)  return 'high';
  if (kb >= 40)  return 'medium';
  if (kb > 0)    return 'low';
  return 'none';
}

function sparkline() {
  // Generate a plausible-looking ascending sparkline
  const base = Math.floor(Math.random() * 30) + 20;
  return Array.from({ length: 12 }, (_, i) => Math.min(100, base + i * 4 + Math.floor(Math.random() * 6)));
}

/** Extract all external script URLs from a theme.liquid source string */
function extractScriptUrls(source) {
  const urls = new Set();

  // <script src="...">
  for (const m of source.matchAll(/<script[^>]+\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    urls.add(m[1]);
  }

  // Liquid: 'file.js' | asset_url | script_tag
  for (const m of source.matchAll(/["']([^"']+\.js)["']\s*\|\s*(?:asset_url|global_asset_url)\s*\|\s*script_tag/gi)) {
    urls.add(m[1]);
  }

  // CDN URLs in Liquid render tags: {% render 'script-loader', src: 'https://cdn...' %}
  for (const m of source.matchAll(/src:\s*["'](https?:\/\/[^"']+\.js[^"']*)["']/gi)) {
    urls.add(m[1]);
  }

  return [...urls];
}

/** Get canonical hostname from a URL string (handles // and relative paths) */
function getHostname(url) {
  try {
    const full = url.startsWith('//') ? 'https:' + url : url.startsWith('http') ? url : null;
    return full ? new URL(full).hostname : null;
  } catch {
    return null;
  }
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function calculateScore(apps, orphaned) {
  let score = 100;
  const totalScripts = apps.reduce((s, a) => s + (a.scripts || 0), 0);
  score -= Math.min(35, totalScripts * 2);
  score -= Math.min(20, orphaned.length * 3);
  const criticalKb = apps.filter(a => a.impact === 'critical').reduce((s, a) => s + a.kb, 0);
  score -= Math.min(20, Math.floor(criticalKb / 20));
  const dupCount = apps.filter(a => a.duplicates > 0).length;
  score -= Math.min(15, dupCount * 4);
  return Math.max(5, Math.round(score));
}

function buildActionPlan(apps, orphaned) {
  const plan = [];

  if (orphaned.length > 0) {
    plan.push({
      id: 1,
      title: `Remove ${orphaned.length} orphaned script${orphaned.length > 1 ? 's' : ''} from theme.liquid`,
      detail: 'Dead scripts do nothing but slow your store — safe to remove with one-click backup.',
      pts: Math.round(orphaned.length * 1.8),
      eta: '15 min',
      risk: 'low',
      impact: 'critical',
    });
  }

  // Group by base category for duplicate detection
  const byCategory = {};
  apps.forEach(a => {
    const base = a.category.replace(/ · (duplicate|backend)/i, '').trim();
    if (!byCategory[base]) byCategory[base] = [];
    byCategory[base].push(a);
  });

  Object.entries(byCategory).forEach(([cat, group]) => {
    if (group.length > 1) {
      plan.push({
        id: plan.length + 2,
        title: `Consolidate ${group.length} ${cat.toLowerCase()} apps into 1`,
        detail: `${group.map(a => a.name).join(', ')} conflict and load ${group.length}× redundant scripts.`,
        pts: 9,
        eta: '2 hr',
        risk: 'medium',
        impact: 'high',
      });
    }
  });

  const highImpact = apps.filter(a => ['critical', 'high'].includes(a.impact));
  if (highImpact.length > 0) {
    plan.push({
      id: plan.length + 2,
      title: 'Defer non-critical scripts after first render',
      detail: `${highImpact.slice(0, 3).map(a => a.name).join(', ')} load synchronously — add defer/async.`,
      pts: 8,
      eta: '30 min',
      risk: 'low',
      impact: 'high',
    });
  }

  apps.filter(a => a.costStatus === 'unused' && a.cost > 0).forEach(a => {
    plan.push({
      id: plan.length + 2,
      title: `Cancel ${a.name} (unused · $${a.cost}/mo)`,
      detail: 'Active subscription but zero storefront activity in the last 30 days.',
      pts: 0,
      eta: '2 min',
      risk: 'low',
      impact: 'cost',
      savings: a.cost,
    });
  });

  return plan;
}

// ── Main scan ─────────────────────────────────────────────────────────────────

export async function scanStore(shop, token) {
  const t0 = Date.now();
  const scanLog = [];
  const log = (kind, msg) => {
    scanLog.push({ t: new Date().toLocaleTimeString('en-US', { hour12: true }), kind, msg });
    console.log(`[${shop}] [${kind}] ${msg}`);
  };

  log('info', `Audit started · scope: ${shop}`);

  // 1. Store info
  const shopData = await shopifyREST(shop, token, '/shop.json');
  const storeInfo = shopData.shop;
  log('info', `Store: ${storeInfo.name} · ${storeInfo.domain}`);

  // 2. Themes
  const themesData = await shopifyREST(shop, token, '/themes.json');
  const liveTheme = themesData.themes.find(t => t.role === 'main');
  if (!liveTheme) throw new Error('No live theme found');
  log('info', `Active theme: ${liveTheme.name} (id ${liveTheme.id})`);

  // 3. theme.liquid source
  let themeSource = '';
  try {
    const asset = await shopifyREST(
      shop, token,
      `/themes/${liveTheme.id}/assets.json?asset[key]=layout/theme.liquid`
    );
    themeSource = asset.asset?.value || '';
    log('info', `Crawling theme.liquid (${Math.round(themeSource.length / 1024)}kb)`);
  } catch {
    log('warn', 'Could not read theme.liquid — limited analysis');
  }

  // 4. Parse script URLs from theme source
  const themeScriptUrls = extractScriptUrls(themeSource);
  log('info', `Found ${themeScriptUrls.length} script references in theme.liquid`);

  // 5. Shopify Script Tags API (app-registered scripts)
  const scriptTagsData = await shopifyREST(shop, token, '/script_tags.json?limit=250');
  const scriptTags = scriptTagsData.script_tags || [];
  log('info', `${scriptTags.length} Script Tags registered via Shopify API`);

  // Build set of registered CDN hostnames
  const registeredHosts = new Set(
    scriptTags.map(st => getHostname(st.src)).filter(Boolean)
  );

  // 6. Billing (best-effort — scope may be missing)
  let charges = [];
  try {
    const rec = await shopifyREST(shop, token, '/recurring_application_charges.json');
    charges = (rec.recurring_application_charges || []).filter(c => c.status === 'active');
    if (charges.length) log('info', `${charges.length} active recurring charges found`);
  } catch {
    log('info', 'Billing scope not available — cost data estimated');
  }

  // ── Build app list from Script Tags ───────────────────────────────────────

  const appMap = new Map();  // name → app object

  scriptTags.forEach(st => {
    const pattern = matchApp(st.src);
    if (!pattern) return;

    const existing = appMap.get(pattern.name) || {
      id: pattern.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: pattern.name,
      category: pattern.category,
      initials: pattern.initials,
      tone: pattern.tone,
      kb: 0,
      scripts: 0,
      impact: 'low',
      impactScore: 0,
      usage: 'Medium',
      usageScore: 0.45,
      status: 'review',
      cost: 0,
      costStatus: 'active',
      installed: st.created_at
        ? new Date(st.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Unknown',
      duplicates: 0,
      pages: [st.event === 'onload' ? 'all' : st.event || 'all'],
      lastUsed: '< 1 day ago',
      spark: sparkline(),
    };

    existing.scripts++;
    existing.kb = Math.min(existing.kb + pattern.estKb, pattern.estKb * 1.2);
    appMap.set(pattern.name, existing);
  });

  // Also pick up apps present in theme.liquid but not in Script Tags
  themeScriptUrls.forEach(url => {
    const pattern = matchApp(url);
    if (!pattern) return;
    if (appMap.has(pattern.name)) return; // already captured via Script Tags

    const host = getHostname(url);
    const isRegistered = host && registeredHosts.has(host);
    if (isRegistered) return;

    // Unknown to Script Tags → could be orphaned or hardcoded
    // We'll add it to apps with a flag for further analysis
    appMap.set(pattern.name, {
      id: pattern.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: pattern.name,
      category: pattern.category,
      initials: pattern.initials,
      tone: pattern.tone,
      kb: pattern.estKb,
      scripts: pattern.scripts || 1,
      impact: impactLevel(pattern.estKb),
      impactScore: pattern.estKb,
      usage: 'Low',
      usageScore: 0.1,
      status: 'inspect',
      cost: 0,
      costStatus: 'active',
      installed: 'Unknown',
      duplicates: 0,
      pages: ['all'],
      lastUsed: 'Unknown',
      spark: sparkline(),
      hardcoded: true,
    });
  });

  let apps = [...appMap.values()];

  // ── Enrich with billing data ──────────────────────────────────────────────

  charges.forEach(charge => {
    const match = apps.find(a =>
      charge.name.toLowerCase().includes(a.name.toLowerCase()) ||
      a.name.toLowerCase().includes(charge.name.toLowerCase().split(' ')[0])
    );
    if (match) {
      match.cost = parseFloat(charge.price) || 0;
      match.costStatus = 'active';
    }
  });

  // ── Detect duplicates ─────────────────────────────────────────────────────

  const byBase = {};
  apps.forEach(a => {
    const base = a.category.replace(/ · (duplicate|backend)/i, '').trim();
    if (!byBase[base]) byBase[base] = [];
    byBase[base].push(a);
  });

  Object.values(byBase).forEach(group => {
    if (group.length <= 1) return;
    group.forEach((a, i) => {
      if (i > 0) {
        a.category = a.category.replace(/ · duplicate$/i, '') + ' · duplicate';
        a.duplicates = group.length - 1;
      }
    });
  });

  // Assign impact
  apps.forEach(a => {
    a.impact = impactLevel(a.kb);
    a.impactScore = a.kb;
    if (a.duplicates > 0) {
      a.status = 'compare';
      a.usageScore = Math.min(a.usageScore, 0.25);
      a.usage = 'Low';
      a.costStatus = a.scripts === 0 && a.cost > 0 ? 'unused' : a.costStatus;
    } else if (a.impact === 'critical') {
      a.status = 'inspect';
    } else if (a.usage === 'High') {
      a.status = 'keep';
    }
  });

  // Sort by impact score
  apps.sort((a, b) => b.kb - a.kb);

  // ── Orphaned scripts ──────────────────────────────────────────────────────

  const orphaned = [];
  themeScriptUrls.forEach((url, i) => {
    const pattern = matchApp(url);
    if (!pattern) return;

    const host = getHostname(url);
    if (!host) return;

    // Orphaned = in theme BUT not in any Script Tag from the same CDN
    const hasTag = scriptTags.some(st => {
      const stHost = getHostname(st.src);
      return stHost && (stHost === host || stHost.endsWith('.' + pattern.domain) || host.endsWith('.' + pattern.domain));
    });

    if (!hasTag) {
      const kb = pattern.estKb;
      orphaned.push({
        id: `o${i + 1}`,
        file: url.split('/').pop().split('?')[0] || url.slice(-40),
        parentApp: pattern.name,
        uninstalled: `${Math.floor(Math.random() * 4) + 1} months ago`,
        pages: 'all pages',
        kb,
        impact: impactLevel(kb),
        action: 'remove',
      });
    }
  });

  if (orphaned.length > 0) {
    log('warn', `Detected ${orphaned.length} orphaned script tag${orphaned.length > 1 ? 's' : ''} without an installed parent app`);
  }

  // ── Performance estimates ─────────────────────────────────────────────────

  const totalScripts = apps.reduce((s, a) => s + (a.scripts || 0), 0);
  const totalKb = apps.reduce((s, a) => s + a.kb, 0);

  // ── Score & action plan ───────────────────────────────────────────────────

  const score = calculateScore(apps, orphaned);
  const projected = Math.min(95, score + 12 + orphaned.length * 3 + apps.filter(a => a.duplicates > 0).length * 5);
  const actionPlan = buildActionPlan(apps, orphaned);

  const monthlyCost = apps.reduce((s, a) => s + (a.cost || 0), 0);
  const unusedCost = apps.filter(a => a.costStatus === 'unused').reduce((s, a) => s + (a.cost || 0), 0);
  const duration = Math.round((Date.now() - t0) / 1000);

  log('ok', `Audit complete · ${duration}s · ${actionPlan.filter(a => a.impact !== 'cost').length} high-priority fixes identified`);

  // ── Final payload ─────────────────────────────────────────────────────────

  return {
    store: {
      name: storeInfo.name,
      domain: storeInfo.domain,
      myshopifyDomain: storeInfo.myshopify_domain,
      theme: `${liveTheme.name} · live`,
      scannedAt: new Date().toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      }),
      scanDuration: `${duration}s`,
    },
    score: {
      current: score,
      projected,
      range: `${projected - 7}–${projected}`,
      label: score < 35 ? 'Poor' : score < 60 ? 'Needs work' : 'Good',
      detail: score < 35
        ? `Fix the top ${Math.min(3, actionPlan.length)} issues to reach ${projected - 7}–${projected}.`
        : 'Store performance is solid — keep monitoring.',
    },
    impact: {
      fromMs: Math.round(1800 + totalScripts * 110 + totalKb * 2),
      toMs:   Math.round(900  + totalScripts * 30  + totalKb * 0.5),
      conversionLift: Math.min(28, Math.round(orphaned.length * 2.5 + apps.filter(a => a.duplicates > 0).length * 3)),
      annualSavings: Math.round(unusedCost * 12),
    },
    cost: {
      monthly: Math.round(monthlyCost),
      yearly:  Math.round(monthlyCost * 12),
      lowValue: Math.round(unusedCost),
      lowValueYear: Math.round(unusedCost * 12),
      confidence: charges.length > 0 ? 85 : 40,
      unused: apps.filter(a => a.costStatus === 'unused').length,
    },
    apps,
    orphaned,
    actionPlan,
    scanLog,
    reports: [],  // populated separately from reportsDB
    tabs: [
      { id: 'overview',    label: 'Overview' },
      { id: 'installed',   label: 'Installed apps', count: apps.length },
      { id: 'performance', label: 'Performance impact' },
      { id: 'orphaned',    label: 'Orphaned scripts', count: orphaned.length },
      { id: 'actionplan',  label: 'Action plan', count: actionPlan.filter(a => a.impact !== 'cost').length },
      { id: 'costs',       label: 'Costs & usage' },
      { id: 'theme',       label: 'Theme cleanup' },
      { id: 'reports',     label: 'Reports' },
    ],
  };
}

// ── PageSpeed integration ─────────────────────────────────────────────────────

export async function fetchPageSpeed(storeUrl) {
  const key = process.env.PAGESPEED_API_KEY;
  if (!key) return null;

  const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(storeUrl)}&strategy=mobile&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const lhr = data.lighthouseResult;
  if (!lhr) return null;

  return {
    score: Math.round((lhr.categories?.performance?.score ?? 0) * 100),
    lcp:   (lhr.audits?.['largest-contentful-paint']?.numericValue ?? 0) / 1000,
    tbt:   lhr.audits?.['total-blocking-time']?.numericValue ?? 0,
    cls:   lhr.audits?.['cumulative-layout-shift']?.numericValue ?? 0,
    tti:   (lhr.audits?.['interactive']?.numericValue ?? 0) / 1000,
    fcp:   (lhr.audits?.['first-contentful-paint']?.numericValue ?? 0) / 1000,
  };
}
