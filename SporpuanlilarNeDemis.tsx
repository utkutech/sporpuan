import { Avatar } from './Avatar';
import { anonymizeUserName } from '../lib/nameUtils';
import React, { useMemo } from 'react';
import { SportsEvent, Review } from '../types';
import { MessageCircle, Camera, Map, Star, Quote } from 'lucide-react';

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

interface Props {
  events: SportsEvent[];
}

const FALLBACK_REVIEWS: (Review & { eventTitle: string })[] = [
  {
    id: 'f1',
    userName: 'Elif K.',
    date: '2026-08-01',
    overallScore: 8.9,
    scores: { tesis: 9, egitmen: 8, hijyen: 9 },
    comment: 'Su sporları tutkunları için harika bir etkinlik.',
    pros: [],
    cons: [],
    likes: 0,
    tags: [],
    status: 'published',
    eventTitle: 'Kürek Kano Festivali', verifiedAttendee: true,
  },
  {
    id: 'f2',
    userName: 'Selin O.',
    date: '2026-08-01',
    overallScore: 9,
    scores: { zemin: 9, aydinlatma: 9, ulasim: 9 },
    comment: 'Organizasyon çok keyifliydi. Sporpuan üzerinden keşfetmem harika.',
    pros: [],
    cons: [],
    likes: 0,
    tags: [],
    status: 'published',
    eventTitle: 'Bisiklet Festivali', verifiedAttendee: true,
  },
  {
    id: 'f3',
    userName: 'Burak D.',
    date: '2026-08-01',
    overallScore: 9.1,
    scores: { parkurGuvenlik: 10, kitIkram: 8, atmosferSeyir: 9 },
    comment: 'Güzergah muhteşemdi, organizasyon mükemmeldi.',
    pros: [],
    cons: [],
    likes: 0,
    tags: [],
    status: 'published',
    eventTitle: 'İstanbul Maratonu', verifiedAttendee: true,
  },
  {
    id: 'f4',
    userName: 'Ayşe M.',
    date: '2026-08-01',
    overallScore: 8.8,
    scores: { egitmen: 9, fiyatPerformans: 8, hijyen: 9 },
    comment: 'Harika bir organizasyon, parkur çok güzeldi.',
    pros: [],
    cons: [],
    likes: 0,
    tags: [],
    status: 'published',
    eventTitle: 'Ankara Triatlon', verifiedAttendee: true,
  }
];

export const SporpuanlilarNeDemis: React.FC<Props> = ({ events }) => {
  const allReviews = useMemo(() => {
    const list: (Review & { eventTitle: string })[] = [];
    events.forEach(ev => {
      ev.reviews.forEach(rev => {
        list.push({ ...rev, eventTitle: ev.title });
      });
    });
    const validReviews = list.filter(r => r.status !== 'hidden');
    if (validReviews.length < 4) {
      return [...validReviews, ...FALLBACK_REVIEWS];
    }
    return validReviews.sort(() => 0.5 - Math.random());
  }, [events]);

  const repeatedReviews = [...allReviews, ...allReviews, ...allReviews, ...allReviews].slice(0, 20);

  return (
    <section className="w-full bg-white dark:bg-slate-950 pt-20 pb-16 overflow-hidden relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">
          {/* Left: Stats */}
          <div className="w-full lg:w-5/12 space-y-12">
            <div>
              <h2 className="font-['Red_Hat_Display',_sans-serif] text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
                Sporpuanlılar Ne Demiş?
              </h2>
            </div>
            
            <div className="space-y-10">
              <div className="flex items-center gap-6 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-400 dark:bg-yellow-500 flex items-center justify-center shrink-0 shadow-sm relative">
                  <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white stroke-2" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-yellow-500 text-xs sm:text-sm font-black">10K</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-1">10 Bin+</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg sm:text-xl">Yorum Sayısı</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-400 dark:bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm relative">
                  <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white stroke-2" />
                </div>
                <div>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-1">5 Bin+</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg sm:text-xl">Fotoğraf Sayısı</p>
                </div>
              </div>

              <div className="flex items-center gap-6 group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sky-400 dark:bg-sky-500 flex items-center justify-center shrink-0 shadow-sm relative">
                  <Map className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white stroke-2" />
                </div>
                <div>
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-1">1000+</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg sm:text-xl">Spor Tesisi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="w-full lg:w-7/12 relative mt-12 lg:mt-0 max-w-xl mx-auto lg:mx-0">
             {/* Decorative Background */}
             <div className="absolute inset-0 bg-yellow-400 rounded-[3rem] scale-100 sm:scale-105 translate-x-2 -translate-y-2 sm:translate-x-4 sm:-translate-y-4 hidden md:block"></div>
             
             {/* Collage Container */}
             <div className="relative z-10 w-full h-[360px] sm:h-[480px] grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
               {/* Large left image (Sports event) */}
               <div className="col-span-1 row-span-2 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group">
                 <img referrerPolicy="no-referrer" 
                   src="https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop" 
                   alt="Maraton" 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                 />
               </div>
               {/* Top right image (Swimming) */}
               <div className="col-span-1 row-span-1 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group">
                 <img referrerPolicy="no-referrer" 
                   src="https://images.unsplash.com/photo-1560090995-01632a28895b?q=80&w=600&auto=format&fit=crop" 
                   alt="Yüzme Tesisi" 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                 />
               </div>
               {/* Bottom right image (Sports school) */}
               <div className="col-span-1 row-span-1 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl group">
                 <img referrerPolicy="no-referrer" 
                   src="https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=600&auto=format&fit=crop" 
                   alt="Spor Okulu" 
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                 />
               </div>
             </div>
             
             {/* Floating card 1 */}
             <div className="absolute -left-2 sm:-left-8 top-1/4 z-20 bg-slate-900 dark:bg-slate-800 p-3 sm:p-4 rounded-2xl shadow-xl w-56 sm:w-64 transform -rotate-3 transition-transform hover:rotate-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-inner text-white font-bold text-lg">
                    MK
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Yorum bırakan</p>
                    <p className="text-sm sm:text-base font-black text-white leading-none">Murat K.</p>
                  </div>
                </div>
             </div>
             
             {/* Floating card 2 */}
             <div className="absolute -right-2 sm:-right-6 bottom-4 sm:bottom-8 z-20 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-2xl w-64 sm:w-72 transform rotate-3 transition-transform hover:rotate-0 border border-slate-100 dark:border-slate-700">
                <div className="absolute -top-3 -left-3 bg-emerald-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                   <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1.5 leading-tight">Harika Tesis!</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Çocuğum için futbol okulu arıyordum. Antrenörler çok ilgili, tesis oldukça hijyenik ve güvenli. Kesinlikle tavsiye ederim.
                </p>
             </div>
          </div>
        </div>
      </div>
      
      {/* Marquee Section */}
      <div className="relative py-10 w-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/20 border-y border-slate-100 dark:border-slate-800/50">
        
        {/* Gradients for fading effect at edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-24 bg-gradient-to-r from-slate-50/50 dark:from-slate-950/20 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-24 bg-gradient-to-l from-slate-50/50 dark:from-slate-950/20 to-transparent z-20 pointer-events-none"></div>

        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 50s linear infinite;
            display: flex;
            width: max-content;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
          
          .flip-card {
            perspective: 1000px;
          }
          .flip-card-inner {
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            transform-style: preserve-3d;
          }
          .flip-card:hover .flip-card-inner {
            transform: rotateY(180deg);
          }
          .flip-card-front, .flip-card-back {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }
          .flip-card-back {
            transform: rotateY(180deg);
          }
        `}</style>
        
        <div className="relative z-10 animate-marquee gap-4 sm:gap-6 px-4">
          {repeatedReviews.map((rev, idx) => {
            const colors = [
              'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', 
              'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', 
              'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', 
              'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', 
              'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
            ];
            const avatarColor = colors[idx % colors.length];
            
            return (
              <div key={`${rev.id}-${idx}`} className="flip-card w-[280px] sm:w-[340px] h-[180px] sm:h-[200px] flex-shrink-0 cursor-pointer">
                <div className="flip-card-inner w-full h-full relative">
                  
                  {/* Front */}
                  <div className="flip-card-front absolute w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {rev.userAvatar ? (
                          <Avatar src={rev.userAvatar} name={anonymizeUserName(rev.userName)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-slate-100 dark:border-slate-700" />
                        ) : (
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm sm:text-base`}>
                            {rev.userName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">{anonymizeUserName(rev.userName)}</h4>
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[130px] sm:max-w-[160px]">{rev.eventTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 rounded-lg">
                        <span className="text-yellow-600 dark:text-yellow-500 font-bold text-sm sm:text-base">{rev.overallScore || rev.rating || 9.0}</span>
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mt-3 sm:mt-4 leading-relaxed font-medium">
                      "{getCleanTurkishComment(rev.comment || '', rev.overallScore || rev.rating || 9.0, rev.eventTitle)}"
                    </p>
                  </div>

                  {/* Back */}
                  <div className="flip-card-back absolute w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-center shadow-sm relative">
                     <Quote className="absolute top-4 right-4 w-12 h-12 text-slate-50 dark:text-slate-800/50 -rotate-6" />
                     
                     <div className="relative z-10 space-y-3 sm:space-y-4 w-full">
                       {Object.entries(rev.scores || { zemin: 9, aydinlatma: 9, ulasim: 9 }).slice(0, 3).map(([key, score]) => (
                         <div key={key} className="flex justify-between items-center text-xs sm:text-sm">
                           <span className="text-slate-600 dark:text-slate-400 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                           <div className="flex items-center gap-2 sm:gap-3 flex-1 ml-4">
                             <div className="flex-1 h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(score as number) * 10}%`}}></div>
                             </div>
                             <span className="text-slate-800 dark:text-slate-200 font-black w-5 text-right">{score as number}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}