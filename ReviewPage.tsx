import { Avatar } from './Avatar';
import { anonymizeUserName } from '../lib/nameUtils';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { SportsEvent, RatingCriterion, Review, UserProfile, SportsCategory } from '../types';
import { TURKEY_CITIES } from '../data/turkeyLocations';
import { calculateOverallScore, CATEGORY_CRITERIA_MAP, getScoreBadgeColor, getScoreLabel } from '../lib/scoreUtils';
import { getEventDetailUrl } from '../lib/categoryUtils';
import { HoverRatingBar } from './HoverRatingBar';
import { 
  Star, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Trophy, 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  User, 
  LogIn, 
  Building2, 
  Sparkles, 
  Filter, 
  Check, 
  ChevronRight, 
  ThumbsUp, 
  Camera,
  X,
  MessageSquare,
  Award,
  ChevronDown,
  Clock,
  UploadCloud,
  FileText,
  Trash2,
  Paperclip,
  BadgeCheck
} from 'lucide-react';
import { motion } from 'motion/react';

const PREDEFINED_PROS = [
  "Harika Atmosfer", "Hızlı Giriş", "Temiz Tesis", "Uygun Fiyat", "Kolay Ulaşım", "İlgili Personel", "Güvenli Ortam", "Aileye Uygun", "Geniş Otopark", "Modern Ekipman"
];

const PREDEFINED_CONS = [
  "Yetersiz Otopark", "Uzun Kuyruklar", "Pahalı", "Çok Kalabalık", "Ulaşım Zorluğu", "İlgisiz Personel", "Yetersiz Temizlik", "Kötü Ses Sistemi", "Eski Ekipmanlar"
];

const OPPOSING_PAIRS: Record<string, string> = {
  "Temiz Tesis": "Yetersiz Temizlik",
  "Yetersiz Temizlik": "Temiz Tesis",
  "Uygun Fiyat": "Pahalı",
  "Pahalı": "Uygun Fiyat",
  "Kolay Ulaşım": "Ulaşım Zorluğu",
  "Ulaşım Zorluğu": "Kolay Ulaşım",
  "İlgili Personel": "İlgisiz Personel",
  "İlgisiz Personel": "İlgili Personel",
  "Hızlı Giriş": "Uzun Kuyruklar",
  "Uzun Kuyruklar": "Hızlı Giriş",
};

interface ReviewPageProps {
  events: SportsEvent[];
  onSubmitReview: (eventId: string, newReview: Review) => void;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  events,
  onSubmitReview,
  currentUser,
  onOpenAuthModal
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('id') || searchParams.get('event');

  // Step state: 1 = Facility Selection, 2 = Rate & Review, 3 = Success
  

  // Selected Target Event
    // Selected Target Event
  const [targetEventId, setTargetEventId] = useState<string>(
    initialEventId || ''
  );

  const targetEvent = useMemo(() => {
    return events.find((e) => e.id === targetEventId) || null;
  }, [events, targetEventId]);

  // Search & Filter for Step 1
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [selectedCity, setSelectedCity] = useState<string>('Tüm Şehirler');

  // Filtered Events for Step 1
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (e.isActive === false) return false;
      const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.venue.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.organizer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'Tümü' || e.category === selectedCategory;
      const matchCity = selectedCity === 'Tüm Şehirler' || e.venue.city === selectedCity;

      return matchSearch && matchCat && matchCity;
    });
  }, [events, searchQuery, selectedCategory, selectedCity]);

  // Review Form States
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [visitType, setVisitType] = useState('Bireysel / Tek Başıma');
  const [scores, setScores] = useState<RatingCriterion>({});
  const [comment, setComment] = useState('');
  const [selectedPros, setSelectedPros] = useState<string[]>([]);
  const [selectedCons, setSelectedCons] = useState<string[]>([]);
  const [verified, setVerified] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<{
    id: string;
    name: string;
    size: string;
    type: 'image' | 'document';
    url: string;
  }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<Review | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUploaded = (Array.from(files) as File[]).map((file: File) => {
      const isImage = file.type.startsWith('image/');
      return {
        id: 'file-' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: (isImage ? 'image' : 'document') as 'image' | 'document',
        url: URL.createObjectURL(file),
      };
    });

    setUploadedFiles(prev => [...prev, ...newUploaded]);
    setVerified(true);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Initialize scores based on target event category
  useEffect(() => {
    if (targetEvent) {
      const criteria = CATEGORY_CRITERIA_MAP[targetEvent.category] || CATEGORY_CRITERIA_MAP['Spor Etkinlikleri'];
      const initialScores: RatingCriterion = {};
      criteria.forEach(c => initialScores[c.key] = 8); // Default score 8
      setScores(initialScores);
    }
  }, [targetEvent]);

  // Keep userName synced with auth user
  useEffect(() => {
    if (currentUser?.name) {
      setUserName(currentUser.name);
    }
  }, [currentUser]);

  const criteriaList = useMemo(() => {
    if (!targetEvent) return [];
    return CATEGORY_CRITERIA_MAP[targetEvent.category] || CATEGORY_CRITERIA_MAP['Spor Etkinlikleri'];
  }, [targetEvent]);

  const currentOverall = useMemo(() => {
    return calculateOverallScore(scores, targetEvent?.category || 'Spor Etkinlikleri');
  }, [scores, targetEvent]);

  const togglePro = (pro: string) => {
    setSelectedPros(prev => {
      const isSelecting = !prev.includes(pro);
      if (isSelecting) {
        const opposingCon = OPPOSING_PAIRS[pro];
        if (opposingCon) {
          setSelectedCons(cPrev => cPrev.filter(c => c !== opposingCon));
        }
        return [...prev, pro];
      }
      return prev.filter(p => p !== pro);
    });
  };

  const toggleCon = (con: string) => {
    setSelectedCons(prev => {
      const isSelecting = !prev.includes(con);
      if (isSelecting) {
        const opposingPro = OPPOSING_PAIRS[con];
        if (opposingPro) {
          setSelectedPros(pPrev => pPrev.filter(p => p !== opposingPro));
        }
        return [...prev, con];
      }
      return prev.filter(c => c !== con);
    });
  };

  const handleSelectFacility = (evId: string) => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    setTargetEventId(evId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Yorum yapabilmek için lütfen üye girişi yapınız.');
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (!userName.trim()) {
      alert('Lütfen adınızı veya takma adınızı giriniz.');
      return;
    }

    if (comment.trim().length < 15) {
      alert('Sporseverlere faydalı olmak için lütfen en az 15 karakterlik bir yorum yazınız.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newReview: Review = {
        id: 'rev-' + Date.now(),
        userName: userName.trim(),
        userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        verifiedAttendee: verified || uploadedFiles.length > 0,
        date: new Date().toISOString().split('T')[0],
        overallScore: currentOverall,
        scores: scores,
        comment: comment.trim(),
        pros: selectedPros,
        cons: selectedCons,
        likes: 0,
        userPhotos: uploadedFiles.filter(f => f.type === 'image').map(f => f.url),
        verificationDocs: uploadedFiles.map(f => ({ name: f.name, url: f.url, type: f.type })),
        tags: [visitType]
      };

      onSubmitReview(targetEvent.id, newReview);
      setSubmittedReview(newReview);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        


        {/* ================= VENUE SEARCH & SELECTION ================= */}
        {!submittedReview && !targetEvent && (
          <div className="space-y-10 animate-fade-in">
            
            {/* VİSUALIZED SEARCH BAR CONTAINER */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-blue-500/20">
              {/* Decorative Glow Elements */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Sporpuan Tesis & Salon Değerlendirme</span>
                  </span>
                  <span className="text-xs text-blue-200/80 font-medium">
                    Tarafsız & Şeffaf Spor Rejimi
                  </span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                    Spor Salonu veya Tesisinizi Aramak İçin Yazın
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
                    Aradığınız spor tesisini, salonu veya okulu aşağıdaki arama çubuğundan bularak saniyeler içinde tarafsız puan verebilir ve yorumunuzu yayınlayabilirsiniz.
                  </p>
                </div>

                {/* VISUALIZED SEARCH BAR */}
                <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl">
                  <div className="flex flex-col md:flex-row items-stretch gap-2">
                    
                    {/* Search Input Box */}
                    <div className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-inner">
                      <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Örn: MacFit, Kadıköy Yüzme Havuzu, Spor Akademisi..."
                        className="w-full bg-transparent border-none text-sm sm:text-base font-bold placeholder-slate-400 focus:outline-none"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* City Selector */}
                    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl px-4 py-3.5 flex items-center gap-2 shadow-inner border border-slate-200 dark:border-slate-800 shrink-0">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="bg-transparent border-none text-xs sm:text-sm font-extrabold focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="Tüm Şehirler">Tüm Şehirler</option>
                        {TURKEY_CITIES.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Search Action Button */}
                    <button
                      type="button"
                      className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95"
                    >
                      <Search className="w-4 h-4" />
                      <span>Tesis Ara</span>
                    </button>

                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
                  <span className="text-xs text-blue-200 font-bold shrink-0 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-blue-400" />
                    <span>Kategori:</span>
                  </span>
                  {['Tümü', 'Spor Salonları', 'Spor Tesisleri', 'Spor Okulları', 'Spor Etkinlikleri'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                        selectedCategory === cat
                          ? 'bg-white text-blue-900 border-white shadow-md'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

              </div>
            </div>

            {/* SEARCH RESULTS LIST (When user types or selects category) */}
            {searchQuery && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span>Arama Sonuçları ({filteredEvents.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Değerlendirmek istediğiniz tesise tıklayın
                  </span>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-4">
                    <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">Aradığınız Tesis Bulunamadı</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Arama kriterlerinizi değiştirebilir veya kurumunuzu Sporpuan sistemine ekleyebilirsiniz.
                      </p>
                    </div>
                    <Link
                      to="/kurumsal"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition"
                    >
                      <span>Yeni Kurumsal Tesis Ekleyin</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => handleSelectFacility(ev.id)}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-blue-500 hover:shadow-md transition cursor-pointer group flex items-start gap-4"
                      >
                        <img referrerPolicy="no-referrer"
                          src={ev.imageUrl || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=200&auto=format&fit=crop'}
                          alt={ev.title}
                          className="w-24 h-24 rounded-xl object-cover shrink-0 group-hover:scale-105 transition duration-300 border border-slate-100 dark:border-slate-800"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1200&auto=format&fit=crop';
                          }}
                        />

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              {ev.category}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{ev.overallScore.toFixed(1)}</span>
                            </div>
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            {ev.title}
                          </h4>

                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{ev.venue.name}, {ev.venue.city}</span>
                          </p>

                          <div className="pt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              {ev.reviews.length} Kullanıcı Yorumu
                            </span>
                            <span className="px-3 py-1 bg-blue-600 group-hover:bg-blue-700 text-white rounded-lg text-xs font-black transition flex items-center gap-1">
                              <span>Puanla</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* POPULAR QUICK SELECT FACILITIES (Compact Bar when search is empty) */}
            {!searchQuery && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Öne Çıkan Puanlanabilir Tesisler</span>
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Tesis seçip hemen puan verebilirsiniz
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredEvents.slice(0, 6).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => handleSelectFacility(ev.id)}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs hover:border-blue-500 hover:shadow-md transition cursor-pointer group flex items-center gap-3"
                    >
                      <img referrerPolicy="no-referrer"
                        src={ev.imageUrl || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=200&auto=format&fit=crop'}
                        alt={ev.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-800"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1200&auto=format&fit=crop';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition">
                          {ev.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {ev.venue.city} • {ev.category}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] font-black text-amber-500 mt-1">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span>{ev.overallScore.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">({ev.reviews.length})</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VISUAL INFOGRAPHIC WORK: WHY EVALUATE & RATE ON SPOR PUAN? */}
            <div className="pt-8 space-y-12">
              
              {/* Section Header */}
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Şeffaf & Tarafsız Spor Topluluğu</span>
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Neden Sporpuan'da Değerlendirme & Puanlama Yapmalısınız?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sporpuan, spor tesislerinin hizmet kalitesini artıran ve sporseverlerin en doğru kulübü seçmesini sağlayan bağımsız, güvenilir bir derecelendirme ekosistemidir.
                </p>
              </div>

              {/* 4 Feature Visual Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Feature Card 1 */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-blue-950/40 rounded-3xl p-6 sm:p-8 border border-blue-200/80 dark:border-blue-900/40 shadow-md hover:shadow-xl transition space-y-4 relative overflow-hidden group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      1. Sporsever Topluluğuna Rehberlik Edin
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Kendi deneyimleriniz sayesinde yeni başlayan sporseverler doğru tesisi, kaliteli ekipmanı ve işini iyi yapan antrenörleri kolayca bulur.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Binlerce sporcuya ışık tutan tarafsız yorumlar</span>
                  </div>
                </div>

                {/* Feature Card 2 */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-slate-900 dark:to-emerald-950/40 rounded-3xl p-6 sm:p-8 border border-emerald-200/80 dark:border-emerald-900/40 shadow-md hover:shadow-xl transition space-y-4 relative overflow-hidden group">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      2. Tesis Hijyen & Hizmet Kalitesini Yükseltin
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Spor tesisleri ve salonları Sporpuan üzerindeki geri bildirimleri yakından takip eder. Yorumlarınız soyunma odalarından havalandırmaya kadar hizmet standardını doğrudan yükseltir.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Hizmet kalitesinde sürekli gelişim motivasyonu</span>
                  </div>
                </div>

                {/* Feature Card 3 */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-900 dark:to-amber-950/40 rounded-3xl p-6 sm:p-8 border border-amber-200/80 dark:border-amber-900/40 shadow-md hover:shadow-xl transition space-y-4 relative overflow-hidden group">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300">
                    <Star className="w-7 h-7 fill-slate-950" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      3. 5 Boyutlu Objektif Puan Standartı
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Sadece yüzeysel 5 yıldız vermek yerine; Hijyen, Ekipman Kalitesi, Eğitmen İlgisi, Ulaşım Kolaylığı ve Fiyat/Performans kriterlerinde ayrı ayrı adil puanlama yapabilirsiniz.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    <span>Ağırlıklı matematiksel algoritma ile gerçekçi skorlar</span>
                  </div>
                </div>

                {/* Feature Card 4 */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-slate-900 dark:to-purple-950/40 rounded-3xl p-6 sm:p-8 border border-purple-200/80 dark:border-purple-900/40 shadow-md hover:shadow-xl transition space-y-4 relative overflow-hidden group">
                  <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300">
                    <Award className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      4. Doğrulanmış Sporcu Rozeti Kazanın
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Gerçekleştirdiğiniz tarafsız değerlendirmeler sonucunda profilinizde "Doğrulanmış Ziyaretçi" rozeti kazanırsınız. Sahte yorumların önüne geçilerek spor kulüpleri şeffaflaşır.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                    <span>Manüpilasyonsuz %100 doğruluk güvencesi</span>
                  </div>
                </div>

              </div>

              {/* STEP BY STEP PROCESS INFOGRAPHIC */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                    Kolay 3 Adımda Süreç
                  </span>
                  <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    Puanlama & Değerlendirme Nasıl Çalışır?
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  
                  {/* Step 1 */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center space-y-3 relative">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mx-auto shadow-md">
                      1
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Tesisinizi Seçin
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Arama çubuğunu kullanarak veya öne çıkan listeden ziyaret ettiğiniz salonu ya da tesisi kolayca bulun.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center space-y-3 relative">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center mx-auto shadow-md">
                      2
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                      5 Kriterde Not Verin
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Hijyen, ekipman, personel, ulaşım ve fiyat standartlarına 1 ile 10 arasında puan kaydırıp yorumunuzu ekleyin.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center space-y-3 relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mx-auto shadow-md">
                      3
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Anında Yayına Alın
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Gönderdiğiniz yorum anında tesisin genel puanına etki eder ve diğer sporseverlerin kullanımına sunulur.
                    </p>
                  </div>

                </div>
              </div>

              {/* STATS BANNER */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl flex flex-col md:flex-row items-center justify-around gap-6 text-center border border-blue-500/30">
                <div className="space-y-1">
                  <span className="text-3xl sm:text-4xl font-black text-amber-400">12.500+</span>
                  <p className="text-xs text-blue-200 font-bold">Doğrulanmış Kullanıcı Yorumu</p>
                </div>
                <div className="hidden md:block w-px h-12 bg-white/20" />
                <div className="space-y-1">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400">450+</span>
                  <p className="text-xs text-blue-200 font-bold">Kayıtlı Spor Salonu & Tesis</p>
                </div>
                <div className="hidden md:block w-px h-12 bg-white/20" />
                <div className="space-y-1">
                  <span className="text-3xl sm:text-4xl font-black text-blue-400">%98.5</span>
                  <p className="text-xs text-blue-200 font-bold">Topluluk Güvenilirlik Endeksi</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= RATING & REVIEW FORM ================= */}
        {!submittedReview && targetEvent && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Selected Facility Card Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img referrerPolicy="no-referrer"
                  src={targetEvent.image || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=200&auto=format&fit=crop'}
                  alt={targetEvent.title}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1200&auto=format&fit=crop';
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {targetEvent.category}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {targetEvent.venue.city}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {targetEvent.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {targetEvent.venue.name} • Toplam {targetEvent.reviews.length} Yorum
                  </p>
                </div>
              </div>

              {!initialEventId && (
                <button
                  type="button"
                  onClick={() => setTargetEventId('')}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition shrink-0"
                >
                  Farklı Tesis Seç
                </button>
              )}
            </div>

            {/* Unauthenticated User Warning Banner */}
            {!currentUser && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/70 dark:to-orange-950/70 border-2 border-amber-300 dark:border-amber-700 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <LogIn className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Yorum Yapabilmek İçin Üye Girişi Yapmalısınız
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Sporpuan topluluğunda kaliteli ve güvenilir değerlendirmeler için yorumlar yalnızca doğrulanmış üyeler tarafından gönderilebilmektedir.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Giriş Yap / Üye Ol</span>
                </button>
              </div>
            )}

            {/* FORM CONTAINER */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xl space-y-8">
              
              {/* Overall Score Live Calculation Preview Header with Visual Rings */}
              <div className="bg-[#f0f4f8] dark:bg-slate-850 rounded-[28px] p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-4">
                
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  
                  {/* Speech Bubble Badge */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-md">
                        {currentOverall.toFixed(1)}
                      </div>
                      <div className="absolute -bottom-1.5 left-4 w-4 h-4 bg-blue-600 rotate-45 rounded-xs" />
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                        {getScoreLabel(currentOverall)}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        Değerlendirmeniz Hazırlanıyor
                      </p>
                      
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. CRITERIA SCORE SLIDERS */}
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-200 dark:border-slate-700/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>5 Boyutlu Değerlendirme Puanlarınız</span>
                  </h3>
                  
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-2">
                  {criteriaList.map((criterion) => {
                    const val = scores[criterion.key] || 8;
                    return (
                      <div key={criterion.key} className="space-y-1.5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
                            {criterion.label}
                          </span>
                          <span className="font-black text-blue-600 dark:text-blue-400 text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                            {val} / 10
                          </span>
                        </div>

                        <HoverRatingBar 
                          value={val} 
                          onChange={(newVal) => setScores({ ...scores, [criterion.key]: newVal })} 
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">{criterion.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. PROS & CONS */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  Öne Çıkan Özellikler (Artılar & Eksiler)
                </h3>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    + Beğendiğiniz Yönler (Artılar):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_PROS.map((pro) => {
                      const selected = selectedPros.includes(pro);
                      return (
                        <button
                          key={pro}
                          type="button"
                          onClick={() => togglePro(pro)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                            selected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                          }`}
                        >
                          {selected ? <Check className="w-3.5 h-3.5" /> : null}
                          <span>{pro}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-rose-700 dark:text-rose-400">
                    - Geliştirilmesi Gereken Yönler (Eksiler):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_CONS.map((con) => {
                      const selected = selectedCons.includes(con);
                      return (
                        <button
                          key={con}
                          type="button"
                          onClick={() => toggleCon(con)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                            selected
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                          }`}
                        >
                          {selected ? <Check className="w-3.5 h-3.5" /> : null}
                          <span>{con}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. COMMENT & VISIT TYPE */}
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                  Detaylı Yorumunuz & Deneyim Detayları
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Adınız veya Takma Adınız <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Örn: Ahmet Y."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ziyaret Türünüz
                    </label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Bireysel / Tek Başıma">Bireysel / Tek Başıma</option>
                      <option value="Ailece">Ailece</option>
                      <option value="Arkadaş Grubuyla">Arkadaş Grubuyla</option>
                      <option value="Özel Kurs / Antrenman">Özel Kurs / Antrenman</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Yorumunuz <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">En az 15 karakter ({comment.length}/500)</span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tesisin temizliği, soyunma odaları, antrenör ilgisi, otopark durumu ve genel atmosferi hakkındaki detaylı değerlendirmelerinizi yazınız..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* 4. DOĞRULAMA İÇİN BELGE VEYA GÖRSEL YÜKLEME ALANI */}
                <div className="space-y-3 bg-slate-50/80 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          Doğrulama İçin Belge veya Görsel Yükle (İsteğe Bağlı)
                        </h4>
                        <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          Rozet Kazan
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Ziyaretinizi doğrulamak için fatura, üyelik kartı, bilet, dekont veya tesis fotoğrafı yükleyin.
                      </p>
                    </div>
                  </div>

                  {/* File Upload Dropzone */}
                  <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl bg-white dark:bg-slate-850 cursor-pointer transition group">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Belge veya Görsel Yüklemek İçin Tıklayın
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Fotoğraf (JPG, PNG) veya Döküman (PDF, DOCX) • Maksimum 10 MB
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Uploaded Files Preview Grid */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Eklenen Doğrulama Dosyaları ({uploadedFiles.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              {file.type === 'image' ? (
                                <img referrerPolicy="no-referrer" src={file.url || undefined} alt={file.name} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                              )}
                              <div className="truncate">
                                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{file.name}</p>
                                <span className="text-[10px] text-slate-400">{file.size} • {file.type === 'image' ? 'Fotoğraf' : 'Döküman'}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(file.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition shrink-0"
                              title="Dosyayı Kaldır"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>
                    Bu tesisi gerçekten ziyaret ettiğimi ve tarafsız değerlendirme kurallarına uyduğumu beyan ederim.
                  </span>
                </label>

                {!currentUser ? (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-95 shrink-0 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Yorum Yapmak İçin Giriş Yapın</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || comment.length < 15}
                    className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-95 shrink-0"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 fill-white text-white" />
                        <span>Değerlendirmeyi Yayınla</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>

          </div>
        )}

        {/* ================= SUCCESS CONFIRMATION ================= */}
        {submittedReview && targetEvent && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/40 p-8 sm:p-12 shadow-2xl text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                Tebrikler! Yorumunuz Yayında
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Değerlendirmeniz Başarıyla Kaydedildi!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                <strong className="text-slate-900 dark:text-white">{targetEvent.title}</strong> hakkındaki tarafsız yorumunuz yayınlandı. Sporsever topluluğuna katkınız için teşekkür ederiz.
              </p>
            </div>

            {/* Published Review Summary Box */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg mx-auto text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{anonymizeUserName(submittedReview.userName)}</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black px-2.5 py-0.5 rounded">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{submittedReview.overallScore.toFixed(1)} Puan</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                "{submittedReview.comment}"
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Ziyaret Türü: {visitType}</span>
                <span>Tarih: {submittedReview.date}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => navigate(getEventDetailUrl(targetEvent))}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md"
              >
                Tesis Sayfasına Git
              </button>
              <button
                onClick={() => {
                  setTargetEventId('');
                  setSubmittedReview(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md"
              >
                Başka Bir Tesis Puanla
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
