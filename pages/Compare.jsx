import { useState } from 'react';
import { cityData, cityNames } from '../data/airQualityData.js';

export default function Compare({ activeCity, activeLocation, activeData }) {
  const firstOther = cityNames.find((city) => city !== activeCity) || 'Delhi';
  const [compareCity, setCompareCity] = useState(firstOther);
  const [message, setMessage] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  function compare() {
    if (compareCity === activeCity) {
      setMessage('Choose a different city to compare.');
      setShowComparison(false);
      return;
    }
    setMessage('These are fictional sample values. Do not use this comparison to decide where to travel.');
    setShowComparison(true);
  }

  const otherData = cityData[compareCity];
  return (
    <section className="view active">
      <div className="head-row"><div><p className="eyebrow">City snapshot</p><h1>Compare places</h1><p className="sub">Compare the selected location with another city using fictional demo values.</p></div><div className="updated">India AQI categories</div></div>
      <div className="card panel">
        <h2>Choose a city to compare</h2>
        <div className="form-row">
          <div className="field"><label htmlFor="compareBase">Selected location</label><input id="compareBase" value={activeLocation} readOnly /></div>
          <div className="field"><label htmlFor="compareCity">Compare with</label><select id="compareCity" value={compareCity} onChange={(event) => setCompareCity(event.target.value)}>{cityNames.map((city) => <option key={city}>{city}</option>)}</select></div>
          <button className="primary" type="button" onClick={compare}>Compare</button>
        </div>
        {showComparison && <table className="data-table"><thead><tr><th>City / location</th><th>Sample AQI</th><th>Category</th><th>PM2.5</th></tr></thead><tbody>
          <tr><td><b>{activeLocation}</b></td><td>{activeData.aqi}</td><td>{activeData.status}</td><td>{activeData.pm25} µg/m³</td></tr>
          <tr><td><b>{compareCity}</b></td><td>{otherData.aqi}</td><td>{otherData.status}</td><td>{otherData.pm25} µg/m³</td></tr>
        </tbody></table>}
        {message && <div className="result show">{message}</div>}
      </div>
    </section>
  );
}
