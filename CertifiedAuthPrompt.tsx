
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CertifiedAuthPrompt: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/kurumsal#login-required', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-center p-6">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Kurumsal Üye Girişi gereklidir</h2>
        <p className="text-slate-600 dark:text-slate-400">Yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
};

export default CertifiedAuthPrompt;
