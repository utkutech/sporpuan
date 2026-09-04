import React, { useState } from 'react';
import { MessageCircle, X, Phone, Mail, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SupportButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-2xl w-64 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-slate-900 dark:text-white">Canlı Destek</h4>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-900"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4" /> 0 216 850 19 07
          </p>
          <button 
            onClick={() => {
              setIsOpen(false);
              navigate('/iletisim');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" /> İletişim Formuna Git
          </button>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
      >
        <MessageCircle className="w-7 h-7" />
      </button>
    </div>
  );
};
