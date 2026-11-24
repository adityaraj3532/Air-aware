# AirAware

**AirAware** is an air-quality dashboard for Indian cities. It shows live AQI, finds the cleanest time to go outside, and explains what the numbers mean for your health.

Search any city to get live India-AQI readings, a neighbourhood pollution map, hourly and weekly forecasts, weather, and practical guidance on what to do.

---

## Features

### Live Monitoring
- **Live AQI card:** India National AQI calculated from PM2.5, PM10 and NO₂, along with O₃, SO₂ and CO readings.
- **AirBuddy:** an animated character that reacts to the air. It smiles when the air is clean and coughs, masks up or gets dizzy as AQI rises.
- **Regional AQI map:** a dark street map centred on the searched city. It shows one live AQI bubble per air-quality model cell (about 40 km wide) across a ~130 km area.
- **National map:** an India state map coloured by AQI, with a ranked list of states and UTs.
- **Health advisory:** the current level on a colour scale, plus a 7-day trend chart you can show or hide.
- **Guidance:** tips grouped into **Safe**, **Caution** and **Avoid**, with the group for the current level highlighted.

### Search & location
- Centred search bar that suggests places as you type.
- One-tap **live location** button.
- The quick city picker follows whatever city you search.

### Outdoor planner
- Pick an activity (walk, run, cycle, sports, commute) and a duration.
- Suggests the cleanest time window **only within sensible hours** for that activity: daylight for cycling, and away from midday heat for workouts.
- A 24-hour timeline highlights the suggested window, with two alternatives.

### Campus activity board
- Post group activities with a type, date, time and meeting point.
- See the **predicted AQI** for that time before posting.
- Join, filter (Today / Tomorrow / Joined), delete your own posts, or move one to a cleaner time.
- Activities are saved in your browser.

### Air insights
- Live **weather** card: temperature, condition, humidity, wind and UV.
- Air-quality card with the main pollutants.
- Cleanest and most polluted hours, a scrollable 24-hour strip, and the 7-day trend.
- Download an air report as CSV.

### Learn
- Clickable AQI scale explaining the health effects of each band and what to do.
- Cards for the six pollutants (PM2.5, PM10, NO₂, O₃, SO₂, CO) with their sources.
- How high AQI affects the body, plus common myths and facts.

### General
- Light and dark mode.
- Responsive layout for desktop, tablet and phone.
- **Optional** login. Every feature works without an account.

---

## Tech stack

| Area | Tools |
|---|---|
| UI | React 18, Vite 6 |
| Maps | Leaflet 1.9 with OpenStreetMap tiles; `@svg-maps/india` |
| Charts | Hand-built SVG (no chart library) |
| Styling | Plain CSS with theme variables (light / dark) |

### Data sources (free, no API key)
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api): pollutants and hourly forecast
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs): weather
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api): city search and suggestions
- [OpenStreetMap](https://www.openstreetmap.org/copyright): map tiles
- [BigDataCloud reverse geocoding](https://www.bigdatacloud.com/): city name for the live-location button

AQI is calculated with **CPCB India National AQI** breakpoints.

---

## Getting started

Requires **Node.js 18+**.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build |

---

## Project structure

```
├── index.html            # App entry (loads main.jsx)
├── main.jsx              # React root
├── App.jsx               # Layout, routing between pages, shared state
├── index.css             # All styles and theme variables
├── components/
│   ├── Header.jsx        # Search, suggestions, location, theme, login
│   ├── Sidebar.jsx
│   ├── AqiGauge.jsx
│   ├── AirBuddy.jsx      # Animated AQI character
│   ├── CityAqiMap.jsx    # Leaflet neighbourhood AQI map
│   ├── IndiaAirMap.jsx   # State-level India map
│   ├── WeekTrend.jsx     # 7-day line chart
│   ├── WeatherCard.jsx   # Live weather
│   ├── LoginModal.jsx
│   └── ProfileModal.jsx
├── pages/
│   ├── Overview.jsx
│   ├── Planner.jsx
│   ├── Compare.jsx
│   ├── CampusBoard.jsx
│   ├── Insights.jsx
│   └── Learn.jsx
├── services/
│   └── airQualityService.js   # Open-Meteo fetch + India AQI calculation
├── utils/
│   └── aqi.js            # AQI levels, colours, categories
└── data/
    └── airQualityData.js # Sample/fallback data
```

The older `app.js`, `insights.js`, `planning.js`, `style.css` and `vendor/` files belong to the earlier single-page version and are not used by the React app.

---

## Notes

- **The login is a prototype.** Nothing is sent to a server and passwords are not stored. A real deployment needs a secure backend.
- **Campus activities** are stored in `localStorage`, so they only appear in your own browser.
- **Forecasts** are model estimates from Open-Meteo, not official station readings.
