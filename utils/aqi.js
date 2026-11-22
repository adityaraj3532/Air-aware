export function getAqiCategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function getInitials(name = 'Guest User') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
}

export function getAqiChipClass(aqi) {
  if (aqi <= 100) return 'aqi-chip good';
  if (aqi > 200) return 'aqi-chip poor';
  return 'aqi-chip';
}
