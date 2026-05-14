// AppLens — Overview, Installed apps, Performance impact screens

// Proxy so re-scans update the UI without reloading
const D = new Proxy({}, { get: (_, k) => window.AppLensData[k] });

// =====================================================================
// OVERVIEW
// =====================================================================

const Overview = ({ go }) => {
  const score = useCount(D.score.current);
  const cost  = useCount(D.cost.monthly);

  const top = D.apps.filter(a => a.scripts > 0).slice(0, 8);

  // Waterfall items (synthetic)
  const wf = [
    { label:'klaviyo onsite.js',  start:0,    dur:840, tone:'critical' },
    { label:'privy widget.js',    start:120,  dur:620, tone:'critical' },
    { label:'optinmonster.js',    start:180,  dur:540, tone:'critical' },
    { label:'wisepops.js',        start:340,  dur:380, tone:'warning' },
    { label:'tidio chat.js',      start:480,  dur:320, tone:'warning' },
    { label:'loyaltylion.js',     start:610,  dur:240, tone:'warning' },
    { label:'judge.me widget.js', start:780,  dur:180, tone:'success' },
  ];

  return (
    <div className="ov-grid">
      {/* HERO */}
      <section className="card ov-hero">
        <div className="ov-hero-left">
          <ScoreRing value={D.score.current} projected={D.score.projected} size={148} stroke={11} label="/100" />
          <div style={{textAlign:'center', marginTop:10}}>
            <div className="ov-hero-rating">
              <Badge tone="critical" dot>Poor — needs fixing</Badge>
            </div>
            <div className="ov-hero-rating-detail">
              {D.score.detail}
            </div>
            <div className="ov-hero-projected">
              <span className="muted">Projected after fixes</span>
              <strong className="tnum" style={{color:'var(--success-fg)'}}>↑ {D.score.projected}</strong>
            </div>
          </div>
        </div>

        <div className="ov-hero-right">
          <div className="ov-kpis">
            <KPI label="Installed apps" value={D.apps.length} sub="6 confirmed · 8 detected" icon="pkg" />
            <KPI label="Active scripts" value={D.apps.reduce((s,a)=>s+a.scripts,0)} sub="across storefront" icon="scripts" tone="critical" />
            <KPI label="Orphaned scripts" value={D.orphaned.length} sub="from uninstalled apps" icon="alert" tone="critical" />
            <KPI label="Monthly cost" value={`$${D.cost.monthly}`} sub={`$${D.cost.yearly.toLocaleString()} yearly`} icon="dollar" tone="warning" />
          </div>

          <div className="banner banner-critical ov-impact">
            <span className="banner-icon" style={{background:'var(--critical-fg)', color:'#fff'}}>
              <I.bolt size={12}/>
            </span>
            <div style={{flex:'1 1 auto', minWidth:0}}>
              <div className="eyebrow" style={{color:'var(--critical-fg)'}}>Estimated impact</div>
              <div style={{fontSize:'var(--fs-h2)', fontWeight:'var(--fw-semibold)', marginTop:4, letterSpacing:'-0.01em'}}>
                Load time could drop from <span className="tnum">{(D.impact.fromMs/1000).toFixed(1)}s</span> to <span className="tnum" style={{color:'var(--success-fg)'}}>{(D.impact.toMs/1000).toFixed(1)}s</span>
              </div>
              <div className="secondary" style={{marginTop:4, fontSize:'var(--fs-body-sm)'}}>
                +{D.impact.conversionLift}% conversion lift · ${D.impact.annualSavings} projected annual savings
              </div>
            </div>
            <button className="btn btn-critical btn-sm" onClick={() => go('actionplan')}>
              View fixes <I.arrowRight size={13}/>
            </button>
          </div>
        </div>
      </section>

      {/* APPS TABLE + RIGHT RAIL */}
      <section className="ov-row">
        <div className="card ov-apps">
          <header className="card-header">
            <div className="row gap-2">
              <span className="badge-dot" style={{background:'var(--critical-fg)'}}/>
              <h3 className="card-title">Installed apps — performance impact</h3>
            </div>
            <div className="row gap-3">
              <span className="muted" style={{fontSize:'var(--fs-body-sm)'}}>{D.apps.length} apps · sorted by impact</span>
              <button className="btn btn-ghost btn-sm" onClick={() => go('installed')}>
                See all <I.arrowRight size={12}/>
              </button>
            </div>
          </header>
          <div style={{overflow:'hidden', borderRadius:'0 0 var(--r-lg) var(--r-lg)'}}>
          <table className="table">
            <thead>
              <tr>
                <th style={{width:'30%'}}>App</th>
                <th style={{width:'22%'}}>Script load</th>
                <th>30-day trend</th>
                <th>Impact</th>
                <th>Usage</th>
                <th style={{width:88}}></th>
              </tr>
            </thead>
            <tbody>
              {top.map(a => (
                <tr key={a.id} className="row-clickable" onClick={() => go('installed')}>
                  <td>
                    <div className="row gap-3">
                      <AppTile app={a} />
                      <div className="col">
                        <span className="semi">{a.name}</span>
                        <span className="muted" style={{fontSize:'var(--fs-caption)'}}>{a.category}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="col" style={{gap:4}}>
                      <Bar value={a.kb} max={200} tone={impactTone(a.impact)} width={140}/>
                      <span className="tnum muted" style={{fontSize:'var(--fs-caption)'}}>{a.kb}kb · {a.scripts} {a.scripts===1?'script':'scripts'}</span>
                    </div>
                  </td>
                  <td><Sparkline data={a.spark} width={80} height={26}/></td>
                  <td><ImpactBadge impact={a.impact}/></td>
                  <td>
                    <div className="row gap-2">
                      <Bar value={a.usageScore*100} max={100} tone={a.usageScore>0.6?'success':a.usageScore>0.3?'warning':'critical'} width={48} height={4}/>
                      <span className="tnum" style={{fontSize:'var(--fs-body-sm)'}}>{a.usage}</span>
                    </div>
                  </td>
                  <td style={{textAlign:'right'}}>
                    <button className="btn btn-secondary btn-sm" onClick={(e)=>{e.stopPropagation(); go('installed');}}>
                      {a.status === 'inspect' ? 'Inspect' : a.status === 'compare' ? 'Compare' : a.status === 'limit' ? 'Limit' : a.status === 'keep' ? 'Keep' : 'Review'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <aside className="ov-rail">
          {/* Action plan */}
          <div className="card">
            <header className="card-header">
              <div className="row gap-2">
                <span className="badge-dot" style={{background:'var(--warning-fg)'}}/>
                <h3 className="card-title">Action plan</h3>
              </div>
              <span className="muted" style={{fontSize:'var(--fs-body-sm)'}}>Score: {D.score.range}</span>
            </header>
            <div className="ov-actions">
              {D.actionPlan.slice(0,4).map((it, i) => (
                <div key={it.id} className="ov-action">
                  <span className="ov-action-num">{i+1}</span>
                  <div style={{flex:'1 1 auto', minWidth:0}}>
                    <div className="semi" style={{fontSize:'var(--fs-body)', lineHeight:1.3}}>{it.title}</div>
                    <div className="muted" style={{fontSize:'var(--fs-caption)', marginTop:3}}>
                      <I.clock size={10} style={{verticalAlign:-1, marginRight:3}}/> {it.eta} · risk {it.risk}
                    </div>
                  </div>
                  <div className="ov-action-pts">
                    {it.impact==='cost'
                      ? <span style={{color:'var(--warning-fg)'}}>+${it.savings}/mo</span>
                      : <span style={{color:'var(--success-fg)'}}>+{it.pts} pts</span>}
                  </div>
                </div>
              ))}
            </div>
            <footer style={{padding:'10px var(--s-5)', borderTop:'1px solid var(--border)'}}>
              <button className="btn btn-secondary btn-sm" style={{width:'100%'}} onClick={() => go('actionplan')}>
                Open full action plan
              </button>
            </footer>
          </div>

          {/* Script load waterfall */}
          <div className="card">
            <header className="card-header">
              <div className="row gap-2">
                <span className="badge-dot" style={{background:'var(--info-fg)'}}/>
                <h3 className="card-title">Script load timeline</h3>
              </div>
              <span className="muted" style={{fontSize:'var(--fs-body-sm)'}}>first-paint blocking</span>
            </header>
            <div style={{padding: 'var(--s-4) var(--s-5)'}}>
              <Waterfall items={wf} width={360} height={170}/>
            </div>
          </div>

          {/* Scan log */}
          <div className="card">
            <header className="card-header">
              <div className="row gap-2">
                <span className="badge-dot pulse" style={{background:'var(--success-fg)'}}/>
                <h3 className="card-title">Last scan</h3>
              </div>
              <span className="muted tnum" style={{fontSize:'var(--fs-body-sm)'}}>{D.store.scanDuration}</span>
            </header>
            <div className="ov-log">
              {D.scanLog.map((l, i) => (
                <div key={i} className="ov-log-row">
                  <span className="ov-log-time">{l.t.replace(/:\d\d PM$/, ' PM')}</span>
                  <span className={`ov-log-dot ${l.kind}`}/>
                  <span className="ov-log-msg truncate">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

const KPI = ({ label, value, sub, tone='neutral', icon }) => {
  const IconCmp = icon ? I[icon] : null;
  const color = tone==='critical' ? 'var(--critical-fg)' : tone==='warning' ? 'var(--warning-fg)' : tone==='success' ? 'var(--success-fg)' : 'var(--text-primary)';
  return (
    <div className="stat">
      <div className="row between">
        <span className="stat-label">{label}</span>
        {IconCmp && <span style={{color:'var(--text-subdued)'}}><IconCmp size={14}/></span>}
      </div>
      <div className="stat-value tnum" style={{color}}>{value}</div>
      <div className="stat-delta">{sub}</div>
    </div>
  );
};

// =====================================================================
// INSTALLED APPS
// =====================================================================

const Installed = ({ go }) => {
  const [query, setQuery] = React.useState('');
  const [sort, setSort]   = React.useState({ key:'impactScore', dir:'desc' });
  const [filter, setFilter] = React.useState('all');
  const [selected, setSelected] = React.useState({});

  const filters = [
    { id:'all',       label:'All',          count: D.apps.length },
    { id:'critical',  label:'Critical',     count: D.apps.filter(a=>a.impact==='critical').length },
    { id:'duplicate', label:'Duplicates',   count: D.apps.filter(a=>a.duplicates>0).length },
    { id:'unused',    label:'Unused paid',  count: D.apps.filter(a=>a.costStatus==='unused').length },
    { id:'backend',   label:'Backend only', count: D.apps.filter(a=>a.scripts===0).length },
  ];

  let rows = D.apps.filter(a => {
    if (filter==='critical')  return a.impact==='critical';
    if (filter==='duplicate') return a.duplicates>0;
    if (filter==='unused')    return a.costStatus==='unused';
    if (filter==='backend')   return a.scripts===0;
    return true;
  }).filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase()));

  rows = [...rows].sort((x, y) => {
    const a = x[sort.key], b = y[sort.key];
    if (typeof a === 'string') return sort.dir==='desc' ? b.localeCompare(a) : a.localeCompare(b);
    return sort.dir==='desc' ? b - a : a - b;
  });

  const toggle = (id) => setSelected(s => ({ ...s, [id]: !s[id] }));
  const selCount = Object.values(selected).filter(Boolean).length;
  const setSortKey = (k) => setSort(s => s.key===k ? { key:k, dir: s.dir==='desc'?'asc':'desc' } : { key:k, dir:'desc' });
  const Sh = ({ k, children, align }) => (
    <th onClick={() => setSortKey(k)} style={{cursor:'pointer', userSelect:'none', textAlign: align||'left'}}>
      <span style={{display:'inline-flex',alignItems:'center',gap:4}}>
        {children}
        {sort.key===k && (sort.dir==='desc' ? <I.chevdown size={12}/> : <I.chevup size={12}/>)}
      </span>
    </th>
  );

  return (
    <div className="col" style={{gap:'var(--s-4)'}}>
      {/* Toolbar */}
      <div className="ins-toolbar">
        <div className="row gap-2">
          <div className="search">
            <I.search size={14}/>
            <input className="input" placeholder="Filter apps…" value={query} onChange={e=>setQuery(e.target.value)} style={{width:240}}/>
          </div>
          <div className="ins-chips">
            {filters.map(f => (
              <button key={f.id} className={`ins-chip ${filter===f.id?'on':''}`} onClick={()=>setFilter(f.id)}>
                {f.label}<span className="ins-chip-n">{f.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost btn-sm"><I.download size={13}/>Export CSV</button>
          <div className="segmented">
            <button className="on">Storefront</button>
            <button>Backend</button>
            <button>All</button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selCount > 0 && (
        <div className="card fade-in" style={{padding:'10px var(--s-5)', background:'var(--info-bg-2)', borderColor:'var(--info-bd)'}}>
          <div className="row between">
            <div className="row gap-3">
              <strong>{selCount} selected</strong>
              <button className="btn btn-secondary btn-sm">Inspect</button>
              <button className="btn btn-secondary btn-sm">Defer scripts</button>
              <button className="btn btn-critical btn-sm">Mark for removal</button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setSelected({})}>Clear</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <table className="table ins-table">
          <thead>
            <tr>
              <th style={{width:36}}>
                <input type="checkbox" checked={selCount===rows.length && rows.length>0}
                  onChange={e => setSelected(rows.reduce((s, r) => ({...s, [r.id]: e.target.checked}), {}))}/>
              </th>
              <Sh k="name">App</Sh>
              <Sh k="kb">Script weight</Sh>
              <Sh k="impactScore">30-day load</Sh>
              <Sh k="impactScore">Impact</Sh>
              <Sh k="usageScore">Usage</Sh>
              <Sh k="cost">Cost</Sh>
              <Sh k="lastUsed">Last used</Sh>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(a => (
              <tr key={a.id} onClick={()=>toggle(a.id)} className="row-clickable">
                <td onClick={(e)=>e.stopPropagation()}>
                  <input type="checkbox" checked={!!selected[a.id]} onChange={()=>toggle(a.id)}/>
                </td>
                <td>
                  <div className="row gap-3">
                    <AppTile app={a}/>
                    <div className="col">
                      <span className="semi">{a.name}
                        {a.duplicates>0 && <Badge tone="warning" style={{marginLeft:6, fontSize:10.5}}>Duplicate</Badge>}
                      </span>
                      <span className="muted" style={{fontSize:'var(--fs-caption)'}}>{a.category}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="col" style={{gap:4}}>
                    <Bar value={a.kb} max={200} tone={impactTone(a.impact)} width={120}/>
                    <span className="tnum muted" style={{fontSize:'var(--fs-caption)'}}>{a.kb}kb · {a.scripts || 0} {a.scripts===1?'script':'scripts'}</span>
                  </div>
                </td>
                <td><Sparkline data={a.spark} width={90} height={26}/></td>
                <td><ImpactBadge impact={a.impact}/></td>
                <td>
                  <div className="row gap-2">
                    <Bar value={a.usageScore*100} max={100} tone={a.usageScore>0.6?'success':a.usageScore>0.3?'warning':'critical'} width={48} height={4}/>
                    <span className="tnum" style={{fontSize:'var(--fs-body-sm)'}}>{a.usage}</span>
                  </div>
                </td>
                <td>
                  <div className="col">
                    <span className="tnum semi">${a.cost}<span className="muted" style={{fontWeight:400}}>/mo</span></span>
                    {a.costStatus==='unused' && <span style={{fontSize:'var(--fs-caption)', color:'var(--warning-fg)'}}>unused</span>}
                  </div>
                </td>
                <td className="muted tnum" style={{fontSize:'var(--fs-body-sm)'}}>{a.lastUsed}</td>
                <td style={{textAlign:'right'}}>
                  <div className="row gap-1" style={{justifyContent:'flex-end'}}>
                    <button className="btn btn-secondary btn-sm" onClick={(e)=>e.stopPropagation()}>
                      {a.status === 'inspect' ? 'Inspect' : a.status === 'compare' ? 'Compare' : a.status === 'limit' ? 'Limit' : a.status === 'keep' ? 'Keep' : 'Review'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={(e)=>e.stopPropagation()}><I.more size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =====================================================================
// PERFORMANCE IMPACT
// =====================================================================

const Performance = ({ go }) => {
  const wf = [
    { label:'klaviyo onsite.js',     start:0,   dur:840, tone:'critical' },
    { label:'privy widget.js',       start:60,  dur:660, tone:'critical' },
    { label:'optinmonster.js',       start:180, dur:540, tone:'critical' },
    { label:'wisepops.js',           start:340, dur:380, tone:'warning' },
    { label:'tidio chat.js',         start:480, dur:340, tone:'warning' },
    { label:'loyaltylion.js',        start:610, dur:240, tone:'warning' },
    { label:'judge.me widget.js',    start:780, dur:200, tone:'success' },
    { label:'yotpo reviews.js',      start:900, dur:160, tone:'warning' },
    { label:'shogun page.js',        start:1020,dur:180, tone:'success' },
    { label:'reconvert.js',          start:1180,dur:140, tone:'success' },
  ];

  const tree = [
    { label:'Klaviyo',      value:184, color:'#b8210a' },
    { label:'Privy',        value:142, color:'#c93636' },
    { label:'OptinMonster', value:138, color:'#d35a39' },
    { label:'WisePops',     value:104, color:'#d98914' },
    { label:'Tidio',        value:96,  color:'#e6a644' },
    { label:'LoyaltyLion',  value:72,  color:'#7c3aed' },
    { label:'Judge.me',     value:58,  color:'#0c7438' },
    { label:'Yotpo',        value:54,  color:'#2363c5' },
    { label:'Shogun',       value:48,  color:'#16a34a' },
    { label:'PageFly',      value:42,  color:'#0891b2' },
    { label:'Other',        value:66,  color:'#6b7280' },
  ];

  return (
    <div className="col" style={{gap:'var(--s-4)'}}>
      {/* Top metrics row */}
      <div className="perf-metrics">
        <div className="card card-pad perf-metric">
          <div className="eyebrow">Largest Contentful Paint</div>
          <div className="perf-metric-row">
            <div className="stat-value tnum" style={{color:'var(--critical-fg)'}}>4.8s</div>
            <Sparkline data={[3.2,3.4,3.5,3.8,4.0,4.2,4.3,4.5,4.6,4.7,4.8,4.8]} width={100} height={36}/>
          </div>
          <div className="muted" style={{fontSize:'var(--fs-caption)'}}>p75 · mobile · throttled 4G</div>
          <Bar value={4.8} max={6} tone="critical" width="100%"/>
          <div className="row between" style={{fontSize:'var(--fs-caption)', color:'var(--text-subdued)'}}>
            <span>Good · 2.5s</span><span>Poor · 4.0s+</span>
          </div>
        </div>

        <div className="card card-pad perf-metric">
          <div className="eyebrow">Total Blocking Time</div>
          <div className="perf-metric-row">
            <div className="stat-value tnum" style={{color:'var(--warning-fg)'}}>720ms</div>
            <Sparkline data={[420,440,480,520,560,600,640,680,700,710,720,720]} width={100} height={36}/>
          </div>
          <div className="muted" style={{fontSize:'var(--fs-caption)'}}>main thread blocked by scripts</div>
          <Bar value={720} max={1000} tone="warning" width="100%"/>
          <div className="row between" style={{fontSize:'var(--fs-caption)', color:'var(--text-subdued)'}}>
            <span>Good · 200ms</span><span>Poor · 600ms+</span>
          </div>
        </div>

        <div className="card card-pad perf-metric">
          <div className="eyebrow">Cumulative Layout Shift</div>
          <div className="perf-metric-row">
            <div className="stat-value tnum" style={{color:'var(--success-fg)'}}>0.08</div>
            <Sparkline data={[0.12,0.11,0.10,0.10,0.09,0.09,0.08,0.08,0.08,0.08,0.08,0.08]} width={100} height={36}/>
          </div>
          <div className="muted" style={{fontSize:'var(--fs-caption)'}}>visual stability</div>
          <Bar value={0.08} max={0.3} tone="success" width="100%"/>
          <div className="row between" style={{fontSize:'var(--fs-caption)', color:'var(--text-subdued)'}}>
            <span>Good · &lt;0.1</span><span>Poor · 0.25+</span>
          </div>
        </div>

        <div className="card card-pad perf-metric">
          <div className="eyebrow">Time to Interactive</div>
          <div className="perf-metric-row">
            <div className="stat-value tnum" style={{color:'var(--critical-fg)'}}>5.6s</div>
            <Sparkline data={[3.8,4.0,4.2,4.4,4.6,4.8,5.0,5.2,5.4,5.5,5.6,5.6]} width={100} height={36}/>
          </div>
          <div className="muted" style={{fontSize:'var(--fs-caption)'}}>fully responsive to input</div>
          <Bar value={5.6} max={8} tone="critical" width="100%"/>
          <div className="row between" style={{fontSize:'var(--fs-caption)', color:'var(--text-subdued)'}}>
            <span>Good · 3.8s</span><span>Poor · 7.3s+</span>
          </div>
        </div>
      </div>

      {/* Waterfall + Treemap */}
      <div className="perf-grid">
        <div className="card">
          <header className="card-header">
            <div className="col">
              <h3 className="card-title">Script load waterfall — homepage</h3>
              <span className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:2}}>First 1.5s of page load · main thread</span>
            </div>
            <div className="segmented">
              <button className="on">Homepage</button>
              <button>Product</button>
              <button>Collection</button>
              <button>Checkout</button>
            </div>
          </header>
          <div style={{padding:'var(--s-5)'}}>
            <Waterfall items={wf} width={620} height={280}/>
          </div>
        </div>

        <div className="card">
          <header className="card-header">
            <h3 className="card-title">Script weight by app</h3>
            <span className="muted" style={{fontSize:'var(--fs-body-sm)'}}>Total: 1,004kb</span>
          </header>
          <div style={{padding:'var(--s-5)'}}>
            <Treemap items={tree} width={320} height={260}/>
          </div>
        </div>
      </div>

      {/* Page-by-page table */}
      <div className="card">
        <header className="card-header">
          <h3 className="card-title">Page-by-page performance</h3>
          <span className="muted" style={{fontSize:'var(--fs-body-sm)'}}>5 templates · sorted by score</span>
        </header>
        <table className="table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Score</th>
              <th>LCP</th>
              <th>TBT</th>
              <th>Scripts on page</th>
              <th>30-day trend</th>
              <th>Top offender</th>
            </tr>
          </thead>
          <tbody>
            {[
              { page:'/', label:'Homepage',     score:28, lcp:4.8, tbt:720, scripts:31, trend:[40,38,36,34,32,30,30,28,28,28,28,28], top:'Klaviyo' },
              { page:'/products/*', label:'Product detail', score:34, lcp:4.2, tbt:680, scripts:28, trend:[44,42,40,38,38,36,36,34,34,34,34,34], top:'Privy' },
              { page:'/collections/*', label:'Collection', score:36, lcp:4.0, tbt:640, scripts:26, trend:[42,42,40,40,38,38,36,36,36,36,36,36], top:'OptinMonster' },
              { page:'/cart', label:'Cart',     score:48, lcp:3.4, tbt:520, scripts:22, trend:[55,52,52,50,50,49,48,48,48,48,48,48], top:'Tidio' },
              { page:'/checkout', label:'Checkout', score:72, lcp:2.4, tbt:280, scripts:8, trend:[72,72,72,72,72,72,72,72,72,72,72,72], top:'—' },
            ].map(r => (
              <tr key={r.page}>
                <td>
                  <div className="col">
                    <span className="semi">{r.label}</span>
                    <span className="mono muted" style={{fontSize:'var(--fs-caption)'}}>{r.page}</span>
                  </div>
                </td>
                <td>
                  <div className="row gap-2">
                    <strong className="tnum" style={{color: r.score<35?'var(--critical-fg)':r.score<60?'var(--warning-fg)':'var(--success-fg)'}}>{r.score}</strong>
                    <Bar value={r.score} max={100} tone={r.score<35?'critical':r.score<60?'warning':'success'} width={70}/>
                  </div>
                </td>
                <td className="tnum">{r.lcp}s</td>
                <td className="tnum">{r.tbt}ms</td>
                <td className="tnum">{r.scripts}</td>
                <td><Sparkline data={r.trend} width={80} height={24}/></td>
                <td className="muted">{r.top}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { Overview, Installed, Performance });
