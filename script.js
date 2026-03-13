//Global variable





// Initialize Map centered on Delhi
// Initialize Map centered on Delhi
const map = L.map('map').setView([28.6139, 77.2090], 11);

// Dark Mode Tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">
  OpenStreetMap</a> contributors &copy; 
  <a href="https://carto.com/attributions">CARTO</a>`,
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map);

// AQI Color Logic
function getAQIColor(value) {
    if (value <= 50) return '#1abc9c';
    if (value <= 100) return '#a3d900';
    if (value <= 200) return '#f5c242';
    if (value <= 300) return '#f07c41';
    if (value <= 400) return '#e74c3c';
    return '#8b0000';
}

// Global AQI storage
let aqiData = [];

// Health Advice
let healthAdvice = {
    good: [{ icon: "🏃", text: "Enjoy outdoor activities." }, { icon: "🏠", text: "Open windows for fresh air." }],
    satisfactory: [{ icon: "🚴", text: "Good for outdoor exercise." }, { icon: "👶", text: "Sensitive groups monitor symptoms." }],
    moderate: [{ icon: "😷", text: "Limit prolonged outdoor exertion." }, { icon: "🪟", text: "Keep windows closed near traffic." }],
    poor: [{ icon: "😷", text: "Wear a mask outdoors." }, { icon: "🛑", text: "Avoid outdoor exercise." }],
    very_poor: [{ icon: "🚫", text: "Avoid all outdoor activities." }, { icon: "🌬️", text: "Use an Air Purifier." }],
    severe: [{ icon: "☠️", text: "Emergency: Stay Indoors!" }, { icon: "🏥", text: "Seek medical help if breathless." }]
};

function showHealthPanel(aqi, category) {
    const panel = document.getElementById('health-panel');
    const title = document.getElementById('health-title');
    const grid = document.getElementById('health-grid');
    if (!panel || !grid) return;

    let key = 'good';
    if (aqi > 50) key = 'satisfactory';
    if (aqi > 100) key = 'moderate';
    if (aqi > 200) key = 'poor';
    if (aqi > 300) key = 'very_poor';
    if (aqi > 400) key = 'severe';

    title.innerText = `Health Advice (${Math.round(aqi)})`;
    title.style.color = getAQIColor(aqi);

    grid.innerHTML = healthAdvice[key].map(item => `
        <div class="advice-card">
            <span style="font-size:1.5rem">${item.icon}</span>
            <span>${item.text}</span>
        </div>
    `).join('');

    panel.classList.add('active');
}

const closeBtn = document.getElementById('close-health');
if (closeBtn) closeBtn.onclick = () => document.getElementById('health-panel').classList.remove('active');


// LOAD AQI STATIONS
async function loadAQIData() {

    try {

        const token = "961fdc6dbaf5fc40b8e2024a40e4cea4963e156a";

        const res = await fetch(`https://api.waqi.info/map/bounds/?token=${token}&latlng=27.5,76.0,29.5,78.5`);
        const result = await res.json();

        if (result.status !== "ok") return;

        const stations = result.data;
        aqiData = stations;

        stations.forEach(station => {

            if (!station.aqi || station.aqi === "-") return;

            const aqi = station.aqi;
            const color = getAQIColor(aqi);
            const cityName = station.station.name;

            const marker = L.circleMarker([station.lat, station.lon], {
                radius: 7,
                fillColor: color,
                color: "#ffffff",
                weight: 2,
                fillOpacity: 1
            }).addTo(map);

            marker.bindPopup(`<b>${cityName}</b><br>AQI: <b>${aqi}</b>`);

        });

        document.getElementById("last-updated").innerText =
            "Live Multi-Station AQI (Delhi)";

    } catch (err) {
        console.error(err);
        console.warn("Failed to fetch AQI data");
    }
}


// GET AQI DETAILS + FORECAST
async function getAQIDetails(lat, lon, name) {

    try {

        const token = "961fdc6dbaf5fc40b8e2024a40e4cea4963e156a";

        const res = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`);
        const result = await res.json();

        if (result.status !== "ok") return;

        const aqi = result.data.aqi;
        const dominant = result.data.dominentpol || "Unknown";

        const forecast = result.data.forecast?.daily?.pm25 || [];

        const f24 = forecast[1]?.avg || "-";
        const f48 = forecast[2]?.avg || "-";
        const f72 = forecast[3]?.avg || "-";

        L.popup()
        .setLatLng([lat, lon])
        .setContent(`
        <b>${name}</b><br>
        AQI: <b>${aqi}</b><br>
        Dominant: ${dominant.toUpperCase()}<br><br>
        <b>Forecast</b><br>
        +24h : ${f24}<br>
        +48h : ${f48}<br>
        +72h : ${f72}
        `)
        .openOn(map);

    } catch (err) {
        console.error(err);
    }
}

loadAQIData();


// LOCATE USER
document.getElementById('locate-btn').addEventListener('click', () => {

    if (!navigator.geolocation) return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(pos => {

        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 14);

    });

});


// SEARCH LOCATION
async function searchLocation() {

    const query = document.getElementById('search-box').value;
    if (!query) return;

    const btn = document.getElementById('search-btn');
    btn.innerHTML = '⏳';

    try {

        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Delhi India')}`);
        const data = await res.json();

        if (data && data.length > 0) {

            const { lat, lon } = data[0];
            const name = data[0].display_name.split(',')[0];

            map.flyTo([lat, lon], 13);

            getAQIDetails(lat, lon, name);

        } else {

            alert("Location not found.");

        }

    } catch (e) {

        console.error(e);
        alert("Search failed.");

    } finally {

        btn.innerHTML = '🔍';

    }
}

document.getElementById('search-btn').addEventListener('click', searchLocation);

document.getElementById('search-box').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchLocation();
});


// MAP CLICK
map.on('click', (e) => {

    const { lat, lng } = e.latlng;

    L.circleMarker([lat, lng], {
        radius: 5,
        color: '#333',
        fillColor: '#fff',
        fillOpacity: 1
    })
    .addTo(map)
    .bindPopup("Selected Location")
    .openPopup();

    getAQIDetails(lat, lng, "Selected Location");

});


// REMOVE LOADER
const loader = document.getElementById('loader');

if (loader) {
    loader.style.display = "none";
}

