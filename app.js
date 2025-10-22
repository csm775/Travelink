// Variables globales
let allHotels = [];
let filteredHotels = [];
let favorites = JSON.parse(localStorage.getItem('travelink_favorites')) || [];
let currentDestination = 'Paris';
let activeFilter = 'all';

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupEventListeners();
    loadTheme();
    updateFavCount();
    await loadDefaultHotels();
    loadDestinations();
    setDefaultDates();
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Menu burger mobile
    const menuBurger = document.getElementById('menuBurger');
    const navMenu = document.querySelector('.nav-menu');
    
    menuBurger?.addEventListener('click', () => {
        navMenu?.classList.toggle('active');
    });

    // Recherche
    const searchForm = document.getElementById('searchForm');
    searchForm?.addEventListener('submit', handleSearch);

    // Suggestions rapides
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const city = chip.dataset.city;
            document.getElementById('searchInput').value = city;
            handleSearch(new Event('submit'));
        });
    });

    // Filtres
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            applyFilters();
        });
    });

    // Tri
    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
        sortHotels(e.target.value);
    });

    // Budget
    document.getElementById('priceRange')?.addEventListener('change', () => {
        applyFilters();
    });

    // Toggle thème
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

    // Modal favoris
    document.getElementById('favoriteToggle')?.addEventListener('click', showFavorites);
    document.getElementById('closeModal')?.addEventListener('click', () => {
        document.getElementById('favoritesModal').classList.remove('active');
    });

    // Navigation douce
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Fermer le menu mobile
            navMenu?.classList.remove('active');
            
            // Mettre à jour l'état actif
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// Charger les hôtels par défaut
async function loadDefaultHotels() {
    showLoader(true);
    allHotels = await bookingAPI.searchHotels({ destination: currentDestination });
    filteredHotels = [...allHotels];
    displayHotels(filteredHotels);
    updateResultsCount(filteredHotels.length);
    showLoader(false);
}

// Gérer la recherche
async function handleSearch(e) {
    e.preventDefault();
    
    const destination = document.getElementById('searchInput').value.trim();
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    
    if (!destination) {
        showNotification('Veuillez entrer une destination', 'warning');
        return;
    }
    
    currentDestination = destination;
    showLoader(true);
    
    allHotels = await bookingAPI.searchHotels({
        destination,
        checkIn,
        checkOut
    });
    
    filteredHotels = [...allHotels];
    displayHotels(filteredHotels);
    updateResultsCount(filteredHotels.length);
    showLoader(false);
    
    // Scroll vers les résultats
    document.getElementById('hotels').scrollIntoView({ behavior: 'smooth' });
}

// Afficher les hôtels
function displayHotels(hotels) {
    const grid = document.getElementById('hotelsGrid');
    const noResults = document.getElementById('noResults');
    
    if (!grid) return;
    
    if (hotels.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    grid.innerHTML = '';
    
    hotels.forEach((hotel, index) => {
        const card = createHotelCard(hotel, index);
        grid.appendChild(card);
    });
}

// Créer une carte d'hôtel
function createHotelCard(hotel, index) {
    const card = document.createElement('div');
    card.className = 'hotel-card';
    card.style.animationDelay = `${index * 0.05}s`;
    
    const isFavorite = favorites.includes(hotel.id);
    
    // Générer les étoiles
    const stars = generateStars(hotel.rating);
    
    card.innerHTML = `
        <div class="hotel-card-image">
            <img src="${hotel.image}" alt="${hotel.name}" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'">
            <button class="hotel-favorite ${isFavorite ? 'active' : ''}" onclick="toggleFavorite(${hotel.id})">
                <i class="fa-${isFavorite ? 'solid' : 'regular'} fa-heart"></i>
            </button>
            ${hotel.type === 'resort' ? '<div class="hotel-badge">Resort</div>' : ''}
            ${hotel.type === 'villa' ? '<div class="hotel-badge">Villa</div>' : ''}
        </div>
        
        <div class="hotel-card-content">
            <div class="hotel-rating">
                <div class="rating-stars">${stars}</div>
                <span class="rating-score">${hotel.rating}</span>
            </div>
            
            <h3 class="hotel-name">${hotel.name}</h3>
            
            <div class="hotel-location">
                <i class="fa-solid fa-location-dot"></i>
                <span>${hotel.location}</span>
            </div>
            
            <div class="hotel-features">
                ${hotel.amenities.slice(0, 3).map(a => `<span class="feature-tag">${a}</span>`).join('')}
            </div>
            
            <div class="hotel-price">
                <div>
                    <div class="price-amount">${hotel.price}€ <span>/nuit</span></div>
                    <small style="color: var(--text-muted); font-size: 13px;">${hotel.reviewCount} avis</small>
                </div>
                <button class="book-btn" onclick="bookHotel(${hotel.id})">
                    Réserver
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Générer les étoiles
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fa-solid fa-star"></i>';
    }
    
    if (hasHalf) {
        stars += '<i class="fa-solid fa-star-half-stroke"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="fa-regular fa-star"></i>';
    }
    
    return stars;
}

// Appliquer les filtres
function applyFilters() {
    let filtered = [...allHotels];
    
    // Filtre par type
    if (activeFilter !== 'all') {
        filtered = filtered.filter(h => h.type === activeFilter);
    }
    
    // Filtre par prix
    const priceRange = document.getElementById('priceRange').value;
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        filtered = filtered.filter(h => {
            if (max) {
                return h.price >= min && h.price <= max;
            } else {
                return h.price >= min;
            }
        });
    }
    
    filteredHotels = filtered;
    displayHotels(filteredHotels);
    updateResultsCount(filteredHotels.length);
}

// Trier les hôtels
function sortHotels(sortType) {
    if (!sortType) return;
    
    const sorted = [...filteredHotels];
    
    switch (sortType) {
        case 'price-asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
        case 'distance':
            sorted.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
            break;
    }
    
    filteredHotels = sorted;
    displayHotels(filteredHotels);
}

// Toggle favori
function toggleFavorite(hotelId) {
    const index = favorites.indexOf(hotelId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showNotification('Retiré des favoris', 'info');
    } else {
        favorites.push(hotelId);
        showNotification('Ajouté aux favoris', 'success');
    }
    
    localStorage.setItem('travelink_favorites', JSON.stringify(favorites));
    updateFavCount();
    displayHotels(filteredHotels);
}

// Afficher les favoris
function showFavorites() {
    const modal = document.getElementById('favoritesModal');
    const body = document.getElementById('favoritesBody');
    
    if (!body) return;
    
    if (favorites.length === 0) {
        body.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fa-regular fa-heart" style="font-size: 60px; color: var(--text-muted); margin-bottom: 16px;"></i>
                <h3 style="margin-bottom: 8px;">Aucun favori</h3>
                <p style="color: var(--text-secondary);">Ajoutez des hôtels à vos favoris pour les retrouver facilement</p>
            </div>
        `;
    } else {
        const favHotels = allHotels.filter(h => favorites.includes(h.id));
        body.innerHTML = `
            <div style="display: grid; gap: 20px;">
                ${favHotels.map(hotel => `
                    <div style="display: flex; gap: 16px; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius); align-items: center;">
                        <img src="${hotel.image}" alt="${hotel.name}" style="width: 120px; height: 90px; object-fit: cover; border-radius: var(--radius-sm);" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'">
                        <div style="flex: 1;">
                            <h4 style="margin-bottom: 4px;">${hotel.name}</h4>
                            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 8px;">${hotel.location}</p>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-weight: 700; color: var(--primary);">${hotel.price}€</span>
                                <span style="font-size: 14px; color: var(--text-muted);">${generateStars(hotel.rating)}</span>
                            </div>
                        </div>
                        <button onclick="toggleFavorite(${hotel.id})" style="background: var(--secondary); color: white; border: none; padding: 10px 16px; border-radius: var(--radius-sm); cursor: pointer; font-weight: 600;">
                            Retirer
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    modal.classList.add('active');
}

// Réserver un hôtel
function bookHotel(hotelId) {
    const hotel = allHotels.find(h => h.id === hotelId);
    if (hotel) {
        showNotification(`Réservation de ${hotel.name} - Fonctionnalité à venir !`, 'info');
    }
}

// Charger les destinations
function loadDestinations() {
    const destinations = bookingAPI.getPopularDestinations();
    const grid = document.getElementById('destinationsGrid');
    
    if (!grid) return;
    
    grid.innerHTML = destinations.map((dest, index) => `
        <div class="destination-card" onclick="selectDestination('${dest.name}')" style="animation-delay: ${index * 0.1}s">
            <img src="${dest.image}" alt="${dest.name}" onerror="this.src='https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800'">
            <div class="destination-overlay">
                <h3 class="destination-name">${dest.name}</h3>
                <p class="destination-count">${dest.hotelCount.toLocaleString()} hébergements</p>
            </div>
        </div>
    `).join('');
}

// Sélectionner une destination
async function selectDestination(city) {
    document.getElementById('searchInput').value = city;
    currentDestination = city;
    
    showLoader(true);
    allHotels = await bookingAPI.searchHotels({ destination: city });
    filteredHotels = [...allHotels];
    displayHotels(filteredHotels);
    updateResultsCount(filteredHotels.length);
    showLoader(false);
    
    // Scroll vers les hôtels
    document.getElementById('hotels').scrollIntoView({ behavior: 'smooth' });
}

// Afficher/masquer le loader
function showLoader(show) {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('hotelsGrid');
    
    if (loader) loader.style.display = show ? 'block' : 'none';
    if (grid) grid.style.display = show ? 'none' : 'grid';
}

// Mettre à jour le compteur de résultats
function updateResultsCount(count) {
    const counter = document.getElementById('resultsCount');
    if (counter) {
        counter.textContent = `${count} hébergement${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
    }
}

// Mettre à jour le compteur de favoris
function updateFavCount() {
    const counter = document.getElementById('favCount');
    if (counter) {
        counter.textContent = favorites.length;
        counter.style.display = favorites.length > 0 ? 'flex' : 'none';
    }
}

// Toggle thème
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
    
    localStorage.setItem('travelink_theme', isDark ? 'dark' : 'light');
}

// Charger le thème sauvegardé
function loadTheme() {
    const theme = localStorage.getItem('travelink_theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.className = 'fa-solid fa-sun';
    }
}

// Définir les dates par défaut
function setDefaultDates() {
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    if (checkInInput && checkOutInput) {
        const today = new Date();
        const checkIn = new Date(today);
        checkIn.setDate(checkIn.getDate() + 7);
        
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 2);
        
        checkInInput.value = checkIn.toISOString().split('T')[0];
        checkOutInput.value = checkOut.toISOString().split('T')[0];
        
        // Empêcher les dates passées
        checkInInput.min = today.toISOString().split('T')[0];
        checkOutInput.min = today.toISOString().split('T')[0];
    }
}

// Notifications
function showNotification(message, type = 'info') {
    // Créer l'élément de notification s'il n'existe pas
    let notif = document.getElementById('notification');
    
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'notification';
        notif.style.cssText = `
            position: fixed;
            top: 100px;
            right: 24px;
            padding: 16px 24px;
            background: var(--bg-primary);
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            border-left: 4px solid var(--primary);
        `;
        document.body.appendChild(notif);
    }
    
    // Couleur selon le type
    const colors = {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#6366f1'
    };
    
    const icons = {
        success: 'fa-circle-check',
        warning: 'fa-triangle-exclamation',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info'
    };
    
    notif.style.borderLeftColor = colors[type] || colors.info;
    notif.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info}" style="font-size: 20px; color: ${colors[type] || colors.info}"></i>
        <span style="font-weight: 500;">${message}</span>
    `;
    
    // Afficher
    setTimeout(() => {
        notif.style.transform = 'translateX(0)';
    }, 100);
    
    // Masquer après 3 secondes
    setTimeout(() => {
        notif.style.transform = 'translateX(400px)';
    }, 3000);
}

// Smooth scroll pour tous les liens
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Animation au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observer les cartes d'hôtels
setTimeout(() => {
    document.querySelectorAll('.hotel-card, .destination-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}, 500);