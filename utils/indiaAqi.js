// India National AQI (CPCB) calculation.
//
// - Breakpoints are treated as continuous ranges, so decimal readings that fall
//   between two published bands (e.g. PM2.5 = 30.5) are interpolated instead of
//   dropping through to 500.
// - Uses CPCB averaging periods: 24-hour for PM2.5, PM10, NO2, SO2 and 8-hour for CO, O3.
// - AQI = highest sub-index; at least 3 pollutants including one PM are required.

// [concentration upper bound, AQI upper bound] for each band; lower bound is the previous band's upper.
const BANDS = {
  pm25: { avg: 24, label: 'PM2.5', bp: [[30, 50], [60, 100], [90, 200], [120, 300], [250, 400], [500, 500]] },
  pm10: { avg: 24, label: 'PM10', bp: [[50, 50], [100, 100], [250, 200], [350, 300], [430, 400], [600, 500]] },
  no2: { avg: 24, label: 'NO₂', bp: [[40, 50], [80, 100], [180, 200], [280, 300], [400, 400], [600, 500]] },
  so2: { avg: 24, label: 'SO₂', bp: [[40, 50], [80, 100], [380, 200], [800, 300], [1600, 400], [2400, 500]] },
  co: { avg: 8, label: 'CO', bp: [[1, 50], [2, 100], [10, 200], [17, 300], [34, 400], [50, 500]] }, // mg/m³
  o3: { avg: 8, label: 'O₃', bp: [[50, 50], [100, 100], [168, 200], [208, 300], [748, 400], [1000, 500]] },
};

export function subIndex(value, key) {
  if (value == null || Number.isNaN(value) || value < 0) return null;
  let cLow = 0;
  let iLow = 0;
  for (const [cHigh, iHigh] of BANDS[key].bp) {
    if (value <= cHigh) return iLow + ((iHigh - iLow) * (value - cLow)) / (cHigh - cLow);
    cLow = cHigh;
    iLow = iHigh;
  }
  return 500;
}

// concentrations: { pm25, pm10, no2, so2, co (µg/m³ – converted to mg/m³ here), o3 }
export function indiaAqi(c) {
  const subs = {};
  for (const key of Object.keys(BANDS)) {
    const raw = key === 'co' && c.co != null ? c.co / 1000 : c[key];
    const s = subIndex(raw, key);
    if (s != null) subs[key] = s;
  }
  const keys = Object.keys(subs);
  const hasPm = 'pm25' in subs || 'pm10' in subs;
  if (keys.length < 3 || !hasPm) return { aqi: null, dominant: null, subs };
  const dominant = keys.reduce((a, b) => (subs[b] > subs[a] ? b : a));
  return { aqi: Math.max(1, Math.round(subs[dominant])), dominant: BANDS[dominant].label, subs };
}

// Average of the last `hours` values ending at index i (ignoring gaps). Needs at least 2/3 coverage like CPCB.
function trailingAvg(series, i, hours) {
  let sum = 0;
  let n = 0;
  for (let k = Math.max(0, i - hours + 1); k <= i; k += 1) {
    const v = series?.[k];
    if (v != null && !Number.isNaN(v)) { sum += v; n += 1; }
  }
  return n >= Math.ceil(hours * (2 / 3)) || n === i + 1 ? (n ? sum / n : null) : null;
}

// Map from our keys to Open-Meteo hourly field names
export const OM_FIELDS = { pm25: 'pm2_5', pm10: 'pm10', no2: 'nitrogen_dioxide', so2: 'sulphur_dioxide', co: 'carbon_monoxide', o3: 'ozone' };

// India AQI for hour index i of an Open-Meteo hourly block, using CPCB averaging periods.
export function indiaAqiAt(hourly, i) {
  const conc = {};
  for (const [key, field] of Object.entries(OM_FIELDS)) {
    conc[key] = trailingAvg(hourly?.[field], i, BANDS[key].avg);
  }
  return { ...indiaAqi(conc), conc };
}

// Index of the latest hourly slot at or before `currentTime` (ISO string in the same timezone).
export function currentIndex(times, currentTime) {
  let idx = 0;
  for (let k = 0; k < times.length; k += 1) if (times[k] <= currentTime) idx = k;
  return idx;
}
