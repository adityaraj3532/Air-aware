import { useState } from 'react';
import { hourlyValues } from '../data/airQualityData.js';

export default function Planner({ location, data }) {
  const [duration, setDuration] = useState('45');
  const [activity, setActivity] = useState('Walking');
  const [result, setResult] = useState('');

  const slots = data?.hourly?.length
    ? data.hourly.slice(0, 8)
    : hourlyValues;

  function findWindow() {
    const possibleSlots = Number(duration) >= 90 ? slots.slice(0, 4) : slots;
    const best = possibleSlots.reduce((lowest, slot) => (slot.aqi < lowest.aqi ? slot : lowest), possibleSlots[0]);

    let caution = '';
    if (best.aqi > 200) {
      caution = ' Caution: AQI is still Poor, so consider an indoor alternative.';
    } else if (best.aqi > 100) {
      caution = ' Take it easy and avoid high-intensity workouts.';
    } else {
      caution = ' Great window for your session!';
    }

    setResult(
      `Best window for ${activity.toLowerCase()} (${duration} mins): ${best.time} with predicted AQI of ${best.aqi}.${caution}`
    );
  }

  return (
    <section className="view active">
      <div className="head-row">
        <div>
          <p className="eyebrow">Plan with awareness</p>
          <h1>Outdoor time planner</h1>
          <p className="sub">
            Find the safest time window for outdoor activities near <b>{data?.fullLocation || location}</b>.
          </p>
        </div>
        <div className="updated">
          {data?.isLive ? 'Live hourly forecasting' : 'Sample forecast'}
        </div>
      </div>
      <div className="grid two-col">
        <div className="card panel">
          <h2>Plan an outdoor activity</h2>
          <p>
            Choose your planned activity duration. AirAware analyzes upcoming hourly air quality to find the cleanest air window.
          </p>
          <div className="form-row">
            <div className="field">
              <label htmlFor="duration">Duration</label>
              <select id="duration" value={duration} onChange={(event) => setDuration(event.target.value)}>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="activityType">Activity</label>
              <select id="activityType" value={activity} onChange={(event) => setActivity(event.target.value)}>
                <option>Walking</option>
                <option>Running / Jogging</option>
                <option>Cycling</option>
                <option>Outdoor sports</option>
                <option>Campus commute</option>
              </select>
            </div>
            <button className="primary" type="button" onClick={findWindow}>
              Find safest window
            </button>
          </div>
          {result && <div className="result show">{result}</div>}
        </div>
        <div className="card panel">
          <h2>Activity Recommendations</h2>
          <p>
            Strenuous workouts increase inhalation rate by up to 10×, meaning you breathe in far more particulate matter.
          </p>
          <div className="best-time">
            ✦{' '}
            <span>
              <b>Tip:</b> If AQI exceeds 150, replace high-intensity outdoor training with indoor cardio, yoga, or gym sessions.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
