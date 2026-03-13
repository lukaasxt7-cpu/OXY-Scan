//Global variable





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

// Color Logic
function getAQIColor(value) {
    if (value <= 50) return '#1abc9c';     // Good
    if (value <= 100) return '#a3d900';    // Satisfactory
    if (value <= 200) return '#f5c242';    // Moderate
    if (value <= 300) return '#f07c41';    // Poor
    if (value <= 400) return '#e74c3c';    // Very Poor
    return '#8b0000';                      // Severe
}



// Global Variables
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

    title.innerText = `Health Advice: ${category || 'Normal'} (${Math.round(aqi)})`;
    title.style.color = getAQIColor(aqi);

    grid.innerHTML = healthAdvice[key].map(item => `
        <div class="advice-card">
            <span style="font-size:1.5rem">${item.icon}</span>
            <span>${item.text}</span>
        </div>
    `).join('');

    panel.classList.add('active');
}

// Close Panel Listener
const closeBtn = document.getElementById('close-health');
if (closeBtn) closeBtn.onclick = () => document.getElementById('health-panel').classList.remove('active');


// --- MAIN LOGIC ---
async function loadAQIData() {
    try {
        const token = "961fdc6dbaf5fc40b8e2024a40e4cea4963e156a";

        const res = await fetch(
`https://api.waqi.info/map/bounds/?token=${token}&latlng=27.5,76.0,29.5,78.5`
);

        const result = await res.json();

        if (result.status !== "ok") {
            console.warn("API Error");
            return;
        }

        const stations = result.data;
        aqiData = stations;

        

        // Loop through all AQI stations returned by the API
stations.forEach(station => {

    if (!station.aqi || station.aqi === "-") return;

    const aqi = station.aqi;
    const color = getAQIColor(aqi);
    const cityName = station.station.name;

    

    // AQI Dot Marker
    const marker = L.circleMarker([station.lat, station.lon], {
    radius: 7,
    fillColor: color,
    color: "#ffffff",
    weight: 2,
    fillOpacity: 1
}).addTo(map);

const popup = L.popup({
    offset: [0, -10]   // negative moves popup downward
}).setContent(`
<b>${cityName}</b><br>
AQI: <b>${aqi}</b>
`);

marker.bindPopup(popup);


    // Popup
    marker.bindPopup(`
<b>${cityName}</b><br>
AQI: <b>${aqi}</b>
`, {
    direction: "bottom",
    offset: [0, 10]
});

});

        
        

        document.getElementById("last-updated").innerText =
            "Live Multi-Station AQI (Delhi)";

    } catch (err) {
        console.error(err);
        console.warn("Failed to fetch AQI data");
    }
}

loadAQIData();


// --- INTERACTION LOGIC ---

// 1. Locate Me
document.getElementById('locate-btn').addEventListener('click', () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    const btn = document.getElementById('locate-btn');
    btn.innerHTML = '⏳';

    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 14);
    });
});

// 2. Search Logic
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
            L.popup().setLatLng([lat, lon]).setContent(`<b>📍 ${name}</b><br>Finding nearest station...`).openOn(map);
            findNearestStation(lat, lon);
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
document.getElementById('search-box').addEventListener('keypress', (e) => { if (e.key === 'Enter') searchLocation(); });

// 3. Find Nearest Logic
function findNearestStation(lat, lon) {
    if (!aqiData || !aqiData.forecasts) return;
    let minDist = Infinity, nearest = null;

    aqiData.forecasts.forEach(st => {
        if (!st.lat || !st.lon) return;
        const d = Math.sqrt(Math.pow(st.lat - lat, 2) + Math.pow(st.lon - lon, 2));
        if (d < minDist) { minDist = d; nearest = st; }
    });

    if (nearest) {
        const line = L.polyline([[lat, lon], [nearest.lat, nearest.lon]], { color: '#0984e3', dashArray: '5, 10', weight: 2, opacity: 0.7 }).addTo(map);
        setTimeout(() => map.removeLayer(line), 5000);

        map.eachLayer(l => {
            if (l instanceof L.Marker && l.getLatLng().lat === nearest.lat && l.getLatLng().lng === nearest.lon) {
                l.openPopup();
                const pm25 = nearest.current_safety_data?.current_pm25 || nearest.forecasts[0]?.pm25_final || 0;
                showHealthPanel(pm25, nearest.category);
            }
        });
    }
}

// 4. Map Click
map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    L.circleMarker([lat, lng], { radius: 5, color: '#333', fillColor: '#fff', fillOpacity: 1 }).addTo(map).bindPopup("Selected Location").openPopup();
    findNearestStation(lat, lng);
});

// 5. Hide Loader (Only runs after everything is setup)
const loader = document.getElementById('loader');
if (loader) {
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }, 800);
}
