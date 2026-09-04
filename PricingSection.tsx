import React from 'react';
import { Award } from 'lucide-react';

export const PricingSection = () => (
  <div className="max-w-5xl mx-auto px-4 py-20">
    <h2 className="text-4xl font-black text-center mb-16 text-slate-900 dark:text-white">Fiyatlandırma</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
            { type: "Küçük İşletme", fee: "20.000 TL", renewal: "5.000 TL" },
            { type: "Büyük Tesis", fee: "100.000 TL", renewal: "25.000 TL" }
        ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 text-center hover:border-blue-300 transition-colors">
                <Award className="w-12 h-12 text-blue-600 mx-auto mb-6" />
                <h3 className="text-2xl font-black mb-6 text-slate-900 dark:text-white">{item.type}</h3>
                <div className="space-y-4 mb-8">
                    <div>
                        <p className="text-slate-500">Denetim Ücreti</p>
                        <p className="text-3xl font-black text-blue-600">{item.fee}</p>
                    </div>
                    <div>
                        <p className="text-slate-500">Yıllık Yenileme</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">{item.renewal}</p>
                    </div>
                </div>
                <a href="#basvuru" className="block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-full transition-transform hover:scale-105">Başvur</a>
            </div>
        ))}
    </div>
  </div>
);
