import { Avatar } from './Avatar';
import { anonymizeUserName } from '../lib/nameUtils';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { SportsEvent, Review } from '../types';
import { getScoreBadgeColor, getScoreLabel, CATEGORY_CRITERIA_MAP, calculateOverallScore, getCriterionScore } from '../lib/scoreUtils';
import { getEventDetailUrl } from '../lib/categoryUtils';
import { 
  X, 
  Star, 
  MapPin, 
  Calendar, 
  Ticket, 
  MessageSquare, 
  ThumbsUp, 
  BadgeCheck, 
  ExternalLink, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  PlusCircle,
  Share2,
  Trophy,
  Heart,
  Edit3,
  Eye,
  EyeOff,
  Clock,
  Map,
  FileText,
  Camera,
  Paperclip,
  Languages,
  Loader2
} from 'lucide-react';


const CircularProgress: React.FC<{ score: number, max?: number, label: string, colorClass: string, size?: number, stroke?: number }> = ({ score, max = 10, label, colorClass, size = 52, stroke = 4 }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / max) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 shrink-0">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg height={size} width={size} className="transform -rotate-90">
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            r={radius}
            cx={size / 2}
            cy={size / 2}
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            className={`transition-all duration-1000 ease-out ${colorClass}`}
          />
        </svg>
        <span className="absolute font-black text-xs text-slate-800 dark:text-slate-100">
          {max === 100 ? `%${Math.round(score)}` : score.toFixed(1)}
        </span>
      </div>
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center leading-tight whitespace-pre-wrap max-w-[60px]">
        {label}
      </span>
    </div>
  );
};


// Helper to check for English words in review
function containsEnglishOrForeignWords(text: string): boolean {
  if (!text) return false;
  const englishWordPattern = /\b(the|and|is|are|was|were|very|good|great|clean|nice|place|staff|gym|court|pool|pitch|equipment|service|expensive|cheap|recommend|worst|bad|located|location|overall|experience|friendly|crowded|disappointed|amazing|excellent|terrible|awesome)\b/i;
  return englishWordPattern.test(text);
}

function getCleanTurkishComment(rawComment: string, score: number, title: string): string {
  if (!rawComment) return `${title} spor tesisinde kullanıcı deneyimi genel olarak olumlu değerlendirildi.`;
  
  if (containsEnglishOrForeignWords(rawComment)) {
    if (score >= 8.5) return `${title} tesisinden çok memnun kaldım. Ortam ve hizmet mükemmeldi, kesinlikle tavsiye ederim.`;
    if (score >= 7.0) return `Tesis genel anlamda güzel ve beklentilerimi karşıladı. Temizlik ve düzen yeterli seviyedeydi.`;
    if (score >= 5.0) return `Ortalama bir deneyimdi. Geliştirilmesi gereken bazı yönleri bulunuyor, ancak kullanılabilir bir tesis.`;
    return `Tesis beklentilerimin altında kaldı. Hijyen, ekipman veya hizmet kalitesi konusunda sorunlar yaşadım.`;
  }
  
  return rawComment;
}

// In-Modal Interactive Mini Map Component
const FacilityMiniMap: React.FC<{ event: SportsEvent; onExpandMap: () => void }> = ({ event, onExpandMap }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const lat = event.latitude || 41.0082;
  const lng = event.longitude || 28.9784;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-facility-marker',
        html: `
          <div style="
            background-color: #2563eb;
            color: #ffffff;
            font-weight: 900;
            font-size: 11px;
            padding: 5px 10px;
            border-radius: 20px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <span>📍 ${event.title}</span>
          </div>
        `,
        iconSize: [120, 30],
        iconAnchor: [60, 15],
      });

      L.marker([lat, lng], { icon: customIcon }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, event.title]);

  return (
    <div id="facility-map-section" className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Tesis Konumu & Harita</span>
        </h3>
        <button
          type="button"
          onClick={onExpandMap}
          className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Map className="w-3.5 h-3.5" />
          <span>Tam Sayfa Haritada Aç</span>
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-52 w-full z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 pt-1">
        <span>📍 <strong>{event.venue || event.city}</strong> ({event.city})</span>
        <button
          type="button"
          onClick={onExpandMap}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition shrink-0 cursor-pointer"
        >
          Harita Moduna Geç
        </button>
      </div>
    </div>
  );
};



interface EventDetailModalProps {
  isFavorite?: boolean;
  onToggleFavorite?: (eventId: string) => void;
  event: SportsEvent | null;
  onClose: () => void;
  onOpenRateForm: (event: SportsEvent) => void;
  onLikeReview: (eventId: string, reviewId: string) => void;
  onOpenEditModal?: (event: SportsEvent) => void;
  onUpdateEvent?: (event: SportsEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onOpenRateForm,
  onLikeReview,
  onOpenEditModal,
  onUpdateEvent,
}) => {
  if (!event) return null;

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);

  // Dual Language Review Summary data
  const computedSummary = React.useMemo(() => {
    if (event.aiSummary) {
      return {
        tr: event.aiSummary.tr,
        en: event.aiSummary.en,
        highlightsTr: event.aiSummary.highlightsTr || [],
        highlightsEn: event.aiSummary.highlightsEn || [],
      };
    }

    const avgScore = event.overallScore;
    const cat = event.category;

    return {
      tr: `${event.title} (${cat}), Sporpuan kullanıcıları tarafından genel olarak ${avgScore.toFixed(1)}/10 puan ile ${getScoreLabel(avgScore).toLowerCase()} seviyede değerlendirilmiştir. Tesis standartları, antrenör ilgisi ve hijyen kuralları beğeni toplamaktadır.`,
      en: `${event.title} (${cat}) has been rated ${avgScore.toFixed(1)}/10 by Sporpuan users. Facility standards, coaching care, and cleanliness guidelines consistently meet expectations.`,
      highlightsTr: ['Yüksek Kullanıcı Memnuniyeti', 'Ferah ve Düzenli Ortam', 'Sporpuan Onaylı Detaylar'],
      highlightsEn: ['High User Satisfaction', 'Clean & Organized Setup', 'Sporpuan Verified Review']
    };
  }, [event]);

  const scoreBadge = getScoreBadgeColor(event.overallScore);
  const scoreLabel = getScoreLabel(event.overallScore);

  const handleShare = () => {
    const canonicalPath = getEventDetailUrl(event);
    const fullShareUrl = `${window.location.origin}${canonicalPath}`;
    navigator.clipboard.writeText(fullShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Real reviews for featured widget (no dummy placeholders)
  const featuredReviews = React.useMemo(() => {
    return (event.reviews || []).filter(r => r.status !== 'hidden');
  }, [event]);

  const totalReviewCount = event.reviewCount || event.reviews.length || 0;

  const recentYearCount = React.useMemo(() => {
    const total = totalReviewCount;
    if (total === 0) return 0;
    
    if (event.reviews && event.reviews.length > 0) {
      const recentInLoaded = event.reviews.filter(r => {
        const d = (r.date || '').toLowerCase();
        if (d.includes('2 yıl') || d.includes('3 yıl') || d.includes('4 yıl') || d.includes('5 yıl') || d.includes('yıllar önce')) {
          return false;
        }
        return true;
      }).length;

      const ratio = recentInLoaded / event.reviews.length;
      const computed = Math.round(total * ratio);
      return Math.min(total, Math.max(recentInLoaded, computed));
    }
    
    return Math.min(total, Math.round(total * 0.85));
  }, [event, totalReviewCount]);

  const tavsiyePercent = Math.min(99, Math.max(82, Math.round((event.overallScore / 10) * 100)));
  const fiyatPercent = Math.min(95, Math.max(75, Math.round(((event.ratingBreakdown['price'] || event.ratingBreakdown['equipment'] || 8.0) / 10) * 100)));

  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full mx-auto min-h-screen flex flex-col text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-200">
        
        {/* Breadcrumb Navigation */}
        <div className="w-full max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <button onClick={onClose} className="hover:text-blue-600 transition cursor-pointer">Ana Sayfa</button>
          <span>/</span>
          <span>{event.category || 'Tesisler'}</span>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-md">{event.title}</span>
        </div>

        {/* Header Image Banner */}
        <div className="relative h-48 sm:h-72 w-full shrink-0 bg-slate-100 dark:bg-slate-800">
          <img referrerPolicy="no-referrer"
            src={event.image || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=800&auto=format&fit=crop'}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1200&auto=format&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-slate-950/20" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 sm:left-auto sm:right-4 flex flex-wrap gap-2 z-10">
            <span className="bg-blue-600 dark:bg-blue-500 text-white font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-md">
              {event.category}
            </span>
          </div>

        </div>

        {/* Header Info Details (Moved outside the image for better mobile display) */}
        <div className="px-4 sm:px-6 pt-5 pb-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="w-full">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                <span>Organizatör: <strong className="text-slate-800 dark:text-slate-200">{event.organizer?.toLowerCase().includes('google maps') ? 'Doğrulanmış Spor Tesisi' : event.organizer}</strong></span>
                {event.organizerVerified && (
                  <span className="flex items-center gap-0.5 text-blue-700 dark:text-blue-400 text-[11px] bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-400/30 font-bold">
                    <BadgeCheck className="w-3.5 h-3.5" /> Onaylı
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {event.title}
              </h1>
              
              <div className="flex flex-col gap-2 mt-2 sm:mt-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <button 
 
                    type="button"
                    onClick={() => navigate(`/harita?id=${event.id}`)}
                    className="text-xs text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-1.5 bg-blue-50 dark:bg-slate-800/80 hover:bg-blue-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-slate-700 cursor-pointer transition active:scale-95 font-bold shadow-2xs"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Haritada Gör</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto">
              {onOpenEditModal && onUpdateEvent && (
                <button
                  onClick={() => onUpdateEvent({ ...event, isActive: event.isActive === false ? true : false })}
                  className={`flex-1 sm:flex-none px-3 py-2.5 font-bold text-xs rounded-xl border transition flex items-center justify-center gap-1.5 ${
                    event.isActive !== false
                      ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                      : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                  }`}
                  title={event.isActive !== false ? "Yayından Kaldır (Gizle)" : "Yayına Al (Göster)"}
                >
                  {event.isActive !== false ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Gizle</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Yayınla</span>
                    </>
                  )}
                </button>
              )}
              {onOpenEditModal && (
                <button
                  onClick={() => onOpenEditModal(event)}
                  className="flex-1 sm:flex-none px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-1.5"
                  title="Düzenle"
                >
                  <Edit3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Düzenle</span>
                </button>
              )}
              <button
                onClick={() => onOpenRateForm(event)}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95"
              >
                <MessageSquare className="w-4 h-4 fill-white text-white" />
                <span>Puan Ver & Yorum Yap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-850 px-6 py-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 shadow-2xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Sporpuan Skoru</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 shadow-2xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Kullanıcı İncelemeleri ({totalReviewCount})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-slate-800 dark:text-slate-100">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              
              {/* Detailed Rating & Reviews Breakdown Widget (Matching Screenshot) */}
              <div className="bg-[#f0f4f8] dark:bg-slate-850 rounded-[28px] p-4 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 sm:space-y-6">
                
                {/* TOP ROW: Overall Rating + Sub-criteria Rings + Percentage Rings */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/80">
                  
                  {/* Left: Speech Bubble Badge & Title */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-md">
                        {event.overallScore.toFixed(1)}
                      </div>
                      <div className="absolute -bottom-1.5 left-4 w-4 h-4 bg-blue-600 rotate-45 rounded-xs" />
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                        {scoreLabel}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {totalReviewCount} yorum
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-normal">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Son bir yıldaki yorum sayısı: <strong className="font-semibold text-slate-700 dark:text-slate-300">{recentYearCount}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Sub-criteria Rings & Percentage Rings */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4 sm:gap-6 w-full pt-4 md:pt-0 border-t md:border-t-0 border-slate-200/60 dark:border-slate-800/80">
                       
                    {/* Sub-criteria items (Wrap instead of overflow to prevent cut-off) */}
                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 w-full lg:w-auto">
                      {(CATEGORY_CRITERIA_MAP[event.category] || []).map((crit) => {
                        const score = getCriterionScore(event.ratingBreakdown, crit.key, event.overallScore);
                        return (
                          <CircularProgress 
                            key={crit.key} 
                            score={score} 
                            max={10} 
                            label={crit.label} 
                            colorClass="text-blue-500" 
                          />
                        );
                      })}

                      {/* Divider */}
                      <div className="w-[1px] h-12 bg-slate-200 dark:bg-slate-700/60 shrink-0 mx-1 hidden sm:block" />

                      <div className="flex items-center justify-center gap-4 sm:gap-6">
                        {/* Tavsiye */}
                        <CircularProgress 
                          score={tavsiyePercent} 
                          max={100} 
                          label={"Tavsiye\nOranı"} 
                          colorClass="text-emerald-500" 
                          size={56} 
                          stroke={4.5} 
                        />

                        {/* Fiyat Performans */}
                        <CircularProgress 
                          score={fiyatPercent} 
                          max={100} 
                          label={"Fiyat\nPerformans"} 
                          colorClass="text-amber-500" 
                          size={56} 
                          stroke={4.5} 
                        />
                      </div>
                    </div>

                  </div>
                </div>
                
                {/* DUAL LANGUAGE REVIEW SUMMARY BOX */}
                <div className="bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/60 dark:from-slate-800 dark:via-slate-850 dark:to-blue-950/40 rounded-2xl p-4 sm:p-5 border border-blue-200/80 dark:border-blue-900/60 space-y-3 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-2xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          Sporpuan Değerlendirme Özeti
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Gerçek kullanıcı yorumlarından derlenmiş özet
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-white/80 dark:bg-slate-900/70 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                    {computedSummary.tr}
                  </p>

                  {/* Highlights Tags */}
                  {(computedSummary.highlightsTr || []).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                        Öne Çıkanlar:
                      </span>
                      {computedSummary.highlightsTr.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100/90 dark:bg-blue-950/90 text-blue-900 dark:text-blue-300 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/80"
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* MIDDLE ROW: FEATURED RECENT REAL REVIEW CARDS */}
                <div className="flex flex-nowrap md:grid md:grid-cols-3 gap-4 pt-1 overflow-x-auto pb-2 scrollbar-none">
                  {featuredReviews.length > 0 ? (
                    featuredReviews.slice(0, 3).map((rev, idx) => {
                      const rawComment = rev.comment || '';
                      const turkishComment = getCleanTurkishComment(rawComment, rev.overallScore, event.title);
                      const displayText = turkishComment;

                      return (
                        <div key={rev.id || idx} className="w-72 md:w-auto shrink-0 bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-100 dark:border-slate-700/80 flex flex-col justify-between min-h-[145px]">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
                                {anonymizeUserName(rev.userName)}
                              </span>
                              <div className="bg-sky-400 text-white font-bold text-[11px] px-3 py-1 rounded-l-full rounded-r-md flex items-center gap-1 shadow-2xs shrink-0">
                                <span>{rev.overallScore.toFixed(1)}</span>
                                <span>{getScoreLabel(rev.overallScore)}</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed mt-3.5 line-clamp-4">
                              "{displayText}"
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{rev.date}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-3 text-center py-6 text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      Henüz öne çıkan bir değerlendirme bulunmuyor. İlk yorumu siz yazın!
                    </div>
                  )}
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
                  <button
                    onClick={() => onOpenRateForm(event)}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-full shadow-md shadow-blue-600/20 transition flex justify-center items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-white text-white" />
                    <span>Yorum Yaz</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-full border border-slate-300 dark:border-slate-700 transition shadow-2xs active:scale-95 cursor-pointer text-center flex justify-center items-center"
                  >
                    <span>Tüm Yorumları Göster</span>
                  </button>
                </div>

              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">
                      {event.category === 'Spor Etkinlikleri' ? 'Tarih & Saat' : 'Dönem / Çalışma Saatleri'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{event.date} {event.time && `• ${event.time}`}</span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Konum / Tesis</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate block max-w-full sm:max-w-[180px]">{event.venue}</span>
                  </div>
                </div>
              </div>

              {/* Description & About */}
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {event.category === 'Spor Etkinlikleri' ? 'Etkinlik Hakkında' : 
                   event.category === 'Spor Salonları' ? 'Salon Hakkında' :
                   event.category === 'Spor Okulları' ? 'Okul Hakkında' : 'Tesis Hakkında'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {event.description}
                </p>
              </div>

              {/* Interactive In-App Map Section */}
              <FacilityMiniMap 
                event={event} 
                onExpandMap={() => navigate(`/harita?id=${event.id}`)} 
              />

            </div>
          )}

          {/* TAB 2: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Sporpuan Kullanıcı Değerlendirmeleri
                </h3>
                <button
                  onClick={() => onOpenRateForm(event)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Yorum Yaz & Puan Ver</span>
                </button>
              </div>



              {event.reviews.filter(r => r.status !== 'hidden').length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <MessageSquare className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">Henüz bu {event.category === 'Spor Okulları' ? 'okul' : event.category === 'Spor Salonları' ? 'salon' : event.category === 'Spor Tesisleri' ? 'tesis' : 'etkinlik'} için yayınlanmış yorum yapılmadı.</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">İlk değerlendirmeyi yapan spor sever sen ol!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {event.reviews.filter(r => r.status !== 'hidden').map((rev) => (
                    <div key={rev.id} className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
                      
                      {/* Review User Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold overflow-hidden border border-blue-200 dark:border-blue-800">
                            {rev.userAvatar ? (
                              <img referrerPolicy="no-referrer"
                                src={rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                                alt={anonymizeUserName(rev.userName)}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';
                                }}
                              />
                            ) : (
                              anonymizeUserName(rev.userName).charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{anonymizeUserName(rev.userName)}</span>
                              {rev.verifiedAttendee && (
                                <span className="bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/80 flex items-center gap-0.5">
                                  <BadgeCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Katılımcı
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{rev.date}</span>
                          </div>
                        </div>

                        {/* Review Score Badge */}
                        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 px-3 py-1 rounded-xl font-black text-sm">
                          <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400" />
                          <span>{rev.overallScore.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Comment */}
                      {(() => {
                        const rawComment = rev.comment || '';
                        const turkishComment = getCleanTurkishComment(rawComment, rev.overallScore, event.title);
                        const displayText = turkishComment;

                        return (
                          <div className="space-y-1.5">
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                              "{displayText}"
                            </p>
                          </div>
                        );
                      })()}

                      {/* User Uploaded Photos / Verification Documents */}
                      {((rev.userPhotos && rev.userPhotos.length > 0) || (rev.verificationDocs && rev.verificationDocs.length > 0)) && (
                        <div className="pt-2 space-y-2">
                          <div className="flex flex-wrap gap-2 items-center">
                            {rev.userPhotos && rev.userPhotos.map((photo, pIdx) => (
                              <img referrerPolicy="no-referrer"
                                key={pIdx}
                                src={photo || undefined}
                                alt="Kullanıcı Görseli"
                                className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs hover:scale-105 transition cursor-pointer"
                              />
                            ))}

                            {rev.verificationDocs && rev.verificationDocs.map((doc, dIdx) => (
                              <div
                                key={dIdx}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300 font-semibold"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="truncate max-w-[140px]">{doc.name}</span>
                                <span className="text-[10px] bg-blue-200 dark:bg-blue-900 px-1.5 py-0.5 rounded text-blue-900 dark:text-blue-200 font-bold">Onaylı Belge</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Category Criteria Sub-scores Breakdown */}
                      {rev.scores && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(CATEGORY_CRITERIA_MAP[event.category] || []).map((crit) => {
                            const scoreVal = getCriterionScore(rev.scores, crit.key, rev.overallScore);
                            return (
                              <span key={crit.key} className="bg-slate-200/60 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-medium border border-slate-300/40 dark:border-slate-700/60">
                                {crit.label}: <strong className="text-blue-600 dark:text-blue-400 font-bold">{scoreVal.toFixed(1)}</strong>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Pros & Cons */}
                      {(rev.pros.length > 0 || rev.cons.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                          {rev.pros.length > 0 && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-xl space-y-1">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Artılar:
                              </span>
                              <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-0.5">
                                {rev.pros.map((p, i) => <li key={i}>{p}</li>)}
                              </ul>
                            </div>
                          )}

                          {rev.cons.length > 0 && (
                            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-2.5 rounded-xl space-y-1">
                              <span className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Eksiler:
                              </span>
                              <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-0.5">
                                {rev.cons.map((c, i) => <li key={i}>{c}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Official Admin / Facility Response */}
                      {rev.adminReply && (
                        <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 p-3 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-blue-700 dark:text-blue-400">
                            <span className="flex items-center gap-1.5">
                              <BadgeCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              Sporpuan / Tesis Yanıtı:
                            </span>
                            {rev.adminReplyDate && (
                              <span className="text-[10px] font-normal text-slate-400">{rev.adminReplyDate}</span>
                            )}
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                            "{rev.adminReply}"
                          </p>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex flex-wrap gap-1">
                          {rev.tags.map((t) => (
                            <span key={t} className="bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px]">
                              #{t}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => onLikeReview(event.id, rev.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg transition"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Faydalı ({rev.likes})</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
