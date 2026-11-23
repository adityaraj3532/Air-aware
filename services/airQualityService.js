// Service to fetch real-time air quality and forecast data from Open-Meteo
import { cityData } from '../data/airQualityData.js';
import { indiaAqi, indiaAqiAt, currentIndex } from '../utils/indiaAqi.js';

// Kept for backwards compatibility: India AQI from instantaneous PM2.5 / PM10 / NO2 (+ optional others).
export function calculateIndiaAQI(pm25, pm10, no2, so2, co, o3) {
  return indiaAqi({ pm25, pm10, no2, so2, co, o3 }).aqi || 1;
}

export function getAqiStatus(aqi) {
  if (aqi <= 50) return { category: 'Good', tagClass: 'green', chipClass: 'aqi-chip good' };
  if (aqi <= 100) return { category: 'Satisfactory', tagClass: 'green', chipClass: 'aqi-chip good' };
  if (aqi <= 200) return { category: 'Moderate', tagClass: '', chipClass: 'aqi-chip' };
  if (aqi <= 300) return { category: 'Poor', tagClass: '', chipClass: 'aqi-chip poor' };
  if (aqi <= 400) return { category: 'Very Poor', tagClass: '', chipClass: 'aqi-chip poor' };
  return { category: 'Severe', tagClass: '', chipClass: 'aqi-chip poor' };
}

export function getPrecautionaryGuidance(aqi) {
  if (aqi <= 50) {
    return 'Air quality is satisfactory and poses minimal or no health risk. Ideal conditions for all outdoor activities and natural ventilation.';
  }
  if (aqi <= 100) {
    return 'Air quality is acceptable. Sensitive individuals with chronic respiratory issues may experience minor discomfort during prolonged exertion.';
  }
  if (aqi <= 200) {
    return 'Breathing discomfort possible for children, elderly, and people with asthma or heart ailments. Consider reducing long or intense outdoor workouts.';
  }
  if (aqi <= 300) {
    return 'Unhealthy air. Prolonged exposure causes breathing discomfort. Wear an N95 mask outdoors, avoid intense cardio, and keep windows closed.';
  }
  if (aqi <= 400) {
    return 'High health alert. Significant respiratory distress possible. Sensitive groups should stay indoors; use indoor air filtration where possible.';
  }
  return 'Hazardous air conditions. Everyone should avoid outdoor physical exertion. Keep indoor air sealed and use air purifiers.';
}

export async function fetchLiveAirQuality(query) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) throw new Error('Geocoding service unavailable');
  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Could not find coordinates for "${query}".`);
  }

  const place = geoData.results[0];
  const { latitude, longitude, name, admin1, country } = place;
  const displayName = [name, admin1, country].filter(Boolean).join(', ');

  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,us_aqi&hourly=pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone&timezone=auto&past_days=1&forecast_days=7`;
  const aqRes = await fetch(aqUrl);
  if (!aqRes.ok) throw new Error('Air quality service unavailable');
  const aqData = await aqRes.json();

  const current = aqData.current || {};
  const pm25 = Math.round((current.pm2_5 || 0) * 10) / 10;
  const pm10 = Math.round((current.pm10 || 0) * 10) / 10;
  const no2 = Math.round((current.nitrogen_dioxide || 0) * 10) / 10;
  const o3 = Math.round((current.ozone || 0) * 10) / 10;
  const so2 = Math.round((current.sulphur_dioxide || 0) * 10) / 10;
  const co = Math.round((current.carbon_monoxide || 0) * 10) / 10;

  // Official CPCB method: 24h averages (PM, NO2, SO2) and 8h averages (CO, O3) ending at the current hour
  const hourly = aqData.hourly || {};
  const hourlyTimes = hourly.time || [];
  const nowIdx = currentIndex(hourlyTimes, current.time || '');
  const aqiSeries = hourlyTimes.map((_, i) => indiaAqiAt(hourly, i));
  const nowCalc = aqiSeries[nowIdx] || indiaAqi({ pm25, pm10, no2, so2, co, o3 });
  let calculatedAqi = nowCalc.aqi;
  if (!calculatedAqi) calculatedAqi = indiaAqi({ pm25, pm10, no2, so2, co, o3 }).aqi || current.us_aqi || 50;
  const dominantPollutant = nowCalc.dominant;

  const { category } = getAqiStatus(calculatedAqi);
  const msg = getPrecautionaryGuidance(calculatedAqi);

  // Next 24 hours (each hour uses the trailing averaging window)
  const next24 = [];
  const limit = Math.min(nowIdx + 24, hourlyTimes.length);
  for (let i = nowIdx; i < limit; i++) {
    const rawTime = hourlyTimes[i];
    const hour = new Date(rawTime).getHours();
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    next24.push({
      time: i === nowIdx ? 'Now' : `${displayHour} ${hour >= 12 ? 'PM' : 'AM'}`,
      fullTime: rawTime,
      aqi: aqiSeries[i]?.aqi || calculatedAqi,
      pm25: hourly.pm2_5?.[i] ?? pm25,
    });
  }

  // 7-day trend: daily mean of the hourly India AQI, from today onwards
  const today = (current.time || hourlyTimes[nowIdx] || '').slice(0, 10);
  const dailyMap = {};
  hourlyTimes.forEach((t, i) => {
    const key = t.slice(0, 10);
    if (key < today || !aqiSeries[i]?.aqi) return;
    (dailyMap[key] ||= []).push(aqiSeries[i].aqi);
  });
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekTrend = Object.keys(dailyMap).slice(0, 7).map((dateKey) => {
    const values = dailyMap[dateKey];
    return { day: daysOfWeek[new Date(dateKey).getDay()], aqi: Math.round(values.reduce((a, v) => a + v, 0) / values.length), date: dateKey };
  });

  // Calculate best outdoor window in the next 12 hours
  const upcomingSlots = next24.slice(0, 12);
  let bestSlot = upcomingSlots[0] || { time: 'Now', aqi: calculatedAqi };
  for (const slot of upcomingSlots) {
    if (slot.aqi < bestSlot.aqi) {
      bestSlot = slot;
    }
  }

  return {
    aqi: calculatedAqi,
    dominantPollutant,
    status: category,
    pm25,
    pm10,
    no2,
    o3,
    so2,
    co,
    msg,
    location: name,
    fullLocation: displayName,
    hourly: next24,
    weekly: weekTrend,
    bestSlot,
    isLive: true,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

// Fallback helper in case of network errors or offline mode
export function getFallbackData(city = 'Jaipur') {
  const fallback = cityData[city] || cityData.Jaipur;
  return {
    ...fallback,
    location: city,
    fullLocation: `${city}, India`,
    o3: 45,
    so2: 12,
    co: 410,
    hourly: [
      { time: 'Now', aqi: fallback.aqi, pm25: fallback.pm25 },
      { time: '10 AM', aqi: Math.max(20, fallback.aqi - 20), pm25: Math.max(10, fallback.pm25 - 15) },
      { time: '12 PM', aqi: Math.max(30, fallback.aqi - 10), pm25: Math.max(15, fallback.pm25 - 5) },
      { time: '2 PM', aqi: fallback.aqi + 10, pm25: fallback.pm25 + 8 },
      { time: '4 PM', aqi: fallback.aqi + 25, pm25: fallback.pm25 + 18 },
      { time: '6 PM', aqi: fallback.aqi + 35, pm25: fallback.pm25 + 25 },
    ],
    weekly: [
      { day: 'Mon', aqi: 112 },
      { day: 'Tue', aqi: 126 },
      { day: 'Wed', aqi: 204 },
      { day: 'Thu', aqi: 148 },
      { day: 'Fri', aqi: 136 },
      { day: 'Sat', aqi: 186 },
      { day: 'Sun', aqi: 124 },
    ],
    bestSlot: { time: '10 AM', aqi: Math.max(20, fallback.aqi - 20) },
    isLive: false,
    lastUpdated: 'Offline / Sample',
  };
}
