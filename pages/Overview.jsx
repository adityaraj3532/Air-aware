import AqiGauge from '../components/AqiGauge.jsx';
import IndiaAirMap from '../components/IndiaAirMap.jsx';
import { getAqiLevel } from '../utils/aqi.js';

export default function Overview({ data, location, onNavigate, onSelectCity }) {
  const aqiLevel = getAqiLevel(data.aqi);

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
              <p className="status" style={{ color: aqiLevel.gaugeColor }}>{data.status}</p>
              <p className="status-desc">{data.msg}</p>
            </div>
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

      <IndiaAirMap
        currentCity={data.location || location}
        currentAqi={data.aqi}
        onSelectCity={onSelectCity || onNavigate}
      />

      <div className="section-title">
        <h2>Precautionary guidance & recommendations</h2>
      </div>

      <div className="alert">
        <div className="alert-icon" style={{ background: aqiLevel.chipClass.includes('dark-green') || aqiLevel.chipClass.includes('dark-red') ? aqiLevel.gaugeColor : undefined, color: aqiLevel.isDark ? '#fff' : undefined }}>!</div>
        <div>
          <strong>Health Advisory for {data.status} AQI ({aqiLevel.guide})</strong>
          <p>{data.msg}</p>
        </div>
      </div>

      <div className="grid places-grid" style={{ marginTop: 16 }}>
        <article className="card place">
          <div className="place-visual" />
          <div className="place-name">Outdoor Activities</div>
          <div className="place-meta">
            {data.aqi <= 50
              ? 'Ideal for all outdoor activities, running, and sports.'
              : data.aqi <= 100
              ? 'Good conditions for walking and moderate workouts.'
              : data.aqi <= 200
              ? 'Sensitive groups should reduce heavy outdoor workouts.'
              : 'Avoid heavy cardio outdoors. Prefer indoor workouts.'}
          </div>
        </article>
        <article className="card place">
          <div className="place-visual" />
          <div className="place-name">Indoor Ventilation</div>
          <div className="place-meta">
            {data.aqi <= 100
              ? 'Safe to open windows for fresh natural cross-ventilation.'
              : 'Keep windows closed during peak traffic hours; run air purifiers.'}
          </div>
        </article>
        <article className="card place">
          <div className="place-visual" />
          <div className="place-name">Mask Protection</div>
          <div className="place-meta">
            {data.aqi <= 100
              ? 'Masks not generally required for healthy individuals.'
              : data.aqi <= 200
              ? 'N95 masks recommended for sensitive groups outdoors.'
              : 'N95 or particulate masks strongly recommended outdoors.'}
          </div>
        </article>
      </div>

      <p className="footer-note">
        Data powered by Open-Meteo Air Quality & Geocoding API with CPCB India AQI breakpoints.
      </p>
    </section>
  );
}
