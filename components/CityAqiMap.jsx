import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAqiLevel } from '../utils/aqi.js';
import { calculateIndiaAQI } from '../services/airQualityService.js';

// Sample points around the city. The Open-Meteo (CAMS) air-quality model for India has
// grid cells roughly 40 km wide, so points closer than that return identical values.
// We sample points ~6 km apart in a ~25 km area around the city centre.
const STEPS = [-2, -1, 0, 1, 2];
const SPACING = 0.055;
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
    // Esri dark gray basemap + labels (no API key; OSM's own tile server throttles apps)
    const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/';
    L.tileLayer(`${esri}World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
      maxZoom: 16,
      className: 'city-map-tiles',
      attribution: 'Tiles © Esri · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.tileLayer(`${esri}World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16 }).addTo(map);
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
        map.setView([lat, lon], 11, { animate: false });

        const pts = [];
        for (const a of STEPS) for (const b of STEPS) pts.push([lat + (a + (a || b ? jitter(a, b, 1) : 0)) * SPACING, lon + (b + (a || b ? jitter(a, b, 2) : 0)) * SPACING * 1.15]);
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${pts.map((p) => p[0].toFixed(4)).join(',')}&longitude=${pts.map((p) => p[1].toFixed(4)).join(',')}&current=pm2_5,pm10,nitrogen_dioxide,us_aqi`;
        let rows = await getJson(url);
        if (!Array.isArray(rows)) rows = [rows];
        if (cancelled) return;

        const layer = layerRef.current;
        layer.clearLayers();
        const values = [];
        const seen = new Set();
        const centreIdx = Math.floor(pts.length / 2);
        // centre first so the city's own cell is always shown
        const order = [centreIdx, ...rows.map((_, i) => i).filter((i) => i !== centreIdx)];
        order.forEach((i) => {
          const r = rows[i];
          const c = r.current || {};
          const cellKey = `${c.pm2_5}|${c.pm10}|${c.nitrogen_dioxide}`;
          seen.add(cellKey);
          let aqi = calculateIndiaAQI(c.pm2_5 || 0, c.pm10 || 0, c.nitrogen_dioxide || 0);
          if (!aqi || aqi < 1) aqi = Math.round(c.us_aqi || 0);
          if (!aqi) return;
          values.push(aqi);
          const level = getAqiLevel(aqi);
          const isCentre = i === centreIdx;
          const icon = L.divIcon({
            className: 'city-aqi-pin',
            html: `<span class="${isCentre ? 'centre' : ''}" style="--pin:${level.gaugeColor}">${aqi}</span>`,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          });
          L.marker(pts[i], { icon, title: `AQI ${aqi} · ${level.category}`, zIndexOffset: isCentre ? 1000 : 0 })
            .bindPopup(`<b>AQI ${aqi}</b> · ${level.category}<br><small>${isCentre ? place.name + ' centre' : 'Nearby point'} · PM2.5 ${Math.round(c.pm2_5 || 0)} µg/m³</small>`)
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
          <h2>Regional AQI Map</h2>
          <p className="sub">Live model readings at points about 6 km apart across a ~25 km area around {state.place || city || 'your city'}. Nearby points can share a value because the air-quality model works on a coarser grid. Click the map (or hold Ctrl) to zoom.</p>
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
