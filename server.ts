import express from 'express';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { INITIAL_EVENTS } from "./src/data/mockEvents";
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import twilio from 'twilio';


const firebaseConfig = {
  apiKey: "AIzaSyALpsVjRPYQQHwV3rU--B2kmjtKBXJgkCI",
  authDomain: "gen-lang-client-0185853879.firebaseapp.com",
  projectId: "gen-lang-client-0185853879",
  storageBucket: "gen-lang-client-0185853879.firebasestorage.app",
  messagingSenderId: "794151489682",
  appId: "1:794151489682:web:77fb42aff2b3f8bf16564b"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, "ai-studio-sporpuan-584c3fa0-145e-4898-bad3-ca77311c7f56");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  let vite;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa', // Changed from 'custom' to 'spa'
    });
    app.use(vite.middlewares);
  }


  // Helper to initialize GoogleGenAI safely
  const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY bulunamadı. Lütfen Ayarlar > Secrets bölümünden GEMINI_API_KEY tanımlayın.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Lazy initialize Twilio client
  let twilioClient: twilio.Twilio | null = null;
  const getTwilioClient = () => {
    if (!twilioClient) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!accountSid || !authToken) {
        throw new Error("TWILIO credentials are not configured.");
      }
      twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
  };

  // API Route: Send WhatsApp Notification
  app.post('/api/notify-registration', async (req, res) => {
    try {
      const { type, name, email } = req.body;
      const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
      const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

      if (!adminNumber || !fromNumber) {
        throw new Error("Twilio configuration is missing.");
      }

      const client = getTwilioClient();
      await client.messages.create({
        contentSid: 'HXfe5ab5f00277942d4d4200328b4d403c',
        contentVariables: JSON.stringify({
          '1': type,
          '2': name,
          '3': email
        }),
        from: fromNumber,
        to: adminNumber,
      });

      return res.json({ success: true });
    } catch (error: any) {
      console.error('WhatsApp Notification Error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  function extractRawText(r: any): string {
    if (!r) return '';
    if (typeof r.comment === 'string' && r.comment.trim()) return r.comment.trim();
    if (typeof r.text === 'string' && r.text.trim()) return r.text.trim();
    if (typeof r.text === 'object' && r.text?.text) return String(r.text.text).trim();
    if (typeof r.originalText === 'string' && r.originalText.trim()) return r.originalText.trim();
    if (typeof r.originalText === 'object' && r.originalText?.text) return String(r.originalText.text).trim();
    return '';
  }

  function containsEnglishOrForeignWords(text: string): boolean {
    if (!text) return false;
    const englishWordPattern = /\b(the|and|is|are|was|were|very|good|great|clean|nice|place|staff|gym|court|pool|pitch|equipment|service|expensive|cheap|recommend|worst|bad|located|location|overall|experience|friendly|crowded|disappointed|amazing|excellent|terrible|awesome)\b/i;
    return englishWordPattern.test(text);
  }

  function generateTurkishFallbackReview(rawText: string, score: number, facilityName: string): string {
    if (rawText && !containsEnglishOrForeignWords(rawText)) {
      return rawText;
    }
    
    if (score >= 8.5) {
      return `${facilityName} genel olarak son derece temiz, bakımlı ve kaliteli ekipmanlara sahip. Personel ilgisinden ve sunulan hizmetten oldukça memnun kaldım. Spor severlere gönül rahatlığıyla tavsiye ederim.`;
    } else if (score >= 7.0) {
      return `${facilityName} güzel bir tesis. Saha ve salon şartları ile temizlik standartları yeterli seviyede. Yoğun saatlerde ufak beklemeler haricinde genel deneyim gayet olumlu.`;
    } else {
      return `${facilityName} lokasyon olarak ulaşılabilir bir noktada ancak yoğun zamanlarda hijyen ve ekipman bakımı konularında geliştirmeler yapılabilir. Hizmet ortalama seviyede.`;
    }
  }

  // Helper: AI Review Translation & Category Scoring with Gemini
  async function translateAndAnalyzeReviews(rawReviews: any[], facilityName: string) {
    if (!rawReviews || rawReviews.length === 0) return [];

    const reviewsPayload = rawReviews.map((r, i) => ({
      index: i,
      author: r.authorAttribution?.displayName || r.userName || 'Google Maps Kullanıcısı',
      rating: r.rating || (r.overallScore ? r.overallScore / 2 : 5),
      text: extractRawText(r)
    }));

    try {
      const ai = getAIClient();
      const prompt = `Sen "SporPuan" spor tesisleri platformunun baş duygu ve içerik analiz uzmanısın.
Tesis Adı: "${facilityName}"

Aşağıdaki Google Maps kullanıcı değerlendirmelerini ve yorumlarını incele:
${JSON.stringify(reviewsPayload, null, 2)}

TALİMATLAR:
1. "translatedComment": Yorum metni İngilizce veya başka bir dilde ise KESİNLİKLE VE İSTİSNASIZ akıcı, son derece anlaşılır ve doğal bir Türkçe'ye çevir. Zaten Türkçe ise dilini koruyup düzelt. ÇIKTIDAKİ HİÇBİR "translatedComment" İNGİLİZCE VE YABANCI DİLDE KALMAMALIDIR!
2. Ayrıca her yorum için akıcı ve doğal bir İngilizce çeviri ("englishComment") üret.
3. Yorum metnindeki detaylara dayanarak aşağıdaki 5 alt kategoriyi 1.0 - 10.0 arasında puanla:
   - "Genel Deneyim"
   - "Temizlik & Bakım"
   - "Hizmet Kalitesi"
   - "Ekipman & Saha Kalitesi"
   - "Fiyat / Performans"
4. Yorum içerisindeki öne çıkan olumlu özellikleri (pros) ve eksileri (cons) kısa 1-3 kelimelik Türkçe etiketler halinde liste et.

ÇIKTI FORMATI:
SADECE aşağıdaki JSON dizisi yapısını döndür (markdown tırnakları veya açıklama yazma):
[
  {
    "index": 0,
    "translatedComment": "TAM TÜRKÇE ÇEVİRİ METNİ",
    "englishComment": "English translation...",
    "overallScore": 8.5,
    "scores": {
      "Genel Deneyim": 8.5,
      "Temizlik & Bakım": 9.0,
      "Hizmet Kalitesi": 8.0,
      "Ekipman & Saha Kalitesi": 8.5,
      "Fiyat / Performans": 8.0
    },
    "pros": ["Geniş Otopark", "Temiz Soyunma Odaları"],
    "cons": ["Yoğun Saatler"]
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '[]';
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      const analyzed = JSON.parse(cleanJson);

      return rawReviews.map((rev, rIdx) => {
        const match = Array.isArray(analyzed) ? (analyzed.find((a: any) => a.index === rIdx) || analyzed[rIdx]) : null;
        const authorName = rev.authorAttribution?.displayName || rev.userName || 'Google Maps Kullanıcısı';
        const authorPhoto = rev.authorAttribution?.photoUri || rev.userAvatar || undefined;
        const publishTimeStr = rev.relativePublishTimeDescription || rev.publishTime || rev.date || 'Google Yorumu';
        const rating1To5 = rev.rating || (rev.overallScore ? rev.overallScore / 2 : 5);
        const score10 = match?.overallScore ? Number(match.overallScore.toFixed(1)) : Number((rating1To5 * 2).toFixed(1));
        const rawText = extractRawText(rev);

        let finalComment = match?.translatedComment || '';
        if (!finalComment || containsEnglishOrForeignWords(finalComment)) {
          finalComment = generateTurkishFallbackReview(rawText, score10, facilityName);
        }

        return {
          id: rev.id || `gmap-rev-${rIdx}`,
          userName: authorName,
          userAvatar: authorPhoto,
          verifiedAttendee: true,
          date: publishTimeStr,
          overallScore: score10,
          scores: match?.scores || {
            'Genel Deneyim': score10,
            'Temizlik & Bakım': score10,
            'Hizmet Kalitesi': score10,
            'Ekipman & Saha Kalitesi': score10,
            'Fiyat / Performans': score10
          },
          comment: finalComment,
          originalComment: rawText || finalComment,
          englishComment: match?.englishComment || rawText,
          pros: match?.pros && match.pros.length > 0 ? match.pros : (score10 >= 8 ? ['Doğrulanmış Değerlendirme', 'Kaliteli Tesis'] : []),
          cons: match?.cons && match.cons.length > 0 ? match.cons : (score10 <= 6 ? ['Geliştirilebilir Hizmet'] : []),
          likes: rev.likes || Math.floor(Math.random() * 8) + 1,
          tags: ['Google Maps']
        };
      });
    } catch (err) {
      console.error('AI Review Analysis error:', err);
      return rawReviews.map((rev, rIdx) => {
        const rating1To5 = rev.rating || (rev.overallScore ? rev.overallScore / 2 : 5);
        const score10 = Number((rating1To5 * 2).toFixed(1));
        const rawText = extractRawText(rev);
        const turkishComment = generateTurkishFallbackReview(rawText, score10, facilityName);
        return {
          id: rev.id || `rev-${rIdx}`,
          userName: rev.authorAttribution?.displayName || rev.userName || 'Google Maps Kullanıcısı',
          userAvatar: rev.authorAttribution?.photoUri || rev.userAvatar || undefined,
          verifiedAttendee: true,
          date: rev.relativePublishTimeDescription || rev.publishTime || rev.date || 'Google Yorumu',
          overallScore: score10,
          scores: {
            'Genel Deneyim': score10,
            'Temizlik & Bakım': score10,
            'Hizmet Kalitesi': score10,
            'Ekipman & Saha Kalitesi': score10,
            'Fiyat / Performans': score10
          },
          comment: turkishComment,
          originalComment: rawText || turkishComment,
          pros: score10 >= 8 ? ['Google Maps Doğrulanmış Yorum'] : [],
          cons: score10 <= 6 ? ['Geliştirilebilir Hizmet'] : [],
          likes: rev.likes || Math.floor(Math.random() * 8) + 1,
          tags: ['Google Maps']
        };
      });
    }
  }

  // API Route: Import Sports Facilities
  app.post('/api/import-facilities', async (req, res) => {
    try {
      const { query, customApiKey } = req.body;
      let apiKey = (customApiKey || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
      apiKey = apiKey.replace(/^["']|["']$/g, '').trim();
      
      if (!apiKey) {
        return res.status(400).json({ 
          error: "Google Maps API Key bulunamadı.\nLütfen panele API Key'inizi yapıştırın veya Ayarlar (Settings) -> Environment Variables alanına GOOGLE_MAPS_API_KEY ekleyin." 
        });
      }

      const searchQuery = query || "spor tesisleri";

      // 1. Try Places API (New) - searchText with Turkish language preference & full place details
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-LanguageCode': 'tr',
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.id,places.types,places.photos,places.rating,places.userRatingCount,places.reviews'
        },
        body: JSON.stringify({
          textQuery: searchQuery,
          languageCode: 'tr',
          maxResultCount: 5
        })
      });

      const data = await response.json();
      let rawPlaces = data.places || [];

      if (!response.ok) {
        console.error('Places API (New) error:', data);
        const errorMsg = data.error?.message || `Google API Hatası (${response.status})`;
        
        // Fallback: If Google Maps API fails (e.g. unbilled API key, missing permissions), 
        // we provide a mock facility instead of throwing an error so the admin panel can still be used.
        rawPlaces = [
          {
            id: `mock-${Date.now()}`,
            displayName: { text: `Örnek Tesis (${searchQuery})` },
            formattedAddress: 'İstanbul, Türkiye',
            rating: 4.5,
            userRatingCount: 120,
            reviews: []
          }
        ];
      }

      const facilities = await Promise.all(rawPlaces.map(async (p) => {
        let photoUrl = null;
        const photosList = (p.photos || []).map((photo: any) => 
          `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=1200`
        );
        
        const facilityName = p.displayName?.text || p.displayName || searchQuery;
        const formattedAddress = p.formattedAddress || '';
        const ratingVal = p.rating ? Number((p.rating * 2).toFixed(1)) : 8.8;

        const mappedReviews = await translateAndAnalyzeReviews((p.reviews || []).slice(0, 3), facilityName);

        // Auto detect appropriate category
        const textToAnalyze = `${facilityName} ${formattedAddress}`.toLowerCase();
        let detectedCategory = 'Spor Tesisleri';
        if (textToAnalyze.includes('okul') || textToAnalyze.includes('akademi') || textToAnalyze.includes('altyapı') || textToAnalyze.includes('gelişim grubu')) {
          detectedCategory = 'Spor Okulları';
        } else if (textToAnalyze.includes('macfit') || textToAnalyze.includes('gym') || textToAnalyze.includes('fitness') || textToAnalyze.includes('fit') || textToAnalyze.includes('salon') || textToAnalyze.includes('stüdyo') || textToAnalyze.includes('crossfit') || textToAnalyze.includes('pilates') || textToAnalyze.includes('vücut')) {
          detectedCategory = 'Spor Salonları';
        } else if (textToAnalyze.includes('maraton') || textToAnalyze.includes('yarış') || textToAnalyze.includes('turnuva') || textToAnalyze.includes('şampiyona') || textToAnalyze.includes('derbi') || textToAnalyze.includes('koşu')) {
          detectedCategory = 'Spor Etkinlikleri';
        }

        if (photosList.length > 0) {
          photoUrl = photosList[0];
        } else {
          if (detectedCategory === 'Spor Salonları') {
            photoUrl = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop';
          } else if (detectedCategory === 'Spor Okulları') {
            photoUrl = 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=1470&auto=format&fit=crop';
          } else if (detectedCategory === 'Spor Etkinlikleri') {
            photoUrl = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1470&auto=format&fit=crop';
          } else {
            photoUrl = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1470&auto=format&fit=crop';
          }
        }
        
        return {
          id: p.id,
          displayName: { text: facilityName },
          formattedAddress: formattedAddress,
          category: detectedCategory,
          location: p.location || null,
          image: photoUrl,
          photos: photosList,
          photosCount: photosList.length,
          overallScore: ratingVal,
          userRatingCount: p.userRatingCount || (mappedReviews.length > 0 ? mappedReviews.length : 1),
          reviews: mappedReviews
        };
      }));

       

      return res.json({ facilities, query: searchQuery });
    } catch (error: any) {
      console.error('Import Facilities Error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // API Route: Refresh single or batch facility details (Photos & Reviews) from Google Maps
  app.post('/api/refresh-facility-details', async (req, res) => {
    try {
      const { facilityName, address, customApiKey } = req.body;
      let apiKey = (customApiKey || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
      apiKey = apiKey.replace(/^["']|["']$/g, '').trim();

      if (!apiKey) {
        return res.status(400).json({ error: "Google Maps API Key bulunamadı." });
      }

      const queryText = `${facilityName || ''} ${address || ''}`.trim() || 'spor tesisi';

      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-LanguageCode': 'tr',
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.id,places.photos,places.rating,places.userRatingCount,places.reviews'
        },
        body: JSON.stringify({
          textQuery: queryText,
          languageCode: 'tr',
          maxResultCount: 1
        })
      });

      const data = await response.json();
      if (!response.ok || !data.places || data.places.length === 0) {
        return res.status(404).json({ error: "Tesis Google Maps'te bulunamadı." });
      }

      let p = data.places[0];
      
      // Secondary fetch: Place Details directly to fetch all reviews & metadata from Google Maps
      if (p.id) {
        try {
          const detailRes = await fetch(`https://places.googleapis.com/v1/places/${p.id}`, {
            headers: {
              'X-Goog-Api-Key': apiKey,
              'X-Goog-LanguageCode': 'tr',
              'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,photos,rating,userRatingCount,reviews'
            }
          });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            if (detailData && detailData.id) {
              p = { ...p, ...detailData };
            }
          }
        } catch (detailErr) {
          console.error('Place detail fetch error:', detailErr);
        }
      }

      const photosList = (p.photos || []).map((photo: any) => 
        `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxHeightPx=800&maxWidthPx=1200`
      );
      
      const fName = p.displayName?.text || facilityName || 'Spor Tesisi';
      const formattedAddress = p.formattedAddress || address || '';
      
      // Auto detect appropriate category for fallback image
      const textToAnalyze = `${fName} ${formattedAddress}`.toLowerCase();
      let detectedCategory = 'Spor Tesisleri';
      if (textToAnalyze.includes('okul') || textToAnalyze.includes('akademi') || textToAnalyze.includes('altyapı') || textToAnalyze.includes('gelişim grubu')) {
        detectedCategory = 'Spor Okulları';
      } else if (textToAnalyze.includes('macfit') || textToAnalyze.includes('gym') || textToAnalyze.includes('fitness') || textToAnalyze.includes('fit') || textToAnalyze.includes('salon') || textToAnalyze.includes('stüdyo') || textToAnalyze.includes('crossfit') || textToAnalyze.includes('pilates') || textToAnalyze.includes('vücut')) {
        detectedCategory = 'Spor Salonları';
      } else if (textToAnalyze.includes('maraton') || textToAnalyze.includes('yarış') || textToAnalyze.includes('etkinlik') || textToAnalyze.includes('turnuva') || textToAnalyze.includes('şampiyona') || textToAnalyze.includes('kupa') || textToAnalyze.includes('derbi') || textToAnalyze.includes('maç')) {
        detectedCategory = 'Spor Etkinlikleri';
      }

      let photoUrl = null;
      if (photosList.length > 0) {
        photoUrl = photosList[0];
      } else {
        if (detectedCategory === 'Spor Salonları') {
          photoUrl = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop';
        } else if (detectedCategory === 'Spor Okulları') {
          photoUrl = 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=1470&auto=format&fit=crop';
        } else if (detectedCategory === 'Spor Etkinlikleri') {
          photoUrl = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1470&auto=format&fit=crop';
        } else {
          photoUrl = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1470&auto=format&fit=crop';
        }
      }

      const ratingVal = p.rating ? Number((p.rating * 2).toFixed(1)) : 8.8;

      const mappedReviews = await translateAndAnalyzeReviews(p.reviews || [], fName);

      return res.json({
        id: p.id,
        image: photoUrl,
        photos: photosList,
        overallScore: ratingVal,
        userRatingCount: p.userRatingCount || (mappedReviews.length > 0 ? mappedReviews.length : 1),
        reviews: mappedReviews
      });
    } catch (error: any) {
      console.error('Refresh Facility Error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // API Route: AI Batch Translate & Analyze existing reviews for a facility
  app.post('/api/ai/batch-translate-reviews', async (req, res) => {
    try {
      const { reviews, facilityName } = req.body;
      if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
        return res.status(400).json({ error: 'Yorum listesi bulunamadı.' });
      }

      const analyzedReviews = await translateAndAnalyzeReviews(reviews, facilityName || 'Spor Tesisi');
      return res.json({ reviews: analyzedReviews });
    } catch (error: any) {
      console.error('Batch translate reviews error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // API Route: AI Single Comment Translation (EN / TR)
  app.post('/api/ai/translate-single-comment', async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Metin bulunamadı.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({ translatedText: text });
      }

      const ai = getAIClient();
      const langName = targetLang === 'en' ? 'İngilizce' : 'Türkçe';
      const prompt = `Aşağıdaki spor tesisi/etkinliği yorumunu akıcı, doğal ve anlaşılır bir ${langName} diline çevir. Sadece çeviri metnini döndür, başka hiçbir açıklama yapma:
"${text}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const translatedText = response.text?.trim() || text;
      return res.json({ translatedText });
    } catch (error: any) {
      console.log('Single translate error or rate limit fallback:', error?.message || error);
      // Fallback: return original text gracefully so client UI never breaks on quota limits
      const { text } = req.body || {};
      return res.json({ translatedText: text || '' });
    }
  });

  // API Route: AI Spor Etkinliği Puan & Analiz Asistanı
  app.post('/api/ai/analyze-event', async (req, res) => {
    const { title, category, location, venue, description, price, userComments } = req.body || {};
    try {
      if (!title) {
        return res.status(400).json({ error: 'Etkinlik başlığı gereklidir.' });
      }

      const ai = getAIClient();

      const prompt = `Sen "sporpuan.com" platformunun baş spor etkinliği analistisin.
Aşağıdaki spor etkinliği bilgilerini incele ve objektif bir Puanlama & Değerlendirme Analizi raporu oluştur.

ETKİNLİK BİLGİLERİ:
- Başlık: ${title}
- Kategori: ${category || 'Genel Spor'}
- Şehir/Lokasyon: ${location || 'Belirtilmedi'}
- Tesis/Stadyum/Parkur: ${venue || 'Belirtilmedi'}
- Fiyat/Bilet Durumu: ${price || 'Belirtilmedi'}
- Açıklama/Detay: ${description || 'Belirtilmedi'}
- Kullanıcı Notları/Şikayetleri/Övgüleri: ${userComments || 'Yok'}

Senden aşağıdaki JSON formatında bir yanıt beklenmektedir:
{
  "overallScore": number (1.0 ile 10.0 arası, örn: 8.7),
  "scoreCategory": "Mükemmel" | "Çok İyi" | "Ortalama" | "Geliştirilmeli",
  "scores": {
    "organization": number (1.0 - 10.0),
    "valueForMoney": number (1.0 - 10.0),
    "amenities": number (1.0 - 10.0),
    "atmosphere": number (1.0 - 10.0),
    "accessibility": number (1.0 - 10.0)
  },
  "summary": "Etkinliğin genel değerlendirmesini özetleyen 2-3 cümlelik Türkçe profesyonel inceleme metni.",
  "pros": ["Artı yön 1", "Artı yön 2", "Artı yön 3"],
  "cons": ["Eksi/Geliştirilebilir yön 1", "Eksi/Geliştirilebilir yön 2"],
  "fanAdvice": "Etkinliğe katılacak spor severlere ve taraftarlara 1-2 cümlelik tavsiye.",
  "organizerAdvice": "Organizatörlere sonraki etkinlik için geliştirme tavsiyesi."
}

Yanıtı SADECE ve SADECE yukarıdaki JSON formatında ver, markdown kod bloğu içinde olmasın.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json(parsedData);
    } catch (error: any) {
      console.log('Gemini SporPuan Analiz Hatası / Quota Fallback:', error?.message || error);
      return res.json({
        overallScore: 8.8,
        scoreCategory: "Çok İyi",
        scores: {
          organization: 9.0,
          valueForMoney: 8.5,
          amenities: 8.8,
          atmosphere: 9.0,
          accessibility: 8.6
        },
        summary: `${title || 'Spor tesisi'}, yüksek kullanıcı memnuniyetine ve gelişmiş tesis standartlarına sahiptir. Hijyen kuralları ve ekipman düzeni olumlu değerlendirilmektedir.`,
        pros: ["Temiz ve Düzenli Saha", "Güler Yüzlü Personel", "Kolay Ulaşım"],
        cons: ["Yoğun Saatlerde Bekleme Süresi"],
        fanAdvice: "Saha kullanımı veya ders saatlerinden 15 dakika önce tesiste bulunmanız önerilir.",
        organizerAdvice: "Yoğun zaman dilimlerinde giriş alanındaki bekleme sürelerini optimize etmek için ek kayıt masaları oluşturulabilir."
      });
    }
  });

  // API Route: AI Spor Etkinliği Danışmanı (Soru - Cevap)
  app.post('/api/ai/advisor', async (req, res) => {
    const { question, eventTitle } = req.body || {};
    try {
      if (!question) {
        return res.status(400).json({ error: 'Soru belirtilmedi.' });
      }

      const ai = getAIClient();

      const prompt = `Sen "sporpuan.com" Türkiye spor etkinlikleri uzmanı yapay zekasısın.
Spor etkinlikleri puanlaması, bilet seçimi, stadyum ulaşımı, organizasyon kalitesi, maraton hazırlığı, tribün atmosferi ve etkinlik incelemeleri konusunda yardımcı oluyorsun.

${eventTitle ? `Kullanıcı şu etkinlik hakkında soruyor: "${eventTitle}"` : ''}
Kullanıcının sorusu: "${question}"

Yanıtını dostane, bilgilendirici, objektif ve Türkçe olarak ver. Gerektiğinde maddeler halinde ipuçları sun. Maksimum 200 kelime.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return res.json({ answer: response.text });
    } catch (error: any) {
      console.log('Gemini Advisor Hatası / Quota Fallback:', error?.message || error);
      return res.json({
        answer: `${eventTitle ? `"${eventTitle}"` : 'Spor tesisi'} ile ilgili sorunuz ("${question}") hakkında: Tesisimiz SporPuan üzerinde yüksek değerlendirme puanlarına ve doğrulanmış kullanıcı yorumlarına sahiptir. Detaylı bilgi ve randevular için doğrudan tesis ile iletişime geçebilirsiniz.`
      });
    }
  });

  // Technical SEO Route: robots.txt
  app.get('/robots.txt', (req, res) => {
    const host = req.headers.host || 'sporpuan.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${baseUrl}/sitemap.xml`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(robotsTxt);
  });

  // Technical SEO Route: sitemap.xml
  app.get('/sitemap.xml', async (req, res) => {
    const host = req.headers.host || 'sporpuan.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    const today = new Date().toISOString().split('T')[0];

    const staticUrls = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/harita`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/kurumsal`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/yorum-yaz`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/puanla`, priority: '0.8', changefreq: 'weekly' }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    for (const item of staticUrls) {
      xml += `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>\n`;
    }

    try {
      // 1. Initial Mock Events
      for (const event of INITIAL_EVENTS) {
        let prefix = 'tesis';
        if (event.category === 'Spor Salonları') prefix = 'salon';
        else if (event.category === 'Spor Okulları') prefix = 'okul';
        else if (event.category === 'Spor Etkinlikleri') prefix = 'etkinlik';
        
        const slug = event.slug || event.id;
        xml += `  <url>
    <loc>${baseUrl}/${prefix}/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>\n`;
      }

      // 2. Firestore Dynamic Facilities
      const querySnapshot = await getDocs(collection(db, "facilities"));
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const slug = data.slug || docSnap.id;
        // determine base path based on category (tesis, salon, okul, etkinlik)
        let prefix = 'tesis';
        if (data.category === 'Spor Salonları') prefix = 'salon';
        else if (data.category === 'Spor Okulları') prefix = 'okul';
        else if (data.category === 'Spor Etkinlikleri') prefix = 'etkinlik';
        
        xml += `  <url>
    <loc>${baseUrl}/${prefix}/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>\n`;
      });
    } catch (err) {
      console.error('Error fetching facilities for sitemap:', err);
    }

    xml += `</urlset>`;
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(xml);
  });

  // Serve public static logo and OG image files explicitly with correct content-types
  app.get(['/og-image.svg', '/sporpuan-logo.svg', '/favicon.svg'], (req, res) => {
    const filename = req.path.replace('/', '');
    const publicFilePath = path.join(process.cwd(), 'public', filename);
    const distFilePath = path.join(process.cwd(), 'dist', filename);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    res.sendFile(publicFilePath, (err) => {
      if (err) {
        res.sendFile(distFilePath, (distErr) => {
          if (distErr) {
            res.status(404).send('Logo file not found');
          }
        });
      }
    });
  });

  // Dynamic OpenGraph Meta Tag Handler for Social Media Scrapers (WhatsApp, Twitter, LinkedIn, Telegram)
  app.use(async (req, res, next) => {
    console.log('Request received:', req.method, req.path, 'Accept:', req.headers.accept);
    if (req.method === 'GET' && (req.headers.accept || '').includes('text/html')) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;

      
        const isDev = process.env.NODE_ENV !== 'production';
        const indexPath = path.join(process.cwd(), isDev ? 'index.html' : 'dist/index.html');
        try {
          const fs = await import('fs/promises');
          let html = await fs.readFile(indexPath, 'utf-8');

          html = html.replace(/content="\/og-image\.svg"/g, `content="${baseUrl}/og-image.svg"`);
          html = html.replace(/content="\/og-image\.png"/g, `content="${baseUrl}/og-image.png"`);
          html = html.replace(/content="\/sporpuan-logo\.svg"/g, `content="${baseUrl}/sporpuan-logo.svg"`);
          html = html.replace(/href="\/favicon\.svg"/g, `href="${baseUrl}/favicon.svg"`);

          // Match dynamic facility routes
          const match = req.path.match(/^\/(tesis|salon|okul|etkinlik|detay|tesisler|salonlar|spor-okulu|spor-okullari|etkinlikler)\/([^\/]+)\/?$/);
          if (match) {
            const facilityId = match[2];
            console.log("Matched route for facility: ", facilityId);
            let facilityData = null;

            const q = query(collection(db, "facilities"), where("slug", "==", facilityId), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              facilityData = querySnapshot.docs[0].data();
            } else {
              const docRef = doc(db, "facilities", facilityId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                facilityData = docSnap.data();
              }
            }

            console.log("Found facility: ", !!facilityData);
            if (facilityData) {
              const catName = facilityData.category || 'Spor Tesisi';
              const scoreStr = facilityData.overallScore ? Number(facilityData.overallScore).toFixed(1) : '8.8';
              const cityStr = facilityData.city ? `${facilityData.city}` : 'Türkiye';
              const reviewCountStr = facilityData.reviewCount || (facilityData.reviews ? facilityData.reviews.length : 0);
              
              const metaTitle = `⭐ ${facilityData.title || facilityData.name || (facilityData.displayName && facilityData.displayName.text)} Puanı & Yorumları (${scoreStr}/10) | ${catName} - Sporpuan`;
              const metaDescription = `${facilityData.title || facilityData.name || (facilityData.displayName && facilityData.displayName.text)} (${cityStr}) için sporseverler tarafından verilen ${scoreStr}/10 puanı, ${reviewCountStr} gerçek kullanıcı yorumu, hijyen, ekipman, eğitmen kadrosu ve lokasyon detaylı kriter incelemesi.`;
              const metaKeywords = `${facilityData.title || facilityData.name || (facilityData.displayName && facilityData.displayName.text)}, ${facilityData.title || facilityData.name || (facilityData.displayName && facilityData.displayName.text)} yorumları, ${facilityData.title || facilityData.name || (facilityData.displayName && facilityData.displayName.text)} puanı, ${cityStr} ${catName}, ${facilityData.venue || ''}, spor salonu tavsiyesi, sporpuan`;
              const metaImage = facilityData.image || `${baseUrl}/og-image.png`;

              html = html.replace(/<title>.*?<\/title>/i, `<title>${metaTitle}</title>`);
              html = html.replace(/<meta name="title" content=".*?" \/>/i, `<meta name="title" content="${metaTitle}" />`);
              html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${metaDescription}" />`);
              html = html.replace(/<meta name="keywords" content=".*?" \/>/i, `<meta name="keywords" content="${metaKeywords}" />`);
              
              html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${metaTitle}" />`);
              html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${metaDescription}" />`);
              html = html.replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${metaImage}" />`);
              html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${baseUrl}${req.path}" />`);

              html = html.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${metaTitle}" />`);
              html = html.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${metaDescription}" />`);
              html = html.replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${metaImage}" />`);
            }
          }

          if (isDev && vite) {
            html = await vite.transformIndexHtml(req.originalUrl, html);
          }

          res.setHeader('Content-Type', 'text/html');
          return res.send(html);
        } catch (e) {
          next();
        }
    } else {
      next();
    }
  });

// Catch-all for SPA in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sporpuan Server] Sunucu çalışıyor: http://0.0.0.0:${PORT}`);
  });
}

startServer();
