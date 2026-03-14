// script.js - Complete Version with Review System

// Global Variables
let aqiData = [];
let map;
let tempMarkers = [];
let animationInterval;
let reviews = JSON.parse(localStorage.getItem('locationReviews')) || {}; // Load reviews from localStorage

// Initialize Map centered on Delhi
function initMap() {
    map = L.map('map').setView([28.6139, 77.2090], 11);

    // Dark Mode Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">
        OpenStreetMap</a> contributors &copy; 
        <a href="https://carto.com/attributions">CARTO</a>`,
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
}

// AQI Color Logic
function getAQIColor(value) {
    if (value <= 50) return '#1abc9c';
    if (value <= 100) return '#a3d900';
    if (value <= 200) return '#f5c242';
    if (value <= 300) return '#f07c41';
    if (value <= 400) return '#e74c3c';
    return '#8b0000';
}

// Clear all temporary markers
function clearTempMarkers() {
    tempMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    tempMarkers = [];
}

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

// Animate markers
function animateMarkers() {
    let scale = 1;
    let growing = true;
    
    if (animationInterval) clearInterval(animationInterval);
    
    animationInterval = setInterval(() => {
        if (growing) {
            scale += 0.02;
            if (scale >= 1.3) growing = false;
        } else {
            scale -= 0.02;
            if (scale <= 0.9) growing = true;
        }
        
        map.eachLayer(layer => {
            if (layer instanceof L.CircleMarker && layer.options.className !== 'temp-marker') {
                layer.setRadius(7 * scale);
            }
        });
    }, 50);
}

// Get Detailed AQI with Forecast
async function getAQIDetails(lat, lon, name, showPanel = false) {
    try {
        const token = "961fdc6dbaf5fc40b8e2024a40e4cea4963e156a";
        const res = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`);
        const result = await res.json();

        if (result.status !== "ok") return null;

        const aqi = result.data.aqi;
        const dominant = result.data.dominentpol || "Unknown";
        const forecast = result.data.forecast?.daily?.pm25 || [];
        
        const f24 = forecast[1]?.avg || "-";
        const f48 = forecast[2]?.avg || "-";
        const f72 = forecast[3]?.avg || "-";

        // Get reviews for this location
        const locationKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
        const locationReviews = reviews[locationKey] || [];
        
        // Create reviews HTML
        let reviewsHTML = '';
        if (locationReviews.length > 0) {
            reviewsHTML = '<hr><h4>Reviews</h4>';
            locationReviews.slice(-3).reverse().forEach(review => {
                reviewsHTML += `
                    <div class="review-item">
                        <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                        <p class="review-text">"${review.text}"</p>
                        <small class="review-date">${new Date(review.date).toLocaleDateString()}</small>
                    </div>
                `;
            });
        }

        // Create enhanced popup with forecast and reviews
        L.popup()
            .setLatLng([lat, lon])
            .setContent(`
                <div class="aqi-popup">
                    <h3>${name}</h3>
                    <span class="aqi-badge" style="background: ${getAQIColor(aqi)}">AQI: ${aqi}</span>
                    <p>Dominant Pollutant: ${dominant.toUpperCase()}</p>
                    <hr>
                    <h4>Forecast (PM2.5)</h4>
                    <div class="forecast-row">+24h: <b>${f24}</b></div>
                    <div class="forecast-row">+48h: <b>${f48}</b></div>
                    <div class="forecast-row">+72h: <b>${f72}</b></div>
                    ${reviewsHTML}
                    <hr>
                    <button onclick="openReviewModal(${lat}, ${lon}, '${name.replace(/'/g, "\\'")}')" class="review-btn">✍️ Write a Review</button>
                </div>
            `)
            .openOn(map);

        if (showPanel) {
            showHealthPanel(aqi, dominant);
        }

        return { aqi, dominant, forecast };
    } catch (err) {
        console.error("Error fetching AQI details:", err);
        return null;
    }
}

// Load AQI Stations from API
async function loadAQIData() {
    try {
        const token = "961fdc6dbaf5fc40b8e2024a40e4cea4963e156a";
        const res = await fetch(`https://api.waqi.info/map/bounds/?token=${token}&latlng=27.5,76.0,29.5,78.5`);
        const result = await res.json();

        if (result.status !== "ok") {
            console.warn("API Error");
            return;
        }

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
                fillOpacity: 1,
                className: 'aqi-marker'
            }).addTo(map);

            marker.on('click', async () => {
                clearTempMarkers();
                await getAQIDetails(station.lat, station.lon, cityName, true);
            });

            marker.bindPopup(`<b>${cityName}</b><br>AQI: <b>${aqi}</b>`);
        });

        setTimeout(animateMarkers, 500);
        
        document.getElementById("last-updated").innerText = "Live Multi-Station AQI (Delhi)";

    } catch (err) {
        console.error("Failed to fetch AQI data:", err);
    }
}

// Find Nearest Station
function findNearestStation(lat, lon) {
    if (!aqiData || aqiData.length === 0) return;
    
    let minDist = Infinity, nearest = null;

    aqiData.forEach(station => {
        if (!station.lat || !station.lon) return;
        const d = Math.sqrt(Math.pow(station.lat - lat, 2) + Math.pow(station.lon - lon, 2));
        if (d < minDist) { 
            minDist = d; 
            nearest = station; 
        }
    });

    if (nearest) {
        const line = L.polyline([[lat, lon], [nearest.lat, nearest.lon]], { 
            color: '#0984e3', 
            dashArray: '5, 10', 
            weight: 2, 
            opacity: 0.7 
        }).addTo(map);
        
        setTimeout(() => map.removeLayer(line), 5000);
        getAQIDetails(nearest.lat, nearest.lon, nearest.station.name, true);
    }
}

// Search Location
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
            
            clearTempMarkers();
            map.flyTo([lat, lon], 13);
            
            const tempMarker = L.circleMarker([lat, lon], {
                radius: 8,
                fillColor: '#0984e3',
                color: '#ffffff',
                weight: 3,
                fillOpacity: 0.8,
                className: 'temp-marker'
            }).addTo(map);
            
            tempMarker.bindPopup(`<b>🔍 ${name}</b>`).openPopup();
            tempMarkers.push(tempMarker);
            
            await getAQIDetails(lat, lon, name, true);
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

// Review System Functions
function openReviewModal(lat, lon, locationName) {
    const modal = document.getElementById('reviewpage');
    const reviewLocation = document.getElementById('review-location');
    const reviewText = document.getElementById('review-text');
    const reviewRating = document.getElementById('review-rating');
    const submitBtn = document.getElementById('submit-review');
    
    // Store current location data in modal
    modal.dataset.lat = lat;
    modal.dataset.lon = lon;
    modal.dataset.name = locationName;
    
    // Update modal content
    document.getElementById('review-location-name').textContent = locationName;
    reviewText.value = '';
    reviewRating.value = '5';
    
    modal.style.display = 'block';
}

function closeReviewModal() {
    document.getElementById('reviewpage').style.display = 'none';
}

function saveReview() {
    const modal = document.getElementById('reviewpage');
    const lat = modal.dataset.lat;
    const lon = modal.dataset.lon;
    const locationName = modal.dataset.name;
    const reviewText = document.getElementById('review-text').value;
    const reviewRating = parseInt(document.getElementById('review-rating').value);
    
    if (!reviewText.trim()) {
        alert('Please write a review');
        return;
    }
    
    const locationKey = `${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`;
    
    if (!reviews[locationKey]) {
        reviews[locationKey] = [];
    }
    
    reviews[locationKey].push({
        text: reviewText,
        rating: reviewRating,
        date: new Date().toISOString(),
        locationName: locationName
    });
    
    // Keep only last 10 reviews per location
    if (reviews[locationKey].length > 10) {
        reviews[locationKey] = reviews[locationKey].slice(-10);
    }
    
    // Save to localStorage
    localStorage.setItem('locationReviews', JSON.stringify(reviews));
    
    closeReviewModal();
    
    // Refresh the popup to show new review
    getAQIDetails(parseFloat(lat), parseFloat(lon), locationName, true);
    
    alert('Review saved successfully!');
}

// Get user location for review
function getUserLocationForReview() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }
    
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        getAQIDetails(latitude, longitude, "Your Location", true);
        openReviewModal(latitude, longitude, "Your Location");
    });
}

// Initialize everything
function init() {
    initMap();
    loadAQIData();

    // Locate Me
    document.getElementById('locate-btn').addEventListener('click', () => {
        if (!navigator.geolocation) return alert("Geolocation not supported");
        
        const btn = document.getElementById('locate-btn');
        btn.innerHTML = '⏳';

        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            
            clearTempMarkers();
            map.flyTo([latitude, longitude], 14);
            
            const tempMarker = L.circleMarker([latitude, longitude], {
                radius: 8,
                fillColor: '#00b894',
                color: '#ffffff',
                weight: 3,
                fillOpacity: 0.8,
                className: 'temp-marker'
            }).addTo(map);
            
            tempMarker.bindPopup("<b>📍 Your Location</b>").openPopup();
            tempMarkers.push(tempMarker);
            
            getAQIDetails(latitude, longitude, "Your Location", true);
            findNearestStation(latitude, longitude);
            btn.innerHTML = '📍';
        });
    });

    // Search
    document.getElementById('search-btn').addEventListener('click', searchLocation);
    document.getElementById('search-box').addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') searchLocation(); 
    });

    // Map Click
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        
        clearTempMarkers();
        
        const tempMarker = L.circleMarker([lat, lng], { 
            radius: 8,
            fillColor: '#fdcb6e',
            color: '#ffffff',
            weight: 3,
            fillOpacity: 0.8,
            className: 'temp-marker'
        }).addTo(map);
        
        tempMarker.bindPopup("📍 Selected Location").openPopup();
        tempMarkers.push(tempMarker);
        
        getAQIDetails(lat, lng, "Selected Location", true);
        findNearestStation(lat, lng);
    });

    // Hide Loader
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }, 800);
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);