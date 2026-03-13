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
