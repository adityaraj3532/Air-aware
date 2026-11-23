import { useState } from 'react';
import IndiaMapData from '@svg-maps/india';
import { getAqiLevel } from '../utils/aqi.js';

// Baseline state AQI mappings & primary cities
const STATE_AQI_DATA = {
  dl: { city: 'Delhi', aqi: 285, leaderSide: 'left' },
  rj: { city: 'Jaipur', aqi: 168, leaderSide: 'left' },
  up: { city: 'Lucknow', aqi: 245, leaderSide: 'right' },
  br: { city: 'Patna', aqi: 320, leaderSide: 'right' },
  wb: { city: 'Kolkata', aqi: 182, leaderSide: 'right' },
  mh: { city: 'Mumbai', aqi: 124, leaderSide: 'left' },
  gj: { city: 'Ahmedabad', aqi: 176, leaderSide: 'left' },
  ka: { city: 'Bengaluru', aqi: 74, leaderSide: 'left' },
  tn: { city: 'Chennai', aqi: 86, leaderSide: 'right' },
  tg: { city: 'Hyderabad', aqi: 118, leaderSide: 'right' },
  ap: { city: 'Visakhapatnam', aqi: 92, leaderSide: 'right' },
  kl: { city: 'Thiruvananthapuram', aqi: 48, leaderSide: 'left' },
  mp: { city: 'Bhopal', aqi: 145, leaderSide: 'right' },
  ct: { city: 'Raipur', aqi: 158, leaderSide: 'right' },
  jh: { city: 'Ranchi', aqi: 195, leaderSide: 'right' },
  or: { city: 'Bhubaneswar', aqi: 132, leaderSide: 'right' },
  pb: { city: 'Chandigarh', aqi: 210, leaderSide: 'right' },
  hr: { city: 'Gurugram', aqi: 265, leaderSide: 'left' },
  ch: { city: 'Chandigarh', aqi: 210, leaderSide: 'right' },
  hp: { city: 'Shimla', aqi: 42, leaderSide: 'left' },
  ut: { city: 'Dehradun', aqi: 62, leaderSide: 'left' },
  jk: { city: 'Srinagar', aqi: 38, leaderSide: 'left' },
  as: { city: 'Guwahati', aqi: 48, leaderSide: 'right' },
  ar: { city: 'Itanagar', aqi: 28, leaderSide: 'right' },
  ml: { city: 'Shillong', aqi: 42, leaderSide: 'right' },
  mn: { city: 'Imphal', aqi: 36, leaderSide: 'right' },
  mz: { city: 'Aizawl', aqi: 25, leaderSide: 'right' },
  nl: { city: 'Kohima', aqi: 32, leaderSide: 'right' },
  tr: { city: 'Agartala', aqi: 54, leaderSide: 'right' },
  sk: { city: 'Gangtok', aqi: 34, leaderSide: 'right' },
  ga: { city: 'Panaji', aqi: 52, leaderSide: 'left' },
  py: { city: 'Puducherry', aqi: 68, leaderSide: 'right' },
  an: { city: 'Port Blair', aqi: 22, leaderSide: 'right' },
  ld: { city: 'Kavaratti', aqi: 24, leaderSide: 'left' },
  dn: { city: 'Silvassa', aqi: 112, leaderSide: 'left' },
  dd: { city: 'Daman', aqi: 108, leaderSide: 'left' },
};

// Prominent city pins with coordinates matching @svg-maps/india (viewBox 0 0 612 696)
const CITY_PINS = [
  { name: 'Srinagar', state: 'Jammu & Kashmir', stateId: 'jk', x: 165, y: 78, labelX: 85, labelY: 78 },
  { name: 'Chandigarh', state: 'Punjab / Haryana', stateId: 'ch', x: 180, y: 162, labelX: 255, labelY: 162 },
  { name: 'Dehradun', state: 'Uttarakhand', stateId: 'ut', x: 218, y: 175, labelX: 75, labelY: 175 },
  { name: 'Delhi', state: 'Delhi NCR', stateId: 'dl', x: 188, y: 208, labelX: 95, labelY: 208 },
  { name: 'Jaipur', state: 'Rajasthan', stateId: 'rj', x: 142, y: 246, labelX: 60, labelY: 246 },
  { name: 'Lucknow', state: 'Uttar Pradesh', stateId: 'up', x: 275, y: 240, labelX: 350, labelY: 232 },
  { name: 'Patna', state: 'Bihar', stateId: 'br', x: 372, y: 268, labelX: 435, labelY: 255 },
  { name: 'Ranchi', state: 'Jharkhand', stateId: 'jh', x: 366, y: 327, labelX: 435, labelY: 320 },
  { name: 'Kolkata', state: 'West Bengal', stateId: 'wb', x: 418, y: 340, labelX: 485, labelY: 335 },
  { name: 'Gangtok', state: 'Sikkim', stateId: 'sk', x: 425, y: 232, labelX: 485, labelY: 220 },
  { name: 'Guwahati', state: 'Assam', stateId: 'as', x: 508, y: 265, labelX: 565, labelY: 265 },
  { name: 'Itanagar', state: 'Arunachal Pradesh', stateId: 'ar', x: 550, y: 222, labelX: 585, labelY: 200 },
  { name: 'Shillong', state: 'Meghalaya', stateId: 'ml', x: 486, y: 285, labelX: 550, labelY: 295 },
  { name: 'Agartala', state: 'Tripura', stateId: 'tr', x: 488, y: 332, labelX: 550, labelY: 340 },
  { name: 'Imphal', state: 'Manipur', stateId: 'mn', x: 542, y: 300, labelX: 585, labelY: 310 },
  { name: 'Bhubaneswar', state: 'Odisha', stateId: 'or', x: 352, y: 395, labelX: 425, labelY: 410 },
  { name: 'Raipur', state: 'Chhattisgarh', stateId: 'ct', x: 296, y: 385, labelX: 360, labelY: 380 },
  { name: 'Bhopal', state: 'Madhya Pradesh', stateId: 'mp', x: 214, y: 320, labelX: 135, labelY: 320 },
  { name: 'Ahmedabad', state: 'Gujarat', stateId: 'gj', x: 78, y: 340, labelX: 18, labelY: 340 },
  { name: 'Mumbai', state: 'Maharashtra', stateId: 'mh', x: 108, y: 438, labelX: 25, labelY: 438 },
  { name: 'Hyderabad', state: 'Telangana', stateId: 'tg', x: 237, y: 455, labelX: 155, labelY: 465 },
  { name: 'Panaji', state: 'Goa', stateId: 'ga', x: 122, y: 512, labelX: 45, labelY: 512 },
  { name: 'Bengaluru', state: 'Karnataka', stateId: 'ka', x: 185, y: 545, labelX: 95, labelY: 550 },
  { name: 'Chennai', state: 'Tamil Nadu', stateId: 'tn', x: 258, y: 565, labelX: 330, labelY: 565 },
  { name: 'Thiruvananthapuram', state: 'Kerala', stateId: 'kl', x: 172, y: 638, labelX: 70, labelY: 642 },
];

export default function IndiaAirMap({ currentCity, onSelectCity, currentAqi }) {
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Compute live AQI for each state
  function getStateAqi(stateId, stateName) {
    const meta = STATE_AQI_DATA[stateId];
    if (!meta) return 100;
    if (
      currentCity &&
      (meta.city.toLowerCase() === currentCity.toLowerCase() ||
        stateName.toLowerCase().includes(currentCity.toLowerCase()) ||
        currentCity.toLowerCase().includes(stateName.toLowerCase()))
    ) {
      return currentAqi || meta.aqi;
    }
    return meta.aqi;
  }

  // Find if current city matches a state
  const selectedState = IndiaMapData.locations.find((loc) => {
    const meta = STATE_AQI_DATA[loc.id];
    if (!meta || !currentCity) return false;
    return (
      meta.city.toLowerCase() === currentCity.toLowerCase() ||
      loc.name.toLowerCase().includes(currentCity.toLowerCase()) ||
      currentCity.toLowerCase().includes(loc.name.toLowerCase())
    );
  });

  // Filtered state list for ranking panel
  const statesWithData = IndiaMapData.locations.map((loc) => {
    const meta = STATE_AQI_DATA[loc.id] || { city: loc.name, aqi: 100 };
    const aqi = getStateAqi(loc.id, loc.name);
    const level = getAqiLevel(aqi);
    return {
      id: loc.id,
      name: loc.name,
      city: meta.city,
      aqi,
      level,
    };
  });

  const sortedStates = [...statesWithData].sort((a, b) => b.aqi - a.aqi);

  const displayList = activeTab === 'all'
    ? sortedStates
    : activeTab === 'cleanest'
    ? [...sortedStates].reverse().slice(0, 10)
    : sortedStates.slice(0, 10);

  return (
    <div className="card india-map-card" style={{ padding: '26px 28px', marginTop: '22px' }}>
      {/* Header and AQI Range Color Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 800 }}>
              National Air Quality Map · India
            </h2>
            <span className="tag green" style={{ fontSize: '10px' }}>OFFICIAL STATE BOUNDARIES</span>
          </div>
          <p className="sub" style={{ margin: '5px 0 0', fontSize: '12px' }}>
            Interactive state-by-state political map. Each state border is color-coded according to the official India AQI categories.
          </p>
        </div>

        {/* Color Palette Legend */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', marginRight: '4px' }}>Range Guide:</span>
          <span className="aqi-chip chip-dark-green" style={{ fontSize: '10px', padding: '4px 8px' }}>0–50 Good (Dark Green)</span>
          <span className="aqi-chip chip-light-green" style={{ fontSize: '10px', padding: '4px 8px' }}>51–100 Fair (Light Green)</span>
          <span className="aqi-chip chip-yellow" style={{ fontSize: '10px', padding: '4px 8px' }}>101–200 Moderate (Yellow)</span>
          <span className="aqi-chip chip-orange" style={{ fontSize: '10px', padding: '4px 8px' }}>201–300 Poor (Orange)</span>
          <span className="aqi-chip chip-light-red" style={{ fontSize: '10px', padding: '4px 8px' }}>301–400 Very Poor (Light Red)</span>
          <span className="aqi-chip chip-dark-red" style={{ fontSize: '10px', padding: '4px 8px' }}>401–500 Severe (Dark Red)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.35fr) 1fr', gap: '26px', alignItems: 'start' }}>
        {/* Interactive SVG Political Map with Clear Borders */}
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #e8f0ee 0%, #d8e8e2 100%)',
            borderRadius: '18px',
            padding: '16px 12px',
            border: '1.5px solid var(--line)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08), inset 0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <svg
            viewBox="0 0 612 696"
            style={{ width: '100%', height: 'auto', maxHeight: '560px', display: 'block', margin: '0 auto' }}
            aria-label="Map of Indian States with clear boundaries and AQI colors"
          >
            <defs>
              <filter id="mapOuterGlow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.18" floodColor="#000" />
              </filter>
            </defs>

            {/* Ocean/sea background for geographic context */}
            <rect x="0" y="0" width="612" height="696" fill="#c8dfe8" rx="12" />

            {/* Render all 36 Individual State & Union Territory Polygons with Clear Borders */}
            <g id="states-layer" filter="url(#mapOuterGlow)">
              {IndiaMapData.locations.map((location) => {
                const aqi = getStateAqi(location.id, location.name);
                const level = getAqiLevel(aqi);
                const isSelected = selectedState?.id === location.id;
                const isHovered = hoveredLocation?.id === location.id;

                // Color fill matching the AQI table
                const fillColor = level.gaugeColor;

                return (
                  <path
                    key={location.id}
                    id={location.id}
                    d={location.path}
                    fill={fillColor}
                    fillOpacity={isSelected ? 1 : isHovered ? 0.95 : 0.88}
                    stroke={isSelected ? '#1a1a1a' : isHovered ? '#333333' : '#4a4a4a'}
                    strokeWidth={isSelected ? 2.8 : isHovered ? 2.2 : 1.6}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{
                      cursor: 'pointer',
                      transition: 'fill-opacity 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease',
                      filter: isSelected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.35))' : 'none',
                    }}
                    onMouseEnter={() => {
                      const meta = STATE_AQI_DATA[location.id] || { city: location.name, aqi };
                      setHoveredLocation({ ...location, aqi, level, city: meta.city });
                    }}
                    onMouseLeave={() => setHoveredLocation(null)}
                    onClick={() => {
                      const meta = STATE_AQI_DATA[location.id];
                      onSelectCity(meta?.city || location.name);
                    }}
                  />
                );
              })}
            </g>

            {/* City Pins with Leader Lines & Labels matching the reference image */}
            <g id="city-pins-layer">
              {CITY_PINS.map((pin) => {
                const isSelectedCity = currentCity && pin.name.toLowerCase() === currentCity.toLowerCase();
                const aqi = getStateAqi(pin.stateId, pin.state);
                const level = getAqiLevel(aqi);

                return (
                  <g
                    key={pin.name}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectCity(pin.name)}
                  >
                    {/* Leader Line to city label */}
                    <line
                      x1={pin.x}
                      y1={pin.y}
                      x2={pin.labelX}
                      y2={pin.labelY}
                      stroke={isSelectedCity ? '#111827' : '#94a3b8'}
                      strokeWidth={isSelectedCity ? 1.5 : 0.8}
                      strokeDasharray={isSelectedCity ? undefined : '2,2'}
                      opacity={0.85}
                    />

                    {/* Outer Pin Halo */}
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r={isSelectedCity ? 7 : 4.5}
                      fill="#ffffff"
                      stroke={isSelectedCity ? '#000000' : '#475569'}
                      strokeWidth={1.5}
                    />
                    {/* Inner Colored Dot */}
                    <circle
                      cx={pin.x}
                      cy={pin.y}
                      r={isSelectedCity ? 4 : 2.5}
                      fill={level.gaugeColor}
                    />

                    {/* City Label Box */}
                    <text
                      x={pin.labelX}
                      y={pin.labelY - 3}
                      textAnchor={pin.labelX < pin.x ? 'end' : 'start'}
                      fontSize={isSelectedCity ? '11px' : '9.5px'}
                      fontWeight={isSelectedCity ? 850 : 700}
                      fill={isSelectedCity ? '#0f172a' : '#1e293b'}
                    >
                      {pin.name}
                    </text>
                    <text
                      x={pin.labelX}
                      y={pin.labelY + 8}
                      textAnchor={pin.labelX < pin.x ? 'end' : 'start'}
                      fontSize="8px"
                      fontWeight="600"
                      fill={level.gaugeColor}
                    >
                      AQI {aqi}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Hover Card with state details */}
          {hoveredLocation && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#ffffff',
                border: '1.5px solid var(--line)',
                padding: '12px 16px',
                borderRadius: '14px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                minWidth: '180px',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', fontWeight: 800 }}>
                State / UT
              </span>
              <strong style={{ display: 'block', fontSize: '15px', color: 'var(--ink)', margin: '2px 0 6px' }}>
                {hoveredLocation.name}
              </strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: hoveredLocation.level.gaugeColor,
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 800 }}>
                  AQI {hoveredLocation.aqi}
                </span>
                <span className={hoveredLocation.level.chipClass} style={{ fontSize: '9px', padding: '2px 6px' }}>
                  {hoveredLocation.level.category}
                </span>
              </div>
              <small style={{ color: 'var(--muted)', fontSize: '10px', display: 'block' }}>
                Capital Hub: <b>{hoveredLocation.city}</b>
              </small>
              <div style={{ fontSize: '10px', color: '#167d70', fontWeight: 700, marginTop: '6px' }}>
                ➔ Click to switch dashboard to {hoveredLocation.city}
              </div>
            </div>
          )}
        </div>

        {/* State Rankings & Regional Filter Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '15px', margin: '0 0 4px', fontWeight: 800 }}>
              State & Union Territory Rankings
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0 }}>
              Live air quality levels across India. Click any state or city to view in dashboard.
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: '#f0f5f2', padding: '4px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                flex: 1,
                border: 0,
                borderRadius: '8px',
                padding: '6px 0',
                fontSize: '11px',
                fontWeight: 700,
                background: activeTab === 'all' ? '#ffffff' : 'transparent',
                color: activeTab === 'all' ? 'var(--ink)' : 'var(--muted)',
                boxShadow: activeTab === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              All States (36)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('highest')}
              style={{
                flex: 1,
                border: 0,
                borderRadius: '8px',
                padding: '6px 0',
                fontSize: '11px',
                fontWeight: 700,
                background: activeTab === 'highest' ? '#ffffff' : 'transparent',
                color: activeTab === 'highest' ? '#b91c1c' : 'var(--muted)',
                boxShadow: activeTab === 'highest' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Most Polluted
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cleanest')}
              style={{
                flex: 1,
                border: 0,
                borderRadius: '8px',
                padding: '6px 0',
                fontSize: '11px',
                fontWeight: 700,
                background: activeTab === 'cleanest' ? '#ffffff' : 'transparent',
                color: activeTab === 'cleanest' ? '#15803d' : 'var(--muted)',
                boxShadow: activeTab === 'cleanest' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Cleanest Air
            </button>
          </div>

          {/* State List with live AQI Chip */}
          <div style={{ display: 'grid', gap: '8px', maxHeight: '470px', overflowY: 'auto', paddingRight: '4px' }}>
            {displayList.map((st, idx) => {
              const isSelected = selectedState?.id === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => onSelectCity(st.city)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: isSelected ? '#e8f5ef' : '#ffffff',
                    border: isSelected ? '2px solid #167d70' : '1px solid var(--line)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: '#f1f5f3',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: 'var(--muted)',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <b style={{ fontSize: '13px', color: 'var(--ink)' }}>{st.name}</b>
                      <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                        Hub: {st.city}
                      </small>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={st.level.chipClass} style={{ fontSize: '10px', padding: '4px 9px', borderRadius: '14px' }}>
                      AQI {st.aqi} · {st.level.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
