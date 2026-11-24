// Fictional sample values used only to demonstrate the AirAware interface.
// Replace this file's data with an API response when you connect a real AQI source.
export const cityData = {
  Jaipur: { aqi: 164, status: 'Moderate', pm25: 65, pm10: 110, no2: 28, msg: 'This illustrative reading is in the Moderate band. Check official updates because local conditions can change.' },
  Delhi: { aqi: 238, status: 'Poor', pm25: 104, pm10: 188, no2: 42, msg: 'This illustrative reading is in the Poor band. Check official local advisories before making outdoor activity decisions.' },
  Mumbai: { aqi: 112, status: 'Moderate', pm25: 42, pm10: 82, no2: 21, msg: 'This illustrative reading is in the Moderate band. Check current official readings for local conditions.' },
  Bengaluru: { aqi: 78, status: 'Satisfactory', pm25: 27, pm10: 54, no2: 14, msg: 'This illustrative reading is in the Satisfactory band. Continue checking official updates.' },
  Pune: { aqi: 96, status: 'Satisfactory', pm25: 34, pm10: 68, no2: 19, msg: 'This illustrative reading is in the Satisfactory band. Check official updates because local conditions can change.' },
  Ahmedabad: { aqi: 188, status: 'Moderate', pm25: 72, pm10: 126, no2: 31, msg: 'This illustrative reading is in the Moderate band. Check local advisories and current official readings.' },
  Kolkata: { aqi: 174, status: 'Moderate', pm25: 69, pm10: 118, no2: 35, msg: 'This illustrative reading is in the Moderate band. Check local advisories and current official readings.' },
  Chennai: { aqi: 88, status: 'Satisfactory', pm25: 31, pm10: 61, no2: 16, msg: 'This illustrative reading is in the Satisfactory band. Continue checking official updates.' },
  Hyderabad: { aqi: 121, status: 'Moderate', pm25: 45, pm10: 89, no2: 23, msg: 'This illustrative reading is in the Moderate band. Sensitive individuals may prefer to take it easier outdoors.' },
};

export const localLocations = {
  'jecrc university': { city: 'Jaipur', label: 'JECRC University', data: { aqi: 172, status: 'Moderate', pm25: 68, pm10: 116, no2: 30, msg: 'Illustrative campus-area reading only. Check official local data for current conditions.' } },
  'jecrc university, jaipur': { city: 'Jaipur', label: 'JECRC University, Jaipur', data: { aqi: 172, status: 'Moderate', pm25: 68, pm10: 116, no2: 30, msg: 'Illustrative campus-area reading only. Check official local data for current conditions.' } },
  'malviya nagar': { city: 'Jaipur', label: 'Malviya Nagar', data: { aqi: 151, status: 'Moderate', pm25: 59, pm10: 101, no2: 27, msg: 'Illustrative neighbourhood reading only. Check official local data for current conditions.' } },
  'vaishali nagar': { city: 'Jaipur', label: 'Vaishali Nagar', data: { aqi: 139, status: 'Moderate', pm25: 52, pm10: 94, no2: 24, msg: 'Illustrative neighbourhood reading only. Check official local data for current conditions.' } },
  mansarovar: { city: 'Jaipur', label: 'Mansarovar', data: { aqi: 158, status: 'Moderate', pm25: 62, pm10: 108, no2: 29, msg: 'Illustrative neighbourhood reading only. Check official local data for current conditions.' } },
};

export const cityNames = Object.keys(cityData);

export const hourlyValues = [
  { time: '9:30–10:30 AM', aqi: 118 },
  { time: '11:00 AM–12:00 PM', aqi: 136 },
  { time: '2:00–3:00 PM', aqi: 151 },
  { time: '5:00–6:00 PM', aqi: 192 },
];

export const weekValues = [
  { day: 'Mon', aqi: 112 }, { day: 'Tue', aqi: 126 }, { day: 'Wed', aqi: 204 },
  { day: 'Thu', aqi: 148 }, { day: 'Fri', aqi: 136 }, { day: 'Sat', aqi: 186 }, { day: 'Sun', aqi: 124 },
];
