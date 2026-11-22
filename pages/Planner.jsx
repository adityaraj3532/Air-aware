import { useState } from 'react';
import { hourlyValues } from '../data/airQualityData.js';

export default function Planner({ location }) {
  const [duration, setDuration] = useState('45');
  const [activity, setActivity] = useState('Walking');
  const [result, setResult] = useState('');

  function findWindow() {
    const possibleSlots = Number(duration) >= 90 ? hourlyValues.slice(0, 3) : hourlyValues;
    const best = possibleSlots.reduce((lowest, slot) => slot.aqi < lowest.aqi ? slot : lowest);
    setResult(`Comparatively lower sample AQI: ${best.time} · AQI ${best.aqi}. This is a demo suggestion for ${activity.toLowerCase()} near ${location} (${duration} minutes), not a safety guarantee.`);
  }

  return (
    <section className="view active">
      <div className="head-row"><div><p className="eyebrow">Plan with awareness</p><h1>Outdoor time planner</h1><p className="sub">Explore a sample forecast and find a comparatively better time window.</p></div><div className="updated">Sample forecast · Not live</div></div>
      <div className="grid two-col">
        <div className="card panel">
          <h2>Plan an outdoor activity</h2>
          <p>Choose how long you plan to be outside. AirAware will compare illustrative hourly values for your selected location.</p>
          <div className="form-row">
            <div className="field"><label htmlFor="duration">Duration</label><select id="duration" value={duration} onChange={(event) => setDuration(event.target.value)}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option><option value="90">90 minutes</option></select></div>
            <div className="field"><label htmlFor="activityType">Activity</label><select id="activityType" value={activity} onChange={(event) => setActivity(event.target.value)}><option>Walking</option><option>Cycling</option><option>Outdoor sports</option><option>Campus commute</option></select></div>
            <button className="primary" type="button" onClick={findWindow}>Find a better window</button>
          </div>
          {result && <div className="result show">{result}</div>}
        </div>
        <div className="card panel">
          <h2>How this works</h2>
          <p>The preview compares a few sample time slots and selects the lowest illustrative AQI. It does not assess personal health or guarantee that outdoor air is safe.</p>
          <div className="best-time">✦ <span>Always check current official readings and local advisories before planning strenuous activity.</span></div>
        </div>
      </div>
    </section>
  );
}
