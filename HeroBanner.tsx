import React, { useState, useEffect } from 'react';
import { Trophy, ShieldCheck, Star, Sparkles, MapPin, Activity, CheckCircle2, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroBannerProps {
  onOpenAddReview: () => void;
  onOpenMapView: () => void;
  onSelectTopCategory: (cat: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  selectedCity?: string;
  setSelectedCity?: (c: string) => void;
  cities?: string[];
}

const SLIDING_WORDS = [
  "Spor Tesislerini",
  "Spor Okullarını",
  "Spor Etkinliklerini"
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenAddReview,
  onOpenMapView,
  onSelectTopCategory,
  searchQuery = '',
  setSearchQuery,
  selectedCity = 'Tüm Şehirler',
  setSelectedCity,
  cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Trabzon', 'Eskişehir', 'Kocaeli'],
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDING_WORDS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Smooth scroll down to categories/events grid section
    const targetElement = document.getElementById('events-section');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-gradient-to-b from-blue-50/70 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 pt-8 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-200">
      <div className="absolute inset-0 z-0 opacity-[0.05]" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-8">
          
          {/* Left Text Content */}
          <div className="w-full lg:w-3/5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Türkiye'nin Spor Değerlendirme Platformu</span>
            </div>

            <h1 className="font-['Red_Hat_Display',_sans-serif] font-bold text-[#23262f] dark:text-white text-[26px] xs:text-[30px] sm:text-[44px] lg:text-[54px] leading-[1.25] sm:leading-[1.2]">
              <span className="block h-[1.3em] relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={SLIDING_WORDS[index]}
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 40, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                    className="absolute left-0 top-0 text-blue-600 dark:text-blue-400 font-extrabold whitespace-nowrap"
                  >
                    {SLIDING_WORDS[index]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="block text-[#23262f] dark:text-slate-100 font-extrabold mt-0.5 sm:mt-1">
                Puanla, Yorumla, Keşfet!
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              <strong className="text-blue-700 dark:text-blue-400">Sporpuan</strong> ile spor tesislerini, spor okullarını ve etkinlikleri gerçek kullanıcı deneyimleriyle şeffafça inceleyin, puanlayın ve size en uygununu keşfedin.
            </p>

            {/* Main Homepage Entrance Search Bar Box */}
            <form 
              onSubmit={handleSearchSubmit}
              className="bg-white dark:bg-slate-800/90 p-2 sm:p-2.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col md:flex-row items-stretch gap-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/30"
            >
              {/* Search text input */}
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                  placeholder="Tesis, salon, spor okulu veya etkinlik ara..."
                  className="w-full bg-transparent border-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-medium"
                />
                {searchQuery && setSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-black text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Ara & Keşfet</span>
              </button>
            </form>

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={onOpenAddReview}
                className="w-full sm:w-auto px-5 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 font-bold text-xs sm:text-sm rounded-xl transition shadow-2xs flex items-center justify-center gap-2 active:scale-95 min-h-[40px]"
              >
                <Star className="w-4 h-4 fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400" />
                <span>Puanla & Yorum Yaz</span>
              </button>
              
              <button
                onClick={onOpenMapView}
                className="w-full sm:w-auto px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-2xs active:scale-95 min-h-[40px]"
              >
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Haritada Gör</span>
              </button>
            </div>
          </div>

          {/* Right Visual Decoration */}
          <div className="w-full lg:w-2/5 hidden lg:flex justify-center relative">
            <div className="absolute inset-0 bg-blue-200/50 dark:bg-blue-900/30 rounded-full blur-[80px] -z-10"></div>
            
            <div className="relative w-full max-w-sm aspect-square">
              
              {/* Main Card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-750 p-5 transform rotate-[-2deg] z-20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100">Merkez Spor Kompleksi</div>
                      <div className="flex items-center gap-1 mt-0.5">
                         <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                         <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                         <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                         <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                         <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                         <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">5.0</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full">
                      <div className="h-full w-[90%] bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full">
                      <div className="h-full w-[95%] bg-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full">
                      <div className="h-full w-[85%] bg-amber-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Güvenilir Tesis Puanlaması</span>
                </div>
              </div>

              {/* Floating Element 1 */}
              <div className="absolute top-4 right-8 bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 transform rotate-[8deg] z-30 animate-pulse">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/80 flex items-center justify-center">
                     <MapPin className="w-4 h-4 text-rose-500" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-400">Konum</span>
                     <span className="text-xs font-black text-slate-800 dark:text-slate-100">Kadıköy, İst</span>
                   </div>
                 </div>
              </div>

              {/* Floating Element 2 */}
              <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 transform rotate-[-6deg] z-30">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center">
                     <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-400">Tesis Puanı</span>
                     <span className="text-xs font-black text-slate-800 dark:text-slate-100">Harika (9.2)</span>
                   </div>
                 </div>
              </div>
              
              {/* Sparkles */}
              <Sparkles className="absolute -top-4 left-1/4 w-8 h-8 text-blue-400/60 z-10" />
              <Sparkles className="absolute bottom-1/4 right-0 w-6 h-6 text-amber-400/60 z-10" />
              
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
