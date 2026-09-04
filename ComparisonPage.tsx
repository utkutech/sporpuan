import React, { useMemo } from 'react';
import { SportsEvent } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { ArrowLeft, Star, MapPin, Trophy } from 'lucide-react';
import { getScoreBadgeColor } from '../lib/scoreUtils';

interface ComparisonPageProps {
  events: SportsEvent[];
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ events }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ids = searchParams.get('ids')?.split(',') || [];

  const comparedEvents = useMemo(() => {
    return events.filter(ev => ids.includes(ev.id));
  }, [events, ids]);

  if (comparedEvents.length < 2) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">Yetersiz Seçim</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Karşılaştırma yapmak için en az iki tesis seçmelisiniz.</p>
        <button 
          onClick={() => navigate('/favoriler')} 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
        >
          Favorilere Dön
        </button>
      </div>
    );
  }

  const criteriaKeys = Object.keys(comparedEvents[0].ratingBreakdown);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      <SEOHead title="Tesis Karşılaştırma" description="Seçtiğiniz spor tesislerini karşılaştırın." />
      
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => navigate('/favoriler')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
          <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Karşılaştırma</h1>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-6 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-tl-3xl">Özellik</th>
              {comparedEvents.map(ev => (
                <th key={ev.id} className="p-6 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 min-w-[200px]">
                  {ev.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="p-6 font-semibold text-slate-700 dark:text-slate-300">Puan</td>
              {comparedEvents.map(ev => (
                <td key={ev.id} className="p-6">
                  <span className={`px-3 py-1 rounded-xl text-sm font-black text-white ${getScoreBadgeColor(ev.overallScore)}`}>
                    {ev.overallScore.toFixed(1)}
                  </span>
                </td>
              ))}
            </tr>
            {criteriaKeys.map((key, idx) => (
              <tr key={key} className={`${idx % 2 === 0 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}>
                <td className="p-6 font-medium text-slate-600 dark:text-slate-400">{key}</td>
                {comparedEvents.map(ev => (
                  <td key={ev.id} className="p-6 text-slate-900 dark:text-slate-100 font-medium">
                    {ev.ratingBreakdown[key]?.toFixed(1) || '-'}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="p-6 font-semibold text-slate-700 dark:text-slate-300">Konum</td>
              {comparedEvents.map(ev => (
                <td key={ev.id} className="p-6 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {ev.city}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
