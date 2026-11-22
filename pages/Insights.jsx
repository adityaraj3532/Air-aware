import { weekValues } from '../data/airQualityData.js';
import { getAqiCategory, getAqiChipClass } from '../utils/aqi.js';

export default function Insights({ data, location }) {
  const hourly = [
    { time: 'Now', aqi: data.aqi }, { time: '10 AM', aqi: 118 }, { time: '12 PM', aqi: 136 },
    { time: '2 PM', aqi: 151 }, { time: '4 PM', aqi: 174 }, { time: '6 PM', aqi: 192 },
  ];
  const lowest = hourly.reduce((best, item) => item.aqi < best.aqi ? item : best);
  const highest = hourly.reduce((best, item) => item.aqi > best.aqi ? item : best);

  function downloadReport() {
    const csv = [
      'Location,Sample AQI,Category,PM2.5 (ug/m3),PM10 (ug/m3),NO2 (ppb)',
      `${location},${data.aqi},${data.status},${data.pm25},${data.pm10},${data.no2}`,
      'NOTE,Illustrative demo values only,,,,',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'airaware-sample-report.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="view active">
      <div className="head-row"><div><p className="eyebrow">Patterns & trends</p><h1>Air insights</h1><p className="sub">Understand how air quality changes throughout the day.</p></div><button className="primary" type="button" onClick={downloadReport}>↓ Download sample report</button></div>
      <div className="grid insight-grid">
        <div className="card metric"><small>Sample current AQI · {location}</small><strong>{data.aqi}</strong><span>Illustrative India AQI</span></div>
        <div className="card metric"><small>Lowest sample hour</small><strong>{lowest.time}</strong><span>AQI {lowest.aqi}</span></div>
        <div className="card metric"><small>Highest sample hour</small><strong>{highest.time}</strong><span>AQI {highest.aqi}</span></div>
      </div>
      <div className="card panel" style={{ marginTop: 17 }}>
        <h2>Next 24 hours · illustrative forecast</h2>
        <p>Example hourly estimates. These are not a predictive model or real forecast.</p>
        <div className="hour-list">{hourly.map((item) => <div className="hour" key={item.time}><small>{item.time}</small><b>{item.aqi}</b><span className={getAqiChipClass(item.aqi)}>{getAqiCategory(item.aqi)}</span></div>)}</div>
      </div>
      <div className="card panel" style={{ marginTop: 17 }}>
        <h2>Sample pollution calendar</h2>
        <p>Illustrative daily averages for a sample week.</p>
        <div className="calendar">{weekValues.map((item) => <div key={item.day} className={`day ${item.aqi > 200 ? 'bad' : item.aqi > 180 ? 'warn' : ''}`}>{item.day}<b>{item.aqi}</b></div>)}</div>
      </div>
      <p className="footer-note">The forecast and calendar are hard-coded demonstration values. They are not predictions for {location}.</p>
    </section>
  );
}
