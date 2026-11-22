import { useState } from 'react';
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
  const [activePage, setActivePage] = useState('overview');
  const [selectedCity, setSelectedCity] = useState('Jaipur');
  const [activeLocation, setActiveLocation] = useState('Jaipur');
  const [activeData, setActiveData] = useState(cityData.Jaipur);
  const [searchValue, setSearchValue] = useState('');
  const [locationFeedback, setLocationFeedback] = useState({ message: '', error: false });

  function navigate(page) {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function selectCity(city) {
    const data = cityData[city];
    if (!data) return;
    setSelectedCity(city);
    setActiveLocation(city);
    setActiveData(data);
    setSearchValue('');
    setLocationFeedback({ message: `Showing illustrative sample AQI for ${city}. This is not live data.`, error: false });
  }

  function searchLocation() {
    const raw = searchValue.trim();
    if (!raw) {
      setLocationFeedback({ message: 'Enter a city or area name to search.', error: true });
      return;
    }

    const key = raw.toLowerCase().replace(/\s+/g, ' ');
    const cityMatch = Object.keys(cityData).find((city) => city.toLowerCase() === key);
    if (cityMatch) {
      setSelectedCity(cityMatch);
      setActiveLocation(cityMatch);
      setActiveData(cityData[cityMatch]);
      setLocationFeedback({ message: `Showing illustrative sample AQI for ${cityMatch}. This is not live data.`, error: false });
      return;
    }

    const localMatch = localLocations[key];
    if (localMatch) {
      setSelectedCity(localMatch.city);
      setActiveLocation(localMatch.label || raw);
      setActiveData(localMatch.data);
      setLocationFeedback({ message: `Showing illustrative sample AQI for ${localMatch.label || raw}, ${localMatch.city}. This is not a live local measurement.`, error: false });
      return;
    }

    const partialMatch = Object.keys(cityData).find((city) => city.toLowerCase().includes(key) || key.includes(city.toLowerCase()));
    if (partialMatch) {
      setSelectedCity(partialMatch);
      setActiveLocation(partialMatch);
      setActiveData(cityData[partialMatch]);
      setLocationFeedback({ message: `Showing illustrative sample AQI for ${partialMatch}. This is not live data.`, error: false });
      return;
    }

    setLocationFeedback({
      message: `No sample AQI is available for “${raw}”. Try Jaipur, Delhi, Mumbai, Pune, or JECRC University.`,
      error: true,
    });
  }

  function handleLogin(nextUser) {
    setUser(nextUser);
    try {
      window.localStorage.setItem('airawareDemoUser', JSON.stringify(nextUser));
    } catch {
      // The demo still works for this browser session if local storage is blocked.
    }
  }

  function handleLogout() {
    try {
      window.localStorage.removeItem('airawareDemoUser');
    } catch {
      // Ignore storage errors in this front-end-only demo.
    }
    setUser(null);
    setShowProfile(false);
  }

  let currentPage;
  switch (activePage) {
    case 'planner':
      currentPage = <Planner location={activeLocation} />;
      break;
    case 'compare':
      currentPage = <Compare activeCity={selectedCity} activeLocation={activeLocation} activeData={activeData} />;
      break;
    case 'campus':
      currentPage = <CampusBoard />;
      break;
    case 'insights':
      currentPage = <Insights data={activeData} location={activeLocation} />;
      break;
    case 'learn':
      currentPage = <Learn />;
      break;
    case 'overview':
    default:
      currentPage = <Overview data={activeData} location={activeLocation} onNavigate={navigate} />;
  }

  return (
    <>
      <Header
        user={user}
        selectedCity={selectedCity}
        onCityChange={selectCity}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        onSearch={searchLocation}
        locationFeedback={locationFeedback}
        onOpenProfile={() => setShowProfile(true)}
      />

      <div className="layout">
        <Sidebar activePage={activePage} onNavigate={navigate} />
        <main className="main">{currentPage}</main>
      </div>

      {!user && <LoginModal onLogin={handleLogin} />}
      {showProfile && user && (
        <ProfileModal
          user={user}
          location={activeLocation}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
