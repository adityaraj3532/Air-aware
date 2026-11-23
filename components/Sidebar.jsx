const navigation = [
  { id: 'overview', icon: '⌂', label: 'Overview' },
  { id: 'planner', icon: '◷', label: 'Outdoor planner' },
  { id: 'compare', icon: '⇄', label: 'Compare places' },
  { id: 'campus', icon: '▦', label: 'Campus board' },
  { id: 'insights', icon: '⌁', label: 'Air insights' },
  { id: 'learn', icon: '✳', label: 'Learn' },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <p className="nav-label">Explore BreathAir</p>
      {navigation.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-btn ${activePage === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="ico">{item.icon}</span>{item.label}
        </button>
      ))}

      <div className="sidebar-note">
        <strong>Small steps matter</strong>
        <p>Understand your local air.</p>
        <p>Plan thoughtfully outdoors.</p>
        <p>Help your community stay informed.</p>
      </div>
    </aside>
  );
}
