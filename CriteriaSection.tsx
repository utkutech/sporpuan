import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

const criteriaData = {
    general: [
        { title: "Hijyen & Temizlik", score: 20, items: ["Düzenli temizlik", "Klima bakımı", "Dezenfeksiyon"] },
        { title: "Ekipman & Güvenlik", score: 20, items: ["Periyodik ekipman bakımı", "Acil durum çıkışları", "Yangın önlemleri"] },
        { title: "Personel & Eğitim Kalitesi", score: 20, items: ["Sertifikalı uzman eğitmenler", "Güler yüzlü hizmet anlayışı"] },
        { title: "Operasyonel Şeffaflık", score: 20, items: ["Net fiyat listesi", "İptal ve iade politikası"] },
        { title: "Kullanıcı Deneyimi Geçmişi", score: 20, items: ["Yüksek kullanıcı puanları", "Doğrulanmış yorumlar"] },
    ],
    school: [
        { title: "Hijyen & Temizlik", score: 15, items: ["Çocuklara uygun temizlik", "Hijyenik soyunma odaları"] },
        { title: "Ekipman & Güvenlik", score: 15, items: ["Yaş grubuna uygun ekipmanlar", "İlk yardım sertifikalı personel"] },
        { title: "Personel & Eğitim Kalitesi", score: 20, items: ["Uzman antrenörler", "Pedagojik formasyon eğitimi"] },
        { title: "Operasyonel Şeffaflık", score: 15, items: ["Veli bilgilendirme süreçleri", "Ders programı şeffaflığı"] },
        { title: "Kullanıcı Deneyimi Geçmişi", score: 10, items: ["Veli memnuniyet oranı"] },
        { title: "Sportif Yeterlilik & Federasyon Uyumu", score: 25, items: ["TFF/TVF/TBF Bağlantısı", "Lisanslı sporcu yetiştirme yetkisi", "Resmi lig katılımı"] },
    ]
};

export const CriteriaSection = () => {
    const [tab, setTab] = useState<'general' | 'school'>('general');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div id="kriterler" className="max-w-4xl mx-auto px-4 py-20">
            <h2 className="text-4xl font-black text-center mb-16 text-slate-900 dark:text-white">Tesis Tipine Göre Kriterler</h2>
            <div className="flex gap-2 justify-center mb-12 bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm border border-slate-200 w-fit mx-auto">
                <button 
                  onClick={() => { setTab('general'); setOpenIndex(null); }} 
                  className={`px-8 py-3 rounded-full font-bold transition-all ${tab === 'general' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Genel Tesisler</button>
                <button 
                  onClick={() => { setTab('school'); setOpenIndex(null); }} 
                  className={`px-8 py-3 rounded-full font-bold transition-all ${tab === 'school' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Spor Okulları</button>
            </div>
            <div className="space-y-4">
                {criteriaData[tab].map((crit, idx) => (
                    <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="border border-slate-200 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm"
                    >
                        <button onClick={() => setOpenIndex(openIndex === idx ? null : idx)} className="w-full p-6 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="font-black text-lg text-slate-900 dark:text-white">{crit.title}</span>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">{crit.score} Puan</span>
                                {openIndex === idx ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                            </div>
                        </button>
                        <AnimatePresence>
                        {openIndex === idx && (
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="px-6 pb-6 border-t border-slate-100"
                            >
                                <ul className="space-y-2 pt-4">
                                    {crit.items.map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
