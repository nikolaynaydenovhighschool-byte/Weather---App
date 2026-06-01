//  Настройка - Връзка с HTML елементите
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const weatherInfo = document.querySelector('.weather-info');
const tempDisplay = document.getElementById('temperature');
const loadingDisplay = document.getElementById('loading');
const errorDisplay = document.getElementById('error');
const toggleBtn = document.getElementById('toggle-btn');
const weatherEmoji = document.getElementById('weather-emoji');

// Глобални променливи за управление на картата
let map = null;
let radarLayer = null;

// Променливи за състоянието на градусите
let isCelsius = true; 
let lastTempC = null; 

//  Функция, която сменя фоновия тапет на сайта според времето
function changeBackgroundByWeather(weatherCode) {
    let imageUrl = "";

    if (weatherCode === 0) {
        // Clear sky (Слънчево небе)
        imageUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80";
    } else if (weatherCode >= 1 && weatherCode <= 3) {
        // Cloudy (Облачно небе)
        imageUrl = "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80";
    } else if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
        // Rain (Дъждовно време)
        imageUrl = "https://images.unsplash.com/photo-1438449805896-28a666819a20?auto=format&fit=crop&w=1920&q=80";
    } else if (weatherCode >= 95) {
        // Thunderstorm (Гръмотевична буря)
        imageUrl = "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=1920&q=80";
    } else {
        // Snow / Fog (Сняг или мъгла)
        imageUrl = "https://images.unsplash.com/photo-1485594050903-8e8ee7b071a8?auto=format&fit=crop&w=1920&q=80";
    }

    // Прилагаме новата снимка към body-то с леко затъмняване, за да се вижда по-добре текста в приложението
    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${imageUrl}')`;
}

// 3. Слушател за натискане на бутона за търсене
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

// 4. Свързване на кодовете на времето с емоджита
function getWeatherEmoji(weatherCode) {
    const emojiMap = {
        0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 
        45: "🌫️", 48: "🌫️", 51: "🌦️", 53: "🌦️", 
        55: "🌦️", 56: "🌧️", 57: "🌧️", 61: "🌧️", 
        63: "🌧️", 65: "🌧️", 66: "🌨️", 67: "🌨️", 
        71: "❄️", 73: "❄️", 75: "❄️", 77: "🧊", 
        80: "🌦️", 81: "🌦️", 82: "🌦️", 85: "🌨️",
        86: "🌨️", 95: "⛈️", 96: "⛈️", 99: "⛈️"  
    };
    return emojiMap[weatherCode] || "❓"; 
}

// 5. ЕТАП 1: Геокодиране (Превръщане на име на град в координати)
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

// Изтегляне на реалното време и работа с картата
function getWeather(lat, lon, cityName) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(response => response.json())
        .then(data => {
            const weather = data.current_weather;
            lastTempC = weather.temperature;
            
            // Първо: Правим кутията видима и попълваме текстовете
            displayWeather(cityName, weather);
            
            // Второ: Сменяме фона плавно според времето
            changeBackgroundByWeather(weather.weathercode);
            
            // Трето: Логика за зареждане на ЦВЕТНАТА карта
            if (map === null) {
                // Инициализираме я за първи път (мащаб 10 за хубав детайлен изглед на града)
                map = L.map('map').setView([lat, lon], 10); 
                
                // Използваме стандартния цветен слой на OpenStreetMap
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(map);
            } else {
                // Ако вече е отваряна, просто я местим на новите координати
                map.setView([lat, lon], 10);
            }

            // Важен фикс: Изчакваме съвсем малко интерфейсът да се намести и казваме на картата да се преизчисли,
            // за да не се получи бъг със сив екран.
            setTimeout(() => {
                if (map) map.invalidateSize();
            }, 150);

            // Четвърто: Добавяне на живия дъждовен радар над цветната карта
            if (radarLayer !== null) {
                map.removeLayer(radarLayer); // Трием стария радар, за да не се трупат слоеве
            }

            radarLayer = L.tileLayer('https://tilecache.rainviewer.com/v2/radar/default/256/{z}/{x}/{y}/1/1_1.png', {
                opacity: 0.45 // Полупрозрачност, за да се виждат улиците отдолу
            }).addTo(map);
        })
        .catch(() => showError("Error loading weather data."));
}

// Попълване на данните в HTML
function displayWeather(cityName, weatherData) {
    loadingDisplay.style.display = 'none';
    weatherInfo.style.display = 'block';

    document.getElementById('city-name').textContent = cityName;
    document.getElementById('wind-speed').textContent = `Wind Speed: ${weatherData.windspeed} m/s`;
    document.getElementById('weather-condition').textContent = `Condition Code: ${weatherData.weathercode}`;

    weatherEmoji.textContent = getWeatherEmoji(weatherData.weathercode);
    updateTemperatureDisplay(); 
}

//  Математическа функция за преобразуване на градусите
function updateTemperatureDisplay() {
    if (lastTempC === null) return;

    if (isCelsius) {
        tempDisplay.textContent = `${lastTempC}°C`;
    } else {
        const fahrenheit = (lastTempC * 9/5) + 32;
        tempDisplay.textContent = `${fahrenheit.toFixed(1)}°F`;
    }
}

// Работа на копчето за превключване °C / °F
if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
        isCelsius = !isCelsius; 
        updateTemperatureDisplay(); 
        toggleBtn.textContent = isCelsius ? 'Switch to °F' : 'Switch to °C';
    });
}

//  Функция за показване на грешки
function showError(message) {
    loadingDisplay.style.display = 'none';
    weatherInfo.style.display = 'none';
    errorDisplay.style.display = 'block';
    errorDisplay.textContent = message;
}