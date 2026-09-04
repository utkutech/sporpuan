import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SportsEvent } from '../types';
import { INITIAL_EVENTS } from '../data/mockEvents';
import { detectCategory } from '../lib/categoryUtils';

const fetchFacilities = async (): Promise<SportsEvent[]> => {
  let localEvents: SportsEvent[] = [];
  try {
    const saved = localStorage.getItem('sporpuan_events_v2');
    if (saved) {
      localEvents = JSON.parse(saved);
    } else {
      localEvents = [...INITIAL_EVENTS];
    }
  } catch (e) {
    localEvents = [...INITIAL_EVENTS];
  }

  const querySnapshot = await getDocs(collection(db, 'facilities'));
  if (querySnapshot.empty) {
    return localEvents;
  }

  const firestoreEventsMap = new Map<string, SportsEvent>();
  
  querySnapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const image = data.image || null;
    const facilityName = data.name || data.title || 'Spor Tesisi';
    const address = data.address || data.formattedAddress || '';
    const detectedCategory = detectCategory(facilityName, '', address, data.category);
    
    let finalImage = image;
    if (!image) {
      const idHash = Array.from(docSnap.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      if (detectedCategory === 'Spor Salonları') {
        const images = [
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=1470&auto=format&fit=crop'
        ];
        finalImage = images[idHash % images.length];
      } else if (detectedCategory === 'Spor Okulları') {
        const images = [
          'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1519315901367-f34f9274ceb3?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1518659114757-ee3d43c8b417?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1601367123180-2a3b04c8be1e?q=80&w=1470&auto=format&fit=crop'
        ];
        finalImage = images[idHash % images.length];
      } else if (detectedCategory === 'Spor Etkinlikleri') {
        const images = [
          'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1470&auto=format&fit=crop'
        ];
        finalImage = images[idHash % images.length];
      } else {
        const images = [
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1487461086616-24eb79848074?q=80&w=1470&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop'
        ];
        finalImage = images[idHash % images.length];
      }
    }
    
    let city = 'İstanbul';
    const knownCities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Kocaeli', 'Mersin', 'Eskişehir', 'Samsun', 'Trabzon', 'Kayseri'];
    for (const c of knownCities) {
      if (address.toLowerCase().includes(c.toLowerCase())) {
        city = c;
        break;
      }
    }

    firestoreEventsMap.set(docSnap.id, {
      id: docSnap.id,
      title: facilityName,
      slug: facilityName.toLowerCase().replace(/[^a-z0-9ğüşıöç]+/g, '-'),
      category: detectedCategory,
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
      reviewCount: data.userRatingCount || data.reviewCount || (data.reviews ? data.reviews.length : 1),
      featured: false,
      tags: ['Spor Tesisi', city],
      reviews: data.reviews || [],
      isActive: data.isActive !== undefined ? data.isActive : true,
      latitude: data.location?.latitude || data.location?.lat,
      longitude: data.location?.longitude || data.location?.lng,
      sourceProvider: 'Veritabanı',
      lastSyncedAt: new Date().toISOString()
    });
  });

  const updated = localEvents.map((ev) => firestoreEventsMap.get(ev.id) || ev);
  firestoreEventsMap.forEach((facilityEvent, id) => {
    if (!updated.some((e) => e.id === id)) {
      updated.push(facilityEvent);
    }
  });

  try {
    localStorage.setItem('sporpuan_events_v2', JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }

  return updated;
};

const getInitialData = () => {
  try {
    const saved = localStorage.getItem('sporpuan_events_v2');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // ignore
  }
  return [...INITIAL_EVENTS];
};

export const useFacilities = () => {
  return useQuery({
    queryKey: ['facilities'],
    queryFn: fetchFacilities,
    initialData: getInitialData,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on every window focus
  });
};
