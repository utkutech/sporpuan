import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Award, 
  Share2, 
  CheckCircle2, 
  Send, 
  Copy, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Check, 
  Layers, 
  Zap, 
  ArrowRight, 
  Clock, 
  ExternalLink, 
  Sparkles,
  MapPin,
  Gift,
  UserCheck,
  ChevronRight,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SportsCategory, UserProfile, CorporateApplication } from '../types';
import { TURKEY_CITIES, getDistrictsByCity } from '../data/turkeyLocations';
import { notifyRegistration } from '../lib/notifications';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CorporateInviteFormProps {
  currentUser?: UserProfile | null;
  onOpenAuthModal?: (mode?: 'default' | 'corporate') => void;
}

const COMMON_AMENITIES = [
  'Otopark',
  'Soyunma Odası & Dolap',
  'Kafeterya & Dinlenme Alanı',
  'Klima & İklimlendirme',
  'Yüksek Hızlı Wi-Fi',
  'Sıcak Su & Duşlar',
  'Uzman Antrenör / Eğitmen Desteği',
  'Çocuk Oyun & Bekleme Alanı',
  'Aydınlatmalı Saha / Kort',
  'Yüzme Havuzu / Spa',
  'Sauna & Buhar Odası',
  'Revir & İlk Yardım Hizmeti'
];

const DEFAULT_SAMPLE_IMAGES = [
  {
    label: 'Modern Fitness & Gym',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop'
  },
  {
    label: 'Kapalı Spor Arenası & Saha',
    url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop'
  },
  {
    label: 'Tenis Kortu & Kulüp Tesisleri',
    url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=1200&auto=format&fit=crop'
  },
  {
    label: 'Yüzme Havuzu & Su Sporları',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1200&auto=format&fit=crop'
  }
];

export const CorporateInviteForm: React.FC<CorporateInviteFormProps> = ({ currentUser, onOpenAuthModal }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL parameters for invite tracking
  const urlInviteCode = searchParams.get('inviteCode') || searchParams.get('ref') || searchParams.get('code') || '';
  const senderName = searchParams.get('sender') || '';
  const targetBusinessName = searchParams.get('for') || '';
  const targetPersonName = searchParams.get('person') || '';

  // Form State
  const [formData, setFormData] = useState({
    facilityName: targetBusinessName,
    category: 'Spor Tesisleri' as SportsCategory,
    city: 'İstanbul',
    district: 'Kadıköy',
    address: '',
    contactName: targetPersonName || currentUser?.name || '',
    contactTitle: 'Tesis Yöneticisi / Sahibi',
    contactEmail: currentUser?.email || '',
    contactPhone: '',
    website: '',
    taxOffice: '',
    taxNumber: '',
    capacity: '',
    amenities: ['Otopark', 'Soyunma Odası & Dolap', 'Sıcak Su & Duşlar', 'Klima & İklimlendirme'] as string[],
    imageUrl: DEFAULT_SAMPLE_IMAGES[0].url,
    description: '',
    inviteCode: urlInviteCode
  });

  const [availableDistricts, setAvailableDistricts] = useState<string[]>(getDistrictsByCity('İstanbul'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedRefCode, setSubmittedRefCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState(1);

  // Update districts when city changes
  useEffect(() => {
    const dists = getDistrictsByCity(formData.city);
    setAvailableDistricts(dists);
    if (dists.length > 0 && !dists.includes(formData.district)) {
      setFormData(prev => ({ ...prev, district: dists[0] }));
    }
  }, [formData.city]);

  // Keep invite code synced if URL changes
  useEffect(() => {
    if (urlInviteCode) {
      setFormData(prev => ({ ...prev, inviteCode: urlInviteCode }));
    }
  }, [urlInviteCode]);

  // Handle amenity checkbox toggles
  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists 
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = () => {
    setErrorMessage('');
    if (step === 1) {
      if (!formData.facilityName.trim()) {
        setErrorMessage('Lütfen işletme / tesis adınızı girin.');
        return;
      }
    } else if (step === 2) {
      if (!formData.contactName.trim()) {
        setErrorMessage('Lütfen yetkili ad soyad bilgisini girin.');
        return;
      }
      if (!formData.contactPhone.trim()) {
        setErrorMessage('Lütfen iletişim telefon numaranızı girin.');
        return;
      }
      if (!formData.contactEmail.trim()) {
        setErrorMessage('Lütfen iletişim e-posta adresinizi girin.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.facilityName.trim()) {
      setErrorMessage('Lütfen işletme / tesis adınızı girin.');
      return;
    }
    if (!formData.contactName.trim()) {
      setErrorMessage('Lütfen yetkili ad soyad bilgisini girin.');
      return;
    }
    if (!formData.contactPhone.trim()) {
      setErrorMessage('Lütfen iletişim telefon numaranızı girin.');
      return;
    }
    if (!formData.contactEmail.trim()) {
      setErrorMessage('Lütfen iletişim e-posta adresinizi girin.');
      return;
    }

    setIsSubmitting(true);

    const generatedCode = 'SP-KUR-' + Math.floor(100000 + Math.random() * 900000);

    const newApp: CorporateApplication = {
      id: generatedCode,
      refCode: generatedCode,
      facilityName: formData.facilityName.trim(),
      category: formData.category,
      city: formData.city,
      district: formData.district || 'Merkez',
      address: formData.address.trim(),
      contactName: formData.contactName.trim(),
      contactTitle: formData.contactTitle.trim() || 'Tesis Sahibi / Yetkili',
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      website: formData.website.trim(),
      taxOffice: formData.taxOffice.trim(),
      taxNumber: formData.taxNumber.trim(),
      capacity: formData.capacity.trim(),
      amenities: formData.amenities,
      imageUrl: formData.imageUrl || DEFAULT_SAMPLE_IMAGES[0].url,
      description: formData.description.trim(),
      adminNotes: formData.inviteCode ? `Davet Kodu İle Başvurdu: ${formData.inviteCode}` : '',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      // 1. Save to Firestore `corporate_applications`
      await setDoc(doc(db, 'corporate_applications', generatedCode), newApp);
      await notifyRegistration('kurumsal', newApp.contactName, newApp.contactEmail);
    } catch (err) {
      console.warn("Firestore save warning, backing up locally:", err);
    }

    // 2. Backup to LocalStorage
    try {
      const savedApps = localStorage.getItem('sporpuan_corporate_applications');
      const appsList: CorporateApplication[] = savedApps ? JSON.parse(savedApps) : [];
      appsList.unshift(newApp);
      localStorage.setItem('sporpuan_corporate_applications', JSON.stringify(appsList));
    } catch (err) {
      console.error("LocalStorage save error:", err);
    }

    setSubmittedRefCode(generatedCode);
    setIsSubmitting(false);
    setSubmissionSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* BREADCRUMB / TOP NAVIGATION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/" className="hover:text-blue-400 transition">Anasayfa</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <Link to="/kurumsal" className="hover:text-blue-400 transition">Kurumsal</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-blue-400 font-semibold">Kurumsal Davet Formu</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link to="/kurumsal"
              className="w-full sm:w-auto justify-center hover:text-blue-300 font-mono text-[11px] bg-slate-800 border border-slate-700 px-3 py-2 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1.5 transition"
            >
              <Building2 className="w-3 h-3 text-blue-400" />
              <span>Kurumsal Bilgi Sayfası</span>
            </Link>
          </div>
        </div>

        {/* HERO TITLE HEADER */}
        <div className="bg-gradient-to-r from-blue-900/80 via-slate-900 to-indigo-950 border border-blue-800/60 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wide uppercase">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Sporpuan Onaylı Tesis & Organizatör Ağı</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Hızlı Kurumsal Üyelik & Davet Başvuru Formu
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Spor tesisinizi, salonunuzu, okulunuzu veya organizatör kimliğinizi Sporpuan sistemine ekleyin. Doğrulanmış kurumsal profil rozetinizi alarak binlerce aktif spor severe hemen ulaşın.
            </p>

            {/* INVITATION CODE BADGE NOTICE (If present in URL) */}
            {urlInviteCode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mt-4 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-start gap-3 shadow-lg"
              >
                <div className="text-xs sm:text-sm space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-2">
                    <span>{targetBusinessName ? `${targetBusinessName} için Özel Davetiye!` : 'Özel Davetiye İle Bağlandınız!'}</span>
                    <span className="font-mono bg-amber-950/80 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-xs font-extrabold">
                      {urlInviteCode}
                    </span>
                  </div>
                  <p className="text-amber-200/90 leading-relaxed">
                    {senderName ? `${senderName} tarafından gönderilen ` : ''}özel davetiyeniz sayesinde kurumsal üyelik başvurunuz öncelikli doğrulama kuyruğuna alınacaktır.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ACTIONS BAR */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {currentUser?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Yönetim Paneline Git</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* SUCCESS RECEIPT / SCREEN */}
        {submissionSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 border border-emerald-500/50 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-extrabold">Başvurunuz Başarıyla Alındı</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Teşekkür Ederiz, {formData.contactName}!
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-white">{formData.facilityName}</strong> kurumsal üyelik talebiniz sisteme başarıyla kaydedildi. Sporpuan doğrulama ekibi 24 saat içerisinde sizinle iletişime geçecektir.
              </p>
            </div>

            {/* Reference Number Box */}
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md mx-auto space-y-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Kurumsal Başvuru Referans Kodunuz</span>
              <div className="text-2xl sm:text-3xl font-mono font-black text-blue-400 tracking-wider">
                {submittedRefCode}
              </div>
              <p className="text-[11px] text-slate-400">
                Bu kodu saklayınız. Destek ve durum sorgulamalarınızda kullanabilirsiniz.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => {
                  setSubmissionSuccess(false);
                  setFormData(prev => ({
                    ...prev,
                    facilityName: '',
                    contactPhone: '',
                    taxOffice: '',
                    taxNumber: '',
                    description: ''
                  }));
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold text-xs rounded-xl transition"
              >
                Yeni Başvuru Yap
              </button>

              <Link
                to="/"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg"
              >
                Sporpuan Anasayfasına Dön
              </Link>

              {currentUser?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Yönetim Panelinde İncele
                </Link>
              )}
            </div>
          </motion.div>
        ) : (

          /* MAIN FORM CARD */
          <form onSubmit={handleSubmit} className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl">
            
            {/* Error Message Box */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: TESİS & İŞLETME BİLGİLERİ */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="border-b border-slate-700 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black shrink-0">1</span>
                    <span>Adım 1: Tesis & İşletme Bilgileri</span>
                  </h3>
                  <span className="text-[11px] text-rose-400 font-medium whitespace-nowrap">* Zorunlu alanlar</span>
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Tesis Adı */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    İşletme / Tesis / Firma Adı <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Olimpia Halı Saha & Spor Kompleksi"
                    value={formData.facilityName}
                    onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hizmet Türü / Kategori <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as SportsCategory })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Spor Tesisleri">Spor Tesisleri (Halı Saha, Kort, Havuz vb.)</option>
                    <option value="Spor Salonları">Spor Salonları (Fitness, Gym, Pilates)</option>
                    <option value="Spor Okulları">Spor Okulları & Akademileri</option>
                    <option value="Spor Etkinlikleri">Spor Etkinlik Organizatörü</option>
                  </select>
                </div>

                {/* Şehir */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Şehir (İl) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {TURKEY_CITIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* İlçe */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    İlçe <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {availableDistricts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Açık Adres */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Açık Adres / Adres Özeti
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Atatürk Mah. Spor Cad. No: 45"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Tesis Kapasitesi / Alan Özellikleri */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tesis Kapasitesi / Alan Bilgisi
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: 2 Adet Açık Halı Saha, 1 Adet Kapalı Isıtmalı Saha, 500 Kişilik Tribün"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

              </div>
            </motion.div>
            )}

            {/* STEP 2: YETKİLİ İLETİŞİM BİLGİLERİ */}
            {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="border-b border-slate-700 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black shrink-0">2</span>
                  <span>Adım 2: Yetkili İletişim Bilgileri</span>
                </h3>
                <span className="text-[11px] text-rose-400 font-medium whitespace-nowrap">* Zorunlu alanlar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Yetkili Ad Soyad */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Yetkili Adı ve Soyadı <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Unvan / Görev */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Görev / Unvan
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Tesis Sahibi / İşletme Yöneticisi"
                    value={formData.contactTitle}
                    onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Telefon Numarası */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    İletişim Telefon Numarası <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Örn: 0532 123 45 67 veya 0216 850 19 07"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* E-posta Adresi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kurumsal / Yetkili E-posta <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Örn: kurumsal@tesisiniz.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Web Sitesi / Sosyal Medya */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Web Sitesi veya Sosyal Medya Sayfası (Instagram / Facebook / Google Maps)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: https://instagram.com/tesisiniz veya www.tesisiniz.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

              </div>
            </motion.div>
            )}

            {/* STEP 3: DOĞRULAMA & İMKANLAR */}
            {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="border-b border-slate-700 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-black shrink-0">3</span>
                  <span>Adım 3: Doğrulama & Tesis Özellikleri</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Vergi Dairesi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vergi Dairesi (Mavi Tık Doğrulama İçin Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Kadıköy Vergi Dairesi"
                    value={formData.taxOffice}
                    onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Vergi Numarası */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vergi Kimlik No / T.C. (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: 1234567890"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Davet Kodu (Otomatik Doldurulur) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Davet Kodu / Referans Kodu (Eğer Varsa)
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: SP-INV-2026-X89"
                    value={formData.inviteCode}
                    onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-amber-300 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

              </div>

              {/* Tesis Sunulan Ek İmkanlar Checkbox Grid */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-200 mb-2">
                  Tesisinizin Sunmuş Olduğu Özellikler & Hizmetler:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {COMMON_AMENITIES.map((amenity) => {
                    const isChecked = formData.amenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => handleAmenityToggle(amenity)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition ${
                          isChecked 
                            ? 'bg-blue-600/20 border-blue-500 text-blue-200' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">{amenity}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isChecked ? 'bg-blue-600 text-white' : 'border border-slate-600'}`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tesis Kapak Görsel Seçimi (Image Upload) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-200 mb-2">
                  Tesis Kapak Fotoğrafı Seçimi (Görsel Yükle):
                </label>
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DEFAULT_SAMPLE_IMAGES.map((img, idx) => {
                    const isSelected = formData.imageUrl === img.url;
                    return (
                      <div
                        key={idx}
                        onClick={() => setFormData({ ...formData, imageUrl: img.url })}
                        className={`cursor-pointer rounded-2xl overflow-hidden border-2 relative transition group ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <img referrerPolicy="no-referrer" 
                          src={img.url || undefined} 
                          alt={img.label} 
                          className="w-full h-24 object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1200&auto=format&fit=crop';
                          }} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent p-2 flex items-end">
                          <span className="text-[10px] font-bold text-white leading-tight">{img.label}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white rounded-full p-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Açıklama / Ek Notlar */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tesis Tanıtım Notları veya Ek Açıklama
                </label>
                <textarea
                  rows={3}
                  placeholder="Tesisiniz hakkında detay vermek istediğiniz hususları, çalışma saatlerinizi veya üyelik fiyat aralıklarınızı yazabilirsiniz..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </motion.div>
            )}

            {/* BUTTONS */}
            <div className="pt-4 border-t border-slate-700 flex flex-col-reverse sm:flex-row items-center justify-between gap-6 sm:gap-4">
              <div className="text-xs text-slate-400 space-y-1 w-full sm:w-auto text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Ücretsiz Kurumsal İnceleme Süreci</span>
                </div>
                <p>Gönderilen veriler gizlilik politikası çerçevesinde değerlendirilir.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 sm:flex-none px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm rounded-xl transition duration-200"
                  >
                    Geri
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    <span>İleri</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4.5 h-4.5" />
                        <span>Başvuruyu Gönder</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </form>
        )}

        {/* FOOTER INFO CARD */}
        <div className="bg-slate-800/60 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-200">Sporpuan Kurumsal Müşteri Hizmetleri</div>
              <div>Sorularınız ve doğrudan kurumsal ortaklıklar için: <a href="tel:02168501907" className="text-blue-400 hover:underline font-bold">0216 850 19 07</a></div>
            </div>
          </div>

          <Link
            to="/kurumsal"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-bold transition whitespace-nowrap"
          >
            Kurumsal Detay Sayfası →
          </Link>
        </div>

      </div>
    </div>
  );
};
