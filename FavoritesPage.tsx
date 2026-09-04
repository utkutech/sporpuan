import React, { useState } from 'react';
import { SportsEvent, UserProfile } from '../types';
import { EventCard } from '../components/EventCard';
import { useNavigate } from 'react-router-dom';
import { getEventDetailUrl } from '../lib/categoryUtils';
import { SEOHead } from '../components/SEOHead';
import { HeartCrack, Scale } from 'lucide-react';

interface FavoritesPageProps {
  events: SportsEvent[];
  currentUser: UserProfile | null;
  onToggleFavorite: (eventId: string) => void;
  onRateClick: (event: SportsEvent) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  events,
  currentUser,
  onToggleFavorite,
  onRateClick
}) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (!currentUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <SEOHead title="Favorilerim" description="Favori spor tesisleriniz." />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">Giriş Yapmalısınız</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Favorilerinizi görmek için lütfen giriş yapın.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const favoriteIds = currentUser.favorites || [];
  const favoriteEvents = events.filter(ev => favoriteIds.includes(ev.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      <SEOHead title="Favorilerim" description="Favori olarak kaydettiğiniz spor tesisleri." />
      
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            Favorilerim
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Kaydettiğiniz spor salonları ve tesisleri burada bulabilirsiniz.
          </p>
        </div>
        {favoriteEvents.length >= 2 && (
          <button
            onClick={() => navigate(`/karsilastir?ids=${selectedIds.join(',')}`)}
            disabled={selectedIds.length < 2}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <Scale className="w-5 h-5" />
            {selectedIds.length < 2 ? 'Karşılaştırmak için en az 2 seç' : `Seçilen ${selectedIds.length} Tesis Karşılaştır`}
          </button>
        )}
      </div>

      {favoriteEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteEvents.map((event) => (
            <div key={event.id} className="relative">
              <div className="absolute top-3 right-14 z-20">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(event.id)}
                  onChange={() => toggleSelection(event.id)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
              <EventCard
                event={event}
                isFavorite={true}
                onToggleFavorite={(ev, e) => onToggleFavorite(ev.id)}
                onSelectEvent={(ev) => {
                  window.scrollTo(0, 0);
                  navigate(getEventDetailUrl(ev));
                }}
                onRateClick={(ev, e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRateClick(ev);
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center px-4">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <HeartCrack className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">
            Henüz favori tesisiniz yok
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
            Keşfet sayfasından beğendiğiniz spor salonlarını ve tesislerini favorilerinize ekleyerek burada listeleyebilirsiniz.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            Tesisleri Keşfet
          </button>
        </div>
      )}
    </div>
  );
};
