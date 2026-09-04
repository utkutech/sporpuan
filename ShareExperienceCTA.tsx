import { Avatar } from './Avatar';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, PenTool, ThumbsUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface ShareExperienceCTAProps {
  onOpenAddReview: () => void;
}

export const ShareExperienceCTA: React.FC<ShareExperienceCTAProps> = ({ onOpenAddReview }) => {
  return (
    <section className="bg-white dark:bg-slate-900 py-16 sm:py-24 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white dark:from-slate-800/30 dark:via-slate-900 dark:to-slate-900 -z-10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-16 lg:gap-8">
          
          {/* Text Content */}
          <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Senin Deneyimin, Senin Puanın</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-900 dark:text-white leading-[1.2] tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Spor deneyimini</span>, antrenmanlarını<br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">tesisleri</span> anlat!
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Gittin, ter döktün, antrenman yaptın... Neler düşündün, neleri çok sevdin? Hadi şimdi deneyimlerini Sporpuanlılarla paylaş!
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button
                onClick={onOpenAddReview}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base rounded-full transition active:scale-95 shadow-lg shadow-blue-500/25 flex items-center gap-2"
              >
                <PenTool className="w-5 h-5" />
                <span>Hemen Yorum Yaz</span>
              </button>
              
              <div className="flex items-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                <div className="flex -space-x-2">
                  <Avatar src="https://i.pravatar.cc/100?img=33" name="U1" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900" />
                  <Avatar src="https://i.pravatar.cc/100?img=47" name="U2" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900" />
                  <Avatar src="https://i.pravatar.cc/100?img=12" name="U3" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900" />
                </div>
                <span>1000+ Değerlendirme</span>
              </div>
            </div>
          </div>

          {/* Image & Graphics UI Card */}
          <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-end pr-0 lg:pr-12">
             <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
              
              <div className="absolute inset-0 bg-blue-200/50 dark:bg-blue-900/30 rounded-full blur-[80px] -z-10"></div>
              
              {/* Background Image Circle */}
              <div className="absolute inset-0 w-64 h-64 sm:w-80 sm:h-80 mx-auto rounded-full overflow-hidden border-[6px] border-white dark:border-slate-800 shadow-2xl z-10">
                <img 
                  src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop" 
                  alt="Fitness Antrenman" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
              </div>

              {/* Main Review Card Overlay */}
              <div className="absolute bottom-[-10%] sm:bottom-0 -left-4 sm:-left-12 w-64 sm:w-72 bg-white dark:bg-slate-850 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-750 p-4 sm:p-5 transform rotate-[-3deg] z-20 transition-transform hover:rotate-0 duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar src="https://i.pravatar.cc/150?img=68" name="Ayşe Yılmaz" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100">Ayşe Yılmaz</div>
                      <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400">3 gün önce</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 ml-1">5.0</span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-3 line-clamp-3">
                  "Harika bir tesis! Özellikle eğitmenlerin ilgisi ve salonun hijyeni çok iyiydi. Kesinlikle tavsiye ediyorum, antrenmanlar çok verimli geçiyor."
                </p>
                
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">Pilates</span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">Hijyenik</span>
                </div>
              </div>

              {/* Floating Element 1 - Like */}
              <div className="absolute top-8 right-[-10%] sm:-right-4 bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 transform rotate-[8deg] z-30 animate-pulse">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                     <ThumbsUp className="w-4 h-4 text-emerald-500" />
                   </div>
                   <div className="flex flex-col pr-1">
                     <span className="text-[9px] font-bold text-slate-400">Faydalı</span>
                     <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">42 Kişi</span>
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
    </section>
  );
};
