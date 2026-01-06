import mapboxgl from 'mapbox-gl';
import gsap from 'gsap';
import citiesData from './cities.json';

// Mapbox Token
mapboxgl.accessToken = 'pk.eyJ1IjoiYnVpbGRocSIsImEiOiJjbWpzazloNWgwamxnM2NxdzZnbGdtOXF6In0.lfNHWVwW_6985TQNidi8yw';

// Initialize Map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11', // Dark style for premium look
    center: [0, 20],
    zoom: 1.5,
    projection: 'globe' // 3D Globe projection
});

// UI Elements
const searchInput = document.getElementById('city-search');
const searchResults = document.getElementById('search-results');
const infoCard = document.getElementById('info-card');
const closeCardBtn = document.getElementById('close-card');
const toggleViewBtn = document.getElementById('toggle-view');

// State
let markers = [];
let isGlobe = true;

map.on('style.load', () => {
    map.setFog({
        'color': 'rgb(186, 210, 235)', // Lower atmosphere
        'high-color': 'rgb(36, 92, 223)', // Upper atmosphere
        'horizon-blend': 0.02, // Atmosphere thickness (default 0.2 at low zooms)
        'space-color': 'rgb(11, 11, 25)', // Background color
        'star-intensity': 0.6 // Background star brightness (default 0.35 at low zooms )
    });
});

map.on('load', () => {
    // Add Markers
    citiesData.forEach(city => {
        const markerEl = document.createElement('div');
        markerEl.className = 'marker pizza-marker';

        // Add hover effects via JS or leave to CSS (CSS handled)

        const marker = new mapboxgl.Marker({
            element: markerEl,
            anchor: 'bottom'
        })
            .setLngLat(city.coordinates)
            .addTo(map);

        marker.getElement().addEventListener('click', () => {
            selectCity(city);
        });

        markers.push({ ...city, marker });
    });
});

// Search Logic
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    searchResults.innerHTML = '';

    if (query.length < 2) {
        searchResults.classList.add('hidden');
        return;
    }

    const filtered = citiesData.filter(c => c.city.toLowerCase().includes(query));

    if (filtered.length > 0) {
        searchResults.classList.remove('hidden');
        filtered.forEach(city => {
            const div = document.createElement('div');
            div.className = 'p-2 hover:bg-white/10 cursor-pointer text-sm border-b border-white/10 last:border-0';
            div.innerHTML = `<span class="font-bold text-pizza-yellow">${city.city}</span>, ${city.country}`;
            div.addEventListener('click', () => {
                selectCity(city);
                searchInput.value = '';
                searchResults.classList.add('hidden');
            });
            searchResults.appendChild(div);
        });
    } else {
        searchResults.classList.add('hidden');
    }
});

// Select City & Fly To
function selectCity(city) {
    // Stop spinning when checking a city
    spinEnabled = false;

    // Animate FlyTo
    map.flyTo({
        center: city.coordinates,
        zoom: 6,
        essential: true,
        speed: 1.5,
        curve: 1
    });

    // Populate and Show Card
    showInfoCard(city);
}

// Info Card Interaction
function showInfoCard(city) {
    document.getElementById('card-city').textContent = city.city;
    document.getElementById('card-country').textContent = city.country;
    document.getElementById('card-region').textContent = city.region;
    document.getElementById('card-host').textContent = city.host;
    document.getElementById('card-status').textContent = city.status;

    const telegramBtn = document.getElementById('card-telegram');
    if (city.telegram) {
        telegramBtn.href = city.telegram;
        telegramBtn.classList.remove('hidden');
    } else {
        telegramBtn.classList.add('hidden');
    }

    const driveBtn = document.getElementById('card-drive');
    if (city.drive_link) {
        driveBtn.href = city.drive_link;
        driveBtn.classList.remove('hidden');
    } else {
        driveBtn.classList.add('hidden');
    }

    const regBtn = document.getElementById('card-register');
    if (city.event_registration_link) {
        regBtn.href = city.event_registration_link;
        regBtn.classList.remove('hidden');
    } else {
        regBtn.classList.add('hidden');
    }

    infoCard.classList.remove('hidden');

    // Animate Card Entrance
    gsap.fromTo(infoCard,
        { y: 50, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
}

closeCardBtn.addEventListener('click', () => {
    spinEnabled = true; // Resume spin
    gsap.to(infoCard, {
        y: 20,
        opacity: 0,
        duration: 0.3,
        onComplete: () => infoCard.classList.add('hidden')
    });
});

// Toggle Globe / Map
toggleViewBtn.addEventListener('click', () => {
    isGlobe = !isGlobe;
    if (isGlobe) {
        map.setProjection('globe');
        toggleViewBtn.textContent = 'Switch to 2D Map';
        map.zoomTo(1.5, { duration: 2000 });
        map.setFog({ // Restore fog
            'color': 'rgb(186, 210, 235)',
            'high-color': 'rgb(36, 92, 223)',
            'space-color': 'rgb(11, 11, 25)'
        });
    } else {
        map.setProjection('mercator'); // or 'equirectangular'
        toggleViewBtn.textContent = 'Switch to 3D Globe';
        map.setFog({}); // Remove fog for 2D look
        map.flyTo({ center: [0, 20], zoom: 1 });
    }
});

// Spin Animation
let userInteracting = false;
let spinEnabled = true;
const secondsPerRevolution = 120; // 2 minutes per revolution
const maxSpinZoom = 5;

function spinGlobe() {
    const zoom = map.getZoom();
    if (spinEnabled && !userInteracting && isGlobe && zoom < maxSpinZoom) {
        const distancePerSecond = 360 / secondsPerRevolution;
        const center = map.getCenter();
        center.lng -= distancePerSecond / 60;
        map.jumpTo({ center });
    }
    requestAnimationFrame(spinGlobe);
}

// Interaction Handlers
map.on('mousedown', () => { userInteracting = true; });
map.on('touchstart', () => { userInteracting = true; });
map.on('dragstart', () => { userInteracting = true; });

// Resume spinning after interaction ends
map.on('mouseup', () => { userInteracting = false; });
map.on('touchend', () => { userInteracting = false; });
map.on('dragend', () => { userInteracting = false; });
// Use visual check, not relying on moveend for now to avoid conflicts with jumpTo
// map.on('moveend', () => { userInteracting = false; }); 

// Start the loop
spinGlobe();
