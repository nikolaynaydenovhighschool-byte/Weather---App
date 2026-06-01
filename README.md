# Weather App with Live Radar and Dynamic Backgrounds

A modern, responsive, and interactive Weather Application built as a school project. This app provides real-time weather information for any city worldwide, featuring a live rain radar map and changing background visuals depending on current atmospheric conditions.

## 🚀 Live Demo
*Once you enable GitHub Pages, paste your live link here, for example:*
👉 [View Live Project](https://your-username.github.io/weather-app/)

## ✨ Features
- **Real-Time Weather Data:** Fetches live metrics (temperature, wind speed, weather conditions) from the Open-Meteo API.
- **Interactive Map:** Displays a detailed, colorful OpenStreetMap map zoomed directly onto the searched city using the Leaflet library.
- **Live Rain Radar:** Integrates a real-time rain and precipitation radar layer on top of the map via RainViewer.
- **Dynamic Backgrounds:** The background smoothly transforms into high-quality Unsplash photography (sunny, cloudy, rainy, stormy, or snowy) matching the actual local weather code.
- **Unit Toggle:** Instantly switches temperatures between Celsius (°C) and Fahrenheit (°F) with a single click.
- **Dynamic Time & Date:** Automatically displays the current local retrieval date and time for the requested city.

## 🛠️ Technologies Used
- **HTML5** – Structured app layout, form inputs, and containers.
- **CSS3** – Modern *Glassmorphism* card design, hover animations, and smooth background blend transitions.
- **JavaScript (ES6)** – Asynchronous API data fetching, state management for temperature toggle, and Leaflet map control.
- **Leaflet.js** – Mobile-friendly interactive map engine.
- **Open-Meteo API** – Free geocoding and weather forecast engine.
- **RainViewer Tile API** – Weather radar layer tracking rain clouds in real-time.

## 📁 Project Structure
```text
weather-app/
│
├── index.html       # Application layout and library inclusions
├── style.css        # Glassmorphism theme, animations, and typography
├── script.js        # API handling, map initialization, and background logic
└── README.md        # Documentation and project overview
