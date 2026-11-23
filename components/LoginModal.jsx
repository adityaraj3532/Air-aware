import { useEffect, useState } from 'react';

export default function LoginModal({ onLogin, onClose }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="loginTitle" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <form className="auth-card" onSubmit={handleSubmit}>
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close login">✕</button>
        <div className="auth-brand"><div className="brand-mark">≋</div><div>Breath<span style={{ color: '#167d70' }}>Air</span></div></div>
        <p className="eyebrow">Your local air companion</p>
        <h1 id="loginTitle">Welcome back.</h1>
        <p className="auth-copy">Sign in to save your profile. It's optional: every feature works without an account.</p>

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
        <button className="primary auth-submit" type="submit">Sign in to BreathAir →</button>
        <button type="button" className="auth-skip" onClick={onClose}>Continue as guest</button>
        <p className="auth-note">Prototype sign-in only: this does not create a real account or securely authenticate users. Passwords are not saved. A production login needs a secure backend.</p>
      </form>
    </div>
  );
}
