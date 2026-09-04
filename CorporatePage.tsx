import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Award, 
  TrendingUp, 
  BarChart3, 
  Users, 
  CheckCircle2, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Check, 
  ArrowRight, 
  Sparkles, 
  HelpCircle, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  ImageIcon, 
  Clock, 
  Lock, 
  LogIn,
  Shield,
  Layers,
  MessageSquare,
  Search,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SportsCategory, UserProfile, CorporateApplication } from '../types';
import { TURKEY_CITIES, getDistrictsByCity } from '../data/turkeyLocations';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CorporatePageProps {
  currentUser?: UserProfile | null;
  onOpenAuthModal?: (mode?: 'default' | 'corporate') => void;
  onAddEventSuccess?: (event: any) => void;
}

const CORPORATE_IMAGES = [
  {
    title: 'Modern Fitness & Wellness Kompleksleri',
    category: 'Spor Salonları',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
    stats: '4.9 Puan • 120+ Onaylı Değerlendirme',
    badge: 'Doğrulanmış Tesis'
  },
  {
    title: 'Kapalı Arena & Çok Amaçlı Saha İmkânları',
    category: 'Spor Tesisleri',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop',
    stats: '4.8 Puan • FIBA Standartlarında',
    badge: 'VIP Kurumsal Üye'
  },
  {
    title: 'Tenis Akademisi & Açık Kord Tesisleri',
    category: 'Spor Okulları',
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=1200&auto=format&fit=crop',
    stats: '5.0 Puan • Profesyonel Antrenör Kadrosu',
    badge: 'Doğrulanmış Akademi'
  },
  {
    title: 'Yarı Olimpik Yüzme Salonları & Su Sporları',
    category: 'Spor Tesisleri',
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1200&auto=format&fit=crop',
    stats: '4.9 Puan • Hijyen & Temizlik Birincisi',
    badge: 'Hijyen Sertifikalı'
  }
];

const FAQS = [
  {
    q: 'Sporpuan Kurumsal Üyeliği nedir ve ne sağlar?',
    a: 'Sporpuan Kurumsal Üyeliği; spor tesisleri, salonlar, okullar ve organizatörler için özel olarak tasarlanmış bir itibar ve pazarlama platformudur. Doğrulanmış profil rozeti alarak binlerce potansiyel müşteri ve sporsevere doğrudan ulaşmanızı, yorumlara resmi yanıt vermenizi ve tesis analitiğini izlemenizi sağlar.'
  },
  {
    q: 'Kurumsal üyelik başvurusu nasıl değerlendirilir?',
    a: 'Başvurunuz alındıktan sonra ekibimiz 24 saat içinde tesis bilgilerinizi, yetkili evraklarınızı ve konumunuzu inceleyerek onay sürecini tamamlar. Profiliniz aktif edildikten sonra doğrulama rozetiniz (Blue Checkmark) tanınır.'
  },
  {
    q: 'Tesisime yapılan yorumlara yanıt verebilir miyim?',
    a: 'Evet! Kurumsal yönetici paneliniz üzerinden tesisinize gelen tüm puan ve yorumları anlık bildirimle alabilir, resmi kurumsal temsilci unvanınızla yanıtlayarak marka şeffaflığınızı güçlendirebilirsiniz.'
  },
  {
    q: 'Kurumsal üyeliğin ücreti var mıdır?',
    a: 'Temel kurumsal profil oluşturma ve başvuru süreci şu an için tamamen ücretsizdir. İleri seviye öne çıkarma, detaylı analitik raporlama ve VIP rozet seçenekleri opsiyonel paket olarak sunulmaktadır.'
  },
  {
    q: 'Tesis görsellerimi ve imkanlarımı güncelleyebilir miyim?',
    a: 'Onaylanan kurumsal profilinizde dilediğiniz zaman çalışma saatleri, iletişim bilgileri, 4K fotoğraf galerisi, çalışma antrenör kadrosu ve sunulan ek imkanları (otopark, soyunma odası, klima vb.) güncelleyebilirsiniz.'
  }
];

export const CorporatePage: React.FC<CorporatePageProps> = ({
  currentUser,
  onOpenAuthModal
}) => {
  const navigate = useNavigate();

  // Form States
  const [formData, setFormData] = useState({
    facilityName: '',
    category: 'Spor Tesisleri' as SportsCategory,
    city: 'İstanbul',
    district: 'Kadıköy',
    address: '',
    contactName: currentUser?.name || '',
    contactTitle: 'Tesis Sahibi / Genel Müdürü',
    contactEmail: currentUser?.email || '',
    contactPhone: '',
    website: '',
    capacity: '100-250 Kişi',
    amenities: ['Soyunma Odası', 'Otopark', 'Kafeterya', 'Klima'] as string[],
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
    description: '',
    acceptTerms: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [refCode, setRefCode] = useState('');

  const [quickInviteContact, setQuickInviteContact] = useState('');
  const [quickInviteSent, setQuickInviteSent] = useState(false);
  const [isQuickInviteSubmitting, setIsQuickInviteSubmitting] = useState(false);

  const handleQuickInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInviteContact.trim()) return;
    setIsQuickInviteSubmitting(true);
    
    try {
      const generatedCode = 'REQ-' + Math.floor(10000 + Math.random() * 90000);
      const docRef = doc(db, 'corporate_invite_requests', generatedCode);
      await setDoc(docRef, {
        id: generatedCode,
        contact: quickInviteContact,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      setQuickInviteSent(true);
      setQuickInviteContact('');
    } catch (error) {
      console.error("Error submitting request", error);
      setQuickInviteSent(true);
      setQuickInviteContact('');
    } finally {
      setIsQuickInviteSubmitting(false);
    }
  };

  const getFacilityNameLabel = (cat: SportsCategory) => {
    switch(cat) {
      case 'Spor Salonları': return 'Salon Adı';
      case 'Spor Okulları': return 'Okul / Akademi Adı';
      case 'Spor Etkinlikleri': return 'Organizasyon / Firma Adı';
      default: return 'Tesis Adı';
    }
  };

  const getCapacityOptions = (cat: SportsCategory) => {
    if (cat === 'Spor Okulları') {
      return ['50 Öğrenciden Az', '50-100 Öğrenci', '100-250 Öğrenci', '250-500 Öğrenci', '500+ Öğrenci'];
    }
    if (cat === 'Spor Etkinlikleri') {
      return ['Küçük Çaplı (0-100 Katılımcı)', 'Orta Çaplı (100-500 Katılımcı)', 'Büyük Çaplı (500+ Katılımcı)', 'Uluslararası / Kapsamlı'];
    }
    return ['50 Kişiden Az', '50-100 Kişi', '100-250 Kişi', '250-500 Kişi', '500+ Kişi Kapasiteli'];
  };

  const getAmenitiesList = (cat: SportsCategory) => {
    if (cat === 'Spor Okulları') {
      return ['Servis İmkânı', 'Soyunma Odası', 'Duş İmkânı', 'Otopark', 'Kafeterya', 'Klima / İklimlendirme', 'Özel Ders', 'Lisans Çıkarma', 'Pedagojik Eğitimli Kadro'];
    }
    if (cat === 'Spor Etkinlikleri') {
      return ['Canlı Yayın', 'Sağlık / Ambulans', 'Madalya & Kupa Töreni', 'Hakem Organizasyonu', 'Otopark', 'Konaklama / Transfer', 'Sponsorluk Fırsatları', 'Güvenlik'];
    }
    return [
      'Soyunma Odası', 'Duş İmkânı', 'Otopark', 'Kafeterya / Kantin',
      'Klima / İklimlendirme', 'Özel Ders & Koçluk', 'Çocuk Oyun Alanı',
      'Yüzme Havuzu', 'Sauna / SPA', 'Tribün & Seyirci Alanı', 'Wi-Fi', 'Engelli Ulaşımına Uygun'
    ];
  };

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
        const TARGET_HEIGHT = 675; // 16:9 aspect ratio

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const scale = Math.max(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height);
          const x = (TARGET_WIDTH - img.width * scale) / 2;
          const y = (TARGET_HEIGHT - img.height * scale) / 2;

          ctx.fillStyle = '#0f172a'; // Background color for gaps if any
          ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          const standardizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setFormData({ ...formData, imageUrl: standardizedDataUrl });
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
    setIsDraggingImage(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndStandardizeImage(e.dataTransfer.files[0]);
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.facilityName || !formData.contactPhone || !formData.contactEmail) {
      alert('Lütfen zorunlu alanları (Tesis Adı, Telefon, E-posta) doldurunuz.');
      return;
    }

    setIsSubmitting(true);

    const generatedCode = 'SP-KUR-' + Math.floor(100000 + Math.random() * 900000);
    
    const newApp: CorporateApplication = {
      id: generatedCode,
      refCode: generatedCode,
      facilityName: formData.facilityName,
      category: formData.category,
      city: formData.city,
      district: formData.district || 'Merkez',
      address: formData.address,
      contactName: formData.contactName,
      contactTitle: formData.contactTitle,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      website: formData.website,
      capacity: formData.capacity,
      amenities: formData.amenities,
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
      description: formData.description,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      // 1. Save to Firestore
      await setDoc(doc(db, 'corporate_applications', generatedCode), newApp);
    } catch (err) {
      console.warn("Firestore'a kaydederken uyarı/hata, yerel önbelleğe yazılıyor:", err);
    }

    // 2. LocalStorage backup
    try {
      const savedApps = localStorage.getItem('sporpuan_corporate_applications');
      const appsList: CorporateApplication[] = savedApps ? JSON.parse(savedApps) : [];
      appsList.unshift(newApp);
      localStorage.setItem('sporpuan_corporate_applications', JSON.stringify(appsList));
    } catch (e) {
      console.error("LocalStorage save error:", e);
    }

    setRefCode(generatedCode);
    setIsSubmitting(false);
    setSubmissionSuccess(true);

    // Scroll to success banner smoothly
    setTimeout(() => {
      const el = document.getElementById('success-receipt');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* HERO BANNER SECTION */}
      <section className="relative bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 text-white overflow-hidden py-16 sm:py-24 border-b border-slate-800">
        {/* Background Decorative Pattern & Gradient Overlays */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide uppercase">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Sporpuan Kurumsal Portal</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                Tesisinizi & Akademilerinizi <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                  Doğrulanmış İtibar İle Büyütün
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
                Sporpuan Kurumsal Üyeliği ile spor tesisinizi, sporsalonunuzu veya spor okulunuzu Türkiye'nin en büyük bağımsız spor puanlama dizininde resmi mavi rozetle sergileyin.
              </p>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-3 rounded-xl">
                  <div className="text-xl sm:text-2xl font-black text-blue-400">500+</div>
                  <div className="text-[11px] font-medium text-slate-400">Doğrulanmış Tesis</div>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-3 rounded-xl">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">150.000+</div>
                  <div className="text-[11px] font-medium text-slate-400">Aylık Ziyaretçi</div>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-3 rounded-xl">
                  <div className="text-xl sm:text-2xl font-black text-amber-400">%94</div>
                  <div className="text-[11px] font-medium text-slate-400">Güvenilirlik Artışı</div>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-3 rounded-xl">
                  <div className="text-xl sm:text-2xl font-black text-purple-400">5 Boyut</div>
                  <div className="text-[11px] font-medium text-slate-400">Objektif Puanlama</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 justify-center lg:justify-start">
                <button
                  onClick={() => {
                    if (!currentUser) {
                      onOpenAuthModal?.('corporate');
                    } else {
                      const el = document.getElementById('application-form');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full sm:w-auto px-7 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Hemen Kurumsal Başvuru Yap</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <a
                  href="#why-join"
                  className="w-full sm:w-auto px-6 py-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
                >
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  <span>Neden Kurumsal Üyelik?</span>
                </a>
              </div>
            </div>

            {/* Right Hero Image Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl group">
                <img referrerPolicy="no-referrer"
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop"
                  alt="Kurumsal Spor Tesisi"
                  className="w-full h-[380px] object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Floating Verified Badge Card */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                      <span className="text-xs font-bold text-white">Sporpuan Onaylı Kurum</span>
                    </div>
                    <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                      Mavi Rozet
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    "Sporpuan kurumsal üyeliği ile aylık yeni müşteri kayıtlarımızda %35 oranında artış sağladık."
                  </p>
                  <div className="text-[10px] font-bold text-slate-400">
                    — İstanbul Marmara Spor Kompleksi Yönetimi
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* WHY JOIN SECTION (Neden Kurumsal Üye Olmalısınız?) */}
      <section id="why-join" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Kurumsal Ayrıcalıklar</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Neden Sporpuan Kurumsal Ailesine Katılmalısınız?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Sporseverlerin %88'i yeni bir tesise veya spor okuluna kaydolmadan önce bağımsız puanlama platformlarındaki yorumları ve doğrulama durumunu incelemektedir.
          </p>
        </div>

        {/* 6 Grid Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Doğrulanmış Mavi Rozet & Güvenilirlik
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tesisiniz için özel onaylı "Sporpuan Doğrulanmış Tesis" rozetini kazanın. Sporseverlere işletmenizin şeffaf ve güvenilir olduğu mesajını verin.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Yüksek Görünürlük & Doğrudan Müşteri
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Şehir, branş ve konum bazlı aramalarda öne çıkın. Potansiyel üyelerin doğrudan telefon, harita tarifi veya WhatsApp ile size ulaşmasını sağlayın.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Resmi Yanıt Hakkı & İtibar Yönetimi
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Kullanıcıların tesisiniz hakkında yaptığı tüm puanlama ve yorumlara kurumsal yetkili unvanınızla anında yanıt vererek müşteri ilişkilerinizi güçlendirin.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              HD Fotoğraf Galerisi & İmkân Vitrini
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tesisinizin spor alanlarını, soyunma odalarını, kafeteryasını ve ekipmanlarını yüksek çözünürlüklü fotoğraflarla vitrininizde sergileyin.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              5 Boyutlu Objektif Puan Raporları
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Temizlik, Hizmet Kalitesi, Ekipman Yeterliliği, Güvenlik ve Fiyat/Performans kategorilerindeki güçlü ve gelişime açık yönlerinizi görün.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              "Yılın En İyi Spor Tesisi" Ödül Adaylığı
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Yüksek ortalama puan elde eden kurumsal üyelerimiz, Sporpuan Yıllık Spor Ödülleri değerlendirmesinde doğrudan aday gösterilme hakkı kazanır.
            </p>
          </div>

        </div>
      </section>

      {/* LIVE FACILITY RATING & REVIEW WIDGET SHOWCASE */}
      <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Gelişmiş Tesis Değerlendirme Modülü</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Tesisinizin Sporpuan Sayfasında Yer Alacak Görsel Puan Kartı
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Sporpuan kurumsal üyeliği aldığınızda, tesisinizin profilinde üyelerin güvenini kazanan şeffaf puan halkaları, tavsiye yüzdesi ve doğrulanmış sporcu yorum kartları bu şekilde sergilenir.
            </p>
          </div>

          {/* VISUAL RATING WIDGET CONTAINER */}
          <div className="bg-[#f0f4f8] dark:bg-slate-850 rounded-[28px] p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-6 max-w-5xl mx-auto">
            
            {/* TOP ROW: Overall Score Bubble + Sub-criteria Rings + Percentage Rings */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/80">
              
              {/* Left: Speech Bubble Badge & Title */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-md">
                    9.1
                  </div>
                  <div className="absolute -bottom-1.5 left-4 w-4 h-4 bg-blue-600 rotate-45 rounded-xs" />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    Mükemmel
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    168 yorum
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-normal">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Son bir yıldaki yorum sayısı: <strong className="font-semibold text-slate-700 dark:text-slate-300">121</strong></span>
                  </div>
                </div>
              </div>

              {/* Middle & Right: Sub-criteria Rings & Percentage Rings */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full lg:w-auto justify-start lg:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-slate-800/80">
                
                {/* Sub-criteria items */}
                <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { label: 'Yemek', score: '8.9' },
                    { label: 'Oda / Tesis', score: '9.2' },
                    { label: 'Hizmet', score: '9.2' },
                    { label: 'Yüzme', score: '9.0' }
                  ].map((crit) => (
                    <div key={crit.label} className="flex flex-col items-center min-w-[55px]">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center block mb-1.5 whitespace-nowrap">
                        {crit.label}
                      </span>
                      <div className="w-11 h-11 rounded-full border-[2.5px] border-blue-500 bg-white dark:bg-slate-800 flex items-center justify-center font-extrabold text-xs text-slate-900 dark:text-white shadow-2xs">
                        {crit.score}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="w-[1px] h-10 bg-slate-300 dark:bg-slate-700 hidden sm:block shrink-0 mx-1" />

                {/* Percentage Rings */}
                <div className="flex items-center gap-4">
                  {/* Tavsiye */}
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center block mb-1.5 whitespace-nowrap">
                      Tavsiye
                    </span>
                    <div className="w-12 h-12 rounded-full border-[3px] border-blue-600 bg-blue-50/60 dark:bg-blue-950/60 flex items-center justify-center font-black text-xs text-blue-600 dark:text-blue-400 shadow-2xs">
                      %91
                    </div>
                  </div>

                  {/* Fiyat Performans */}
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center block mb-1.5 whitespace-nowrap">
                      Fiyat Performans
                    </span>
                    <div className="w-12 h-12 rounded-full border-[3px] border-amber-400 bg-amber-50/60 dark:bg-amber-950/60 flex items-center justify-center font-black text-xs text-amber-600 dark:text-amber-400 shadow-2xs">
                      %80
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* MIDDLE ROW: 3 FEATURED RECENT REVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xs border border-slate-100 dark:border-slate-700/80 flex flex-col justify-between min-h-[145px]">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
                      K*** Ö***
                    </span>
                    <div className="bg-sky-400 text-white font-bold text-[11px] px-3 py-1 rounded-l-full rounded-r-md flex items-center gap-1 shadow-2xs shrink-0">
                      <span>9.5</span>
                      <span>Mükemmel</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed mt-3.5 line-clamp-4">
                    Otel çalışanları güler yüzlü. Otel temizdi. İstediğim şey hızlı çözüm sağlandı. Geçen seneye göre deniz daha temizdi...
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xs border border-slate-100 dark:border-slate-700/80 flex flex-col justify-between min-h-[145px]">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
                      K*** O***
                    </span>
                    <div className="bg-sky-400 text-white font-bold text-[11px] px-3 py-1 rounded-l-full rounded-r-md flex items-center gap-1 shadow-2xs shrink-0">
                      <span>9.5</span>
                      <span>Mükemmel</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed mt-3.5 line-clamp-4">
                    Son anda aldığımız için biraz pahalıydı. Bayanlar bölümünde iskele olmaması eksiklik olarak değerlendirilebilir. Tertemiz ve yemekleri harika bir tesis....
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xs border border-slate-100 dark:border-slate-700/80 flex flex-col justify-between min-h-[145px]">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight">
                      M*** K***
                    </span>
                    <div className="bg-sky-400 text-white font-bold text-[11px] px-3 py-1 rounded-l-full rounded-r-md flex items-center gap-1 shadow-2xs shrink-0">
                      <span>9.5</span>
                      <span>Mükemmel</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed mt-3.5 line-clamp-4">
                    Tesiste her şey güzel olmasına rağmen doktor hizmetinin olduğuna dair bilgilendirmenin doğru olmadığı görülmüştür. Doktor odasında sadece bir...
                  </p>
                </div>
              </div>
            </div>

            {/* BOTTOM ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('application-form');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-full shadow-md shadow-blue-600/20 transition flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 fill-white text-white" />
                  <span>Örnek Yorum Yaz</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('application-form');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-full border border-slate-300 dark:border-slate-700 transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  <span>Tüm Yorumları Göster</span>
                </button>
              </div>

              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sporpuan Doğrulanmış Profil Güvencesi</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CORPORATE IMAGE SHOWCASE GRID */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Sistemdeki Seçkin Tesisler
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Kurumsal Üye Tesislerden Örnekler
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORPORATE_IMAGES.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-xl transition-all group flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img referrerPolicy="no-referrer"
                    src={item.image || undefined}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>{item.badge}</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {item.category}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                      {item.stats}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Tam Ekipman
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Aktif Profil
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* APPLICATION FORM SECTION */}
      <section id="application-form" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SUCCESS RECEIPT STATE */}
        {submissionSuccess ? (
          <div id="success-receipt" className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/40 p-8 sm:p-12 shadow-2xl text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                Başvurunuz Başarıyla Alındı
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Kurumsal Üyelik Başvurusu Alınmıştır!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                <strong className="text-slate-900 dark:text-white">{formData.facilityName}</strong> tesisiniz için yapılan kurumsal başvuru ön onay aşamasına geçmiştir.
              </p>
            </div>

            {/* Reference Box */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Başvuru Referans Kodu:</span>
                <span className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  {refCode}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span>Yetkili E-posta:</span>
                <span className="font-bold">{formData.contactEmail}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span>Kategori:</span>
                <span className="font-bold">{formData.category}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Kurumsal temsilcimiz 24 saat içerisinde yetkili telefon numaranız ({formData.contactPhone}) üzerinden sizinle iletişime geçerek doğrulama sürecini tamamlayacaktır.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setSubmissionSuccess(false);
                  setFormData(prev => ({ ...prev, facilityName: '' }));
                }}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md"
              >
                Yeni Başvuru Yap
              </button>
            </div>
          </div>
        ) : (
          /* REGULAR FORM CONTAINER */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 text-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-200 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-blue-300" />
                <span>Resmi Kayıt Formu</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                Kurumsal Üyelik & Tesis Kayıt Formu
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
                Aşağıdaki bilgileri eksiksiz doldurarak spor tesisinizin veya okulunuzun Sporpuan onaylı kurumsal kayıt sürecini başlatabilirsiniz.
              </p>
            </div>

            {!currentUser ? (
              <div id="login-required" className="p-8 sm:p-14 text-center space-y-6">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Kurumsal Üyelik Girişi Gereklidir
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    Kurumsal üyelik tesis kayıt formunu doldurabilmek için lütfen önce üye girişi yapınız veya yeni hesap oluşturunuz.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenAuthModal?.('corporate')}
                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-600/20 inline-flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Giriş Yap / Üye Ol</span>
                  </button>
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Hızlı Davetiye Talebi Oluştur</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Üye olmadan hızlıca davetiye talebi oluşturun, size ulaşıp süreci anlatalım.</p>
                  
                  {quickInviteSent ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl max-w-sm mx-auto border border-emerald-200 dark:border-emerald-800/50">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-xs font-bold">Talebiniz alındı! Size en kısa sürede ulaşacağız.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleQuickInviteSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                      <input
                        type="text"
                        placeholder="E-posta adresiniz veya Telefon numaranız"
                        value={quickInviteContact}
                        onChange={(e) => setQuickInviteContact(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isQuickInviteSubmitting}
                        className="w-full sm:w-auto px-6 py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-sm rounded-xl transition shadow-md whitespace-nowrap disabled:opacity-70"
                      >
                        {isQuickInviteSubmitting ? 'Gönderiliyor...' : 'Talep Et'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
              
              {/* SECTION 1: KURUM & TESİS BİLGİLERİ */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Kurum & Tesis Temel Bilgileri
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {getFacilityNameLabel(formData.category)} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.facilityName}
                      onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                      placeholder="Örn: Marmara Spor Kompleksi & Tenis Akademisi"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kurum Kategorisi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const newCat = e.target.value as SportsCategory;
                        const newCapacityOptions = getCapacityOptions(newCat);
                        setFormData({ 
                          ...formData, 
                          category: newCat,
                          capacity: newCapacityOptions[0], // Reset capacity to first valid option
                          amenities: [] // Reset amenities when category changes
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Spor Tesisleri">Spor Tesisleri (Stadyum, Kompleks, Saha)</option>
                      <option value="Spor Salonları">Spor Salonları (Fitness, Pilates, CrossFit)</option>
                      <option value="Spor Okulları">Spor Okulları & Akademiler (Basketbol, Futbol, Yüzme)</option>
                      <option value="Spor Etkinlikleri">Spor Organizasyonu / Turnuva Firması</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Şehir <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => {
                        const newCity = e.target.value;
                        const dists = getDistrictsByCity(newCity);
                        setFormData({ 
                          ...formData, 
                          city: newCity,
                          district: dists.length > 0 ? dists[0] : '' 
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {TURKEY_CITIES.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      İlçe / Semt <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">İlçe Seçiniz</option>
                      {getDistrictsByCity(formData.city).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Açık Adres Bilgisi
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Tesisin tam adresi ve ulaşım tüyoları..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* SECTION 2: YETKİLİ & İLETİŞİM BİLGİLERİ */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Yetkili Personel & İletişim Bilgileri
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Yetkili Adı Soyadı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Örn: Mehmet Özkan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Yetkili Görevi / Unvanı
                    </label>
                    <input
                      type="text"
                      value={formData.contactTitle}
                      onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                      placeholder="Örn: İşletme Sahibi, Tesis Müdürü, Başantrenör"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kurumsal E-posta Adresi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="iletisim@tesisiniz.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Telefon Numarası <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="0532 XXX XX XX"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Web Sitesi veya Sosyal Medya Sayfası
                    </label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.tesisiniz.com veya instagram adresi"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kapasite / Büyüklük
                    </label>
                    <select
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {getCapacityOptions(formData.category).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: TESİS İMKÂNLARI & GÖRSEL */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Sunulan Hizmetler & Tesis Görseli
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Sunulan Hizmetler & Özellikler
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {getAmenitiesList(formData.category).map((item) => {
                      const checked = formData.amenities.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAmenityToggle(item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                            checked
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                          }`}
                        >
                          {checked ? <Check className="w-3.5 h-3.5" /> : null}
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Tesis Kapak Görseli (16:9 Standart)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-2xl p-3 transition cursor-pointer text-center overflow-hidden flex flex-col items-center justify-center min-h-[150px] ${
                      isDraggingImage
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/80'
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    {isProcessingImage ? (
                      <div className="flex flex-col items-center justify-center text-blue-600">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="font-bold text-xs">Görsel İşleniyor...</span>
                      </div>
                    ) : formData.imageUrl && !formData.imageUrl.startsWith('https://images.unsplash.com') ? (
                      <div className="w-full space-y-2">
                        <div className="relative w-full aspect-[16/9] max-h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group shadow-sm">
                          <img referrerPolicy="no-referrer"
                            src={formData.imageUrl || undefined}
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
                    ) : (
                      <div className="flex flex-col items-center text-slate-500 dark:text-slate-400 p-4">
                        <Upload className="w-8 h-8 mb-2 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors" />
                        <span className="font-bold text-sm mb-1 text-slate-700 dark:text-slate-300">Görsel seçmek için tıklayın veya sürükleyin</span>
                        <span className="text-[11px]">PNG, JPG (Önerilen boyut: 1200x675px)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kısa Tanıtım Yazısı / Notunuz
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tesisiniz, verdiğiniz spor eğitimleri, uzmanlaştığınız branşlar veya üyelik avantajlarınız hakkında kısa bilgi..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Submit Disclaimer & Button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>
                    Kurumsal başvuru şartlarını ve KVKK aydınlatma metnini okudum, kabul ediyorum.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.acceptTerms}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-95 shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Başvuru Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kurumsal Başvuruyu Tamamla</span>
                    </>
                  )}
                </button>
              </div>

            </form>
            )}

          </div>
        )}

      </section>

      {/* FAQ SECTION */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Merak Edilenler
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Kurumsal Üyelik Sıkça Sorulan Sorular
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4 text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 pt-3 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

    </div>
  );
};
