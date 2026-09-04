import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import { SportsEvent, SportsCategory } from '../types';
import { TURKEY_CITIES } from '../data/turkeyLocations';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Filter, 
  Star, 
  Trophy, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  Maximize2, 
  Minimize2,
  Compass, 
  X, 
  CheckCircle2, 
  AlertCircle,
  LocateFixed,
  SlidersHorizontal,
  List,
  Eye,
  EyeOff
} from 'lucide-react';

interface EventMapViewProps {
  events: SportsEvent[];
  onSelectEvent: (event: SportsEvent) => void;
  selectedCategory?: SportsCategory;
  onSelectCategory?: (cat: SportsCategory) => void;
  selectedCity?: string;
  onSelectCity?: (city: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

// Calculate Haversine Distance in Kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Category Badge Color Helper for Pins
const getCategoryBadgeBg = (cat: SportsCategory) => {
  switch (cat) {
    case 'Spor Tesisleri': return '#10b981'; // emerald
    case 'Spor Salonları': return '#f59e0b'; // amber
    case 'Spor Okulları': return '#8b5cf6'; // purple
    case 'Spor Etkinlikleri': return '#06b6d4'; // cyan
    default: return '#3b82f6'; // blue
  }
};

export const EventMapView: React.FC<EventMapViewProps> = ({
  events,
  onSelectEvent,
  selectedCategory = 'Tümü',
  onSelectCategory,
  selectedCity = 'Tüm Şehirler',
  onSelectCity,
  searchQuery = '',
  setSearchQuery,
  isModal = false,
  onCloseModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Fullscreen Map State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebarInFullscreen, setShowSidebarInFullscreen] = useState(true);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Keyboard Escape key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Recalculate Leaflet Map size when fullscreen or sidebar visibility changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen, showSidebarInFullscreen]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(0); // 0 means all distances
  const [activeHoveredEventId, setActiveHoveredEventId] = useState<string | null>(null);

  // Pagination for Map Sidebar List
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;
  const sidebarListRef = useRef<HTMLDivElement | null>(null);

  // Local Category Filter state if parent doesn't handle
  const [categoryFilter, setCategoryFilter] = useState<SportsCategory>(selectedCategory);
  const [cityFilter, setCityFilter] = useState<string>(selectedCity);
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery);

  // Synchronize with props
  useEffect(() => {
    setCategoryFilter(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    setCityFilter(selectedCity);
  }, [selectedCity]);

  // Reset pagination to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, cityFilter, searchTerm, maxRadiusKm, userCoords]);

  // Filter events matching active filters
  const filteredEvents = events.filter((e) => {
    if (e.isActive === false) return false;
    
    // Latitude and longitude must exist
    if (!e.latitude || !e.longitude) return false;

    // Category filter
    if (categoryFilter !== 'Tümü' && e.category !== categoryFilter) return false;

    // City filter
    if (cityFilter !== 'Tüm Şehirler' && e.city !== cityFilter) return false;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Radius distance filter if user location is active
    if (userCoords && maxRadiusKm > 0) {
      const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, e.latitude, e.longitude);
      if (dist > maxRadiusKm) return false;
    }

    return true;
  });

  // Events with distance calculated if user position available
  const eventsWithDistance = filteredEvents.map((e) => {
    const dist = userCoords && e.latitude && e.longitude
      ? calculateDistanceKm(userCoords.lat, userCoords.lng, e.latitude, e.longitude)
      : null;
    return { ...e, distanceKm: dist };
  }).sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm;
    }
    return b.overallScore - a.overallScore;
  });

  const totalPages = Math.max(1, Math.ceil(eventsWithDistance.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEvents = eventsWithDistance.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove existing map instance before creating a new one if DOM re-mounted
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.error('Error removing previous map instance:', err);
      }
      mapInstanceRef.current = null;
    }

    // Default center in Turkey (e.g. Istanbul / Turkey center)
    const initialMap = L.map(mapContainerRef.current, {
      center: [41.0082, 28.9784],
      zoom: 10,
      zoomControl: false,
    });

    // Add Zoom control to top right
    L.control.zoom({ position: 'topright' }).addTo(initialMap);

    // Add Dark / High contrast CartoDB map tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(initialMap);

    markersGroupRef.current = L.layerGroup().addTo(initialMap);
    
    mapInstanceRef.current = initialMap;

    // Trigger map resize recalculation for full screen / container changes
    const t1 = setTimeout(() => {
      initialMap.invalidateSize();
    }, 100);
    const t2 = setTimeout(() => {
      initialMap.invalidateSize();
    }, 350);

    // Cleanup on unmount or when full screen toggles
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [isFullscreen]);

  // Update Markers when filteredEvents or isFullscreen changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear existing markers
    markersGroup.clearLayers();

    if (filteredEvents.length === 0) return;

    const bounds = L.latLngBounds([]);

    filteredEvents.forEach((ev) => {
      if (!ev.latitude || !ev.longitude) return;

      const latLng: [number, number] = [ev.latitude, ev.longitude];
      bounds.extend(latLng);

      const color = getCategoryBadgeBg(ev.category);

      // Create Custom DivIcon
      const customIcon = L.divIcon({
        className: 'custom-sporpuan-marker',
        html: `
          <div style="
            background-color: ${color};
            color: #020617;
            font-weight: 900;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 20px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            white-space: nowrap;
            transition: transform 0.2s;
          " class="marker-pill hover:scale-110">
            <span>★ ${ev.overallScore.toFixed(1)}</span>
            <span style="opacity: 0.85; font-size: 9px; border-left: 1px solid rgba(0,0,0,0.2); padding-left: 4px;">${ev.category.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [80, 28],
        iconAnchor: [40, 14],
        popupAnchor: [0, -16],
      });

      const marker = L.marker(latLng, { icon: customIcon });

      // Create rich HTML popup content
      const popupHtml = `
        <div style="font-family: sans-serif; color: #0f172a; width: 180px; text-align: left;">
          <img referrerPolicy="no-referrer" src="${ev.image || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=200&auto=format&fit=crop'}" style="width: 100%; height: 75px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />
          <div style="display: flex; items-center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
            <span style="background-color: ${color}; color: #020617; font-size: 9px; font-weight: 800; padding: 2px 4px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">
              ${ev.category}
            </span>
            <span style="font-size: 11px; font-weight: 900; color: #059669; white-space: nowrap;">
              ★ ${ev.overallScore.toFixed(1)} / 10
            </span>
          </div>
          <h4 style="font-weight: 800; font-size: 12px; margin: 4px 0 2px 0; color: #020617; line-height: 1.2;">
            ${ev.title}
          </h4>
          <p style="font-size: 10px; color: #64748b; margin: 0 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            📍 ${ev.venue} (${ev.city})
          </p>
          <button id="btn-detail-${ev.id}" style="
            width: 100%;
            background: linear-gradient(135deg, #10b981, #14b8a6);
            color: #020617;
            font-weight: 800;
            font-size: 10px;
            padding: 6px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
          ">
            İncele
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      // On popup open attach click listener to button
      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`btn-detail-${ev.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectEvent(ev);
            };
          }
        }, 50);
      });

      markersGroup.addLayer(marker);
    });

    // Re-add user location marker if user coords exist
    if (userCoords) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background-color: #3b82f6;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>📍 Sizin Konumunuz</b><br>Yakındaki spor etkinlikleri hesaplandı.');
    }

    // Fit map bounds if markers exist
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [filteredEvents, isFullscreen]);

  // Handle Find My Location
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      const fallbackLat = 41.0082;
      const fallbackLng = 28.9784;
      setUserCoords({ lat: fallbackLat, lng: fallbackLng });
      const map = mapInstanceRef.current;
      if (map) {
        map.flyTo([fallbackLat, fallbackLng], 12, { animate: true });
      }
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);

        const map = mapInstanceRef.current;
        if (map) {
          // Pan and zoom to user
          map.flyTo([latitude, longitude], 12, { animate: true });

          // Add or update glowing user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            const userIcon = L.divIcon({
              className: 'user-location-marker',
              html: `
                <div style="
                  width: 20px;
                  height: 20px;
                  background-color: #3b82f6;
                  border: 3px solid #ffffff;
                  border-radius: 50%;
                  box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
                "></div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
              .addTo(map)
              .bindPopup('<b>📍 Sizin Konumunuz</b><br>Yakındaki spor etkinlikleri hesaplandı.');
          }

          userMarkerRef.current.openPopup();
        }
      },
      (err) => {
        setIsLocating(false);
        // Fallback to a default central location (e.g., Istanbul) if location fails
        const fallbackLat = 41.0082;
        const fallbackLng = 28.9784;
        setUserCoords({ lat: fallbackLat, lng: fallbackLng });
        
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([fallbackLat, fallbackLng], 12, { animate: true });
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const [searchParams] = useSearchParams();

  // Fly to event on map when clicked in side list
  const handleFlyToEvent = (event: SportsEvent) => {
    if (!event.latitude || !event.longitude) return;
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([event.latitude, event.longitude], 14, { animate: true });
      // Find and open popup
      markersGroupRef.current?.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          const latLng = layer.getLatLng();
          if (Math.abs(latLng.lat - event.latitude!) < 0.0001 && Math.abs(latLng.lng - event.longitude!) < 0.0001) {
            layer.openPopup();
          }
        }
      });
    }
  };

  // Auto-focus event if 'id' parameter is passed in URL
  useEffect(() => {
    const targetId = searchParams.get('id');
    if (targetId && events.length > 0) {
      const targetEvent = events.find((e) => e.id === targetId);
      if (targetEvent) {
        const timer = setTimeout(() => {
          handleFlyToEvent(targetEvent);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, events]);

  const mapContent = (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Top Map Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 shadow-sm">
        
        {/* Left: Locate Me & Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleLocateUser}
            disabled={isLocating}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Konum Alınıyor...' : 'Konumumu Bul & Yakındakiler'}</span>
          </button>

          {userCoords && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Konumunuz Aktif • {eventsWithDistance.filter(e => e.distanceKm !== null).length} Kayıt Mesafesi Hesaplandı</span>
            </div>
          )}

          {locationError && (
            <div className="text-amber-800 text-xs flex items-center gap-1 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{locationError}</span>
            </div>
          )}
        </div>

        {/* Right: Radius & Category Quick Filter */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          
          {userCoords && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-700 shrink-0">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-500 text-[11px]">Mesafe:</span>
              <select
                value={maxRadiusKm}
                onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
                className="bg-transparent text-blue-600 font-bold focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-white text-slate-800">Tüm Mesafeler</option>
                <option value={10} className="bg-white text-slate-800">&lt; 10 km</option>
                <option value={25} className="bg-white text-slate-800">&lt; 25 km</option>
                <option value={50} className="bg-white text-slate-800">&lt; 50 km</option>
                <option value={100} className="bg-white text-slate-800">&lt; 100 km</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-700 shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as SportsCategory);
                if (onSelectCategory) onSelectCategory(e.target.value as SportsCategory);
              }}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              {['Tümü', 'Spor Tesisleri', 'Spor Salonları', 'Spor Okulları', 'Spor Etkinlikleri'].map((cat) => (
                <option key={cat} value={cat} className="bg-white text-slate-800">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-700 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                if (onSelectCity) onSelectCity(e.target.value);
              }}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Tüm Şehirler" className="bg-white text-slate-800">Tüm Şehirler</option>
              {TURKEY_CITIES.map((c) => (
                <option key={c.name} value={c.name} className="bg-white text-slate-800">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl transition shadow-2xs shrink-0 active:scale-95 ${
              isFullscreen
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700'
            }`}
            title={isFullscreen ? 'Tam Ekrandan Çık (Esc)' : 'Haritayı Tam Ekran Moduna Al'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Küçült (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Tam Ekran</span>
              </>
            )}
          </button>

        </div>

      </div>

      {/* Main Map & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        
        {/* Leaflet Map Area */}
        <div className={`${isFullscreen && !showSidebarInFullscreen ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white border border-slate-200 rounded-3xl overflow-hidden relative shadow-sm min-h-[380px] lg:min-h-full h-full flex flex-col`}>
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px] flex-1 z-10" />

          {/* Floating Action Controls on Top Right of Map */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {isFullscreen && (
              <button
                onClick={() => setShowSidebarInFullscreen(prev => !prev)}
                className="bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 hover:text-blue-600 border border-slate-200 dark:border-slate-700 shadow-md px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-extrabold transition hover:scale-105 backdrop-blur-md"
                title={showSidebarInFullscreen ? 'Tesis Listesini Gizle' : 'Tesis Listesini Göster'}
              >
                {showSidebarInFullscreen ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4 text-blue-600" />}
                <span className="hidden sm:inline">Liste ({showSidebarInFullscreen ? 'Gizle' : 'Göster'})</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="hidden md:flex bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 hover:text-blue-600 border border-slate-200 dark:border-slate-700 shadow-md px-3 py-2 rounded-xl items-center gap-1.5 text-xs font-extrabold transition hover:scale-105 backdrop-blur-md"
              title={isFullscreen ? 'Tam Ekrandan Çık (Esc)' : 'Haritayı Tam Ekran Yap'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-600">Küçült (Esc)</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-blue-600" />
                  <span>Tam Ekran</span>
                </>
              )}
            </button>
          </div>

          {/* Floating Badge Indicator */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/90 border border-slate-200 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-slate-700 flex items-center gap-2 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Haritada <strong>{filteredEvents.length}</strong> Kayıt Listeleniyor</span>
          </div>
        </div>

        {/* Sidebar: Nearby & Filtered Events List */}
        {(!isFullscreen || showSidebarInFullscreen) && (
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col space-y-3 overflow-hidden shadow-sm max-h-[520px] lg:max-h-full h-full">
            
            <div className="shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tesis, salon, okul, etkinlik ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  {userCoords ? 'Yakındakiler' : 'Harita Listesi'}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-blue-50 text-blue-700 font-mono font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  {eventsWithDistance.length} Kayıt
                </span>
                {totalPages > 1 && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                    S. {safeCurrentPage}/{totalPages}
                  </span>
                )}
              </div>
            </div>

            {eventsWithDistance.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2 my-auto">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Bu filtrelere uygun etkinlik haritada bulunamadı.</p>
                <p className="text-[11px]">Mesafe yarıçapını genişletebilir veya şehir filtresini değiştirebilirsiniz.</p>
              </div>
            ) : (
              <>
                <div ref={sidebarListRef} className="overflow-y-auto space-y-2.5 flex-1 pr-1">
                  {paginatedEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => handleFlyToEvent(ev)}
                      onMouseEnter={() => setActiveHoveredEventId(ev.id)}
                      onMouseLeave={() => setActiveHoveredEventId(null)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                        activeHoveredEventId === ev.id
                          ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                      }`}
                    >
                      <img referrerPolicy="no-referrer"
                        src={ev.image || ''}
                        alt={ev.title}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                            {ev.category}
                          </span>
                          <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {ev.overallScore.toFixed(1)}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 truncate leading-tight">
                          {ev.title}
                        </h4>

                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="truncate">📍 {ev.venue}</span>
                          {ev.distanceKm !== null && (
                            <span className="bg-blue-50 text-blue-700 font-mono font-bold px-1.5 py-0.5 rounded shrink-0 border border-blue-200">
                              {ev.distanceKm} km
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        title="Detaylar & Puan Tablosu"
                        className="p-2 bg-white hover:bg-blue-600 hover:text-white text-slate-600 rounded-xl transition shrink-0 border border-slate-200 shadow-2xs"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Sidebar Pagination Bar */}
                {totalPages > 1 && (
                  <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (safeCurrentPage > 1) {
                          setCurrentPage((prev) => prev - 1);
                          if (sidebarListRef.current) sidebarListRef.current.scrollTop = 0;
                        }
                      }}
                      disabled={safeCurrentPage === 1}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-bold text-slate-700 rounded-xl transition flex items-center gap-1 text-[11px]"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Önceki</span>
                    </button>

                    <div className="flex items-center gap-1 overflow-x-auto max-w-[140px] px-1 py-0.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            if (sidebarListRef.current) sidebarListRef.current.scrollTop = 0;
                          }}
                          className={`w-6 h-6 rounded-lg text-[11px] font-extrabold transition shrink-0 flex items-center justify-center ${
                            pageNum === safeCurrentPage
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (safeCurrentPage < totalPages) {
                          setCurrentPage((prev) => prev + 1);
                          if (sidebarListRef.current) sidebarListRef.current.scrollTop = 0;
                        }
                      }}
                      disabled={safeCurrentPage >= totalPages}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-bold text-slate-700 rounded-xl transition flex items-center gap-1 text-[11px]"
                    >
                      <span>Sonraki</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        )}

      </div>

    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 p-3 sm:p-4 flex flex-col text-slate-800 overflow-hidden h-screen w-screen">
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-800 mb-3 flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                Sporpuan Harita
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">Tam Ekran Modu</span>
              </h3>
              <p className="text-[11px] text-slate-400">Gelişmiş filtreleme ve konum takibi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Tam Ekrandan Çık (Esc)</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden min-h-0 bg-slate-100 dark:bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-2xl flex flex-col">
          {mapContent}
        </div>
      </div>
    );
  }

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-6xl h-[88vh] p-5 overflow-hidden shadow-2xl flex flex-col text-slate-800 my-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold shadow-2xs">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Sporpuan Haritası</h3>
                <p className="text-xs text-slate-500 font-medium">sporpuan Türkiye spor tesisleri ve etkinlik lokasyonları</p>
              </div>
            </div>

            {onCloseModal && (
              <button
                onClick={onCloseModal}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {mapContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col min-h-[calc(100vh-140px)]">
      {mapContent}
    </div>
  );
};
