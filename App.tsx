import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { INITIAL_EVENTS } from './data/mockEvents';
import { SportsEvent, SportsCategory, Review, UserProfile, UserRole } from './types';
import { db } from './lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { EventCard } from './components/EventCard';
import { FavoritesPage } from './pages/FavoritesPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ProfilePage } from './pages/ProfilePage';
import { SuggestFacilityPage } from './pages/SuggestFacilityPage';
import { EventDetailModal } from './components/EventDetailModal';
import { AddReviewModal } from './components/AddReviewModal';
import { SubmitEventModal } from './components/SubmitEventModal';
import { EventMapView } from './components/EventMapView';
import { EditEventModal } from './components/EditEventModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { CorporatePage } from './components/CorporatePage';
import { CorporateInviteForm } from './components/CorporateInviteForm';
import { ReviewPage } from './components/ReviewPage';
import { SporpuanlilarNeDemis } from './components/SporpuanlilarNeDemis';
import { ShareExperienceCTA } from './components/ShareExperienceCTA';
import { Footer } from './components/Footer';
import { SEOHead } from './components/SEOHead';
import { SupportButton } from './components/SupportButton';
import { CertifiedPage } from './pages/CertifiedPage';
import CertifiedAuthPrompt from './components/CertifiedAuthPrompt';
import { ContactPage } from './pages/ContactPage';
import { useFacilities } from './hooks/useFacilities';
import { Trophy, SearchX, Sparkles, Filter, PlusCircle, MapPin, Building2, Map as MapIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_CRITERIA_MAP, calculateOverallScore } from './lib/scoreUtils';
import { detectCategory, getEventDetailUrl, getSlugOrId } from './lib/categoryUtils';

const EventDetailWrapper = ({
  events,
  onRateClick,
  onLikeReview,
  currentUser,
  setEditingEvent,
  onUpdateEvent,
  onToggleFavorite,
  isLoading
}: {
  events: SportsEvent[],
  onRateClick: (event: SportsEvent) => void,
  onLikeReview: (eventId: string, reviewId: string) => void,
  currentUser: UserProfile | null,
  setEditingEvent: (event: SportsEvent) => void,
  onUpdateEvent: (event: SportsEvent) => void,
  onToggleFavorite: (eventId: string) => void,
  isLoading?: boolean
}) => {

  const { id } = useParams();
  const navigate = useNavigate();

  const rawId = id || '';
  const decodedId = useMemo(() => {
    if (!rawId) return '';
    try {
      return decodeURIComponent(rawId).toLowerCase().trim();
    } catch (e) {
      return rawId.toLowerCase().trim();
    }
  }, [rawId]);

  const event = useMemo(() => {
    if (!decodedId) return null;
    return events.find((e) => {
      if (!e) return false;
      const matchId = String(e.id || '').toLowerCase().trim();
      const matchSlug = String(e.slug || '').toLowerCase().trim();
      const matchPlaceId = String(e.googlePlaceId || '').toLowerCase().trim();
      const matchTitleSlug = String(e.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9ğüşıöç]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const matchCleanTitleSlug = String(e.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      return (
        matchId === decodedId ||
        matchSlug === decodedId ||
        (matchPlaceId && matchPlaceId === decodedId) ||
        matchTitleSlug === decodedId ||
        matchCleanTitleSlug === decodedId ||
        matchId === rawId.toLowerCase().trim() ||
        matchSlug === rawId.toLowerCase().trim()
      );
    });
  }, [events, decodedId, rawId]);

  if (!event) {
    if (isLoading) {
      return (
        <div className="p-20 text-center flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Sayfa yükleniyor...</p>
        </div>
      );
    }
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">İçerik Bulunamadı</h2>
        <p className="text-slate-500 dark:text-slate-400">Bu etkinlik/tesis yayından kaldırılmış veya bağlantı adresi hatalı olabilir.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">Ana Sayfaya Dön</button>
      </div>
    );
  }

  return (
    <>
      <SEOHead event={event} />
      <EventDetailModal
        event={event}
        isFavorite={currentUser?.favorites?.includes(event.id)}
        onToggleFavorite={onToggleFavorite}
        onClose={() => navigate('/')}
        onOpenRateForm={onRateClick}
        onLikeReview={onLikeReview}
        onUpdateEvent={currentUser?.role === 'admin' ? onUpdateEvent : undefined}
        onOpenEditModal={
          currentUser?.role === 'admin'
            ? (ev) => setEditingEvent(ev)
            : undefined
        }
      />
    </>
  );
};

export default function App() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: facilitiesData, isLoading: isSyncingFirestore } = useFacilities();

  const [events, setEvents] = useState<SportsEvent[]>(() => {
    let initialList: SportsEvent[] = [];
    const saved = localStorage.getItem('sporpuan_events_v2');
    if (saved) {
      try {
        initialList = JSON.parse(saved);
      } catch (e) {
        initialList = INITIAL_EVENTS;
      }
    } else {
      initialList = INITIAL_EVENTS;
    }
    return initialList;
  });

  useEffect(() => {
    if (facilitiesData) {
      setEvents(facilitiesData);
    }
  }, [facilitiesData]);

  // Save changes to localStorage
  const updateEventsState = (newEvents: SportsEvent[]) => {
    setEvents(newEvents);
    queryClient.setQueryData(['facilities'], newEvents);
    localStorage.setItem('sporpuan_events_v2', JSON.stringify(newEvents));
  };
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filter & Search States
  const [selectedCategory, setSelectedCategory] = useState<SportsCategory>('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tüm Şehirler');
  const [sortBy, setSortBy] = useState('score-desc');

  // Pagination State
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page number when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, selectedCity, sortBy]);

  // Modal States
  const [rateModalEvent, setRateModalEvent] = useState<SportsEvent | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isSubmitEventOpen, setIsSubmitEventOpen] = useState(false);
  const [isMapViewModalOpen, setIsMapViewModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SportsEvent | null>(null);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('sporpuan_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'default' | 'corporate'>('default');

  const openAuthModal = (mode: 'default' | 'corporate' = 'default') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('sporpuan_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('sporpuan_user');
    } catch (e) {
      console.error(e);
    }
  };


  const handleToggleFavorite = async (eventId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const currentFavorites = currentUser.favorites || [];
    const isFavorite = currentFavorites.includes(eventId);
    let newFavorites;
    if (isFavorite) {
      newFavorites = currentFavorites.filter(id => id !== eventId);
    } else {
      newFavorites = [...currentFavorites, eventId];
    }
    
    const updatedUser = { ...currentUser, favorites: newFavorites };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('sporpuan_user', JSON.stringify(updatedUser));
      await updateDoc(doc(db, 'users', currentUser.id), {
        favorites: newFavorites
      });
    } catch (e) {
      console.error('Error updating favorites:', e);
    }
  };

  const handleOpenAuthModal = (mode: 'default' | 'corporate' = 'default') => {
    openAuthModal(mode);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const updated = events.filter((ev) => ev.id !== eventId);
    updateEventsState(updated);
    try {
      await deleteDoc(doc(db, 'facilities', eventId));
    } catch (err) {
      console.error('Firestore delete facility error:', err);
    }
  };

  const handleUpdateEvent = async (updatedEvent: SportsEvent) => {
    const isNew = !events.some(ev => ev.id === updatedEvent.id);
    const updatedList = isNew 
      ? [updatedEvent, ...events] 
      : events.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev));
    updateEventsState(updatedList);

    try {
      const facilityRef = doc(db, 'facilities', updatedEvent.id);
      await updateDoc(facilityRef, {
        title: updatedEvent.title,
        name: updatedEvent.title,
        category: updatedEvent.category,
        city: updatedEvent.city,
        address: updatedEvent.venue,
        image: updatedEvent.image,
        isActive: updatedEvent.isActive !== false,
        description: updatedEvent.description || '',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      try {
        await setDoc(doc(db, 'facilities', updatedEvent.id), {
          title: updatedEvent.title,
          name: updatedEvent.title,
          category: updatedEvent.category,
          city: updatedEvent.city,
          address: updatedEvent.venue,
          image: updatedEvent.image,
          isActive: updatedEvent.isActive !== false,
          description: updatedEvent.description || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e2) {
        console.error('Firestore update facility error:', e2);
      }
    }
  };

  const handleUpdateEventsBatch = (updatedEvents: SportsEvent[]) => {
    setEvents((prevEvents) => {
      const updatedMap = new Map(updatedEvents.map((e) => [e.id, e]));
      const newEvents = prevEvents.map((ev) => updatedMap.get(ev.id) || ev);
      updatedEvents.forEach((ev) => {
        if (!newEvents.some((e) => e.id === ev.id)) {
          newEvents.push(ev);
        }
      });
      try {
        localStorage.setItem('sporpuan_events_v2', JSON.stringify(newEvents));
        queryClient.setQueryData(['facilities'], newEvents);
      } catch (e) {
        console.error(e);
      }
      return newEvents;
    });
  };

  const handleResetEvents = () => {
    updateEventsState(INITIAL_EVENTS);
  };

  // Extract list of cities
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    events.forEach((e) => citySet.add(e.city));
    return Array.from(citySet).sort();
  }, [events]);

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Is Active check (Admin should see all, but here we just filter for main UI)
      if (ev.isActive === false) {
        return false;
      }

      // Category match
      if (selectedCategory !== 'Tümü' && ev.category !== selectedCategory) {
        return false;
      }

      // City match
      if (selectedCity !== 'Tüm Şehirler' && ev.city !== selectedCity) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = ev.title.toLowerCase().includes(query);
        const venueMatch = ev.venue.toLowerCase().includes(query);
        const orgMatch = ev.organizer.toLowerCase().includes(query);
        const cityMatch = ev.city.toLowerCase().includes(query);
        const catMatch = ev.category.toLowerCase().includes(query);
        const tagMatch = ev.tags.some((t) => t.toLowerCase().includes(query));

        if (!titleMatch && !venueMatch && !orgMatch && !cityMatch && !catMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'score-desc') return b.overallScore - a.overallScore;
      if (sortBy === 'reviews-desc') return b.reviewCount - a.reviewCount;
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title, 'tr');
      return 0;
    });
  }, [events, selectedCategory, selectedCity, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = useMemo(() => {
    return Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
  }, [filteredEvents.length, ITEMS_PER_PAGE]);

  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage, ITEMS_PER_PAGE]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const eventsSection = document.getElementById('events-section');
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  // Handle Review Submission
  const handleAddReview = (eventId: string, newReview: Review) => {
    const updated = events.map((ev) => {
      if (ev.id === eventId) {
        const newReviews = [newReview, ...ev.reviews];
        const newReviewCount = ev.reviewCount + 1;

        // Recalculate breakdown averages dynamically based on category
        const newBreakdown: Record<string, number> = {};
        const criteria = CATEGORY_CRITERIA_MAP[ev.category] || CATEGORY_CRITERIA_MAP['Spor Etkinlikleri'];
        
        criteria.forEach(crit => {
          const sum = newReviews.reduce((acc, r) => acc + (r.scores[crit.key] ?? ev.ratingBreakdown[crit.key] ?? ev.overallScore ?? 8), 0);
          newBreakdown[crit.key] = Math.round((sum / newReviews.length) * 10) / 10;
        });

        const newOverall = calculateOverallScore(newBreakdown, ev.category);

        const updatedEv = {
          ...ev,
          reviews: newReviews,
          reviewCount: newReviewCount,
          ratingBreakdown: newBreakdown,
          overallScore: newOverall,
        };

        return updatedEv;
      }
      return ev;
    });

    updateEventsState(updated);
  };

  // Handle New Event Submission
  const handleAddNewEvent = (newEvent: SportsEvent) => {
    const updated = [newEvent, ...events];
    updateEventsState(updated);
  };

  // Handle Like Review
  const handleLikeReview = (eventId: string, reviewId: string) => {
    const updated = events.map((ev) => {
      if (ev.id === eventId) {
        const newReviews = ev.reviews.map((r) => {
          if (r.id === reviewId) {
            return { ...r, likes: r.likes + 1 };
          }
          return r;
        });
        const updatedEv = { ...ev, reviews: newReviews };
        return updatedEv;
      }
      return ev;
    });
    updateEventsState(updated);
  };

  // Open Rate Page for specific event
  const handleRateClick = (event: SportsEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    window.scrollTo(0, 0);
    navigate(`/yorum-yaz?id=${event.id}`);
  };

  const detailElement = (
    <EventDetailWrapper 
      events={events}
      onToggleFavorite={handleToggleFavorite}
      onRateClick={(ev) => {
        if (!currentUser) {
          setIsAuthModalOpen(true);
          return;
        }
        window.scrollTo(0, 0);
        navigate(`/yorum-yaz?id=${ev.id}`);
      }}
      onLikeReview={handleLikeReview}
      currentUser={currentUser}
      setEditingEvent={setEditingEvent}
      onUpdateEvent={handleUpdateEvent}
      isLoading={isSyncingFirestore}
    />
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col pb-16 md:pb-0 selection:bg-blue-600 selection:text-white transition-colors duration-200">
      
      {/* Navigation Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenAddReview={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
            return;
          }
          window.scrollTo(0, 0);
          navigate('/yorum-yaz');
        }}
        onOpenSubmitEvent={() => setIsSubmitEventOpen(true)}
        onOpenMapView={() => {
          window.scrollTo(0, 0);
          navigate('/harita');
        }}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        cities={cities}
      />

      {/* Main Content */}
      <main className="flex-1 w-full bg-slate-50 dark:bg-slate-950 relative pt-2 transition-colors duration-200">
        <Routes>
          {/* Category & Detail Routes (Supports Tesis, Salon, Okul, Etkinlik & Slugs) */}
          <Route path="/tesis/:id" element={detailElement} />
          <Route path="/tesisler/:id" element={detailElement} />
          <Route path="/salon/:id" element={detailElement} />
          <Route path="/salonlar/:id" element={detailElement} />
          <Route path="/okul/:id" element={detailElement} />
          <Route path="/spor-okulu/:id" element={detailElement} />
          <Route path="/spor-okullari/:id" element={detailElement} />
          <Route path="/etkinlik/:id" element={detailElement} />
          <Route path="/etkinlikler/:id" element={detailElement} />
          <Route path="/detay/:id" element={detailElement} />

          <Route path="/yorum-yaz" element={
            <>
              <SEOHead title="Spor Tesisi Değerlendir & Yorum Yaz" description="Deneyimlediğiniz fitness salonları, spor okulları veya spor tesisleri için tarafsız puan ve detaylı yorum bırakın." />
              <ReviewPage
                events={events}
                onSubmitReview={handleAddReview}
                currentUser={currentUser}
                onOpenAuthModal={handleOpenAuthModal}
              />
            </>
          } />

          <Route path="/puanla" element={
            <>
              <SEOHead title="Spor Tesisi Değerlendir & Yorum Yaz" description="Deneyimlediğiniz fitness salonları, spor okulları veya spor tesisleri için tarafsız puan ve detaylı yorum bırakın." />
              <ReviewPage
                events={events}
                onSubmitReview={handleAddReview}
                currentUser={currentUser}
                onOpenAuthModal={handleOpenAuthModal}
              />
            </>
          } />
          
          <Route path="/admin" element={
            currentUser?.role === 'admin' ? (
              <>
                <SEOHead title="Yönetici Paneli" description="SporPuan tesis, onay ve içerik yönetim paneli." />
                <AdminPanel 
                  events={events}
                  onDeleteEvent={handleDeleteEvent}
                  onEditEvent={setEditingEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onAddEvent={handleAddNewEvent}
                  onUpdateEventsBatch={handleUpdateEventsBatch}
                />
              </>
            ) : (
              <Navigate to="/" replace />
            )
          } />

          <Route path="/kurumsal" element={
            <>
              <SEOHead title="Kurumsal Spor Tesisi Kaydı & Yönetimi" description="Spor tesisinizi SporPuan platformuna kaydedin, resmi doğrulama rozetini alın ve yüz binlerce sporsevere ulaşın." />
              <CorporatePage 
                currentUser={currentUser}
                onOpenAuthModal={handleOpenAuthModal}
              />
            </>
          } />

          <Route path="/kurumsal-davet-formu" element={
            <>
              <SEOHead title="Kurumsal Kayıt & Başvuru Formu" description="SporPuan kurumsal tesis yönetimi başvuru formu." />
              <CorporateInviteForm 
                currentUser={currentUser}
                onOpenAuthModal={handleOpenAuthModal}
              />
            </>
          } />

          <Route path="/kurumsal/davet-formu" element={
            <>
              <SEOHead title="Kurumsal Kayıt & Başvuru Formu" description="SporPuan kurumsal tesis yönetimi başvuru formu." />
              <CorporateInviteForm 
                currentUser={currentUser}
                onOpenAuthModal={handleOpenAuthModal}
              />
            </>
          } />

          
          <Route path="/favoriler" element={
            <FavoritesPage 
              events={events} 
              currentUser={currentUser} 
              onToggleFavorite={handleToggleFavorite} 
              onRateClick={(ev) => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                  return;
                }
                window.scrollTo(0, 0);
                navigate(`/yorum-yaz?id=${ev.id}`);
              }}
            />
          } />
          <Route path="/karsilastir" element={
            <ComparisonPage events={events} />
          } />
          <Route path="/profil" element={
            <ProfilePage events={events} currentUser={currentUser} />
          } />
          <Route path="/tesis-oner" element={
            <SuggestFacilityPage />
          } />
          <Route path="/iletisim" element={
            <ContactPage />
          } />
          <Route path="/certified" element={
            currentUser?.role === 'admin' ? (
              <CertifiedPage />
            ) : (
              <CertifiedAuthPrompt />
            )
          } />
          <Route path="/harita" element={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col min-h-[calc(100vh-100px)]">
              <SEOHead title="Haritada Spor Tesislerini ve Salonları Keşfet" description="Türkiye genelindeki fitness salonlarını, spor okullarını, yüzme havuzlarını ve stadyumları interaktif harita üzerinde keşfedin." />
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <MapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <span>Sporpuan Haritası</span>
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Türkiye genelindeki spor tesislerini, spor salonlarını, spor okullarını ve spor etkinliklerini tam sayfa harita üzerinde inceleyin
                    </p>
                  </div>
                </div>
              </div>
              <EventMapView
                events={events}
                onSelectEvent={(ev) => {
                  window.scrollTo(0, 0);
                  navigate(getEventDetailUrl(ev));
                }}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>
          } />
          
          <Route path="/" element={
            <>
              <SEOHead 
                title={
                  searchQuery 
                    ? `"${searchQuery}" İle İlgili Spor Tesisleri & Yorumları`
                    : selectedCategory !== 'Tümü' && selectedCity !== 'Tüm Şehirler'
                    ? `${selectedCity} ${selectedCategory} Puanları ve Yorumları`
                    : selectedCategory !== 'Tümü'
                    ? `${selectedCategory} Puanları ve Detaylı İncelemeleri`
                    : selectedCity !== 'Tüm Şehirler'
                    ? `${selectedCity} Spor Tesisleri ve Salonları`
                    : "SporPuan - Türkiye'nin Bağımsız Spor Tesisleri ve Etkinlikleri Puanlama Platformu"
                }
                description={
                  selectedCategory !== 'Tümü'
                    ? `Türkiye genelindeki en beğenilen ${selectedCategory.toLowerCase()} için kullanıcı puanları, hijyen, ekipman ve eğitmen değerlendirmeleri.`
                    : "Türkiye'nin en kapsamlı bağımsız spor tesisi, salon, okul ve etkinlik puanlama ve inceleme platformu."
                }
              />
              {/* Hero Section */}
              <HeroBanner
                onOpenAddReview={() => {
                  if (!currentUser) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  window.scrollTo(0, 0);
                  navigate('/yorum-yaz');
                }}
                onOpenMapView={() => {
                  window.scrollTo(0, 0);
                  navigate('/harita');
                }}
                onSelectTopCategory={(tag) => setSearchQuery(tag)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                cities={cities}
              />

              {/* Sorting */}
              <CategoryFilter
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />

              {/* Render either Map View or Grid View based on viewMode */}
              {viewMode === 'map' ? (
                <div className="py-6">
                  <EventMapView
                    events={events}
                    onSelectEvent={(ev) => navigate(getEventDetailUrl(ev))}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    selectedCity={selectedCity}
                    onSelectCity={setSelectedCity}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                  />
                </div>
              ) : (
                /* Events Grid Section */
                <section id="events-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                  
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>
                          {selectedCategory === 'Tümü' ? 'Tüm Sonuçlar' : selectedCategory}
                        </span>
                      </h2>
                    </div>
                  </div>

                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                      <SearchX className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Aradığınız kriterlere uygun sonuç bulunamadı</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Farklı bir arama kelimesi yazabilir, şehir filtresini değiştirebilir veya kendi spor kurumunuzu sporpuan'a ekleyebilirsiniz.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('Tümü');
                          setSelectedCity('Tüm Şehirler');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                      >
                        Tüm Filtreleri Temizle
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedEvents.map((event) => (
                          <EventCard
                            isFavorite={currentUser?.favorites?.includes(event.id)}
                            onToggleFavorite={(ev, e) => handleToggleFavorite(ev.id)}
                            key={event.id}
                            event={event}
                            onSelectEvent={(ev) => {
                              window.scrollTo(0, 0);
                              navigate(getEventDetailUrl(ev));
                            }}
                            onRateClick={handleRateClick}
                          />
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
                            Gösterilen: <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}</span> / Toplam <span className="font-bold text-slate-900 dark:text-white">{filteredEvents.length}</span> Kayıt
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            {/* Prev Page */}
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-bold flex items-center gap-1"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span className="hidden sm:inline">Önceki</span>
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(page => {
                                return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                              })
                              .reduce<(number | string)[]>((acc, page, index, array) => {
                                if (index > 0 && page - (array[index - 1] as number) > 1) {
                                  acc.push('...');
                                }
                                acc.push(page);
                                return acc;
                              }, [])
                              .map((item, idx) => {
                                if (item === '...') {
                                  return (
                                    <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 text-xs font-bold">
                                      ...
                                    </span>
                                  );
                                }
                                const pageNum = item as number;
                                const isActive = pageNum === currentPage;
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-9 h-9 rounded-xl font-bold text-xs transition flex items-center justify-center ${
                                      isActive
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}

                            {/* Next Page */}
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-bold flex items-center gap-1"
                            >
                              <span className="hidden sm:inline">Sonraki</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}
              
              {/* Sporpuanlılar Ne Demiş Section */}
              <SporpuanlilarNeDemis events={events} />

              <ShareExperienceCTA onOpenAddReview={() => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                  return;
                }
                window.scrollTo(0, 0);
                navigate('/yorum-yaz');
              }} />
            </>
          } />
        </Routes>
      </main>

      {/* Footer */}
      <Footer onOpenSubmitEvent={() => setIsSubmitEventOpen(true)} />
      <SupportButton />

      {/* MODALS */}
      {/* 2. Rate / Add Review Modal */}
      {isRateModalOpen && (
        <AddReviewModal
          events={events}
          selectedEvent={rateModalEvent}
          onClose={() => setIsRateModalOpen(false)}
          onSubmitReview={handleAddReview}
          currentUser={currentUser}
          onOpenAuthModal={() => handleOpenAuthModal()}
        />
      )}

      {/* 3. Submit New Event Modal */}
      {isSubmitEventOpen && (
        <SubmitEventModal
          categories={[
            'Tümü',
            'Spor Tesisleri',
            'Spor Salonları',
            'Spor Okulları',
            'Spor Etkinlikleri',
          ]}
          onClose={() => setIsSubmitEventOpen(false)}
          onAddEvent={handleAddNewEvent}
          currentUser={currentUser}
          onOpenAuthModal={() => handleOpenAuthModal()}
        />
      )}


      {/* 9. Edit Event Modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdateEvent={handleUpdateEvent}
          categories={[
            'Tümü',
            'Spor Tesisleri',
            'Spor Salonları',
            'Spor Okulları',
            'Spor Etkinlikleri',
          ]}
        />
      )}

      {/* 10. Auth Modal (Giriş & Kayıt) */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          isCorporate={authModalMode === 'corporate'}
        />
      )}

    </div>
  );
}
