import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Heart, Mail, Instagram, Check, Building2, Trophy } from 'lucide-react';
import { LegalModal, LegalDocType } from './LegalModal';

interface FooterProps {
  onOpenSubmitEvent?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSubmitEvent }) => {
  const navigate = useNavigate();
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocType | null>(null);

  return (
    <>
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-12">
          
          {/* Brand Left */}
          <div className="md:col-span-3 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                  <Star className="w-full h-full text-blue-500 fill-blue-500" />
                  <Check className="absolute w-1/2 h-1/2 text-slate-950 stroke-[3]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-['Red_Hat_Display',_sans-serif] font-normal text-white text-2xl leading-none tracking-tight">
                    Spor<span className="text-blue-500 font-bold">puan</span>
                  </span>
                </div>
              </div>
              <p className="text-xs font-bold text-blue-400 tracking-wide">
                Türkiye'nin Bağımsız Spor Değerlendirme & İnceleme Platformu
              </p>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              Spor tesislerini, salonlarını, okullarını ve organizasyonlarını objektif kriterlerle inceliyor ve sporseverlerin güvenle keşfetmesini sağlıyoruz.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.instagram.com/sporpuan/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors border border-slate-800 hover:border-blue-600">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-bold text-white tracking-wide text-sm">Kategoriler</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Spor Tesisleri</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Spor Salonları</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Spor Okulları</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Spor Etkinlikleri</a></li>
              <li><button type="button" onClick={() => { window.scrollTo(0, 0); navigate('/harita'); }} className="hover:text-blue-400 transition-colors text-left">Sporpuan Haritası</button></li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-bold text-white tracking-wide text-sm">Kurumsal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => setActiveLegalDoc('terms')} className="hover:text-blue-400 transition-colors text-left">Kullanım Şartları</button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveLegalDoc('privacy')} className="hover:text-blue-400 transition-colors text-left">Gizlilik Politikası</button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveLegalDoc('kvkk')} className="hover:text-blue-400 transition-colors text-left">KVKK Aydınlatma Metni</button>
              </li>
              <li>
                <button type="button" onClick={() => { window.scrollTo(0, 0); navigate('/certified'); }} className="hover:text-blue-400 transition-colors text-left flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sporpuan Certified</span>
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { window.scrollTo(0, 0); navigate('/kurumsal'); }} className="hover:text-blue-400 transition-colors text-left font-semibold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kurumsal Üyelik</span>
                </button>
              </li>
              <li>
                <div className="flex items-center gap-1.5 text-slate-500 cursor-not-allowed">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Sporpuan Ödüller</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Yakında</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Destek / İletişim */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-bold text-white tracking-wide text-sm">Destek</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="mailto:iletisim@sporpuan.com" className="hover:text-blue-400 transition-colors">İletişim</a></li>
              <li>
                <button type="button" onClick={() => { window.scrollTo(0, 0); navigate('/tesis-oner'); }} className="hover:text-blue-400 transition-colors text-left">Tesis Öner</button>
              </li>
            </ul>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mt-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-slate-400">
                  Tüm değerlendirmeler gerçek sporcu ve sporseverler tarafından yapılmaktadır.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span>© {new Date().getFullYear()} Sporpuan. Tüm hakları saklıdır.</span>
            <span className="hidden md:inline text-slate-700">|</span>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('terms')}
              className="hover:text-white transition"
            >
              Kullanım Koşulları
            </button>
            <span className="hidden md:inline text-slate-700">|</span>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('privacy')}
              className="hover:text-white transition"
            >
              Gizlilik Politikası
            </button>
            <span className="hidden md:inline text-slate-700">|</span>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('kvkk')}
              className="hover:text-white transition"
            >
              KVKK Metni
            </button>
          </div>
          
          <span className="flex items-center gap-1.5 font-medium text-slate-500">
            Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> by 
            <a href="https://sporsepeti.com.tr" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-blue-400 transition font-bold">
              sporsepeti
            </a>
          </span>
        </div>
      </footer>

      {/* Legal Modal View */}
      {activeLegalDoc && (
        <LegalModal
          initialDoc={activeLegalDoc}
          onClose={() => setActiveLegalDoc(null)}
        />
      )}
    </>
  );
};
