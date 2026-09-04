import { Avatar } from './Avatar';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Search, 
  MapPin, 
  PlusCircle, 
  Sparkles, 
  BarChart3, 
  Star,
  Check,
  CheckCircle2,
  Share2,
  Map,
  ShieldCheck,
  Sun,
  Moon,
  Settings,
  Menu,
  X,
  Home,
  Phone
} from 'lucide-react';
import { SportsCategory, UserProfile, UserRole } from '../types';
import { User, LogOut, LogIn, UserPlus, Building2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCity: string;
  setSelectedCity: (c: string) => void;
  selectedCategory: SportsCategory;
  setSelectedCategory: (cat: SportsCategory) => void;
  onOpenAddReview: () => void;
  onOpenSubmitEvent: () => void;
  onOpenMapView: () => void;
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  cities: string[];
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCity,
  setSelectedCity,
  selectedCategory,
  setSelectedCategory,
  onOpenAddReview,
  onOpenSubmitEvent,
  onOpenMapView,
  currentUser,
  onOpenAuthModal,
  onLogout,
  cities,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleShareBrand = () => {
    navigator.clipboard.writeText('https://sporpuan.com');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleResetHome = () => {
    setSearchQuery('');
    setSelectedCity('Tüm Şehirler');
    setSelectedCategory('Tümü');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            
            {/* Brand Logo - Clean Soft Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleResetHome} className="flex items-center gap-3 group text-left">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <Star className="w-full h-full text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                  <Check className="absolute w-1/2 h-1/2 text-white dark:text-slate-900 stroke-[3]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-['Red_Hat_Display',_sans-serif] font-normal text-[#0056b3] dark:text-blue-400 text-[26px] sm:text-[30px] leading-[30px]">
                      Sporpuan
                    </span>
                  </div>
                </div>
              </button>
            </div>

            
            {/* Desktop Right Actions Buttons */}
            <div className="hidden md:flex items-center gap-2">
              
              <button
                onClick={onOpenMapView}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition"
              >
                <Map className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Harita</span>
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleDarkMode}
                title={darkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
                className="p-2 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition active:scale-95"
                aria-label="Tema Değiştir"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400 fill-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              {/* Auth User Profile Section */}
              {currentUser ? (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 pr-2">
                  <Avatar src={currentUser.avatar} name={currentUser.name} className="w-7 h-7 rounded-lg object-cover border border-slate-300 dark:border-slate-600 shrink-0" />
                  <div className="hidden lg:flex flex-col min-w-0">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate leading-tight">
                      {currentUser.name}
                    </span>
                    <button 
                      onClick={() => navigate('/profil')}
                      className="text-[9px] font-bold text-blue-700 dark:text-blue-400 hover:underline text-left"
                    >
                      Profilim
                    </button>
                  </div>
                  
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => navigate('/admin')}
                      title="Yönetici Paneli"
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-950/80 rounded-lg transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={onLogout}
                    title="Oturumu Kapat"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenAuthModal()}
                    className="flex items-center gap-2.5 px-4 py-1.5 text-left bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-200 rounded-full transition-colors active:scale-95 shadow-xs"
                  >
                    <div className="flex flex-col -space-y-0.5">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight">Giriş Yap</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">veya üye ol</span>
                    </div>
                  </button>
                </div>
              )}



            </div>

            {/* Mobile Header Actions */}
            <div className="flex md:hidden items-center gap-1.5">
              {/* Mobile Theme Toggle Button */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 text-slate-700 dark:text-amber-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition flex items-center justify-center min-w-[42px] min-h-[42px]"
                aria-label="Tema Değiştir"
              >
                {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400 fill-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
              </button>

              {/* Mobile Menu Drawer Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition flex items-center justify-center min-w-[42px] min-h-[42px]"
                aria-label="Menü"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-900 dark:text-slate-100" /> : <Menu className="w-5 h-5 text-slate-900 dark:text-slate-100" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown / Drawer Menu */}
        <div className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300 origin-top overflow-hidden ${isMobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'}`}>
          <div className="p-4 space-y-6 max-h-[calc(100vh-80px)] overflow-y-auto pb-24">
            
            {/* User Section */}
            <div>
              {currentUser ? (
                 <div className="flex flex-col gap-3 bg-gradient-to-br from-blue-50/50 to-slate-50 dark:from-slate-800/80 dark:to-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar src={currentUser.avatar} name={currentUser.name} className="w-16 h-16 rounded-2xl object-cover border-[3px] border-white dark:border-slate-700 shadow-md" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-0.5">{currentUser.name}</p>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-100/50 dark:bg-blue-900/30 inline-block px-2.5 py-1 rounded-lg">
                          {currentUser.role === 'organizer' ? 'Organizatör' : currentUser.role === 'admin' ? 'Yönetici' : 'Sporsever'}
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-700/50 my-1"></div>
                    <button
                      onClick={() => { navigate('/profil'); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 py-3 text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition font-bold text-sm mb-2"
                      aria-label="Profilim"
                    >
                      <User className="w-4 h-4" />
                      Profilim
                    </button>
                    <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-700/50 my-1"></div>
                    <button
                      onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 py-3 text-rose-600 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition font-bold text-sm"
                      aria-label="Çıkış Yap"
                    >
                      <LogOut className="w-4.5 h-4.5" />
                      Çıkış Yap
                    </button>
                 </div>
              ) : (
                 <button
                    onClick={() => { onOpenAuthModal(); setIsMobileMenuOpen(false); }}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition"
                 >
                    <User className="w-5 h-5" />
                    <span>Giriş Yap / Üye Ol</span>
                 </button>
              )}
            </div>

            {/* Menu Links */}
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">Hızlı Menü</p>
              
              <button
                onClick={() => { onOpenMapView(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition font-semibold text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="flex-1 text-base">Harita Modu</span>
              </button>

              <button
                onClick={() => { onOpenAddReview(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition font-semibold text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </div>
                <span className="flex-1 text-base">Değerlendir / Puanla</span>
              </button>

              <button
                onClick={() => { window.scrollTo(0,0); navigate('/kurumsal'); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition font-semibold text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="flex-1 text-base">Kurumsal Üyelik</span>
              </button>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => { window.scrollTo(0,0); navigate('/admin'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition font-semibold text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="flex-1 text-base">Yönetici Paneli</span>
                </button>
              )}
            </div>

            {/* Contact */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
               <a
                  href="tel:02168501907"
                  className="flex items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-2xl transition active:scale-95 border border-blue-100 dark:border-slate-700 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider mb-0.5">Destek & İletişim</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">0216 850 19 07</span>
                    </div>
                  </div>
               </a>
            </div>

          </div>
        </div>

      </header>

      {/* Sticky Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-xl md:hidden px-4 py-2 flex items-center justify-between">
        <button
          onClick={handleResetHome}
          className="flex flex-col items-center justify-center py-1 px-3 min-h-[44px] min-w-[60px] text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition"
        >
          <Home className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          <span className="text-[10px] font-bold mt-0.5">Keşfet</span>
        </button>

        <button
          onClick={onOpenAddReview}
          className="flex flex-col items-center justify-center py-2 px-5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 text-white rounded-2xl shadow-lg -mt-6 border-4 border-white dark:border-slate-900 ring-2 ring-blue-100 dark:ring-blue-950 transition active:scale-95"
        >
          <Star className="w-5 h-5 fill-white text-white" />
          <span className="text-[10px] font-black mt-0.5">Puanla</span>
        </button>

        <button
          onClick={onOpenMapView}
          className="flex flex-col items-center justify-center py-1 px-3 min-h-[44px] min-w-[60px] text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition"
        >
          <Map className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          <span className="text-[10px] font-bold mt-0.5">Harita</span>
        </button>
      </nav>
    </>
  );
};


