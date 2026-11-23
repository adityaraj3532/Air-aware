import { useEffect, useState } from 'react';

// WMO weather codes → label + icon (day/night)
function describe(code, isDay) {
  if (code === 0) return { label: 'Clear', icon: isDay ? '☀️' : '🌙' };
  if (code <= 2) return { label: 'Partly cloudy', icon: isDay ? '⛅' : '☁️' };
  if (code === 3) return { label: 'Overcast', icon: '☁️' };
  if (code <= 48) return { label: 'Fog / haze', icon: '🌫️' };
  if (code <= 57) return { label: 'Drizzle', icon: '🌦️' };
  if (code <= 67) return { label: 'Rain', icon: '🌧️' };
  if (code <= 77) return { label: 'Snow', icon: '🌨️' };
  if (code <= 82) return { label: 'Showers', icon: '🌦️' };
  return { label: 'Thunderstorm', icon: '⛈️' };
}

function uvLabel(uv) {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  return 'Very high';
}

export default function WeatherCard({ location }) {
  const [wx, setWx] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!location) return undefined;
    const ctrl = new AbortController();
    (async () => {
      try {
        setError(false);
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`, { signal: ctrl.signal }).then((r) => r.json());
        const p = geo.results?.[0];
        if (!p) throw new Error('not found');
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,uv_index,weather_code,is_day&timezone=auto`;
        const d = await fetch(url, { signal: ctrl.signal }).then((r) => r.json());
        setWx(d.current);
      } catch (e) {
        if (e.name !== 'AbortError') setError(true);
      }
    })();
    return () => ctrl.abort();
  }, [location]);

  if (error) return <div className="wx-card wx-empty">Weather unavailable right now.</div>;
  if (!wx) return <div className="wx-card wx-empty">Loading weather…</div>;

  const d = describe(wx.weather_code, wx.is_day);
  return (
    <div className="wx-card">
      <div className="wx-main">
        <span className="wx-icon" aria-hidden="true">{d.icon}</span>
        <div className="wx-temp">{Math.round(wx.temperature_2m)}<sup>°C</sup></div>
        <div className="wx-cond">
          <b>{d.label}</b>
          <small>Feels like {Math.round(wx.apparent_temperature)}°C</small>
        </div>
      </div>
      <div className="wx-stats">
        <div><span aria-hidden="true">💧</span><small>Humidity</small><b>{wx.relative_humidity_2m} %</b></div>
        <div><span aria-hidden="true">🌬️</span><small>Wind speed</small><b>{wx.wind_speed_10m} km/h</b></div>
        <div><span aria-hidden="true">🔆</span><small>UV index</small><b>{Math.round(wx.uv_index)} · {uvLabel(wx.uv_index)}</b></div>
      </div>
    </div>
  );
}
