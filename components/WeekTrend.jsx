import { useState } from 'react';
import { getAqiLevel } from '../utils/aqi.js';

const W = 760, H = 240, PAD = { l: 44, r: 20, t: 24, b: 34 };
const BANDS = [
  { v: 50, label: 'Good' },
  { v: 100, label: 'Satisfactory' },
  { v: 200, label: 'Moderate' },
  { v: 300, label: 'Poor' },
  { v: 400, label: 'Very poor' },
];

// Smooth line through points (monotone-ish cubic)
function smooth(pts) {
  return pts.reduce((d, [x, y], i) => {
    if (!i) return `M${x} ${y}`;
    const [px, py] = pts[i - 1];
    const cx = (px + x) / 2;
    return `${d} C${cx} ${py} ${cx} ${y} ${x} ${y}`;
  }, '');
}

export default function WeekTrend({ weekly = [], todayAqi }) {
  const [hover, setHover] = useState(null);
  // Drop days with missing forecast data (they compute to ~0)
  const days = weekly.filter((d) => d.aqi > 5);
  if (!days.length) return <p className="week-empty">Weekly data unavailable.</p>;

  const peak = Math.max(...days.map((d) => d.aqi), todayAqi || 0);
  const top = BANDS.find((b) => b.v >= peak * 1.1)?.v || 500;
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const x = (i) => PAD.l + (days.length === 1 ? iw / 2 : (i * iw) / (days.length - 1));
  const y = (v) => PAD.t + ih - (v / top) * ih;
  const pts = days.map((d, i) => [x(i), y(d.aqi)]);
  const line = smooth(pts);
  const area = `${line} L${pts.at(-1)[0]} ${PAD.t + ih} L${pts[0][0]} ${PAD.t + ih} Z`;

  const avg = Math.round(days.reduce((s, d) => s + d.aqi, 0) / days.length);
  const best = days.reduce((a, b) => (b.aqi < a.aqi ? b : a));
  const worst = days.reduce((a, b) => (b.aqi > a.aqi ? b : a));
  const unhealthy = days.filter((d) => d.aqi > 100).length;
  const avgLvl = getAqiLevel(avg);
  const h = hover != null ? days[hover] : null;

  return (
    <div className="wt">
      <div className="wt-kpis">
        <div className="wt-kpi"><small>Weekly average</small><b style={{ color: avgLvl.gaugeColor }}>{avg}</b><span>{avgLvl.category}</span></div>
        <div className="wt-kpi"><small>Cleanest day</small><b>{best.aqi}</b><span>{best.day}</span></div>
        <div className="wt-kpi"><small>Most polluted</small><b>{worst.aqi}</b><span>{worst.day}</span></div>
        <div className="wt-kpi"><small>Days above 100</small><b>{unhealthy}<i>/{days.length}</i></b><span>{unhealthy ? 'Limit exposure' : 'All clear'}</span></div>
      </div>

      <div className="wt-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Daily average AQI this week" onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="wt-stroke" x1="0" y1={y(0)} x2="0" y2={y(top)} gradientUnits="userSpaceOnUse">
              {[[0, '#1da463'], [100, '#2da866'], [101, '#d97706'], [200, '#d97706'], [201, '#ea580c'], [300, '#ea580c'], [301, '#dc2626'], [500, '#7f1d1d']]
                .filter(([v]) => v <= top)
                .map(([v, c]) => <stop key={v} offset={v / top} stopColor={c} />)}
            </linearGradient>
            <linearGradient id="wt-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={avgLvl.gaugeColor} stopOpacity=".32" />
              <stop offset="1" stopColor={avgLvl.gaugeColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {BANDS.filter((b) => b.v < top).concat({ v: top }).map((b) => (
            <g key={b.v} className="wt-grid">
              <line x1={PAD.l} x2={W - PAD.r} y1={y(b.v)} y2={y(b.v)} />
              <text x={PAD.l - 8} y={y(b.v) + 4} textAnchor="end">{b.v}</text>
            </g>
          ))}
          <line className="wt-base" x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} />
          <line className="wt-avg" x1={PAD.l} x2={W - PAD.r} y1={y(avg)} y2={y(avg)} />
          <text className="wt-avg-label" x={W - PAD.r} y={y(avg) - 6} textAnchor="end">avg {avg}</text>

          <path d={area} fill="url(#wt-fill)" className="wt-area" />
          <path d={line} fill="none" stroke="url(#wt-stroke)" strokeWidth="3.5" strokeLinecap="round" className="wt-line" pathLength="1" />

          {h && <line className="wt-cursor" x1={pts[hover][0]} x2={pts[hover][0]} y1={PAD.t} y2={PAD.t + ih} />}
          {days.map((d, i) => {
            const lvl = getAqiLevel(d.aqi);
            return (
              <g key={d.date || i}>
                <rect x={pts[i][0] - iw / days.length / 2} y={PAD.t} width={iw / days.length} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
                <circle cx={pts[i][0]} cy={pts[i][1]} r={hover === i ? 7 : 5} fill="var(--card-bg)" stroke={lvl.gaugeColor} strokeWidth="3" className="wt-dot" />
                <text x={pts[i][0]} y={H - 10} textAnchor="middle" className={`wt-day ${i === 0 ? 'today' : ''}`}>{i === 0 ? 'Today' : d.day}</text>
              </g>
            );
          })}
        </svg>

        {h && (
          <div className="wt-tip" style={{ left: `${(pts[hover][0] / W) * 100}%`, top: `${(pts[hover][1] / H) * 100}%` }}>
            <small>{hover === 0 ? 'Today' : h.day}{h.date ? ` · ${new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}</small>
            <b style={{ color: getAqiLevel(h.aqi).gaugeColor }}>{h.aqi}</b>
            <span>{getAqiLevel(h.aqi).category}</span>
          </div>
        )}
      </div>
      <p className="wt-note">Daily average India AQI from hourly model data. Hover the chart for details{todayAqi ? ` · current reading ${todayAqi}` : ''}.</p>
    </div>
  );
}
