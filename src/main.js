import mapboxgl from 'mapbox-gl';
import gsap from 'gsap';
import Papa from 'papaparse';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGpG5u16oKRt1KgtoM5HjBXqoCJMmzVrtcUrRNcYj3Y1kZBDLnuWqUNHSSJQUgJzrzrkYq2T3cLZOy/pub?output=csv';
let citiesData = [];

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
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnMode = document.getElementById('btn-mode');
const btnTheme = document.getElementById('btn-theme');
const btnLocation = document.getElementById('btn-location');
const btnProjection = document.getElementById('toggle-projection');
const cityCounter = document.getElementById('city-counter');
const cityCountValue = document.getElementById('city-count-value');

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

spinGlobe();
