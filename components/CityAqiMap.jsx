import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAqiLevel } from '../utils/aqi.js';
import { indiaAqiAt, currentIndex } from '../utils/indiaAqi.js';

// Grid of sample points around the city centre (5 x 5, ~13 km each side)
const STEPS = [-3, -2, -1, 0, 1, 2, 3];
const SPACING = 0.03;
// Deterministic jitter so points look like scattered stations, not a rigid grid
const jitter = (a, b, k) => (Math.sin(a * 12.9898 + b * 78.233 + k) * 43758.5453 % 1) * 0.45;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

export default function CityAqiMap({ city }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [state, setState] = useState({ status: 'idle', place: '', stats: null });

  // Create the map once
  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: false, scrollWheelZoom: false, worldCopyJump: true })
      .setView([22.5, 79], 4);
    L.control.zoom({ position: 'topright' }).addTo(map);
    // OpenStreetMap streets, darkened with a CSS filter so roads stand out (no API key needed)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'city-map-tiles',
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    // Page scroll passes over the map; wheel-zoom only after clicking into it (or with Ctrl held)
    map.on('click focus', () => map.scrollWheelZoom.enable());
    map.on('mouseout blur', () => map.scrollWheelZoom.disable());
    const el = elRef.current;
    const ctrlZoom = (e) => {
      if (!e.ctrlKey || map.scrollWheelZoom.enabled()) return;
      e.preventDefault();
      map.setZoom(map.getZoom() + (e.deltaY < 0 ? 1 : -1));
    };
    el.addEventListener('wheel', ctrlZoom, { passive: false });
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(elRef.current);
    return () => { ro.disconnect(); el.removeEventListener('wheel', ctrlZoom); map.remove(); };
  }, []);

  // Whenever the searched city changes: geocode, fly there, plot AQI bubbles
  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, status: 'loading' }));
      try {
        const geo = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const place = geo.results?.[0];
        if (!place) throw new Error('not found');
        const { latitude: lat, longitude: lon } = place;
        if (cancelled) return;
        const map = mapRef.current;
        map.invalidateSize();
        map.setView([lat, lon], 12, { animate: false });

        const pts = [];
        for (const a of STEPS) for (const b of STEPS) pts.push([lat + (a + (a || b ? jitter(a, b, 1) : 0)) * SPACING, lon + (b + (a || b ? jitter(a, b, 2) : 0)) * SPACING * 1.15]);
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${pts.map((p) => p[0].toFixed(4)).join(',')}&longitude=${pts.map((p) => p[1].toFixed(4)).join(',')}&current=pm2_5&hourly=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone&past_days=1&forecast_days=1&timezone=auto`;
        let rows = await getJson(url);
        if (!Array.isArray(rows)) rows = [rows];
        if (cancelled) return;

        const layer = layerRef.current;
        layer.clearLayers();
        const values = [];
        rows.forEach((r, i) => {
          // Same CPCB method as the main card: 24h / 8h trailing averages ending now
          const idx = currentIndex(r.hourly?.time || [], r.current?.time || '');
          const calc = indiaAqiAt(r.hourly, idx);
          const aqi = calc.aqi;
          const c = { pm2_5: calc.conc.pm25 };
          if (!aqi) return;
          values.push(aqi);
          const level = getAqiLevel(aqi);
          const isCentre = i === Math.floor(pts.length / 2);
          const icon = L.divIcon({
            className: 'city-aqi-pin',
            html: `<span class="${isCentre ? 'centre' : ''}" style="--pin:${level.gaugeColor}">${aqi}</span>`,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          });
          L.marker(pts[i], { icon, title: `AQI ${aqi} · ${level.category}`, zIndexOffset: isCentre ? 1000 : 0 })
            .bindPopup(`<b>AQI ${aqi}</b> · ${level.category}<br><small>${isCentre ? place.name + ' centre' : 'Nearby area'} · 24h PM2.5 ${Math.round(c.pm2_5 || 0)} µg/m³ · main: ${calc.dominant}</small>`)
            .addTo(layer);
        });
        if (!values.length) throw new Error('no data');
        setState({
          status: 'ready',
          place: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
          stats: {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
            count: values.length,
          },
        });
      } catch {
        if (!cancelled) setState({ status: 'error', place: city, stats: null });
      }
    })();
    return () => { cancelled = true; };
  }, [city]);

  const avgLevel = state.stats ? getAqiLevel(state.stats.avg) : null;

  return (
    <div className="card city-map-card">
      <div className="city-map-head">
        <div>
          <h2>Neighbourhood AQI Map</h2>
          <p className="sub">Live readings across a ~20 km area around {state.place || city || 'your city'}. Click the map (or hold Ctrl) to zoom with the scroll wheel.</p>
        </div>
        {state.stats && (
          <div className="city-map-stats">
            <span>Avg <b style={{ color: avgLevel.gaugeColor }}>{state.stats.avg}</b></span>
            <span>Range <b>{state.stats.min}–{state.stats.max}</b></span>
            <span className={avgLevel.chipClass}>{avgLevel.category}</span>
          </div>
        )}
      </div>
      <div className="city-map-wrap">
        <div ref={elRef} className="city-map" />
        {state.status === 'loading' && <div className="city-map-overlay">Loading air quality around {city}…</div>}
        {state.status === 'error' && <div className="city-map-overlay">Couldn't load map data for {city}. Try another search.</div>}
      </div>
    </div>
  );
}
