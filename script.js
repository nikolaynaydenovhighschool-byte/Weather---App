// Configuration - DOM Elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const weatherInfo = document.querySelector('.weather-info');
const tempDisplay = document.getElementById('temperature');
const loadingDisplay = document.getElementById('loading');
const errorDisplay = document.getElementById('error');
const toggleBtn = document.getElementById('toggle-btn');
const weatherEmoji = document.getElementById('weather-emoji');

let map = null;
let radarLayer = null;

// State Variables
let isCelsius = true; 
let lastTempC = null; 

// WMO Weather Codes to English Descriptions
function getWeatherDescription(code) {
    const weatherMapping = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    };
    return weatherMapping[code] || "Unknown weather";
}

// Change Background Based on Weather Code
function changeBackgroundByWeather(weatherCode) {
    let imageUrl = "";

    if (weatherCode === 0) {
        imageUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80";
    } else if (weatherCode >= 1 && weatherCode <= 3) {
        imageUrl = "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80";
    } else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
        imageUrl = "https://images.unsplash.com/photo-1438449805896-28a666819a20?auto=format&fit=crop&w=1920&q=80";
    } else if (weatherCode >= 95) {
        imageUrl = "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=1920&q=80";
    } else {
        imageUrl = "https://images.unsplash.com/photo-1485594050903-8e8ee7b071a8?auto=format&fit=crop&w=1920&q=80";
    }

    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${imageUrl}')`;
}

// Search Form Submit Listener
searchForm.addEventListener('submit', function(event) {
    event.preventDefault(); 
    const city = searchInput.value.trim();
    
    if (city !== "") {
        loadingDisplay.style.display = 'block';
        weatherInfo.style.display = 'none';
        errorDisplay.style.display = 'none';
        
        getCoordinates(city);
    }
});

// Get Weather Emoji
function getWeatherEmoji(weatherCode) {
    const emojiMap = {
        0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 
        45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️", 
        55: "🌦️", 56: "🌧️", 57: "🌧️", 61: "🌧️", 
        63: "🌧️", 65: "🌧️", 66: "🌨️", 67: "🌨️", 
        71: "❄️", 73: "❄️", 75: "❄️", 77: "🧊", 
        80: "🌦️", 85: "🌨️", 86: "🌨️", 
        95: "⛈️", 96: "⛈️", 99: "⛈️"  
    };
    return emojiMap[weatherCode] || "❓"; 
}

// Geocoding API - Fetch Coordinates
function getCoordinates(city) {
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`)
        .then(response => response.json())
        .then(data => {
            if (data.results) {
                const result = data.results[0];
                getWeather(result.latitude, result.longitude, result.name);
            } else {
                showError("City not found!");
            }
        })
        .catch(() => showError("Error loading location data."));
}

// Weather API & Map Generation
function getWeather(lat, lon, cityName) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(response => response.json())
        .then(async data => {
            const weather = data.current_weather;
            lastTempC = weather.temperature;
            
            displayWeather(cityName, weather);
            changeBackgroundByWeather(weather.weathercode);
            
           // Map Setup - Keep a good zoom level for the base map
            if (map === null) {
                map = L.map('map', { attributionControl: false }).setView([lat, lon], 9); 
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            } else {
                map.setView([lat, lon], 9);
            }

            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 150);

            // Radar Layer Setup
            if (radarLayer !== null) {
                map.removeLayer(radarLayer); 
            }

            try {
                const rvResponse = await fetch('https://api.rainviewer.com/public/weather-maps.json');
                const rvData = await rvResponse.json();
                const latestTimestamp = rvData.radar.past[rvData.radar.past.length - 1].time;
                
                // Generates the radar URL using the current timestamp
                const radarTileUrl = `https://tilecache.rainviewer.com/v2/radar/${latestTimestamp}/256/{z}/{x}/{y}/1/1_1.png?nocache=${Date.now()}`;
                
                radarLayer = L.tileLayer(radarTileUrl, {
                    opacity: 0.40,
                    maxNativeZoom: 6, // CRITICAL FIX: Forces Leaflet to scale up lower zoom radar tiles instead of requesting unsupported ones
                    maxZoom: 10,
                    errorTileUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"/>' // Failsafe transparent tile replacement
                }).addTo(map);

            } catch (e) {
                console.log("Radar fetch failed, keeping base map clear.");
            }
        })
        .catch(() => showError("Error loading weather data."));
}

// Render Data to HTML
function displayWeather(cityName, weatherData) {
    loadingDisplay.style.display = 'none';
    weatherInfo.style.display = 'block';

    document.getElementById('city-name').textContent = cityName;
    document.getElementById('wind-speed').textContent = `Wind Speed: ${weatherData.windspeed} m/s`;
    
    // Displays the translated English text instead of the code number
    document.getElementById('weather-condition').textContent = getWeatherDescription(weatherData.weathercode);

    weatherEmoji.textContent = getWeatherEmoji(weatherData.weathercode);
    updateTemperatureDisplay(); 
}

// Calculate and Update Temperature
function updateTemperatureDisplay() {
    if (lastTempC === null) return;

    if (isCelsius) {
        tempDisplay.textContent = `${lastTempC}°C`;
    } else {
        const fahrenheit = (lastTempC * 9/5) + 32;
        tempDisplay.textContent = `${fahrenheit.toFixed(1)}°F`;
    }
}

// Toggle Buttons Click Events
if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
        isCelsius = !isCelsius; 
        updateTemperatureDisplay(); 
        toggleBtn.textContent = isCelsius ? 'Switch to °F' : 'Switch to °C';
    });
}

// Show Error Message
function showError(message) {
    loadingDisplay.style.display = 'none';
    weatherInfo.style.display = 'none';
    errorDisplay.style.display = 'block';
    errorDisplay.textContent = message;
}
