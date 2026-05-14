// AppLens — Orphaned scripts, Action plan, Costs & usage

const D2 = new Proxy({}, { get: (_, k) => window.AppLensData[k] });

// =====================================================================
// ORPHANED SCRIPTS
// =====================================================================

const Orphaned = ({ go }) => {
  const [removed, setRemoved] = React.useState({});
  const total = D2.orphaned.length;
  const remCount = Object.values(removed).filter(Boolean).length;
  const remKb = D2.orphaned.filter(o => removed[o.id]).reduce((s, o) => s + o.kb, 0);
  const totalKb = D2.orphaned.reduce((s, o) => s + o.kb, 0);

  return (
    <div className="orph-grid">
      {/* Left: detected list */}
      <div className="card">
        <header className="card-header">
          <div className="row gap-2">
            <span className="badge-dot" style={{background:'var(--critical-fg)'}}/>
            <h3 className="card-title">Orphaned scripts detected</h3>
          </div>
          <span className="muted" style={{fontSize:'var(--fs-body-sm)'}}>
            {total - remCount} of {total} remaining · {totalKb - remKb}kb still loading
          </span>
        </header>

        <div className="orph-list">
          {D2.orphaned.map(o => (
            <article key={o.id} className={`orph-item ${removed[o.id]?'is-removed':''}`}>
              <div className="orph-item-head">
                <div className="row gap-2">
                  <I.scripts size={14} style={{color:'var(--text-subdued)'}}/>
                  <code className="mono" style={{color:'var(--critical-fg)', fontWeight:'var(--fw-semibold)'}}>{o.file}</code>
                </div>
                <Badge tone={impactTone(o.impact)} dot>{impactLabel(o.impact)} impact</Badge>
              </div>
              <div className="orph-item-meta">
                <span><I.clock size={11} style={{verticalAlign:-2, marginRight:4}}/>Uninstalled {o.uninstalled}</span>
                <span className="orph-dot"/>
                <span>Loads on {o.pages}</span>
                <span className="orph-dot"/>
                <span className="tnum semi">{o.kb}kb</span>
                <span className="orph-dot"/>
                <span>Parent app: <span className="semi">{o.parentApp}</span></span>
              </div>
              <div className="orph-item-foot">
                <span className="mono muted" style={{fontSize:'var(--fs-caption)'}}>
                  layout/theme.liquid · line {120 + parseInt(o.id.slice(1))*7}
                </span>
                <div className="row gap-2">
                  <button className="btn btn-ghost btn-sm"><I.eye size={12}/>Preview</button>
                  <button className="btn btn-secondary btn-sm">Review</button>
                  {removed[o.id]
                    ? <button className="btn btn-ghost btn-sm" style={{color:'var(--success-fg)'}} onClick={() => setRemoved(s => ({...s, [o.id]: false}))}>
                        <I.check size={12}/>Marked
                      </button>
                    : <button className="btn btn-critical btn-sm" onClick={() => setRemoved(s => ({...s, [o.id]: true}))}>
                        <I.trash size={12}/>Remove
                      </button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Right: cleanup summary */}
      <aside className="col" style={{gap:'var(--s-4)'}}>
        <div className="card card-pad">
          <div className="eyebrow">Cleanup summary</div>
          <div className="orph-summary">
            <div>
              <div className="muted" style={{fontSize:'var(--fs-caption)'}}>Marked for removal</div>
              <div className="stat-value tnum" style={{color:'var(--success-fg)'}}>{remCount}<span style={{fontSize:'var(--fs-body)', fontWeight:400, color:'var(--text-subdued)'}}> / {total}</span></div>
            </div>
            <div>
              <div className="muted" style={{fontSize:'var(--fs-caption)'}}>Weight reclaimed</div>
              <div className="stat-value tnum">{remKb}<span style={{fontSize:'var(--fs-body)', fontWeight:400, color:'var(--text-subdued)'}}>kb</span></div>
            </div>
            <div>
              <div className="muted" style={{fontSize:'var(--fs-caption)'}}>Score gain (est.)</div>
              <div className="stat-value tnum" style={{color:'var(--success-fg)'}}>+{Math.round(remCount/total*12)}<span style={{fontSize:'var(--fs-body)', fontWeight:400, color:'var(--text-subdued)'}}> pts</span></div>
            </div>
          </div>
          <button className="btn btn-primary" style={{width:'100%', marginTop:'var(--s-4)'}} onClick={() => go('theme')}>
            Continue to safe cleanup workflow <I.arrowRight size={13}/>
          </button>
        </div>

        <div className="card">
          <header className="card-header">
            <h3 className="card-title">Why these are orphaned</h3>
          </header>
          <div style={{padding:'var(--s-4) var(--s-5)'}}>
            <p className="secondary" style={{marginTop:0, fontSize:'var(--fs-body)', lineHeight:1.6}}>
              When you uninstall a Shopify app, its CDN-loaded scripts can stay embedded in your theme. They keep loading on every page, blocking render and slowing checkout.
            </p>
            <ul className="orph-why">
              <li><span style={{color:'var(--success-fg)'}}><I.check size={13}/></span>Safe to remove — original app no longer installed</li>
              <li><span style={{color:'var(--success-fg)'}}><I.check size={13}/></span>Backup theme is preserved before any edits</li>
              <li><span style={{color:'var(--success-fg)'}}><I.check size={13}/></span>One-click rollback available for 30 days</li>
            </ul>
          </div>
        </div>

        <div className="card card-pad" style={{background:'var(--info-bg-2)', borderColor:'var(--info-bd)'}}>
          <div className="row gap-2">
            <I.info size={14} style={{color:'var(--info-fg)', flex:'0 0 auto', marginTop:2}}/>
            <div>
              <div className="semi" style={{fontSize:'var(--fs-body)'}}>Found something AppLens missed?</div>
              <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:2}}>Report a false negative and we'll improve detection.</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

// =====================================================================
// ACTION PLAN
// =====================================================================

const ActionPlan = ({ go }) => {
  const [done, setDone] = React.useState({});
  const totalPts = D2.actionPlan.reduce((s, a) => s + (a.pts || 0), 0);
  const earnedPts = D2.actionPlan.reduce((s, a) => s + (done[a.id] ? (a.pts || 0) : 0), 0);
  const totalSavings = D2.actionPlan.reduce((s, a) => s + (a.savings || 0), 0);
  const earnedSavings = D2.actionPlan.reduce((s, a) => s + (done[a.id] ? (a.savings || 0) : 0), 0);

  return (
    <div className="col" style={{gap:'var(--s-4)'}}>
      {/* Header strip */}
      <div className="ap-strip">
        <div className="card card-pad ap-progress">
          <div className="row between">
            <div>
              <div className="eyebrow">Projected score</div>
              <div className="row gap-3" style={{marginTop:6, alignItems:'flex-end'}}>
                <span className="tnum" style={{fontSize:36, fontWeight:'var(--fw-bold)', color:'var(--critical-fg)', letterSpacing:'-0.03em'}}>{D2.score.current}</span>
                <I.arrowRight size={18} style={{marginBottom:8, color:'var(--text-subdued)'}}/>
                <span className="tnum" style={{fontSize:36, fontWeight:'var(--fw-bold)', color:'var(--success-fg)', letterSpacing:'-0.03em'}}>{D2.score.current + earnedPts}</span>
                <span className="muted" style={{marginBottom:8, fontSize:'var(--fs-body-sm)'}}>of {D2.score.current + totalPts} possible</span>
              </div>
            </div>
            <ScoreRing value={D2.score.current + earnedPts} size={84} stroke={8} label="/100"/>
          </div>
          <div className="ap-progress-bar">
            <div className="ap-progress-fill" style={{width: `${(earnedPts/totalPts)*100}%`}}/>
          </div>
        </div>

        <div className="card card-pad">
          <div className="eyebrow">Monthly savings</div>
          <div className="stat-value tnum" style={{color: earnedSavings ? 'var(--success-fg)' : 'var(--text-primary)', marginTop:6}}>${earnedSavings}<span style={{fontSize:'var(--fs-body)', fontWeight:400, color:'var(--text-subdued)'}}>/${totalSavings} possible</span></div>
          <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:4}}>Cancel duplicate apps once consolidated</div>
        </div>

        <div className="card card-pad">
          <div className="eyebrow">Estimated effort</div>
          <div className="stat-value tnum" style={{marginTop:6}}>~3h 5m<span style={{fontSize:'var(--fs-body)', fontWeight:400, color:'var(--text-subdued)'}}> total</span></div>
          <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:4}}>One person · backups taken automatically</div>
        </div>
      </div>

      {/* Action items */}
      <div className="card">
        <header className="card-header">
          <div className="row gap-2">
            <span className="badge-dot" style={{background:'var(--warning-fg)'}}/>
            <h3 className="card-title">Fix these first</h3>
          </div>
          <div className="row gap-2">
            <button className="btn btn-ghost btn-sm"><I.sort size={13}/>Sort by impact</button>
            <button className="btn btn-secondary btn-sm">Send to developer</button>
          </div>
        </header>

        <div className="ap-items">
          {D2.actionPlan.map((it, i) => (
            <article key={it.id} className={`ap-item ${done[it.id]?'is-done':''}`}>
              <button className="ap-check" onClick={() => setDone(s => ({...s, [it.id]: !s[it.id]}))}>
                {done[it.id] ? <I.check size={14}/> : <span className="ap-check-num">{i+1}</span>}
              </button>
              <div className="ap-body">
                <div className="row gap-2" style={{flexWrap:'wrap'}}>
                  <h4 className="ap-title">{it.title}</h4>
                  {it.impact==='cost'
                    ? <Badge tone="info" dot>Cost saving</Badge>
                    : <Badge tone={impactTone(it.impact)} dot>{impactLabel(it.impact)} impact</Badge>}
                </div>
                <p className="ap-detail">{it.detail}</p>
                <div className="ap-meta">
                  <span><I.clock size={11} style={{verticalAlign:-2, marginRight:4}}/>{it.eta}</span>
                  <span className="orph-dot"/>
                  <span><I.shield size={11} style={{verticalAlign:-2, marginRight:4}}/>Risk: {it.risk}</span>
                  <span className="orph-dot"/>
                  <span><I.layers size={11} style={{verticalAlign:-2, marginRight:4}}/>Affects: theme.liquid</span>
                </div>
              </div>
              <div className="ap-pts">
                {it.impact==='cost'
                  ? <div className="tnum" style={{color:'var(--info-fg)', fontWeight:'var(--fw-bold)', fontSize:18}}>${it.savings}/mo</div>
                  : <div className="tnum" style={{color:'var(--success-fg)', fontWeight:'var(--fw-bold)', fontSize:18}}>+{it.pts} pts</div>}
                <button className="btn btn-ghost btn-sm" style={{marginTop:4}}>
                  Details <I.chevright size={12}/>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// COSTS & USAGE
// =====================================================================

const Costs = ({ go }) => {
  const sortedByCost = [...D2.apps].sort((a, b) => b.cost - a.cost);
  const yearly = D2.apps.reduce((s, a) => s + a.cost * 12, 0);
  const monthly = D2.apps.reduce((s, a) => s + a.cost, 0);
  const unusedCost = D2.apps.filter(a => a.costStatus==='unused').reduce((s, a) => s + a.cost, 0);

  return (
    <div className="col" style={{gap:'var(--s-4)'}}>
      {/* Top tiles */}
      <div className="costs-strip">
        <div className="card card-pad">
          <div className="eyebrow">Fiscal-year projection</div>
          <div className="stat-value tnum" style={{marginTop:6}}>${(yearly).toLocaleString()}</div>
          <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:4}}>
            <span style={{color:'var(--warning-fg)', fontWeight:'var(--fw-medium)'}}>${unusedCost*12}</span> low-value or duplicate spend
          </div>
          <div style={{marginTop:10}}>
            <Bar value={unusedCost*12} max={yearly} tone="warning" width="100%"/>
          </div>
        </div>

        <div className="card card-pad">
          <div className="eyebrow">Billing confidence</div>
          <div className="stat-value tnum" style={{marginTop:6}}>71%</div>
          <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:4}}>10 confirmed · 3 imported · 1 unknown</div>
          <div className="row gap-1" style={{marginTop:10}}>
            <div style={{flex:10, height:6, background:'var(--success-fg)', borderRadius:3}}/>
            <div style={{flex:3,  height:6, background:'var(--info-fg)', borderRadius:3}}/>
            <div style={{flex:1,  height:6, background:'var(--neutral-bg)', borderRadius:3, border:'1px solid var(--border)'}}/>
          </div>
        </div>

        <div className="card card-pad">
          <div className="eyebrow">Unused paid apps</div>
          <div className="stat-value tnum" style={{color:'var(--warning-fg)', marginTop:6}}>{D2.apps.filter(a=>a.costStatus==='unused').length}</div>
          <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:4}}>${unusedCost}/mo · ${unusedCost*12}/yr opportunity</div>
          <button className="btn btn-secondary btn-sm" style={{marginTop:10}} onClick={() => go('actionplan')}>Review cancellations</button>
        </div>

        <div className="card card-pad">
          <div className="eyebrow">Renewals next 30 days</div>
          <div className="stat-value tnum" style={{marginTop:6}}>4</div>
          <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:4}}>$157 due · Klaviyo, Tidio, +2</div>
          <button className="btn btn-secondary btn-sm" style={{marginTop:10}}>View calendar</button>
        </div>
      </div>

      {/* Cost vs usage scatter / table */}
      <div className="card">
        <header className="card-header">
          <div>
            <h3 className="card-title">Cost vs. usage</h3>
            <div className="muted" style={{fontSize:'var(--fs-body-sm)', marginTop:2}}>Apps in the upper-left are paying for inactivity</div>
          </div>
          <div className="row gap-2">
            <button className="btn btn-ghost btn-sm"><I.upload size={13}/>Import billing CSV</button>
            <button className="btn btn-ghost btn-sm"><I.download size={13}/>Export</button>
          </div>
        </header>

        <div className="costs-scatter-wrap">
          <CostsScatter apps={D2.apps}/>
        </div>
      </div>

      {/* Apps cost table */}
      <div className="card">
        <header className="card-header">
          <h3 className="card-title">All apps · {D2.apps.length} subscriptions</h3>
          <span className="muted tnum" style={{fontSize:'var(--fs-body-sm)'}}>${monthly}/mo · ${yearly.toLocaleString()}/yr</span>
        </header>
        <table className="table">
          <thead>
            <tr>
              <th>App</th>
              <th>Plan</th>
              <th>Monthly</th>
              <th>Yearly</th>
              <th>Usage (30d)</th>
              <th>Last billed</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedByCost.map(a => (
              <tr key={a.id}>
                <td>
                  <div className="row gap-3">
                    <AppTile app={a}/>
                    <div className="col">
                      <span className="semi">{a.name}</span>
                      <span className="muted" style={{fontSize:'var(--fs-caption)'}}>{a.category}</span>
                    </div>
                  </div>
                </td>
                <td className="muted" style={{fontSize:'var(--fs-body-sm)'}}>{a.cost >= 60 ? 'Pro' : a.cost >= 25 ? 'Growth' : a.cost >= 15 ? 'Starter' : 'Free+'}</td>
                <td className="tnum semi">${a.cost}</td>
                <td className="tnum muted">${a.cost*12}</td>
                <td>
                  <div className="row gap-2">
                    <Bar value={a.usageScore*100} max={100} tone={a.usageScore>0.6?'success':a.usageScore>0.3?'warning':'critical'} width={80}/>
                    <span className="tnum muted" style={{fontSize:'var(--fs-caption)'}}>{Math.round(a.usageScore*100)}%</span>
                  </div>
                </td>
                <td className="muted tnum" style={{fontSize:'var(--fs-body-sm)'}}>Apr 28</td>
                <td>
                  {a.costStatus==='unused'
                    ? <Badge tone="warning" dot>Unused</Badge>
                    : <Badge tone="success" dot>Active</Badge>}
                </td>
                <td style={{textAlign:'right'}}>
                  <button className="btn btn-ghost btn-sm">{a.costStatus==='unused' ? 'Cancel' : 'Manage'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CostsScatter = ({ apps }) => {
  // x: usage (0-1), y: cost (0-100)
  const W = 760, H = 280;
  const PAD = { l: 56, r: 24, t: 16, b: 36 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const maxCost = 100;

  return (
    <div style={{padding:'var(--s-5)', overflow:'auto'}}>
      <svg width={W} height={H} style={{display:'block', minWidth:W}}>
        {/* Quadrants */}
        <rect x={PAD.l} y={PAD.t} width={innerW/2} height={innerH/2} fill="var(--critical-bg-2)" opacity="0.7"/>
        <rect x={PAD.l + innerW/2} y={PAD.t} width={innerW/2} height={innerH/2} fill="var(--info-bg-2)" opacity="0.7"/>
        <rect x={PAD.l} y={PAD.t + innerH/2} width={innerW/2} height={innerH/2} fill="var(--bg-surface-2)"/>
        <rect x={PAD.l + innerW/2} y={PAD.t + innerH/2} width={innerW/2} height={innerH/2} fill="var(--success-bg-2)" opacity="0.7"/>
        {/* Quadrant labels */}
        <text x={PAD.l + 10}             y={PAD.t + 20} fontSize="10.5" fontWeight="600" fill="var(--critical-fg)" opacity="0.85">CANCEL CANDIDATE</text>
        <text x={PAD.l + innerW - 10}    y={PAD.t + 20} fontSize="10.5" fontWeight="600" fill="var(--info-fg)" opacity="0.85" textAnchor="end">PREMIUM &amp; USED</text>
        <text x={PAD.l + 10}             y={H - PAD.b - 10} fontSize="10.5" fontWeight="600" fill="var(--text-subdued)" opacity="0.85">LOW VALUE</text>
        <text x={PAD.l + innerW - 10}    y={H - PAD.b - 10} fontSize="10.5" fontWeight="600" fill="var(--success-fg)" opacity="0.85" textAnchor="end">GOOD VALUE</text>
        {/* Grid */}
        <line x1={PAD.l + innerW/2} y1={PAD.t} x2={PAD.l + innerW/2} y2={H-PAD.b} stroke="var(--chart-grid)" strokeDasharray="2 3"/>
        <line x1={PAD.l} y1={PAD.t + innerH/2} x2={W-PAD.r} y2={PAD.t + innerH/2} stroke="var(--chart-grid)" strokeDasharray="2 3"/>
        {/* Axes */}
        <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke="var(--chart-axis)"/>
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H-PAD.b} stroke="var(--chart-axis)"/>
        {/* Axis labels */}
        <text x={PAD.l + innerW/2} y={H-6} fontSize="11" fontWeight="600" fill="var(--text-subdued)" textAnchor="middle">USAGE (30-day)</text>
        <text x={14} y={PAD.t + innerH/2} fontSize="11" fontWeight="600" fill="var(--text-subdued)" transform={`rotate(-90 14 ${PAD.t + innerH/2})`} textAnchor="middle">MONTHLY COST</text>
        {/* Y ticks */}
        {[0,25,50,75,100].map(v => (
          <g key={v}>
            <text x={PAD.l-8} y={H - PAD.b - (v/maxCost)*innerH + 3} fontSize="10" fill="var(--text-subdued)" textAnchor="end">${v}</text>
          </g>
        ))}
        {/* X ticks */}
        {[0,0.25,0.5,0.75,1].map(v => (
          <text key={v} x={PAD.l + v*innerW} y={H-PAD.b+14} fontSize="10" fill="var(--text-subdued)" textAnchor="middle">{Math.round(v*100)}%</text>
        ))}
        {/* Points */}
        {apps.filter(a => a.cost>0).map(a => {
          const cx = PAD.l + a.usageScore * innerW;
          const cy = H - PAD.b - (Math.min(a.cost, maxCost)/maxCost) * innerH;
          const r = 6 + a.scripts*1.5;
          return (
            <g key={a.id}>
              <circle cx={cx} cy={cy} r={r} fill={a.tone} opacity="0.20"/>
              <circle cx={cx} cy={cy} r={r-2} fill={a.tone} opacity="0.65" stroke="var(--bg-surface)" strokeWidth="1.5"/>
              <text x={cx + r + 3} y={cy + 3} fontSize="10.5" fontWeight="600" fill="var(--text-primary)">{a.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

Object.assign(window, { Orphaned, ActionPlan, Costs });
