import { useState } from 'react';

export default function LoginModal({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      setError('Please enter a valid name, email and password (at least 6 characters).');
      return;
    }
    onLogin({ name: name.trim(), email: email.trim() });
    setPassword('');
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand"><div className="brand-mark">≋</div><div>Air<span style={{ color: '#167d70' }}>Aware</span></div></div>
        <p className="eyebrow">Your local air companion</p>
        <h1 id="loginTitle">Welcome back.</h1>
        <p className="auth-copy">Sign in to explore your dashboard, view your profile, and check sample air-quality information for searched locations.</p>

        <div className="auth-fields">
          <label>Your name
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="e.g. Aditi Sharma" maxLength={50} required />
          </label>
          <label>Email address
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required />
          </label>
          <label>Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Enter any 6+ characters" minLength={6} required />
          </label>
        </div>

        {error && <div className="auth-error show" role="alert">{error}</div>}
        <button className="primary auth-submit" type="submit">Sign in to AirAware →</button>
        <p className="auth-note">Prototype sign-in only: this does not create a real account or securely authenticate users. Passwords are not saved. A production login needs a secure backend.</p>
      </form>
    </div>
  );
}
