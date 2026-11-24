export default function AqiGauge({ value, color, label = 'INDIA AQI' }) {
  const circumference = 364.42;
  const clampedValue = Math.max(0, Math.min(500, value));
  const dashOffset = circumference * (1 - clampedValue / 500);

  return (
    <div className="gauge">
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle cx="70" cy="70" r="58" className="track" />
        <circle
          cx="70" cy="70" r="58" className="progress"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: dashOffset,
            stroke: color || undefined,
            transition: 'stroke 0.4s ease, stroke-dashoffset 0.6s ease',
          }}
        />
      </svg>
      <div className="gauge-inner">
        <span className="gauge-num">{value}</span>
        <span className="gauge-unit">{label}</span>
      </div>
    </div>
  );
}
