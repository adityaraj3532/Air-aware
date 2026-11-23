import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import LoginModal from './components/LoginModal.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import Overview from './pages/Overview.jsx';
import Planner from './pages/Planner.jsx';
import Compare from './pages/Compare.jsx';
import CampusBoard from './pages/CampusBoard.jsx';
import Insights from './pages/Insights.jsx';
import Learn from './pages/Learn.jsx';
import { cityData, localLocations } from './data/airQualityData.js';
import { fetchLiveAirQuality, getFallbackData } from './services/airQualityService.js';
import { getAqiLevel } from './utils/aqi.js';

function getSavedUser() {
  try {
    const saved = window.localStorage.getItem('airawareDemoUser');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(getSavedUser);
  const [showProfile, setShowProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const [selectedCity, setSelectedCity] = useState('Jaipur');
  const [activeLocation, setActiveLocation] = useState('Jaipur');
  const [activeData, setActiveData] = useState(() => getFallbackData('Jaipur'));
  const [searchValue, setSearchValue] = useState('');
  const [locationFeedback, setLocationFeedback] = useState({ message: 'Fetching live air data...', error: false });
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return window.localStorage.getItem('airaware_theme_mode') || 'light';
    } catch {
      return 'light';
    }
  });

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  function toggleThemeMode() {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem('airaware_theme_mode', next);
      } catch {}
      return next;
    });
  }

  const aqiLevel = getAqiLevel(activeData?.aqi);

  async function loadCityAirQuality(query) {
    setLoading(true);
    setLocationFeedback({ message: `Fetching live air data for ${query}...`, error: false });

    try {
      const live = await fetchLiveAirQuality(query);
      setActiveData(live);
      setActiveLocation(live.location);
      setSelectedCity(live.location);
      setLocationFeedback({
        message: `● Live air quality data updated for ${live.fullLocation}`,
        error: false,
      });
    } catch {
      // Check local sample matches
      const key = query.toLowerCase().trim();
      const localMatch = localLocations[key];
      if (localMatch) {
        setSelectedCity(localMatch.city);
        setActiveLocation(localMatch.label || query);
        setActiveData({ ...getFallbackData(localMatch.city), ...localMatch.data });
        setLocationFeedback({
          message: `Showing campus sample AQI for ${localMatch.label || query}.`,
          error: false,
        });
      } else {
        const fallback = getFallbackData(query);
        setActiveData(fallback);
        setActiveLocation(fallback.location);
        setLocationFeedback({
          message: `Showing sample data for ${query}. Check internet connection for live updates.`,
          error: false,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  // Fetch live air quality on initial load
  useEffect(() => {
    loadCityAirQuality('Jaipur');
  }, []);

  function navigate(page) {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationFeedback({ message: 'Location is not supported by this browser.', error: true });
      return;
    }
    setLocationFeedback({ message: 'Finding your location…', error: false });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`);
          const place = await res.json();
          const name = place.city || place.locality || place.principalSubdivision;
          if (!name) throw new Error('no place');
          setSearchValue('');
          loadCityAirQuality(name);
        } catch {
          setLocationFeedback({ message: 'Could not identify your city. Please search manually.', error: true });
        }
      },
      () => setLocationFeedback({ message: 'Location permission denied. Search for your city instead.', error: true }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function selectCity(city) {
    setSelectedCity(city);
    setSearchValue('');
    loadCityAirQuality(city);
  }

  function searchLocation(query) {
    const raw = (typeof query === 'string' ? query : searchValue).trim();
    if (!raw) {
      setLocationFeedback({ message: 'Enter a city or area name to search.', error: true });
      return;
    }
    loadCityAirQuality(raw);
  }

  function handleLogin(nextUser) {
    setUser(nextUser);
    setShowLogin(false);
    try {
      window.localStorage.setItem('airawareDemoUser', JSON.stringify(nextUser));
    } catch {
      // Works for session if storage is blocked
    }
  }

  function handleLogout() {
    try {
      window.localStorage.removeItem('airawareDemoUser');
    } catch {
      // Ignore storage errors
    }
    setUser(null);
    setShowProfile(false);
  }

  let currentPage;
  switch (activePage) {
    case 'planner':
      currentPage = <Planner location={activeLocation} data={activeData} />;
      break;
    case 'compare':
      currentPage = <Compare activeCity={selectedCity} activeLocation={activeLocation} activeData={activeData} />;
      break;
    case 'campus':
      currentPage = <CampusBoard data={activeData} location={activeLocation} />;
      break;
    case 'insights':
      currentPage = <Insights data={activeData} location={activeLocation} />;
      break;
    case 'learn':
      currentPage = <Learn />;
      break;
    case 'overview':
    default:
      currentPage = (
        <Overview
          data={activeData}
          location={activeLocation}
          onNavigate={navigate}
          onSelectCity={selectCity}
        />
      );
  }

  return (
    <div className={`app-container mode-${themeMode} theme-${aqiLevel.key}`}>
      <Header
        user={user}
        selectedCity={selectedCity}
        onCityChange={selectCity}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        onSearch={searchLocation}
        onUseLocation={useMyLocation}
        locationFeedback={locationFeedback}
        onOpenProfile={() => setShowProfile(true)}
        onOpenLogin={() => setShowLogin(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        themeMode={themeMode}
        onToggleThemeMode={toggleThemeMode}
      />

      <div className={`layout ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
        {!isSidebarOpen && (
          <button
            type="button"
            className="sidebar-floating-toggle"
            onClick={toggleSidebar}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            ⇥
          </button>
        )}
        <Sidebar
          activePage={activePage}
          onNavigate={navigate}
        />
        <main className="main">{currentPage}</main>
      </div>

      {showLogin && !user && <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}
      {showProfile && user && (
        <ProfileModal
          user={user}
          location={activeLocation}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
