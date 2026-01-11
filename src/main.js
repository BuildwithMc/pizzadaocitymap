import mapboxgl from 'mapbox-gl';
import gsap from 'gsap';
import Papa from 'papaparse';
import MapboxDirections from '@mapbox/mapbox-sdk/services/directions';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGpG5u16oKRt1KgtoM5HjBXqoCJMmzVrtcUrRNcYj3Y1kZBDLnuWqUNHSSJQUgJzrzrkYq2T3cLZOy/pub?output=csv';
let citiesData = [];

// Mapbox Token
mapboxgl.accessToken = 'pk.eyJ1IjoiYnVpbGRocSIsImEiOiJjbWpzazloNWgwamxnM2NxdzZnbGdtOXF6In0.lfNHWVwW_6985TQNidi8yw';

// Initialize Directions Client
const directionsClient = MapboxDirections({ accessToken: mapboxgl.accessToken });

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
const btnAttend = document.getElementById('btn-attend');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnMode = document.getElementById('btn-mode');
const btnTheme = document.getElementById('btn-theme');
const btnLang = document.getElementById('btn-lang');
const btnLocation = document.getElementById('btn-location');
const btnProjection = document.getElementById('toggle-projection');
const cityCounter = document.getElementById('city-counter');
const cityCountValue = document.getElementById('city-count-value');

// Nav UI
const navPanel = document.getElementById('nav-panel');
const navDestName = document.getElementById('nav-dest-name');
const btnExitNav = document.getElementById('btn-exit-nav');
const navDuration = document.getElementById('nav-duration');
const navDistance = document.getElementById('nav-distance');
const navInstruction = document.getElementById('nav-instruction');
const navModeBtns = document.querySelectorAll('.nav-mode-btn');


// Language Modal
const modalLanguage = document.getElementById('modal-language');
const closeLangModal = document.getElementById('close-lang-modal');
const langGrid = document.getElementById('lang-grid');

// Modal Elements
const modalGettingStarted = document.getElementById('modal-getting-started');
const btnOpenModal = document.getElementById('btn-open-modal');
const closeModalBtn = document.getElementById('close-modal');
const btnStartParty = document.getElementById('btn-start-party');

// State
let markers = [];
let mapMode = 'street'; // 'street', 'satellite', 'hybrid'
let isDarkMode = true;
let spinEnabled = true;
let isGlobe = true;

// Nav State
let isNavigating = false;
let navWatchId = null;
let currentRoute = null;
let navDestination = null;
let navMode = 'driving'; // driving, cycling, walking
let userCurrentLocation = null;

// Languages
const LANGUAGES = [
    { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' }, { code: 'ru', name: 'Russian' }, { code: 'zh-Hans', name: 'Chinese (Simplified)' },
    { code: 'pt', name: 'Portuguese' }, { code: 'ar', name: 'Arabic' }, { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' }, { code: 'it', name: 'Italian' }, { code: 'hi', name: 'Hindi' },
    { code: 'tr', name: 'Turkish' }, { code: 'vi', name: 'Vietnamese' }, { code: 'pl', name: 'Polish' },
    { code: 'nl', name: 'Dutch' }, { code: 'id', name: 'Indonesian' }, { code: 'th', name: 'Thai' },
    { code: 'sv', name: 'Swedish' }, { code: 'uk', name: 'Ukrainian' }, { code: 'el', name: 'Greek' },
    { code: 'cs', name: 'Czech' }, { code: 'ro', name: 'Romanian' }, { code: 'hu', name: 'Hungarian' },
    { code: 'fi', name: 'Finnish' }, { code: 'da', name: 'Danish' }, { code: 'no', name: 'Norwegian' },
    { code: 'he', name: 'Hebrew' }
];

// Map Configs
const STYLES = {
    street: {
        dark: 'mapbox://styles/mapbox/dark-v11',
        light: 'mapbox://styles/mapbox/light-v11'
    },
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    hybrid: 'mapbox://styles/mapbox/satellite-streets-v12'
};

map.on('style.load', () => {
    // Only set fog if in a mode that looks good with it (usually good for all globe views)
    if (isGlobe) {
        setFogState();
    }
});

function setFogState() {
    map.setFog({
        'color': isDarkMode ? 'rgb(186, 210, 235)' : 'rgb(255, 255, 255)',
        'high-color': isDarkMode ? 'rgb(36, 92, 223)' : 'rgb(200, 200, 255)',
        'horizon-blend': 0.02,
        'space-color': isDarkMode ? 'rgb(11, 11, 25)' : 'rgb(240, 240, 240)',
        'star-intensity': isDarkMode ? 0.6 : 0.0
    });
}

// Initialize Application
// Initialize Application
async function initApp() {
    try {
        await fetchSheetData();
        if (citiesData.length === 0) {
            throw new Error('No data fetched from sheet');
        }
        initMap();
    } catch (error) {
        console.error('Live fetch failed:', error);
        alert('Failed to load map data. Please try again later.');
    }
}

async function fetchSheetData() {
    return new Promise((resolve, reject) => {
        Papa.parse(SHEET_URL, {
            download: true,
            header: true,
            complete: function (results) {
                if (results.data && results.data.length > 0) {
                    console.log('CSV Fetched:', results.data.length, 'rows');
                    citiesData = results.data.map(row => {
                        let coords = null;
                        // Handle multiple potential coordinate formats
                        if (row.coordinates) {
                            try {
                                // Try JSON parse if it looks like "[lng, lat]"
                                if (row.coordinates.startsWith('[')) {
                                    coords = JSON.parse(row.coordinates);
                                } else {
                                    // Try splitting "lng, lat" string
                                    const parts = row.coordinates.split(',').map(n => parseFloat(n.trim()));
                                    if (parts.length === 2 && !isNaN(parts[0])) coords = parts;
                                }
                            } catch (e) {
                                console.warn('Failed to parse coordinates:', row.coordinates);
                            }
                        } else if (row.latitude && row.longitude) {
                            coords = [parseFloat(row.longitude), parseFloat(row.latitude)];
                        } else if (row.Lat && row.Lng) {
                            coords = [parseFloat(row.Lng), parseFloat(row.Lat)];
                        }

                        return {
                            ...row,
                            coordinates: coords
                        };
                    }).filter(city => city.city && city.coordinates);
                    resolve();
                } else {
                    reject('Empty CSV');
                }
            },
            error: function (err) {
                // console.error('Papa Parse Error:', err);
                reject(err);
            }
        });
    });
}

function initMap() {
    // Add Markers
    citiesData.forEach(city => {
        // Skip entries without valid coordinates
        if (!city.coordinates || city.coordinates.length !== 2) {
            return;
        }

        const markerEl = document.createElement('div');
        markerEl.className = 'marker pizza-marker';

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

    // Update City Counter
    cityCountValue.textContent = citiesData.length;
    cityCounter.classList.remove('hidden');
    gsap.from(cityCounter, { opacity: 0, y: -20, delay: 1, duration: 1 });

    // Show Getting Started Modal
    setTimeout(() => {
        modalGettingStarted.classList.remove('hidden');
        gsap.fromTo(modalGettingStarted.children[0],
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
    }, 1000);
}

map.on('load', () => {
    initApp();
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
    selectedCityData = city; // Store for nav
    spinEnabled = false;
    if (city.coordinates && city.coordinates.length === 2) {
        map.flyTo({
            center: city.coordinates,
            zoom: 6,
            essential: true,
            speed: 1.5,
            curve: 1
        });
    }
    showInfoCard(city);
}

// Info Card Interaction
function showInfoCard(city) {
    document.getElementById('card-city').textContent = city.city;
    document.getElementById('card-country').textContent = city.country;
    document.getElementById('card-region').textContent = city.region;
    document.getElementById('card-host').textContent = city.host;
    document.getElementById('card-status').textContent = city.status || '';

    const telegramBtn = document.getElementById('card-telegram');
    if (city.telegram) {
        telegramBtn.href = city.telegram;
        telegramBtn.classList.remove('hidden');
    } else {
        telegramBtn.classList.add('hidden');
    }

    const driveBtn = document.getElementById('card-drive');
    const driveLink = city['Party-Drive-Link'];
    if (driveLink) {
        driveBtn.href = driveLink;
        driveBtn.classList.remove('hidden');
    } else {
        driveBtn.classList.add('hidden');
    }

    const regBtn = document.getElementById('card-register');
    const regLink = city['CITY-REGISTARTION-LINK'];
    if (regLink) {
        regBtn.href = regLink;
        regBtn.classList.remove('hidden');
    } else {
        regBtn.classList.add('hidden');
    }

    infoCard.classList.remove('hidden');
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

// Zoom Controls
btnZoomIn.addEventListener('click', () => map.zoomIn());
btnZoomOut.addEventListener('click', () => {
    map.flyTo({
        center: [0, 20],
        zoom: 1.5,
        essential: true,
        speed: 1.5,
        curve: 1
    });
});

// Map Mode Switcher
btnMode.addEventListener('click', () => {
    if (mapMode === 'street') {
        mapMode = 'satellite';
        map.setStyle(STYLES.satellite);
    } else if (mapMode === 'satellite') {
        mapMode = 'hybrid';
        map.setStyle(STYLES.hybrid);
    } else {
        mapMode = 'street';
        map.setStyle(isDarkMode ? STYLES.street.dark : STYLES.street.light);
    }
});

// Theme Toggle
btnTheme.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    if (mapMode === 'street') {
        map.setStyle(isDarkMode ? STYLES.street.dark : STYLES.street.light);
    }
    // Updated setFog call if globe is active
    if (isGlobe) setFogState();
});

// 2D/3D Toggle
btnProjection.addEventListener('click', () => {
    isGlobe = !isGlobe;
    if (isGlobe) {
        map.setProjection('globe');
        setFogState();
        btnProjection.innerHTML = `
            <span class="text-xs font-bold">2D/3D</span>
            <div id="icon-projection">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        `;
        map.zoomTo(1.5, { duration: 2000 });
    } else {
        map.setProjection('mercator');
        map.setFog({}); // Remove fog for 2D
        btnProjection.innerHTML = `
            <span class="text-xs font-bold">2D/3D</span>
            <div id="icon-projection">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                 </svg>
            </div>
        `;
        map.flyTo({ center: [0, 20], zoom: 1 });
    }
});

// Geolocation
btnLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    btnLocation.classList.add('animate-pulse');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            btnLocation.classList.remove('animate-pulse');
            const userLocation = [position.coords.longitude, position.coords.latitude];

            // Fly to location
            map.flyTo({
                center: userLocation,
                zoom: 10,
                essential: true
            });

            // Find nearby cities
            findNearbyCities(userLocation);
        },
        () => {
            btnLocation.classList.remove('animate-pulse');
            alert('Unable to retrieve your location');
        }
    );
});

function findNearbyCities(userLoc) {
    // Simple Haversine distance
    const nearby = citiesData
        .filter(city => city.coordinates && city.coordinates.length === 2)
        .map(city => {
            const R = 6371; // km
            const dLat = (city.coordinates[1] - userLoc[1]) * Math.PI / 180;
            const dLon = (city.coordinates[0] - userLoc[0]) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(userLoc[1] * Math.PI / 180) * Math.cos(city.coordinates[1] * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return { ...city, distance };
        }).sort((a, b) => a.distance - b.distance).slice(0, 5);

    // Show results in search container
    searchResults.innerHTML = '<div class="p-2 font-bold text-xs uppercase text-gray-400">Parties Near You</div>';
    searchResults.classList.remove('hidden');

    nearby.forEach(city => {
        const div = document.createElement('div');
        div.className = 'p-2 hover:bg-white/10 cursor-pointer text-sm border-b border-white/10 last:border-0';
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span><span class="font-bold text-pizza-yellow">${city.city}</span>, ${city.country}</span>
                <span class="text-xs opacity-70">${Math.round(city.distance)} km</span>
            </div>
        `;
        div.addEventListener('click', () => {
            selectCity(city);
            searchResults.classList.add('hidden');
        });
        searchResults.appendChild(div);
    });
}

// Spin Animation
let userInteracting = false;
const secondsPerRevolution = 120;
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
map.on('mouseup', () => { userInteracting = false; });
map.on('touchend', () => { userInteracting = false; });
map.on('dragend', () => { userInteracting = false; });

// Modal Logic
function openModal() {
    modalGettingStarted.classList.remove('hidden');
    gsap.fromTo(modalGettingStarted.children[0],
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
}

function closeModal() {
    gsap.to(modalGettingStarted.children[0], {
        scale: 0.9,
        opacity: 0,
        duration: 0.2,
        onComplete: () => modalGettingStarted.classList.add('hidden')
    });
}

btnOpenModal.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
btnStartParty.addEventListener('click', closeModal);


// --- Language Logic ---

// Populate Language Grid
LANGUAGES.forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'p-3 rounded-lg bg-white/10 hover:bg-white/20 text-left transition select-none';
    btn.innerHTML = `<span class="font-bold text-sm block text-pizza-yellow">${lang.code.toUpperCase()}</span><span class="text-xs opacity-70">${lang.name}</span>`;
    btn.addEventListener('click', () => {
        setLanguage(lang.code);
        closeLangModal.click();
    });
    langGrid.appendChild(btn);
});

function setLanguage(langCode) {
    const style = map.getStyle();
    if (!style || !style.layers) return;

    // Detect all symbol layers that display text
    const labelLayers = style.layers.filter(layer =>
        layer.type === 'symbol' &&
        layer.layout &&
        layer.layout['text-field']
    );

    labelLayers.forEach(layer => {
        // Construct the new text-field expression
        // We assume standard Mapbox naming conventions: name_en, name_fr, etc.
        // We use 'coalesce' to try the specific language, then English, then the default 'name'

        // Some layers might use complex expressions, but for standard styles, 
        // replacing the text-field with this coalesce logic usually works for multilingual support.

        try {
            map.setLayoutProperty(layer.id, 'text-field', [
                'coalesce',
                ['get', `name_${langCode}`],
                ['get', 'name_en'],
                ['get', 'name']
            ]);
        } catch (e) {
            // Ignore layers that might fail (e.g., custom layers with different data schemas)
            console.warn(`Could not set language for layer ${layer.id}`, e);
        }
    });

    alert(`Language switched to ${langCode.toUpperCase()}`);
}

btnLang.addEventListener('click', () => {
    modalLanguage.classList.remove('hidden');
    gsap.fromTo(modalLanguage.children[0], { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2 });
});

closeLangModal.addEventListener('click', () => {
    modalLanguage.classList.add('hidden');
});


// --- Navigation Logic ---

btnAttend.addEventListener('click', () => {
    if (!selectedCityData) return;
    startNavigation(selectedCityData);
});

let selectedCityData = null;

// Start Nav
function startNavigation(city) {
    isNavigating = true;
    navDestination = city.coordinates;
    navDestName.textContent = city.city;

    // Hide standard UI
    infoCard.classList.add('hidden');
    cityCounter.classList.add('hidden');
    document.querySelector('.absolute.top-0').classList.add('hidden'); // Top overlay

    // Show Nav Panel
    navPanel.classList.remove('hidden');
    gsap.from(navPanel, { y: -20, opacity: 0, duration: 0.5 });

    // Switch to 2D
    if (isGlobe) {
        isGlobe = false;
        map.setProjection('mercator');
        map.setFog({});
        btnProjection.innerHTML = `<span class="text-xs font-bold">2D/3D</span>...`;
    }

    // Start Location Watch
    if (navigator.geolocation) {
        navWatchId = navigator.geolocation.watchPosition(updateNavPosition, (err) => {
            console.error('Nav Geo Error', err);
            alert('Location access required for navigation.');
        }, {
            enableHighAccuracy: true,
            maximumAge: 2000
        });
    }

    // Initial Route Fetch
    navInstruction.textContent = "Locating you...";
    navInstruction.classList.remove('hidden');
}

// Exit Nav
btnExitNav.addEventListener('click', () => {
    isNavigating = false;
    if (navWatchId) navigator.geolocation.clearWatch(navWatchId);

    navPanel.classList.add('hidden');
    infoCard.classList.remove('hidden');
    cityCounter.classList.remove('hidden');
    document.querySelector('.absolute.top-0').classList.remove('hidden');

    // Remove route layers
    if (map.getLayer('route')) map.removeLayer('route');
    if (map.getSource('route')) map.removeSource('route');
    if (map.getLayer('user-location-dot')) map.removeLayer('user-location-dot');
    if (map.getSource('user-location')) map.removeSource('user-location');

    // Reset view
    map.flyTo({
        center: navDestination,
        zoom: 12,
        pitch: 0,
        bearing: 0
    });
});

// Store previous location for bearing calculation
let previousLocation = null;

function updateNavPosition(pos) {
    const lng = pos.coords.longitude;
    const lat = pos.coords.latitude;
    userCurrentLocation = [lng, lat];

    // Track User
    map.flyTo({
        center: [lng, lat],
        zoom: 15,
        bearing: pos.coords.heading || 0,
        pitch: 50,
        duration: 1000,
        ease: 'linear'
    });

    // Add/Update User Marker on Map 
    if (!map.getSource('user-location')) {
        map.addSource('user-location', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [lng, lat] }
            }
        });
        map.addLayer({
            id: 'user-location-dot',
            type: 'circle',
            source: 'user-location',
            paint: {
                'circle-radius': 8,
                'circle-color': '#007cbf',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff'
            }
        });
    } else {
        map.getSource('user-location').setData({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] }
        });
    }

    // Fetch Route if not fetched or significant move
    if (!lastFetchLocation || distance(userCurrentLocation, lastFetchLocation) > 0.05) {
        debouncedFetchRoute(userCurrentLocation, navDestination);
    }
}

function calculateBearing(start, end) {
    const startLat = start[1] * Math.PI / 180;
    const startLng = start[0] * Math.PI / 180;
    const endLat = end[1] * Math.PI / 180;
    const endLng = end[0] * Math.PI / 180;
    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    const theta = Math.atan2(y, x);
    return (theta * 180 / Math.PI + 360) % 360;
}

function updateUserMarker(lng, lat) {
    if (!map.getSource('user-location')) {
        map.addSource('user-location', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [lng, lat] }
            }
        });
        map.addLayer({
            id: 'user-location-puck',
            type: 'circle',
            source: 'user-location',
            paint: {
                'circle-radius': 12,
                'circle-color': '#2A60E4',
                'circle-stroke-width': 3,
                'circle-stroke-color': '#fff'
            }
        });
        // Direction arrow
        map.addLayer({
            id: 'user-location-arrow',
            type: 'symbol',
            source: 'user-location',
            layout: {
                'icon-image': 'arrow', // primitive, might need custom icon
                'icon-size': 0.5,
                'icon-rotate': ['get', 'bearing'],
                'icon-allow-overlap': true
            }
        });
    } else {
        map.getSource('user-location').setData({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] }
        });
    }
}


// --- Routes ---

let lastFetchLocation = null;
let routeCache = {};
let fetchTimeout = null;

function debouncedFetchRoute(start, end) {
    if (fetchTimeout) clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(() => {
        fetchRoute(start, end);
        prefetchAllModes(start, end); // Optimize: fetch others in background
    }, 1000);
}

async function fetchRoute(start, end) {
    if (!start || !end) return;

    // Cache Key
    const key = `${navMode}-${start[0].toFixed(3)},${start[1].toFixed(3)}-${end[0].toFixed(3)},${end[1].toFixed(3)}`;

    if (routeCache[key]) {
        renderRoute(routeCache[key]);
        return;
    }

    lastFetchLocation = start;

    const profile = navMode === 'driving' ? 'driving-traffic' : navMode;

    try {
        const response = await directionsClient.getDirections({
            profile: profile,
            waypoints: [
                { coordinates: start },
                { coordinates: end }
            ],
            geometries: 'geojson',
            overview: 'full'
        }).send();

        if (response && response.body && response.body.routes && response.body.routes.length > 0) {
            const route = response.body.routes[0];
            routeCache[key] = route;
            renderRoute(route);
        }
    } catch (err) {
        console.error('Directions Error:', err);
    }
}

function renderRoute(route) {
    currentRoute = route;

    // Draw Route
    drawRoute(route.geometry);

    // Update Stats
    const durationMins = Math.round(route.duration / 60);
    const distKm = (route.distance / 1000).toFixed(1);

    navDuration.textContent = `${durationMins} min`;
    navDistance.textContent = `${distKm} km`;

    // Show Heading Instruction
    if (route.legs && route.legs[0] && route.legs[0].steps && route.legs[0].steps.length > 0) {
        const step = route.legs[0].steps[0];
        if (step.maneuver && step.maneuver.instruction) {
            navInstruction.textContent = step.maneuver.instruction;
            navInstruction.classList.remove('hidden');
        }
    }
}

function drawRoute(geometry) {
    if (map.getSource('route')) {
        map.getSource('route').setData({
            type: 'Feature',
            geometry: geometry
        });
    } else {
        map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: geometry
            }
        });
        map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#22c55e', // Green for 'Attend'
                'line-width': 6,
                'line-opacity': 0.8
            }
        });
    }
}

// --- Simulation Logic (For Demo) ---
// Add a hidden button to trigger simulation if needed, or just exposure
window.startSimulation = function () {
    if (!currentRoute) return;
    let distanceTraveled = 0;
    const path = currentRoute.geometry.coordinates; // LineString
    // Simple interpolation
    let index = 0;

    // Clear Geolocation to stop conflict
    if (navWatchId) navigator.geolocation.clearWatch(navWatchId);

    const interval = setInterval(() => {
        if (index >= path.length - 1) {
            clearInterval(interval);
            return;
        }
        const p1 = path[index];
        const p2 = path[index + 1];

        // Move
        updateNavPosition({
            coords: {
                longitude: p1[0],
                latitude: p1[1],
                speed: 30, // simulated
                heading: calculateBearing(p1, p2)
            }
        });
        index++;
    }, 500); // Fast simulation
};

// ... existing code ...


// --- Optimized Mode Switching & Pre-fetching ---

// Mode Buttons Logic
navModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode === navMode) return; // No change

        // 1. Immediate Visual Update
        navModeBtns.forEach(b => {
            b.classList.remove('active-mode', 'text-white', 'bg-white/10');
            b.classList.add('text-white/50');
        });
        btn.classList.add('active-mode', 'text-white', 'bg-white/10');
        btn.classList.remove('text-white/50');

        // 2. Set State
        navMode = mode;

        // 3. Instant Data Update (Check cache or fetch)
        if (userCurrentLocation && navDestination) {
            // Cancel any pending debounce
            if (fetchTimeout) clearTimeout(fetchTimeout);

            // Try explicit fetch immediately
            fetchRoute(userCurrentLocation, navDestination);
        }
    });
});

// Pre-fetch all modes to optimize switching speed
function prefetchAllModes(start, end) {
    const modes = ['driving', 'cycling', 'walking'];
    modes.forEach(mode => {
        if (mode === navMode) return; // Already fetching current
        // Background fetch
        // We use a separate internal fetch to not disturb current UI unless we want to cache it
        internalFetchRoute(start, end, mode);
    });
}

async function internalFetchRoute(start, end, mode) {
    const key = `${mode}-${start[0].toFixed(3)},${start[1].toFixed(3)}-${end[0].toFixed(3)},${end[1].toFixed(3)}`;
    if (routeCache[key]) return; // Already cached

    const profile = mode === 'driving' ? 'driving-traffic' : mode;
    try {
        const response = await directionsClient.getDirections({
            profile: profile,
            waypoints: [{ coordinates: start }, { coordinates: end }],
            geometries: 'geojson',
            overview: 'full'
        }).send();

        if (response && response.body && response.body.routes[0]) {
            routeCache[key] = response.body.routes[0];
            // console.log(`Prefetched ${mode}`);
        }
    } catch (e) { /* ignore background errors */ }
}

// Update fetchRoute to trigger prefetch
const originalFetchRoute = fetchRoute;
// Overwrite or modify? simpler to modify the existing one below if possible, 
// but since I am replacing the end of file, I might just leave `fetchRoute` as is 
// and insert the prefetch call in `updateNavPosition`? 
// Or better: Let's inject the prefetch call into `debouncedFetchRoute` logic.

// Actually, I'll just hook into the existing flow.
// When `updateNavPosition` calls `debouncedFetchRoute`, we can add prefetch there.

// spinGlobe(); // Will be preserved by strict replacement if I match context correctly?
// I will include spinGlobe() call in replacement to be safe.

spinGlobe();
