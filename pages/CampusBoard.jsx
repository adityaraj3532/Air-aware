import { useState } from 'react';

const startingEvents = [
  { id: 1, name: 'Morning campus walk', time: '08:00 AM', label: 'Sample event' },
  { id: 2, name: 'Green club meet-up', time: '04:00 PM', label: 'Sample event' },
];

export default function CampusBoard() {
  const [eventName, setEventName] = useState('');
  const [eventTime, setEventTime] = useState('08:00 AM');
  const [events, setEvents] = useState(startingEvents);
  const [feedback, setFeedback] = useState('');

  function addEvent() {
    const cleanName = eventName.trim();
    if (!cleanName) {
      setFeedback('Please enter an activity name.');
      return;
    }
    setEvents((previous) => [{ id: Date.now(), name: cleanName, time: eventTime, label: 'Added in this browser' }, ...previous]);
    setEventName('');
    setFeedback('Activity added to this preview.');
  }

  return (
    <section className="view active">
      <div className="head-row"><div><p className="eyebrow">Community corner</p><h1>Campus activity board</h1><p className="sub">Post a sample event and see how activity planning could use air-quality context.</p></div><div className="updated">Saved in this browser preview</div></div>
      <div className="grid two-col">
        <div className="card panel">
          <h2>Add a campus activity</h2>
          <p>Share a walk, sports session, or campus event with your community.</p>
          <div className="form-row">
            <div className="field"><label htmlFor="eventName">Activity name</label><input id="eventName" value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="e.g. Evening football practice" maxLength={65} /></div>
            <div className="field"><label htmlFor="eventTime">Start time</label><select id="eventTime" value={eventTime} onChange={(event) => setEventTime(event.target.value)}><option>08:00 AM</option><option>10:00 AM</option><option>12:00 PM</option><option>04:00 PM</option><option>06:00 PM</option></select></div>
            <button className="primary" type="button" onClick={addEvent}>Add activity</button>
          </div>
          {feedback && <div className="result show">{feedback}</div>}
        </div>
        <div className="card panel">
          <h2>Community activities</h2>
          <p>These are locally entered preview events, not official campus listings.</p>
          <div className="event-list">
            {events.map((event) => <div className="event" key={event.id}><div><b>{event.name}</b><small>{event.time} · {event.label}</small></div><span className="aqi-chip">Check AQI</span></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
