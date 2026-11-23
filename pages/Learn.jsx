import { AQI_LEVELS } from '../utils/aqi.js';

const pollutants = [
  {
    label: 'Particulate matter',
    title: 'PM2.5',
    text: 'Very small airborne particles (≤ 2.5 µm). Because of their microscopic size, they bypass nasal filtration, penetrate deep into the lung alveoli, and enter the bloodstream, triggering widespread vascular inflammation.',
  },
  {
    label: 'Particulate matter',
    title: 'PM10',
    text: 'Inhalable coarse particles (≤ 10 µm) including road dust, construction dust, and pollen. They lodge in the upper respiratory tract and bronchi, triggering persistent coughing, throat burning, and eye irritation.',
  },
  {
    label: 'Combustion Gas',
    title: 'Nitrogen dioxide (NO₂)',
    text: 'A harsh toxic gas emitted by vehicles and industrial boilers. High concentrations cause airway inflammation, exacerbate childhood asthma attacks, and heighten vulnerability to serious respiratory infections.',
  },
  {
    label: 'Photochemical Gas',
    title: 'Ground-level ozone (O₃)',
    text: 'Formed when urban pollutants react in intense sunlight. A strong oxidizer that damages sensitive lung tissue, causing chest tightness, wheezing, shortness of breath, and reduced overall lung capacity.',
  },
  {
    label: 'Critical Health Hazard',
    title: 'How High AQI & Harmful Gases Severely Impact Your Health',
    text: 'When the AQI crosses into Poor, Very Poor, or Severe bands (201–500+), inhaling a mixture of toxic gases (NO₂, SO₂, CO, Ozone) and fine particulates creates immediate and long-term health crises:',
    isFeatured: true,
    points: [
      {
        bold: 'Respiratory System Damage:',
        desc: 'Triggers acute airway spasms, severe asthma attacks, chronic bronchitis flare-ups, and permanent loss of pulmonary lung elasticity.',
      },
      {
        bold: 'Cardiovascular & Heart Risks:',
        desc: 'Microscopic pollutants seep into the bloodstream, increasing arterial inflammation, blood viscosity, and blood pressure, significantly multiplying heart attack and stroke risks.',
      },
      {
        bold: 'Reduced Oxygen Delivery (CO Poisoning):',
        desc: 'Carbon monoxide (CO) binds to blood hemoglobin 200× faster than oxygen, depriving the brain, heart muscles, and vital tissues of vital oxygen.',
      },
      {
        bold: 'High-Risk Vulnerable Groups:',
        desc: 'Children (developing lungs), the elderly, pregnant mothers, and outdoor workers suffer the highest risk of irreversible cognitive and respiratory impairment.',
      },
    ],
  },
];

export default function Learn() {
  return (
    <section className="view active">
      <div className="head-row">
        <div>
          <p className="eyebrow">Air quality basics</p>
          <h1>Learn about your air</h1>
          <p className="sub">Understand common pollutants, toxic gases, and their severe health impacts.</p>
        </div>
        <div className="updated">Health Guide & Categories</div>
      </div>

      <div className="grid learn-grid">
        {pollutants.map((item) => (
          <article
            className="card learn-card"
            key={item.title}
            style={
              item.isFeatured
                ? {
                    gridColumn: '1 / -1',
                    background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 50%, #fff1f2 100%)',
                    border: '1.5px solid #fed7aa',
                    padding: '24px',
                    boxShadow: '0 12px 30px rgba(234, 88, 12, 0.08)',
                  }
                : undefined
            }
          >
            <span
              className="mini-label"
              style={
                item.isFeatured
                  ? {
                      color: '#c2410c',
                      background: '#ffedd5',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      display: 'inline-block',
                      fontWeight: 800,
                    }
                  : undefined
              }
            >
              {item.label}
            </span>
            <h3
              style={
                item.isFeatured
                  ? { fontSize: '18px', color: '#7c2d12', margin: '10px 0 8px', fontWeight: 800 }
                  : undefined
              }
            >
              {item.title}
            </h3>
            <p style={{ lineHeight: 1.6 }}>{item.text}</p>

            {item.points && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  marginTop: '16px',
                }}
              >
                {item.points.map((pt, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255, 255, 255, 0.92)',
                      padding: '13px 15px',
                      borderRadius: '12px',
                      border: '1px solid #fed7aa',
                      fontSize: '12px',
                    }}
                  >
                    <strong style={{ display: 'block', color: '#9a3412', marginBottom: '5px' }}>
                      {pt.bold}
                    </strong>
                    <span style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
                      {pt.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="card panel" style={{ marginTop: 22 }}>
        <h2>India's National AQI Categories & Color Guide</h2>
        <p>The dashboard background dynamically transitions between these six category colors based on your local air quality.</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>AQI range</th>
              <th>Category</th>
              <th>Colour guide</th>
            </tr>
          </thead>
          <tbody>
            {AQI_LEVELS.map((level) => (
              <tr key={level.range}>
                <td><b>{level.range}</b></td>
                <td>{level.category}</td>
                <td>
                  <span className={level.chipClass}>
                    {level.guide}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footer-note">
          AQI is not the same thing as raw pollutant concentration. The official National AQI represents the highest individual sub-index among measured criteria pollutants.
        </p>
      </div>
    </section>
  );
}
