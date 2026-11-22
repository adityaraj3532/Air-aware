import AqiGauge from '../components/AqiGauge.jsx';

export default function Overview({ data, location, onNavigate }) {
  return (
    <section className="view active">
      <div className="head-row">
        <div>
          <p className="eyebrow">Local air snapshot</p>
          <h1>Your air, at a glance.</h1>
          <p className="sub">A clearer picture of the air around <b>{location}</b>.</p>
        </div>
        <div className="updated">◷ &nbsp; Preview data · illustrative only</div>
      </div>

      <div className="grid hero-grid">
        <article className="card aqi-card">
          <div className="card-top">
            <h2 className="card-title">Air quality right now</h2>
            <span className="tag">SAMPLE VIEW</span>
          </div>
          <div className="aqi-main">
            <AqiGauge value={data.aqi} />
            <div>
              <p className="status">{data.status}</p>
              <p className="status-desc">{data.msg}</p>
            </div>
          </div>
          <div className="pollutants">
            <div className="pollutant"><span>PM2.5</span><strong>{data.pm25} <i className="unit">µg/m³</i></strong></div>
            <div className="pollutant"><span>PM10</span><strong>{data.pm10} <i className="unit">µg/m³</i></strong></div>
            <div className="pollutant"><span>NO₂</span><strong>{data.no2} <i className="unit">ppb</i></strong></div>
          </div>
        </article>

        <article className="card forecast-card">
          <div className="card-heading">
            <h2>Today’s air outlook</h2>
            <button className="text-link" type="button" onClick={() => onNavigate('insights')}>View insights ↗</button>
          </div>
          <p className="sub">Illustrative hourly pattern · India AQI</p>
          <svg className="chart" viewBox="0 0 480 170" preserveAspectRatio="none" role="img" aria-label="Illustrative AQI trend line">
            <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#72bda1" stopOpacity=".26" /><stop offset="1" stopColor="#72bda1" stopOpacity="0" /></linearGradient></defs>
            <line x1="16" y1="34" x2="466" y2="34" stroke="#edf2ef" />
            <line x1="16" y1="83" x2="466" y2="83" stroke="#edf2ef" />
            <line x1="16" y1="132" x2="466" y2="132" stroke="#edf2ef" />
            <path d="M16 103 C62 92 72 61 112 67 S166 96 206 86 S258 43 300 59 S357 90 388 76 S432 48 466 55 L466 150 L16 150 Z" fill="url(#area)" />
            <path d="M16 103 C62 92 72 61 112 67 S166 96 206 86 S258 43 300 59 S357 90 388 76 S432 48 466 55" fill="none" stroke="#32947c" strokeWidth="3" strokeLinecap="round" />
            {[[16,103],[112,67],[206,86],[300,59],[388,76],[466,55]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="4" fill="#32947c" />)}
          </svg>
          <div className="chart-labels"><span>Now</span><span>10 AM</span><span>12 PM</span><span>2 PM</span><span>4 PM</span><span>6 PM</span></div>
          <div className="best-time">✦ <span><b>Better window:</b> 10 AM – 12 PM in this sample forecast</span></div>
        </article>
      </div>

      <div className="section-title">
        <h2>Explore nearby air conditions</h2>
        <button className="text-link" type="button" onClick={() => onNavigate('insights')}>View air insights ↗</button>
      </div>
      <div className="grid places-grid">
        <article className="card place"><div className="place-visual" /><div className="place-name">Central Park Area <span className="place-score">AQI 92</span></div><div className="place-meta">Illustrative sample location · 2.1 km away</div></article>
        <article className="card place"><div className="place-visual" /><div className="place-name">University Zone <span className="place-score">AQI 118</span></div><div className="place-meta">Illustrative sample location · 3.4 km away</div></article>
        <article className="card place"><div className="place-visual" /><div className="place-name">Industrial Area <span className="place-score">AQI 208</span></div><div className="place-meta">Illustrative sample location · 5.8 km away</div></article>
      </div>

      <div className="alert">
        <div className="alert-icon">!</div>
        <div><strong>Air quality awareness</strong><p>This is sample information for the interface, not a current health alert. Check official local readings before making decisions.</p></div>
      </div>
      <p className="footer-note">Demo notice: All AQI values, location readings, pollutant readings and forecasts are fictional sample data. They are not live measurements or medical advice.</p>
    </section>
  );
}
