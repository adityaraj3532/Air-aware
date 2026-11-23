import { useMemo, useState } from 'react';
import { hourlyValues } from '../data/airQualityData.js';
import { getAqiLevel } from '../utils/aqi.js';

// Sensible local hours for each activity: [from, to) in 24h
const ACTIVITIES = {
  Walking: { icon: '🚶', hours: [[6, 10], [16, 20]], strenuous: false, why: 'Comfortable morning/evening walking hours.' },
  'Running / Jogging': { icon: '🏃', hours: [[5, 9], [17, 20]], strenuous: true, why: 'Early morning or early evening, away from midday heat.' },
  Cycling: { icon: '🚴', hours: [[6, 10], [16, 19]], strenuous: true, why: 'Daylight only, for safe visibility on the road.' },
  'Outdoor sports': { icon: '⚽', hours: [[6, 10], [16, 19]], strenuous: true, why: 'Daylight, outside the hottest midday hours.' },
  'Campus commute': { icon: '🎒', hours: [[7, 11], [16, 20]], strenuous: false, why: 'Matched to typical campus travel times.' },
};
const DURATIONS = [30, 45, 60, 90];

const TIPS = [
  { icon: '🫁', title: 'You breathe up to 10× more', text: 'Hard exercise multiplies how much particulate matter reaches your lungs.' },
  { icon: '🏋️', title: 'AQI above 150?', text: 'Swap high-intensity training for indoor cardio, yoga or the gym.' },
  { icon: '🛣️', title: 'Avoid busy roads', text: 'Pick parks and inner campus paths; traffic exhaust peaks near main roads.' },
  { icon: '😷', title: 'Mask when it matters', text: 'A well-fitted N95 helps sensitive groups when AQI is above 100.' },
];

const inRule = (rule, h) => rule.hours.some(([from, to]) => h >= from && h < to);
const fmtHour = (d) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

function dayLabel(d) {
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === new Date(today.getTime() + 86400000).toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

function plan(slots, activity, duration) {
  const rule = ACTIVITIES[activity];
  const need = Math.max(1, Math.ceil(duration / 60));
  const now = new Date();
  const candidates = [];
  for (let i = 0; i + need <= slots.length; i += 1) {
    const win = slots.slice(i, i + need);
    if (!win[0].fullTime) continue;
    const start = new Date(win[0].fullTime);
    const hours = win.map((w) => new Date(w.fullTime).getHours());
    if (!hours.every((h) => inRule(rule, h))) continue;
    const avg = Math.round(win.reduce((s, w) => s + w.aqi, 0) / win.length);
    // Air quality first, then comfort (midday heat / darkness), then a mild preference for sooner
    const heat = rule.strenuous && hours.some((h) => h >= 11 && h < 16) ? 40 : 0;
    const dark = hours.some((h) => h < 6 || h >= 19) ? 15 : 0;
    candidates.push({ index: i, start, avg, score: avg + heat + dark + ((start - now) / 3600000) * 0.8 });
  }
  candidates.sort((a, b) => a.score - b.score);
  const picked = [];
  for (const c of candidates) {
    if (picked.every((p) => Math.abs(p.start - c.start) >= 2 * 3600000)) picked.push(c);
    if (picked.length === 3) break;
  }
  return { picked, need, rule };
}

export default function Planner({ location, data }) {
  const [duration, setDuration] = useState(45);
  const [activity, setActivity] = useState('Walking');
  const slots = data?.hourly?.length ? data.hourly : hourlyValues;

  // Recalculate instantly whenever the activity or duration changes
  const { picked, need, rule } = useMemo(() => plan(slots, activity, duration), [slots, activity, duration]);
  const best = picked[0];
  const lvl = best ? getAqiLevel(best.avg) : null;
  const tone = !best ? 'caution' : best.avg > 200 ? 'avoid' : best.avg > 100 ? 'caution' : 'safe';
  const advice = { safe: 'Great conditions for your session!', caution: 'Keep the intensity moderate; sensitive people should carry a mask.', avoid: 'Air is poor even at the best time. Consider an indoor alternative.' }[tone];
  const peak = Math.max(...slots.map((s) => s.aqi), 100);
  const end = best ? new Date(best.start.getTime() + duration * 60000) : null;

  return (
    <section className="view active">
      <div className="head-row">
        <div>
          <p className="eyebrow">Plan with awareness</p>
          <h1>Outdoor time planner</h1>
          <p className="sub">Find the cleanest time for outdoor activities near <b>{data?.fullLocation || location}</b>.</p>
        </div>
        <div className="updated">{data?.isLive ? '● Live hourly forecast' : 'Sample forecast'}</div>
      </div>

      <div className="pl-layout">
        <div className="pl-main">
          <div className="card pl-card">
            <span className="pl-step">1 · Choose activity</span>
            <div className="pl-acts">
              {Object.entries(ACTIVITIES).map(([name, a]) => (
                <button key={name} type="button" className={activity === name ? 'on' : ''} onClick={() => setActivity(name)} aria-pressed={activity === name}>
                  <span aria-hidden="true">{a.icon}</span>{name}
                </button>
              ))}
            </div>
            <span className="pl-step">2 · How long?</span>
            <div className="pl-durs" role="radiogroup" aria-label="Duration">
              {DURATIONS.map((d) => (
                <button key={d} type="button" role="radio" aria-checked={duration === d} className={duration === d ? 'on' : ''} onClick={() => setDuration(d)}>
                  {d < 60 ? `${d} min` : d === 60 ? '1 hour' : '1.5 hours'}
                </button>
              ))}
            </div>
          </div>

          <div className={`card pl-result tone-${tone}`} style={{ '--lvl': lvl?.gaugeColor || '#d97706' }}>
            {best ? (
              <>
                <div className="pl-result-top">
                  <div>
                    <span className="pl-step">Best time for {activity.toLowerCase()}</span>
                    <div className="pl-when">{dayLabel(best.start)}, {fmtHour(best.start)} <em>–</em> {fmtHour(end)}</div>
                    <p className="pl-why">✦ {rule.why} {advice}</p>
                  </div>
                  <div className="pl-ring"><b>{best.avg}</b><small>{lvl.category}</small></div>
                </div>

                <div className="pl-timeline has-best" aria-label="Hourly AQI for the next 24 hours">
                  {(() => {
                    const n = slots.filter((s) => s.fullTime).length;
                    return (
                      <div className="pl-window" style={{ left: `calc(8px + (100% - 16px) * ${best.index / n})`, width: `calc((100% - 16px) * ${need / n})` }}>
                        <span className="pl-window-tag">⭐ {fmtHour(best.start)} – {fmtHour(end)}</span>
                      </div>
                    );
                  })()}
                  {slots.filter((s) => s.fullTime).map((s, i) => {
                    const h = new Date(s.fullTime).getHours();
                    const allowed = inRule(rule, h);
                    const chosen = i >= best.index && i < best.index + need;
                    return (
                      <div key={s.fullTime} className={`pl-tick ${allowed ? 'ok' : 'off'} ${chosen ? 'best' : ''}`} title={`${s.time}: AQI ${s.aqi}${allowed ? '' : ' · outside suitable hours'}`}>
                        <span style={{ height: `${Math.max(10, (s.aqi / peak) * 100)}%`, background: getAqiLevel(s.aqi).gaugeColor }} />
                        <small>{h % 3 === 0 ? (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`) : ''}</small>
                      </div>
                    );
                  })}
                </div>
                <div className="pl-legend"><span><i className="best" />Your window</span><span><i className="ok" />Suitable hours</span><span><i className="off" />Too dark / hot</span></div>

                {picked.length > 1 && (
                  <div className="pl-alts">
                    {picked.slice(1).map((o) => (
                      <div key={o.start.toISOString()} className="pl-alt" style={{ '--a': getAqiLevel(o.avg).gaugeColor }}>
                        <small>Alternative</small>
                        <b>{dayLabel(o.start)}, {fmtHour(o.start)}</b>
                        <span>AQI {o.avg} · {getAqiLevel(o.avg).category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="pl-none">No suitable {activity.toLowerCase()} hours left in the forecast. Check back tomorrow morning.</p>
            )}
          </div>
        </div>

        <aside className="pl-side">
          <div className="card pl-card">
            <h2 className="pl-side-title">Smart activity tips</h2>
            <div className="pl-tips">
              {TIPS.map((t) => (
                <div key={t.title} className="pl-tip">
                  <span aria-hidden="true">{t.icon}</span>
                  <div><b>{t.title}</b><p>{t.text}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card pl-card pl-now" style={{ '--lvl': getAqiLevel(data?.aqi).gaugeColor }}>
            <small>Right now in {data?.location || location}</small>
            <div><b>{data?.aqi}</b><span>{data?.status}</span></div>
            <p>{rule.strenuous && data?.aqi > 100 ? 'Too polluted for a hard workout right now. Wait for the window above.' : 'Conditions right now are fine for light activity.'}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
