// AppLens — shared icons, primitive components, and small viz pieces.
// Loaded as a Babel script; exports to window so other Babel scripts can use them.

// ---------- Icons (24px viewbox, stroke-based) ----------
const Icon = ({ d, fill, size = 16, stroke = 1.5, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const I = {
  refresh:  (p) => <Icon {...p} d={['M3 12a9 9 0 0 1 15.5-6.3L21 8','M21 3v5h-5','M21 12a9 9 0 0 1-15.5 6.3L3 16','M3 21v-5h5']} />,
  play:     (p) => <Icon {...p} d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none" />,
  search:   (p) => <Icon {...p} d={['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z','m21 21-4.3-4.3']} />,
  filter:   (p) => <Icon {...p} d="M3 5h18l-7 9v6l-4-2v-4L3 5z" />,
  sort:     (p) => <Icon {...p} d={['M7 4v16','M3 8l4-4 4 4','M17 20V4','M21 16l-4 4-4-4']} />,
  download: (p) => <Icon {...p} d={['M12 3v12','m7 10 5 5 5-5','M5 21h14']} />,
  upload:   (p) => <Icon {...p} d={['M12 21V9','m7 14 5-5 5 5','M5 3h14']} />,
  external: (p) => <Icon {...p} d={['M14 4h6v6','m10 14 10-10','M20 14v6H4V4h6']} />,
  chevright:(p) => <Icon {...p} d="M9 6l6 6-6 6" />,
  chevdown: (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  chevup:   (p) => <Icon {...p} d="M6 15l6-6 6 6" />,
  more:     (p) => <Icon {...p} d={['M12 12h.01','M19 12h.01','M5 12h.01']} stroke={3} />,
  check:    (p) => <Icon {...p} d="M4 12l5 5L20 6" />,
  x:        (p) => <Icon {...p} d={['M6 6l12 12','M18 6L6 18']} />,
  alert:    (p) => <Icon {...p} d={['M12 9v4','M12 17h.01','M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z']} />,
  info:     (p) => <Icon {...p} d={['M12 8h.01','M11 12h1v4h1','M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z']} />,
  bolt:     (p) => <Icon {...p} d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />,
  trash:    (p) => <Icon {...p} d={['M3 6h18','M8 6V4h8v2','m6 6 1 14h10l1-14','M10 11v6','M14 11v6']} />,
  eye:      (p) => <Icon {...p} d={['M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z','M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z']} />,
  shield:   (p) => <Icon {...p} d={['M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10z']} />,
  settings: (p) => <Icon {...p} d={['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z']} />,
  sun:      (p) => <Icon {...p} d={['M12 5V3','M12 21v-2','M5 12H3','M21 12h-2','m6 6-1.5-1.5','m19.5 4.5L18 6','m6 18-1.5 1.5','m19.5 19.5L18 18','M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z']} />,
  moon:     (p) => <Icon {...p} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  bell:     (p) => <Icon {...p} d={['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9','M11 21h2']} />,
  code:     (p) => <Icon {...p} d={['m16 18 6-6-6-6','m8 6-6 6 6 6']} />,
  scripts:  (p) => <Icon {...p} d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','m9 14 2 2 4-4']} />,
  pkg:      (p) => <Icon {...p} d={['M21 16V8l-9-5-9 5v8l9 5 9-5z','M3.3 7 12 12l8.7-5','M12 12v10']} />,
  trend:    (p) => <Icon {...p} d={['m3 17 6-6 4 4 8-8','M14 7h7v7']} />,
  drop:     (p) => <Icon {...p} d={['m3 7 6 6 4-4 8 8','M14 17h7v-7']} />,
  spinner:  (p) => <Icon {...p} d="M21 12a9 9 0 1 1-9-9" className="spin" />,
  dot:      (p) => <Icon {...p} d="M12 12h.01" stroke={6} />,
  clock:    (p) => <Icon {...p} d={['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M12 6v6l4 2']} />,
  doc:      (p) => <Icon {...p} d={['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M9 13h6','M9 17h4']} />,
  globe:    (p) => <Icon {...p} d={['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M2 12h20','M12 2a15 15 0 0 1 0 20','M12 2a15 15 0 0 0 0 20']} />,
  link:     (p) => <Icon {...p} d={['M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1','M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1']} />,
  arrowRight:(p)=> <Icon {...p} d={['M5 12h14','m12 5 7 7-7 7']} />,
  back:     (p) => <Icon {...p} d={['M19 12H5','m12 19-7-7 7-7']} />,
  layers:   (p) => <Icon {...p} d={['m12 2 10 6-10 6L2 8l10-6z','m2 17 10 6 10-6','M2 12l10 6 10-6']} />,
  dollar:   (p) => <Icon {...p} d={['M12 2v20','M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']} />,
  grid:     (p) => <Icon {...p} d={['M3 3h8v8H3z','M13 3h8v5h-8z','M13 10h8v11h-8z','M3 13h8v8H3z']} />,
};

// ---------- Status helpers ----------
const impactTone = (i) => ({ critical:'critical', high:'warning', medium:'warning', low:'success', none:'neutral', cost:'info' }[i] || 'neutral');
const impactLabel = (i) => ({ critical:'Critical', high:'High', medium:'Medium', low:'Low', none:'None', cost:'Cost' }[i] || i);

const Badge = ({ tone='neutral', dot=false, outline=false, children, style }) => (
  <span className={`badge badge-${tone}${outline ? ' badge-outline' : ''}`} style={style}>
    {dot && <span className="badge-dot" />}
    {children}
  </span>
);

const ImpactBadge = ({ impact }) => (
  <Badge tone={impactTone(impact)} dot>{impactLabel(impact)}</Badge>
);

// ---------- App tile ----------
const AppTile = ({ app, size = 32 }) => (
  <span className="app-tile"
        style={{ width: size, height: size, background: app.tone + '18', color: app.tone, borderColor: app.tone + '30', fontSize: size*0.36 }}>
    {app.initials}
  </span>
);

// ---------- Score ring ----------
const ScoreRing = ({ value=28, max=100, size=132, stroke=10, color, label, sublabel, projected }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = pct * c;
  const auto = color || (value < 35 ? 'var(--chart-critical)' : value < 60 ? 'var(--chart-warning)' : 'var(--chart-success)');
  return (
    <div className="score-ring" style={{ width:size, height:size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={auto} strokeWidth={stroke}
                strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={c/4} strokeLinecap="round"
                transform={`rotate(-90 ${size/2} ${size/2})`}/>
        {projected != null && (
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={auto} strokeWidth={stroke}
                  strokeDasharray="2 4" opacity="0.35"
                  strokeDashoffset={c/4 - (projected/max)*c + dash} strokeLinecap="butt"
                  transform={`rotate(-90 ${size/2} ${size/2})`}/>
        )}
      </svg>
      <div className="score-ring-num" style={{ fontSize: size*0.32, color: auto }}>
        <div>
          {value}
          {label && <span className="small">{label}</span>}
          {sublabel && <span className="small" style={{color:'var(--text-subdued)'}}>{sublabel}</span>}
        </div>
      </div>
    </div>
  );
};

// ---------- Sparkline ----------
const Sparkline = ({ data=[], width=80, height=24, stroke, fill=true, baseline=true }) => {
  if (!data.length) return <svg width={width} height={height}/>;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / span) * (height - 4) - 2;
    return [x, y];
  });
  const line = pts.map(([x,y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const last = data[data.length-1];
  const color = stroke || (last > max*0.7 ? 'var(--chart-critical)' : last > max*0.4 ? 'var(--chart-warning)' : 'var(--chart-success)');
  return (
    <svg width={width} height={height} style={{display:'block'}}>
      {fill && (
        <path d={`${line} L${width},${height} L0,${height} Z`} fill={color} opacity="0.12"/>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      {baseline && <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2" fill={color}/>}
    </svg>
  );
};

// ---------- Bar (single horizontal) ----------
const Bar = ({ value=0, max=100, tone='critical', width=120, height=6, label }) => {
  const pct = Math.max(0, Math.min(1, value / max));
  const color = { critical:'var(--chart-critical)', warning:'var(--chart-warning)', success:'var(--chart-success)', info:'var(--chart-info)', neutral:'var(--border-strong)' }[tone];
  return (
    <div style={{display:'inline-flex',alignItems:'center',gap:8}}>
      <div className="bar" style={{ width, height }}>
        <i style={{ width: `${pct*100}%`, background: color }} />
      </div>
      {label && <span className="tnum muted" style={{fontSize:'var(--fs-caption)'}}>{label}</span>}
    </div>
  );
};

// ---------- Waterfall (script load timing) ----------
const Waterfall = ({ items=[], width=420, height=180 }) => {
  const max = Math.max(...items.map(i => i.start + i.dur), 100);
  const rowH = (height - 20) / items.length;
  return (
    <svg width={width} height={height} style={{display:'block'}}>
      {/* axis */}
      <g stroke="var(--chart-grid)" strokeWidth="1">
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1={p*width} x2={p*width} y1="14" y2={height-2}/>
        ))}
      </g>
      <g fontFamily="var(--font-mono)" fontSize="9.5" fill="var(--text-subdued)">
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <text key={i} x={p*width} y="10" textAnchor={i===0?'start':i===4?'end':'middle'}>{(p*max).toFixed(0)}ms</text>
        ))}
      </g>
      {items.map((it, i) => {
        const y = 16 + i * rowH;
        const x = (it.start / max) * width;
        const w = Math.max(2, (it.dur / max) * width);
        const color = it.tone==='critical' ? 'var(--chart-critical)' : it.tone==='warning' ? 'var(--chart-warning)' : it.tone==='success' ? 'var(--chart-success)' : 'var(--chart-info)';
        return (
          <g key={i}>
            <rect x={x} y={y+2} width={w} height={rowH-6} fill={color} rx="2" opacity="0.85"/>
            <text x={x + w + 4} y={y + rowH/2 + 3} fontSize="10.5" fill="var(--text-secondary)" fontFamily="var(--font-mono)">{it.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ---------- Treemap (script weight) ----------
const Treemap = ({ items=[], width=320, height=200 }) => {
  // Simple slice-and-dice treemap (rows alternate direction)
  const total = items.reduce((s, i) => s + i.value, 0);
  const sorted = [...items].sort((a,b) => b.value - a.value);
  // pack into 3 rows
  const rows = [[], [], []];
  let rTot = [0,0,0];
  sorted.forEach((it) => {
    const ri = rTot.indexOf(Math.min(...rTot));
    rows[ri].push(it);
    rTot[ri] += it.value;
  });
  const rowHs = rTot.map(t => (t / total) * height);
  let y = 0;
  return (
    <svg width={width} height={height} style={{display:'block', borderRadius: 8, overflow:'hidden'}}>
      {rows.map((row, ri) => {
        const rh = rowHs[ri];
        const rtot = rTot[ri] || 1;
        let x = 0;
        const cells = row.map((it, i) => {
          const w = (it.value / rtot) * width;
          const cell = (
            <g key={`${ri}-${i}`}>
              <rect x={x} y={y} width={w-1} height={rh-1} fill={it.color} rx="3"/>
              {w > 60 && rh > 28 && (
                <>
                  <text x={x+8} y={y+16} fontSize="11" fontWeight="600" fill="#fff" opacity="0.95">{it.label}</text>
                  <text x={x+8} y={y+30} fontSize="10" fill="#fff" opacity="0.78" fontFamily="var(--font-mono)">{it.value}kb</text>
                </>
              )}
            </g>
          );
          x += w;
          return cell;
        });
        const g = <g key={ri}>{cells}</g>;
        y += rh;
        return g;
      })}
    </svg>
  );
};

// ---------- Animated count ----------
const useCount = (target, ms=600) => {
  const [v, setV] = React.useState(target);
  React.useEffect(() => {
    let raf, start;
    const from = v;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / ms);
      const ease = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * ease);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
};

// ---------- Spinner CSS keyframe (inject once) ----------
if (!document.getElementById('al-anim')) {
  const s = document.createElement('style');
  s.id = 'al-anim';
  s.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { transform-origin: 12px 12px; animation: spin 0.9s linear infinite; }
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }
    .pulse { animation: pulse 1.4s ease-in-out infinite; }
    @keyframes barIn { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    .bar > i { transform-origin: left; animation: barIn 0.6s cubic-bezier(.2,.7,.3,1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
    .fade-in { animation: fadeIn 0.32s cubic-bezier(.2,.7,.3,1) both; }
    @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: calc(200px + 100%) 0; } }
  `;
  document.head.appendChild(s);
}

Object.assign(window, { I, Icon, Badge, ImpactBadge, AppTile, ScoreRing, Sparkline, Bar, Waterfall, Treemap, useCount, impactTone, impactLabel });
