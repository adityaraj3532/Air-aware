import { weekValues } from '../data/airQualityData.js';
import { getAqiLevel } from '../utils/aqi.js';
import WeatherCard from '../components/WeatherCard.jsx';
import WeekTrend from '../components/WeekTrend.jsx';

export default function Insights({ data, location }) {
  const hourly = data?.hourly?.length ? data.hourly : [
    { time: 'Now', aqi: data.aqi },
    { time: '10 AM', aqi: 118 },
    { time: '12 PM', aqi: 136 },
    { time: '2 PM', aqi: 151 },
    { time: '4 PM', aqi: 174 },
    { time: '6 PM', aqi: 192 },
  ];
  const weekly = data?.weekly?.length ? data.weekly : weekValues;

  const lowest = hourly.reduce((best, item) => (item.aqi < best.aqi ? item : best), hourly[0]);
  const highest = hourly.reduce((best, item) => (item.aqi > best.aqi ? item : best), hourly[0]);
  const level = getAqiLevel(data.aqi);
  const peak = Math.max(...hourly.map((h) => h.aqi), 100);

  function downloadReport() {
    const csv = [
      'Location,AQI,Category,PM2.5 (ug/m3),PM10 (ug/m3),NO2 (ppb),O3 (ug/m3),SO2 (ug/m3),CO (ug/m3),Source,Timestamp',
      `"${data.fullLocation || location}",${data.aqi},"${data.status}",${data.pm25},${data.pm10},${data.no2},${data.o3 ?? 'N/A'},${data.so2 ?? 'N/A'},${data.co ?? 'N/A'},"${data.isLive ? 'Live Open-Meteo API' : 'Sample'}",${new Date().toISOString()}`,
      '',
      'Hourly Forecast (Next 24h)',
      'Hour,Predicted AQI,Predicted PM2.5 (ug/m3)',
      ...hourly.map((h) => `${h.time},${h.aqi},${h.pm25 ?? 'N/A'}`),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `breathair-report-${location.toLowerCase().replace(/\s+/g, '-')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="view active">
      <div className="head-row">
        <div>
          <p className="eyebrow">Patterns & trends</p>
          <h1>Air insights</h1>
          <p className="sub">
            Weather and air quality through the day for <b>{data.fullLocation || location}</b>.
          </p>
        </div>
        <button className="primary" type="button" onClick={downloadReport}>
          ↓ Download air report
        </button>
      </div>

      <div className="ins-hero" style={{ '--lvl': level.gaugeColor }}>
        <div className="ins-panel ins-weather">
          <span className="ins-label">Weather now</span>
          <WeatherCard location={data.location || location} />
        </div>

        <div className="ins-panel ins-air">
          <span className="ins-label">Air quality now</span>
          <div className="wx-card">
            <div className="wx-main">
              <span className="ins-aqi-ring">{data.aqi}</span>
              <div className="wx-cond">
                <b style={{ color: level.gaugeColor }}>{data.status}</b>
                <small>India AQI · {level.guide}</small>
              </div>
            </div>
            <div className="wx-stats">
              <div><span aria-hidden="true">🫁</span><small>PM2.5</small><b>{data.pm25} µg/m³</b></div>
              <div><span aria-hidden="true">🌫️</span><small>PM10</small><b>{data.pm10} µg/m³</b></div>
              <div><span aria-hidden="true">🚗</span><small>NO₂</small><b>{data.no2} µg/m³</b></div>
            </div>
          </div>
        </div>
      </div>

      <div className="ins-kpis">
        <div className="ins-kpi" style={{ '--k': getAqiLevel(lowest.aqi).gaugeColor }}>
          <span className="ins-kpi-icon" aria-hidden="true">🌿</span>
          <div><small>Cleanest hour ahead</small><b>{lowest.time}</b><span>AQI {lowest.aqi} · {getAqiLevel(lowest.aqi).category}</span></div>
        </div>
        <div className="ins-kpi" style={{ '--k': getAqiLevel(highest.aqi).gaugeColor }}>
          <span className="ins-kpi-icon" aria-hidden="true">⚠️</span>
          <div><small>Most polluted hour</small><b>{highest.time}</b><span>AQI {highest.aqi} · {getAqiLevel(highest.aqi).category}</span></div>
        </div>
      </div>

      <div className="card panel" style={{ marginTop: 17 }}>
        <div className="ins-head">
          <h2>Next 24 hours</h2>
          <small>Scroll for more →</small>
        </div>
        <div className="ins-hours">
          {hourly.map((item, i) => {
            const lvl = getAqiLevel(item.aqi);
            return (
              <div className={`ins-hour ${i === 0 ? 'now' : ''}`} key={i} style={{ '--h': lvl.gaugeColor }} title={`${item.time}: AQI ${item.aqi} · ${lvl.category}`}>
                <small>{item.time}</small>
                <div className="ins-hour-bar"><span style={{ height: `${Math.max(8, (item.aqi / peak) * 100)}%` }} /></div>
                <b>{item.aqi}</b>
                <i>{lvl.category}</i>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card panel week-card" style={{ marginTop: 17, '--lvl': level.gaugeColor }}>
        <h3>7-day air quality trend</h3>
        <WeekTrend weekly={weekly} todayAqi={data.aqi} />
      </div>

      <p className="footer-note">
        {data.isLive
          ? `Air quality and weather from live Open-Meteo data for ${data.fullLocation || location}.`
          : `Demonstration values for ${location}.`}
      </p>
    </section>
  );
}
