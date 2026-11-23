// Service to fetch real-time air quality and forecast data from Open-Meteo
import { cityData } from '../data/airQualityData.js';

const PM25_BREAKPOINTS = [
  [0, 30, 0, 50],
  [31, 60, 51, 100],
  [61, 90, 101, 200],
  [91, 120, 201, 300],
  [121, 250, 301, 400],
  [251, 500, 401, 500],
];

const PM10_BREAKPOINTS = [
  [0, 50, 0, 50],
  [51, 100, 51, 100],
  [101, 250, 101, 200],
  [251, 350, 201, 300],
  [351, 430, 301, 400],
  [431, 600, 401, 500],
];

const NO2_BREAKPOINTS = [
  [0, 40, 0, 50],
  [41, 80, 51, 100],
  [81, 180, 101, 200],
  [181, 280, 201, 300],
  [281, 400, 301, 400],
  [401, 600, 401, 500],
];

function calcSubIndex(val, breakpoints) {
  if (val == null || isNaN(val) || val <= 0) return 0;
  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (val >= cLow && val <= cHigh) {
      return ((iHigh - iLow) / (cHigh - cLow)) * (val - cLow) + iLow;
    }
  }
  return 500;
}

export function calculateIndiaAQI(pm25, pm10, no2) {
  const iPm25 = calcSubIndex(pm25, PM25_BREAKPOINTS);
  const iPm10 = calcSubIndex(pm10, PM10_BREAKPOINTS);
  const iNo2 = calcSubIndex(no2, NO2_BREAKPOINTS);
  return Math.round(Math.max(iPm25, iPm10, iNo2, 1));
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

  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide,us_aqi&hourly=pm10,pm2_5,nitrogen_dioxide,us_aqi&timezone=auto&forecast_days=7`;
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

  let calculatedAqi = calculateIndiaAQI(pm25, pm10, no2);
  if (!calculatedAqi || calculatedAqi < 1) {
    calculatedAqi = current.us_aqi || 50;
  }

  const { category } = getAqiStatus(calculatedAqi);
  const msg = getPrecautionaryGuidance(calculatedAqi);

  // Parse next 24 hours of hourly data
  const hourlyTimes = aqData.hourly?.time || [];
  const hourlyPm25 = aqData.hourly?.pm2_5 || [];
  const hourlyPm10 = aqData.hourly?.pm10 || [];
  const hourlyNo2 = aqData.hourly?.nitrogen_dioxide || [];

  const currentTimeIso = current.time;
  let currentIndex = hourlyTimes.findIndex((t) => t >= currentTimeIso);
  if (currentIndex === -1) currentIndex = 0;

  const next24 = [];
  const limit = Math.min(currentIndex + 24, hourlyTimes.length);
  for (let i = currentIndex; i < limit; i++) {
    const rawTime = hourlyTimes[i];
    const dateObj = new Date(rawTime);
    const hour = dateObj.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const timeLabel = i === currentIndex ? 'Now' : `${displayHour} ${ampm}`;

    const hPm25 = hourlyPm25[i] || pm25;
    const hPm10 = hourlyPm10[i] || pm10;
    const hNo2 = hourlyNo2[i] || no2;
    const hAqi = calculateIndiaAQI(hPm25, hPm10, hNo2);

    next24.push({
      time: timeLabel,
      fullTime: rawTime,
      aqi: hAqi,
      pm25: hPm25,
    });
  }

  // Parse 7-day daily forecast trend
  const dailyMap = {};
  for (let i = 0; i < hourlyTimes.length; i++) {
    const dateKey = hourlyTimes[i].slice(0, 10);
    if (!dailyMap[dateKey]) dailyMap[dateKey] = [];
    const hAqi = calculateIndiaAQI(hourlyPm25[i], hourlyPm10[i], hourlyNo2[i]);
    dailyMap[dateKey].push(hAqi);
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekTrend = Object.keys(dailyMap).slice(0, 7).map((dateKey) => {
    const values = dailyMap[dateKey];
    const avgAqi = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
    const dayName = daysOfWeek[new Date(dateKey).getDay()];
    return { day: dayName, aqi: avgAqi, date: dateKey };
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
