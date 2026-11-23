import { useEffect, useRef, useState } from 'react';
import { cityNames } from '../data/airQualityData.js';
import { getInitials } from '../utils/aqi.js';

export default function Header({
  user,
  selectedCity,
  onCityChange,
  searchValue,
  onSearchValueChange,
  onSearch,
  onUseLocation,
  locationFeedback,
  onOpenProfile,
  isSidebarOpen,
  onToggleSidebar,
  themeMode,
  onToggleThemeMode,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const skipNext = useRef(false);

  // Debounced place suggestions from Open-Meteo geocoding
  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return undefined; }
    const q = searchValue.trim();
    if (q.length < 2) { setSuggestions([]); setOpen(false); return undefined; }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`, { signal: ctrl.signal });
        const data = await res.json();
        const list = (data.results || []).map((r) => ({
          id: r.id,
          name: r.name,
          detail: [r.admin1, r.country].filter(Boolean).join(', '),
          code: r.country_code,
        }));
        setSuggestions(list);
        setActive(-1);
        setOpen(true);
      } catch { /* aborted or offline */ }
    }, 250);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [searchValue]);

  function choose(item) {
    skipNext.current = true;
    onSearchValueChange(item.name);
    setOpen(false);
    setSuggestions([]);
    onSearch(item.name);
  }

  function handleKeyDown(event) {
    if (open && suggestions.length) {
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => (i + 1) % suggestions.length); return; }
      if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1)); return; }
      if (event.key === 'Escape') { setOpen(false); return; }
      if (event.key === 'Enter' && active >= 0) { event.preventDefault(); choose(suggestions[active]); return; }
    }
    if (event.key === 'Enter') { setOpen(false); onSearch(); }
  }

  return (
    <header className="topbar">
      <div className="brand-group">
        <button
          className="sidebar-toggle-btn"
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          title={isSidebarOpen ? 'Dissolve / hide sidebar' : 'Show sidebar'}
        >
          {isSidebarOpen ? '⇤' : '☰'}
        </button>
        <div className="brand">
          <div className="brand-mark">≋</div>
          <div>Breath<span>Air</span></div>
        </div>
      </div>

      <div className="search-center">
          <div className="location-search">
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              autoComplete="off"
              role="combobox"
              aria-expanded={open}
              aria-controls="place-suggestions"
              placeholder="Search city or area…"
              aria-label="Search for a location"
            />
            <button className="primary" type="button" onClick={() => { setOpen(false); onSearch(); }}>Search</button>
            <button className="locate-btn" type="button" onClick={onUseLocation} aria-label="Use my live location" title="Use my live location">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </button>
          </div>
          {open && suggestions.length > 0 && (
            <ul className="suggest-list" id="place-suggestions" role="listbox">
              {suggestions.map((item, i) => (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? 'active' : ''}
                  onMouseDown={(e) => { e.preventDefault(); choose(item); }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="suggest-pin" aria-hidden="true">📍</span>
                  <span className="suggest-text"><b>{item.name}</b><small>{item.detail}</small></span>
                  {item.code && <span className="suggest-code">{item.code}</span>}
                </li>
              ))}
            </ul>
          )}
          <p className={`location-feedback ${locationFeedback.error ? 'error' : ''}`} aria-live="polite">
            {locationFeedback.message}
          </p>
      </div>

      <div className="top-right">

        <label className="select-wrap">
          ⌖{' '}
          <select value={selectedCity} onChange={(event) => onCityChange(event.target.value)} aria-label="Quick select city">
            {(selectedCity && !cityNames.includes(selectedCity) ? [selectedCity, ...cityNames] : cityNames)
              .map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>

        <button
          className="theme-mode-btn"
          type="button"
          onClick={onToggleThemeMode}
          aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="theme-mode-icon">{themeMode === 'dark' ? '☀️' : '🌙'}</span>
          <span className="theme-mode-text">{themeMode === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        <button className="profile-trigger" type="button" onClick={onOpenProfile} aria-label="Open user profile">
          <span className="avatar">{getInitials(user?.name)}</span>
          <span className="profile-trigger-name">{user?.name?.split(' ')[0] || 'Guest'}</span>
          <span className="chevron">⌄</span>
        </button>
      </div>
    </header>
  );
}
