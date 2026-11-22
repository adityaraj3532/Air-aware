export default function AqiGauge({ value }) {
  const circumference = 364.42;
  const clampedValue = Math.max(0, Math.min(500, value));
  const dashOffset = circumference * (1 - clampedValue / 500);

  return (
    <div className="gauge">
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r="58" className="track" />
        <circle
          cx="70" cy="70" r="58" className="progress"
          style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="gauge-inner">
        <span className="gauge-num">{value}</span>
        <span className="gauge-unit">INDIA AQI</span>
      </div>
    </div>
  );
}
