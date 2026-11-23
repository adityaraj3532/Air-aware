import { useState } from 'react';
import { cityData, cityNames } from '../data/airQualityData.js';
import { fetchLiveAirQuality } from '../services/airQualityService.js';

export default function Compare({ activeCity, activeLocation, activeData }) {
  const firstOther = cityNames.find((city) => city !== activeCity) || 'Delhi';
  const [compareCity, setCompareCity] = useState(firstOther);
  const [otherData, setOtherData] = useState(cityData[firstOther]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  async function compare() {
    if (compareCity.toLowerCase() === (activeData.location || activeCity).toLowerCase()) {
      setMessage('Choose a different city to compare.');
      setShowComparison(false);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const live = await fetchLiveAirQuality(compareCity);
      setOtherData(live);
      setMessage(`Comparing live conditions: ${activeData.location || activeLocation} vs ${live.location}.`);
      setShowComparison(true);
    } catch {
      // Fallback to sample data
      setOtherData(cityData[compareCity] || cityData.Delhi);
      setMessage(`Comparing ${activeData.location || activeLocation} with sample data for ${compareCity}.`);
      setShowComparison(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="view active">
      <div className="head-row">
        <div>
          <p className="eyebrow">City snapshot</p>
          <h1>Compare places</h1>
          <p className="sub">
            Compare air quality in <b>{activeData.location || activeLocation}</b> with other cities.
          </p>
        </div>
        <div className="updated">Live Multi-city Comparison</div>
      </div>
      <div className="card panel">
        <h2>Choose a city to compare</h2>
        <div className="form-row">
          <div className="field">
            <label htmlFor="compareBase">Selected location</label>
            <input id="compareBase" value={activeData.fullLocation || activeLocation} readOnly />
          </div>
          <div className="field">
            <label htmlFor="compareCity">Compare with</label>
            <select
              id="compareCity"
              value={compareCity}
              onChange={(event) => setCompareCity(event.target.value)}
            >
              {cityNames.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
          <button className="primary" type="button" onClick={compare} disabled={loading}>
            {loading ? 'Fetching...' : 'Compare'}
          </button>
        </div>
        {showComparison && otherData && (
          <table className="data-table">
            <thead>
              <tr>
                <th>City / location</th>
                <th>AQI</th>
                <th>Category</th>
                <th>PM2.5</th>
                <th>PM10</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>{activeData.location || activeLocation}</b></td>
                <td><span className="place-score">AQI {activeData.aqi}</span></td>
                <td>{activeData.status}</td>
                <td>{activeData.pm25} µg/m³</td>
                <td>{activeData.pm10} µg/m³</td>
                <td><span className="tag green">Active</span></td>
              </tr>
              <tr>
                <td><b>{otherData.location || compareCity}</b></td>
                <td><span className="place-score">AQI {otherData.aqi}</span></td>
                <td>{otherData.status}</td>
                <td>{otherData.pm25} µg/m³</td>
                <td>{otherData.pm10} µg/m³</td>
                <td><span className="tag">{otherData.isLive ? 'Live' : 'Cached'}</span></td>
              </tr>
            </tbody>
          </table>
        )}
        {message && <div className="result show">{message}</div>}
      </div>
    </section>
  );
}
