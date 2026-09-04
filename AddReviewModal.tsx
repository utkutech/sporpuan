import React, { useState, useEffect, useMemo } from 'react';
import { SportsEvent, RatingCriterion, Review, UserProfile, SportsCategory } from '../types';
import { calculateOverallScore, CATEGORY_CRITERIA_MAP, getScoreBadgeColor, getScoreLabel } from '../lib/scoreUtils';
import { X, Star, CheckCircle2, Trophy, Upload, ShieldCheck, AlertCircle, User, LogIn, UploadCloud, FileText, Trash2, Paperclip, BadgeCheck } from 'lucide-react';
import { HoverRatingBar } from './HoverRatingBar';

const PREDEFINED_PROS = [
  "Harika Atmosfer", "Hızlı Giriş", "Temiz Tesis", "Uygun Fiyat", "Kolay Ulaşım", "İlgili Personel", "Güvenli Ortam", "Aileye Uygun"
];

const PREDEFINED_CONS = [
  "Yetersiz Otopark", "Uzun Kuyruklar", "Pahalı", "Çok Kalabalık", "Ulaşım Zorluğu", "İlgisiz Personel", "Yetersiz Temizlik", "Kötü Ses Sistemi"
];

// Zıt/çelişen pro-con çiftleri (Biri seçildiğinde zıttı otomatik temizlenir)
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

interface AddReviewModalProps {
  events: SportsEvent[];
  selectedEvent: SportsEvent | null;
  onClose: () => void;
  onSubmitReview: (eventId: string, newReview: Review) => void;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
  events,
  selectedEvent,
  onClose,
  onSubmitReview,
  currentUser,
  onOpenAuthModal,
}) => {
  const activeEvents = useMemo(() => events.filter(e => e.isActive !== false), [events]);
  const [targetEventId, setTargetEventId] = useState<string>(
    selectedEvent ? selectedEvent.id : activeEvents[0]?.id || ''
  );
  
  const targetEvent = useMemo(() => activeEvents.find((e) => e.id === targetEventId) || activeEvents[0], [activeEvents, targetEventId]);

  const [userName, setUserName] = useState(currentUser?.name || '');
  const [scores, setScores] = useState<RatingCriterion>({});
  const [hoveredScores, setHoveredScores] = useState<RatingCriterion | null>(null);
  
  // Initialize scores based on category
  useEffect(() => {
    if (targetEvent) {
      const criteria = CATEGORY_CRITERIA_MAP[targetEvent.category] || CATEGORY_CRITERIA_MAP['Spor Etkinlikleri'];
      const initialScores: RatingCriterion = {};
      criteria.forEach(c => initialScores[c.key] = 8); // Default 8
      setScores(initialScores);
    }
  }, [targetEvent]);

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
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

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

  const togglePro = (pro: string) => {
    setSelectedPros(prev => {
      const isSelecting = !prev.includes(pro);
      if (isSelecting) {
        // Zıt eksiyi temizle (ör. "Temiz Tesis" seçilince "Yetersiz Temizlik" kaldırılır)
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
        // Zıt artıyı temizle (ör. "Yetersiz Temizlik" seçilince "Temiz Tesis" kaldırılır)
        const opposingPro = OPPOSING_PAIRS[con];
        if (opposingPro) {
          setSelectedPros(pPrev => pPrev.filter(p => p !== opposingPro));
        }
        return [...prev, con];
      }
      return prev.filter(c => c !== con);
    });
  };

  useEffect(() => {
    if (currentUser?.name) {
      setUserName(currentUser.name);
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedEvent) {
      setTargetEventId(selectedEvent.id);
    }
  }, [selectedEvent]);

  const currentScore = calculateOverallScore(hoveredScores || scores, targetEvent?.category || 'Spor Etkinlikleri');
  const scoreBadge = getScoreBadgeColor(currentScore);
  const scoreLabel = getScoreLabel(currentScore);

  const handleCriterionChange = (key: string, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Yorum yapabilmek için lütfen önce üye girişi yapınız.');
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (!userName.trim() || !comment.trim()) {
      alert('Lütfen adınızı ve yorumunuzu giriniz.');
      return;
    }

    const pros = selectedPros;
    const cons = selectedCons;

    const newReview: Review = {
      id: 'rev-' + Date.now(),
      userName: userName.trim(),
      userAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      verifiedAttendee: verified || uploadedFiles.length > 0,
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      overallScore: currentScore,
      scores,
      comment: comment.trim(),
      pros: pros.length > 0 ? pros : ['Harika organizasyon'],
      cons: cons,
      likes: 0,
      userPhotos: uploadedFiles.filter(f => f.type === 'image').map(f => f.url),
      verificationDocs: uploadedFiles.map(f => ({ name: f.name, url: f.url, type: f.type })),
      tags: ['Sporpuan İncelemesi'],
    };

    onSubmitReview(targetEventId, newReview);
    setSubmittedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[95vh] rounded-3xl shadow-2xl flex flex-col text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="bg-slate-50 dark:bg-slate-850 p-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold shadow-2xs">
              <Star className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Etkinlik veya Tesis Puanla</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">sporpuan standartlarına uygun 5 boyutlu objektif değerlendirme</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-10 text-center space-y-4 flex-1">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Puanınız Başarıyla Kaydedildi!</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto font-medium">
              Sporpuan topluluğuna katkınız için teşekkür ederiz. Değerlendirmeniz etkinliğin ortalama skorunu anında güncelledi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* User Account Status Banner */}
            {currentUser ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-xl p-4 sm:p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <img referrerPolicy="no-referrer"
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                    alt={currentUser.name}
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                  />
                  <div>
                    <p className="text-sm sm:text-xs font-black text-slate-800 dark:text-slate-200">{currentUser.name}</p>
                    <span className="text-[11px] sm:text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-100/50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                      {currentUser.role === 'admin' ? 'Yönetici' : currentUser.role === 'organizer' ? 'Organizatör' : 'Sporsever'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  Doğrulanmış
                </span>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Yorumlarınızın doğrulanmış görünmesi için üye girişi yapabilirsiniz.</span>
                </div>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="text-xs font-bold bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-2.5 py-1 rounded-lg transition shrink-0"
                  >
                    Giriş Yap
                  </button>
                )}
              </div>
            )}

            {/* Event Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Değerlendirilecek Etkinliği Seçin:
              </label>
              <select
                value={targetEventId}
                onChange={(e) => setTargetEventId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {activeEvents.map((ev) => (
                  <option key={ev.id} value={ev.id} className="bg-white dark:bg-slate-800">
                    {ev.title} ({ev.city} - {ev.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Calculated Score Live Preview Card */}
            <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Hesaplanan Sporpuan Skoru:
                </span>
                <span className={`text-xs font-extrabold uppercase mt-1 inline-block ${scoreBadge.text}`}>
                  {scoreLabel} Etkinlik Değerlendirmesi
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <Star className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{currentScore.toFixed(1)}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">/ 10</span>
              </div>
            </div>

            {/* 5 Criteria Sliders */}
            <div className="space-y-5 bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2 gap-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>5 Boyutlu Puanlama</span>
                </h4>
                
              </div>

              <div className="grid grid-cols-1 gap-5">
                {(CATEGORY_CRITERIA_MAP[targetEvent?.category || 'Spor Etkinlikleri'] || []).map((crit) => {
                  const val = (hoveredScores ? hoveredScores[crit.key] : scores[crit.key]) || 8;

                  return (
                    <div key={crit.key} className="space-y-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
                          <span>{crit.label}</span>
                        </span>
                        <span className="font-black text-blue-600 dark:text-blue-400 text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {val} / 10
                        </span>
                      </div>

                      <HoverRatingBar 
                        onHoverChange={(newVal) => {
                          if (newVal === null) {
                            setHoveredScores(null);
                          } else {
                            setHoveredScores({ ...scores, [crit.key]: newVal });
                          }
                        }}
                        value={val} 
                        onChange={(newVal) => handleCriterionChange(crit.key, newVal)} 
                      />

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug">{crit.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User Name & Comment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Adınız & Soyadınız:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Mehmet Özkan"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-normal"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 w-full hover:border-blue-400 transition">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 dark:accent-blue-400 rounded cursor-pointer"
                  />
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Etkinliğe Bizzat Katıldım (Onaylı Katılımcı)</span>
                </label>
              </div>
            </div>

            {/* Comment Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Detaylı Yorumunuz & Deneyiminiz:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Etkinliğin organizasyonu, stadyum/tesis ortamı, ses/ışık kalitesi veya ulaşım hakkında deneyiminizi paylaşın..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-normal"
              />
            </div>

            {/* Document & Image Verification Upload */}
            <div className="space-y-3 bg-slate-50/80 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Doğrulama İçin Belge Veya Görsel Yükle (İsteğe Bağlı)
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  Rozetli Yorum
                </span>
              </div>

              <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl bg-white dark:bg-slate-800 cursor-pointer transition group">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Belge veya Fotoğraf Yüklemek İçin Tıklayın
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Fatura, üyelik kartı, bilet veya tesis içi fotoğraf (JPG, PNG, PDF)
                    </p>
                  </div>
                </div>
              </label>

              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    Yüklenen Dosyalar ({uploadedFiles.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {file.type === 'image' ? (
                            <img referrerPolicy="no-referrer" src={file.url || undefined} alt={file.name} className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <div className="truncate">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-[11px]">{file.name}</p>
                            <span className="text-[9px] text-slate-400">{file.size}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pros & Cons Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <label className="font-bold text-emerald-700 dark:text-emerald-400 block">
                  (+) Öne Çıkan Artılar:
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_PROS.map(pro => (
                    <button
                      key={pro}
                      type="button"
                      onClick={() => togglePro(pro)}
                      className={`px-3 py-1.5 rounded-full border transition font-semibold ${
                        selectedPros.includes(pro)
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      {pro}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="font-bold text-rose-700 dark:text-rose-400 block">
                  (-) Eleştiri / Eksiler:
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_CONS.map(con => (
                    <button
                      key={con}
                      type="button"
                      onClick={() => toggleCon(con)}
                      className={`px-3 py-1.5 rounded-full border transition font-semibold ${
                        selectedCons.includes(con)
                          ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      {con}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-black text-sm rounded-xl shadow-md transition active:scale-98"
            >
              Puanlamayı Gönder & Yayınla
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
