import React, { useState } from 'react';

export const ApplicationForm = () => {
    const [type, setType] = useState('general');
    return (
        <div id="basvuru" className="max-w-2xl mx-auto px-4 py-16">
            <h2 className="text-3xl font-black text-center mb-12">Başvuru Formu</h2>
            <form className="space-y-4 p-8 border rounded-3xl bg-white">
                <input className="w-full p-3 border rounded-xl" placeholder="Tesis Adı" />
                <select className="w-full p-3 border rounded-xl" onChange={(e) => setType(e.target.value)}>
                    <option value="general">Genel Tesis</option>
                    <option value="school">Spor Okulu</option>
                </select>
                <input className="w-full p-3 border rounded-xl" placeholder="İletişim Bilgisi" />
                {type === 'school' && <input className="w-full p-3 border rounded-xl" placeholder="Federasyon Belgesi (URL)" />}
                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl">Başvuruyu Tamamla</button>
            </form>
        </div>
    );
};
