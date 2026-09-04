import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, onAuthStateChanged } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { SEOHead } from '../components/SEOHead';
import { ArrowLeft, Send, Trophy, Wallet, Zap, Building } from 'lucide-react';

export const SuggestFacilityPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [facilityName, setFacilityName] = useState('');
  const [category, setCategory] = useState('tesis');
  const [details, setDetails] = useState('');
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // On mount, check if there is saved data in sessionStorage
  useEffect(() => {
    const savedData = sessionStorage.getItem('suggestFacilityData');
    if (savedData) {
      try {
        const { facilityName, category, details } = JSON.parse(savedData);
        setFacilityName(facilityName);
        setCategory(category);
        setDetails(details);
        sessionStorage.removeItem('suggestFacilityData');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if auth is still initializing
    if (loading) {
       alert('Lütfen bekleyin, sistem hazırlanıyor.');
       return;
    }

    // Get the latest auth state directly from Firebase
    const currentUser = auth.currentUser;
    console.log('Submission attempt. User logged in:', !!currentUser);
    
    if (!currentUser) {
        // Not logged in
        sessionStorage.setItem('suggestFacilityData', JSON.stringify({ facilityName, category, details }));
        alert('Öneri yapabilmek için lütfen giriş yapın.');
        navigate('/'); // Redirect to home
        return;
    }
    
    // Proceed with submission
    try {
        await addDoc(collection(db, 'facility_suggestions'), {
            facilityName,
            category,
            details,
            userEmail: currentUser.email,
            createdAt: new Date().toISOString(),
            status: 'pending'
        });
        setSubmitted(true);
    } catch (e) {
        console.error(e);
        alert('Bir hata oluştu, lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 relative overflow-hidden">
      {/* Visual background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]" style={{ 
        backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', 
        backgroundSize: '24px 24px' 
      }}></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <SEOHead title="Tesis Öner" description="Sitemizde olmayan bir spor tesisini, spor okulunu veya etkinliği bize önerin." />
      
      <div className="max-w-5xl mx-auto relative z-10">

        {submitted ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-lg">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Öneriniz Alındı!</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 max-w-md mx-auto">
              Tesis öneriniz ekibimize ulaştı. İncelemelerimiz sonucunda uygun olan tesisleri platformumuza ekleyerek Sporpuan bakiyenizi artıracağız.
            </p>
            <button 
              onClick={() => navigate('/')} 
              className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Öner, <span className="text-blue-600">Sporpuan Kazan</span></h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sitemizde yer almayan spor tesislerini bize bildirerek keşfedilmelerini sağla. Her onaylanan önerin için hesabına <strong>Sporpuan</strong> yükleyelim, kazandığın puanları üyeliklerinde ve özel fırsatlarda harca.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Keşfet ve Öner</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Favori tesislerini, spor salonlarını veya etkinlik alanlarını eklememizi sağla.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Sporpuan Kazan</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Önerdiğin her yeni tesis için profilinde Sporpuan biriktir.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-2xl text-green-600 dark:text-green-400 shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Üyeliklerinde Kullan</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Biriken puanlarınla üyelik ödemelerinde indirimler kazan.</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full w-fit">
                <Zap className="w-4 h-4" />
                <span>Hızlı Öneri Formu</span>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tesisin Adı</label>
                <input 
                  type="text" 
                  required 
                  value={facilityName} 
                  onChange={(e) => setFacilityName(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 transition outline-none" 
                  placeholder="Örn: X Spor Kompleksi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Kategori</label>
                <select 
                  required 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 transition outline-none"
                >
                  <option value="tesis">Tesis</option>
                  <option value="spor-okulu">Spor Okulu</option>
                  <option value="spor-salonu">Spor Salonu</option>
                  <option value="etkinlik">Etkinlik</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Detaylar / Konum Bilgisi</label>
                <textarea 
                  required 
                  rows={4} 
                  value={details} 
                  onChange={(e) => setDetails(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 transition outline-none"
                  placeholder="Konum, tesis hakkında kısa bir not..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={loading || !user}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-all text-lg shadow-lg disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {loading ? 'Yükleniyor...' : 'Öneriyi Gönder'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
