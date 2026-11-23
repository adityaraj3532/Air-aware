// Animated character whose mood, mask and motion follow the current AQI level.
const MOODS = {
  good:           { anim: 'bounce', skin: '#f6c99a', mouth: 'M42 62 Q50 71 58 62', eyes: 'happy', mask: false, smog: 0, wave: true,  caption: 'Breathing easy!' },
  satisfactory:   { anim: 'sway',   skin: '#f6c99a', mouth: 'M43 63 Q50 68 57 63', eyes: 'open',  mask: false, smog: 1, wave: false, caption: 'Feeling fine' },
  moderate:       { anim: 'breathe',skin: '#f3c595', mouth: 'M44 65 L56 65',       eyes: 'open',  mask: 'light', smog: 2, wave: false, caption: 'Masking up, just in case' },
  poor:           { anim: 'cough',  skin: '#eebd8f', mouth: null,                  eyes: 'squint',mask: 'full',  smog: 3, wave: false, caption: '*cough* air feels heavy' },
  'very-poor':    { anim: 'shiver', skin: '#e6c39c', mouth: null,                  eyes: 'teary', mask: 'full',  smog: 4, wave: false, caption: 'Eyes burning, stay inside' },
  severe:         { anim: 'dizzy',  skin: '#d9c4a3', mouth: null,                  eyes: 'dizzy', mask: 'full',  smog: 5, wave: false, caption: 'Hazardous! Avoid going out' },
};

function Eyes({ type }) {
  if (type === 'happy') return (<g stroke="#2b2b2b" strokeWidth="2.4" fill="none" strokeLinecap="round"><path d="M38 50 Q42 45 46 50" /><path d="M54 50 Q58 45 62 50" /></g>);
  if (type === 'squint') return (<g stroke="#2b2b2b" strokeWidth="2.4" strokeLinecap="round"><path d="M37 47 L46 50 L37 52" fill="none" /><path d="M63 47 L54 50 L63 52" fill="none" /></g>);
  if (type === 'dizzy') return (<g stroke="#2b2b2b" strokeWidth="2" fill="none"><path className="ab-spin" d="M42 49 m-4 0 a4 4 0 1 0 8 0 a3 3 0 1 0 -6 0 a1.5 1.5 0 1 0 3 0" /><path className="ab-spin" d="M58 49 m-4 0 a4 4 0 1 0 8 0 a3 3 0 1 0 -6 0 a1.5 1.5 0 1 0 3 0" /></g>);
  return (
    <g>
      <g className="ab-blink" fill="#2b2b2b"><ellipse cx="42" cy="49" rx="2.6" ry="3.2" /><ellipse cx="58" cy="49" rx="2.6" ry="3.2" /></g>
      {type === 'teary' && <g fill="#6ec3f0"><path className="ab-tear" d="M39 54 q-2 4 0 6 q2 -2 0 -6" /><path className="ab-tear d2" d="M61 54 q-2 4 0 6 q2 -2 0 -6" /></g>}
    </g>
  );
}

export default function AirBuddy({ levelKey = 'good', color = '#1da463' }) {
  const m = MOODS[levelKey] || MOODS.good;
  return (
    <div className={`air-buddy ab-${m.anim}`} style={{ '--ab-color': color }} title={m.caption}>
      <svg viewBox="0 0 100 150" aria-hidden="true">
        {/* smog particles drifting by */}
        {Array.from({ length: m.smog * 2 }).map((_, i) => (
          <circle key={i} className="ab-smog" cx={8 + ((i * 37) % 84)} cy={20 + ((i * 53) % 110)} r={3 + (i % 3) * 2}
            style={{ animationDelay: `${(i * 0.7) % 4}s` }} />
        ))}
        {m.anim === 'good' || m.anim === 'bounce' ? (
          <g className="ab-sparkle" fill={color}><path d="M12 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" /><path d="M86 22 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" /></g>
        ) : null}
        <g className="ab-body">
          {/* legs */}
          <g stroke="#4b5563" strokeWidth="5" strokeLinecap="round"><path d="M44 120 L43 142" /><path d="M56 120 L57 142" /></g>
          {/* body / kurta */}
          <path d="M32 84 Q50 76 68 84 L72 124 Q50 130 28 124 Z" fill="var(--ab-color)" />
          <path d="M50 82 L50 104" stroke="rgba(255,255,255,.6)" strokeWidth="1.5" />
          {/* arms */}
          <path d="M33 88 Q24 102 27 114" stroke={m.skin} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path className={m.wave ? 'ab-wave' : m.anim === 'dizzy' || m.anim === 'shiver' ? 'ab-headhold' : ''}
            d="M67 88 Q76 102 73 114" stroke={m.skin} strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* head */}
          <g className="ab-head">
            <circle cx="50" cy="52" r="24" fill={m.skin} />
            <path d="M27 46 Q30 24 50 25 Q72 24 74 46 Q66 34 50 36 Q36 34 27 46Z" fill="#3a2a20" />
            <Eyes type={m.eyes} />
            {m.mouth && <path d={m.mouth} stroke="#7a3a2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />}
            {(levelKey === 'good' || levelKey === 'satisfactory') && <g fill="#f29a8a" opacity=".55"><circle cx="35" cy="59" r="4" /><circle cx="65" cy="59" r="4" /></g>}
            {m.mask && (
              <g>
                <path d="M33 56 Q50 54 67 56 L65 70 Q50 78 35 70 Z" fill={m.mask === 'light' ? '#e0f2fe' : '#ffffff'} stroke="#cbd5e1" strokeWidth="1" />
                <path d="M36 61 H64 M37 66 H63" stroke="#cbd5e1" strokeWidth="1" />
                <path d="M33 57 L27 52 M67 57 L73 52" stroke="#cbd5e1" strokeWidth="1.2" />
              </g>
            )}
            {m.anim === 'cough' && <g className="ab-puff" fill="#cbd5e1"><circle cx="76" cy="66" r="3" /><circle cx="83" cy="62" r="2" /></g>}
            {(m.anim === 'shiver' || m.anim === 'dizzy') && <path className="ab-sweat" d="M73 38 q-3 5 0 7 q3 -2 0 -7" fill="#7dd3fc" />}
          </g>
        </g>
      </svg>
      <span className="ab-caption">{m.caption}</span>
    </div>
  );
}
