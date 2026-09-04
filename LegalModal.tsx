import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, Eye, CheckCircle2 } from 'lucide-react';

export type LegalDocType = 'terms' | 'privacy' | 'kvkk';

interface LegalModalProps {
  initialDoc?: LegalDocType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  initialDoc = 'terms',
  onClose,
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] text-slate-800 dark:text-slate-100 transition-colors duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Yasal Bilgilendirme & Sözleşmeler
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                sporpuan platformu kullanım kuralları ve veri politikaları
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-850 p-1.5 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveDoc('terms')}
            className={`flex-1 py-2.5 px-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeDoc === 'terms'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Kullanım Şartları</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc('privacy')}
            className={`flex-1 py-2.5 px-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeDoc === 'privacy'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Gizlilik Politikası</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDoc('kvkk')}
            className={`flex-1 py-2.5 px-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap ${
              activeDoc === 'kvkk'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>KVKK Aydınlatma Metni</span>
          </button>
        </div>

        {/* Modal Scrollable Document Content */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 dark:text-slate-300 text-sm space-y-6 leading-relaxed">
          {activeDoc === 'terms' && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100">Kullanım Şartları Sözleşmesi</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Son Güncelleme: 1 Ağustos 2026</p>
              </div>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">1. Taraflar ve Amaç</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Bu Kullanım Şartları ("Sözleşme"), <strong>sporpuan</strong> platformunu ("Platform") ziyaret eden, üye olan veya platform üzerinden spor tesisleri, spor okulları ve organizasyonlar hakkında değerlendirme, yorum ve puanlama yapan tüm kullanıcılar ("Kullanıcı") için geçerlidir. Platformun amacı Türkiye'deki spor alanlarının bağımsız ve objektif standartlar çerçevesinde derecelendirilmesidir.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">2. Üyelik ve Hesap Güvenliği</h5>
                <ul className="list-disc pl-5 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Kullanıcı, kayıt oluştururken verdiği bilgilerin doğru ve güncel olduğunu kabul ve taahhüt eder.</li>
                  <li>Hesap şifresinin güvenliği tamamen kullanıcının sorumluluğundadır. Yetkisiz erişim şüphesinde derhal bildirim yapılmalıdır.</li>
                  <li>Platform, yanıltıcı veya uygunsuz bilgi veren hesapları askıya alma veya sonlandırma hakkını saklı tutar.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">3. Değerlendirme ve İçerik Kuralları</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Sporpuan üzerinde paylaşılan tüm inceleme, artı/eksi seçimleri ve yıldız puanlamalarında aşağıdaki ilkelere uyulmalıdır:
                </p>
                <ul className="list-disc pl-5 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <li><strong>Objektiflik:</strong> Yorumlar gerçek deneyimlere dayanmalı, haksız rekabet oluşturacak karalama veya sahte olumlu yorum amaçlanmamalıdır.</li>
                  <li><strong>Nezaket ve Saygı:</strong> Hakaret, sövgü, nefret söylemi, ayrımcılık veya kişilik haklarını ihlal eden ifadeler kesinlikle yasaktır.</li>
                  <li><strong>Moderasyon:</strong> sporpuan yönetimi, topluluk kurallarına aykırı yorumları bildirim yapmaksızın silme veya düzenleme hakkına sahiptir.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">4. Fikri Mülkiyet Hakları</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Platformda yer alan marka logosu, arayüz tasarımı, veritabanı mimarisi, puanlama algoritmaları ve derlenen verilerin tüm hakları sporpuan'a aittir. İzin alınmaksızın kopyalanamaz veya ticari amaçla çekilemez (scraping).
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">5. Sorumluluk Sınırlaması</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  sporpuan, tesisler veya organizatörler tarafından sunulan hizmetlerin kalitesinden veya etkinlik iptallerinden doğrudan sorumlu tutulamaz. Platform, sporseverler arasında bilgi paylaşımını sağlayan tarafsız bir mecradır.
                </p>
              </section>
            </div>
          )}

          {activeDoc === 'privacy' && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100">Gizlilik Politikası ve Bildirimi</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Son Güncelleme: 1 Ağustos 2026</p>
              </div>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">1. Veri Gizliliği Taahhüdümüz</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  sporpuan olarak kişisel verilerinizin gizliliğine son derece önem veriyoruz. Bu politika, platformumuzu kullanırken hangi verilerinizin toplandığını, nasıl kullanıldığını ve korunduğunu açıklar.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">2. Toplanan Veri Türleri</h5>
                <ul className="list-disc pl-5 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <li><strong>Hesap Bilgileri:</strong> Ad-soyad, e-posta adresi, profil fotoğrafı ve kullanıcı rolü.</li>
                  <li><strong>Etkileşim Verileri:</strong> Yapılan puanlamalar, yazılan yorumlar, işaretlenen artı/eksi kriterleri ve favori tesisler.</li>
                  <li><strong>Konum Bilgileri:</strong> İzniniz dahilinde yakındaki spor tesislerini haritada göstermek amacıyla kullanılan anlık konum verisi.</li>
                  <li><strong>Teknik Veriler:</strong> IP adresi, tarayıcı türü, erişim zamanları ve cihaz işletim sistemi.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">3. Verilerin Kullanım Amaçları</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Toplanan veriler; kullanıcılara kişiselleştirilmiş spor deneyimi sunmak, güvenilir derecelendirme indeksleri oluşturmak, sahte puanlamaların önüne geçmek ve teknik destek sağlamak amacıyla işlenir.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">4. Çerezler (Cookies) ve Oturum Yapısı</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Oturumunuzun açık kalması ve tercihlerinizin hatırlanması için zorunlu ve performans çerezleri kullanılmaktadır. Tarayıcı ayarlarınızdan çerezleri dilediğiniz zaman kısıtlayabilirsiniz.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">5. Veri Güvenliği ve Paylaşım</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Verileriniz güvenli sunucularda saklanmakta ve SSL şifreleme protokolleri ile korunmaktadır. Kişisel verileriniz hiçbir koşulda 3. taraf reklam şirketlerine satılmaz veya devredilmez.
                </p>
              </section>
            </div>
          )}

          {activeDoc === 'kvkk' && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100">KVKK Aydınlatma Metni</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında</p>
              </div>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">1. Veri Sorumlusu</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz; veri sorumlusu sıfatıyla <strong>sporpuan Platformu</strong> tarafından aşağıda açıklanan kapsamda işlenebilecektir.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">2. Kişisel Verilerin İşlenme Amaçları</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Kişisel verileriniz KVKK’nın 5. ve 6. maddelerinde belirtilen şartlara uygun olarak;
                </p>
                <ul className="list-disc pl-5 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Platform üyelik süreçlerinin yürütülmesi ve kullanıcı kimliğinin doğrulanması,</li>
                  <li>Spor tesisi ve etkinlik değerlendirme hizmetlerinin sunulması,</li>
                  <li>Platform güvenliğinin ve içerik doğruluğunun sağlanması,</li>
                  <li>Hukuki yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">3. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Verileriniz elektronik ortamda, üyelik formları, oturum açma sağlayıcıları (Google/Apple) ve platform üzerindeki hareketleriniz vasıtasıyla toplanmaktadır. Hukuki sebebi; KVKK m. 5/2-c (Sözleşmenin kurulması veya ifası) ve m. 5/2-f (Veri sorumlusunun meşru menfaati) maddeleridir.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">4. İlgili Kişinin Hakları (KVKK Madde 11)</h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Kişisel veri sahipleri olarak aşağıdaki haklara sahipsiniz:
                </p>
                <ul className="list-disc pl-5 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
                  <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</li>
                  <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                  <li>Eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme,</li>
                  <li>KVKK m. 7 çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme.</li>
                </ul>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
                  Taleplerinizi <span className="text-blue-600 dark:text-blue-400 font-bold">kvkk@sporpuan.com</span> adresine e-posta göndererek iletebilirsiniz.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Güvenli ve şeffaf spor deneyimi</span>
          </div>

          <button
            onClick={onClose}
            className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-xs font-extrabold rounded-xl transition shadow-xs"
          >
            Okudum, Anladım
          </button>
        </div>

      </div>
    </div>
  );
};
