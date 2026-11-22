import { getInitials } from '../utils/aqi.js';

export default function ProfileModal({ user, location, onClose, onLogout }) {
  if (!user) return null;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="profileTitle" onClick={onClose}>
      <div className="profile-card" onClick={(event) => event.stopPropagation()}>
        <div className="profile-heading">
          <div className="profile-large-avatar">{getInitials(user.name)}</div>
          <div>
            <p className="eyebrow">Your account</p>
            <h2 id="profileTitle">User profile</h2>
            <p className="profile-meta">{user.email}</p>
          </div>
        </div>
        <div className="profile-details">
          <div className="profile-detail"><span>Name</span><b>{user.name}</b></div>
          <div className="profile-detail"><span>Email</span><b>{user.email}</b></div>
          <div className="profile-detail"><span>Preferred location</span><b>{location}</b></div>
          <div className="profile-detail"><span>Account</span><b>Preview profile</b></div>
        </div>
        <div className="profile-actions">
          <button className="secondary" type="button" onClick={onClose}>Close</button>
          <button className="primary" type="button" onClick={onLogout}>Sign out</button>
        </div>
        <p className="auth-note">Your name and email are stored only in this browser for this demo. This is not a real user account system.</p>
      </div>
    </div>
  );
}
