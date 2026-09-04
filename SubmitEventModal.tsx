import React, { useState, useRef } from 'react';
import { SportsEvent, SportsCategory, UserProfile } from '../types';
import { DEFAULT_COVERS, getCoverImage } from "../lib/coverUtils";
import { 
  X, 
  PlusCircle, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Trophy, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Check, 
  Building2, 
  ShieldCheck,
  Award,
  BarChart3,
  Phone,
  Mail,
  User,
  Globe,
  HelpCircle,
  ArrowRight,
  LogIn,
  Lock
} from 'lucide-react';

interface SubmitEventModalProps {
  onClose: () => void;
  onAddEvent: (newEvent: SportsEvent) => void;
  categories: SportsCategory[];
  currentUser?: UserProfile | null;
  onOpenAuthModal?: (mode?: 'default' | 'corporate') => void;
}

const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop';

export const SubmitEventModal: React.FC<SubmitEventModalProps> = ({
  onClose,
  onAddEvent,
  categories,
  currentUser,
  onOpenAuthModal,
}) => {
  const isAuthorizedToDirectAdd = currentUser?.role === 'admin' || currentUser?.role === 'organizer';
  
  // Default tab: If admin/organizer, allow direct publish tab; otherwise default to corporate application form
  const [activeTab, setActiveTab] = useState<'application' | 'direct'>(
    isAuthorizedToDirectAdd ? 'direct' : 'application'
  );

  // Corporate Application Form States
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<SportsCategory>('Spor Tesisleri');
  const [authorizedPerson, setAuthorizedPerson] = useState(currentUser?.name || '');
  const [authorizedTitle, setAuthorizedTitle] = useState('Tesis Sahibi / Yöneticisi');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('İstanbul');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [appSubmittedSuccess, setAppSubmittedSuccess] = useState(false);

  // Direct Add Form States (for Admin / Organizer)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SportsCategory>('Spor Tesisleri');
  const [directCity, setDirectCity] = useState('İstanbul');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('Sürekli / Aktif');
  const [time, setTime] = useState('08:00 - 23:00');
  const [organizer, setOrganizer] = useState(
    currentUser?.role === 'organizer' ? (currentUser.organizationName || currentUser.name) : ''
  );
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(DEFAULT_EVENT_IMAGE);
  const [isCustomUploaded, setIsCustomUploaded] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [directSubmitted, setDirectSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image crop/standardization
  const processAndStandardizeImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir görsel dosyası (PNG, JPG, WEBP) seçiniz.');
      return;
    }

    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const TARGET_WIDTH = 1200;
        const TARGET_HEIGHT = 675;

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const scale = Math.max(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height);
          const x = (TARGET_WIDTH - img.width * scale) / 2;
          const y = (TARGET_HEIGHT - img.height * scale) / 2;

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          const standardizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setImage(standardizedDataUrl);
          setIsCustomUploaded(true);
        } else {
          setImage(e.target?.result as string);
          setIsCustomUploaded(true);
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        alert('Görsel yüklenirken bir hata oluştu.');
        setIsProcessingImage(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      alert('Dosya okunamadı.');
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndStandardizeImage(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndStandardizeImage(e.dataTransfer.files[0]);
    }
  };

  const handleResetImage = () => {
    setImage(DEFAULT_EVENT_IMAGE);
    setIsCustomUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Corporate Application Request
  const handleCorporateAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !authorizedPerson.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      alert('Lütfen tüm zorunlu kurumsal alanları doldurunuz.');
      return;
    }

    setAppSubmittedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  // Submit Direct Listing (Admin/Organizer)
  const handleDirectPublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !venue.trim() || !organizer.trim()) {
      alert('Lütfen gerekli tüm alanları doldurunuz.');
      return;
    }

    const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
      'İstanbul': { lat: 41.0082, lng: 28.9784 },
      'Ankara': { lat: 39.9334, lng: 32.8597 },
      'İzmir': { lat: 38.4237, lng: 27.1428 },
      'Bursa': { lat: 40.1885, lng: 29.0610 },
      'Antalya': { lat: 36.8969, lng: 30.7133 },
      'Trabzon': { lat: 41.0027, lng: 39.7168 },
      'Eskişehir': { lat: 39.7667, lng: 30.5256 },
      'Kocaeli': { lat: 40.7654, lng: 29.9408 },
    };

    const cityCoords = CITY_COORDINATES[directCity] || { lat: 41.0082, lng: 28.9784 };
    const randomLatOffset = (Math.random() - 0.5) * 0.05;
    const randomLngOffset = (Math.random() - 0.5) * 0.05;

    const newEvent: SportsEvent = {
      id: 'event-' + Date.now(),
      title: title.trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      category,
      city: directCity,
      venue: venue.trim(),
      date: date || 'Sürekli / Aktif',
      time: time || '08:00 - 23:00',
      organizer: organizer.trim(),
      organizerVerified: true,
      image,
      description: description.trim() || 'Sporpuan platformuna kayıt edilmiş doğrulanmış spor tesisi / etkinliği.',
      overallScore: 8.8,
      ratingBreakdown: {
        organization: 8.8,
        atmosphere: 8.8,
        valueForMoney: 8.8,
        amenities: 8.8,
        accessibility: 8.8,
      },
      reviewCount: 1,
      featured: true,
      latitude: cityCoords.lat + randomLatOffset,
      longitude: cityCoords.lng + randomLngOffset,
      tags: [category, directCity, 'Kurumsal Kayıt'],
      reviews: [],
    };

    onAddEvent(newEvent);
    setDirectSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl my-auto text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-850 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Kurumsal Üyelik & Tesis / Kayıt Başvurusu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Spor Tesisi, Salonu, Okulu veya Organizasyonunuzu Sporpuan'a Ekleyin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-850 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('application')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'application'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Kurumsal Kayıt Başvurusu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activeTab === 'direct'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Doğrudan Kayıt Yayınla {isAuthorizedToDirectAdd && '(Onaylı)'}</span>
          </button>
        </div>

        {/* TAB 1: KURUMSAL BAŞVURU FORMU */}
        {activeTab === 'application' && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs">
            {appSubmittedSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  Kurumsal Başvurunuz Başarıyla Alındı!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto font-medium leading-relaxed">
                  <strong>{orgName}</strong> için yaptığınız kurumsal başvuru doğrulama ekibimize iletilmiştir. Tesis bilgilerinizi inceleyip en geç 24 saat içinde temsilcimiz sizinle irtibata geçecektir.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium max-w-sm mx-auto">
                  Sporpuan platformunda kulübünüzü ve tesisinizi sergilediğiniz için teşekkür ederiz.
                </div>
              </div>
            ) : !currentUser ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Üye Girişi Gereklidir
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto font-medium leading-relaxed">
                  Kurumsal üyelik tesis kayıt başvurusunda bulunabilmek için lütfen önce hesabınıza giriş yapınız veya üye olunuz.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal?.();
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md inline-flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Giriş Yap / Üye Ol</span>
                </button>
              </div>
            ) : (
              <>
                {/* Benefits Banner */}
                <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-extrabold text-sm">
                    <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Neden Sporpuan Kurumsal Üyesi Olmalısınız?</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-900 dark:text-slate-100 font-extrabold">Doğrulanmış Rozet</strong>
                        <span className="text-slate-500 dark:text-slate-400">Tesisinize özel mavi onay tiki.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700">
                      <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-900 dark:text-slate-100 font-extrabold">5 Boyutlu Değerlendirme</strong>
                        <span className="text-slate-500 dark:text-slate-400">Hijyen, ekipman ve hizmet analitiği.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleCorporateAppSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Kurum / Tesis / Okul / Organizasyon Adı *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Caddebostan Spor Kompleksi veya Anadolu Spor Akademisi"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Kurum Türü *
                      </label>
                      <select
                        value={orgType}
                        onChange={(e) => setOrgType(e.target.value as SportsCategory)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
                      >
                        <option value="Spor Tesisleri">Spor Tesisi (Stadyum / Kort / Saha)</option>
                        <option value="Spor Salonları">Spor Salonu / Fitness Merkezi</option>
                        <option value="Spor Okulları">Spor Okulu / Akademi</option>
                        <option value="Spor Etkinlikleri">Spor Etkinliği / Organizatör Kulüp</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Bulunduğu Şehir *
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
                      >
                        {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Trabzon', 'Eskişehir', 'Kocaeli'].map((ct) => (
                          <option key={ct} value={ct}>{ct}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Yetkili Adı Soyadı *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="Örn: Serkan Yılmaz"
                          value={authorizedPerson}
                          onChange={(e) => setAuthorizedPerson(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Yetkili Unvanı
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Tesis İşletmecisi / Kulüp Başkanı"
                        value={authorizedTitle}
                        onChange={(e) => setAuthorizedTitle(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Kurumsal E-Posta *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          placeholder="iletisim@kurumadi.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        İletişim Telefonu *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          placeholder="0532 000 00 00"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Tesis / Okul Adresi veya Konum Bilgisi
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Caddebostan Mah. Operatör Cemil Topuzlu Cad. No:12 Kadıköy"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Açıklama & Sunulan Hizmetler
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tesisinizdeki imkanlar (ör. soyunma odaları, otopark, basketbol sahaları, yüzme havuzu vb.) hakkında kısa bilgi verin..."
                      value={orgDescription}
                      onChange={(e) => setOrgDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-normal"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-extrabold text-sm rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Kurumsal Kayıt Başvurusunu Gönder</span>
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* TAB 2: DOĞRUDAN KAYIT YAYINLA (ADMIN & ORGANIZERS ONLY) */}
        {activeTab === 'direct' && (
          <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
            
            {/* Permission Guard Banner */}
            {!isAuthorizedToDirectAdd ? (
              <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl space-y-3 text-center">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-amber-900 dark:text-amber-200">
                    Doğrudan Kayıt Yalnızca Onaylı Kurumsal Üyeler İçindir
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 max-w-md mx-auto leading-relaxed font-medium">
                    Son kullanıcılar platforma doğrudan tesis veya etkinlik ekleyemez. Tesis sahibi, spor salonu işletmecisi veya organizatör iseniz lütfen <strong>Kurumsal Kayıt Başvurusu</strong> yapınız.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('application')}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Kurumsal Başvuru Formuna Git
                  </button>
                  {onOpenAuthModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAuthModal('corporate')}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Kurumsal Giriş Yap</span>
                    </button>
                  )}
                </div>
              </div>
            ) : directSubmitted ? (
              <div className="p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  Spor Tesisi / Kayıt Başarıyla Yayınlandı!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto font-medium">
                  Kaydınız Sporpuan veritabanında yayınlandı. Kullanıcılar anında görüntüleyip puanlayabilir.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDirectPublishSubmit} className="space-y-4">
                
                <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      Onaylı Kurumsal Yayın Modu: {currentUser?.organizationName || currentUser?.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md">
                    Doğrulanmış
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Tesis / Salon / Okul veya Etkinlik Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Kadıköy Spor Parkı & Yüzme Akademisi"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-normal"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Kategori *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SportsCategory)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
                    >
                      {categories.filter((c) => c !== 'Tümü').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Şehir *</label>
                    <select
                      value={directCity}
                      onChange={(e) => setDirectCity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 font-medium cursor-pointer"
                    >
                      {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Trabzon', 'Eskişehir', 'Kocaeli'].map((ct) => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Konum / Stadyum / Adres *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Caddebostan Sahil Yolu No: 44"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-normal"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Organizatör / İşletmeci Kurum *</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Kadıköy Spor Kulübü Derneği"
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-normal"
                    />
                  </div>
                </div>

                {/* Banner Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Tesis / Etkinlik Görseli (16:9 Standart)
                    </label>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

<div className="flex flex-col gap-2">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-3 transition cursor-pointer text-center overflow-hidden flex flex-col items-center justify-center min-h-[150px] ${
                      isDragging
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/80'
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    {isProcessingImage ? (
                      <div className="py-6 flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span className="font-bold text-xs">Görsel İşleniyor...</span>
                      </div>
                    ) : (
                      <div className="w-full space-y-2">
                        <div className="relative w-full aspect-[16/9] max-h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group shadow-2xs">
                          <img referrerPolicy="no-referrer"
                            src={image || undefined}
                            alt="Önizleme"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5 text-blue-600" />
                              Görseli Değiştir
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Standard Covers Toggle */}
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setShowCoverSelector(!showCoverSelector)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {showCoverSelector ? 'Standart Kapakları Gizle' : 'Standart Kapak Seç'}
                    </button>
                  </div>
                  
                  {/* Standard Covers List */}
                  {showCoverSelector && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
                      {DEFAULT_COVERS.map(cover => (
                        <button
                          key={cover.id}
                          type="button"
                          onClick={() => {
                            setImage(getCoverImage(cover.id));
                            setShowCoverSelector(false);
                          }}
                          className="relative group aspect-[16/9] rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500 transition-all focus:outline-none"
                        >
                          <div className="absolute inset-0 w-full h-full" style={{ background: cover.gradient }}></div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                            <span className="text-[9px] font-bold text-white px-2 py-1 bg-black/50 rounded-full">{cover.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">Detaylı Tesis / Etkinlik Açıklaması</label>
                  <textarea
                    rows={3}
                    placeholder="Tesis kuralları, spor ekipmanı, çalışma saatleri veya üyelik şartları hakkında bilgi verin..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 font-normal"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-black text-sm rounded-xl shadow-md transition active:scale-98"
                >
                  Tesisi / Etkinliği Sisteme Kaydet & Yayınla
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
