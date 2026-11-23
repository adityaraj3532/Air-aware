import { weekValues } from '../data/airQualityData.js';
import { getAqiCategory, getAqiChipClass } from '../utils/aqi.js';

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
    anchor.download = `airaware-report-${location.toLowerCase().replace(/\s+/g, '-')}.csv`;
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
            Understand how air quality changes throughout the day for <b>{data.fullLocation || location}</b>.
          </p>
        </div>
        <button className="primary" type="button" onClick={downloadReport}>
          ↓ Download air report
        </button>
      </div>

      <div className="grid insight-grid">
        <div className="card metric">
          <small>Current AQI · {location}</small>
          <strong>{data.aqi}</strong>
          <span>{data.status} · India AQI</span>
        </div>
        <div className="card metric">
          <small>Lowest forecasted hour</small>
          <strong>{lowest.time}</strong>
          <span>AQI {lowest.aqi}</span>
        </div>
        <div className="card metric">
          <small>Highest forecasted hour</small>
          <strong>{highest.time}</strong>
          <span>AQI {highest.aqi}</span>
        </div>
      </div>

      <div className="card panel" style={{ marginTop: 17 }}>
        <h2>Next 24 hours forecast trend</h2>
        <p>Hourly air quality predictions from the live meteorological model.</p>
        <div className="hour-list" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))' }}>
          {hourly.slice(0, 12).map((item, i) => (
            <div className="hour" key={i}>
              <small>{item.time}</small>
              <b>{item.aqi}</b>
              <span className={getAqiChipClass(item.aqi)}>{getAqiCategory(item.aqi)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card panel" style={{ marginTop: 17 }}>
        <h2>7-day air quality trend</h2>
        <p>Average daily air quality index projection for the upcoming week.</p>
        <div className="calendar">
          {weekly.map((item, i) => (
            <div
              key={i}
              className={`day ${item.aqi > 200 ? 'bad' : item.aqi > 100 ? 'warn' : ''}`}
            >
              {item.day}
              <b>{item.aqi}</b>
            </div>
          ))}
        </div>
      </div>

      <p className="footer-note">
        {data.isLive
          ? `Calculated using live Open-Meteo European & Indian NAQI data for ${data.fullLocation || location}.`
          : `Demonstration values for ${location}.`}
      </p>
    </section>
  );
}
