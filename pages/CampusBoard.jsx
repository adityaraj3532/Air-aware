import { useEffect, useMemo, useRef, useState } from 'react';
import { getAqiLevel } from '../utils/aqi.js';

const STORE_KEY = 'airawareCampusEvents';
const TYPES = {
  walk: { icon: '🚶', label: 'Walk', strenuous: false },
  run: { icon: '🏃', label: 'Run / Jog', strenuous: true },
  cycle: { icon: '🚴', label: 'Cycling', strenuous: true },
  sports: { icon: '⚽', label: 'Sports', strenuous: true },
  meetup: { icon: '🤝', label: 'Meet-up', strenuous: false },
  cleanup: { icon: '🌱', label: 'Green drive', strenuous: false },
  other: { icon: '✏️', label: 'Other', strenuous: false },
};

// Default activity name filled in when a type is picked
const DEFAULT_NAMES = {
  walk: 'Campus walk',
  run: 'Group run',
  cycle: 'Cycling ride',
  sports: 'Sports practice',
  meetup: 'Community meet-up',
  cleanup: 'Green drive',
};
const isDefaultName = (name) => !name.trim() || Object.values(DEFAULT_NAMES).includes(name.trim());

const dayKey = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA'); // local YYYY-MM-DD
};

function sampleEvents() {
  return [
    { id: 's1', name: 'Morning campus walk', type: 'walk', date: dayKey(1), time: '07:00', place: 'Main gate', going: 12, joined: false, mine: false },
    { id: 's2', name: 'Green club meet-up', type: 'cleanup', date: dayKey(0), time: '17:00', place: 'Library lawn', going: 8, joined: false, mine: false },
    { id: 's3', name: 'Evening football practice', type: 'sports', date: dayKey(1), time: '17:30', place: 'Sports ground', going: 18, joined: false, mine: false },
  ];
}

function loadEvents() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch { /* storage unavailable */ }
  return sampleEvents();
}

// Find the forecast hour matching an event's date + time
function forecastFor(event, hourly) {
  const when = new Date(`${event.date}T${event.time}`);
  if (Number.isNaN(when.getTime())) return null;
  if (when < new Date(Date.now() - 3600000)) return { past: true };
  const slot = hourly.find((h) => h.fullTime && Math.abs(new Date(h.fullTime) - when) < 1800001);
  return slot ? { aqi: slot.aqi } : { unknown: true };
}

function verdict(aqi, strenuous) {
  const limit = strenuous ? 100 : 150;
  if (aqi <= limit) return { tone: 'safe', text: 'Good to go' };
  if (aqi <= 200) return { tone: 'caution', text: strenuous ? 'Lower the intensity' : 'Masks for sensitive groups' };
  return { tone: 'avoid', text: 'Move indoors or reschedule' };
}

function formatWhen(event) {
  const d = new Date(`${event.date}T${event.time}`);
  const day = event.date === dayKey(0) ? 'Today' : event.date === dayKey(1) ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} · ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
}

export default function CampusBoard({ data, location }) {
  const hourly = data?.hourly || [];
  const [events, setEvents] = useState(loadEvents);
  const [form, setForm] = useState({ name: DEFAULT_NAMES.walk, type: 'walk', date: dayKey(0), time: '17:00', place: '' });
  const [feedback, setFeedback] = useState(null);
  const [filter, setFilter] = useState('all');
  const nameRef = useRef(null);

  // Picking a type fills the name (unless the user already typed their own); "Other" lets them write freely
  function pickType(key) {
    setForm((f) => {
      const keepName = !isDefaultName(f.name);
      const name = keepName ? f.name : key === 'other' ? '' : DEFAULT_NAMES[key];
      return { ...f, type: key, name };
    });
    if (key === 'other') setTimeout(() => nameRef.current?.focus(), 0);
  }

  useEffect(() => {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(events)); } catch { /* ignore */ }
  }, [events]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Live preview of the air for the time being planned
  const preview = useMemo(() => {
    const f = forecastFor(form, hourly);
    if (!f || f.past || f.unknown) return f;
    return { ...f, ...verdict(f.aqi, TYPES[form.type].strenuous) };
  }, [form, hourly]);

  // Best upcoming hour (daylight 6–19) in the forecast, for reschedule suggestions
  const bestSlot = useMemo(() => {
    const ok = hourly.filter((h) => {
      if (!h.fullTime) return false;
      const hr = new Date(h.fullTime).getHours();
      return hr >= 6 && hr < 19 && new Date(h.fullTime) > new Date();
    });
    return ok.reduce((a, b) => (!a || b.aqi < a.aqi ? b : a), null);
  }, [hourly]);

  function addEvent(e) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { setFeedback({ tone: 'avoid', text: 'Please enter an activity name.' }); return; }
    if (new Date(`${form.date}T${form.time}`) < new Date()) { setFeedback({ tone: 'avoid', text: 'Pick a time in the future.' }); return; }
    setEvents((prev) => [{ id: Date.now(), ...form, name, place: form.place.trim(), going: 1, joined: true, mine: true }, ...prev]);
    setForm((f) => ({ ...f, name: f.type === 'other' ? '' : DEFAULT_NAMES[f.type], place: '' }));
    setFeedback({ tone: 'safe', text: `“${name}” posted. You're marked as going.` });
  }

  const toggleJoin = (id) => setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, joined: !ev.joined, going: ev.going + (ev.joined ? -1 : 1) } : ev)));
  const remove = (id) => setEvents((prev) => prev.filter((ev) => ev.id !== id));
  const reschedule = (id) => {
    if (!bestSlot) return;
    const d = new Date(bestSlot.fullTime);
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, date: bestSlot.fullTime.slice(0, 10), time: `${String(d.getHours()).padStart(2, '0')}:00` } : ev)));
  };

  const shown = events
    .filter((ev) => new Date(`${ev.date}T${ev.time}`) > new Date(Date.now() - 3 * 3600000))
    .filter((ev) => filter === 'all' || (filter === 'today' ? ev.date === dayKey(0) : filter === 'tomorrow' ? ev.date === dayKey(1) : ev.joined))
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  return (
    <section className="view active">
      <div className="head-row">
        <div>
          <p className="eyebrow">Community corner</p>
          <h1>Campus activity board</h1>
          <p className="sub">Plan group activities with the air-quality forecast for <b>{data?.fullLocation || location}</b> built in.</p>
        </div>
        <div className="updated">{events.length} activities · saved in this browser</div>
      </div>

      <div className="grid two-col board-grid">
        <form className="card panel board-form" onSubmit={addEvent}>
          <h2>Post an activity</h2>
          <p>See the predicted AQI for your chosen time before you post.</p>

          <div className="board-types" role="radiogroup" aria-label="Activity type">
            {Object.entries(TYPES).map(([key, t]) => (
              <button key={key} type="button" role="radio" aria-checked={form.type === key} className={form.type === key ? 'on' : ''} onClick={() => pickType(key)}>
                <span aria-hidden="true">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          <div className="board-fields">
            <div className="field wide"><label htmlFor="evName">Activity name</label><input id="evName" ref={nameRef} value={form.name} onChange={update('name')} placeholder={form.type === 'other' ? 'Write your own activity, e.g. Yoga in the park' : 'e.g. Evening football practice'} maxLength={65} /></div>
            <div className="field"><label htmlFor="evDate">Date</label><input id="evDate" type="date" min={dayKey(0)} value={form.date} onChange={update('date')} /></div>
            <div className="field"><label htmlFor="evTime">Start time</label><input id="evTime" type="time" value={form.time} onChange={update('time')} /></div>
            <div className="field wide"><label htmlFor="evPlace">Meeting point <span className="opt">(optional)</span></label><input id="evPlace" value={form.place} onChange={update('place')} placeholder="e.g. Sports ground" maxLength={40} /></div>
          </div>

          <div className={`board-preview tone-${preview?.tone || 'none'}`}>
            {preview?.aqi ? (
              <>
                <b style={{ background: getAqiLevel(preview.aqi).gaugeColor }}>{preview.aqi}</b>
                <span><strong>Predicted AQI · {getAqiLevel(preview.aqi).category}</strong>{preview.text}{preview.tone !== 'safe' && bestSlot ? ` · cleaner at ${new Date(bestSlot.fullTime).toLocaleTimeString('en-IN', { hour: 'numeric' })} (AQI ${bestSlot.aqi})` : ''}</span>
              </>
            ) : (
              <span>{preview?.past ? 'That time has already passed.' : 'Forecast available for the next 24 hours. Pick a time within that range to see the predicted AQI.'}</span>
            )}
          </div>

          <button className="primary board-submit" type="submit">Post activity</button>
          {feedback && <div className={`board-feedback tone-${feedback.tone}`}>{feedback.text}</div>}
        </form>

        <div className="card panel">
          <div className="board-list-head">
            <h2>Upcoming activities</h2>
            <div className="board-filters">
              {[['all', 'All'], ['today', 'Today'], ['tomorrow', 'Tomorrow'], ['joined', 'Joined']].map(([k, l]) => (
                <button key={k} type="button" className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="board-list">
            {shown.length === 0 && <p className="board-empty">No activities here yet. Post one!</p>}
            {shown.map((ev) => {
              const t = TYPES[ev.type] || TYPES.walk;
              const f = forecastFor(ev, hourly);
              const v = f?.aqi ? verdict(f.aqi, t.strenuous) : null;
              const lvl = f?.aqi ? getAqiLevel(f.aqi) : null;
              return (
                <article key={ev.id} className={`board-event tone-${v?.tone || 'none'}`}>
                  <span className="board-icon" aria-hidden="true">{t.icon}</span>
                  <div className="board-info">
                    <b>{ev.name}</b>
                    <small>{formatWhen(ev)}{ev.place ? ` · 📍 ${ev.place}` : ''}</small>
                    <small className="board-going">👥 {ev.going} going{ev.mine ? ' · posted by you' : ''}</small>
                  </div>
                  <div className="board-air">
                    {lvl ? (
                      <>
                        <span className="board-aqi" style={{ color: lvl.gaugeColor, borderColor: lvl.gaugeColor }}>AQI {f.aqi}</span>
                        <small>{v.text}</small>
                        {v.tone !== 'safe' && ev.mine && bestSlot && <button type="button" className="board-link" onClick={() => reschedule(ev.id)}>Move to cleaner time</button>}
                      </>
                    ) : (
                      <small className="board-na">Forecast soon</small>
                    )}
                  </div>
                  <div className="board-actions">
                    <button type="button" className={`board-join ${ev.joined ? 'on' : ''}`} onClick={() => toggleJoin(ev.id)}>{ev.joined ? '✓ Going' : 'Join'}</button>
                    {ev.mine && <button type="button" className="board-del" onClick={() => remove(ev.id)} aria-label={`Delete ${ev.name}`}>✕</button>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
