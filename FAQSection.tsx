import React from 'react';

const faqs = [
    { q: "Akreditasyon puanımı etkiler mi?", a: "Hayır, bağımsızdır." },
    { q: "Denetim habersiz mi yapılıyor?", a: "Evet, rastgele tarihlerde yapılabilir." },
    { q: "Başarısız olursam ne olur?", a: "Eksikleri tamamlayıp tekrar başvurabilirsiniz." },
    { q: "Federasyon lisansım yoksa Premium alabilir miyim?", a: "Hayır, lisans zorunludur." },
    { q: "Yenileme nasıl işliyor?", a: "Yıllık periyotlarla denetim tekrarlanır." },
];

export const FAQSection = () => (
  <div className="max-w-4xl mx-auto px-4 py-16">
    <h2 className="text-3xl font-black text-center mb-12">Sıkça Sorulan Sorular</h2>
    <div className="space-y-4">
        {faqs.map((faq, i) => (
            <div key={i} className="p-4 border rounded-2xl">
                <h4 className="font-bold">{faq.q}</h4>
                <p className="text-slate-600">{faq.a}</p>
            </div>
        ))}
    </div>
  </div>
);
