import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { X, User, Building2, Lock, Mail, ShieldCheck, Check, Sparkles, LogIn, UserPlus, ArrowRight, FileText, Loader2 } from 'lucide-react';
import { auth, db, googleProvider, appleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { LegalModal, LegalDocType } from './LegalModal';
import { notifyRegistration } from '../lib/notifications';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  isCorporate?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onLoginSuccess,
  isCorporate = false,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [title, setTitle] = useState('');

  // Legal Consent states
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<LegalDocType | null>(null);

  const [sportsFlyAuth, setSportsFlyAuth] = useState<'idle' | 'login' | 'authorizing' | 'exchanging'>('idle');

  const saveUserToFirestore = async (userProfile: UserProfile) => {
    try {
      const userRef = doc(db, 'users', userProfile.id);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, userProfile);
      } else {
        const existingData = userSnap.data() as UserProfile;
        return existingData;
      }
    } catch (e: any) {
      if (e.message?.includes('offline') || e.code === 'unavailable') {
        console.warn("Firestore offline - user save queued or deferred");
      } else {
        console.warn("Error saving user to Firestore (expected for mock auth)", e);
      }
    }
    return userProfile;
  };

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      let userProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || 'Spor Sever',
        email: user.email || '',
        role: user.email === 'selmanutkumarmara@gmail.com' ? 'admin' : 'user',
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        title: 'Doğrulanmış Sporsever',
        createdAt: new Date().toISOString().split('T')[0],
      };
      
      userProfile = await saveUserToFirestore(userProfile);
      
      onLoginSuccess(userProfile);
      onClose();
    } catch (err: any) {
      console.warn(err);
      if (err.code === 'auth/operation-not-allowed') {
        const mockUid = 'mock-google-' + Math.random().toString(36).substring(2, 11);
        let userProfile: UserProfile = {
          id: mockUid,
          name: 'Google Kullanıcısı',
          email: 'google@example.com',
          role: 'user',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          title: 'Doğrulanmış Sporsever',
          createdAt: new Date().toISOString().split('T')[0],
        };
        userProfile = await saveUserToFirestore(userProfile);
        onLoginSuccess(userProfile);
        onClose();
      } else {
        setError(err.message || 'Google girişi başarısız oldu.');
      }
    }
  };

  const handleSportsFlyLogin = () => {
    setSportsFlyAuth('login');
  };

  const handleSportsFlyLoginFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSportsFlyAuth('authorizing');
  };

  const simulateSportsFlySuccess = async () => {
    setSportsFlyAuth('exchanging');
    
    // Simulating:
    // 1. Sending authorization code to backend
    // 2. Getting access token
    // 3. Fetching user info (isim, e-posta, hesap tipi)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockUid = 'sportsfly-' + Math.random().toString(36).substring(2, 11);
    let userProfile: UserProfile = {
      id: mockUid,
      name: 'SportsFly Üyesi',
      email: 'uye@sportsfly.com',
      role: 'user', // Simulated account type (tesis sahibi / bireysel kullanıcı / veli)
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      title: 'Doğrulanmış Sporsever',
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    userProfile = await saveUserToFirestore(userProfile);
    onLoginSuccess(userProfile);
    setSportsFlyAuth('idle');
    onClose();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Lütfen e-posta adresinizi giriniz.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (err: any) {
      setError('Şifre sıfırlama bağlantısı gönderilemedi: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'register') {
      if (!termsAccepted || !kvkkAccepted) {
        setError('Devam edebilmek için Kullanım Şartları ve KVKK Aydınlatma Metnini onaylamanız gerekmektedir.');
        return;
      }
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        let role: UserRole = 'user';
        if (email === 'selmanutkumarmara@gmail.com') {
          role = 'admin';
        }

        let userProfile: UserProfile = {
          id: user.uid,
          name: email.split('@')[0] || 'Kullanıcı',
          email: email.trim(),
          role,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          title: 'Doğrulanmış Sporsever',
          createdAt: new Date().toISOString().split('T')[0],
        };

        userProfile = await saveUserToFirestore(userProfile);
        
        // Notify admin about new user registration
        await notifyRegistration('kullanıcı', userProfile.name, userProfile.email);

        onLoginSuccess(userProfile);
        onClose();
      } catch (err: any) {
        console.warn(err);
        if (err.code === 'auth/operation-not-allowed') {
          const mockUid = 'mock-user-' + Math.random().toString(36).substring(2, 11);
          let role: UserRole = 'user';
          if (email === 'selmanutkumarmara@gmail.com') {
            role = 'admin';
          }
          let userProfile: UserProfile = {
            id: mockUid,
            name: email.split('@')[0] || 'Kullanıcı',
            email: email.trim(),
            role,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
            title: 'Doğrulanmış Sporsever',
            createdAt: new Date().toISOString().split('T')[0],
          };
          userProfile = await saveUserToFirestore(userProfile);
          onLoginSuccess(userProfile);
          onClose();
        } else if (err.code === 'auth/email-already-in-use') {
          setError('Bu e-posta adresi zaten kullanımda.');
        } else if (err.code === 'auth/weak-password') {
          setError('Şifre en az 6 karakter olmalıdır.');
        } else {
          setError(err.message || 'Kayıt yapılırken bir hata oluştu.');
        }
      }
    } else {
      // Login mode
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        let role: UserRole = 'user';
        if (email === 'selmanutkumarmara@gmail.com') {
          role = 'admin';
        }

        let userProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || email.split('@')[0] || 'Kullanıcı',
          email: email.trim(),
          role,
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
          title: 'Doğrulanmış Sporsever',
          createdAt: new Date().toISOString().split('T')[0],
        };

        userProfile = await saveUserToFirestore(userProfile);

        onLoginSuccess(userProfile);
        onClose();
      } catch (err: any) {
        console.warn(err);
        if (err.code === 'auth/operation-not-allowed') {
          let role: UserRole = 'user';
          if (email === 'selmanutkumarmara@gmail.com') {
            role = 'admin';
          }
          let userProfile: UserProfile = {
            id: 'mock-user-' + Math.random().toString(36).substring(2, 11),
            name: email.split('@')[0] || 'Kullanıcı',
            email: email.trim(),
            role,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
            title: 'Doğrulanmış Sporsever',
            createdAt: new Date().toISOString().split('T')[0],
          };
          userProfile = await saveUserToFirestore(userProfile);
          onLoginSuccess(userProfile);
          onClose();
        } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError('Hatalı e-posta veya şifre.');
        } else {
          setError(err.message || 'Giriş yapılırken bir hata oluştu.');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {activeTab === 'register' ? 'Hesap Oluştur' : 'Giriş Yap'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex p-1 gap-1 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
              activeTab === 'register'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Kayıt Ol
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
              activeTab === 'login'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Giriş Yap
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-[11px] rounded-lg border border-red-100 dark:border-red-900 font-medium">
              {error}
            </div>
          )}
          
          {/* Social Logins */}
          <div className={`grid gap-2 ${isCorporate ? 'grid-cols-2' : 'grid-cols-2'}`}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-[11px] py-2 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => {}}
              className="flex items-center justify-center gap-1.5 bg-black dark:bg-white text-white dark:text-black font-bold text-[11px] py-2 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.365 14.363c0-2.483 2.023-3.655 2.115-3.712-1.155-1.69-2.955-1.926-3.6-1.954-1.536-.153-3.003.905-3.784.905-.785 0-1.996-.889-3.26-.864-1.666.024-3.197.967-4.053 2.457-1.745 3.023-.448 7.498 1.252 9.948.835 1.205 1.83 2.563 3.12 2.513 1.24-.05 1.705-.805 3.205-.805 1.496 0 1.935.805 3.23.78 1.315-.025 2.185-1.233 3.015-2.443 1.01-1.474 1.43-2.9 1.455-2.975-.025-.01-2.78-1.07-2.78-3.95v-.01zM14.654 6.72c.683-.825 1.144-1.97 1.015-3.115-1.02.042-2.228.68-2.934 1.528-.56.674-1.107 1.848-.962 2.973 1.135.088 2.21-.575 2.88-1.385z"/>
              </svg>
              <span>Apple</span>
            </button>
            {isCorporate && (
              <button
                type="button"
                onClick={handleSportsFlyLogin}
                className="col-span-2 flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-[11px] py-2 rounded-lg transition"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.8 6.2C13.8 6.2 11.5 3 8 3C4.5 3 3.2 6.5 3.2 6.5C3.2 6.5 2 10.5 5.5 13.5L13.8 6.2Z" fill="#3B82F6"/>
                  <path d="M10.2 17.8C10.2 17.8 12.5 21 16 21C19.5 21 20.8 17.5 20.8 17.5C20.8 17.5 22 13.5 18.5 10.5L10.2 17.8Z" fill="#F43F5E"/>
                  <path d="M13.8 6.2L5.5 13.5C7.2 15 9.8 14.5 11 13L15 9C15.8 8 15 6.5 13.8 6.2Z" fill="#60A5FA"/>
                  <path d="M10.2 17.8L18.5 10.5C16.8 9 14.2 9.5 13 11L9 15C8.2 16 9 17.5 10.2 17.8Z" fill="#FB923C"/>
                </svg>
                <span>SportsFly (Kurumsal)</span>
              </button>
            )}
          </div>

          <div className="relative flex items-center justify-center my-1.5">
            <div className="border-t border-slate-100 dark:border-slate-800 w-full"></div>
            <span className="bg-white dark:bg-slate-900 px-2 text-[10px] font-bold text-slate-400 uppercase">veya</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Posta"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-blue-500 outline-none"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-blue-500 outline-none"
            />
            
            {activeTab === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded" />
                  <span className="text-[10px] text-slate-600 dark:text-slate-300">Beni Hatırla</span>
                </label>
                <button type="button" onClick={handleForgotPassword} className="text-[10px] text-blue-600 font-bold hover:underline">
                  Şifremi Unuttum?
                </button>
              </div>
            )}
            
            {activeTab === 'register' && (
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-850 p-2 rounded-lg">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5" />
                  <span className="text-[10px] text-slate-600 dark:text-slate-300">Kullanım Şartları ve Gizlilik Politikasını kabul ediyorum.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={kvkkAccepted} onChange={(e) => setKvkkAccepted(e.target.checked)} className="mt-0.5" />
                  <span className="text-[10px] text-slate-600 dark:text-slate-300">KVKK Aydınlatma Metnini kabul ediyorum.</span>
                </label>
              </div>
            )}

            <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
              {activeTab === 'register' ? 'Hesap Oluştur' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
      
      {showLegalModal && (
        <LegalModal
          initialDoc={showLegalModal}
          onClose={() => setShowLegalModal(null)}
        />
      )}

      {sportsFlyAuth !== 'idle' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
             {/* Fake Browser Toolbar */}
             <div className="bg-slate-100 px-4 py-2 flex items-center gap-2 border-b border-slate-200">
                <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-red-400"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                   <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 bg-white rounded-md border border-slate-200 text-center text-[10px] py-1 text-slate-500 font-medium font-mono">
                   sportsfly.sporsepeti.com.tr/giris-yap
                </div>
             </div>
             
             {/* SportsFly Auth Content */}
             <div className="p-8 flex flex-col items-center text-center">
                {sportsFlyAuth === 'exchanging' ? (
                  <div className="py-8 flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">Sporpuan hesabınıza bağlanıyor...</p>
                    <p className="text-xs text-slate-400 mt-2">Authorization code token ile değiştiriliyor</p>
                  </div>
                ) : sportsFlyAuth === 'login' ? (
                  <div className="w-full">
                    <svg className="w-12 h-12 mb-6 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.8 6.2C13.8 6.2 11.5 3 8 3C4.5 3 3.2 6.5 3.2 6.5C3.2 6.5 2 10.5 5.5 13.5L13.8 6.2Z" fill="#3B82F6"/>
                      <path d="M10.2 17.8C10.2 17.8 12.5 21 16 21C19.5 21 20.8 17.5 20.8 17.5C20.8 17.5 22 13.5 18.5 10.5L10.2 17.8Z" fill="#F43F5E"/>
                      <path d="M13.8 6.2L5.5 13.5C7.2 15 9.8 14.5 11 13L15 9C15.8 8 15 6.5 13.8 6.2Z" fill="#60A5FA"/>
                      <path d="M10.2 17.8L18.5 10.5C16.8 9 14.2 9.5 13 11L9 15C8.2 16 9 17.5 10.2 17.8Z" fill="#FB923C"/>
                    </svg>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">SportsFly'a Giriş Yap</h3>
                    <form onSubmit={handleSportsFlyLoginFormSubmit} className="space-y-4">
                      <input 
                        type="email" 
                        required 
                        placeholder="E-posta adresiniz" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:border-blue-500 outline-none"
                      />
                      <input 
                        type="password" 
                        required 
                        placeholder="Şifreniz" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:border-blue-500 outline-none"
                      />
                      <button type="submit" className="w-full py-3 mt-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
                        Giriş Yap ve Devam Et
                      </button>
                    </form>
                    <button onClick={() => setSportsFlyAuth('idle')} className="mt-4 text-sm text-slate-500 hover:text-slate-700">İptal Et</button>
                  </div>
                ) : (
                  <>
                    <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.8 6.2C13.8 6.2 11.5 3 8 3C4.5 3 3.2 6.5 3.2 6.5C3.2 6.5 2 10.5 5.5 13.5L13.8 6.2Z" fill="#3B82F6"/>
                      <path d="M10.2 17.8C10.2 17.8 12.5 21 16 21C19.5 21 20.8 17.5 20.8 17.5C20.8 17.5 22 13.5 18.5 10.5L10.2 17.8Z" fill="#F43F5E"/>
                      <path d="M13.8 6.2L5.5 13.5C7.2 15 9.8 14.5 11 13L15 9C15.8 8 15 6.5 13.8 6.2Z" fill="#60A5FA"/>
                      <path d="M10.2 17.8L18.5 10.5C16.8 9 14.2 9.5 13 11L9 15C8.2 16 9 17.5 10.2 17.8Z" fill="#FB923C"/>
                    </svg>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">SportsFly Yetkilendirmesi</h3>
                    <p className="text-sm text-slate-600 mb-8">
                       <strong className="text-slate-900">Sporpuan</strong>, SportsFly hesap bilgilerinizi (ad, e-posta, tesis bilgisi) görüntülemek istiyor.
                    </p>
                    
                    <div className="flex gap-3 w-full">
                       <button onClick={() => setSportsFlyAuth('idle')} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition">
                          Reddet
                       </button>
                       <button onClick={simulateSportsFlySuccess} className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition">
                          İzin Ver
                       </button>
                    </div>
                  </>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
