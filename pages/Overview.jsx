import { useState } from 'react';
import WeekTrend from '../components/WeekTrend.jsx';
import AqiGauge from '../components/AqiGauge.jsx';
import AirBuddy from '../components/AirBuddy.jsx';
import IndiaAirMap from '../components/IndiaAirMap.jsx';
import CityAqiMap from '../components/CityAqiMap.jsx';
import { getAqiLevel } from '../utils/aqi.js';

export default function Overview({ data, location, onNavigate, onSelectCity }) {
  const aqiLevel = getAqiLevel(data.aqi);
  const [showWeek, setShowWeek] = useState(true);

  // Extract up to 6 sample points from hourly forecast for the visual curve
  const hourlyPoints = data?.hourly?.length >= 6
    ? [0, 2, 4, 6, 8, 10].map((idx) => data.hourly[idx] || data.hourly[data.hourly.length - 1])
    : [
        { time: 'Now', aqi: data.aqi },
        { time: '10 AM', aqi: Math.max(30, data.aqi - 15) },
        { time: '12 PM', aqi: Math.max(35, data.aqi - 5) },
        { time: '2 PM', aqi: data.aqi + 10 },
        { time: '4 PM', aqi: data.aqi + 22 },
        { time: '6 PM', aqi: data.aqi + 30 },
      ];

  const maxVal = Math.max(...hourlyPoints.map((p) => p.aqi), 200);
  const minVal = Math.min(...hourlyPoints.map((p) => p.aqi), 20);
  const range = maxVal - minVal || 1;

  // Compute SVG coordinates (x: 20 to 460, y: 30 to 140)
  const coords = hourlyPoints.map((p, i) => {
    const x = Math.round(20 + i * (440 / (hourlyPoints.length - 1)));
    const y = Math.round(135 - ((p.aqi - minVal) / range) * 95);
    return [x, y];
  });

  const pathD = coords.reduce((acc, curr, idx) => {
    if (idx === 0) return `M${curr[0]} ${curr[1]}`;
    const prev = coords[idx - 1];
    const cpX1 = prev[0] + (curr[0] - prev[0]) / 2;
    const cpX2 = cpX1;
    return `${acc} C${cpX1} ${prev[1]} ${cpX2} ${curr[1]} ${curr[0]} ${curr[1]}`;
  }, '');

  const areaD = `${pathD} L${coords[coords.length - 1][0]} 155 L${coords[0][0]} 155 Z`;

  return (
    <section className="view active">
      <div className="head-row">
        <div>
          <p className="eyebrow">Local air snapshot</p>
          <h1>Your air, at a glance.</h1>
          <p className="sub">
            Real-time conditions and forecast around <b>{data.fullLocation || location}</b>.
          </p>
          <div className="theme-indicator-badge">
            ● Current Level: {aqiLevel.category} — {aqiLevel.guide}
          </div>
        </div>
        <div className="updated">
          ◷ &nbsp; {data.isLive ? `Live API · Updated ${data.lastUpdated}` : 'Sample data view'}
        </div>
      </div>

      <div className="grid hero-grid">
        <article className="card aqi-card">
          <div className="card-top">
            <h2 className="card-title">Air quality right now</h2>
            <span className={`tag ${data.isLive ? 'green' : ''}`}>
              {data.isLive ? '● LIVE API' : 'SAMPLE VIEW'}
            </span>
          </div>
          <div className="aqi-main">
            <AqiGauge value={data.aqi} color={aqiLevel.gaugeColor} />
            <div>
              <p className="status" style={{ color: aqiLevel.gaugeColor }}>
                {data.status}
                <span className="status-city">📍 {data.location || location}</span>
              </p>
              <p className="status-desc">{data.msg}</p>
            </div>
            <AirBuddy levelKey={aqiLevel.key} color={aqiLevel.gaugeColor} />
          </div>
          <div className="pollutants">
            <div className="pollutant">
              <span>PM2.5</span>
              <strong>{data.pm25} <i className="unit">µg/m³</i></strong>
            </div>
            <div className="pollutant">
              <span>PM10</span>
              <strong>{data.pm10} <i className="unit">µg/m³</i></strong>
            </div>
            <div className="pollutant">
              <span>NO₂</span>
              <strong>{data.no2} <i className="unit">µg/m³</i></strong>
            </div>
            {data.o3 !== undefined && (
              <div className="pollutant">
                <span>Ozone (O₃)</span>
                <strong>{data.o3} <i className="unit">µg/m³</i></strong>
              </div>
            )}
            {data.so2 !== undefined && (
              <div className="pollutant">
                <span>SO₂</span>
                <strong>{data.so2} <i className="unit">µg/m³</i></strong>
              </div>
            )}
            {data.co !== undefined && (
              <div className="pollutant">
                <span>CO</span>
                <strong>{data.co} <i className="unit">µg/m³</i></strong>
              </div>
            )}
          </div>
        </article>

        <article className="card forecast-card">
          <div className="card-heading">
            <h2>Today’s air outlook</h2>
            <button className="text-link" type="button" onClick={() => onNavigate('insights')}>
              View insights ↗
            </button>
          </div>
          <p className="sub">
            {data.isLive ? 'Live hourly forecast curve · India AQI' : 'Illustrative hourly pattern · India AQI'}
          </p>
          <svg className="chart" viewBox="0 0 480 170" preserveAspectRatio="none" role="img" aria-label="AQI trend line">
            <defs>
              <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={aqiLevel.gaugeColor} stopOpacity=".3" />
                <stop offset="1" stopColor={aqiLevel.gaugeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="16" y1="34" x2="466" y2="34" stroke="#edf2ef" />
            <line x1="16" y1="83" x2="466" y2="83" stroke="#edf2ef" />
            <line x1="16" y1="132" x2="466" y2="132" stroke="#edf2ef" />
            <path d={areaD} fill="url(#area)" />
            <path d={pathD} fill="none" stroke={aqiLevel.gaugeColor} strokeWidth="3" strokeLinecap="round" />
            {coords.map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="4" fill={aqiLevel.gaugeColor} />
            ))}
          </svg>
          <div className="chart-labels">
            {hourlyPoints.map((p, idx) => (
              <span key={idx}>{p.time}</span>
            ))}
          </div>
          <div className="best-time">
            ✦{' '}
            <span>
              <b>Better window:</b>{' '}
              {data.bestSlot
                ? `${data.bestSlot.time} (Predicted AQI: ${data.bestSlot.aqi})`
                : '10 AM – 12 PM'}
            </span>
          </div>
        </article>
      </div>

      <CityAqiMap city={data.location || location} />

      <IndiaAirMap
        currentCity={data.location || location}
        currentAqi={data.aqi}
        onSelectCity={onSelectCity || onNavigate}
      />

      <div className="section-title">
        <h2>Precautionary guidance & recommendations</h2>
      </div>

      <div className="advisory" style={{ '--lvl': aqiLevel.gaugeColor }}>
        <div className="advisory-pulse"><span>{data.aqi}</span></div>
        <div className="advisory-body">
          <span className="advisory-kicker">Health advisory · {data.location || location}</span>
          <div className="advisory-titlerow">
            <strong>{data.status} air quality — {aqiLevel.guide}</strong>
            <button type="button" className={`week-toggle ${showWeek ? 'on' : ''}`} onClick={() => setShowWeek((v) => !v)} aria-expanded={showWeek}>
              {showWeek ? 'Hide weekly trend' : 'Show weekly trend'} <span aria-hidden="true">{showWeek ? '▴' : '▾'}</span>
            </button>
          </div>
          <p>{data.msg}</p>
          <div className="advisory-scale">
            {[0, 50, 100, 200, 300, 400].map((min, i) => (
              <i key={min} className={data.aqi > min && data.aqi <= [50, 100, 200, 300, 400, 9999][i] ? 'on' : ''} />
            ))}
            <b style={{ left: `${Math.min(100, (data.aqi / 500) * 100)}%` }} />
          </div>
        </div>
      </div>

      {showWeek && (
        <div className="card week-card" style={{ '--lvl': aqiLevel.gaugeColor }}>
          <h3>7-day air quality trend · {data.location || location}</h3>
          <WeekTrend weekly={data.weekly} todayAqi={data.aqi} />
        </div>
      )}

      <div className="guide-groups">
        {GUIDE_GROUPS.map((grp) => {
          const current = grp.tone === (data.aqi <= 100 ? 'safe' : data.aqi <= 200 ? 'caution' : 'avoid');
          return (
            <section key={grp.tone} className={`guide-group tone-${grp.tone} ${current ? 'current' : ''}`}>
              <header className="guide-group-head">
                <span className="guide-group-icon" aria-hidden="true">{grp.symbol}</span>
                <div>
                  <h3>{grp.label}</h3>
                  <small>India AQI {grp.range}</small>
                </div>
                {current && <span className="guide-now">Now · {data.aqi}</span>}
              </header>
              <ul>
                {getGuidance(grp.sample).map((g) => (
                  <li key={g.title}>
                    <span className="guide-icon" aria-hidden="true">{g.icon}</span>
                    <div>
                      <div className="guide-row-top"><b>{g.title}</b><span className="guide-badge">{g.badge}</span></div>
                      <p>{g.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="footer-note">
        Data powered by Open-Meteo Air Quality & Geocoding API with CPCB India AQI breakpoints.
      </p>
    </section>
  );
}

// Level-aware tips: tone = safe | caution | avoid
function getGuidance(aqi) {
  const t = aqi <= 100 ? 'safe' : aqi <= 200 ? 'caution' : 'avoid';
  const badge = { safe: '✓ Safe', caution: '! Caution', avoid: '✕ Avoid' };
  const risk = Math.max(6, Math.min(100, Math.round((aqi / 400) * 100)));
  const pick = (good, mid, bad) => (t === 'safe' ? good : t === 'caution' ? mid : bad);
  return [
    { icon: '🏃', title: 'Outdoor Activities', tone: t, badge: badge[t], risk,
      text: aqi <= 50 ? 'Ideal for running, cycling and outdoor sports.' : pick('Good for walks and moderate workouts.', 'Sensitive groups should cut back heavy outdoor workouts.', 'Skip outdoor cardio and move your workout indoors.') },
    { icon: '🪟', title: 'Indoor Ventilation', tone: t, badge: pick('Open windows', 'Limit airing', 'Keep closed'), risk,
      text: pick('Open windows for fresh cross-ventilation.', 'Air out rooms early morning; close them during peak traffic.', 'Keep windows shut and seal gaps around doors.') },
    { icon: '😷', title: 'Mask Protection', tone: t, badge: pick('Optional', 'Recommended', 'Essential'), risk,
      text: pick('Masks are not needed for healthy individuals.', 'N95 masks advised for sensitive groups outdoors.', 'Wear a well-fitted N95 whenever you step out.') },
    { icon: '🌀', title: 'Air Purifier', tone: t, badge: pick('Not needed', 'Low mode', 'Run on high'), risk,
      text: pick('Natural airflow is enough today.', 'Run a HEPA purifier in bedrooms at night.', 'Keep HEPA purifiers on high in occupied rooms.') },
    { icon: '👶', title: 'Kids & Elderly', tone: t, badge: badge[t], risk,
      text: pick('Outdoor play is fine, enjoy the fresh air.', 'Shorten outdoor play; watch for coughing or wheezing.', 'Keep children and elderly indoors as much as possible.') },
    { icon: '💧', title: 'Stay Hydrated', tone: t, badge: pick('Normal', 'Drink more', 'Drink more'), risk,
      text: pick('Regular water intake is enough.', 'Extra water helps soothe throat irritation.', 'Hydrate often and rinse your eyes if they sting.') },
  ];
}

const GUIDE_GROUPS = [
  { tone: 'safe', label: 'Safe', symbol: '✓', range: '0–100', sample: 80 },
  { tone: 'caution', label: 'Caution', symbol: '!', range: '101–200', sample: 150 },
  { tone: 'avoid', label: 'Avoid', symbol: '✕', range: '201+', sample: 250 },
];
