import { useState } from 'react';
import { AQI_LEVELS } from '../utils/aqi.js';

const POLLUTANTS = [
  {
    icon: '🫁', code: 'PM2.5', name: 'Fine particles', size: '≤ 2.5 µm · ~30× thinner than a hair', color: '#e11d48',
    text: 'So tiny they slip past your nose, reach deep into the lungs and enter the bloodstream, causing inflammation across the body.',
    sources: ['Vehicle exhaust', 'Crop burning', 'Industry', 'Wood & coal fires'],
  },
  {
    icon: '🌫️', code: 'PM10', name: 'Coarse particles', size: '≤ 10 µm · dust & pollen', color: '#d97706',
    text: 'Get trapped in the nose, throat and upper airways, triggering coughing, a burning throat and itchy eyes.',
    sources: ['Road dust', 'Construction', 'Pollen', 'Mining'],
  },
  {
    icon: '🚗', code: 'NO₂', name: 'Nitrogen dioxide', size: 'Reddish-brown toxic gas', color: '#7c3aed',
    text: 'Inflames the airways, worsens asthma in children and makes the lungs more vulnerable to infection.',
    sources: ['Traffic', 'Power plants', 'Boilers'],
  },
  {
    icon: '☀️', code: 'O₃', name: 'Ground-level ozone', size: 'Forms in strong sunlight', color: '#0284c7',
    text: 'A strong oxidiser that irritates lung tissue, causing chest tightness, wheezing and reduced lung capacity, worst on hot afternoons.',
    sources: ['Sunlight + traffic fumes', 'Solvents'],
  },
  {
    icon: '🏭', code: 'SO₂', name: 'Sulphur dioxide', size: 'Sharp-smelling gas', color: '#65a30d',
    text: 'Irritates the nose and throat, constricts airways within minutes and contributes to acid rain and fine particles.',
    sources: ['Coal power', 'Refineries', 'Smelters'],
  },
  {
    icon: '🔥', code: 'CO', name: 'Carbon monoxide', size: 'Colourless, odourless', color: '#475569',
    text: 'Binds to blood haemoglobin about 200× more strongly than oxygen, starving the brain and heart of oxygen.',
    sources: ['Traffic jams', 'Indoor stoves', 'Generators'],
  },
];

const IMPACTS = [
  { icon: '🫁', title: 'Lungs & breathing', text: 'Airway spasms, asthma attacks, bronchitis flare-ups and long-term loss of lung function.' },
  { icon: '❤️', title: 'Heart & blood', text: 'Particles in the blood raise inflammation and blood pressure, multiplying heart attack and stroke risk.' },
  { icon: '🧠', title: 'Brain & oxygen', text: 'CO and fine particles reduce oxygen supply, causing headaches, fatigue and poorer concentration.' },
  { icon: '👶', title: 'Most at risk', text: 'Children, the elderly, pregnant women and outdoor workers face the highest long-term harm.' },
];

const LEVEL_INFO = {
  good: { health: 'Minimal impact. Air is clean.', action: 'Enjoy outdoor activities freely.' },
  satisfactory: { health: 'Minor breathing discomfort for very sensitive people.', action: 'Normal activities are fine.' },
  moderate: { health: 'Discomfort for people with asthma, lung or heart disease, children and the elderly.', action: 'Sensitive groups should reduce long outdoor exertion.' },
  poor: { health: 'Breathing discomfort for most people on prolonged exposure.', action: 'Limit outdoor exercise; wear an N95 outdoors.' },
  'very-poor': { health: 'Respiratory illness on prolonged exposure.', action: 'Stay indoors where possible; run air purifiers.' },
  severe: { health: 'Affects healthy people and seriously harms those with existing disease.', action: 'Avoid all outdoor activity; keep windows sealed.' },
};

const MYTHS = [
  { myth: 'If I can’t see smog, the air is clean.', fact: 'PM2.5 is invisible. Even clear-looking days can have unhealthy AQI.' },
  { myth: 'Cloth masks protect me from pollution.', fact: 'Only well-fitted N95/FFP2 masks filter fine particles effectively.' },
  { myth: 'Indoor air is always safer.', fact: 'Cooking smoke, incense and poor ventilation can make indoor air worse than outside.' },
];

export default function Learn() {
  const [selected, setSelected] = useState(AQI_LEVELS[2].key);
  const sel = AQI_LEVELS.find((l) => l.key === selected);

  return (
    <section className="view active">
      <div className="head-row">
        <div>
          <p className="eyebrow">Air quality basics</p>
          <h1>Learn about your air</h1>
          <p className="sub">What you are breathing, how it affects your health, and what the AQI numbers mean.</p>
        </div>
        <div className="updated">📘 Health guide</div>
      </div>

      {/* AQI scale explorer */}
      <div className="card lr-scale" style={{ '--sel': sel.gaugeColor }}>
        <div className="lr-head">
          <h2>India's AQI scale</h2>
          <small>Tap a band to learn what it means</small>
        </div>
        <div className="lr-bands" role="tablist">
          {AQI_LEVELS.map((l) => (
            <button key={l.key} type="button" role="tab" aria-selected={selected === l.key}
              className={selected === l.key ? 'on' : ''} style={{ '--c': l.gaugeColor }} onClick={() => setSelected(l.key)}>
              <b>{l.range}</b><span>{l.category}</span>
            </button>
          ))}
        </div>
        <div className="lr-detail" key={sel.key}>
          <span className="lr-detail-badge">{sel.range}</span>
          <div>
            <h3>{sel.category} <small>· {sel.colorName}</small></h3>
            <p><b>Health:</b> {LEVEL_INFO[sel.key]?.health}</p>
            <p><b>What to do:</b> {LEVEL_INFO[sel.key]?.action}</p>
          </div>
        </div>
      </div>

      {/* Pollutants */}
      <div className="section-title"><h2>The six pollutants behind the AQI</h2></div>
      <div className="lr-pollutants">
        {POLLUTANTS.map((p) => (
          <article key={p.code} className="card lr-poll" style={{ '--p': p.color }}>
            <div className="lr-poll-top">
              <span className="lr-poll-icon" aria-hidden="true">{p.icon}</span>
              <div>
                <b className="lr-code">{p.code}</b>
                <small>{p.name}</small>
              </div>
            </div>
            <span className="lr-size">{p.size}</span>
            <p>{p.text}</p>
            <div className="lr-sources">
              {p.sources.map((s) => <span key={s}>{s}</span>)}
            </div>
          </article>
        ))}
      </div>

      {/* Health impact */}
      <div className="card lr-hazard">
        <span className="lr-hazard-tag">⚠ Critical health hazard</span>
        <h2>How high AQI harms your body</h2>
        <p className="lr-hazard-sub">When AQI goes above 200 (Poor, Very Poor or Severe), the mix of toxic gases and fine particles causes both immediate and long-term damage.</p>
        <div className="lr-impacts">
          {IMPACTS.map((it) => (
            <div key={it.title} className="lr-impact">
              <span aria-hidden="true">{it.icon}</span>
              <b>{it.title}</b>
              <p>{it.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Myths vs facts */}
      <div className="section-title"><h2>Myth vs fact</h2></div>
      <div className="lr-myths">
        {MYTHS.map((m) => (
          <div key={m.myth} className="card lr-myth">
            <p className="lr-m"><span>✕ Myth</span>{m.myth}</p>
            <p className="lr-f"><span>✓ Fact</span>{m.fact}</p>
          </div>
        ))}
      </div>

      <p className="footer-note">
        India's National AQI is the highest sub-index among the measured pollutants. It is not a raw concentration value.
      </p>
    </section>
  );
}
