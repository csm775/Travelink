// Configuration de l'API Booking.com via RapidAPI
const API_CONFIG = {
    BOOKING: {
        KEY: 'VOTRE_CLE_RAPIDAPI', // À remplacer avec votre clé RapidAPI
        HOST: 'booking-com15.p.rapidapi.com',
        BASE_URL: 'https://booking-com15.p.rapidapi.com/api/v1'
    }
};

// Classe pour gérer l'API Booking.com
class BookingAPI {
    constructor() {
        this.cache = new Map();
        this.cacheDuration = 3600000; // 1 heure
    }

    // Rechercher des hôtels par destination
    async searchHotels(params) {
        const { destination, checkIn, checkOut, adults = 2, rooms = 1 } = params;
        
        try {
            // Étape 1: Obtenir l'ID de la destination
            const destId = await this.getDestinationId(destination);
            
            if (!destId) {
                console.warn('Destination non trouvée, utilisation des données de fallback');
                return this.getFallbackHotels(destination);
            }

            // Étape 2: Rechercher les hôtels
            const url = `${API_CONFIG.BOOKING.BASE_URL}/hotels/searchHotels`;
            const queryParams = new URLSearchParams({
                dest_id: destId,
                search_type: 'CITY',
                arrival_date: checkIn || this.getDefaultCheckIn(),
                departure_date: checkOut || this.getDefaultCheckOut(),
                adults: adults,
                room_qty: rooms,
                units: 'metric',
                temperature_unit: 'c',
                languagecode: 'fr',
                currency_code: 'EUR'
            });

            const response = await fetch(`${url}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': API_CONFIG.BOOKING.KEY,
                    'x-rapidapi-host': API_CONFIG.BOOKING.HOST
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.data && data.data.hotels) {
                return this.formatHotels(data.data.hotels);
            }
            
            return this.getFallbackHotels(destination);
            
        } catch (error) {
            console.error('Erreur API Booking:', error);
            return this.getFallbackHotels(destination);
        }
    }

    // Obtenir l'ID de destination
    async getDestinationId(destination) {
        try {
            const url = `${API_CONFIG.BOOKING.BASE_URL}/hotels/searchDestination`;
            const response = await fetch(`${url}?query=${encodeURIComponent(destination)}`, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': API_CONFIG.BOOKING.KEY,
                    'x-rapidapi-host': API_CONFIG.BOOKING.HOST
                }
            });

            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                return data.data[0].dest_id;
            }
            
            return null;
        } catch (error) {
            console.error('Erreur recherche destination:', error);
            return null;
        }
    }

    // Formater les données des hôtels
    formatHotels(hotels) {
        return hotels.map(hotel => ({
            id: hotel.hotel_id,
            name: hotel.hotel_name || hotel.property_name || 'Hôtel',
            location: hotel.city || hotel.address || '',
            price: hotel.min_total_price || hotel.composite_price_breakdown?.gross_amount_per_night?.value || Math.floor(Math.random() * 200) + 50,
            currency: hotel.currency_code || 'EUR',
            rating: hotel.review_score ? (hotel.review_score / 2).toFixed(1) : (Math.random() * 2 + 3).toFixed(1),
            reviewCount: hotel.review_nr || Math.floor(Math.random() * 1000) + 100,
            image: hotel.max_1440_photo_url || hotel.main_photo_url || `https://source.unsplash.com/800x600/?hotel,${hotel.city}`,
            amenities: this.extractAmenities(hotel),
            type: this.determineType(hotel),
            distance: hotel.distance || (Math.random() * 5).toFixed(1),
            latitude: hotel.latitude,
            longitude: hotel.longitude
        }));
    }

    // Extraire les équipements
    extractAmenities(hotel) {
        const amenities = [];
        
        if (hotel.is_free_cancellable) amenities.push('Annulation gratuite');
        if (hotel.has_swimming_pool) amenities.push('Piscine');
        if (hotel.hotel_facilities) {
            const facilities = hotel.hotel_facilities.slice(0, 3);
            amenities.push(...facilities);
        }
        
        // Équipements par défaut si aucun disponible
        if (amenities.length === 0) {
            amenities.push('WiFi', 'Climatisation', 'Petit-déjeuner');
        }
        
        return amenities.slice(0, 4);
    }

    // Déterminer le type d'hébergement
    determineType(hotel) {
        const name = (hotel.hotel_name || '').toLowerCase();
        const type = (hotel.accommodation_type_name || '').toLowerCase();
        
        if (name.includes('resort') || type.includes('resort')) return 'resort';
        if (name.includes('apartment') || type.includes('apartment')) return 'apartment';
        if (name.includes('villa') || type.includes('villa')) return 'villa';
        return 'hotel';
    }

    // Dates par défaut
    getDefaultCheckIn() {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
    }

    getDefaultCheckOut() {
        const date = new Date();
        date.setDate(date.getDate() + 9);
        return date.toISOString().split('T')[0];
    }

    // Données de fallback (sans API)
    getFallbackHotels(destination) {
        const baseHotels = [
            {
                id: 1,
                name: `Grand Hôtel ${destination}`,
                location: `Centre-ville, ${destination}`,
                price: 120,
                currency: 'EUR',
                rating: 4.5,
                reviewCount: 856,
                image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800`,
                amenities: ['WiFi gratuit', 'Piscine', 'Spa', 'Restaurant'],
                type: 'hotel',
                distance: '0.5'
            },
            {
                id: 2,
                name: `${destination} Plaza Suites`,
                location: `Quartier affaires, ${destination}`,
                price: 95,
                currency: 'EUR',
                rating: 4.3,
                reviewCount: 642,
                image: `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800`,
                amenities: ['WiFi gratuit', 'Petit-déjeuner', 'Parking', 'Salle de sport'],
                type: 'hotel',
                distance: '1.2'
            },
            {
                id: 3,
                name: `Appartements ${destination} Downtown`,
                location: `Centre, ${destination}`,
                price: 75,
                currency: 'EUR',
                rating: 4.6,
                reviewCount: 423,
                image: `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800`,
                amenities: ['WiFi gratuit', 'Cuisine équipée', 'Balcon', 'Vue panoramique'],
                type: 'apartment',
                distance: '0.8'
            },
            {
                id: 4,
                name: `${destination} Beach Resort`,
                location: `Bord de mer, ${destination}`,
                price: 180,
                currency: 'EUR',
                rating: 4.8,
                reviewCount: 1205,
                image: `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800`,
                amenities: ['Plage privée', 'Piscine', 'Spa', 'Restaurant gastronomique'],
                type: 'resort',
                distance: '3.5'
            },
            {
                id: 5,
                name: `Villa ${destination} Luxury`,
                location: `Quartier résidentiel, ${destination}`,
                price: 250,
                currency: 'EUR',
                rating: 4.9,
                reviewCount: 287,
                image: `https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800`,
                amenities: ['Piscine privée', 'Jardin', 'Concierge', 'Chef privé'],
                type: 'villa',
                distance: '2.1'
            },
            {
                id: 6,
                name: `Boutique Hôtel ${destination}`,
                location: `Vieille ville, ${destination}`,
                price: 110,
                currency: 'EUR',
                rating: 4.7,
                reviewCount: 534,
                image: `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800`,
                amenities: ['WiFi gratuit', 'Petit-déjeuner', 'Bar', 'Terrasse'],
                type: 'hotel',
                distance: '0.3'
            },
            {
                id: 7,
                name: `${destination} City Apartments`,
                location: `Centre commercial, ${destination}`,
                price: 65,
                currency: 'EUR',
                rating: 4.2,
                reviewCount: 398,
                image: `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800`,
                amenities: ['WiFi gratuit', 'Cuisine', 'Parking', 'Près des transports'],
                type: 'apartment',
                distance: '1.5'
            },
            {
                id: 8,
                name: `Luxury Resort & Spa ${destination}`,
                location: `Zone exclusive, ${destination}`,
                price: 320,
                currency: 'EUR',
                rating: 5.0,
                reviewCount: 967,
                image: `https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800`,
                amenities: ['Tout inclus', 'Spa de luxe', 'Golf', '5 restaurants'],
                type: 'resort',
                distance: '4.2'
            }
        ];

        return baseHotels;
    }

    // Destinations populaires
    getPopularDestinations() {
        return [
            {
                name: 'Paris',
                country: 'France',
                image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
                hotelCount: 5234
            },
            {
                name: 'New York',
                country: 'États-Unis',
                image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
                hotelCount: 3892
            },
            {
                name: 'Tokyo',
                country: 'Japon',
                image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
                hotelCount: 4567
            },
            {
                name: 'Londres',
                country: 'Royaume-Uni',
                image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
                hotelCount: 4123
            },
            {
                name: 'Dubaï',
                country: 'Émirats Arabes Unis',
                image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
                hotelCount: 2876
            },
            {
                name: 'Barcelone',
                country: 'Espagne',
                image: 'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=800',
                hotelCount: 3421
            },
            {
                name: 'Rome',
                country: 'Italie',
                image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
                hotelCount: 2987
            },
            {
                name: 'Bali',
                country: 'Indonésie',
                image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
                hotelCount: 1876
            }
        ];
    }
}

// Exporter l'instance
const bookingAPI = new BookingAPI();