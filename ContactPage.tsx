import React from 'react';
import { Mail, Phone, Send, MessageCircle } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

export const ContactPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full min-h-[60vh]">
      <SEOHead title="İletişim - SporPuan" description="SporPuan ile iletişime geçin, sorularınızı sorun veya tesisinizi ekleyin." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-6">Bizimle İletişime Geçin</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Sorularınız, önerileriniz veya tesis kayıt işlemleri için bize ulaşın.</p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <Phone className="w-5 h-5 text-blue-600" />
              <span>0 216 850 19 07</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>destek@sporpuan.com</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Adınız Soyadınız" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
            <input type="email" placeholder="E-posta Adresiniz" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
            <textarea placeholder="Mesajınız" rows={4} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"></textarea>
            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Gönder
            </button>
          </form>
        </div>
        
        <div className="hidden md:flex justify-center items-center bg-slate-100 dark:bg-slate-800 p-12 rounded-3xl">
          <MessageCircle className="w-64 h-64 text-blue-500 opacity-20" />
        </div>
      </div>
    </div>
  );
};
