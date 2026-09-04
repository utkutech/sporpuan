import { Avatar } from './Avatar';
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile, SportsEvent, UserRole, Review, CorporateApplication, SportsCategory, FacilitySuggestion } from '../types';
import { db } from '../lib/firebase';
import * as XLSX from 'xlsx';
import { INITIAL_CORPORATE_APPS } from '../data/mockEvents';
import { detectCategory, getEventDetailUrl } from '../lib/categoryUtils';
import { TURKEY_CITIES } from '../data/turkeyLocations';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { 
  Users, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Search, 
  Edit3, 
  Trash2, 
  CalendarDays, 
  LayoutDashboard, 
  Star, 
  Trophy, 
  MessageSquare,
  Building2,
  CheckCircle2,
  XCircle,
  Phone,
  Globe,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Check,
  X,
  FileText,
  MessageSquarePlus,
  BadgeCheck,
  RotateCcw,
  Plus,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  Award,
  Copy,
  Zap,
  RefreshCw,
  ExternalLink,
  Download
} from 'lucide-react';
import { calculateOverallScore, CATEGORY_CRITERIA_MAP, getCriterionScore } from '../lib/scoreUtils';

interface AdminPanelProps {
  events: SportsEvent[];
  onDeleteEvent: (id: string) => void;
  onEditEvent: (event: SportsEvent) => void;
  onUpdateEvent: (event: SportsEvent) => void;
  onAddEvent: (event: SportsEvent) => void;
  onUpdateEventsBatch?: (events: SportsEvent[]) => void;
}

const COMMON_AMENITIES = [
  'Otopark',
  'Soyunma Odası',
  'Kafeterya',
  'Klima & Havalandırma',
  'Wi-Fi',
  'Duş & Sıcak Su',
  'Antrenör / Eğitmen Desteği',
  'Çocuk Oyun Alanı',
  'Ekipman Kiralama',
  'Aydınlatmalı Saha / Salon',
  'Yüzme Havuzu',
  'Sauna & Buhar Odası',
  'Revir & İlk Yardım'
];

const SPORTS_BRANCHES = [
  'Futbol',
  'Basketbol',
  'Voleybol',
  'Tenis',
  'Yüzme',
  'Fitness & GYM',
  'Pilates & Yoga',
  'Dövüş Sporları',
  'Cimnastik',
  'Okçuluk',
  'Atletizm',
  'Masa Tenisi',
  'Squash',
  'Su Sporları',
  'Kış Sporları'
];

function parseReviewDateToTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const str = dateStr.trim();
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.getTime();

  const lower = str.toLowerCase();
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  if (lower.includes('gün önce') || lower.includes('gun once')) {
    const match = lower.match(/\d+/);
    const days = match ? parseInt(match[0], 10) : 1;
    return now - days * DAY_MS;
  }
  if (lower.includes('hafta önce') || lower.includes('hafta once')) {
    const match = lower.match(/\d+/);
    const weeks = match ? parseInt(match[0], 10) : 1;
    return now - weeks * 7 * DAY_MS;
  }
  if (lower.includes('ay önce') || lower.includes('ay once')) {
    const match = lower.match(/\d+/);
    const months = match ? parseInt(match[0], 10) : 1;
    return now - months * 30 * DAY_MS;
  }
  if (lower.includes('yıl önce') || lower.includes('yil once')) {
    const match = lower.match(/\d+/);
    const years = match ? parseInt(match[0], 10) : 1;
    return now - years * 365 * DAY_MS;
  }

  const trMonths: { [key: string]: number } = {
    ocak: 0, şubat: 1, mart: 2, nisan: 3, mayıs: 4, haziran: 5,
    temmuz: 6, ağustos: 7, eylül: 8, ekim: 9, kasım: 10, aralık: 11
  };
  const parts = lower.split(' ');
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthName = parts[1];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(year) && trMonths[monthName] !== undefined) {
      return new Date(year, trMonths[monthName], day).getTime();
    }
  }

  return 0;
}

function formatAdminReviewDate(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === '' || dateStr === 'undefined') {
    return '15 Mayıs 2026';
  }

  const str = dateStr.trim();
  
  // Try ISO or standard JS Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  if (str.toLowerCase() === 'google yorumu') {
    return 'Google Yorumu (2026)';
  }

  return str;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ events, onDeleteEvent, onEditEvent, onUpdateEvent, onAddEvent, onUpdateEventsBatch }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'reviews' | 'corporate' | 'invite-requests' | 'import' | 'suggestions'>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [corporateApps, setCorporateApps] = useState<CorporateApplication[]>([]);
  const [inviteRequests, setInviteRequests] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<FacilitySuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<FacilitySuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSearchTerm, setImportSearchTerm] = useState('İstanbul spor tesisleri');
  const [customApiKey, setCustomApiKey] = useState('');
  const [importResultMsg, setImportResultMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
  const [importedList, setImportedList] = useState<any[]>([]);

  // Sync Firebase Facilities to Site State
  const [syncingFirebase, setSyncingFirebase] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  // Refresh Existing Facilities with Google Maps Photos & Reviews
  const [refreshingFacilities, setRefreshingFacilities] = useState(false);
  const [refreshResultMsg, setRefreshResultMsg] = useState<string | null>(null);

  // Translate existing reviews with Gemini AI
  const [translatingReviews, setTranslatingReviews] = useState(false);
  const [translateResultMsg, setTranslateResultMsg] = useState<string | null>(null);

  // Partner / Event Filters
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');
  const [eventCityFilter, setEventCityFilter] = useState('all');
  const [eventDistrictFilter, setEventDistrictFilter] = useState('all');
  const [eventBranchFilter, setEventBranchFilter] = useState('all');

  // Filters
  const [corporateFilter, setCorporateFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'published' | 'pending' | 'hidden'>('all');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');

  const availableDistricts = useMemo(() => {
    if (eventCityFilter === 'all') return [];
    const cityObj = TURKEY_CITIES.find(c => c.name.toLowerCase() === eventCityFilter.toLowerCase());
    return cityObj ? cityObj.districts : [];
  }, [eventCityFilter]);

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const searchLower = eventSearchQuery.toLowerCase();
      const matchSearch = !eventSearchQuery || 
                          ev.title.toLowerCase().includes(searchLower) || 
                          ev.city.toLowerCase().includes(searchLower) ||
                          ev.venue.toLowerCase().includes(searchLower) ||
                          (ev.organizer && ev.organizer.toLowerCase().includes(searchLower));

      const matchCategory = eventCategoryFilter === 'all' || ev.category === eventCategoryFilter;
      const matchStatus = eventStatusFilter === 'all' || 
                          (eventStatusFilter === 'active' && ev.isActive !== false) ||
                          (eventStatusFilter === 'hidden' && ev.isActive === false);

      const matchCity = eventCityFilter === 'all' || 
                        ev.city.toLowerCase() === eventCityFilter.toLowerCase() ||
                        ev.venue.toLowerCase().includes(eventCityFilter.toLowerCase());

      const matchDistrict = eventDistrictFilter === 'all' || 
                            ev.venue.toLowerCase().includes(eventDistrictFilter.toLowerCase()) ||
                            ev.description.toLowerCase().includes(eventDistrictFilter.toLowerCase()) ||
                            (ev.tags && ev.tags.some(t => t.toLowerCase().includes(eventDistrictFilter.toLowerCase())));

      const matchBranch = eventBranchFilter === 'all' || 
                          ev.title.toLowerCase().includes(eventBranchFilter.toLowerCase()) ||
                          ev.category.toLowerCase().includes(eventBranchFilter.toLowerCase()) ||
                          ev.description.toLowerCase().includes(eventBranchFilter.toLowerCase()) ||
                          (ev.tags && ev.tags.some(t => t.toLowerCase().includes(eventBranchFilter.toLowerCase())));

      return matchSearch && matchCategory && matchStatus && matchCity && matchDistrict && matchBranch;
    });
  }, [events, eventSearchQuery, eventCategoryFilter, eventStatusFilter, eventCityFilter, eventDistrictFilter, eventBranchFilter]);

  const allReviews = useMemo(() => {
    const list: (Review & { eventTitle: string; eventId: string })[] = [];
    events.forEach(ev => {
      ev.reviews.forEach(rev => {
        list.push({ ...rev, eventTitle: ev.title, eventId: ev.id });
      });
    });
    list.sort((a, b) => parseReviewDateToTimestamp(b.date) - parseReviewDateToTimestamp(a.date));
    return list;
  }, [events]);




  const filteredReviews = useMemo(() => {
    return allReviews.filter(rev => {
      const matchSearch = rev.userName.toLowerCase().includes(reviewSearchQuery.toLowerCase()) || 
                          rev.eventTitle.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
                          rev.comment.toLowerCase().includes(reviewSearchQuery.toLowerCase());
      const matchStatus = reviewFilter === 'all' || 
                          (reviewFilter === 'published' && rev.status !== 'hidden') ||
                          (reviewFilter === 'hidden' && rev.status === 'hidden');
      return matchSearch && matchStatus;
    });
  }, [allReviews, reviewSearchQuery, reviewFilter]);


  // Modals state
  const [selectedAppDetail, setSelectedAppDetail] = useState<CorporateApplication | null>(null);
  const [editingApp, setEditingApp] = useState<CorporateApplication | null>(null);
  const [selectedReviewDetail, setSelectedReviewDetail] = useState<{ review: Review; event: SportsEvent } | null>(null);
  const [replyingReview, setReplyingReview] = useState<{ review: Review; event: SportsEvent } | null>(null);
  const [editingReview, setEditingReview] = useState<{ review: Review; event: SportsEvent } | null>(null);

  // Form states
  const [replyText, setReplyText] = useState('');
  const [inviteTargetName, setInviteTargetName] = useState('');
  const [invitePersonName, setInvitePersonName] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Custom Confirm/Prompt Dialog States
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    message: string;
    defaultValue: string;
    onConfirm: (val: string) => void;
  } | null>(null);

  // Generate Invite Link function
  const handleGenerateInviteLink = () => {
    const randomCode = 'SP-INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const baseUrl = window.location.origin + '/kurumsal-davet-formu';
    const params = new URLSearchParams();
    params.set('inviteCode', randomCode);
    params.set('sender', 'Yönetici Ekibi');
    if (inviteTargetName.trim()) {
      params.set('for', inviteTargetName.trim());
    }
    if (invitePersonName.trim()) {
      params.set('person', invitePersonName.trim());
    }

    const fullUrl = `${baseUrl}?${params.toString()}`;
    setGeneratedInviteLink(fullUrl);
  };

  const handleShareWhatsApp = () => {
    const text = `Merhaba${invitePersonName ? ' ' + invitePersonName : ''},

${inviteTargetName ? inviteTargetName + ' tesisinizi ' : 'Tesisinizi '}Türkiye'nin Spor Değerlendirme ve İnceleme Platformuna eklemek için özel davetiyeniz oluşturuldu. Aşağıdaki bağlantıya tıklayarak kurumsal başvurunuzu tamamlayabilir ve tesisinizi hemen yayınlayabilirsiniz:

${generatedInviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Sporpuan Kurumsal Davetiyesi${inviteTargetName ? ' - ' + inviteTargetName : ''}`;
    const body = `Merhaba${invitePersonName ? ' ' + invitePersonName : ''},

${inviteTargetName ? inviteTargetName + ' tesisinizi ' : 'Tesisinizi '}Türkiye'nin Spor Değerlendirme ve İnceleme Platformuna eklemek için özel davetiyeniz oluşturuldu.

Aşağıdaki bağlantıya tıklayarak kurumsal başvurunuzu tamamlayabilir ve tesisinizi hemen yayınlayabilirsiniz:

${generatedInviteLink}

İyi çalışmalar,
Sporpuan Yönetimi`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleCopyGeneratedLink = async () => {
    if (!generatedInviteLink) handleGenerateInviteLink();
    const targetLink = generatedInviteLink || `${window.location.origin}/kurumsal-davet-formu?inviteCode=SP-ADMIN-2026`;
    
    try {
      await navigator.clipboard.writeText(targetLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'corporate_applications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps: CorporateApplication[] = [];
      snapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as CorporateApplication);
      });
      try {
        const localSaved = localStorage.getItem('sporpuan_corporate_applications');
        if (localSaved) {
          const localApps: CorporateApplication[] = JSON.parse(localSaved);
          localApps.forEach(localApp => {
            if (!apps.some(a => a.id === localApp.id)) {
              apps.push(localApp);
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
      if (apps.length === 0) {
        setCorporateApps(INITIAL_CORPORATE_APPS);
      } else {
        setCorporateApps(apps);
      }
    }, (error) => {
      console.warn("Firestore corporate applications error:", error);
      try {
        const localSaved = localStorage.getItem('sporpuan_corporate_applications');
        if (localSaved) {
          setCorporateApps(JSON.parse(localSaved));
        } else {
          setCorporateApps(INITIAL_CORPORATE_APPS);
        }
      } catch (e) {
        setCorporateApps(INITIAL_CORPORATE_APPS);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'facility_suggestions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: FacilitySuggestion[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as FacilitySuggestion);
      });
      setSuggestions(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore users listener error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveCorporateAppToStorageAndState = async (updatedApp: CorporateApplication) => {
    setCorporateApps(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));
    try {
      await setDoc(doc(db, 'corporate_applications', updatedApp.id), updatedApp, { merge: true });
    } catch (e) {
      console.warn("Firestore application update warning:", e);
    }
    try {
      const localSaved = localStorage.getItem('sporpuan_corporate_applications');
      const localApps: CorporateApplication[] = localSaved ? JSON.parse(localSaved) : [];
      const index = localApps.findIndex(a => a.id === updatedApp.id);
      if (index >= 0) {
        localApps[index] = updatedApp;
      } else {
        localApps.unshift(updatedApp);
      }
      localStorage.setItem('sporpuan_corporate_applications', JSON.stringify(localApps));
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveCorporateApp = (app: CorporateApplication) => {
    setConfirmDialog({
      isOpen: true,
      message: `"${app.facilityName}" başvurusunu onaylayıp tesisi sisteme eklemek/yayınlamak istiyor musunuz?`,
      onConfirm: async () => {
        const approvedApp: CorporateApplication = { ...app, status: 'approved' };
        await saveCorporateAppToStorageAndState(approvedApp);
        
        const existingFacility = events.find(e => e.id === app.publishedFacilityId || e.title.toLowerCase() === app.facilityName.toLowerCase());
        const facilityId = existingFacility ? existingFacility.id : ('facility-' + Date.now());
        const publishedFacility: SportsEvent = {
          id: facilityId,
          title: app.facilityName,
          slug: app.facilityName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          category: app.category as any,
          city: app.city,
          venue: `${app.district}, ${app.city}` + (app.address ? ` (${app.address})` : ''),
          date: app.workingHours ? `Açık (${app.workingHours})` : 'Sürekli Açık (Tesis / Akademi)',
          time: app.workingHours || '08:00 - 23:00',
          organizer: `${app.facilityName} (${app.contactName})`,
          organizerVerified: true,
          image: app.imageUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
          description: app.description || `${app.facilityName} - Sporpuan Kurumsal Doğrulanmış Tesis`,
          ticketPriceRange: app.membershipFeeRange || 'Kurumsal Tesis Üyeliği',
          ticketUrl: app.website || '',
          overallScore: existingFacility ? existingFacility.overallScore : 9.0,
          ratingBreakdown: existingFacility ? existingFacility.ratingBreakdown : {
            'zeminSaha': 9.0, 'soyunmaHijyen': 9.2, 'ekipmanAydinlatma': 8.8, 'ulasimOtopark': 8.5, 'fiyatHizmet': 8.7
          },
          reviewCount: existingFacility ? existingFacility.reviewCount : 1,
          featured: true,
          tags: ['Doğrulanmış Tesis', 'Mavi Rozet', ...(app.amenities || [])],
          reviews: existingFacility ? existingFacility.reviews : [
            {
              id: 'rev-init-' + Date.now(),
              userName: 'Sporpuan Editoryal',
              verifiedAttendee: true,
              date: new Date().toLocaleDateString('tr-TR'),
              overallScore: 9.0,
              scores: { 'zeminSaha': 9.0, 'soyunmaHijyen': 9.2, 'ekipmanAydinlatma': 8.8, 'ulasimOtopark': 8.5, 'fiyatHizmet': 8.7 } as any,
              comment: 'Kurumsal doğrulama süreci ve belge incelemeleri tamamlanmış, mavi rozet almış onaylı spor tesisimiz.',
              pros: ['Kurumsal Onaylı', 'Gelişmiş Ekipman & Hijyen'],
              cons: [],
              likes: 8,
              tags: ['Mavi Rozet', 'Resmi Onaylı'],
              status: 'published'
            }
          ],
          latitude: existingFacility ? existingFacility.latitude : 41.0,
          longitude: existingFacility ? existingFacility.longitude : 29.0
        };

        approvedApp.publishedFacilityId = facilityId;
        await saveCorporateAppToStorageAndState(approvedApp);

        if (existingFacility) {
          onUpdateEvent(publishedFacility);
        } else {
          onAddEvent(publishedFacility);
        }
      }
    });
  };

  const handleSuspendCorporateApp = (app: CorporateApplication) => {
    setConfirmDialog({
      isOpen: true,
      message: `"${app.facilityName}" tesisini pasife alıp yayından kaldırmak istediğinize emin misiniz?`,
      onConfirm: async () => {
        const suspendedApp: CorporateApplication = { ...app, status: 'suspended' };
        await saveCorporateAppToStorageAndState(suspendedApp);
      }
    });
  };

  const handleRejectCorporateApp = (app: CorporateApplication) => {
    setPromptDialog({
      isOpen: true,
      message: "Başvuruyu reddetme gerekçeniz (Opsiyonel):",
      defaultValue: "Gerekli kurumsal belgeler veya iletişim bilgileri doğrulanamadı.",
      onConfirm: async (reason: string) => {
        const rejectedApp: CorporateApplication = {
          ...app,
          status: 'rejected',
          adminNotes: reason ? `Red gerekçesi: ${reason}` : app.adminNotes
        };
        await saveCorporateAppToStorageAndState(rejectedApp);
      }
    });
  };

  const handleDeleteCorporateApp = (app: CorporateApplication) => {
    setConfirmDialog({
      isOpen: true,
      message: `"${app.facilityName}" başvurusunu TAMAMEN silmek istediğinize emin misiniz?`,
      onConfirm: async () => {
        setCorporateApps(prev => prev.filter(a => a.id !== app.id));
        try {
          await deleteDoc(doc(db, 'corporate_applications', app.id));
        } catch (e) {
          console.warn("Firestore application delete warning:", e);
        }
        try {
          const localSaved = localStorage.getItem('sporpuan_corporate_applications');
          const localApps: CorporateApplication[] = localSaved ? JSON.parse(localSaved) : [];
          const updatedApps = localApps.filter(a => a.id !== app.id);
          localStorage.setItem('sporpuan_corporate_applications', JSON.stringify(updatedApps));
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  
  const handleExportEvents = () => {
    const data = filteredEvents.map(ev => ({
      'ID': ev.id,
      'Tesis Adı': ev.title,
      'Kategori': ev.category,
      'Şehir': ev.city,
      'İlçe': ev.district,
      'Tesis Puanı (Rating)': ev.rating,
      'Yorum Sayısı': ev.reviewCount,
      'Adres': ev.location,
      'Telefon': ev.phone || '',
      'Durum': ev.isActive === false ? 'Pasif' : 'Aktif'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Partnerler');
    XLSX.writeFile(workbook, 'Partnerler.xlsx');
  };

  const handleExportReviews = () => {
    const data = filteredReviews.map(rev => ({
      'ID': rev.id,
      'Tarih': formatAdminReviewDate(rev.date),
      'Kullanıcı': rev.userName,
      'Tesis Adı': rev.eventTitle,
      'Puan': rev.rating || rev.overallScore,
      'Yorum': rev.comment,
      'Durum': rev.status === 'hidden' ? 'Gizli' : (rev.status === 'approved' ? 'Onaylı' : 'Bekliyor')
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Degerlendirmeler');
    XLSX.writeFile(workbook, 'Degerlendirmeler.xlsx');
  };

  const handleSyncFirebaseFacilitiesToSite = async () => {
    setSyncingFirebase(true);
    setSyncResultMsg(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'facilities'));
      if (querySnapshot.empty) {
        setSyncResultMsg('⚠️ Firestore veritabanında henüz kayıtlı tesis bulunamadı.');
        return;
      }

      let addedCount = 0;
      let updatedCount = 0;
      const existingIds = new Set(events.map(e => e.id));

      const defaultFacilityImages = [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1200&auto=format&fit=crop'
      ];

      const syncedList: SportsEvent[] = [];

      querySnapshot.docs.forEach((docSnap, idx) => {
        const data = docSnap.data();
        const facilityName = data.name || data.title || 'Spor Tesisi';
        const address = data.address || data.formattedAddress || '';
        
        let city = 'İstanbul';
        const knownCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Kocaeli', 'Mersin', 'Eskişehir', 'Samsun', 'Trabzon', 'Kayseri'];
        for (const c of knownCities) {
          if (address.toLowerCase().includes(c.toLowerCase())) {
            city = c;
            break;
          }
        }

        const image = data.image || null;
        const detectedCategory = detectCategory(facilityName, "", address, data.category); let finalImage = image; if (!image) { const idHash = Array.from(docSnap.id).reduce((acc, char) => acc + char.charCodeAt(0), 0); if (detectedCategory === "Spor Salonları") { const images = ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1470&auto=format&fit=crop']; finalImage = images[idHash % images.length]; } else if (detectedCategory === "Spor Okulları") { const images = ['https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1519315901367-f34f9274ceb3?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1518659114757-ee3d43c8b417?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1601367123180-2a3b04c8be1e?q=80&w=1470&auto=format&fit=crop']; finalImage = images[idHash % images.length]; } else if (detectedCategory === "Spor Etkinlikleri") { const images = ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1470&auto=format&fit=crop']; finalImage = images[idHash % images.length]; } else { const images = ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1487461086616-24eb79848074?q=80&w=1470&auto=format&fit=crop', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop']; finalImage = images[idHash % images.length]; } } if (false) {
          // Skip facilities with representative / unsplash images
          return;
        }

        const facilityEvent: SportsEvent = {
          id: docSnap.id,
          title: facilityName,
          slug: facilityName.toLowerCase().replace(/[^a-z0-9ğüşıöç]+/g, '-'),
          category: detectCategory(facilityName, '', address, data.category),
          city: city,
          venue: address || facilityName,
          date: 'Tüm Yıl Açık',
          organizer: 'Doğrulanmış Spor Tesisi',
          organizerVerified: true,
          image: finalImage,
          description: `${facilityName} - ${address ? `Adres: ${address}. ` : ''}Sporpuan haritalar ve tesis rehberinde yer alan doğrulanmış tesis.`,
          overallScore: data.overallScore || 8.8,
          ratingBreakdown: data.ratingBreakdown || {
            'Hijyen & Temizlik': 8.9,
            'Ekipman Kalitesi': 8.7,
            'Personel İlgi & Alakası': 9.0,
            'Fiyat / Performans': 8.6
          },
          reviewCount: data.reviewCount || 1,
          featured: false,
          tags: ['Spor Tesisi', city],
          reviews: data.reviews || [],
          isActive: true,
          latitude: data.location?.latitude || data.location?.lat,
          longitude: data.location?.longitude || data.location?.lng,
          sourceProvider: 'Veritabanı',
          lastSyncedAt: new Date().toISOString()
        };

        syncedList.push(facilityEvent);
        if (existingIds.has(docSnap.id)) {
          updatedCount++;
        } else {
          addedCount++;
        }
      });

      if (syncedList.length > 0) {
        if (onUpdateEventsBatch) {
          onUpdateEventsBatch(syncedList);
        } else {
          syncedList.forEach((e) => {
            if (existingIds.has(e.id)) {
              onUpdateEvent(e);
            } else {
              onAddEvent(e);
            }
          });
        }
      }

      setSyncResultMsg(`🎉 Veritabanından ${querySnapshot.size} tesis başarıyla çekildi ve ana siteye aktarıldı! (${addedCount} yeni tesis eklendi, ${updatedCount} var olan tesis güncellendi)`);
    } catch (e: any) {
      console.error('Sync error:', e);
      setSyncResultMsg(`❌ Çekme hatası: ${e.message || 'Bilinmeyen bir hata oluştu'}`);
    } finally {
      setSyncingFirebase(false);
    }
  };

  const handleImportFacilities = async () => {
    setImporting(true);
    setImportResultMsg(null);
    setImportErrorMsg(null);
    try {
      const response = await fetch('/api/import-facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: importSearchTerm || 'spor tesisleri',
          customApiKey: customApiKey.trim() || undefined
        })
      });
      
      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('Sunucudan geçersiz bir yanıt alındı (Zaman aşımı veya ağ hatası olabilir). Lütfen daha az sonuç getirecek spesifik bir arama yapmayı deneyin.');
      }
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'İçe aktarma hatası oluştu.');
      }

      if (data.facilities && data.facilities.length > 0) {
        for (const facility of data.facilities) {
          const docId = facility.id;
          await setDoc(doc(db, 'facilities', docId), {
            name: facility.displayName?.text || facility.displayName || 'Spor Tesisi',
            address: facility.formattedAddress || '',
            location: facility.location || null,
            image: facility.image || null,
            photos: facility.photos || [],
            googlePlaceId: docId,
            category: facility.category || detectCategory(facility.displayName?.text || facility.displayName || 'Spor Tesisi', '', facility.formattedAddress || ''),
            overallScore: facility.overallScore || 8.8,
            reviewCount: facility.userRatingCount || (facility.reviews ? facility.reviews.length : 1),
            reviews: facility.reviews || [],
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
        setImportedList(data.facilities);
        setImportResultMsg(`🎉 Toplam ${data.facilities.length} tesis (görselleri, puanları ve Google yorumlarıyla) Google Haritalar'dan çekildi ve veritabanına kaydedildi! Tesisler otomatik olarak canlı siteye aktarılıyor...`);
        // Auto sync to site
        await handleSyncFirebaseFacilitiesToSite();
      } else {
        setImportResultMsg('Aramanıza uygun yeni bir tesis bulunamadı.');
      }
    } catch (e: any) {
      console.error(e);
      setImportErrorMsg(e.message || 'İçe aktarma sırasında bir hata oluştu.');
    } finally {
      setImporting(false);
    }
  };

  const handleRefreshAllExistingFacilitiesWithGoogleData = async () => {
    setRefreshingFacilities(true);
    setRefreshResultMsg(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'facilities'));
      if (querySnapshot.empty) {
        setRefreshResultMsg("Veritabanında güncellenecek tesis bulunamadı.");
        return;
      }

      let updatedCount = 0;
      let failCount = 0;

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const facilityName = data.name || data.title || '';
        const address = data.address || data.formattedAddress || '';

        if (!facilityName) continue;

        try {
          const res = await fetch('/api/refresh-facility-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              facilityName,
              address,
              customApiKey: customApiKey.trim() || undefined
            })
          });

          const updatedData = await res.json();
          if (res.ok && updatedData) {
            await setDoc(doc(db, 'facilities', docSnap.id), {
              image: updatedData.image || data.image || null,
              photos: updatedData.photos || data.photos || [],
              overallScore: updatedData.overallScore || data.overallScore || 8.8,
              userRatingCount: updatedData.userRatingCount || data.userRatingCount || (updatedData.reviews ? updatedData.reviews.length : 1),
              reviewCount: updatedData.userRatingCount || data.reviewCount || (updatedData.reviews ? updatedData.reviews.length : 1),
              reviews: updatedData.reviews && updatedData.reviews.length > 0 ? updatedData.reviews : (data.reviews || []),
              updatedAt: new Date().toISOString()
            }, { merge: true });
            updatedCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          console.error(`Error refreshing ${facilityName}:`, err);
          failCount++;
        }
      }

      setRefreshResultMsg(`🎉 Toplam ${updatedCount} tesisin görselleri, puanı ve Google Maps yorumları başarıyla çekilerek veritabanı güncellendi! ${failCount > 0 ? `(${failCount} tesis için yeni yorum/görsel bulunamadı)` : ''}`);
      // Refresh to site state
      await handleSyncFirebaseFacilitiesToSite();
    } catch (err: any) {
      console.error('Batch refresh error:', err);
      setRefreshResultMsg(`❌ Güncelleme hatası: ${err.message || 'Bilinmeyen bir hata oluştu.'}`);
    } finally {
      setRefreshingFacilities(false);
    }
  };

  const handleTranslateAllExistingDbReviewsWithAI = async () => {
    setTranslatingReviews(true);
    setTranslateResultMsg(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'facilities'));
      if (querySnapshot.empty) {
        setTranslateResultMsg("Veritabanında dönüştürülecek tesis bulunamadı.");
        return;
      }

      let translatedFacilitiesCount = 0;
      let totalReviewsCount = 0;

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const facilityName = data.name || data.title || 'Spor Tesisi';
        const reviews = data.reviews || [];

        if (reviews.length === 0) continue;

        try {
          const res = await fetch('/api/ai/batch-translate-reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              facilityName,
              reviews
            })
          });

          if (res.ok) {
            const result = await res.json();
            if (result.reviews) {
              await setDoc(doc(db, 'facilities', docSnap.id), {
                reviews: result.reviews,
                updatedAt: new Date().toISOString()
              }, { merge: true });
              translatedFacilitiesCount++;
              totalReviewsCount += result.reviews.length;
            }
          } else {
            console.warn(`Translation endpoint returned non-ok status for ${facilityName}:`, res.status);
          }
        } catch (err) {
          console.error(`Error translating reviews for ${facilityName}:`, err);
        }
      }

      setTranslateResultMsg(`🎉 Toplam ${translatedFacilitiesCount} tesisteki ${totalReviewsCount} yorum Yapay Zeka (Gemini) tarafından Türkçe'ye çevrildi ve kategori puanları analiz edildi!`);
      await handleSyncFirebaseFacilitiesToSite();
    } catch (err: any) {
      console.error('Batch translation error:', err);
      setTranslateResultMsg(`❌ Çeviri hatası: ${err.message || 'Bilinmeyen bir hata oluştu.'}`);
    } finally {
      setTranslatingReviews(false);
    }
  };

  const [categorizingFacilities, setCategorizingFacilities] = useState(false);
  const [categorizeResultMsg, setCategorizeResultMsg] = useState<string | null>(null);

  const handleAutoCategorizeAllFacilities = async () => {
    setCategorizingFacilities(true);
    setCategorizeResultMsg(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'facilities'));
      let updatedCount = 0;
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const title = data.name || data.title || '';
        const address = data.address || '';
        const newCat = detectCategory(title, '', address, undefined);
        if (data.category !== newCat) {
          await updateDoc(doc(db, 'facilities', docSnap.id), {
            category: newCat
          });
          updatedCount++;
        }
      }
      setCategorizeResultMsg(`🎉 Toplam ${querySnapshot.size} tesisten ${updatedCount} tanesinin kategorisi (Spor Salonları, Spor Okulları, Spor Etkinlikleri, Spor Tesisleri) başarıyla güncellendi!`);
      await handleSyncFirebaseFacilitiesToSite();
    } catch (err: any) {
      console.error('Categorize error:', err);
      setCategorizeResultMsg(`❌ Hata: ${err.message || 'Kategorileştirme esnasında bir sorun oluştu.'}`);
    } finally {
      setCategorizingFacilities(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            Yönetici Paneli
          </h1>
          <p className="text-slate-500 font-medium mt-1">Platforma kayıtlı tüm kullanıcıları, kurumsal başvuruları ve değerlendirmeleri yönetin.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 mb-6 pb-2">
        {(['overview', 'users', 'events', 'reviews', 'corporate', 'invite-requests', 'import', 'suggestions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab === 'overview' && 'Genel Bakış'}
            {tab === 'users' && 'Kullanıcılar'}
            {tab === 'events' && 'Partnerler'}
            {tab === 'reviews' && 'Değerlendirmeler'}
            {tab === 'corporate' && 'Kurumsal Başvurular'}
            {tab === 'invite-requests' && 'Davetiye Talepleri'}
            {tab === 'import' && 'Tesis İçe Aktar'}
            {tab === 'suggestions' && 'Tesis Önerileri'}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 text-sm font-bold mb-1">Toplam Kullanıcı</h3>
            <p className="text-3xl font-black text-slate-900">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 text-sm font-bold mb-1">Kayıtlı Partnerler</h3>
            <p className="text-3xl font-black text-slate-900">{events.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 text-sm font-bold mb-1">Bekleyen Kurumsal</h3>
            <p className="text-3xl font-black text-blue-600">{corporateApps.filter(a => a.status === 'pending').length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 text-sm font-bold mb-1">Onaylanan Kurumsal</h3>
            <p className="text-3xl font-black text-emerald-600">{corporateApps.filter(a => a.status === 'approved').length}</p>
          </div>
        </div>
      )}

      {activeTab === 'corporate' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto">
              {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setCorporateFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                    corporateFilter === filter ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'all' && 'Tümü'}
                  {filter === 'pending' && 'Bekleyenler'}
                  {filter === 'approved' && 'Onaylananlar'}
                  {filter === 'rejected' && 'Reddedilenler'}
                  {filter === 'suspended' && 'Pasife Alınanlar'}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-bold text-slate-700 w-full sm:w-auto">Özel Davet:</div>
              <input
                type="text"
                placeholder="Kişi Adı (Opsiyonel)"
                value={invitePersonName}
                onChange={(e) => setInvitePersonName(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-36"
              />
              <input
                type="text"
                placeholder="Tesis / İşletme Adı"
                value={inviteTargetName}
                onChange={(e) => setInviteTargetName(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-40"
              />
              <button
                onClick={handleGenerateInviteLink}
                className="w-full sm:w-auto px-4 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-md hover:bg-blue-700 transition whitespace-nowrap"
              >
                Link Oluştur
              </button>
            </div>
          </div>

          {generatedInviteLink && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <input 
                  readOnly 
                  value={generatedInviteLink}
                  className="bg-slate-950 text-blue-300 font-mono text-xs p-2 rounded-lg w-full outline-none"
                />
                <button 
                  onClick={handleCopyGeneratedLink}
                  className="px-4 py-2 bg-white text-slate-900 font-bold text-xs rounded-xl whitespace-nowrap flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copiedLink ? 'Kopyalandı!' : 'Kopyala'}
                </button>
              </div>
              <div className="flex items-center gap-3 justify-end border-t border-slate-800 pt-3">
                <span className="text-slate-400 text-xs font-medium">Gönder:</span>
                <button 
                  onClick={handleShareWhatsApp}
                  className="px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-xs rounded-xl whitespace-nowrap flex items-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </button>
                <button 
                  onClick={handleShareEmail}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white font-bold text-xs rounded-xl whitespace-nowrap flex items-center gap-2 transition"
                >
                  <Mail className="w-4 h-4" />
                  E-Posta
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-bold">Tesis Adı</th>
                    <th className="p-4 font-bold">İletişim</th>
                    <th className="p-4 font-bold">Durum</th>
                    <th className="p-4 font-bold">Tarih</th>
                    <th className="p-4 font-bold text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corporateApps
                    .filter(app => corporateFilter === 'all' || app.status === corporateFilter)
                    .map(app => {
                      const matchedFacility = events.find(e => e.id === app.publishedFacilityId || e.title.toLowerCase() === app.facilityName.toLowerCase());
                      return (
                        <tr key={app.id} className="hover:bg-slate-50 transition">
                          <td className="p-4">
                            {matchedFacility ? (
                              <Link 
                                to={getEventDetailUrl(matchedFacility)} 
                                className="group/corp flex flex-col"
                                title={`${app.facilityName} profilini gör`}
                              >
                                <div className="font-bold text-slate-800 text-sm group-hover/corp:text-blue-600 group-hover/corp:underline flex items-center gap-1.5">
                                  {app.facilityName}
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <div className="text-xs text-slate-500">{app.category} - {app.city}</div>
                              </Link>
                            ) : (
                              <>
                                <div className="font-bold text-slate-800 text-sm">{app.facilityName}</div>
                                <div className="text-xs text-slate-500">{app.category} - {app.city}</div>
                              </>
                            )}
                          </td>
                        <td className="p-4">
                          <div className="text-sm text-slate-700">{app.contactName}</div>
                          <div className="text-xs text-slate-500">{app.contactEmail}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            app.status === 'suspended' ? 'bg-slate-100 text-slate-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {app.status === 'pending' && 'Bekliyor'}
                            {app.status === 'approved' && 'Onaylandı'}
                            {app.status === 'suspended' && 'Pasif'}
                            {app.status === 'rejected' && 'Reddedildi'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {new Date(app.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {app.status === 'pending' && (
                            <button 
                              onClick={() => handleApproveCorporateApp(app)}
                              className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200"
                            >
                              Onayla
                            </button>
                          )}
                          {app.status === 'pending' && (
                            <button 
                              onClick={() => handleRejectCorporateApp(app)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200"
                            >
                              Reddet
                            </button>
                          )}
                          {app.status === 'approved' && (
                            <button 
                              onClick={() => handleSuspendCorporateApp(app)}
                              className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-200"
                            >
                              Yayından Kaldır
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteCorporateApp(app)}
                            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {corporateApps.filter(app => corporateFilter === 'all' || app.status === corporateFilter).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                        Bu filtreye uygun kurumsal başvuru bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invite-requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Hızlı Davetiye Talepleri
            </h2>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {inviteRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Henüz davetiye talebi bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {inviteRequests.map((req) => (
                  <div key={req.id} className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 text-sm">İletişim: <span className="text-blue-600">{req.contact}</span></div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(req.createdAt).toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {req.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                      </span>
                      {req.status !== 'completed' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const isEmail = req.contact.includes('@');
                              const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                              const baseUrl = window.location.origin + '/kurumsal';
                              const params = new URLSearchParams();
                              params.set('inviteCode', randomCode);
                              params.set('sender', 'Yönetici Ekibi');
                              const fullUrl = `${baseUrl}?${params.toString()}`;
                              
                              if (isEmail) {
                                const subject = `Sporpuan Kurumsal Davetiyesi`;
                                const body = `Merhaba,

Tesisinizi Türkiye'nin Spor Değerlendirme ve İnceleme Platformuna eklemek için özel davetiyeniz oluşturuldu.

Aşağıdaki bağlantıya tıklayarak kurumsal başvurunuzu tamamlayabilir ve tesisinizi hemen yayınlayabilirsiniz:

${fullUrl}

İyi çalışmalar,
Sporpuan Yönetimi`;
                                window.open(`mailto:${req.contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                              } else {
                                let phone = req.contact.replace(/[^0-9]/g, '');
                                if (phone.length === 10) phone = '90' + phone;
                                if (phone.length === 11 && phone.startsWith('0')) phone = '90' + phone.substring(1);
                                
                                const text = `Merhaba,

Tesisinizi Türkiye'nin Spor Değerlendirme ve İnceleme Platformuna eklemek için özel davetiyeniz oluşturuldu. Aşağıdaki bağlantıya tıklayarak kurumsal başvurunuzu tamamlayabilir ve tesisinizi hemen yayınlayabilirsiniz:

${fullUrl}`;
                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                              }
                            }}
                            className={`px-3 py-1.5 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 ${req.contact.includes('@') ? 'bg-blue-500 hover:bg-blue-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                          >
                            {req.contact.includes('@') ? <Mail className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                            Davetiye Gönder
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'corporate_invite_requests', req.id), { status: 'completed' });
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-lg text-xs font-bold transition"
                          >
                            İşaretle
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-left">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-2 text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Google Haritalar'dan Otomatik Tesis Çekme Engine
            </h2>
            <p className="text-slate-500 mb-6 text-sm">
              Google Maps Places API (New) üzerinden belirtilen konum/anahtar kelimedeki spor tesislerini, adreslerini ve konum koordinatlarını otomatik olarak Firestore veritabanınıza aktarır.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Arama Konumu / Sorgusu</label>
                <input
                  type="text"
                  value={importSearchTerm}
                  onChange={(e) => setImportSearchTerm(e.target.value)}
                  placeholder="Örn: İstanbul halı saha, Ankara tenis kortu, İzmir spor salonu"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Google Maps API Key (Opsiyonel / İstemci Manuel Yapıştırma)</span>
                  <span className="text-slate-400 font-normal">Sistemdeki key geçersiz uyarı verirse buraya yapıştırabilirsiniz</span>
                </label>
                <input
                  type="text"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono bg-slate-50"
                />
              </div>

              <button 
                onClick={handleImportFacilities}
                disabled={importing || !importSearchTerm.trim()}
                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-slate-400 transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Haritalar'dan Çekiliyor...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Tesisleri Çek & Kaydet
                  </>
                )}
              </button>
            </div>

            {importErrorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm whitespace-pre-line leading-relaxed">
                <div className="font-bold flex items-center gap-2 mb-1 text-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  Google Cloud / API İzin Uyarısı
                </div>
                {importErrorMsg}
              </div>
            )}

            {importResultMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {importResultMsg}
              </div>
            )}

            {/* Database -> Site Sync Section */}
            <div className="my-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Veritabanındaki Tesisleri Siteye Aktar
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Veritabanı 'facilities' koleksiyonunda kayıtlı tesisleri çekip canlı site rehberine ve haritasına yükler.
                  </p>
                </div>
                <button
                  onClick={handleSyncFirebaseFacilitiesToSite}
                  disabled={syncingFirebase}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shrink-0 shadow-md"
                >
                  {syncingFirebase ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Aktarılıyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Veritabanındaki Tesisleri Siteye Aktar
                    </>
                  )}
                </button>
              </div>

              {/* Update Existing Facilities with Google Maps Reviews & Images */}
              <div className="pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Mevcut Tesisleri Google Maps Yorum ve Görselleriyle Güncelle
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Veritabanında önceden eklenmiş tesislerin Google Maps'teki gerçek fotoğraflarını, puanlarını ve kullanıcı yorumlarını çekip günceller.
                  </p>
                </div>
                <button
                  onClick={handleRefreshAllExistingFacilitiesWithGoogleData}
                  disabled={refreshingFacilities}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shrink-0 shadow-sm whitespace-nowrap"
                >
                  {refreshingFacilities ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Google Maps'ten Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Mevcut Tesis Yorum & Görsellerini Güncelle
                    </>
                  )}
                </button>
              </div>

              {/* Translate & Analyze All Reviews with AI */}
              <div className="pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Tüm Yorumları Yapay Zeka ile Türkçe'ye Çevir & Kategori Puanlarını Analiz Et
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    İngilizce veya yabancı dildeki Google Maps yorumlarını akıcı Türkçe'ye dönüştürür; temizlik, hizmet, ekipman ve fiyat-performans kategorilerini AI ile puanlar.
                  </p>
                </div>
                <button
                  onClick={handleTranslateAllExistingDbReviewsWithAI}
                  disabled={translatingReviews}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shrink-0 shadow-sm whitespace-nowrap"
                >
                  {translatingReviews ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      AI Çeviri & Analiz Yapılıyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Yorumları Türkçe'ye Çevir & AI ile Puanla
                    </>
                  )}
                </button>
              </div>

              {/* Auto Categorize All Facilities */}
              <div className="pt-3 border-t border-blue-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Tüm Tesislerin Kategorilerini Akıllı Algoritma ile Ayrıştır (Salon, Okul, Etkinlik, Tesis)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Veritabanındaki ve Google Maps'ten yüklenen tüm verileri analiz eder; Spor Salonları, Spor Okulları, Spor Etkinlikleri ve Spor Tesisleri kategorilerine otomatik olarak doğru bir şekilde atar.
                  </p>
                </div>
                <button
                  onClick={handleAutoCategorizeAllFacilities}
                  disabled={categorizingFacilities}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shrink-0 shadow-sm whitespace-nowrap"
                >
                  {categorizingFacilities ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Kategoriler Ayrıştırılıyor...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      Tümünü Kategorilere Ayır
                    </>
                  )
                  }
                </button>
              </div>

              {categorizeResultMsg && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{categorizeResultMsg}</span>
                </div>
              )}

              {translateResultMsg && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{translateResultMsg}</span>
                </div>
              )}

              {refreshResultMsg && (
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs font-semibold text-indigo-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{refreshResultMsg}</span>
                </div>
              )}

              {syncResultMsg && (
                <div className="p-3.5 bg-white rounded-xl border border-blue-200 text-xs font-semibold text-slate-800 flex items-center gap-2 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{syncResultMsg}</span>
                </div>
              )}
            </div>

            {importedList.length > 0 && (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Son Aktarılan Tesisler ({importedList.length})</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {importedList.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img referrerPolicy="no-referrer" src={item.image || undefined} alt="Tesis" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 text-xs">
                            🏟️
                          </div>
                        )}
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{item.displayName?.text || item.displayName}</span>
                          <span className="text-slate-500 block truncate text-[11px]">{item.formattedAddress}</span>
                        </div>
                      </div>
                      <span className="bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-md text-[10px] shrink-0">
                        {item.image ? '📸 Görselli Eklendi' : 'Eklendi'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Kullanıcı Tesis Önerileri</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Tesis Adı</th>
                  <th className="p-4 font-bold">Kategori</th>
                  <th className="p-4 font-bold">Detaylar</th>
                  <th className="p-4 font-bold">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suggestions.map(sug => (
                  <tr key={sug.id} onClick={() => setSelectedSuggestion(sug)} className="hover:bg-slate-50 transition cursor-pointer">
                    <td className="p-4 font-bold text-sm text-slate-800">{sug.facilityName}</td>
                    <td className="p-4 text-sm text-slate-600">{sug.category}</td>
                    <td className="p-4 text-sm text-slate-600 truncate max-w-xs">{sug.details}</td>
                    <td className="p-4 text-xs text-slate-500">{new Date(sug.createdAt).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSuggestion && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Öneri Detayları</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Tesis Adı</label>
                <p className="text-slate-900">{selectedSuggestion.facilityName}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
                <p className="text-slate-900">{selectedSuggestion.category}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Detaylar</label>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl">{selectedSuggestion.details}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedSuggestion(null)}
              className="mt-6 w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Basic implementations for other tabs to keep it functional */}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          Kullanıcı yönetimi paneli (Basitleştirilmiş görünüm)
        </div>
      )}
      
      {activeTab === 'events' && (
      <>
        {/* Filter Header & Controls Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Partnerler Yönetimi & Filtreleme</h2>
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2.5 py-0.5 rounded-full">
                {filteredEvents.length} / {events.length} Partner
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={handleExportEvents}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shadow-sm"
              >
                <Download className="w-4 h-4" />
                Excel İndir
              </button>
              <button 
                onClick={handleSyncFirebaseFacilitiesToSite}
                disabled={syncingFirebase}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shadow-sm"
                title="Veritabanındaki tesisleri siteye aktarır"
              >
                <RefreshCw className={`w-4 h-4 ${syncingFirebase ? 'animate-spin' : ''}`} />
                <span>{syncingFirebase ? 'Aktarılıyor...' : "Veritabanından Siteye Aktar"}</span>
              </button>
              <button 
                onClick={() => onEditEvent({
                  id: Math.random().toString(36).substr(2, 9),
                  title: '',
                  slug: '',
                  category: 'Spor Tesisleri',
                  city: '',
                  venue: '',
                  date: '',
                  time: '',
                  ticketUrl: '',
                  summary: '',
                  organizer: 'Doğrulanmış Spor Tesisi',
                  organizerVerified: true,
                  image: '',
                  description: '',
                  overallScore: 0,
                  ratingBreakdown: {},
                  reviewCount: 0,
                  featured: false,
                  isActive: true,
                  tags: [],
                  reviews: []
                })} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Yeni Partner Ekle
              </button>
            </div>
          </div>

          {/* Detaylı Filtreleme Alanları (Arama, Şehir, İlçe, Branş, Kategori, Durum) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Arama</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Partner / Tesis veya Adres Ara..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Şehir Filtresi */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Şehir</label>
              <select
                value={eventCityFilter}
                onChange={(e) => {
                  setEventCityFilter(e.target.value);
                  setEventDistrictFilter('all');
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="all">Tüm Şehirler</option>
                {TURKEY_CITIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* İlçe Filtresi */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">İlçe</label>
              <select
                value={eventDistrictFilter}
                onChange={(e) => setEventDistrictFilter(e.target.value)}
                disabled={eventCityFilter === 'all'}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">{eventCityFilter === 'all' ? 'Önce Şehir Seç' : 'Tüm İlçeler'}</option>
                {availableDistricts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Branş Filtresi */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Branş</label>
              <select
                value={eventBranchFilter}
                onChange={(e) => setEventBranchFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="all">Tüm Branşlar</option>
                {SPORTS_BRANCHES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Durum Filtresi */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Durum</label>
              <select
                value={eventStatusFilter}
                onChange={(e) => setEventStatusFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Yayında</option>
                <option value="hidden">Gizli</option>
              </select>
            </div>
          </div>

          {/* Active Filter Badges & Clear Filters */}
          {(eventCityFilter !== 'all' || eventDistrictFilter !== 'all' || eventBranchFilter !== 'all' || eventCategoryFilter !== 'all' || eventStatusFilter !== 'all' || eventSearchQuery) && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-400 text-[11px]">Aktif Filtreler:</span>
                {eventCityFilter !== 'all' && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                    Şehir: {eventCityFilter}
                  </span>
                )}
                {eventDistrictFilter !== 'all' && (
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                    İlçe: {eventDistrictFilter}
                  </span>
                )}
                {eventBranchFilter !== 'all' && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                    Branş: {eventBranchFilter}
                  </span>
                )}
                {eventSearchQuery && (
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                    Arama: "{eventSearchQuery}"
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setEventSearchQuery('');
                  setEventCategoryFilter('all');
                  setEventStatusFilter('all');
                  setEventCityFilter('all');
                  setEventDistrictFilter('all');
                  setEventBranchFilter('all');
                }}
                className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-1 transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Filtreleri Sıfırla
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Partner / Tesis</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Şehir</th>
                  <th className="px-4 py-3 font-medium text-center">Durum</th>
                  <th className="px-4 py-3 font-medium text-center">Puan</th>
                  <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map(ev => (
                  <tr key={ev.id} className={`hover:bg-slate-50 transition-colors ${ev.isActive === false ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <Link 
                        to={getEventDetailUrl(ev)} 
                        className="flex items-center gap-3 group/partner hover:text-blue-600 transition-colors"
                        title={`${ev.title} profil sayfasına git`}
                      >
                        <img referrerPolicy="no-referrer" 
                          src={ev.image || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=200&auto=format&fit=crop'} 
                          alt={ev.title} 
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 group-hover/partner:scale-105 transition-transform" 
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="line-clamp-2 font-bold group-hover/partner:underline">{ev.title}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{ev.category}</td>
                    <td className="px-4 py-3 text-slate-600">{ev.city}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${ev.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {ev.isActive !== false ? 'Yayında' : 'Gizli'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-center font-bold text-blue-600">
                      {ev.overallScore > 0 ? ev.overallScore.toFixed(1) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button 
                        onClick={() => onUpdateEvent({ ...ev, isActive: ev.isActive === false ? true : false })} 
                        className={`${ev.isActive !== false ? 'text-amber-500 hover:text-amber-700' : 'text-emerald-500 hover:text-emerald-700'} font-bold transition text-xs`}
                      >
                        {ev.isActive !== false ? 'Gizle' : 'Yayınla'}
                      </button>
                      <button 
                        onClick={() => onEditEvent(ev)} 
                        className="text-blue-500 hover:text-blue-700 font-bold transition text-xs"
                      >
                        Düzenle
                      </button>
                      <button 
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            message: `"${ev.title}" adlı tesisi silmek istediğinize emin misiniz?`,
                            onConfirm: () => onDeleteEvent(ev.id)
                          });
                        }} 
                        className="text-rose-500 hover:text-rose-700 font-bold transition text-xs"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}
      
      {activeTab === 'reviews' && (
      <>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Yorum, Kullanıcı veya Tesis Ara..."
              value={reviewSearchQuery}
              onChange={(e) => setReviewSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReviews}
              className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shadow-sm"
            >
              <Download className="w-4 h-4" />
              Excel İndir
            </button>
            <select
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value as any)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="published">Yayında</option>
              <option value="hidden">Gizli</option>
            </select>
          </div>
        </div>



        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Kullanıcı</th>
                  <th className="px-4 py-3 font-medium">Tesis/Etkinlik</th>
                  <th className="px-4 py-3 font-medium text-center">Puan</th>
                  <th className="px-4 py-3 font-medium w-1/3">Yorum</th>
                  <th className="px-4 py-3 font-medium text-center">Durum</th>
                  <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.map(rev => (
                  <tr key={rev.id} className={`hover:bg-slate-50 ${rev.status === 'hidden' ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{formatAdminReviewDate(rev.date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Avatar src={rev.userAvatar} name={rev.userName} className="w-6 h-6 rounded-full object-cover" />
                        <span className="font-medium text-xs">{rev.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium text-xs">{rev.eventTitle}</td>
                    <td className="px-4 py-3 text-slate-600 text-center font-bold text-amber-500">{rev.rating || rev.overallScore}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                       <p className="line-clamp-2" title={rev.comment}>{rev.comment}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${rev.status !== 'hidden' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {rev.status !== 'hidden' ? 'Yayında' : 'Gizli'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => {
                           const parentEvent = events.find(e => e.id === rev.eventId);
                           if (parentEvent) {
                             const updatedReviews = parentEvent.reviews.map(r => 
                               r.id === rev.id ? { ...r, status: r.status === 'hidden' ? 'published' : 'hidden' } as Review : r
                             );
                             onUpdateEvent({ ...parentEvent, reviews: updatedReviews });
                           }
                        }} 
                        className={`${rev.status !== 'hidden' ? 'text-amber-500 hover:text-amber-700' : 'text-emerald-500 hover:text-emerald-700'} font-bold text-xs transition`}
                      >
                        {rev.status !== 'hidden' ? 'Gizle' : 'Yayınla'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredReviews.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Değerlendirme bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}

      {/* Confirm Dialog Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Onay Gerekiyor</h3>
            <p className="text-slate-600 text-sm mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Dialog Modal */}
      {promptDialog && promptDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Gerekçe / Bilgi</h3>
            <p className="text-slate-600 text-sm mb-4">{promptDialog.message}</p>
            <textarea
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              rows={3}
              defaultValue={promptDialog.defaultValue}
              id="prompt-input-field"
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPromptDialog(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  const val = (document.getElementById('prompt-input-field') as HTMLTextAreaElement)?.value || '';
                  promptDialog.onConfirm(val);
                  setPromptDialog(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
