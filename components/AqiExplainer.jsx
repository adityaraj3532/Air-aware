import { useEffect, useRef, useState } from 'react';
import { calculateUsAqi, getUsAqiLevel, getAqiLevel } from '../utils/aqi.js';

const SUGGESTIONS = [
  'Why is US AQI higher?',
  'Which one should I follow?',
  'Is it safe to go outside?',
  'What is PM2.5?',
];

// Offline answer engine: matches keywords and uses today's live readings.
function answer(q, ctx) {
  const t = q.toLowerCase();
  const { inAqi, usAqi, inCat, usCat, pm25, place } = ctx;
  const has = (...w) => w.some((x) => t.includes(x));

  if (has('higher', 'bigger', 'more', 'why different', 'different number', 'not same', 'mismatch'))
    return `Both use a 0–500 score, but the US scale is stricter. In ${place} right now PM2.5 is ${pm25} µg/m³. India counts that as ${inAqi} (${inCat}), and the US counts it as ${usAqi} (${usCat}). The air is the same; only the scale is different.`;
  if (has('which', 'follow', 'better', 'trust', 'correct', 'right one', 'should i use'))
    return 'Use India AQI to compare with Indian news, apps like SAMEER and government alerts. Use US AQI if you have asthma or a heart or lung condition, are pregnant, or care for children or older people, because it warns you earlier. Neither one is wrong.';
  if (has('safe', 'outside', 'outdoor', 'run', 'walk', 'exercise', 'jog', 'mask', 'school', 'kid', 'child'))
    return usAqi <= 50
      ? 'Yes. The air is clean on both scales, so enjoy outdoor activities.'
      : usAqi <= 100
        ? 'Mostly yes. Very sensitive people should keep long or heavy exercise outside short.'
        : usAqi <= 150
          ? `Healthy adults are fine for short outings. Children, older people and anyone with asthma should limit long or hard activity outside (US AQI ${usAqi}).`
          : `Try to limit time outside (US AQI ${usAqi}, India AQI ${inAqi}). Wear an N95 mask if you go out, and exercise indoors.`;
  if (has('pm2.5', 'pm25', 'pm 2.5', 'particle'))
    return 'PM2.5 is very fine dust and smoke, less than 2.5 micrometres across (about 30 times thinner than a hair). It can go deep into the lungs and even into the blood. It is the main thing both AQIs measure.';
  if (has('pm10'))
    return 'PM10 is coarser dust (less than 10 micrometres), like road and construction dust. It irritates the nose, throat and lungs. Both AQIs include it.';
  if (has('cpcb', 'india aqi', 'indian'))
    return 'India AQI is made by the Central Pollution Control Board (CPCB). It has 6 levels: Good (0–50), Satisfactory (51–100), Moderate (101–200), Poor (201–300), Very Poor (301–400) and Severe (401–500). It looks at up to 8 pollutants.';
  if (has('epa', 'us aqi', 'america', 'usa'))
    return 'US AQI is made by the US Environmental Protection Agency (EPA). It has 6 levels: Good (0–50), Moderate (51–100), Unhealthy for Sensitive Groups (101–150), Unhealthy (151–200), Very Unhealthy (201–300) and Hazardous (301–500).';
  if (has('switch', 'change', 'toggle', 'button'))
    return 'Use the 🇮🇳 India AQI / 🇺🇸 US AQI button next to AirBuddy on the air-quality card. The main gauge will switch between the two.';
  if (has('what is aqi', 'aqi mean', 'meaning', 'aqi'))
    return 'AQI (Air Quality Index) turns complicated pollution measurements into one simple number from 0 to 500. A lower number means cleaner air. Each country picks its own cut-off points, which is why India and US AQI can differ.';
  if (has('hi', 'hello', 'hey'))
    return 'Hi! Ask me anything about India AQI vs US AQI, or about today\'s air.';
  return 'I can answer questions about India vs US AQI, what the levels mean, PM2.5 and PM10, and whether it is safe to go outside today. Try one of the suggestions above.';
}

// CPCB PM2.5 sub-index breakpoints: [concLo, concHi, aqiLo, aqiHi]
const IN_PM25 = [[0, 30, 0, 50], [30, 60, 50, 100], [60, 90, 100, 200], [90, 120, 200, 300], [120, 250, 300, 400], [250, 500, 400, 500]];
function indiaPm25Aqi(c) {
  const row = IN_PM25.find(([, hi]) => c <= hi) || IN_PM25.at(-1);
  const [lo, hi, a, b] = row;
  return Math.round(a + ((Math.min(c, hi) - lo) * (b - a)) / (hi - lo));
}

const IN_BANDS = [[50, 'Good'], [100, 'Satisfactory'], [200, 'Moderate'], [300, 'Poor'], [400, 'Very Poor'], [500, 'Severe']]
  .map(([max, name]) => ({ max, name, color: getAqiLevel(max).gaugeColor }));
const US_BANDS = [[50, 'Good'], [100, 'Moderate'], [150, 'Sensitive'], [200, 'Unhealthy'], [300, 'Very Unhealthy'], [500, 'Hazardous']]
  .map(([max, name]) => ({ max, name, color: getUsAqiLevel(max).color }));

const PRESETS = [['🌿 Clean day', 12], ['🏙️ Typical city', 45], ['🌫️ Smoggy', 110], ['🎆 Post-Diwali', 260]];

const SCALES = {
  in: {
    flag: '🇮🇳', name: 'India AQI', src: 'Central Pollution Control Board (CPCB)', bands: IN_BANDS,
    facts: ['Tuned for Indian conditions, so less strict', 'PM2.5 up to 60 µg/m³ is still “Satisfactory”', 'Looks at up to 8 pollutants', 'Best for matching Indian news and government alerts'],
  },
  us: {
    flag: '🇺🇸', name: 'US AQI', src: 'US Environmental Protection Agency (EPA)', bands: US_BANDS,
    facts: ['Stricter, so it warns you earlier', 'PM2.5 of 35 µg/m³ is already “Unhealthy for Sensitive Groups”', 'Used by most global air-quality apps', 'Best for sensitive people and comparing countries'],
  },
};

function ScaleBar({ bands, value, color }) {
  let prev = 0;
  return (
    <div className="ac-bar">
      {bands.map((b) => {
        const w = ((b.max - prev) / 500) * 100;
        prev = b.max;
        return <span key={b.max} style={{ width: `${w}%`, background: b.color }} title={b.name} />;
      })}
      <i className="ac-pin" style={{ left: `${Math.min(value, 500) / 5}%`, borderColor: color }} />
    </div>
  );
}

const INFO = {
  in: { title: 'India AQI', src: 'Central Pollution Control Board', facts: ['Built for Indian conditions and less strict', 'PM2.5 up to 60 µg/m³ still counts as “Satisfactory”', 'Matches Indian news and government alerts'] },
  us: { title: 'US AQI', src: 'Environmental Protection Agency', facts: ['Stricter, so it warns you sooner', 'PM2.5 of 35 µg/m³ is already “Unhealthy for Sensitive Groups”', 'Best for sensitive people and for comparing with other countries'] },
};

function Scale({ label, bands, value }) {
  let prev = 0;
  return (
    <div className="ac2-scale">
      <small>{label}</small>
      <div className="ac2-track">
        {bands.map((b) => { const w = ((b.max - prev) / 500) * 100; prev = b.max; return <span key={b.max} style={{ width: `${w}%`, background: b.color }} title={b.name} />; })}
        <div className="ac2-pin" style={{ left: `${Math.min(value, 500) / 5}%` }}><em>{value}</em></div>
      </div>
    </div>
  );
}

function AqiCompare({ liveIn, liveUs }) {
  const inLvl = getAqiLevel(liveIn);
  const usLvl = getUsAqiLevel(liveUs);
  const score = (label, v, cat, color) => (
    <div className="ac2-num">
      <small>{label}</small>
      <b>{v}</b>
      <span className="ac2-badge" style={{ background: color }}>{cat}</span>
    </div>
  );
  return (
    <>
      <div className="ac2-card">
        <div className="ac2-nums">
          {score('India AQI (CPCB)', liveIn, inLvl.category, inLvl.gaugeColor)}
          {score('US AQI (EPA)', liveUs, usLvl.category, usLvl.color)}
        </div>
        <Scale label="India scale" bands={IN_BANDS} value={liveIn} />
        <Scale label="US scale" bands={US_BANDS} value={liveUs} />
        <div className="ac2-axis">{[0, 100, 200, 300, 400, 500].map((n) => <span key={n}>{n}</span>)}</div>
        <p className="ac2-note">Both pins sit on the same pollution level. The US scale reaches “Unhealthy” sooner, so it warns you earlier.</p>
      </div>

      <div className="ac2-info">
        {['in', 'us'].map((k) => (
          <div key={k} className="ac2-card">
            <h3>{INFO[k].title}</h3>
            <p className="ac2-src">{INFO[k].src}</p>
            <ul>{INFO[k].facts.map((f) => <li key={f}>{f}</li>)}</ul>
            <div className="ac2-chips">
              {(k === 'in' ? IN_BANDS : US_BANDS).map((b) => <span key={b.max} style={{ background: b.color }}>{b.name}</span>)}
            </div>
          </div>
        ))}
      </div>

      <p className="ac2-tip">For the same air, the US number is usually higher. Switch between them with the India AQI / US AQI buttons next to AirBuddy.</p>
    </>
  );
}

function verdict(usAqi) {
  if (usAqi <= 50) return ['😊', 'Great air for everyone'];
  if (usAqi <= 100) return ['🙂', 'Fine for most people'];
  if (usAqi <= 150) return ['😐', 'Sensitive people: take it easy outside'];
  if (usAqi <= 200) return ['😷', 'Limit time outdoors'];
  return ['🚫', 'Stay indoors if you can'];
}

function ScoreCard({ k, aqi, cat, color, open, onToggle }) {
  const bands = SCALES[k].bands;
  const [hov, setHov] = useState(null);
  let prev = 0;
  const segs = bands.map((b) => { const lo = prev; prev = b.max; return { ...b, lo: lo ? lo + 1 : 0, w: ((b.max - lo) / 500) * 100 }; });
  const show = hov ?? segs.find((b) => aqi <= b.max);
  return (
    <div className={`ac-score ${open ? 'on' : ''}`} style={{ '--c': color }}>
      <button type="button" className="ac-score-head" onClick={onToggle} aria-expanded={open}>
        <small>{SCALES[k].flag} {SCALES[k].name}</small>
        <b>{aqi}</b>
        <span>{cat}</span>
        <em className="ac-more">{open ? 'Hide levels ▴' : 'See all levels ▾'}</em>
      </button>
      <div className="ac-bar" onMouseLeave={() => setHov(null)}>
        {segs.map((b) => (
          <span key={b.max} style={{ width: `${b.w}%`, background: b.color }} onMouseEnter={() => setHov(b)} onClick={() => setHov(b)} />
        ))}
        <i className="ac-pin" style={{ left: `${Math.min(aqi, 500) / 5}%`, borderColor: color }} />
      </div>
      <div className="ac-bar-label"><span>0</span><span style={{ color: show.color }}>{hov ? '' : 'You are here: '}<strong>{show.name}</strong> {show.lo}–{show.max}</span><span>500</span></div>
      {open && (
        <div className="ac-levels">
          {segs.map((b) => (
            <div key={b.max} className={`ac-level ${aqi >= b.lo && aqi <= b.max ? 'on' : ''}`} style={{ '--c': b.color }}>
              <i /> <span>{b.name}</span> <small>{b.lo}–{b.max}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AqiSimple({ livePm, liveIn, liveUs, place }) {
  const [pm, setPm] = useState(null);
  const inAqi = pm == null ? liveIn : indiaPm25Aqi(pm);
  const usAqi = pm == null ? liveUs : calculateUsAqi(pm, 0);
  const inLvl = getAqiLevel(inAqi);
  const usLvl = getUsAqiLevel(usAqi);
  const [emoji, msg] = verdict(usAqi);
  const [open, setOpen] = useState(null);
  const tog = (k) => setOpen((o) => (o === k ? null : k));
  return (
    <div className="ac">
      <p className="ac-when">{pm == null ? <>Right now in <b>{place}</b></> : <>If PM2.5 were <b>{pm} µg/m³</b></>}</p>
      <div className="ac-scores">
        <ScoreCard k="in" aqi={inAqi} cat={inLvl.category} color={inLvl.gaugeColor} open={open === 'in'} onToggle={() => tog('in')} />
        <ScoreCard k="us" aqi={usAqi} cat={usLvl.category} color={usLvl.color} open={open === 'us'} onToggle={() => tog('us')} />
        <div className="ac-vs" aria-hidden="true">=</div>
      </div>
      <div className="ac-verdict"><span>{emoji}</span><b>{msg}</b></div>
      <div className="ac-use">
        <div><b>🇮🇳 Use India AQI</b> to match Indian news and government alerts.</div>
        <div><b>🇺🇸 Use US AQI</b> if you have asthma, kids or elders — it warns earlier.</div>
      </div>
      <details className="ac-sim">
        <summary>🎚️ Play with it: see how both numbers change</summary>
        <input aria-label="PM2.5 level" type="range" min="0" max="300" value={pm ?? Math.round(livePm)} onChange={(e) => setPm(+e.target.value)} />
        <div className="ac-presets">
          {PRESETS.map(([label, v]) => (
            <button key={v} type="button" className={pm === v ? 'on' : ''} onClick={() => setPm(v)}>{label}</button>
          ))}
          {pm != null && <button type="button" className="ac-reset" onClick={() => setPm(null)}>↺ Back to live</button>}
        </div>
      </details>
    </div>
  );
}

export default function AqiExplainer({ data, location }) {
  const inAqi = data.aqi;
  const usAqi = calculateUsAqi(data.pm25, data.pm10);
  const ctx = {
    inAqi, usAqi, pm25: data.pm25,
    inCat: getAqiLevel(inAqi).category,
    usCat: getUsAqiLevel(usAqi).category,
    place: data.location || location || 'your city',
  };

  const [msgs, setMsgs] = useState([
    { from: 'bot', text: 'Hi! I\'m AirBuddy 🌬️ Ask me anything: weather in any city, air quality, health tips, or India vs US AQI.' },
  ]);
  const [input, setInput] = useState('');
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [msgs]);

  const [busy, setBusy] = useState(false);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const next = [...msgs, { from: 'user', text: q }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    let reply;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: next, context: { city: ctx.place, indiaAqi: inAqi, usAqi, pm25: data.pm25, pm10: data.pm10 } }),
      });
      const json = await res.json();
      reply = json.reply || null;
    } catch { reply = null; }
    // Offline fallback when the AI server isn't available
    if (!reply) reply = answer(q, ctx);
    setMsgs((m) => [...m, { from: 'bot', text: reply }]);
    setBusy(false);
  }

  return (
    <section className="card aqi-learn">
      <div className="aqi-chat">
        <h3>💬 Ask AirBuddy</h3>
        <div className="chat-log" ref={logRef} aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={`chat-msg ${m.from}`}>{m.text}</div>
          ))}
          {busy && <div className="chat-msg bot typing">AirBuddy is typing…</div>}
        </div>
        <div className="chat-suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything — weather, health, AQI…" aria-label="Ask a question about AQI" />
          <button className="primary" type="submit" disabled={busy}>{busy ? '…' : 'Send'}</button>
        </form>
      </div>
      <h2 className="card-title">India AQI vs US AQI — what's the difference?</h2>
      <p className="aqi-learn-lead"><b>Same air, two rulers.</b> The US scale is stricter, so its number is usually higher.</p>
      <AqiSimple livePm={Number(data.pm25) || 0} liveIn={inAqi} liveUs={usAqi} place={ctx.place} />
    </section>
  );
}
