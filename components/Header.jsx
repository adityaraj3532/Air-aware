import { cityNames } from '../data/airQualityData.js';
import { getInitials } from '../utils/aqi.js';

export default function Header({
  user, selectedCity, onCityChange, searchValue, onSearchValueChange,
  onSearch, locationFeedback, onOpenProfile,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">≋</div>
        <div>Air<span>Aware</span></div>
      </div>

      <div className="top-right">
        

        <div>
          <div className="location-search">
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && onSearch()}
              placeholder="Search city or area…"
              aria-label="Search for a location"
            />
            <button className="primary" type="button" onClick={onSearch}>Search</button>
          </div>
          <p className={`location-feedback ${locationFeedback.error ? 'error' : ''}`} aria-live="polite">{locationFeedback.message}</p>
        </div>

        <label className="select-wrap">
          ⌖{' '}
          <select value={selectedCity} onChange={(event) => onCityChange(event.target.value)} aria-label="Quick select city">
            {cityNames.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>

        <button className="profile-trigger" type="button" onClick={onOpenProfile} aria-label="Open user profile">
          <span className="avatar">{getInitials(user?.name)}</span>
          <span className="profile-trigger-name">{user?.name?.split(' ')[0] || 'Guest'}</span>
          <span className="chevron">⌄</span>
        </button>
      </div>
    </header>
  );
}
