export const AQI_LEVELS = [
  {
    min: 0,
    max: 50,
    range: '0–50',
    category: 'Good',
    guide: 'Low (Dark Green)',
    colorName: 'Dark Green',
    key: 'good',
    bg: '#0f382c',
    bgGradient: 'linear-gradient(145deg, #0a2920 0%, #113f32 45%, #185a47 100%)',
    gaugeColor: '#1da463',
    accentColor: '#2ec47c',
    isDark: true,
    chipClass: 'aqi-chip chip-dark-green',
  },
  {
    min: 51,
    max: 100,
    range: '51–100',
    category: 'Satisfactory',
    guide: 'Fair (Light Green)',
    colorName: 'Light Green',
    key: 'satisfactory',
    bg: '#e8f7ee',
    bgGradient: 'linear-gradient(145deg, #f0fbf4 0%, #daf4e3 50%, #c4ebd0 100%)',
    gaugeColor: '#2da866',
    accentColor: '#1f7a4a',
    isDark: false,
    chipClass: 'aqi-chip chip-light-green',
  },
  {
    min: 101,
    max: 200,
    range: '101–200',
    category: 'Moderate',
    guide: 'Moderate (Yellow)',
    colorName: 'Yellow',
    key: 'moderate',
    bg: '#fef9e6',
    bgGradient: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
    gaugeColor: '#d97706',
    accentColor: '#b45309',
    isDark: false,
    chipClass: 'aqi-chip chip-yellow',
  },
  {
    min: 201,
    max: 300,
    range: '201–300',
    category: 'Poor',
    guide: 'Poor (Orange)',
    colorName: 'Orange',
    key: 'poor',
    bg: '#fff4ea',
    bgGradient: 'linear-gradient(145deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
    gaugeColor: '#ea580c',
    accentColor: '#c2410c',
    isDark: false,
    chipClass: 'aqi-chip chip-orange',
  },
  {
    min: 301,
    max: 400,
    range: '301–400',
    category: 'Very Poor',
    guide: 'Very poor (Light Red)',
    colorName: 'Light Red',
    key: 'very-poor',
    bg: '#fff1f2',
    bgGradient: 'linear-gradient(145deg, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%)',
    gaugeColor: '#e11d48',
    accentColor: '#be123c',
    isDark: false,
    chipClass: 'aqi-chip chip-light-red',
  },
  {
    min: 401,
    max: 500,
    range: '401–500',
    category: 'Severe',
    guide: 'Severe (Dark Red)',
    colorName: 'Dark Red',
    key: 'severe',
    bg: '#450a0a',
    bgGradient: 'linear-gradient(145deg, #2b0404 0%, #450a0a 45%, #621010 100%)',
    gaugeColor: '#b91c1c',
    accentColor: '#f87171',
    isDark: true,
    chipClass: 'aqi-chip chip-dark-red',
  },
];

export function getAqiLevel(aqi) {
  const val = Number(aqi) || 0;
  if (val <= 50) return AQI_LEVELS[0];
  if (val <= 100) return AQI_LEVELS[1];
  if (val <= 200) return AQI_LEVELS[2];
  if (val <= 300) return AQI_LEVELS[3];
  if (val <= 400) return AQI_LEVELS[4];
  return AQI_LEVELS[5];
}

export function getAqiCategory(aqi) {
  return getAqiLevel(aqi).category;
}

export function getInitials(name = 'Guest User') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
}

export function getAqiChipClass(aqi) {
  return getAqiLevel(aqi).chipClass;
}

// ---- US EPA AQI ----
const US_PM25 = [[0, 9, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 325.4, 301, 500]];
const US_PM10 = [[0, 54, 0, 50], [55, 154, 51, 100], [155, 254, 101, 150], [255, 354, 151, 200], [355, 424, 201, 300], [425, 604, 301, 500]];

function usSub(c, table) {
  const v = Number(c);
  if (!Number.isFinite(v) || v < 0) return 0;
  const row = table.find(([lo, hi]) => v <= hi) || table[table.length - 1];
  const [lo, hi, iLo, iHi] = row;
  return Math.round(((iHi - iLo) / (hi - lo)) * (Math.min(v, hi) - lo) + iLo);
}

export function calculateUsAqi(pm25, pm10) {
  return Math.max(usSub(pm25, US_PM25), usSub(pm10, US_PM10));
}

const US_LEVELS = [
  [50, 'Good', '#00b050'],
  [100, 'Moderate', '#d4a800'],
  [150, 'Unhealthy for Sensitive Groups', '#ff7e00'],
  [200, 'Unhealthy', '#e60000'],
  [300, 'Very Unhealthy', '#8f3f97'],
  [Infinity, 'Hazardous', '#7e0023'],
];

export function getUsAqiLevel(aqi) {
  const [, category, color] = US_LEVELS.find(([max]) => aqi <= max);
  return { category, color };
}
