// AppLens — Theme cleanup, Reports

const D3 = new Proxy({}, { get: (_, k) => window.AppLensData[k] });

// =====================================================================
// THEME CLEANUP
// =====================================================================

const Theme = ({ go }) => {
  const [step, setStep] = React.useState(2); // 0..4 — start with "run preview scan" highlighted

  const steps = [
    { k:'dup',    title:'Duplicate live theme',         detail:'Backup created · Dawn-v15-backup · 02:14am' },
    { k:'remove', title:'Remove scripts in preview',    detail:'7 orphaned + 2 deferred · diff prepared' },
    { k:'scan',   title:'Run preview scan',             detail:'Re-audit the staged theme · ~14s' },
    { k:'compare',title:'Compare before and after',     detail:'Side-by-side Lighthouse · waterfall delta' },
    { k:'publish',title:'Publish or rollback',          detail:'30-day rollback retained automatically' },
  ];

  return (
    <div className="col" style={{gap:'var(--s-4)'}}>
      <div className="banner banner-success">
        <span className="banner-icon" style={{background:'var(--success-fg)', color:'#fff'}}>
          <I.check size={12}/>
        </span>
        <div style={{flex:'1 1 auto'}}>
          <div className="semi" style={{fontSize:'var(--fs-h3)'}}>Shopify-safe cleanup</div>
          <div className="secondary" style={{fontSize:'var(--fs-body-sm)', marginTop:2}}>
            All removals happen in a duplicate theme. Preview scans confirm impact, then you approve or rollback — your live theme is never touched until you publish.
          </div>
        </div>
        <span className="badge badge-success" style={{flex:'0 0 auto'}}><span className="badge-dot"/>Backup theme ready</span>
      </div>

      <div className="theme-grid">
        {/* Left — diff + assets */}
        <div className="card">
          <header className="card-header">
            <div className="col">
              <div className="row gap-2">
                <I.code size={14} style={{color:'var(--text-subdued)'}}/>
                <h3 className="card-title">layout/theme.liquid</h3>
                <Badge tone="warning" outline>Preview theme</Badge>
              </div>
              <span className="muted" style={{fontSize:'var(--fs-caption)', marginTop:2}}>
                3 removals · 2 additions · saves 174kb · last edited just now
              </span>
            </div>
            <div className="row gap-2">
              <button className="btn btn-ghost btn-sm"><I.eye size={12}/>Preview storefront</button>
              <button className="btn btn-secondary btn-sm">Open in editor</button>
            </div>
          </header>

          <div className="diff">
            <DiffLine n={118} kind="ctx" code="<!-- Theme scripts -->"/>
            <DiffLine n={119} kind="ctx" code='{% section "header" %}'/>
            <DiffLine n={120} kind="del" code='<script src="https://cdn.privy.com/widget.js"></script>'/>
            <DiffLine n={121} kind="del" code='<script src="https://cdn.klaviyo.com/onsite.js"></script>'/>
            <DiffLine n={122} kind="del" code="{% render 'old-popup-tracker' %}"/>
            <DiffLine n={123} kind="ctx" code=""/>
            <DiffLine n={124} kind="add" code='<script src="https://cdn.privy.com/widget.js" defer></script>'/>
            <DiffLine n={125} kind="add" code='{% render "klaviyo-onsite-deferred" %}'/>
            <DiffLine n={126} kind="ctx" code=""/>
            <DiffLine n={127} kind="ctx" code='{% section "footer" %}'/>
          </div>

          <div className="theme-asset-grid">
            <AssetRow file="snippets/old-popup-tracker.liquid" status="deleted"  size="1.2 kb" />
            <AssetRow file="assets/loyalty-lion-v3.js"          status="deleted"  size="38 kb" />
            <AssetRow file="assets/klaviyo-onsite-deferred.js"  status="added"    size="48 kb" />
            <AssetRow file="snippets/klaviyo-onsite-deferred.liquid" status="added" size="0.6 kb" />
            <AssetRow file="config/settings_data.json"          status="modified" size="—" />
          </div>
        </div>

        {/* Right — wizard rail */}
        <aside className="col" style={{gap:'var(--s-4)'}}>
          <div className="card card-pad">
            <div className="eyebrow">Cleanup workflow</div>
            <ol className="wiz">
              {steps.map((s, i) => {
                const state = i < step ? 'done' : i === step ? 'active' : 'todo';
                return (
                  <li key={s.k} className={`wiz-step ${state}`} onClick={() => setStep(i)}>
                    <span className="wiz-dot">{state==='done' ? <I.check size={11}/> : i+1}</span>
                    <div className="wiz-body">
                      <span className="wiz-title">{s.title}</span>
                      <span className="wiz-detail muted">{s.detail}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="row gap-2" style={{marginTop:'var(--s-3)'}}>
              <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={() => setStep(Math.max(0, step-1))}>Back</button>
              <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={() => setStep(Math.min(4, step+1))}>
                {step === 4 ? 'Publish' : 'Next step'} <I.arrowRight size={12}/>
              </button>
            </div>
          </div>

          <div className="card">
            <header className="card-header">
              <h3 className="card-title">Before vs. after</h3>
              <span className="badge badge-success"><span className="badge-dot"/>+34 pts</span>
            </header>
            <div style={{padding:'var(--s-5)'}}>
              <BeforeAfter label="Store Speed Score" before={28} after={62} max={100} tone="critical→success" suffix=""/>
              <BeforeAfter label="LCP (mobile)"      before={4.8} after={2.1} max={6} tone="critical→success" suffix="s"/>
              <BeforeAfter label="Active scripts"    before={31} after={22} max={40} tone="critical→success" suffix=""/>
              <BeforeAfter label="Total weight"      before={1004} after={830} max={1200} tone="critical→warning" suffix="kb"/>
            </div>
          </div>

          <div className="card card-pad" style={{background:'var(--success-bg-2)', borderColor:'var(--success-bd)'}}>
            <div className="row gap-2">
              <I.shield size={14} style={{color:'var(--success-fg)', flex:'0 0 auto', marginTop:2}}/>
              <div>
                <div className="semi" style={{fontSize:'var(--fs-body)', color:'var(--success-fg)'}}>Rollback retained for 30 days</div>
                <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:2}}>
                  One-click revert to Dawn-v15-backup · we'll alert you if storefront errors appear after publish.
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const DiffLine = ({ n, kind, code }) => (
  <div className={`diff-line diff-${kind}`}>
    <span className="diff-num">{n}</span>
    <span className="diff-sign">{kind==='add' ? '+' : kind==='del' ? '−' : ' '}</span>
    <span className="diff-code">{code || '\u00a0'}</span>
  </div>
);

const AssetRow = ({ file, status, size }) => (
  <div className="asset-row">
    <div className="row gap-2 grow truncate">
      <I.doc size={12} style={{color:'var(--text-subdued)', flex:'0 0 auto'}}/>
      <span className="mono truncate" style={{fontSize:'var(--fs-body-sm)'}}>{file}</span>
    </div>
    <Badge tone={status==='deleted'?'critical':status==='added'?'success':'info'}>{status}</Badge>
    <span className="muted tnum" style={{fontSize:'var(--fs-caption)', minWidth:48, textAlign:'right'}}>{size}</span>
  </div>
);

const BeforeAfter = ({ label, before, after, max, tone, suffix }) => {
  const [fromTone, toTone] = tone.split('→');
  const bPct = (before/max)*100, aPct = (after/max)*100;
  const c = (t) => ({ critical:'var(--chart-critical)', warning:'var(--chart-warning)', success:'var(--chart-success)' }[t] || 'var(--chart-info)');
  return (
    <div className="ba-row">
      <div className="row between" style={{marginBottom:6}}>
        <span className="muted" style={{fontSize:'var(--fs-caption)'}}>{label}</span>
        <span className="tnum" style={{fontSize:'var(--fs-body-sm)'}}>
          <span style={{color:c(fromTone), textDecoration:'line-through'}}>{before}{suffix}</span>
          <span className="muted" style={{margin:'0 6px'}}>→</span>
          <span className="semi" style={{color:c(toTone)}}>{after}{suffix}</span>
        </span>
      </div>
      <div className="ba-bar">
        <div className="ba-bar-before" style={{ width: `${bPct}%`, background: c(fromTone) }}/>
        <div className="ba-bar-after"  style={{ width: `${aPct}%`, background: c(toTone) }}/>
      </div>
    </div>
  );
};

// =====================================================================
// REPORTS
// =====================================================================

const Reports = ({ go }) => {
  return (
    <div className="col" style={{gap:'var(--s-4)'}}>
      <div className="rep-strip">
        <div className="card card-pad">
          <div className="eyebrow">Reports sent</div>
          <div className="stat-value tnum" style={{marginTop:6}}>142<span style={{fontSize:'var(--fs-body)', fontWeight:400, color:'var(--text-subdued)'}}> this quarter</span></div>
          <Sparkline data={[8,9,11,10,12,14,12,15,16,14,16,18]} width={180} height={32}/>
        </div>
        <div className="card card-pad">
          <div className="eyebrow">Active subscribers</div>
          <div className="stat-value tnum" style={{marginTop:6}}>21</div>
          <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:4}}>4 merchants · 3 developers · 14 stakeholders</div>
        </div>
        <div className="card card-pad">
          <div className="eyebrow">Next scheduled</div>
          <div className="stat-value tnum" style={{marginTop:6, fontSize:22}}>Merchant exec summary</div>
          <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:4}}>
            <I.clock size={11} style={{verticalAlign:-2, marginRight:4}}/>
            Monday 8:00am · 3 subscribers
          </div>
        </div>
        <div className="card card-pad" style={{background:'var(--info-bg-2)', borderColor:'var(--info-bd)'}}>
          <div className="row gap-2">
            <I.bell size={14} style={{color:'var(--info-fg)', flex:'0 0 auto', marginTop:2}}/>
            <div>
              <div className="semi" style={{fontSize:'var(--fs-body)'}}>Alerts armed</div>
              <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:2}}>New scripts · spend changes · score drops &gt; 8 pts</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <header className="card-header">
          <h3 className="card-title">Ongoing protection · report templates</h3>
          <button className="btn btn-secondary btn-sm">Create report</button>
        </header>
        <table className="table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Cadence</th>
              <th>Channels</th>
              <th>Subscribers</th>
              <th>Last sent</th>
              <th>Open rate</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {D3.reports.map(r => (
              <tr key={r.id} className="row-clickable">
                <td>
                  <div className="row gap-3">
                    <span className="rep-icon"><I.doc size={14}/></span>
                    <div className="col">
                      <span className="semi">{r.name}</span>
                      <span className="muted" style={{fontSize:'var(--fs-caption)'}}>PDF · CSV · Embed link</span>
                    </div>
                  </div>
                </td>
                <td><Badge tone="info" outline>{r.cadence}</Badge></td>
                <td>
                  <div className="row gap-1">
                    <span className="rep-chan">Email</span>
                    {r.id==='perf-audit' && <span className="rep-chan">Slack</span>}
                    {r.id==='theme-changelog' && <span className="rep-chan">Webhook</span>}
                  </div>
                </td>
                <td className="tnum">{r.subs}</td>
                <td className="muted">{r.last}</td>
                <td>
                  <div className="row gap-2">
                    <Bar value={60 + (r.subs*5)} max={100} tone="success" width={70}/>
                    <span className="tnum muted" style={{fontSize:'var(--fs-caption)'}}>{60 + (r.subs*5)}%</span>
                  </div>
                </td>
                <td style={{textAlign:'right'}}>
                  <button className="btn btn-ghost btn-sm">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rep-grid">
        <div className="card">
          <header className="card-header">
            <h3 className="card-title">Alert rules</h3>
            <button className="btn btn-ghost btn-sm"><I.settings size={12}/>Configure</button>
          </header>
          <div className="alert-list">
            <AlertRow tone="critical" title="Score drops more than 8 points"  detail="Compared to 7-day rolling average" enabled/>
            <AlertRow tone="warning"  title="New script tag detected"          detail="In layout/theme.liquid or sections/" enabled/>
            <AlertRow tone="warning"  title="App subscription added or renewed" detail="Notify on charge events from Shopify Billing" enabled/>
            <AlertRow tone="info"     title="Unused paid app — 30 day inactivity" detail="Backend apps excluded by default"/>
            <AlertRow tone="info"     title="Theme published or rolled back"   detail="Trigger a fresh full-site scan"/>
          </div>
        </div>

        <div className="card">
          <header className="card-header">
            <h3 className="card-title">Recent activity</h3>
            <span className="muted" style={{fontSize:'var(--fs-body-sm)'}}>last 7 days</span>
          </header>
          <div className="ov-log" style={{padding:'10px var(--s-4) var(--s-4)'}}>
            {[
              { t:'Today · 10:58 PM',  k:'critical', m:'Audit complete · 4 high-priority fixes flagged on applens.myshopify.com' },
              { t:'Today · 04:12 PM',  k:'warn',     m:'New script detected — pinterest-tag.js loading on all pages' },
              { t:'Yesterday',          k:'ok',       m:'Theme published · Dawn v15 → Dawn v15 (cleanup) · rollback retained' },
              { t:'Yesterday',          k:'info',     m:'Weekly executive summary sent to 3 subscribers' },
              { t:'2 days ago',         k:'warn',     m:'Yotpo Reviews flagged unused for 30 days · $24/mo opportunity' },
              { t:'3 days ago',         k:'info',     m:'Cost & renewal report sent · $217/mo current spend' },
              { t:'5 days ago',         k:'critical', m:'Score dropped from 36 → 28 after new pop-up app install' },
            ].map((l, i) => (
              <div key={i} className="ov-log-row">
                <span className="ov-log-time" style={{minWidth:120}}>{l.t}</span>
                <span className={`ov-log-dot ${l.k}`}/>
                <span className="ov-log-msg">{l.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertRow = ({ tone, title, detail, enabled }) => (
  <div className="alert-row">
    <span className="badge-dot" style={{background:`var(--${tone}-fg)`, width:8, height:8}}/>
    <div className="grow">
      <div className="semi" style={{fontSize:'var(--fs-body)'}}>{title}</div>
      <div className="muted" style={{fontSize:'var(--fs-caption)', marginTop:2}}>{detail}</div>
    </div>
    <span className={`switch ${enabled?'on':''}`}><span className="switch-knob"/></span>
  </div>
);

Object.assign(window, { Theme, Reports });
