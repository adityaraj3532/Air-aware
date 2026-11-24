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
      <h2 className="card-title">India AQI vs US AQI — what's the difference?</h2>
      <p className="aqi-learn-lead">
        <b>Same air, different rulers.</b> Both turn pollution into a 0–500 score, but each country sets its own cut-offs.
        Right now in {ctx.place}: <b>India {inAqi}</b> ({ctx.inCat}) · <b>US {usAqi}</b> ({ctx.usCat}).
      </p>

      <div className="aqi-compare">
        <div>
          <h3>🇮🇳 India AQI</h3>
          <p className="aqi-src">Central Pollution Control Board (CPCB)</p>
          <ul>
            <li>Made for Indian conditions and less strict</li>
            <li>PM2.5 up to 60 µg/m³ = “Satisfactory”</li>
            <li>Good · Satisfactory · Moderate · Poor · Very Poor · Severe</li>
            <li>Best for matching Indian news and government alerts</li>
          </ul>
        </div>
        <div>
          <h3>🇺🇸 US AQI</h3>
          <p className="aqi-src">US Environmental Protection Agency (EPA)</p>
          <ul>
            <li>Stricter, so it warns you earlier</li>
            <li>PM2.5 of 35 µg/m³ is already “Unhealthy for Sensitive Groups”</li>
            <li>Good · Moderate · USG · Unhealthy · Very Unhealthy · Hazardous</li>
            <li>Best for sensitive people and comparing with other countries</li>
          </ul>
        </div>
      </div>
      <p className="aqi-tip">💡 For the same air, the US number is usually <b>higher</b>. Switch between them with the India AQI / US AQI buttons next to AirBuddy.</p>

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
    </section>
  );
}
