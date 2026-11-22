const pollutants = [
  { label: 'Particulate matter', title: 'PM2.5', text: 'Very small airborne particles. They can travel deep into the respiratory system. Concentration is usually shown in µg/m³.' },
  { label: 'Particulate matter', title: 'PM10', text: 'Particles that include dust, pollen, and other airborne material. They are larger on average than PM2.5 particles.' },
  { label: 'Gas', title: 'Nitrogen dioxide (NO₂)', text: 'A gas associated with fuel combustion, including emissions from vehicles and some industrial activity.' },
  { label: 'Gas', title: 'Ground-level ozone (O₃)', text: 'Forms near the ground when other pollutants react in sunlight. It is different from the protective ozone layer high in the atmosphere.' },
];

const categories = [
  ['0–50', 'Good', 'Low', 'good'],
  ['51–100', 'Satisfactory', 'Fair', 'good'],
  ['101–200', 'Moderate', 'Moderate', ''],
  ['201–300', 'Poor', 'Poor', 'poor'],
  ['301–400', 'Very Poor', 'Very poor', 'poor'],
  ['401–500', 'Severe', 'Severe', 'poor'],
];

export default function Learn() {
  return (
    <section className="view active">
      <div className="head-row"><div><p className="eyebrow">Air quality basics</p><h1>Learn about your air</h1><p className="sub">Understand common pollutants and what AQI categories mean.</p></div><div className="updated">Simple explainers</div></div>
      <div className="grid learn-grid">
        {pollutants.map((item) => <article className="card learn-card" key={item.title}><span className="mini-label">{item.label}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}
      </div>
      <div className="card panel" style={{ marginTop: 17 }}>
        <h2>India's National AQI categories</h2>
        <p>These are the six category bands used in India's National AQI system.</p>
        <table className="data-table"><thead><tr><th>AQI range</th><th>Category</th><th>Colour guide</th></tr></thead><tbody>
          {categories.map(([range, category, guide, colour]) => <tr key={range}><td>{range}</td><td>{category}</td><td><span className={`aqi-chip ${colour}`}>{guide}</span></td></tr>)}
        </tbody></table>
        <p className="footer-note">AQI is not the same thing as a pollutant concentration. Calculating official AQI requires pollutant-specific sub-indices.</p>
      </div>
    </section>
  );
}
